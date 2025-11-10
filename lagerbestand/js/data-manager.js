/* ===========================
   DATA MANAGEMENT
   =========================== */

class DataManager {
    constructor() {
        // Initialize Dexie database manager (primary storage)
        this.dbManager = new DexieDBManager();
        
        // Initialize action history for undo/redo
        this.actionHistory = [];
        this.currentHistoryIndex = -1;
        this.maxHistorySize = 50;
        
        // Load data from Dexie (with localStorage fallback)
        this.materials = {};
        this.archive = [];
        this.groups = {};
        this.notes = {};
        this.alertRules = null;
        this.storageTypeSettings = null;
        
        // Async initialization
        this.initializeData();
    }
    
    // Asynchronously load data from Dexie
    async initializeData() {
        try {
            // Wait for Dexie to be ready (with timeout)
            const maxWaitTime = 2000; // 2 seconds
            const startTime = Date.now();
            
            while (!this.dbManager.checkAvailability() && (Date.now() - startTime) < maxWaitTime) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (this.dbManager.checkAvailability()) {
                // Load from Dexie
                this.materials = await this.dbManager.loadMaterials().catch(() => ({}));
                this.archive = await this.dbManager.loadArchive().catch(() => []);
                this.groups = await this.dbManager.loadGroups().catch(() => ({}));
                this.notes = await this.dbManager.loadNotes().catch(() => ({}));
                this.alertRules = await this.dbManager.loadAlertRules().catch(() => null);
                this.storageTypeSettings = await this.dbManager.loadStorageTypeSettings().catch(() => null);
                
                // Fallback to defaults if null
                if (!this.alertRules) this.alertRules = this.getDefaultAlertRules();
                if (!this.storageTypeSettings) this.storageTypeSettings = this.getDefaultStorageTypeSettings();
                
                console.log('DataManager: Loaded data from Dexie successfully');
                
                // Set up cross-tab sync listener
                this.setupCrossTabSync();
            } else {
                // Fallback to localStorage
                console.warn('DataManager: Dexie not available, using localStorage fallback');
                this.materials = this.loadMaterialsFromLocalStorage();
                this.archive = this.loadArchiveFromLocalStorage();
                this.groups = this.loadGroupsFromLocalStorage();
                this.notes = this.loadNotesFromLocalStorage();
                this.alertRules = this.loadAlertRulesFromLocalStorage();
                this.storageTypeSettings = this.loadStorageTypeSettingsFromLocalStorage();
            }
        } catch (error) {
            console.error('DataManager: Error during initialization:', error);
            // Ultimate fallback to localStorage
            this.materials = this.loadMaterialsFromLocalStorage();
            this.archive = this.loadArchiveFromLocalStorage();
            this.groups = this.loadGroupsFromLocalStorage();
            this.notes = this.loadNotesFromLocalStorage();
            this.alertRules = this.loadAlertRulesFromLocalStorage();
            this.storageTypeSettings = this.loadStorageTypeSettingsFromLocalStorage();
        }
    }
    
    // Set up cross-tab synchronization
    setupCrossTabSync() {
        if (!this.dbManager || !this.dbManager.syncChannel) {
            return;
        }
        
        this.dbManager.onSyncMessage(async (message) => {
            console.log('DataManager: Received sync message from another tab:', message.type);
            
            try {
                switch (message.type) {
                    case 'materials_updated':
                    case 'material_saved':
                    case 'material_deleted':
                        // Reload materials from Dexie
                        this.materials = await this.dbManager.loadMaterials();
                        // Re-render materials tab if it's active and UI is available
                        if (typeof ui !== 'undefined' && ui.renderMaterialsList) {
                            ui.renderMaterialsList();
                        }
                        break;
                        
                    case 'archive_updated':
                        // Reload archive from Dexie
                        this.archive = await this.dbManager.loadArchive();
                        // Re-render archive tab if it's active and UI is available
                        if (typeof ui !== 'undefined' && ui.renderArchiveList) {
                            ui.renderArchiveList();
                        }
                        break;
                        
                    case 'groups_updated':
                        // Reload groups from Dexie
                        this.groups = await this.dbManager.loadGroups();
                        // Re-render materials list to show updated groups
                        if (typeof ui !== 'undefined' && ui.renderMaterialsList) {
                            ui.renderMaterialsList();
                        }
                        break;
                        
                    case 'notes_updated':
                        // Reload notes from Dexie
                        this.notes = await this.dbManager.loadNotes();
                        // Re-render notes list if available
                        if (typeof ui !== 'undefined' && ui.renderNotesList) {
                            ui.renderNotesList();
                        }
                        break;
                }
                
                // Show toast notification
                if (typeof ui !== 'undefined' && ui.showToast) {
                    ui.showToast('📡 Data updated from another tab', 'info');
                }
            } catch (error) {
                console.error('DataManager: Error handling sync message:', error);
            }
        });
        
        console.log('DataManager: Cross-tab sync enabled');
    }

    // Local Storage keys
    get STORAGE_KEYS() {
        return {
            MATERIALS: 'warehouse_materials',
            ARCHIVE: 'warehouse_archive',
            GROUPS: 'warehouse_groups',
            NOTES: 'warehouse_notes',
            ALERT_RULES: 'warehouse_alert_rules',
            STORAGE_TYPES: 'warehouse_storage_types'
        };
    }

    // =================== LOCALSTORAGE FALLBACK METHODS ===================

    // Load materials from localStorage (fallback)
    loadMaterialsFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.MATERIALS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error loading materials from localStorage:', e);
            return {};
        }
    }

    // Load archive from localStorage (fallback)
    loadArchiveFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.ARCHIVE);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading archive from localStorage:', e);
            return [];
        }
    }

    // Load groups from localStorage (fallback)
    loadGroupsFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.GROUPS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error loading groups from localStorage:', e);
            return {};
        }
    }

    // Load notes from localStorage (fallback)
    loadNotesFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.NOTES);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error loading notes from localStorage:', e);
            return {};
        }
    }

    // Load alert rules from localStorage (fallback)
    loadAlertRulesFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.ALERT_RULES);
            return data ? JSON.parse(data) : this.getDefaultAlertRules();
        } catch (e) {
            console.error('Error loading alert rules from localStorage:', e);
            return this.getDefaultAlertRules();
        }
    }

    // Load storage type settings from localStorage (fallback)
    loadStorageTypeSettingsFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.STORAGE_TYPES);
            return data ? JSON.parse(data) : this.getDefaultStorageTypeSettings();
        } catch (e) {
            console.error('Error loading storage types from localStorage:', e);
            return this.getDefaultStorageTypeSettings();
        }
    }

    // =================== SAVE METHODS (Dexie primary, localStorage backup) ===================

    // Save materials to Dexie (and localStorage as backup)
    async saveMaterials() {
        try {
            // Primary: Save to Dexie
            if (this.dbManager.checkAvailability()) {
                await this.dbManager.saveMaterials(this.materials);
            }
            
            // Backup: Save to localStorage
            localStorage.setItem(this.STORAGE_KEYS.MATERIALS, JSON.stringify(this.materials));
            
            return true;
        } catch (e) {
            console.error('Error saving materials:', e);
            
            // Fallback to localStorage only
            try {
                localStorage.setItem(this.STORAGE_KEYS.MATERIALS, JSON.stringify(this.materials));
                return true;
            } catch (localError) {
                console.error('Error saving to localStorage:', localError);
                // UI Manager will show toast notification for errors
                return false;
            }
        }
    }

    // Save archive to Dexie (and localStorage as backup)
    async saveArchive() {
        try {
            // Auto-cleanup before saving to prevent quota issues
            await this.cleanupArchiveIfNeeded();
            
            // Primary: Save to Dexie
            if (this.dbManager.checkAvailability()) {
                await this.dbManager.saveArchive(this.archive);
            }
            
            // Backup: Save to localStorage (without raw data to save space)
            const lightweightArchive = this.archive.map(entry => ({
                id: entry.id,
                timestamp: entry.timestamp,
                fileName: entry.fileName,
                summary: entry.summary
            }));
            localStorage.setItem(this.STORAGE_KEYS.ARCHIVE, JSON.stringify(lightweightArchive));
            
            return true;
        } catch (e) {
            console.error('Error saving archive:', e);
            
            // If quota exceeded, try aggressive cleanup
            if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
                console.warn('Storage quota exceeded, performing aggressive cleanup...');
                await this.aggressiveArchiveCleanup();
                
                // Retry save after cleanup
                try {
                    if (this.dbManager.checkAvailability()) {
                        await this.dbManager.saveArchive(this.archive);
                    }
                    
                    const lightweightArchive = this.archive.map(entry => ({
                        id: entry.id,
                        timestamp: entry.timestamp,
                        fileName: entry.fileName,
                        summary: entry.summary
                    }));
                    localStorage.setItem(this.STORAGE_KEYS.ARCHIVE, JSON.stringify(lightweightArchive));
                    
                    if (typeof ui !== 'undefined' && ui.showToast) {
                        ui.showToast('Archive cleaned up to save space. Older reports removed.', 'warning');
                    }
                    
                    return true;
                } catch (retryError) {
                    console.error('Archive save failed even after cleanup:', retryError);
                    
                    // Last resort: show user-friendly error
                    if (typeof ui !== 'undefined' && ui.showToast) {
                        ui.showToast('Storage full. Please clear old archive entries.', 'error');
                    }
                    return false;
                }
            }
            
            // Fallback to localStorage only (lightweight version)
            try {
                const lightweightArchive = this.archive.map(entry => ({
                    id: entry.id,
                    timestamp: entry.timestamp,
                    fileName: entry.fileName,
                    summary: entry.summary
                }));
                localStorage.setItem(this.STORAGE_KEYS.ARCHIVE, JSON.stringify(lightweightArchive));
                return true;
            } catch (localError) {
                console.error('localStorage save also failed:', localError);
                if (typeof ui !== 'undefined' && ui.showToast) {
                    ui.showToast('Error saving archive. Storage might be full.', 'error');
                }
                return false;
            }
        }
    }

    // Auto-cleanup archive if getting too large
    async cleanupArchiveIfNeeded() {
        const MAX_ARCHIVE_ENTRIES = 50;
        const MAX_ARCHIVE_AGE_DAYS = 30;
        
        // Check entry count
        if (this.archive.length > MAX_ARCHIVE_ENTRIES) {
            console.log(`Archive has ${this.archive.length} entries, keeping only last ${MAX_ARCHIVE_ENTRIES}`);
            this.archive = this.archive.slice(0, MAX_ARCHIVE_ENTRIES);
        }
        
        // Check entry age
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - MAX_ARCHIVE_AGE_DAYS);
        
        const originalLength = this.archive.length;
        this.archive = this.archive.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate > cutoffDate;
        });
        
        if (this.archive.length < originalLength) {
            console.log(`Removed ${originalLength - this.archive.length} old archive entries (older than ${MAX_ARCHIVE_AGE_DAYS} days)`);
        }
        
        // Estimate size and reduce if needed
        const estimatedSize = this.estimateArchiveSize();
        const MAX_SIZE_MB = 30; // Conservative limit for IndexedDB
        
        if (estimatedSize > MAX_SIZE_MB) {
            console.warn(`Archive size estimated at ${estimatedSize.toFixed(2)}MB, reducing...`);
            // Keep fewer entries if size is too large
            const targetEntries = Math.floor(this.archive.length * 0.6); // Keep 60%
            this.archive = this.archive.slice(0, Math.max(10, targetEntries)); // Keep at least 10
            console.log(`Reduced archive to ${this.archive.length} entries`);
        }
    }

    // Aggressive cleanup when quota is exceeded
    async aggressiveArchiveCleanup() {
        console.warn('Performing aggressive archive cleanup...');
        
        // Keep only last 20 entries
        this.archive = this.archive.slice(0, 20);
        
        // Remove raw data from older entries (keep only recent 5 with full data)
        for (let i = 5; i < this.archive.length; i++) {
            if (this.archive[i].rawData) {
                // Keep only summary, remove raw data and detailed results
                this.archive[i] = {
                    id: this.archive[i].id,
                    timestamp: this.archive[i].timestamp,
                    fileName: this.archive[i].fileName || 'Unknown',
                    summary: this.archive[i].summary,
                    dataRemoved: true // Flag to indicate raw data was removed
                };
            }
        }
        
        console.log('Archive reduced to 20 entries with raw data removed from older entries');
    }

    // Estimate archive size in MB
    estimateArchiveSize() {
        try {
            const jsonString = JSON.stringify(this.archive);
            const sizeInBytes = new Blob([jsonString]).size;
            const sizeInMB = sizeInBytes / (1024 * 1024);
            return sizeInMB;
        } catch (e) {
            console.error('Error estimating archive size:', e);
            return 0;
        }
    }

    // Save groups to Dexie (and localStorage as backup)
    async saveGroups() {
        try {
            // Primary: Save to Dexie
            if (this.dbManager.checkAvailability()) {
                await this.dbManager.saveGroups(this.groups);
            }
            
            // Backup: Save to localStorage
            localStorage.setItem(this.STORAGE_KEYS.GROUPS, JSON.stringify(this.groups));
            
            return true;
        } catch (e) {
            console.error('Error saving groups:', e);
            
            // Fallback to localStorage only
            try {
                localStorage.setItem(this.STORAGE_KEYS.GROUPS, JSON.stringify(this.groups));
                return true;
            } catch (localError) {
                return false;
            }
        }
    }

    // Save notes to Dexie (and localStorage as backup)
    async saveNotes() {
        try {
            // Primary: Save to Dexie
            if (this.dbManager.checkAvailability()) {
                await this.dbManager.saveNotes(this.notes);
            }
            
            // Backup: Save to localStorage
            localStorage.setItem(this.STORAGE_KEYS.NOTES, JSON.stringify(this.notes));
            
            return true;
        } catch (e) {
            console.error('Error saving notes:', e);
            
            // Fallback to localStorage only
            try {
                localStorage.setItem(this.STORAGE_KEYS.NOTES, JSON.stringify(this.notes));
                return true;
            } catch (localError) {
                return false;
            }
        }
    }

    // Save alert rules to Dexie (and localStorage as backup)
    async saveAlertRules() {
        try {
            // Primary: Save to Dexie
            if (this.dbManager.checkAvailability()) {
                await this.dbManager.saveAlertRules(this.alertRules);
            }
            
            // Backup: Save to localStorage
            localStorage.setItem(this.STORAGE_KEYS.ALERT_RULES, JSON.stringify(this.alertRules));
            
            return true;
        } catch (e) {
            console.error('Error saving alert rules:', e);
            
            // Fallback to localStorage only
            try {
                localStorage.setItem(this.STORAGE_KEYS.ALERT_RULES, JSON.stringify(this.alertRules));
                return true;
            } catch (localError) {
                return false;
            }
        }
    }

    // Save storage type settings to Dexie (and localStorage as backup)
    async saveStorageTypeSettings() {
        try {
            this.storageTypeSettings.lastUpdated = new Date().toISOString();
            
            // Primary: Save to Dexie
            if (this.dbManager.checkAvailability()) {
                await this.dbManager.saveStorageTypeSettings(this.storageTypeSettings);
            }
            
            // Backup: Save to localStorage
            localStorage.setItem(this.STORAGE_KEYS.STORAGE_TYPES, JSON.stringify(this.storageTypeSettings));
            
            return true;
        } catch (e) {
            console.error('Error saving storage type settings:', e);
            
            // Fallback to localStorage only
            try {
                localStorage.setItem(this.STORAGE_KEYS.STORAGE_TYPES, JSON.stringify(this.storageTypeSettings));
                return true;
            } catch (localError) {
                return false;
            }
        }
    }

    // Add or update material
    addMaterial(code, capacity, name = '', promoCapacity = null, promoActive = false, promoEndDate = null, group = null, tags = [], notes = '') {
        // Use validation utilities
        const codeValidation = ValidationUtils.validateMaterialCode(code);
        if (!codeValidation.valid) {
            throw new Error(codeValidation.message);
        }
        
        const capacityValidation = ValidationUtils.validateCapacity(capacity);
        if (!capacityValidation.valid) {
            throw new Error(capacityValidation.message);
        }
        
        // Validate promo capacity if provided
        if (promoCapacity !== null && promoCapacity !== undefined && promoCapacity !== '') {
            const promoValidation = ValidationUtils.validateCapacity(promoCapacity);
            if (!promoValidation.valid) {
                throw new Error('Promo ' + promoValidation.message.toLowerCase());
            }
        }
        
        // Validate promo end date if provided
        if (promoEndDate) {
            const dateValidation = ValidationUtils.validateDate(promoEndDate);
            if (!dateValidation.valid) {
                throw new Error('Promo end date: ' + dateValidation.message);
            }
        }
        
        // Sanitize inputs
        const sanitizedCode = SecurityUtils.sanitizeHTML(code.trim());
        const sanitizedName = SecurityUtils.sanitizeHTML(name.trim());
        const sanitizedNotes = SecurityUtils.sanitizeHTML(notes);
        
        // Sanitize tags
        const sanitizedTags = Array.isArray(tags) 
            ? tags.map(tag => SecurityUtils.sanitizeHTML(tag.trim())).filter(tag => tag.length > 0)
            : [];

        const material = {
            code: sanitizedCode,
            name: sanitizedName,
            capacity: capacityValidation.value,
            promoCapacity: promoCapacity !== null && promoCapacity !== undefined && promoCapacity !== '' 
                ? ValidationUtils.validateCapacity(promoCapacity).value 
                : null,
            promoActive: promoActive || false,
            promoEndDate: promoEndDate || null,
            group: group || null,
            tags: sanitizedTags,
            notes: sanitizedNotes,
            createdAt: this.materials[sanitizedCode]?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Store old data for history if editing
        const oldData = this.materials[sanitizedCode] ? { ...this.materials[sanitizedCode] } : null;
        
        // Check rate limiting
        if (!SecurityUtils.rateLimiter.check('addMaterial', 20, 1000)) {
            throw new Error('Too many operations. Please wait a moment.');
        }
        
        this.materials[sanitizedCode] = material;
        
        // Async save
        this.saveMaterials().then(success => {
            if (success) {
                // Add to history
                if (oldData) {
                    this.addToHistory({
                        type: 'EDIT_MATERIAL',
                        data: { oldData, newData: material }
                    });
                } else {
                    this.addToHistory({
                        type: 'ADD_MATERIAL',
                        data: material
                    });
                }
            }
        });
        
        return true;
    }
    getMaterial(code) {
        return this.materials[code] || null;
    }

    // Get all materials
    getAllMaterials() {
        return Object.values(this.materials);
    }

    // Add report to archive
    addToArchive(reportData, results, fileName = null) {
        const archiveEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            fileName: fileName || `Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
            rawData: reportData,
            results: results,
            summary: {
                totalMaterials: results.totalMaterials,
                totalAlerts: results.totalAlerts,
                storageLocations: results.storageLocations
            }
        };

        this.archive.unshift(archiveEntry); // Add to beginning
        return this.saveArchive();
    }

    // Get archive
    getArchive() {
        return this.archive;
    }

    // Clear all archive entries
    clearArchive() {
        this.archive = [];
        return this.saveArchive();
    }

    // Delete archive entry
    deleteArchiveEntry(id) {
        this.archive = this.archive.filter(entry => entry.id !== id);
        return this.saveArchive();
    }

    // Clear old archive entries (older than 30 days)
    clearOldArchive() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        this.archive = this.archive.filter(entry => {
            return new Date(entry.timestamp) > thirtyDaysAgo;
        });
        
        return this.saveArchive();
    }

    // Export all data as JSON
    exportData() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            materials: this.materials,
            archive: this.archive
        };
        return exportData;
    }

    // Import data from JSON
    importData(data) {
        try {
            // Validate data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }

            // Import materials if present
            if (data.materials) {
                this.materials = data.materials;
                this.saveMaterials();
            }

            // Import archive if present
            if (data.archive && Array.isArray(data.archive)) {
                this.archive = data.archive;
                this.saveArchive();
            }

            return {
                success: true,
                materialsCount: Object.keys(this.materials).length,
                archiveCount: this.archive.length
            };
        } catch (e) {
            console.error('Error importing data:', e);
            return {
                success: false,
                error: e.message
            };
        }
    }

    // Download data as JSON file
    downloadBackup() {
        const data = this.exportData();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `warehouse_backup_${timestamp}.json`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Upload and restore from JSON file
    uploadBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const result = this.importData(data);
                    
                    if (result.success) {
                        resolve(result);
                    } else {
                        reject(new Error(result.error));
                    }
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }

    // Get Dexie sync status
    async getSyncStatus() {
        if (!this.dbManager || !this.dbManager.checkAvailability()) {
            return {
                available: false,
                message: 'Dexie database not available',
                using: 'localStorage'
            };
        }

        try {
            const metadata = await this.dbManager.getSyncMetadata();
            return {
                available: true,
                using: 'Dexie (IndexedDB)',
                metadata: metadata,
                materialsCount: Object.keys(this.materials).length,
                archiveCount: this.archive.length,
                localStorageBackup: true
            };
        } catch (error) {
            return {
                available: false,
                message: 'Error checking sync status: ' + error.message,
                using: 'localStorage'
            };
        }
    }

    // Restore from Dexie to localStorage (recovery - should rarely be needed)
    async restoreFromDexie() {
        if (!this.dbManager || !this.dbManager.checkAvailability()) {
            throw new Error('Dexie not available');
        }

        try {
            // Load all data from Dexie
            this.materials = await this.dbManager.loadMaterials();
            this.archive = await this.dbManager.loadArchive();
            this.groups = await this.dbManager.loadGroups();
            this.notes = await this.dbManager.loadNotes();
            this.alertRules = await this.dbManager.loadAlertRules() || this.getDefaultAlertRules();
            this.storageTypeSettings = await this.dbManager.loadStorageTypeSettings() || this.getDefaultStorageTypeSettings();

            // Save to localStorage as backup
            localStorage.setItem(this.STORAGE_KEYS.MATERIALS, JSON.stringify(this.materials));
            localStorage.setItem(this.STORAGE_KEYS.ARCHIVE, JSON.stringify(this.archive));
            localStorage.setItem(this.STORAGE_KEYS.GROUPS, JSON.stringify(this.groups));
            localStorage.setItem(this.STORAGE_KEYS.NOTES, JSON.stringify(this.notes));
            localStorage.setItem(this.STORAGE_KEYS.ALERT_RULES, JSON.stringify(this.alertRules));
            localStorage.setItem(this.STORAGE_KEYS.STORAGE_TYPES, JSON.stringify(this.storageTypeSettings));

            return {
                success: true,
                materialsCount: Object.keys(this.materials).length,
                archiveCount: this.archive.length
            };
        } catch (error) {
            console.error('Error restoring from Dexie:', error);
            throw error;
        }
    }

    // =================== ACTION HISTORY (Undo/Redo) ===================

    // Add action to history for undo/redo
    addToHistory(action) {
        // Remove any future actions if we're in the middle of history
        this.actionHistory = this.actionHistory.slice(0, this.currentHistoryIndex + 1);
        
        // Add new action with timestamp
        this.actionHistory.push({
            ...action,
            timestamp: Date.now() // Use numeric timestamp for easier calculations
        });
        
        // Limit history size
        if (this.actionHistory.length > this.maxHistorySize) {
            this.actionHistory.shift();
        } else {
            this.currentHistoryIndex++;
        }
    }

    // Undo last action
    undo() {
        if (this.currentHistoryIndex < 0) {
            return { success: false, message: 'No actions to undo' };
        }

        const action = this.actionHistory[this.currentHistoryIndex];
        let result = { success: false };

        try {
            switch (action.type) {
                case 'ADD_MATERIAL':
                    delete this.materials[action.data.code];
                    this.saveMaterials();
                    result = { success: true, message: `Material ${action.data.code} removed` };
                    break;
                    
                case 'DELETE_MATERIAL':
                    this.materials[action.data.code] = action.data;
                    this.saveMaterials();
                    result = { success: true, message: `Material ${action.data.code} restored` };
                    break;
                    
                case 'EDIT_MATERIAL':
                    this.materials[action.data.oldData.code] = action.data.oldData;
                    this.saveMaterials();
                    result = { success: true, message: `Material ${action.data.oldData.code} reverted` };
                    break;
                    
                case 'BULK_IMPORT':
                    // Remove all imported materials
                    action.data.imported.forEach(code => {
                        delete this.materials[code];
                    });
                    this.saveMaterials();
                    result = { success: true, message: `Bulk import of ${action.data.imported.length} materials undone` };
                    break;
                    
                case 'BULK_UPDATE':
                    // Restore old states
                    action.data.oldStates.forEach(({ code, oldData }) => {
                        this.materials[code] = oldData;
                    });
                    this.saveMaterials();
                    result = { success: true, message: `Bulk update of ${action.data.oldStates.length} materials undone` };
                    break;
                    
                case 'BULK_DELETE':
                    // Restore deleted materials
                    action.data.materials.forEach(material => {
                        this.materials[material.code] = material;
                    });
                    this.saveMaterials();
                    result = { success: true, message: `Bulk delete of ${action.data.materials.length} materials undone` };
                    break;
            }
            
            this.currentHistoryIndex--;
            return result;
        } catch (error) {
            return { success: false, message: 'Error undoing action: ' + error.message };
        }
    }

    // Redo action
    redo() {
        if (this.currentHistoryIndex >= this.actionHistory.length - 1) {
            return { success: false, message: 'No actions to redo' };
        }

        this.currentHistoryIndex++;
        const action = this.actionHistory[this.currentHistoryIndex];
        let result = { success: false };

        try {
            switch (action.type) {
                case 'ADD_MATERIAL':
                    this.materials[action.data.code] = action.data;
                    this.saveMaterials();
                    result = { success: true, message: `Material ${action.data.code} re-added` };
                    break;
                    
                case 'DELETE_MATERIAL':
                    delete this.materials[action.data.code];
                    this.saveMaterials();
                    result = { success: true, message: `Material ${action.data.code} re-deleted` };
                    break;
                    
                case 'EDIT_MATERIAL':
                    this.materials[action.data.newData.code] = action.data.newData;
                    this.saveMaterials();
                    result = { success: true, message: `Material ${action.data.newData.code} re-edited` };
                    break;
                    
                case 'BULK_IMPORT':
                    // Re-add all imported materials
                    action.data.materials.forEach(material => {
                        this.materials[material.code] = material;
                    });
                    this.saveMaterials();
                    result = { success: true, message: `Bulk import of ${action.data.materials.length} materials redone` };
                    break;
                    
                case 'BULK_UPDATE':
                    // Re-apply updates
                    action.data.materials.forEach(material => {
                        this.materials[material.code] = material;
                    });
                    this.saveMaterials();
                    result = { success: true, message: `Bulk update of ${action.data.materials.length} materials redone` };
                    break;
                    
                case 'BULK_DELETE':
                    // Re-delete materials
                    action.data.materials.forEach(material => {
                        delete this.materials[material.code];
                    });
                    this.saveMaterials();
                    result = { success: true, message: `Bulk delete of ${action.data.materials.length} materials redone` };
                    break;
            }
            
            return result;
        } catch (error) {
            this.currentHistoryIndex--;
            return { success: false, message: 'Error redoing action: ' + error.message };
        }
    }

    // Check if undo is available
    canUndo() {
        return this.currentHistoryIndex >= 0;
    }

    // Check if redo is available
    canRedo() {
        return this.currentHistoryIndex < this.actionHistory.length - 1;
    }

    // =================== BULK IMPORT/EXPORT ===================

    // Export materials as CSV
    exportMaterialsCSV(materialCodes = null) {
        const materials = materialCodes 
            ? materialCodes.map(code => this.materials[code]).filter(m => m)
            : this.getAllMaterials();
            
        const headers = ['Material Code', 'Material Name', 'MKT Capacity', 'Promo Capacity', 'Promo Active', 'Promo End Date', 'Group', 'Created At'];
        
        const csvData = [
            headers.join(','),
            ...materials.map(material => [
                `"${material.code}"`,
                `"${material.name || ''}"`,
                material.capacity,
                material.promoCapacity || '',
                material.promoActive ? 'true' : 'false',
                material.promoEndDate || '',
                `"${material.group || ''}"`,
                material.createdAt
            ].join(','))
        ].join('\n');

        // Download CSV file
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `materials_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { success: true, count: materials.length };
    }

    // Import materials from CSV content
    importMaterialsFromCSV(csvContent) {
        try {
            const lines = csvContent.trim().split('\n');
            if (lines.length < 2) {
                throw new Error('CSV file must contain at least a header and one data row');
            }

            // Skip header line
            const dataLines = lines.slice(1);
            const imported = [];
            const errors = [];
            const importedCodes = [];

            dataLines.forEach((line, index) => {
                try {
                    // Parse CSV line (basic CSV parser)
                    const values = this.parseCSVLine(line);
                    
                    if (values.length < 3) {
                        errors.push(`Row ${index + 2}: Insufficient columns`);
                        return;
                    }

                    const [code, name, capacity, promoCapacity, promoActive, promoEndDate, group] = values;
                    
                    if (!code || !capacity) {
                        errors.push(`Row ${index + 2}: Material code and capacity are required`);
                        return;
                    }

                    const material = {
                        code: code.trim(),
                        name: name ? name.trim() : '',
                        capacity: parseInt(capacity),
                        promoCapacity: promoCapacity ? parseInt(promoCapacity) : null,
                        promoActive: promoActive ? promoActive.toLowerCase() === 'true' : false,
                        promoEndDate: promoEndDate ? promoEndDate.trim() : null,
                        group: group ? group.trim() : null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    this.materials[material.code] = material;
                    imported.push(material);
                    importedCodes.push(material.code);
                    
                } catch (error) {
                    errors.push(`Row ${index + 2}: ${error.message}`);
                }
            });

            if (imported.length > 0) {
                this.saveMaterials();
                
                // Add to history for undo
                this.addToHistory({
                    type: 'BULK_IMPORT',
                    data: {
                        materials: imported,
                        imported: importedCodes
                    }
                });
            }

            return {
                success: true,
                imported: imported.length,
                errors: errors
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Import materials from JSON (batch)
    importMaterialsFromJSON(jsonContent) {
        try {
            const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
            const materialsArray = Array.isArray(data) ? data : [data];
            
            const imported = [];
            const errors = [];
            const importedCodes = [];

            materialsArray.forEach((material, index) => {
                try {
                    if (!material.code || material.capacity === undefined) {
                        errors.push(`Item ${index + 1}: Material code and capacity are required`);
                        return;
                    }

                    const newMaterial = {
                        code: material.code.trim(),
                        name: material.name ? material.name.trim() : '',
                        capacity: parseInt(material.capacity),
                        promoCapacity: material.promoCapacity ? parseInt(material.promoCapacity) : null,
                        promoActive: material.promoActive || false,
                        promoEndDate: material.promoEndDate || null,
                        group: material.group || null,
                        createdAt: material.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    this.materials[newMaterial.code] = newMaterial;
                    imported.push(newMaterial);
                    importedCodes.push(newMaterial.code);
                    
                } catch (error) {
                    errors.push(`Item ${index + 1}: ${error.message}`);
                }
            });

            if (imported.length > 0) {
                this.saveMaterials();
                
                this.addToHistory({
                    type: 'BULK_IMPORT',
                    data: {
                        materials: imported,
                        imported: importedCodes
                    }
                });
            }

            return {
                success: true,
                imported: imported.length,
                errors: errors
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Bulk update materials
    bulkUpdateMaterials(materialCodes, updates) {
        try {
            const updatedMaterials = [];
            const oldStates = [];

            materialCodes.forEach(code => {
                const material = this.materials[code];
                if (!material) return;

                // Store old state for undo
                oldStates.push({
                    code: code,
                    oldData: { ...material }
                });

                // Apply updates
                if (updates.capacity !== undefined) {
                    material.capacity = updates.capacity;
                }
                if (updates.promoCapacity !== undefined) {
                    material.promoCapacity = updates.promoCapacity;
                }
                if (updates.promoActive !== undefined) {
                    material.promoActive = updates.promoActive;
                }
                if (updates.promoEndDate !== undefined) {
                    material.promoEndDate = updates.promoEndDate;
                }
                if (updates.group !== undefined) {
                    material.group = updates.group;
                }
                
                material.updatedAt = new Date().toISOString();
                updatedMaterials.push(material);
            });

            if (updatedMaterials.length > 0) {
                this.saveMaterials();
                
                // Add to history
                this.addToHistory({
                    type: 'BULK_UPDATE',
                    data: {
                        materials: updatedMaterials,
                        oldStates: oldStates,
                        updates: updates
                    }
                });
            }

            return {
                success: true,
                count: updatedMaterials.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Bulk delete materials
    bulkDeleteMaterials(materialCodes) {
        try {
            const deletedMaterials = [];

            materialCodes.forEach(code => {
                const material = this.materials[code];
                if (material) {
                    deletedMaterials.push({ ...material });
                    delete this.materials[code];
                }
            });

            if (deletedMaterials.length > 0) {
                this.saveMaterials();
                
                // Add to history
                this.addToHistory({
                    type: 'BULK_DELETE',
                    data: {
                        materials: deletedMaterials
                    }
                });
            }

            return {
                success: true,
                count: deletedMaterials.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }


    // Simple CSV line parser
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current); // Add the last value
        return values;
    }

    // =================== MATERIAL GROUPS ===================

    // Create new group
    createGroup(name, description = '', color = null) {
        if (!name || name.trim() === '') {
            throw new Error('Group name is required');
        }
        
        // Default colors for groups if not provided
        const defaultColors = [
            '#3b82f6', // Blue
            '#10b981', // Green
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#8b5cf6', // Purple
            '#06b6d4', // Cyan
            '#ec4899', // Pink
            '#f97316', // Orange
            '#14b8a6', // Teal
            '#6366f1'  // Indigo
        ];
        
        // If no color provided, pick next available color
        if (!color) {
            const existingColors = Object.values(this.groups).map(g => g.color);
            color = defaultColors.find(c => !existingColors.includes(c)) || defaultColors[0];
        }
        
        const groupId = Date.now().toString();
        this.groups[groupId] = {
            id: groupId,
            name: name.trim(),
            description: description.trim(),
            color: color,
            createdAt: new Date().toISOString()
        };
        
        this.saveGroups();
        return groupId;
    }

    // Get all groups
    getAllGroups() {
        return Object.values(this.groups);
    }

    // Assign material to group
    assignMaterialToGroup(materialCode, groupId) {
        if (this.materials[materialCode]) {
            this.materials[materialCode].group = groupId;
            this.materials[materialCode].updatedAt = new Date().toISOString();
            return this.saveMaterials();
        }
        return false;
    }

    // Get materials by group
    getMaterialsByGroup(groupId) {
        return this.getAllMaterials().filter(material => material.group === groupId);
    }

    // Get specific group by ID
    getGroup(groupId) {
        return this.groups[groupId] || null;
    }

    // Update group
    updateGroup(groupId, updates) {
        if (this.groups[groupId]) {
            this.groups[groupId] = {
                ...this.groups[groupId],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return this.saveGroups();
        }
        return false;
    }

    // Delete group
    deleteGroup(groupId) {
        if (this.groups[groupId]) {
            // Remove group assignment from all materials
            Object.keys(this.materials).forEach(materialCode => {
                if (this.materials[materialCode].group === groupId) {
                    this.materials[materialCode].group = null;
                    this.materials[materialCode].updatedAt = new Date().toISOString();
                }
            });
            
            delete this.groups[groupId];
            this.saveMaterials();
            return this.saveGroups();
        }
        return false;
    }

    // =================== USER NOTES ===================

    // Add note (can be material-specific or general)
    addNote(materialCode, content) {
        const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const note = {
            id: noteId,
            materialCode: materialCode || null,
            content: content.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes[noteId] = note;
        this.saveNotes();
        return noteId;
    }

    // Get all notes
    getAllNotes() {
        return Object.values(this.notes).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Get specific note by ID
    getNote(noteId) {
        return this.notes[noteId] || null;
    }

    // Get notes for material
    getNotes(materialCode) {
        return Object.values(this.notes).filter(note => note.materialCode === materialCode);
    }

    // Update note
    updateNote(noteId, updates) {
        if (this.notes[noteId]) {
            this.notes[noteId] = {
                ...this.notes[noteId],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return this.saveNotes();
        }
        return false;
    }

    // Delete note
    deleteNote(noteId) {
        if (this.notes[noteId]) {
            delete this.notes[noteId];
            return this.saveNotes();
        }
        return false;
    }

    // =================== ENHANCED MATERIAL OPERATIONS ===================

    /**
     * Add or update material with validation and history tracking
     * @param {string} code - Material code
     * @param {number} capacity - Material capacity
     * @param {string} name - Material name
     * @param {number|null} promoCapacity - Promotional capacity
     * @param {boolean} promoActive - Whether promotion is active
     * @param {string|null} promoEndDate - Promotion end date
     * @param {string|null} group - Material group ID
     * @param {string[]} tags - Material tags
     * @param {string} notes - Material notes
     * @returns {boolean} Success status
     * @throws {Error} Validation errors
     */
    addMaterial(code, capacity, name = '', promoCapacity = null, promoActive = false, promoEndDate = null, group = null, tags = [], notes = '') {
        // Use validation utilities
        const codeValidation = ValidationUtils.validateMaterialCode(code);
        if (!codeValidation.valid) {
            throw new Error(codeValidation.message);
        }
        
        const capacityValidation = ValidationUtils.validateCapacity(capacity);
        if (!capacityValidation.valid) {
            throw new Error(capacityValidation.message);
        }
        
        // Validate promo capacity if provided
        if (promoCapacity !== null && promoCapacity !== undefined && promoCapacity !== '') {
            const promoValidation = ValidationUtils.validateCapacity(promoCapacity);
            if (!promoValidation.valid) {
                throw new Error('Promo ' + promoValidation.message.toLowerCase());
            }
        }
        
        // Validate promo end date if provided
        if (promoEndDate) {
            const dateValidation = ValidationUtils.validateDate(promoEndDate);
            if (!dateValidation.valid) {
                throw new Error('Promo end date: ' + dateValidation.message);
            }
        }
        
        // Sanitize inputs
        const sanitizedCode = SecurityUtils.sanitizeHTML(code.trim());
        const sanitizedName = SecurityUtils.sanitizeHTML(name.trim());
        const sanitizedNotes = SecurityUtils.sanitizeHTML(notes);
        
        // Sanitize tags
        const sanitizedTags = Array.isArray(tags) 
            ? tags.map(tag => SecurityUtils.sanitizeHTML(tag.trim())).filter(tag => tag.length > 0)
            : [];

        const material = {
            code: sanitizedCode,
            name: sanitizedName,
            capacity: capacityValidation.value,
            promoCapacity: promoCapacity !== null && promoCapacity !== undefined && promoCapacity !== '' 
                ? ValidationUtils.validateCapacity(promoCapacity).value 
                : null,
            promoActive: promoActive || false,
            promoEndDate: promoEndDate || null,
            group: group || null,
            tags: sanitizedTags,
            notes: sanitizedNotes,
            createdAt: this.materials[sanitizedCode]?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Store old data for history if editing
        const oldData = this.materials[sanitizedCode] ? { ...this.materials[sanitizedCode] } : null;
        
        // Check rate limiting
        if (!SecurityUtils.rateLimiter.check('addMaterial', 20, 1000)) {
            throw new Error('Too many operations. Please wait a moment.');
        }
        
        this.materials[sanitizedCode] = material;
        
        if (this.saveMaterials()) {
            // Add to history
            if (oldData) {
                this.addToHistory({
                    type: 'EDIT_MATERIAL',
                    data: { oldData, newData: material }
                });
            } else {
                this.addToHistory({
                    type: 'ADD_MATERIAL',
                    data: material
                });
            }
            return true;
        }
        return false;
    }

    // Delete material with history tracking
    deleteMaterial(code) {
        const material = this.materials[code];
        if (material) {
            delete this.materials[code];
            
            if (this.saveMaterials()) {
                this.addToHistory({
                    type: 'DELETE_MATERIAL',
                    data: material
                });
                return true;
            }
        }
        return false;
    }

    // =================== CUSTOM ALERT RULES ===================

    // Get default alert rules
    getDefaultAlertRules() {
        return {
            storageTypes: {
                MKT: { enabled: true, threshold: 100 },
                LAG: { enabled: false, threshold: 100 },
                QS: { enabled: false, threshold: 100 },
                SPE: { enabled: false, threshold: 100 }
            },
            timeBasedRules: {
                weekendAlerts: false,
                businessHoursOnly: false,
                holidayExceptions: []
            },
            materialAttributes: {
                alertByGroup: false,
                alertBySupplier: false,
                criticalMaterialsOnly: false
            },
            thresholds: {
                capacityWarning: 80,    // Alert when >80% capacity
                capacityCritical: 95,   // Critical when >95% capacity
                jumpAlert: 5,           // Default jump threshold
                consecutiveAlerts: 3    // Alert after 3 consecutive high readings
            },
            notifications: {
                enableSound: false,
                enableBrowser: false,
                emailNotifications: false
            }
        };
    }

    // Get current alert rules
    getAlertRules() {
        return this.alertRules;
    }

    // Update alert rules
    updateAlertRules(newRules) {
        this.alertRules = { ...this.alertRules, ...newRules };
        return this.saveAlertRules();
    }

    // Update specific rule category
    updateRuleCategory(category, rules) {
        if (this.alertRules[category]) {
            this.alertRules[category] = { ...this.alertRules[category], ...rules };
            return this.saveAlertRules();
        }
        return false;
    }

    // Check if storage type should be monitored
    shouldMonitorStorageType(storageType) {
        const rule = this.alertRules.storageTypes[storageType];
        return rule && rule.enabled;
    }

    // Get threshold for storage type
    getStorageTypeThreshold(storageType) {
        const rule = this.alertRules.storageTypes[storageType];
        return rule ? rule.threshold : 100;
    }

    // Apply custom alert rules to analysis
    applyCustomAlertRules(material, quantity, storageType) {
        const alerts = [];
        const rules = this.alertRules;

        // Skip if storage type not monitored
        if (!this.shouldMonitorStorageType(storageType)) {
            return alerts;
        }

        // Get material configuration
        const materialConfig = this.getMaterial(material);
        if (!materialConfig) return alerts;

        // Check capacity alerts with custom thresholds
        const capacity = materialConfig.capacity;
        const warningThreshold = (capacity * rules.thresholds.capacityWarning) / 100;
        const criticalThreshold = (capacity * rules.thresholds.capacityCritical) / 100;

        if (quantity > criticalThreshold) {
            alerts.push({
                type: 'critical',
                message: `Critical: ${material} at ${quantity}/${capacity} (${Math.round(quantity/capacity*100)}%)`
            });
        } else if (quantity > warningThreshold) {
            alerts.push({
                type: 'warning',
                message: `Warning: ${material} at ${quantity}/${capacity} (${Math.round(quantity/capacity*100)}%)`
            });
        }

        // Time-based rules
        if (rules.timeBasedRules.businessHoursOnly) {
            const now = new Date();
            const hour = now.getHours();
            if (hour < 8 || hour > 18) {
                return []; // Suppress alerts outside business hours
            }
        }

        if (rules.timeBasedRules.weekendAlerts === false) {
            const now = new Date();
            const day = now.getDay();
            if (day === 0 || day === 6) {
                return []; // Suppress weekend alerts
            }
        }

        // Material attribute rules
        if (rules.materialAttributes.alertByGroup && materialConfig.group) {
            // Could implement group-specific rules here
        }

        if (rules.materialAttributes.criticalMaterialsOnly && !materialConfig.critical) {
            return []; // Only alert for critical materials
        }

        return alerts;
    }

    // Reset alert rules to default
    resetAlertRules() {
        this.alertRules = this.getDefaultAlertRules();
        return this.saveAlertRules();
    }

    // ========================
    // Storage Type Management
    // ========================

    // Get default storage type settings
    getDefaultStorageTypeSettings() {
        return {
            enabledTypes: {
                MKT: true,   // Market storage (default enabled)
                LAG: false,  // Warehouse
                QS: false,   // Quality assurance  
                SPE: false   // Blocked stock
            },
            defaultCapacities: {
                MKT: 100,
                LAG: 200,
                QS: 50,
                SPE: 25
            },
            customTypes: [], // User-defined storage types
            lastUpdated: new Date().toISOString()
        };
    }

    // Get storage type settings
    getStorageTypeSettings() {
        return { ...this.storageTypeSettings };
    }

    // Update storage type settings
    updateStorageTypeSettings(settings) {
        this.storageTypeSettings = {
            ...this.storageTypeSettings,
            ...settings,
            lastUpdated: new Date().toISOString()
        };
        return this.saveStorageTypeSettings();
    }

    // Get enabled storage types
    getEnabledStorageTypes() {
        return Object.keys(this.storageTypeSettings.enabledTypes)
            .filter(type => this.storageTypeSettings.enabledTypes[type]);
    }

    // Check if storage type is enabled for monitoring
    isStorageTypeEnabled(storageType) {
        return this.storageTypeSettings.enabledTypes[storageType] === true;
    }

    // Get default capacity for storage type
    getDefaultCapacityForStorageType(storageType) {
        return this.storageTypeSettings.defaultCapacities[storageType] || 100;
    }

    // Add custom storage type
    addCustomStorageType(type, capacity = 100) {
        if (!this.storageTypeSettings.customTypes.find(ct => ct.type === type)) {
            this.storageTypeSettings.customTypes.push({
                type,
                capacity,
                enabled: true,
                createdAt: new Date().toISOString()
            });
            this.storageTypeSettings.enabledTypes[type] = true;
            this.storageTypeSettings.defaultCapacities[type] = capacity;
            return this.saveStorageTypeSettings();
        }
        return false;
    }

    // Remove custom storage type
    removeCustomStorageType(type) {
        this.storageTypeSettings.customTypes = this.storageTypeSettings.customTypes
            .filter(ct => ct.type !== type);
        delete this.storageTypeSettings.enabledTypes[type];
        delete this.storageTypeSettings.defaultCapacities[type];
        return this.saveStorageTypeSettings();
    }

    // Reset storage type settings to default
    resetStorageTypeSettings() {
        this.storageTypeSettings = this.getDefaultStorageTypeSettings();
        return this.saveStorageTypeSettings();
    }

    // ========================
    // Data Backup/Restore
    // ========================

    // Export all data to JSON
    exportAllData() {
        const backup = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            appName: 'Warehouse Early Warning System',
            data: {
                materials: this.materials,
                archive: this.archive,
                groups: this.groups,
                notes: this.notes,
                alertRules: this.alertRules,
                storageTypeSettings: this.storageTypeSettings
            },
            metadata: {
                materialCount: Object.keys(this.materials).length,
                archiveCount: this.archive.length,
                groupCount: Object.keys(this.groups).length,
                noteCount: Object.keys(this.notes).length
            }
        };

        return backup;
    }

    // Import all data from JSON backup
    async importAllData(backupData) {
        try {
            // Validate backup structure
            if (!backupData.version || !backupData.data) {
                throw new Error('Invalid backup file structure');
            }

            // Backup current data before importing (for rollback if needed)
            const currentBackup = this.exportAllData();

            // Import data to memory
            if (backupData.data.materials) {
                this.materials = backupData.data.materials;
            }

            if (backupData.data.archive) {
                this.archive = backupData.data.archive;
            }

            if (backupData.data.groups) {
                this.groups = backupData.data.groups;
            }

            if (backupData.data.notes) {
                this.notes = backupData.data.notes;
            }

            if (backupData.data.alertRules) {
                this.alertRules = backupData.data.alertRules;
            }

            if (backupData.data.storageTypeSettings) {
                this.storageTypeSettings = backupData.data.storageTypeSettings;
            }

            // Save to Dexie and localStorage
            await Promise.all([
                this.saveMaterials(),
                this.saveArchive(),
                this.saveGroups(),
                this.saveNotes(),
                this.saveAlertRules(),
                this.saveStorageTypeSettings()
            ]);

            // Clear action history after import
            this.actionHistory = [];
            this.currentHistoryIndex = -1;

            return {
                success: true,
                imported: backupData.metadata || {},
                rollbackData: currentBackup
            };

        } catch (error) {
            console.error('Import error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Validate backup file
    validateBackup(backupData) {
        try {
            if (!backupData || typeof backupData !== 'object') {
                return { valid: false, error: 'Invalid JSON format' };
            }

            if (!backupData.version) {
                return { valid: false, error: 'Missing version information' };
            }

            if (!backupData.data) {
                return { valid: false, error: 'Missing data section' };
            }

            if (!backupData.timestamp) {
                return { valid: false, error: 'Missing timestamp' };
            }

            return {
                valid: true,
                info: {
                    version: backupData.version,
                    timestamp: backupData.timestamp,
                    appName: backupData.appName || 'Unknown',
                    metadata: backupData.metadata || {}
                }
            };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Get backup summary
    getBackupSummary() {
        return {
            materialCount: Object.keys(this.materials).length,
            archiveCount: this.archive.length,
            groupCount: Object.keys(this.groups).length,
            noteCount: Object.keys(this.notes).length,
            hasCustomAlertRules: JSON.stringify(this.alertRules) !== JSON.stringify(this.getDefaultAlertRules()),
            hasCustomStorageTypes: Object.keys(this.storageTypeSettings.enabledTypes).some(type => 
                type !== 'MKT' && this.storageTypeSettings.enabledTypes[type]
            ),
            lastBackup: localStorage.getItem('warehouse_last_backup') || 'Never'
        };
    }

    // Set last backup timestamp
    setLastBackupTimestamp() {
        localStorage.setItem('warehouse_last_backup', new Date().toISOString());
    }

    // Dashboard Layout Management
    saveDashboardLayout(widgets) {
        try {
            const layout = {
                widgets: widgets,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('warehouse_dashboard_layout', JSON.stringify(layout));
            return true;
        } catch (error) {
            console.error('Error saving dashboard layout:', error);
            return false;
        }
    }

    getDashboardLayout() {
        try {
            const layoutData = localStorage.getItem('warehouse_dashboard_layout');
            if (!layoutData) return null;
            
            const layout = JSON.parse(layoutData);
            return layout.widgets || null;
        } catch (error) {
            console.error('Error loading dashboard layout:', error);
            return null;
        }
    }

    clearDashboardLayout() {
        try {
            localStorage.removeItem('warehouse_dashboard_layout');
            return true;
        } catch (error) {
            console.error('Error clearing dashboard layout:', error);
            return false;
        }
    }
}

