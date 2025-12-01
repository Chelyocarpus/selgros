/* ===========================
   SETTINGS & SYNC TAB
   Cloud synchronization and application settings
   =========================== */

// Render Settings Tab Content
function renderSettingsTab() {
    const tab = document.getElementById('settingsTab');
    tab.innerHTML = `
        <!-- Cloud Sync Section -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;"><i class="fa-solid fa-cloud"></i> ${ui.t('cloudSyncTitle')}</h2>
                <button class="btn-primary btn-small" onclick="ui.showCloudSyncSettings()">
                    <i class="fa-solid fa-gear"></i> ${ui.t('btnCloudSyncSettings')}
                </button>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">${ui.t('cloudSyncDescription')}</p>
            
            <!-- Sync Status Display -->
            <div id="cloudSyncStatus" class="cloud-sync-status">
                <!-- Status will be rendered by JavaScript -->
            </div>
            
            <!-- Sync Action Buttons -->
            <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 20px;">
                <div style="flex: 1; min-width: 180px;">
                    <button class="btn-success" onclick="ui.cloudSyncUpload()" style="width: 100%; padding: 15px;" id="cloudSyncUploadBtn" disabled>
                        <i class="fa-solid fa-cloud-arrow-up"></i> ${ui.t('btnCloudSyncUpload')}
                    </button>
                    <small style="color: var(--text-secondary); display: block; margin-top: 8px; text-align: center;">
                        ${ui.t('cloudSyncUploadDesc') || 'Push local data to cloud'}
                    </small>
                </div>
                <div style="flex: 1; min-width: 180px;">
                    <button class="btn-secondary" onclick="ui.cloudSyncDownload()" style="width: 100%; padding: 15px;" id="cloudSyncDownloadBtn" disabled>
                        <i class="fa-solid fa-cloud-arrow-down"></i> ${ui.t('btnCloudSyncDownload')}
                    </button>
                    <small style="color: var(--text-secondary); display: block; margin-top: 8px; text-align: center;">
                        ${ui.t('cloudSyncDownloadDesc') || 'Pull data from cloud'}
                    </small>
                </div>
                <div style="flex: 1; min-width: 180px;">
                    <button class="btn-secondary" onclick="ui.cloudSyncTest()" style="width: 100%; padding: 15px;" id="cloudSyncTestBtn" disabled>
                        <i class="fa-solid fa-plug"></i> ${ui.t('btnCloudSyncTest')}
                    </button>
                    <small style="color: var(--text-secondary); display: block; margin-top: 8px; text-align: center;">
                        ${ui.t('cloudSyncTestDesc') || 'Verify connection'}
                    </small>
                </div>
            </div>
        </div>

        <!-- Cross-Tab Sync Section -->
        <div class="card">
            <h2><i class="fa-solid fa-arrows-rotate"></i> ${ui.t('crossTabSyncTitle') || 'Real-Time Sync'}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ${ui.t('crossTabSyncDescription') || 'Automatic synchronization between browser tabs and devices'}
            </p>
            
            <div id="crossTabSyncStatus" class="sync-status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <!-- Cross-tab sync status will be rendered by JavaScript -->
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: var(--card-bg-secondary); border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0;"><i class="fa-solid fa-info-circle"></i> ${ui.t('howSyncWorks') || 'How Sync Works'}</h4>
                <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary);">
                    <li>${ui.t('syncExplanation1') || 'Changes in one tab automatically appear in all other open tabs'}</li>
                    <li>${ui.t('syncExplanation2') || 'Cloud sync enables data sharing across different devices'}</li>
                    <li>${ui.t('syncExplanation3') || 'Conflicts are resolved by keeping the most recent change'}</li>
                </ul>
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

        <!-- Local Backup Section -->
        <div class="card">
            <h2><i class="fa-solid fa-floppy-disk"></i> ${ui.t('localBackupTitle') || 'Local Backup'}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ${ui.t('localBackupDescription') || 'Export and import data as local JSON files'}
            </p>
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

        <!-- IndexedDB Sync Section -->
        <div class="card">
            <h2><i class="fa-solid fa-database"></i> ${ui.t('indexedDBTitle') || 'Local Database'}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ${ui.t('indexedDBDescription') || 'IndexedDB provides reliable local storage with larger capacity'}
            </p>
            <div id="indexedDBStatus" class="sync-status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <!-- IndexedDB status will be rendered here -->
            </div>
            <button class="btn-secondary" onclick="ui.restoreFromIndexedDB()" style="padding: 12px 20px;">
                <i class="fa-solid fa-bolt"></i> ${ui.t('btnRestoreFromIndexedDB')}
            </button>
            <small style="color: var(--text-secondary); display: block; margin-top: 8px;">
                ${ui.t('restoreDescription')}
            </small>
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
}
