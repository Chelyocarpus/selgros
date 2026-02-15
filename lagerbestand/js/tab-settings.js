/* ===========================
   SETTINGS & SYNC TAB
   Cloud synchronization and application settings
   =========================== */

// Render Settings Tab Content
function renderSettingsTab() {
    const tab = document.getElementById('settingsTab');
    tab.innerHTML = `
        <!-- ===========================
             PRIMARY STORAGE BACKEND
             =========================== -->
        <div class="card">
            <h2><i class="fa-solid fa-database"></i> ${ui.t('primaryStorageTitle') || 'Primary Storage'}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ${ui.t('primaryStorageDescription') || 'Choose your main database. All app data (materials, archive, groups) is stored here.'}
            </p>
            
            <!-- Storage Backend Options -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div class="storage-backend-option" id="dexieBackendOption" onclick="ui.selectStorageBackend('dexie')">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <i class="fa-solid fa-laptop" style="font-size: 24px; color: var(--info-color);"></i>
                        <div style="flex: 1;">
                            <h4 style="margin: 0; font-size: 16px;">${ui.t('localStorageTitle') || 'Local (Browser)'}</h4>
                            <span class="backend-status" id="dexieStatus"></span>
                        </div>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 13px; margin: 0; line-height: 1.4;">
                        ${ui.t('dexieDescription') || 'Fast local storage in your browser. Best for single-device use.'}
                    </p>
                </div>
                
                <div class="storage-backend-option" id="githubBackendOption" onclick="ui.selectStorageBackend('github')">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <i class="fa-brands fa-github" style="font-size: 24px; color: #6e5494;"></i>
                        <div style="flex: 1;">
                            <h4 style="margin: 0; font-size: 16px;">${ui.t('cloudStorageTitle') || 'Cloud (GitHub Projects)'}</h4>
                            <span class="backend-status" id="githubStatus"></span>
                        </div>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 13px; margin: 0; line-height: 1.4;">
                        ${ui.t('githubDescription') || 'Cloud storage with real-time team collaboration. Access from any device.'}
                    </p>
                </div>
            </div>
            
            <!-- Info Box -->
            <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid var(--primary-color); border-radius: 6px; font-size: 13px; color: var(--text-secondary);">
                <strong style="color: var(--text-color);"><i class="fa-solid fa-lightbulb"></i> ${ui.t('tip') || 'Tip'}:</strong> 
                ${ui.t('storageBackendTip') || 'You can switch between storage backends anytime. Data is not automatically migrated - use Export/Import to transfer data.'}
            </div>
            
            <!-- GitHub Projects Configuration -->
            <div id="githubConfigSection" style="display: none; padding: 20px; background: var(--card-bg-secondary); border-radius: 8px; margin-top: 15px;">
                <h3><i class="fa-solid fa-cog"></i> ${ui.t('githubConfigTitle') || 'GitHub Projects Configuration'}</h3>
                
                <!-- Setup Guide -->
                <div class="github-setup-guide" style="margin-top: 15px; padding: 15px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid var(--primary-color); border-radius: 6px;">
                    <h4 style="margin: 0 0 10px 0; color: var(--primary-color); font-size: 14px;">
                        <i class="fa-solid fa-lightbulb"></i> ${ui.t('setupGuide') || 'Setup Guide'}
                    </h4>
                    <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                        <li>${ui.t('setupStep1') || 'Create a GitHub Personal Access Token with <strong>project</strong> scope'}</li>
                        <li>${ui.t('setupStep2') || 'Create a new GitHub Project (or use existing)'}</li>
                        <li>${ui.t('setupStep3') || 'Enter your credentials below and click "Save & Connect"'}</li>
                    </ol>
                </div>
                
                <!-- Step 1: Token -->
                <div style="margin-top: 20px; position: relative;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span class="step-badge">1</span>
                        <label for="githubToken" style="font-weight: 600; margin: 0;">
                            ${ui.t('githubTokenLabel') || 'Personal Access Token'}
                        </label>
                        <a href="https://github.com/settings/tokens/new?scopes=project&description=Warehouse%20App" target="_blank" style="margin-left: auto; font-size: 12px; color: var(--primary-color); text-decoration: none; display: flex; align-items: center; gap: 4px;" rel="noopener noreferrer">
                            <i class="fa-solid fa-external-link"></i> ${ui.t('createToken') || 'Create Token'}
                        </a>
                    </div>
                    <div style="position: relative;">
                        <input type="password" id="githubToken" class="input-field" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" style="width: 100%; padding: 10px 40px 10px 10px; font-family: monospace; font-size: 13px;">
                        <button type="button" onclick="ui.togglePasswordVisibility('githubToken')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 5px;" title="${ui.t('toggleVisibility') || 'Toggle Visibility'}">
                            <i class="fa-solid fa-eye" id="githubTokenIcon"></i>
                        </button>
                    </div>
                    <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                        <i class="fa-solid fa-info-circle"></i> ${ui.t('githubTokenHelp') || 'Required scopes: project (read/write)'}
                    </small>
                </div>
                
                <!-- Step 2: Username/Org -->
                <div style="margin-top: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span class="step-badge">2</span>
                        <label for="githubOwner" style="font-weight: 600; margin: 0;">
                            ${ui.t('githubOwnerLabel') || 'GitHub Username or Organization'}
                        </label>
                    </div>
                    <input type="text" id="githubOwner" class="input-field" placeholder="octocat" style="width: 100%; padding: 10px;">
                    <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                        <i class="fa-solid fa-info-circle"></i> ${ui.t('githubOwnerHelp') || 'Your GitHub username (e.g., "octocat") or organization name'}
                    </small>
                </div>
                
                <!-- Step 3: Project Number -->
                <div style="margin-top: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span class="step-badge">3</span>
                        <label for="githubProjectNumber" style="font-weight: 600; margin: 0;">
                            ${ui.t('githubProjectNumberLabel') || 'Project Number'}
                        </label>
                    </div>
                    <input type="number" id="githubProjectNumber" class="input-field" placeholder="1" min="1" style="width: 100%; padding: 10px;">
                    <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                        <i class="fa-solid fa-info-circle"></i> ${ui.t('githubProjectNumberHelp') || 'Find this in your project URL: github.com/users/[user]/projects/[number]'}
                    </small>
                    <div style="margin-top: 8px; padding: 10px; background: var(--card-bg); border-radius: 6px; font-size: 12px; font-family: monospace; color: var(--text-secondary);">
                        Example: <span style="color: var(--primary-color);">https://github.com/users/octocat/projects/<strong style="color: var(--success-color);">42</strong></span>
                    </div>
                </div>
                
                <!-- Step 4: Sync Settings -->
                <div style="margin-top: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span class="step-badge">4</span>
                        <label style="font-weight: 600; margin: 0;">
                            ${ui.t('githubSyncSettingsLabel') || 'Sync Settings'}
                        </label>
                    </div>
                    
                    <!-- Auto-sync toggle -->
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding: 12px; background: var(--card-bg); border-radius: 8px;">
                        <label for="githubAutoSync" style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
                            <input type="checkbox" id="githubAutoSync" style="width: 18px; height: 18px; cursor: pointer;">
                            <span><i class="fa-solid fa-arrows-rotate"></i> ${ui.t('githubAutoSyncLabel') || 'Enable automatic background sync'}</span>
                        </label>
                    </div>
                    
                    <!-- Sync interval -->
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding: 12px; background: var(--card-bg); border-radius: 8px;">
                        <label for="githubSyncInterval" style="flex: 1;">
                            <i class="fa-solid fa-clock"></i> ${ui.t('githubSyncIntervalLabel') || 'Sync interval (seconds)'}
                        </label>
                        <input type="number" id="githubSyncInterval" class="input-field" value="30" min="10" max="3600" style="width: 100px; padding: 8px; text-align: center;">
                    </div>
                    
                    <!-- Conflict resolution strategy -->
                    <div style="padding: 12px; background: var(--card-bg); border-radius: 8px;">
                        <label for="githubConflictResolution" style="display: block; margin-bottom: 8px;">
                            <i class="fa-solid fa-code-compare"></i> ${ui.t('githubConflictStrategyLabel') || 'Conflict resolution strategy'}
                        </label>
                        <select id="githubConflictResolution" class="input-field" style="width: 100%; padding: 10px;">
                            <option value="manual">${ui.t('conflictStrategyManual') || 'Manual — review each conflict'}</option>
                            <option value="remote-wins">${ui.t('conflictStrategyRemoteWins') || 'Remote wins — always accept remote changes'}</option>
                            <option value="local-wins">${ui.t('conflictStrategyLocalWins') || 'Local wins — always keep local changes'}</option>
                            <option value="merge">${ui.t('conflictStrategyMerge') || 'Auto-merge — newer timestamp wins'}</option>
                        </select>
                        <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                            <i class="fa-solid fa-info-circle"></i> ${ui.t('githubConflictStrategyHelp') || 'How to handle conflicts when two people edit the same item'}
                        </small>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="margin-top: 25px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-primary" onclick="ui.saveGitHubConfig()">
                        <i class="fa-solid fa-save"></i> ${ui.t('btnSaveConfig') || 'Save & Connect'}
                    </button>
                    <button class="btn-secondary" onclick="ui.testGitHubConnection()">
                        <i class="fa-solid fa-plug"></i> ${ui.t('btnTestConnection') || 'Test Connection'}
                    </button>
                    <button class="btn-secondary" onclick="ui.clearGitHubConfig()">
                        <i class="fa-solid fa-trash"></i> ${ui.t('btnClearConfig') || 'Clear Config'}
                    </button>
                </div>
                
                <!-- Status Display -->
                <div id="githubConfigStatus" style="margin-top: 15px; padding: 10px; border-radius: 5px; display: none;"></div>
            </div>
        </div>

        <!-- Real-Time Collaboration (GitHub Projects only) -->
        <div class="card" id="collaborationCard" style="display: none;">
            <h2><i class="fa-solid fa-users"></i> ${ui.t('collaborationTitle') || 'Real-Time Collaboration'}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ${ui.t('collaborationDescription') || 'Work together with your team in real-time using GitHub Projects'}
            </p>
            
            <div class="collaboration-status" id="collaborationStatus">
                <div class="collaboration-indicator" id="collaborationIndicator"></div>
                <div>
                    <strong id="collaborationStatusText">${ui.t('collaborationInactive') || 'Not Connected'}</strong>
                    <p style="margin: 0; font-size: 12px; color: var(--text-secondary);" id="collaborationDetails"></p>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <h4><i class="fa-solid fa-chart-line"></i> ${ui.t('syncStats') || 'Sync Statistics'}</h4>
                <div id="syncStatsGrid" class="sync-status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 10px;">
                    <!-- Sync stats will be rendered here -->
                </div>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn-primary" onclick="ui.showConflictResolutionModal()" id="resolveConflictsBtn" style="display: none;">
                    <i class="fa-solid fa-code-compare"></i> ${ui.t('resolveConflicts') || 'Resolve Conflicts'}
                    <span class="badge" id="conflictCount" style="margin-left: 8px; background: var(--danger-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;"></span>
                </button>
                <button class="btn-secondary" onclick="ui.forceSync()">
                    <i class="fa-solid fa-rotate"></i> ${ui.t('forceSync') || 'Force Sync Now'}
                </button>
            </div>
        </div>

        <!-- ===========================
             BACKUP & EXPORT
             =========================== -->
        <div class="card">
            <h2><i class="fa-solid fa-cloud-arrow-up"></i> ${ui.t('backupExportTitle') || 'Backup & Export'}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ${ui.t('backupDescription') || 'Create backups of your data for safekeeping or migration between storage backends.'}
            </p>
            
            <!-- Local File Export/Import -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 16px; margin: 0 0 15px 0;">
                    <i class="fa-solid fa-file-export"></i> ${ui.t('localFileBackup') || 'Local File Backup'}
                </h3>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <button class="btn-primary" onclick="ui.exportData()" style="width: 100%; padding: 15px;">
                            <i class="fa-solid fa-file-arrow-down"></i> ${ui.t('btnExportData')}
                        </button>
                        <small style="color: var(--text-secondary); display: block; margin-top: 8px;">
                            ${ui.t('backupExportDesc')}
                        </small>
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <button class="btn-secondary" onclick="document.getElementById('settingsBackupFileInput').click()" style="width: 100%; padding: 15px;">
                            <i class="fa-solid fa-file-arrow-up"></i> ${ui.t('btnImportData')}
                        </button>
                        <input type="file" id="settingsBackupFileInput" accept=".json" style="display: none;" onchange="ui.importData(event)">
                        <small style="color: var(--text-secondary); display: block; margin-top: 8px;">
                            ${ui.t('backupImportDesc')}
                        </small>
                    </div>
                </div>
            </div>

            <!-- GitHub Gist Backup (Legacy System) -->
            <div style="padding: 15px; background: var(--card-bg-secondary); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; font-size: 16px;">
                        <i class="fa-brands fa-github"></i> ${ui.t('gistBackupTitle') || 'GitHub Gist Backup'}
                    </h3>
                    <button class="btn-primary btn-small" onclick="ui.showCloudSyncSettings()">
                        <i class="fa-solid fa-gear"></i> ${ui.t('btnCloudSyncSettings')}
                    </button>
                </div>
                <p style="color: var(--text-secondary); margin-bottom: 15px; font-size: 13px;">
                    ${ui.t('gistBackupDescription') || 'Simple cloud backup using GitHub Gists. Not a database - for backup/restore only.'}
                </p>
                
                <!-- Cloud Sync Status Display -->
                <div id="cloudSyncStatus" class="cloud-sync-status">
                    <!-- Status will be rendered by JavaScript -->
                </div>
                
                <!-- Sync Action Buttons -->
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
                    <div style="flex: 1; min-width: 150px;">
                        <button class="btn-success" onclick="ui.cloudSyncUpload()" style="width: 100%; padding: 12px; font-size: 13px;" id="cloudSyncUploadBtn" disabled>
                            <i class="fa-solid fa-cloud-arrow-up"></i> ${ui.t('btnCloudSyncUpload')}
                        </button>
                        <small style="color: var(--text-secondary); display: block; margin-top: 5px; font-size: 11px; text-align: center;">
                            ${ui.t('cloudSyncUploadDesc') || 'Push local data to cloud'}
                        </small>
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <button class="btn-secondary" onclick="ui.cloudSyncDownload()" style="width: 100%; padding: 12px; font-size: 13px;" id="cloudSyncDownloadBtn" disabled>
                            <i class="fa-solid fa-cloud-arrow-down"></i> ${ui.t('btnCloudSyncDownload')}
                        </button>
                        <small style="color: var(--text-secondary); display: block; margin-top: 5px; font-size: 11px; text-align: center;">
                            ${ui.t('cloudSyncDownloadDesc') || 'Pull data from cloud'}
                        </small>
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <button class="btn-secondary" onclick="ui.cloudSyncTest()" style="width: 100%; padding: 12px; font-size: 13px;" id="cloudSyncTestBtn" disabled>
                            <i class="fa-solid fa-plug"></i> ${ui.t('btnCloudSyncTest')}
                        </button>
                        <small style="color: var(--text-secondary); display: block; margin-top: 5px; font-size: 11px; text-align: center;">
                            ${ui.t('cloudSyncTestDesc') || 'Verify connection'}
                        </small>
                    </div>
                </div>
            </div>
        </div>

        <!-- ===========================
             CROSS-TAB SYNC & DATABASE
             =========================== -->
        <div class="card">
            <h2><i class="fa-solid fa-arrows-rotate"></i> ${ui.t('localSyncTitle') || 'Local Synchronization'}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ${ui.t('localSyncDescription') || 'Automatic synchronization between browser tabs and IndexedDB management.'}
            </p>
            
            <div id="crossTabSyncStatus" class="sync-status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <!-- Cross-tab sync status will be rendered by JavaScript -->
            </div>
            
            <!-- IndexedDB Management -->
            <div style="margin-top: 25px; padding: 15px; background: var(--card-bg-secondary); border-radius: 8px;">
                <h3 style="font-size: 16px; margin: 0 0 10px 0;">
                    <i class="fa-solid fa-database"></i> ${ui.t('indexedDBTitle') || 'IndexedDB Management'}
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 15px; font-size: 13px;">
                    ${ui.t('indexedDBDescription') || 'IndexedDB provides reliable local storage with larger capacity'}
                </p>
                <div id="indexedDBStatus" class="sync-status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 15px;">
                    <!-- IndexedDB status will be rendered here -->
                </div>
                <button class="btn-secondary" onclick="ui.restoreFromIndexedDB()" style="padding: 12px 20px;">
                    <i class="fa-solid fa-bolt"></i> ${ui.t('btnRestoreFromIndexedDB')}
                </button>
                <small style="color: var(--text-secondary); display: block; margin-top: 8px; font-size: 12px;">
                    ${ui.t('restoreDescription')}
                </small>
            </div>
        </div>

        <!-- Sync Log Section -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;"><i class="fa-solid fa-clock-rotate-left"></i> ${ui.t('syncLogTitle') || 'Sync Activity Log'}</h2>
                <button class="btn-secondary btn-small" onclick="ui.clearSyncLog()">
                    <i class="fa-solid fa-trash"></i> ${ui.t('btnClearLog') || 'Clear Log'}
                </button>
            </div>
            <div id="syncLogContainer" class="sync-log-container" style="max-height: 300px; overflow-y: auto;">
                <!-- Sync log entries will be rendered here -->
            </div>
        </div>

        <!-- Data Statistics Section -->
        <div class="card">
            <h2><i class="fa-solid fa-chart-pie"></i> ${ui.t('dataStatsTitle') || 'Data Statistics'}</h2>
            <div id="dataStatsContainer" class="sync-status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <!-- Data statistics will be rendered here -->
            </div>
        </div>
    `;

    // Initialize the tab content
    ui.renderSettingsTabStatus();
    ui.updateStorageBackendStatus();
    ui.updateGitHubCollaborationStatus();
}
