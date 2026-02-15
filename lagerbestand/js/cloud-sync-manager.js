/* ===========================
   CLOUD SYNC MANAGER
   Provides cloud synchronization options including:
   - GitHub Gists
   - Local/Custom Server Hosting
   =========================== */

class CloudSyncManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.syncErrors = [];
        
        // Track unsynced changes
        this.hasUnsyncedChanges = false;
        this.unsyncedChangeCount = 0;
        this.lastLocalChangeTime = null;
        this.unsyncedChangesList = []; // List of change descriptions
        this.maxUnsyncedChangesHistory = 50; // Maximum changes to keep in history
        
        // Generate unique tab ID for cross-tab communication
        this.tabId = 'tab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
        
        // Cross-tab sync channel
        this.cloudSyncChannel = null;
        
        // Callbacks for UI updates
        this.onRemoteSync = null;
        this.onSettingsChanged = null;
        this.onLogUpdate = null;
        
        // Load settings from localStorage
        this.settings = this.loadSettings();
        
        // Load unsynced changes state
        this.loadUnsyncedState();
        
        // Auto-sync interval (if enabled)
        this.autoSyncInterval = null;
        this.setupAutoSync();
        
        // Initialize cross-tab synchronization
        this.initCrossTabSync();
        
        // Setup beforeunload handler for unsynced changes warning
        this.setupBeforeUnloadHandler();
    }

    // ========================
    // Settings Management
    // ========================

    getDefaultSettings() {
        return {
            enabled: false,
            provider: 'none', // 'none', 'github-gist', 'local-server'
            autoSync: false,
            autoSyncIntervalMinutes: 30,
            lastSync: null,
            lastSyncStatus: null,
            
            // GitHub Gist settings
            github: {
                token: '',
                gistId: '',
                filename: 'warehouse-backup.json',
                isPublic: false
            },
            
            // Local server settings
            localServer: {
                uploadUrl: '',
                downloadUrl: '',
                authHeader: '',
                authValue: ''
            }
        };
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem('warehouse_cloud_sync_settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all properties exist
                return { ...this.getDefaultSettings(), ...parsed };
            }
        } catch (error) {
            console.error('CloudSyncManager: Error loading settings:', error);
        }
        return this.getDefaultSettings();
    }

    saveSettings() {
        try {
            // Don't save sensitive tokens in plain text - warn user
            localStorage.setItem('warehouse_cloud_sync_settings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('CloudSyncManager: Error saving settings:', error);
            return false;
        }
    }

    updateSettings(newSettings) {
        const previousProvider = this.settings.provider;
        const previousEnabled = this.settings.enabled;
        
        this.settings = { ...this.settings, ...newSettings };
        // Reset stale status/errors after settings changes so UI does not keep showing old failures
        this.settings.lastSyncStatus = null;
        this.syncErrors = [];
        this.saveSettings();
        this.setupAutoSync();
        
        // Log the settings change
        this.addSyncLogEntry('info', 'settings_changed', {
            provider: this.settings.provider,
            enabled: this.settings.enabled,
            autoSync: this.settings.autoSync,
            previousProvider,
            previousEnabled
        });
        
        // Broadcast to other tabs so they reload settings
        this.broadcastCloudSyncEvent('settings_changed', {
            provider: this.settings.provider,
            enabled: this.settings.enabled
        });
    }

    getSettings() {
        return { ...this.settings };
    }

    // ========================
    // Auto-Sync Setup
    // ========================

    setupAutoSync() {
        // Clear existing interval
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }

        // Set up new interval if enabled
        if (this.settings.enabled && this.settings.autoSync && this.settings.provider !== 'none') {
            const intervalMs = this.settings.autoSyncIntervalMinutes * 60 * 1000;
            this.autoSyncInterval = setInterval(() => {
                this.sync('upload').catch(error => {
                    console.warn('CloudSyncManager: Auto-sync failed:', error);
                });
            }, intervalMs);
            console.log(`CloudSyncManager: Auto-sync enabled every ${this.settings.autoSyncIntervalMinutes} minutes`);
        }
    }

    // ========================
    // Sync Operations
    // ========================

    async sync(direction = 'upload') {
        if (this.syncInProgress) {
            throw new Error('Sync already in progress');
        }

        if (!this.settings.enabled || this.settings.provider === 'none') {
            throw new Error('Cloud sync is not configured');
        }

        this.syncInProgress = true;
        this.syncErrors = [];

        try {
            let result;

            switch (this.settings.provider) {
                case 'github-gist':
                    result = direction === 'upload' 
                        ? await this.uploadToGist() 
                        : await this.downloadFromGist();
                    break;

                case 'local-server':
                    result = direction === 'upload' 
                        ? await this.uploadToLocalServer() 
                        : await this.downloadFromLocalServer();
                    break;

                default:
                    throw new Error('Unknown sync provider: ' + this.settings.provider);
            }

            this.settings.lastSync = new Date().toISOString();
            this.settings.lastSyncStatus = 'success';
            this.saveSettings();

            // Clear unsynced changes after successful upload
            if (direction === 'upload') {
                this.clearUnsyncedChanges();
            }

            return result;

        } catch (error) {
            this.settings.lastSyncStatus = 'error';
            this.syncErrors.push({
                timestamp: new Date().toISOString(),
                error: error.message
            });
            this.saveSettings();
            throw error;

        } finally {
            this.syncInProgress = false;
        }
    }

    // ========================
    // GitHub Gist Operations
    // ========================

    async uploadToGist() {
        const { token, gistId, filename, isPublic } = this.settings.github;

        if (!token) {
            throw new Error('GitHub token is required');
        }

        // Prepare backup data
        const backupData = this.dataManager.exportAllData();
        const content = JSON.stringify(backupData, null, 2);

        const files = {
            [filename]: { content }
        };

        let response;

        if (gistId) {
            // Update existing gist
            response = await this.fetchWithRetry(
                `https://api.github.com/gists/${gistId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    },
                    body: JSON.stringify({
                        description: `Warehouse Backup - ${new Date().toISOString()}`,
                        files
                    })
                }
            );
        } else {
            // Create new gist
            response = await this.fetchWithRetry(
                'https://api.github.com/gists',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    },
                    body: JSON.stringify({
                        description: `Warehouse Backup - ${new Date().toISOString()}`,
                        public: isPublic,
                        files
                    })
                }
            );

            // Save the new gist ID
            if (response.id) {
                this.settings.github.gistId = response.id;
                this.saveSettings();
            }
        }

        return {
            success: true,
            provider: 'github-gist',
            gistId: response.id,
            gistUrl: response.html_url,
            timestamp: new Date().toISOString()
        };
    }

    async downloadFromGist() {
        const { token, gistId, filename } = this.settings.github;

        if (!token) {
            throw new Error('GitHub token is required');
        }

        if (!gistId) {
            throw new Error('Gist ID is required for download');
        }

        const response = await this.fetchWithRetry(
            `https://api.github.com/gists/${gistId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );

        if (!response.files || !response.files[filename]) {
            throw new Error(`File "${filename}" not found in gist`);
        }

        const file = response.files[filename];
        let content;

        // GitHub API truncates content over ~1MB - fetch raw URL instead
        if (file.truncated) {
            console.log('CloudSync: Gist content truncated, fetching raw URL...');
            const rawResponse = await fetch(file.raw_url);
            
            if (!rawResponse.ok) {
                throw new Error(`Failed to fetch raw gist content: ${rawResponse.status}`);
            }
            
            content = await rawResponse.text();
        } else {
            content = file.content;
        }

        let backupData;
        try {
            backupData = JSON.parse(content);
        } catch (parseError) {
            console.error('CloudSync: JSON parse error. Content length:', content?.length, 'First 100 chars:', content?.substring(0, 100));
            throw new Error(`Failed to parse cloud data: ${parseError.message}. Data may be corrupted or too large.`);
        }

        // Validate and import
        const validation = this.dataManager.validateBackup(backupData);
        if (!validation.valid) {
            throw new Error('Invalid backup format: ' + validation.error);
        }

        const importResult = await this.dataManager.importAllData(backupData);
        if (!importResult.success) {
            throw new Error('Import failed: ' + importResult.error);
        }

        return {
            success: true,
            provider: 'github-gist',
            imported: importResult.imported,
            timestamp: new Date().toISOString()
        };
    }

    // ========================
    // Local Server Operations
    // ========================

    async uploadToLocalServer() {
        const { uploadUrl, authHeader, authValue } = this.settings.localServer;

        if (!uploadUrl) {
            throw new Error('Upload URL is required');
        }

        const backupData = this.dataManager.exportAllData();
        
        const headers = {
            'Content-Type': 'application/json'
        };

        if (authHeader && authValue) {
            headers[authHeader] = authValue;
        }

        const response = await this.fetchWithRetry(
            uploadUrl,
            {
                method: 'POST',
                headers,
                body: JSON.stringify(backupData)
            }
        );

        return {
            success: true,
            provider: 'local-server',
            response,
            timestamp: new Date().toISOString()
        };
    }

    async downloadFromLocalServer() {
        const { downloadUrl, authHeader, authValue } = this.settings.localServer;

        if (!downloadUrl) {
            throw new Error('Download URL is required');
        }

        const headers = {
            'Accept': 'application/json'
        };

        if (authHeader && authValue) {
            headers[authHeader] = authValue;
        }

        const response = await this.fetchWithRetry(
            downloadUrl,
            {
                method: 'GET',
                headers
            }
        );

        // Validate and import
        const validation = this.dataManager.validateBackup(response);
        if (!validation.valid) {
            throw new Error('Invalid backup format: ' + validation.error);
        }

        const importResult = await this.dataManager.importAllData(response);
        if (!importResult.success) {
            throw new Error('Import failed: ' + importResult.error);
        }

        return {
            success: true,
            provider: 'local-server',
            imported: importResult.imported,
            timestamp: new Date().toISOString()
        };
    }

    // ========================
    // Utility Methods
    // ========================

    async fetchWithRetry(url, options, maxRetries = 3, delayMs = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage;

                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorText;
                    } catch {
                        errorMessage = errorText || `HTTP ${response.status}`;
                    }

                    // Don't retry on authentication errors
                    if (response.status === 401 || response.status === 403) {
                        throw new Error(`Authentication failed: ${errorMessage}`);
                    }

                    // Don't retry on client errors (except rate limiting)
                    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        throw new Error(`Request failed: ${errorMessage}`);
                    }

                    throw new Error(`Server error (${response.status}): ${errorMessage}`);
                }

                // Handle empty responses (204 No Content, etc.)
                if (response.status === 204 || response.headers.get('content-length') === '0') {
                    return null;
                }

                // Check Content-Type to determine how to parse the response
                const contentType = response.headers.get('content-type') || '';
                
                if (contentType.includes('application/json')) {
                    const text = await response.text();
                    // Handle empty body even with JSON content-type
                    if (!text || text.trim() === '') {
                        return null;
                    }
                    return JSON.parse(text);
                }
                
                // For non-JSON responses, return the raw text or null if empty
                const text = await response.text();
                if (!text || text.trim() === '') {
                    return null;
                }
                
                // Try to parse as JSON anyway (some servers don't set proper content-type)
                try {
                    return JSON.parse(text);
                } catch {
                    // Return raw text wrapped in an object for consistency
                    return { rawResponse: text, contentType };
                }

            } catch (error) {
                lastError = error;
                console.warn(`CloudSyncManager: Attempt ${attempt}/${maxRetries} failed:`, error.message);

                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = delayMs * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    // Test connection to the configured provider
    async testConnection() {
        if (!this.settings.enabled || this.settings.provider === 'none') {
            throw new Error('Cloud sync is not configured');
        }

        switch (this.settings.provider) {
            case 'github-gist':
                return await this.testGitHubConnection();

            case 'local-server':
                return await this.testLocalServerConnection();

            default:
                throw new Error('Unknown provider');
        }
    }

    async testGitHubConnection() {
        const { token } = this.settings.github;

        if (!token) {
            throw new Error('GitHub token is required');
        }

        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            throw new Error('Invalid GitHub token');
        }

        const user = await response.json();
        return {
            success: true,
            provider: 'github-gist',
            user: user.login,
            message: `Connected as ${user.login}`
        };
    }

    async testLocalServerConnection() {
        const { uploadUrl, downloadUrl, authHeader, authValue } = this.settings.localServer;

        if (!uploadUrl && !downloadUrl) {
            throw new Error('At least one URL is required');
        }

        const headers = {};
        if (authHeader && authValue) {
            headers[authHeader] = authValue;
        }

        // Try to reach the server with a HEAD or OPTIONS request
        const testUrl = downloadUrl || uploadUrl;
        
        try {
            const response = await fetch(testUrl, {
                method: 'HEAD',
                headers
            });

            // Any response (even 404) means server is reachable
            return {
                success: true,
                provider: 'local-server',
                status: response.status,
                message: 'Server is reachable'
            };
        } catch (error) {
            // Try OPTIONS as fallback (for CORS)
            try {
                await fetch(testUrl, {
                    method: 'OPTIONS',
                    headers
                });
                return {
                    success: true,
                    provider: 'local-server',
                    message: 'Server is reachable (CORS preflight)'
                };
            } catch {
                throw new Error('Cannot reach server: ' + error.message);
            }
        }
    }

    // Get sync status for UI display
    getSyncStatus() {
        return {
            enabled: this.settings.enabled,
            provider: this.settings.provider,
            autoSync: this.settings.autoSync,
            autoSyncInterval: this.settings.autoSyncIntervalMinutes,
            lastSync: this.settings.lastSync,
            lastSyncStatus: this.settings.lastSyncStatus,
            syncInProgress: this.syncInProgress,
            errors: this.syncErrors.slice(-5), // Last 5 errors
            hasUnsyncedChanges: this.hasUnsyncedChanges,
            unsyncedChangeCount: this.unsyncedChangeCount,
            unsyncedChangesList: this.unsyncedChangesList
        };
    }

    // ========================
    // Unsynced Changes Tracking
    // ========================

    // Load unsynced state from localStorage
    loadUnsyncedState() {
        try {
            const stored = localStorage.getItem('warehouse_unsynced_state');
            if (stored) {
                const state = JSON.parse(stored);
                this.hasUnsyncedChanges = state.hasUnsyncedChanges || false;
                this.unsyncedChangeCount = state.unsyncedChangeCount || 0;
                this.lastLocalChangeTime = state.lastLocalChangeTime || null;
                this.unsyncedChangesList = state.unsyncedChangesList || [];
            }
        } catch (error) {
            console.error('CloudSyncManager: Error loading unsynced state:', error);
        }
    }

    // Save unsynced state to localStorage
    saveUnsyncedState() {
        try {
            localStorage.setItem('warehouse_unsynced_state', JSON.stringify({
                hasUnsyncedChanges: this.hasUnsyncedChanges,
                unsyncedChangeCount: this.unsyncedChangeCount,
                lastLocalChangeTime: this.lastLocalChangeTime,
                unsyncedChangesList: this.unsyncedChangesList
            }));
        } catch (error) {
            console.error('CloudSyncManager: Error saving unsynced state:', error);
        }
    }

    // Mark that a local change was made (call this from DataManager after saves)
    markLocalChange(changeType = 'unknown', details = {}) {
        // Only track if cloud sync is enabled
        if (!this.settings.enabled || this.settings.provider === 'none') {
            return;
        }

        this.hasUnsyncedChanges = true;
        this.unsyncedChangeCount++;
        this.lastLocalChangeTime = new Date().toISOString();
        
        // Add to changes list with details
        const changeEntry = {
            id: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
            type: changeType,
            timestamp: this.lastLocalChangeTime,
            details: details
        };
        
        this.unsyncedChangesList.unshift(changeEntry);
        
        // Limit the list size
        if (this.unsyncedChangesList.length > this.maxUnsyncedChangesHistory) {
            this.unsyncedChangesList = this.unsyncedChangesList.slice(0, this.maxUnsyncedChangesHistory);
        }
        
        this.saveUnsyncedState();

        console.log(`CloudSyncManager: Local change tracked (${changeType}), total unsynced: ${this.unsyncedChangeCount}`);
    }

    // Clear unsynced changes (call after successful upload)
    clearUnsyncedChanges() {
        this.hasUnsyncedChanges = false;
        this.unsyncedChangeCount = 0;
        this.lastLocalChangeTime = null;
        this.unsyncedChangesList = [];
        this.saveUnsyncedState();
        console.log('CloudSyncManager: Unsynced changes cleared');
    }
    
    // Dismiss/remove specific unsynced change from the list
    dismissUnsyncedChange(changeId) {
        this.unsyncedChangesList = this.unsyncedChangesList.filter(c => c.id !== changeId);
        this.unsyncedChangeCount = this.unsyncedChangesList.length;
        this.hasUnsyncedChanges = this.unsyncedChangeCount > 0;
        if (!this.hasUnsyncedChanges) {
            this.lastLocalChangeTime = null;
        }
        this.saveUnsyncedState();
        console.log(`CloudSyncManager: Change ${changeId} dismissed, remaining: ${this.unsyncedChangeCount}`);
    }
    
    // Dismiss all unsynced changes without syncing
    dismissAllUnsyncedChanges() {
        this.clearUnsyncedChanges();
        console.log('CloudSyncManager: All unsynced changes dismissed');
    }

    // Check if there are unsynced changes
    checkUnsyncedChanges() {
        return {
            hasChanges: this.hasUnsyncedChanges,
            changeCount: this.unsyncedChangeCount,
            lastChangeTime: this.lastLocalChangeTime
        };
    }

    // Setup beforeunload handler to warn about unsynced changes
    setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', (e) => {
            // Skip warning when GitHub Projects is the primary backend (saves are immediate)
            if (this.dataManager && this.dataManager.storageBackend === 'github') {
                return;
            }
            
            // Only show warning if cloud sync is enabled and there are unsynced changes
            if (this.settings.enabled && 
                this.settings.provider !== 'none' && 
                this.hasUnsyncedChanges && 
                this.unsyncedChangeCount > 0) {
                
                // Standard way to trigger the browser's leave confirmation
                e.preventDefault();
                // Chrome requires returnValue to be set
                e.returnValue = '';
            }
        });
    }

    // Get a user-friendly message about unsynced changes
    getUnsyncedChangesMessage() {
        if (!this.hasUnsyncedChanges || this.unsyncedChangeCount === 0) {
            return null;
        }

        return {
            count: this.unsyncedChangeCount,
            lastChange: this.lastLocalChangeTime,
            provider: this.settings.provider
        };
    }

    // Clear all cloud sync settings (for privacy)
    clearSettings() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }
        this.settings = this.getDefaultSettings();
        this.saveSettings();
        this.syncErrors = [];
    }

    // Get provider display name
    getProviderDisplayName(provider) {
        const names = {
            'none': 'None',
            'github-gist': 'GitHub Gist',
            'local-server': 'Local/Custom Server'
        };
        return names[provider] || provider;
    }

    // ========================
    // Cross-Tab Synchronization
    // ========================

    initCrossTabSync() {
        try {
            if ('BroadcastChannel' in window) {
                this.cloudSyncChannel = new BroadcastChannel('warehouse_cloud_sync');
                console.log('CloudSyncManager: BroadcastChannel initialized for cross-tab sync');
                
                // Listen for sync messages from other tabs
                this.cloudSyncChannel.onmessage = (event) => {
                    this.handleCrossTabMessage(event.data);
                };
            } else {
                console.warn('CloudSyncManager: BroadcastChannel not supported');
            }
        } catch (error) {
            console.warn('CloudSyncManager: Failed to initialize BroadcastChannel:', error);
        }
    }

    // Broadcast cloud sync event to other tabs
    broadcastCloudSyncEvent(type, data = null) {
        if (this.cloudSyncChannel) {
            try {
                this.cloudSyncChannel.postMessage({
                    type: type,
                    timestamp: Date.now(),
                    tabId: this.tabId,
                    data: data
                });
            } catch (error) {
                console.warn('CloudSyncManager: Failed to broadcast:', error);
            }
        }
    }

    // Handle incoming cross-tab messages
    handleCrossTabMessage(message) {
        // Ignore messages from our own tab
        if (message.tabId === this.tabId) return;

        console.log('CloudSyncManager: Received cross-tab message:', message.type);

        switch (message.type) {
            case 'cloud_sync_completed':
                // Another tab completed a cloud sync - refresh our data
                this.onRemoteSyncCompleted(message.data);
                break;

            case 'cloud_sync_started':
                // Another tab started syncing - show indicator
                this.onRemoteSyncStarted(message.data);
                break;

            case 'settings_changed':
                // Another tab changed settings - reload
                this.settings = this.loadSettings();
                this.setupAutoSync();
                if (this.onSettingsChanged) {
                    this.onSettingsChanged();
                }
                break;
        }
    }

    // Called when another tab completes a sync
    async onRemoteSyncCompleted(data) {
        this.addSyncLogEntry('info', 'cloud_sync_from_tab', data);
        
        // Trigger callback if registered
        if (this.onRemoteSync) {
            await this.onRemoteSync(data);
        }
    }

    // Called when another tab starts syncing
    onRemoteSyncStarted(data) {
        this.addSyncLogEntry('info', 'sync_started_other_tab', data);
    }

    // Register callback for remote sync events
    setOnRemoteSync(callback) {
        this.onRemoteSync = callback;
    }

    // Register callback for settings changes
    setOnSettingsChanged(callback) {
        this.onSettingsChanged = callback;
    }

    // ========================
    // Sync Logging
    // ========================

    getSyncLog() {
        try {
            const stored = localStorage.getItem('warehouse_sync_log');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    addSyncLogEntry(level, type, data = null) {
        try {
            const log = this.getSyncLog();
            const entry = {
                id: Date.now() + '-' + Math.random().toString(36).substring(2, 11),
                timestamp: new Date().toISOString(),
                level: level, // 'info', 'success', 'warning', 'error'
                type: type,
                data: data,
                tabId: this.tabId
            };
            
            log.unshift(entry); // Add to beginning
            
            // Keep only last 100 entries
            const trimmedLog = log.slice(0, 100);
            localStorage.setItem('warehouse_sync_log', JSON.stringify(trimmedLog));
            
            // Notify UI to update
            if (this.onLogUpdate) {
                this.onLogUpdate(entry);
            }
            
            return entry;
        } catch (error) {
            console.error('CloudSyncManager: Error adding log entry:', error);
        }
    }

    clearSyncLog() {
        localStorage.removeItem('warehouse_sync_log');
        if (this.onLogUpdate) {
            this.onLogUpdate(null);
        }
    }

    setOnLogUpdate(callback) {
        this.onLogUpdate = callback;
    }

    // ========================
    // Enhanced Sync with Logging & Broadcasting
    // ========================

    async syncWithLogging(direction = 'upload') {
        const startTime = Date.now();
        
        // Broadcast sync started
        this.broadcastCloudSyncEvent('cloud_sync_started', {
            direction,
            provider: this.settings.provider
        });

        this.addSyncLogEntry('info', direction === 'upload' ? 'upload_started' : 'download_started', {
            provider: this.settings.provider
        });

        try {
            const result = await this.sync(direction);
            
            const duration = Date.now() - startTime;
            
            // Log success
            this.addSyncLogEntry('success', direction === 'upload' ? 'upload_success' : 'download_success', {
                provider: this.settings.provider,
                duration: duration,
                ...result
            });

            // Broadcast completion to other tabs
            this.broadcastCloudSyncEvent('cloud_sync_completed', {
                direction,
                provider: this.settings.provider,
                timestamp: new Date().toISOString()
            });

            return result;

        } catch (error) {
            // Log error
            this.addSyncLogEntry('error', direction === 'upload' ? 'upload_error' : 'download_error', {
                provider: this.settings.provider,
                error: error.message
            });

            throw error;
        }
    }

    // ========================
    // Cross-Device Conflict Resolution
    // ========================

    async checkForConflicts() {
        // Get local last modified timestamp
        const localTimestamp = this.dataManager.getLastModifiedTimestamp?.() || 0;
        
        // Get remote timestamp if available
        const remoteTimestamp = this.settings.lastSync 
            ? new Date(this.settings.lastSync).getTime() 
            : 0;

        return {
            hasLocalChanges: localTimestamp > remoteTimestamp,
            localTimestamp,
            remoteTimestamp,
            recommendation: localTimestamp > remoteTimestamp ? 'upload' : 'download'
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.CloudSyncManager = CloudSyncManager;
}
