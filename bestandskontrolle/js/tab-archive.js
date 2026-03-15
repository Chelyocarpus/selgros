/* ===========================
   ARCHIVE TAB
   =========================== */

// State for archive filtering and comparison
let archiveSelectedForComparison = [];

// Render Archive Tab Content
function renderArchiveTab() {
    const tab = document.getElementById('archiveTab');
    tab.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;">${ui.t('archiveTitle')}</h2>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary btn-small" onclick="ui.toggleArchiveFilters()" id="filterToggleBtn">
                        <i class="fa-solid fa-filter"></i> ${ui.t('archiveFilterTitle')}
                    </button>
                    <button class="btn-secondary btn-small" onclick="ui.toggleComparisonMode()" id="comparisonToggleBtn">
                        <i class="fa-solid fa-chart-simple"></i> ${ui.t('btnCompareReports')}
                    </button>
                    <button class="btn-danger btn-small" onclick="ui.clearAllArchive()">
                        <i class="fa-solid fa-trash-can"></i> ${ui.t('btnClearAllArchive')}
                    </button>
                </div>
            </div>
            <p style="margin-bottom: 15px; color: var(--text-secondary);">${ui.t('archiveDescription')}</p>
            
            <!-- Enhanced Filter Panel -->
            <div id="archiveFilters" class="filter-panel" style="display: none; margin-bottom: 20px;">
                <div class="filter-row">
                    <div class="filter-group">
                        <label>${ui.t('dateRangeFilter')}</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="date" id="filterFromDate" placeholder="${ui.t('fromDate')}">
                            <span>→</span>
                            <input type="date" id="filterToDate" placeholder="${ui.t('toDate')}">
                        </div>
                    </div>
                    <div class="filter-group">
                        <label>${ui.t('alertCountFilter')}</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="number" id="filterMinAlerts" placeholder="${ui.t('minAlerts')}" min="0">
                            <span>-</span>
                            <input type="number" id="filterMaxAlerts" placeholder="${ui.t('maxAlerts')}" min="0">
                        </div>
                    </div>
                    <div class="filter-group">
                        <label>${ui.t('materialCountFilter')}</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="number" id="filterMinMaterials" placeholder="${ui.t('minMaterials')}" min="0">
                            <span>-</span>
                            <input type="number" id="filterMaxMaterials" placeholder="${ui.t('maxMaterials')}" min="0">
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button class="btn-primary btn-small" onclick="ui.applyArchiveFilters()">
                            <i class="fa-solid fa-filter"></i> ${ui.t('btnApplyFilter')}
                        </button>
                        <button class="btn-secondary btn-small" onclick="ui.clearArchiveFilters()">
                            <i class="fa-solid fa-filter-circle-xmark"></i> ${ui.t('btnClearFilter')}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Comparison Panel -->
            <div id="comparisonPanel" class="comparison-panel" style="display: none; margin-bottom: 20px;">
                <div class="comparison-info" style="padding: 10px; background: var(--background-secondary); border-radius: 8px;">
                    <span id="comparisonCount">0 ${ui.t('reportsSelected')}</span>
                    <button class="btn-primary btn-small" onclick="ui.compareSelectedReports()" id="compareBtn" disabled>
                        <i class="fa-solid fa-code-compare"></i> ${ui.t('btnCompareReports')}
                    </button>
                    <button class="btn-secondary btn-small" onclick="ui.clearComparisonSelection()">
                        <i class="fa-solid fa-xmark"></i> ${ui.t('btnClearSelection')}
                    </button>
                </div>
            </div>
            
            <!-- Storage Management -->
            <div class="card" style="margin-top: 20px;">
                <h2><i class="fa-solid fa-database"></i> ${ui.t('storageManagementTitle')}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${ui.t('storageManagementDesc')}</p>
                
                <div id="storageStatusDisplay" style="margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div class="storage-stat">
                            <div class="storage-stat-label">${ui.t('archiveEntries')}</div>
                            <div class="storage-stat-value" id="archiveCount">-</div>
                        </div>
                        <div class="storage-stat">
                            <div class="storage-stat-label">${ui.t('estimatedSize')}</div>
                            <div class="storage-stat-value" id="archiveSize">-</div>
                        </div>
                        <div class="storage-stat">
                            <div class="storage-stat-label">${ui.t('oldestEntry')}</div>
                            <div class="storage-stat-value" id="oldestEntry">-</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-warning btn-small" onclick="ui.cleanupOldArchive()">
                        <i class="fa-solid fa-broom"></i> ${ui.t('btnCleanupOld')}
                    </button>
                    <button class="btn-secondary btn-small" onclick="ui.optimizeStorage()">
                        <i class="fa-solid fa-gauge-high"></i> ${ui.t('btnOptimizeStorage')}
                    </button>
                    <button class="btn-primary btn-small" onclick="ui.updateStorageStatus()">
                        <i class="fa-solid fa-rotate"></i> ${ui.t('btnRefresh')}
                    </button>
                </div>
            </div>
            
            <div id="archiveListContainer">
                <table id="archiveTable" class="display" style="width:100%">
                    <thead>
                        <tr id="archiveTableHeader">
                            <th>${ui.t('colDateTime')}</th>
                            <th>${ui.t('colTotalMaterials')}</th>
                            <th>${ui.t('colAlertsFound')}</th>
                            <th>${ui.t('colStorageLocations')}</th>
                            <th>${ui.t('colActions')}</th>
                        </tr>
                    </thead>
                    <tbody id="archiveTableBody">
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Update storage status after rendering
    if (ui && ui.updateStorageStatus) {
        setTimeout(() => ui.updateStorageStatus(), 100);
    }
}

// Render View Report Modal Content
function renderViewReportModal() {
    const modal = document.getElementById('viewReportModal');
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1000px;">
            <div class="modal-header">
                <h2>Archived Report</h2>
                <button class="modal-close" onclick="closeViewReportModal()">×</button>
            </div>
            <div id="modalReportContent"></div>
        </div>
    `;
}

// Render archive list
UIManager.prototype.renderArchiveList = function(filters = null) {
    let archive = this.dataManager.getArchive();
    
    // Apply filters if provided
    if (filters) {
        archive = archive.filter(entry => {
            const date = new Date(entry.timestamp);
            
            if (filters.fromDate && date < filters.fromDate) return false;
            if (filters.toDate && date > filters.toDate) return false;
            if (filters.minAlerts !== null && entry.summary.totalAlerts < filters.minAlerts) return false;
            if (filters.maxAlerts !== null && entry.summary.totalAlerts > filters.maxAlerts) return false;
            if (filters.minMaterials !== null && entry.summary.totalMaterials < filters.minMaterials) return false;
            if (filters.maxMaterials !== null && entry.summary.totalMaterials > filters.maxMaterials) return false;
            
            return true;
        });
    }
    
    const tbody = document.getElementById('archiveTableBody');
    const comparisonPanel = document.getElementById('comparisonPanel');
    const isComparisonMode = comparisonPanel && (comparisonPanel.style.display === 'block' || window.getComputedStyle(comparisonPanel).display === 'block');
    
    // Check if table exists before attempting DataTable operations
    const tableExists = document.getElementById('archiveTable');
    if (!tableExists) {
        console.warn('Archive table not found in DOM');
        return;
    }
    
    // Destroy existing DataTable if it exists
    if ($.fn.DataTable.isDataTable('#archiveTable')) {
        try {
            $('#archiveTable').DataTable().destroy();
        } catch (e) {
            console.warn('DataTable destroy error:', e);
        }
        // Clear the DataTable reference completely
        $('#archiveTable').removeData();
    }

    if (archive.length === 0) {
        const colspanCount = isComparisonMode ? 6 : 5; // Account for selection column when in comparison mode
        tbody.innerHTML = `<tr><td colspan="${colspanCount}" style="text-align: center; padding: 40px; color: var(--text-secondary);"><div class="empty-state-icon" style="font-size: 3em; margin-bottom: 10px;"><i class="fa-solid fa-clipboard"></i></div><p>${this.t('archiveEmpty')}</p></td></tr>`;
        return;
    }

    // Populate table body
    tbody.innerHTML = archive.map(entry => {
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleString();
        const dateSort = date.getTime(); // For sorting
        
        const selectionCell = isComparisonMode ? `
            <td>
                <input type="checkbox" 
                       ${archiveSelectedForComparison.includes(entry.id) ? 'checked' : ''} 
                       onchange="ui.toggleReportSelection(${entry.id})"
                       style="transform: scale(1.2);">
            </td>
        ` : '';
        
        return `
            <tr>
                ${selectionCell}
                <td data-order="${dateSort}">
                    <strong><i class="fa-regular fa-calendar"></i> ${dateStr}</strong>
                </td>
                <td>
                    <span style="font-weight: 600; color: var(--primary-color);">${entry.summary.totalMaterials}</span>
                </td>
                <td>
                    <span class="alert-badge ${entry.summary.totalAlerts > 0 ? 'danger' : 'success'}" style="padding: 6px 12px;">
                        ${entry.summary.totalAlerts > 0 ? '<i class="fa-solid fa-triangle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>'} ${entry.summary.totalAlerts}
                    </span>
                </td>
                <td>
                    <span style="font-weight: 600;">${entry.summary.storageLocations}</span>
                </td>
                <td>
                    <button class="btn-primary btn-small" onclick="ui.viewArchivedReport(${entry.id})" style="margin-right: 5px;"><i class="fa-solid fa-eye"></i> ${this.t('btnView')}</button>
                    <button class="btn-danger btn-small" onclick="ui.deleteArchiveEntry(${entry.id})"><i class="fa-solid fa-trash-can"></i> ${this.t('btnDelete')}</button>
                </td>
            </tr>
        `;
    }).join('');

    // Validate table structure before DataTable initialization
    const headerCells = document.querySelectorAll('#archiveTable thead th').length;
    const firstRowCells = document.querySelectorAll('#archiveTable tbody tr:first-child td').length;
    
    if (firstRowCells > 0 && headerCells !== firstRowCells) {
        console.error(`Column count mismatch: header has ${headerCells} columns, first row has ${firstRowCells} columns`);
        return;
    }
    
    // Initialize DataTable with error handling
    try {
        const dateColumnIndex = isComparisonMode ? 1 : 0; // Date column is at index 1 when selection column is present
        
        // Ensure the table element exists and is ready for DataTable
        if (!$('#archiveTable').length) {
            console.error('Archive table element not found for DataTable initialization');
            return;
        }
        
        $('#archiveTable').DataTable({
            pageLength: 10,
            order: [[dateColumnIndex, 'desc']], // Sort by date, newest first
            language: {
                search: `<i class="fa-solid fa-magnifying-glass"></i> ${this.t('dtSearchArchive')}`,
                lengthMenu: this.t('dtLengthMenuArchive'),
                info: this.t('dtInfoArchive'),
                infoEmpty: this.t('dtInfoEmptyArchive'),
                infoFiltered: this.t('dtInfoFilteredArchive'),
                zeroRecords: this.t('dtZeroRecordsArchive'),
                paginate: {
                    first: this.t('dtFirst'),
                    last: this.t('dtLast'),
                    next: this.t('dtNext'),
                    previous: this.t('dtPrevious')
                }
            },
            dom: '<"top"lf>rt<"bottom"ip><"clear">',
            columnDefs: [
                { orderable: false, targets: isComparisonMode ? [0, 5] : [4] } // Disable sorting on selection and Actions columns
            ]
        });
    } catch (e) {
        console.error('DataTable initialization error:', e);
        // Fallback: show table without DataTable features
        console.log('Archive table rendered without DataTable features due to initialization error');
    }
};

// View archived report
UIManager.prototype.viewArchivedReport = function(id) {
    const entry = this.dataManager.getArchive().find(e => e.id === id);
    if (!entry) return;

    const date = new Date(entry.timestamp).toLocaleString();
    
    // Helper function to escape HTML
    const esc = (str) => SecurityUtils.escapeHTML(str);
    
    // Create results display
    const resultsHtml = `
        <div style="margin-bottom: 20px;">
            <strong>Report Date:</strong> ${date}<br>
            <strong>Materials:</strong> ${entry.summary.totalMaterials} • 
            <strong>Alerts:</strong> ${entry.summary.totalAlerts} • 
            <strong>Locations:</strong> ${entry.summary.storageLocations}
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th>${this.t('colMaterial')}</th>
                    <th>${this.t('colStorageType')}</th>
                    <th>${this.t('colQuantity')}</th>
                    <th>${this.t('colMKTCapacity')}</th>
                    <th>${this.t('colAlerts')}</th>
                </tr>
            </thead>
            <tbody>
                ${entry.results.materialGroups.map(group => {
                    const { material, materialName, rows, hasMultipleStorageTypes, totalStock } = group;
                    
                    let html = '';
                    
                    // Add header row for grouped materials
                    if (hasMultipleStorageTypes) {
                        const materialDisplay = materialName 
                            ? `<strong>${esc(material)}</strong> • ${esc(materialName)}`
                            : `<strong>${esc(material)}</strong>`;
                        
                        const groupAlerts = rows.filter(r => r.alerts && r.alerts.length > 0).length;
                        const alertIndicator = groupAlerts > 0 
                            ? `<span style="background: rgba(220, 38, 38, 0.9); padding: 4px 10px; border-radius: 12px; font-size: 0.85em; margin-left: 10px;"><i class="fa-solid fa-triangle-exclamation"></i> ${groupAlerts} Alert${groupAlerts > 1 ? 's' : ''}</span>`
                            : '';
                        
                        html += `
                            <tr class="material-group-header">
                                <td colspan="5" style="padding: 12px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>${materialDisplay}${alertIndicator}</div>
                                        <div style="font-size: 0.9em; opacity: 0.9;">
                                            <i class="fa-solid fa-chart-simple"></i> ${this.t('total')}: <strong>${totalStock}</strong> ${this.t('units')} • ${rows.length} ${this.t('location')}${rows.length > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }
                    
                    // Add rows for each storage type
                    rows.forEach(row => {
                        const alertsHtml = row.alerts && row.alerts.length > 0
                            ? row.alerts.map(alert => 
                                `<span class="alert-badge ${esc(alert.type)}">${esc(alert.message)}</span>`
                            ).join(' ')
                            : '-';

                        const materialDisplay = hasMultipleStorageTypes
                            ? ''
                            : (materialName 
                                ? `<strong>${esc(material)}</strong><br><small style="color: var(--text-secondary);">${esc(materialName)}</small>`
                                : esc(material));

                        const storageTypeBadge = row.storageType !== 'Total'
                            ? `<span class="storage-type-badge ${esc(row.storageType.toLowerCase())}">${esc(row.storageType)}</span>`
                            : esc(row.storageType);

                        const materialConfig = this.dataManager.getMaterial(material);
                        const capacityDisplay = materialConfig 
                            ? `<span class="capacity-display has-capacity">${materialConfig.capacity}</span>`
                            : `<span class="capacity-display no-capacity">—</span>`;

                        const rowClass = (row.alerts && row.alerts.length > 0 ? 'alert-row ' : '') +
                                       (hasMultipleStorageTypes ? 'material-group-row' : '');

                        html += `
                            <tr class="${rowClass}">
                                <td>${materialDisplay}</td>
                                <td>${storageTypeBadge}</td>
                                <td>${row.qty}</td>
                                <td>${capacityDisplay}</td>
                                <td>${alertsHtml}</td>
                            </tr>
                        `;
                    });
                    
                    if (hasMultipleStorageTypes) {
                        html += '<tr class="material-group-separator"><td colspan="5"></td></tr>';
                    }
                    
                    return html;
                }).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('modalReportContent').innerHTML = resultsHtml;
    document.getElementById('viewReportModal').classList.add('active');
};

// Close view report modal
UIManager.prototype.closeViewReportModal = function() {
    document.getElementById('viewReportModal').classList.remove('active');
};

// Delete archive entry
UIManager.prototype.deleteArchiveEntry = async function(id) {
    const message = this.t('deleteArchiveMessage');
    const confirmed = await this.showDeleteModal(message);
    
    if (!confirmed) {
        return;
    }

    if (this.dataManager.deleteArchiveEntry(id)) {
        this.renderArchiveList();
        this.showToast('Archived report deleted successfully!', 'success');
    } else {
        this.showToast('Error deleting archive entry.', 'error');
    }
};

// Toggle archive filters
UIManager.prototype.toggleArchiveFilters = function() {
    const panel = document.getElementById('archiveFilters');
    const btn = document.getElementById('filterToggleBtn');
    
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        btn.style.background = 'var(--primary-color)';
        btn.style.color = 'white';
    } else {
        panel.style.display = 'none';
        btn.style.background = '';
        btn.style.color = '';
    }
};

// Apply archive filters
UIManager.prototype.applyArchiveFilters = function() {
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;
    const minAlerts = document.getElementById('filterMinAlerts').value;
    const maxAlerts = document.getElementById('filterMaxAlerts').value;
    const minMaterials = document.getElementById('filterMinMaterials').value;
    const maxMaterials = document.getElementById('filterMaxMaterials').value;

    const filters = {
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate + 'T23:59:59') : null,
        minAlerts: minAlerts ? parseInt(minAlerts) : null,
        maxAlerts: maxAlerts ? parseInt(maxAlerts) : null,
        minMaterials: minMaterials ? parseInt(minMaterials) : null,
        maxMaterials: maxMaterials ? parseInt(maxMaterials) : null
    };

    this.renderArchiveList(filters);
    this.showToast('Filters applied to archive list', 'success');
};

// Clear archive filters
UIManager.prototype.clearArchiveFilters = function() {
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    document.getElementById('filterMinAlerts').value = '';
    document.getElementById('filterMaxAlerts').value = '';
    document.getElementById('filterMinMaterials').value = '';
    document.getElementById('filterMaxMaterials').value = '';
    
    this.renderArchiveList();
    this.showToast('Filters cleared', 'success');
};

// Toggle comparison mode
UIManager.prototype.toggleComparisonMode = function() {
    const panel = document.getElementById('comparisonPanel');
    const btn = document.getElementById('comparisonToggleBtn');
    const tableContainer = document.getElementById('archiveListContainer');
    
    const isCurrentlyHidden = panel.style.display === 'none' || window.getComputedStyle(panel).display === 'none';
    
    // Destroy existing DataTable completely
    if ($.fn.DataTable.isDataTable('#archiveTable')) {
        try {
            $('#archiveTable').DataTable().destroy(true); // true = remove from DOM
        } catch (e) {
            console.warn('DataTable destroy error:', e);
        }
    }
    
    if (isCurrentlyHidden) {
        panel.style.display = 'block';
        btn.style.background = 'var(--secondary-color)';
        btn.style.color = 'white';
        
        // Completely rebuild table with selection column
        tableContainer.innerHTML = `
            <table id="archiveTable" class="display" style="width:100%">
                <thead>
                    <tr id="archiveTableHeader">
                        <th style="width: 50px;"><i class="fa-regular fa-square"></i></th>
                        <th>${this.t('colDateTime')}</th>
                        <th>${this.t('colTotalMaterials')}</th>
                        <th>${this.t('colAlertsFound')}</th>
                        <th>${this.t('colStorageLocations')}</th>
                        <th>${this.t('colActions')}</th>
                    </tr>
                </thead>
                <tbody id="archiveTableBody">
                </tbody>
            </table>
        `;
    } else {
        panel.style.display = 'none';
        btn.style.background = '';
        btn.style.color = '';
        
        // Completely rebuild table without selection column
        tableContainer.innerHTML = `
            <table id="archiveTable" class="display" style="width:100%">
                <thead>
                    <tr id="archiveTableHeader">
                        <th>${this.t('colDateTime')}</th>
                        <th>${this.t('colTotalMaterials')}</th>
                        <th>${this.t('colAlertsFound')}</th>
                        <th>${this.t('colStorageLocations')}</th>
                        <th>${this.t('colActions')}</th>
                    </tr>
                </thead>
                <tbody id="archiveTableBody">
                </tbody>
            </table>
        `;
        
        archiveSelectedForComparison = [];
        this.updateComparisonCount();
    }
    
    // Use setTimeout to ensure DOM is completely updated before rendering
    setTimeout(() => {
        this.renderArchiveList();
    }, 50);
};

// Toggle report selection for comparison
UIManager.prototype.toggleReportSelection = function(reportId) {
    const index = archiveSelectedForComparison.indexOf(reportId);
    
    if (index === -1) {
        if (archiveSelectedForComparison.length < 2) {
            archiveSelectedForComparison.push(reportId);
        } else {
            this.showToast('Maximum 2 reports can be selected for comparison', 'warning');
            return;
        }
    } else {
        archiveSelectedForComparison.splice(index, 1);
    }
    
    this.updateComparisonCount();
    this.renderArchiveList();
};

// Update comparison count display
UIManager.prototype.updateComparisonCount = function() {
    const countElement = document.getElementById('comparisonCount');
    const compareBtn = document.getElementById('compareBtn');
    
    if (countElement) {
        countElement.textContent = `${archiveSelectedForComparison.length} ${this.t('reportsSelected')}`;
    }
    
    if (compareBtn) {
        compareBtn.disabled = archiveSelectedForComparison.length !== 2;
        compareBtn.style.opacity = archiveSelectedForComparison.length === 2 ? '1' : '0.5';
    }
};

// Clear comparison selection
UIManager.prototype.clearComparisonSelection = function() {
    archiveSelectedForComparison = [];
    this.updateComparisonCount();
    this.renderArchiveList();
};

// Compare selected reports
UIManager.prototype.compareSelectedReports = function() {
    if (archiveSelectedForComparison.length !== 2) {
        this.showToast('Please select exactly 2 reports to compare', 'warning');
        return;
    }

    const archive = this.dataManager.getArchive();
    const reportA = archive.find(r => r.id === archiveSelectedForComparison[0]);
    const reportB = archive.find(r => r.id === archiveSelectedForComparison[1]);
    
    if (!reportA || !reportB) {
        this.showToast('Selected reports not found', 'error');
        return;
    }

    this.showReportComparison(reportA, reportB);
};

// Show report comparison modal
UIManager.prototype.showReportComparison = function(reportA, reportB) {
    const modal = document.getElementById('viewReportModal');
    
    // Create comparison analysis (returns pre-escaped strings)
    const comparison = this.analyzeReportDifferences(reportA, reportB);
    
    // Helper function to escape HTML
    const esc = (str) => SecurityUtils.escapeHTML(str);
    
    const comparisonHtml = `
        <div class="comparison-container">
            <h3>${this.t('compareTitle')}</h3>
            
            <div class="report-comparison-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="report-summary">
                    <h4>${this.t('reportA')} - ${new Date(reportA.timestamp).toLocaleString()}</h4>
                    <div class="report-stats">
                        <div><i class="fa-solid fa-chart-simple"></i> ${this.t('colTotalMaterials')}: <strong>${reportA.summary.totalMaterials}</strong></div>
                        <div><i class="fa-solid fa-triangle-exclamation"></i> ${this.t('colAlertsFound')}: <strong>${reportA.summary.totalAlerts}</strong></div>
                        <div><i class="fa-solid fa-location-dot"></i> ${this.t('colStorageLocations')}: <strong>${reportA.summary.storageLocations}</strong></div>
                    </div>
                </div>
                
                <div class="report-summary">
                    <h4>${this.t('reportB')} - ${new Date(reportB.timestamp).toLocaleString()}</h4>
                    <div class="report-stats">
                        <div><i class="fa-solid fa-chart-simple"></i> ${this.t('colTotalMaterials')}: <strong>${reportB.summary.totalMaterials}</strong></div>
                        <div><i class="fa-solid fa-triangle-exclamation"></i> ${this.t('colAlertsFound')}: <strong>${reportB.summary.totalAlerts}</strong></div>
                        <div><i class="fa-solid fa-location-dot"></i> ${this.t('colStorageLocations')}: <strong>${reportB.summary.storageLocations}</strong></div>
                    </div>
                </div>
            </div>

            <div class="differences-analysis">
                <h4><i class="fa-solid fa-magnifying-glass"></i> ${this.t('differences')}</h4>
                
                ${comparison.alertChanges.length > 0 ? `
                    <div class="diff-section">
                        <h5><i class="fa-solid fa-triangle-exclamation"></i> ${this.t('alertChanges')}</h5>
                        <ul>
                            ${comparison.alertChanges.map(change => `<li>${change}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${comparison.stockChanges.length > 0 ? `
                    <div class="diff-section">
                        <h5><i class="fa-solid fa-chart-line"></i> ${this.t('stockChanges')}</h5>
                        <ul>
                            ${comparison.stockChanges.map(change => `<li>${change}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${comparison.newMaterials.length > 0 ? `
                    <div class="diff-section">
                        <h5><i class="fa-solid fa-plus"></i> ${this.t('newMaterials')}</h5>
                        <ul>
                            ${comparison.newMaterials.map(material => `<li><strong>${material}</strong></li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${comparison.removedMaterials.length > 0 ? `
                    <div class="diff-section">
                        <h5><i class="fa-solid fa-minus"></i> ${this.t('removedMaterials')}</h5>
                        <ul>
                            ${comparison.removedMaterials.map(material => `<li><strong>${material}</strong></li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${comparison.alertChanges.length === 0 && comparison.stockChanges.length === 0 && 
                  comparison.newMaterials.length === 0 && comparison.removedMaterials.length === 0 ? 
                  '<p style="color: var(--text-secondary); font-style: italic;">No significant differences found between reports.</p>' : ''}
            </div>
        </div>
    `;

    document.getElementById('modalReportContent').innerHTML = comparisonHtml;
    modal.classList.add('active');
};

// Analyze differences between two reports (returns escaped HTML strings)
UIManager.prototype.analyzeReportDifferences = function(reportA, reportB) {
    const materialsA = {};
    const materialsB = {};
    
    // Helper function to escape HTML
    const esc = (str) => SecurityUtils.escapeHTML(str);
    
    // Index materials from both reports
    reportA.results.materialGroups.forEach(group => {
        group.rows.forEach(row => {
            if (row.storageType === 'MKT') {
                materialsA[group.material] = {
                    qty: row.qty,
                    alerts: row.alerts || []
                };
            }
        });
    });
    
    reportB.results.materialGroups.forEach(group => {
        group.rows.forEach(row => {
            if (row.storageType === 'MKT') {
                materialsB[group.material] = {
                    qty: row.qty,
                    alerts: row.alerts || []
                };
            }
        });
    });
    
    const alertChanges = [];
    const stockChanges = [];
    const newMaterials = [];
    const removedMaterials = [];
    
    // Find new materials (escape for HTML display)
    Object.keys(materialsB).forEach(material => {
        if (!materialsA[material]) {
            newMaterials.push(esc(material));
        }
    });
    
    // Find removed materials (escape for HTML display)
    Object.keys(materialsA).forEach(material => {
        if (!materialsB[material]) {
            removedMaterials.push(esc(material));
        }
    });
    
    // Find changes in existing materials
    Object.keys(materialsA).forEach(material => {
        if (materialsB[material]) {
            const dataA = materialsA[material];
            const dataB = materialsB[material];
            const escapedMaterial = esc(material);
            
            // Stock changes
            if (dataA.qty !== dataB.qty) {
                const change = dataB.qty - dataA.qty;
                const changeStr = change > 0 ? `+${change}` : `${change}`;
                stockChanges.push(`${escapedMaterial}: ${dataA.qty} → ${dataB.qty} (${changeStr})`);
            }
            
            // Alert changes
            const alertsA = dataA.alerts.length;
            const alertsB = dataB.alerts.length;
            
            if (alertsA !== alertsB) {
                if (alertsA === 0 && alertsB > 0) {
                    const alertMsg = dataB.alerts[0]?.message ? esc(dataB.alerts[0].message) : 'Unknown';
                    alertChanges.push(`${escapedMaterial}: New alert (${alertMsg})`);
                } else if (alertsA > 0 && alertsB === 0) {
                    alertChanges.push(`${escapedMaterial}: Alert resolved`);
                } else if (alertsB > alertsA) {
                    alertChanges.push(`${escapedMaterial}: More alerts (${alertsA} → ${alertsB})`);
                } else {
                    alertChanges.push(`${escapedMaterial}: Fewer alerts (${alertsA} → ${alertsB})`);
                }
            }
        }
    });
    
    return {
        alertChanges,
        stockChanges,
        newMaterials,
        removedMaterials
    };
};
