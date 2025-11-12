/* ===========================
   MATERIALS TAB
   =========================== */

// Render Materials Tab Content
function renderMaterialsTab() {
    const tab = document.getElementById('materialsTab');
    tab.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;">${ui.t('addMaterialTitle')}</h2>
                <button class="btn-primary" onclick="ui.openAddModal()"><i class="fa-solid fa-note-sticky"></i> ${ui.t('btnAddMaterialModal')}</button>
            </div>
            <div class="form-group">
                <label for="newMaterialCode">${ui.t('materialCode')} *</label>
                <input type="text" id="newMaterialCode" placeholder="${ui.t('materialCodePlaceholder')}" required>
            </div>
            <div class="form-group">
                <label for="newMaterialName">${ui.t('materialName')} (${ui.t('optional')})</label>
                <input type="text" id="newMaterialName" placeholder="${ui.t('materialNamePlaceholder')}">
            </div>
            <div class="form-group">
                <label for="newMaterialCapacity">${ui.t('mktCapacity')} *</label>
                <input type="number" id="newMaterialCapacity" placeholder="${ui.t('mktCapacityPlaceholder')}" min="0" required>
            </div>
            <button class="btn-success" onclick="addMaterial()"><i class="fa-solid fa-plus"></i> ${ui.t('btnAddMaterial')}</button>
        </div>

        <!-- Recently Added Materials Preview -->
        <div class="card recently-added-card" id="recentlyAddedCard" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;">
                    <i class="fa-solid fa-clock-rotate-left"></i> ${ui.t('recentlyAddedTitle') || 'Recently Added Materials'}
                    <span class="recently-added-badge" id="recentlyAddedCount">0</span>
                </h2>
                <button class="btn-secondary btn-small" onclick="ui.clearRecentlyAdded()">
                    <i class="fa-solid fa-broom"></i> ${ui.t('btnClearList') || 'Clear List'}
                </button>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 15px; font-size: 0.9em;">
                <i class="fa-solid fa-info-circle"></i> ${ui.t('recentlyAddedDescription') || 'Materials added in this session. Review for accuracy before continuing.'}
            </p>
            <div id="recentlyAddedList" class="recently-added-list"></div>
        </div>

        <div class="card">
            <h2><i class="fa-solid fa-file-arrow-up"></i> ${ui.t('bulkImportTitle')} / ${ui.t('bulkExportTitle')}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">${ui.t('bulkImportExportDesc')}</p>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px;">
                <div style="flex: 1; min-width: 200px;">
                    <button class="btn-success" onclick="ui.exportMaterialsCSV()" style="width: 100%; padding: 15px;">
                        <i class="fa-solid fa-file-arrow-down"></i> ${ui.t('btnExportMaterials')}
                    </button>
                    <small style="color: var(--text-secondary); display: block; margin-top: 8px;">
                        ${ui.t('exportMaterialsDesc')}
                    </small>
                </div>
                <div style="flex: 1; min-width: 200px;">
                    <button class="btn-success" onclick="ui.exportFilteredMaterials()" style="width: 100%; padding: 15px;">
                        <i class="fa-solid fa-filter"></i> ${ui.t('btnExportFiltered')}
                    </button>
                    <small style="color: var(--text-secondary); display: block; margin-top: 8px;">
                        ${ui.t('exportFilteredDesc')}
                    </small>
                </div>
                <div style="flex: 1; min-width: 200px;">
                    <button class="btn-success" onclick="ui.exportMaterialsForSAP()" style="width: 100%; padding: 15px; background: #0078d4; border-color: #0078d4;">
                        <i class="fa-solid fa-file-export"></i> ${ui.t('btnExportSAP')}
                    </button>
                    <small style="color: var(--text-secondary); display: block; margin-top: 8px;">
                        ${ui.t('exportSAPDesc')}
                    </small>
                </div>
                <div style="flex: 1; min-width: 200px;">
                    <button class="btn-primary" onclick="document.getElementById('csvImportInput').click()" style="width: 100%; padding: 15px;">
                        <i class="fa-solid fa-file-arrow-up"></i> ${ui.t('btnImportMaterials')}
                    </button>
                    <input type="file" id="csvImportInput" accept=".csv,.json,.xlsx,.xls" style="display: none;" onchange="ui.importMaterialsFile(event)" multiple>
                    <small style="color: var(--text-secondary); display: block; margin-top: 8px;">
                        ${ui.t('importMaterialsDesc')}
                    </small>
                </div>
            </div>
        </div>

        <div class="card">
            <h2><i class="fa-solid fa-floppy-disk"></i> ${ui.t('backupTitle')}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">${ui.t('backupDescription')}</p>
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
                    <button class="btn-secondary" onclick="document.getElementById('backupFileInput').click()" style="width: 100%; padding: 15px;">
                        <i class="fa-solid fa-file-arrow-up"></i> ${ui.t('btnImportData')}
                    </button>
                    <input type="file" id="backupFileInput" accept=".json" style="display: none;" onchange="ui.importData(event)">
                    <small style="color: var(--text-secondary); display: block; margin-top: 8px;">
                        ${ui.t('backupImportDesc')}
                    </small>
                </div>
            </div>
        </div>

        <!-- Groups Management -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;"><i class="fa-solid fa-tags"></i> ${ui.t('groupsTitle') || 'Material Groups'}</h2>
                <button class="btn-primary btn-small" onclick="ui.showGroupModal()">
                    <i class="fa-solid fa-plus"></i> ${ui.t('btnCreateGroup') || 'Create Group'}
                </button>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 15px;">
                ${ui.t('groupsDescription') || 'Organize materials into groups for easier management and filtering.'}
            </p>
            <div id="groupsGrid"></div>
        </div>

        <!-- User Notes -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;"><i class="fa-solid fa-note-sticky"></i> ${ui.t('notesTitle')}</h2>
                <button class="btn-primary btn-small" onclick="ui.showAddNoteModal()">
                    <i class="fa-solid fa-plus"></i> ${ui.t('addNote')}
                </button>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 15px;">
                ${ui.t('notesDescription')}
            </p>
            <div id="notesListContainer">
                <div id="notesList"></div>
            </div>
        </div>

        <div class="card undo-actions-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;"><i class="fa-solid fa-clock-rotate-left"></i> ${ui.t('undoTitle')}</h2>
                <div class="undo-action-buttons">
                    <button id="undoBtn" class="btn-secondary btn-undo" onclick="ui.undoAction()" title="${ui.t('undoDisabled')}">
                        <i class="fa-solid fa-rotate-left"></i> ${ui.t('btnUndo')}
                    </button>
                    <button id="redoBtn" class="btn-secondary btn-redo" onclick="ui.redoAction()" title="${ui.t('redoDisabled')}">
                        <i class="fa-solid fa-rotate-right"></i> ${ui.t('btnRedo')}
                    </button>
                </div>
            </div>
            <div class="undo-history-container">
                <div class="undo-status-bar">
                    <div class="status-item">
                        <i class="fa-solid fa-list-check"></i>
                        <span id="undoStatus" class="status-text">${ui.t('undoDisabled')}</span>
                    </div>
                    <div class="history-count">
                        <span id="historyCounter">0</span> <span style="font-size: 0.85em;">${ui.t('undoActionsAvailable') || 'actions'}</span>
                    </div>
                </div>
                <div id="undoHistoryList" class="undo-history-list"></div>
            </div>
        </div>

        <div class="card">
            <h2><i class="fa-solid fa-filter"></i> ${ui.t('filterTitle')}</h2>
            <div id="filterControls" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div class="form-group">
                    <label for="filterCapacityMin">${ui.t('filterCapacityMin')}</label>
                    <input type="number" id="filterCapacityMin" min="0" placeholder="0">
                </div>
                <div class="form-group">
                    <label for="filterCapacityMax">${ui.t('filterCapacityMax')}</label>
                    <input type="number" id="filterCapacityMax" min="0" placeholder="999">
                </div>
                <div class="form-group">
                    <label for="filterPromoStatus">${ui.t('filterByPromo')}</label>
                    <select id="filterPromoStatus">
                        <option value="all">${ui.t('filterPromoAll')}</option>
                        <option value="active">${ui.t('filterPromoActive')}</option>
                        <option value="inactive">${ui.t('filterPromoInactive')}</option>
                        <option value="none">${ui.t('filterPromoNone')}</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="filterGroup">${ui.t('materialGroup')}</label>
                    <select id="filterGroup">
                        <option value="all">${ui.t('groupAll')}</option>
                        <option value="ungrouped">${ui.t('groupUngrouped')}</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-primary" onclick="ui.applyMaterialsFilter()"><i class="fa-solid fa-filter"></i> ${ui.t('btnApplyFilter')}</button>
                <button class="btn-secondary" onclick="ui.clearMaterialsFilter()"><i class="fa-solid fa-rotate"></i> ${ui.t('btnClearFilter')}</button>
            </div>
        </div>

        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;">${ui.t('materialsListTitle')}</h2>
                <button class="btn-danger btn-small" onclick="ui.clearAllMaterials()" style="padding: 8px 16px;">
                    <i class="fa-solid fa-trash-can"></i> ${ui.t('btnClearAllMaterials')}
                </button>
            </div>
            
            <!-- Bulk Actions Toolbar (hidden by default) -->
            <div id="bulkActionsToolbar" class="bulk-actions-toolbar" style="display: none;">
                <div class="bulk-actions-info">
                    <span id="bulkSelectedCount">0</span> ${ui.t('itemsSelected')}
                </div>
                <div class="bulk-actions-buttons">
                    <button class="btn-primary btn-small" onclick="ui.showBulkEditModal()">
                        <i class="fa-solid fa-pen-to-square"></i> ${ui.t('btnBulkEdit')}
                    </button>
                    <button class="btn-danger btn-small" onclick="ui.bulkDeleteMaterials()">
                        <i class="fa-solid fa-trash-can"></i> ${ui.t('btnBulkDelete')}
                    </button>
                    <button class="btn-secondary btn-small" onclick="ui.clearBulkSelection()">
                        <i class="fa-solid fa-xmark"></i> ${ui.t('btnClearSelection')}
                    </button>
                </div>
            </div>
            
            <div id="materialsListContainer">
                <table id="materialsTable" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th style="width: 40px;">
                                <input type="checkbox" id="selectAllMaterials" onchange="ui.toggleSelectAll()" title="${ui.t('selectAll')}">
                            </th>
                            <th>${ui.t('colMaterialCode')}</th>
                            <th>${ui.t('colMaterialName')}</th>
                            <th>${ui.t('colMKTCapacity')}</th>
                            <th>${ui.t('colPromoStatus')}</th>
                            <th>${ui.t('materialGroup') || 'Group'}</th>
                            <th>${ui.t('colCreated')}</th>
                            <th>${ui.t('colActions')}</th>
                        </tr>
                    </thead>
                    <tbody id="materialsTableBody">
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Floating Action Button -->
        <button class="fab" onclick="ui.openAddModal()" title="${ui.t('btnAddMaterial')}" aria-label="${ui.t('btnAddMaterial')}">
            <i class="fa-solid fa-plus"></i>
        </button>
    `;
    
    // Render materials list and notes
    if (ui && ui.renderMaterialsList) {
        setTimeout(() => {
            ui.renderMaterialsList();
            ui.renderNotesList();
            ui.renderGroupsList();
            ui.populateFilterGroupDropdown(); // Populate filter dropdown
        }, 100);
    }
}

// Render Material Modal Content
function renderMaterialModal() {
    const modal = document.getElementById('materialModal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="materialModalTitle">${ui.t('modalAddTitle')}</h2>
                <button class="modal-close" onclick="ui.closeMaterialModal()">×</button>
            </div>

            <div class="form-group">
                <label for="modalMaterialCode">${ui.t('materialCode')} *</label>
                <input type="text" id="modalMaterialCode" placeholder="${ui.t('materialCodePlaceholder')}" required>
            </div>
            <div class="form-group">
                <label for="modalMaterialName">${ui.t('materialName')}</label>
                <input type="text" id="modalMaterialName" placeholder="${ui.t('materialNamePlaceholder')}">
                <small style="color: var(--text-secondary); font-size: 0.85em;">${ui.t('materialNameOptional')} - ${ui.t('helpsIdentifyMaterial')}</small>
            </div>
            <div class="form-group">
                <label for="modalMaterialCapacity">${ui.t('mktCapacity')} *</label>
                <input type="number" id="modalMaterialCapacity" placeholder="${ui.t('mktCapacityPlaceholder')}" min="0" required>
                <small style="color: var(--text-secondary); font-size: 0.85em;">${ui.t('mktCapacityHelp')}</small>
            </div>
            <div class="form-group">
                <label for="modalMaterialGroup">${ui.t('materialGroup')}</label>
                <select id="modalMaterialGroup">
                    <option value="">${ui.t('groupUngrouped')}</option>
                </select>
            </div>

            <!-- Promotional Section -->
            <div class="promo-section">
                <h3 style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px; color: var(--text-color);">
                    <i class="fa-solid fa-gift"></i> ${ui.t('promoTitle')}
                </h3>
                
                <div class="form-group">
                    <label for="modalPromoCapacity">${ui.t('promoCapacity')}</label>
                    <input type="number" id="modalPromoCapacity" placeholder="${ui.t('promoCapacityPlaceholder')}" min="0">
                    <small style="color: var(--text-secondary); font-size: 0.85em;">${ui.t('promoCapacityHelp')}</small>
                </div>

                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="modalPromoActive" class="promo-checkbox">
                        <span><i class="fa-solid fa-fire"></i> ${ui.t('promoActive')}</span>
                    </label>
                    <small style="color: var(--text-secondary); font-size: 0.85em; display: block; margin-top: 5px;">
                        ${ui.t('promoActiveHelp')}
                    </small>
                </div>

                <div class="form-group">
                    <label for="modalPromoEndDate">${ui.t('promoEndDate')}</label>
                    <input type="date" id="modalPromoEndDate">
                    <small style="color: var(--text-secondary); font-size: 0.85em;">${ui.t('promoEndDateHelp')}</small>
                </div>
            </div>

            <div class="button-group">
                <button class="btn-success" onclick="ui.saveMaterialModal()"><i class="fa-solid fa-floppy-disk"></i> <span id="modalSaveButtonText">${ui.t('btnSave')}</span></button>
                <button class="btn-secondary" onclick="ui.closeMaterialModal()">
                    <i class="fa-solid fa-xmark"></i> ${ui.t('btnCancel')}
                </button>
            </div>
        </div>
    `;
}

// Add new material (from materials tab form)
UIManager.prototype.addMaterial = function() {
    const code = document.getElementById('newMaterialCode').value.trim();
    const name = document.getElementById('newMaterialName').value.trim();
    const capacity = document.getElementById('newMaterialCapacity').value.trim();

    // Client-side validation
    if (!code) {
        this.showToast('Material code is required', 'error');
        document.getElementById('newMaterialCode').focus();
        return;
    }
    
    if (!capacity) {
        this.showToast('Capacity is required', 'error');
        document.getElementById('newMaterialCapacity').focus();
        return;
    }
    
    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum < 0) {
        this.showToast('Capacity must be a valid number greater than or equal to 0', 'error');
        document.getElementById('newMaterialCapacity').focus();
        return;
    }

    try {
        this.dataManager.addMaterial(
            code,
            capacity,
            name,
            null, // promoCapacity
            false, // promoActive
            null // promoEndDate
        );

        // Add to recently added list for live preview
        const material = {
            code: code,
            name: name,
            capacity: capacityNum,
            promoCapacity: null,
            promoActive: false,
            promoEndDate: null,
            group: null
        };
        this.addToRecentlyAdded(material);

        // Clear form
        document.getElementById('newMaterialCode').value = '';
        document.getElementById('newMaterialName').value = '';
        document.getElementById('newMaterialCapacity').value = '';

        // Focus back on code input for continuous entry
        document.getElementById('newMaterialCode').focus();

        // Refresh list
        this.renderMaterialsList();

        this.showToast(`<i class="fa-solid fa-plus"></i> Material ${code} added successfully! Capacity set to ${capacity}.`, 'success', 'Added');
    } catch (error) {
        this.showToast('Error adding material: ' + error.message, 'error');
    }
};

// Render materials list
UIManager.prototype.renderMaterialsList = function() {
    const materials = this.dataManager.getAllMaterials();
    const tbody = document.getElementById('materialsTableBody');
    
    // Destroy existing DataTable if it exists
    if ($.fn.DataTable.isDataTable('#materialsTable')) {
        $('#materialsTable').DataTable().destroy();
    }

    if (materials.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);"><div class="empty-state-icon" style="font-size: 3em; margin-bottom: 10px;"><i class="fa-solid fa-boxes-stacked"></i></div><p>${this.t('materialsEmpty')}</p></td></tr>`;
        return;
    }

    // Populate table body
    tbody.innerHTML = materials.map(material => {
        const createdDate = new Date(material.createdAt).toLocaleDateString();
        const updatedDate = material.updatedAt ? new Date(material.updatedAt).toLocaleDateString() : '';
        const dateDisplay = updatedDate && updatedDate !== createdDate 
            ? `${createdDate}<br><small style="color: var(--text-secondary);">${this.t('updated')}: ${updatedDate}</small>`
            : createdDate;
        
        // Check if promotion is active and not expired
        let isPromoActive = material.promoActive;
        
        if (isPromoActive && material.promoEndDate) {
            const endDate = new Date(material.promoEndDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (endDate < today) {
                isPromoActive = false;
            }
        }

        // Promotional status display
        const promoStatusHtml = material.promoCapacity 
            ? (isPromoActive 
                ? `<span class="promo-status-badge active"><i class="fa-solid fa-gift"></i> ${this.t('promoActive')}<br><small style="font-size: 0.8em;">${material.promoCapacity} capacity</small></span>`
                : `<span class="promo-status-badge inactive">${this.t('promoInactive')}<br><small style="font-size: 0.8em;">${material.promoCapacity} capacity</small></span>`)
            : '<span style="color: var(--text-secondary);">—</span>';

        // Capacity display with promo info
        const capacityHtml = material.promoCapacity && isPromoActive
            ? `<span style="font-weight: 600; color: var(--warning-color);">${material.promoCapacity}</span> <small style="color: var(--text-secondary);">(${this.t('normal')}: ${material.capacity})</small>`
            : `<span style="font-weight: 600; color: var(--success-color);">${material.capacity}</span>`;
        
        // Group badge display
        let groupHtml = '<span style="color: var(--text-secondary);">—</span>';
        if (material.group) {
            const group = this.dataManager.getGroup(material.group);
            if (group) {
                groupHtml = `<span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.85em; font-weight: 600; background: ${group.color || '#3b82f6'}20; color: ${group.color || '#3b82f6'}; border: 1px solid ${group.color || '#3b82f6'};">
                    <i class="fa-solid fa-tag"></i> ${group.name}
                </span>`;
            }
        }
        
        return `
            <tr data-material-code="${material.code}">
                <td>
                    <input type="checkbox" class="material-select-checkbox" data-material-code="${material.code}" onchange="ui.toggleMaterialSelection('${material.code}')">
                </td>
                <td><strong>${material.code}</strong></td>
                <td>${material.name || '<span style="color: var(--text-secondary);">—</span>'}</td>
                <td>${capacityHtml}</td>
                <td>${promoStatusHtml}</td>
                <td>${groupHtml}</td>
                <td style="font-size: 0.9em;">${dateDisplay}</td>
                <td>
                    <button class="btn-primary btn-small" onclick="ui.openEditModal('${material.code}')" style="margin-right: 5px;"><i class="fa-solid fa-pen-to-square"></i> ${this.t('btnEdit')}</button>
                    <button class="btn-danger btn-small" onclick="ui.deleteMaterial('${material.code}')"><i class="fa-solid fa-trash-can"></i> ${this.t('btnDelete')}</button>
                </td>
            </tr>
        `;
    }).join('');

    // Initialize DataTable
    $('#materialsTable').DataTable({
        pageLength: 10,
        order: [[1, 'asc']], // Sort by material code (now column 1 due to checkbox column)
        language: {
            search: `<i class="fa-solid fa-magnifying-glass"></i> ${this.t('dtSearchMaterials')}`,
            lengthMenu: this.t('dtLengthMenuMaterials'),
            info: this.t('dtInfoMaterials'),
            infoEmpty: this.t('dtInfoEmptyMaterials'),
            infoFiltered: this.t('dtInfoFilteredMaterials'),
            zeroRecords: this.t('dtZeroRecordsMaterials'),
            paginate: {
                first: this.t('dtFirst'),
                last: this.t('dtLast'),
                next: this.t('dtNext'),
                previous: this.t('dtPrevious')
            }
        },
        dom: '<"top"lf>rt<"bottom"ip><"clear">',
        columnDefs: [
            { orderable: false, targets: [0, 7] } // Disable sorting on checkbox and Actions columns
        ]
    });
    
    // Update sync status display
    this.updateSyncStatus();
};

// Update IndexedDB sync status display
UIManager.prototype.updateSyncStatus = async function() {
    const container = document.getElementById('syncStatusContainer');
    if (!container) return;

    try {
        const status = await this.dataManager.getSyncStatus();
        
        if (!status.available) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--card-bg); border-radius: 8px; border-left: 3px solid var(--warning-color);">
                    <span style="font-size: 1.5em;"><i class="fa-solid fa-triangle-exclamation"></i></span>
                    <div>
                        <div style="font-weight: 600; color: var(--warning-color);">${this.t('syncStatusInactive')}</div>
                        <small style="color: var(--text-secondary);">${status.message}</small>
                    </div>
                </div>
            `;
            return;
        }

        const materialsSync = status.metadata.materials;
        const archiveSync = status.metadata.archive;
        
        const formatDate = (isoString) => {
            if (!isoString) return 'Never';
            const date = new Date(isoString);
            return date.toLocaleString();
        };

        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--card-bg); border-radius: 8px; border-left: 3px solid var(--success-color);">
                <span style="font-size: 1.5em;"><i class="fa-solid fa-circle-check"></i></span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--success-color);">${this.t('syncStatusActive')}</div>
                    <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                        ${this.t('syncLastMaterials')}: ${formatDate(materialsSync?.timestamp)} 
                        (${materialsSync?.count || 0} items)
                    </small>
                    <small style="color: var(--text-secondary); display: block;">
                        ${this.t('syncLastArchive')}: ${formatDate(archiveSync?.timestamp)} 
                        (${archiveSync?.count || 0} items)
                    </small>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error updating sync status:', error);
        container.innerHTML = `
            <small style="color: var(--error-color);">${ui.t('errorLoadingSyncStatus')}</small>
        `;
    }
};

// ================== NEW FEATURE METHODS ==================

// Export materials as CSV
UIManager.prototype.exportMaterialsCSV = function() {
    try {
        const result = this.dataManager.exportMaterialsCSV();
        if (result.success) {
            this.showToast(`<i class="fa-solid fa-file-arrow-down"></i> ${result.count} materials exported successfully!`, 'success', this.t('exportSuccess'));
        }
    } catch (error) {
        this.showToast('Error exporting materials: ' + error.message, 'error');
    }
};

// Export materials for SAP import (Material Numbers only)
UIManager.prototype.exportMaterialsForSAP = function() {
    try {
        const result = this.dataManager.exportMaterialsForSAP();
        if (result.success) {
            this.showToast(`<i class="fa-solid fa-file-export"></i> ${result.count} ${this.t('sapExportSuccess')}`, 'success', this.t('exportSuccess'));
        }
    } catch (error) {
        this.showToast('Error exporting materials for SAP: ' + error.message, 'error');
    }
};

// Import materials from file
UIManager.prototype.importMaterialsFile = function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Show loading if multiple files
    if (files.length > 1) {
        this.showLoading(`Processing ${files.length} files...`);
    }

    const results = {
        totalImported: 0,
        totalErrors: [],
        filesProcessed: 0,
        filesFailed: 0
    };

    const processFile = (file, index) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    let content = e.target.result;
                    let result;
                    
                    // Handle JSON files
                    if (file.name.match(/\.json$/i)) {
                        result = this.dataManager.importMaterialsFromJSON(content);
                    }
                    // Handle Excel files using SheetJS if available
                    else if (file.name.match(/\.(xlsx|xls)$/i) && typeof XLSX !== 'undefined') {
                        const workbook = XLSX.read(content, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        content = XLSX.utils.sheet_to_csv(worksheet);
                        result = this.dataManager.importMaterialsFromCSV(content);
                    }
                    // Handle CSV files
                    else {
                        result = this.dataManager.importMaterialsFromCSV(content);
                    }
                    
                    if (result.success) {
                        results.totalImported += result.imported;
                        results.filesProcessed++;
                        if (result.errors && result.errors.length > 0) {
                            results.totalErrors.push(...result.errors.map(err => `${file.name}: ${err}`));
                        }
                    } else {
                        results.filesFailed++;
                        results.totalErrors.push(`${file.name}: ${result.error}`);
                    }
                    
                    resolve();
                } catch (error) {
                    results.filesFailed++;
                    results.totalErrors.push(`${file.name}: ${error.message}`);
                    resolve();
                }
            };
            
            reader.onerror = () => {
                results.filesFailed++;
                results.totalErrors.push(`${file.name}: Error reading file`);
                resolve();
            };
            
            if (file.name.match(/\.(xlsx|xls)$/i)) {
                reader.readAsBinaryString(file);
            } else {
                reader.readAsText(file);
            }
        });
    };

    // Process all files
    const filePromises = Array.from(files).map((file, index) => processFile(file, index));
    
    Promise.all(filePromises).then(() => {
        this.hideLoading();
        
        // Show results
        let message = `<i class="fa-solid fa-file-arrow-up"></i> Batch Import Complete:<br>`;
        message += `${results.totalImported} materials imported from ${results.filesProcessed} file(s)`;
        
        if (results.filesFailed > 0) {
            message += `<br>${results.filesFailed} file(s) failed`;
        }
        
        if (results.totalErrors.length > 0) {
            message += `<br>${results.totalErrors.length} error(s) encountered`;
            console.warn('Import errors:', results.totalErrors);
        }
        
        const toastType = results.filesFailed > 0 || results.totalErrors.length > 0 ? 'warning' : 'success';
        this.showToast(message, toastType, this.t('importSuccess'));
        
        if (results.totalImported > 0) {
            this.renderMaterialsList();
            this.updateUndoRedoButtons();
        }
    });
    
    // Clear the input
    event.target.value = '';
};

// Undo last action
UIManager.prototype.undoAction = function() {
    const result = this.dataManager.undo();
    if (result.success) {
        this.showToast(result.message, 'success', this.t('undoSuccess'));
        this.renderMaterialsList();
    } else {
        this.showToast(result.message, 'warning');
    }
    this.updateUndoRedoButtons();
};

// Redo last undone action
UIManager.prototype.redoAction = function() {
    const result = this.dataManager.redo();
    if (result.success) {
        this.showToast(result.message, 'success', this.t('redoSuccess'));
        this.renderMaterialsList();
    } else {
        this.showToast(result.message, 'warning');
    }
    this.updateUndoRedoButtons();
};

// Update undo/redo button states
UIManager.prototype.updateUndoRedoButtons = function() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const undoStatus = document.getElementById('undoStatus');
    const historyCounter = document.getElementById('historyCounter');
    const undoHistoryList = document.getElementById('undoHistoryList');
    
    if (!undoBtn || !redoBtn) return;
    
    const canUndo = this.dataManager.canUndo();
    const canRedo = this.dataManager.canRedo();
    const actionHistory = this.dataManager.actionHistory || [];
    const currentIndex = this.dataManager.currentHistoryIndex;
    
    // Update undo button
    undoBtn.disabled = !canUndo;
    undoBtn.title = canUndo ? this.t('btnUndo') : this.t('undoDisabled');
    undoBtn.classList.toggle('btn-disabled', !canUndo);
    undoBtn.style.opacity = canUndo ? '1' : '0.5';
    
    // Update redo button
    redoBtn.disabled = !canRedo;
    redoBtn.title = canRedo ? this.t('btnRedo') : this.t('redoDisabled');
    redoBtn.classList.toggle('btn-disabled', !canRedo);
    redoBtn.style.opacity = canRedo ? '1' : '0.5';
    
    // Update status text
    if (undoStatus) {
        if (canUndo) {
            const lastAction = actionHistory[currentIndex];
            undoStatus.textContent = this.getActionDescription(lastAction);
            undoStatus.style.color = 'var(--primary-color)';
            undoStatus.style.fontWeight = '600';
        } else {
            undoStatus.textContent = this.t('undoDisabled');
            undoStatus.style.color = 'var(--text-secondary)';
            undoStatus.style.fontWeight = '400';
        }
    }
    
    // Update history counter
    if (historyCounter) {
        const availableActions = currentIndex + 1;
        historyCounter.textContent = availableActions;
        historyCounter.style.color = availableActions > 0 ? 'var(--success-color)' : 'var(--text-secondary)';
        historyCounter.style.fontWeight = '700';
    }
    
    // Update history list
    if (undoHistoryList) {
        this.renderUndoHistory(undoHistoryList, actionHistory, currentIndex);
    }
};

// Render undo action history
UIManager.prototype.renderUndoHistory = function(container, actionHistory, currentIndex) {
    if (actionHistory.length === 0) {
        container.innerHTML = `
            <div class="history-empty">
                <i class="fa-regular fa-circle-check"></i>
                <span>${this.t('undoDisabled')}</span>
            </div>
        `;
        return;
    }
    
    // Show last 5 actions (most recent first)
    const visibleActions = actionHistory.slice(Math.max(0, currentIndex - 4), currentIndex + 1).reverse();
    
    container.innerHTML = visibleActions.map((action, index) => {
        const actualIndex = currentIndex - index;
        const isCurrent = actualIndex === currentIndex;
        const timeAgo = this.getTimeAgo(action.timestamp);
        const description = this.getActionDescription(action);
        const icon = this.getActionIcon(action.type);
        
        return `
            <div class="history-item ${isCurrent ? 'current' : ''}">
                <div class="history-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="history-content">
                    <div class="history-description">${description}</div>
                    <div class="history-time">${timeAgo}</div>
                </div>
                ${isCurrent ? '<span class="history-badge">' + this.t('undoJustNow').split(' ')[0] + '</span>' : ''}
            </div>
        `;
    }).join('');
};

// Get action description
UIManager.prototype.getActionDescription = function(action) {
    if (!action) return '';
    
    const actionType = action.type ? action.type.toUpperCase() : '';
    
    switch (actionType) {
        case 'ADD':
        case 'ADD_MATERIAL':
            const addCode = action.data?.material?.code || action.data?.code || 'Material';
            return `${this.t('undoActionAdd')}: ${addCode}`;
        case 'EDIT':
        case 'EDIT_MATERIAL':
            const editCode = action.data?.newMaterial?.code || action.data?.newData?.code || action.data?.oldData?.code || 'Material';
            return `${this.t('undoActionEdit')}: ${editCode}`;
        case 'DELETE':
        case 'DELETE_MATERIAL':
            const deleteCode = action.data?.material?.code || action.data?.code || 'Material';
            return `${this.t('undoActionDelete')}: ${deleteCode}`;
        case 'BULKIMPORT':
        case 'BULK_IMPORT':
            const count = action.data?.materials?.length || action.data?.imported?.length || 0;
            return `${this.t('undoActionBulkImport')}: ${count} materials`;
        case 'CLEARALL':
        case 'CLEAR_ALL':
            return `${this.t('undoActionClearAll')}`;
        default:
            return action.type || 'Unknown action';
    }
};

// Get action icon
UIManager.prototype.getActionIcon = function(actionType) {
    const type = actionType ? actionType.toUpperCase() : '';
    
    switch (type) {
        case 'ADD':
        case 'ADD_MATERIAL':
            return 'fa-solid fa-plus-circle';
        case 'EDIT':
        case 'EDIT_MATERIAL':
            return 'fa-solid fa-pen-to-square';
        case 'DELETE':
        case 'DELETE_MATERIAL':
            return 'fa-solid fa-trash-can';
        case 'BULKIMPORT':
        case 'BULK_IMPORT':
            return 'fa-solid fa-file-import';
        case 'CLEARALL':
        case 'CLEAR_ALL':
            return 'fa-solid fa-broom';
        default:
            return 'fa-solid fa-circle';
    }
};

// Get time ago string
UIManager.prototype.getTimeAgo = function(timestamp) {
    if (!timestamp) return this.t('undoJustNow');
    
    const now = Date.now();
    const actionTime = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    const diff = now - actionTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    // Check if diff is valid
    if (isNaN(diff) || diff < 0) {
        return this.t('undoJustNow');
    }
    
    if (minutes < 1) {
        return this.t('undoJustNow');
    } else if (minutes < 60) {
        return this.t('undoMinutesAgo').replace('{{minutes}}', minutes);
    } else {
        return this.t('undoHoursAgo').replace('{{hours}}', hours);
    }
};

// Apply materials filter
UIManager.prototype.applyMaterialsFilter = function() {
    const capacityMin = document.getElementById('filterCapacityMin').value;
    const capacityMax = document.getElementById('filterCapacityMax').value;
    const promoStatus = document.getElementById('filterPromoStatus').value;
    const group = document.getElementById('filterGroup').value;
    
    // Get DataTable instance
    const table = $('#materialsTable').DataTable();
    
    // Remove any existing custom filters
    $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(search => {
        return search.toString().indexOf('materialsTable') === -1;
    });
    
    // Apply custom filtering
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        if (settings.nTable.id !== 'materialsTable') {
            return true; // Don't filter other tables
        }
        
        const capacity = parseInt(data[2].replace(/[^0-9]/g, '')) || 0; // Extract capacity number
        const promoColumn = data[4]; // Promo status column
        
        // Get material code from row
        const row = settings.aoData[dataIndex];
        const materialCode = $(row.nTr).data('material-code');
        const material = ui.dataManager.getMaterial(materialCode);
        
        // Capacity filter
        if (capacityMin && capacity < parseInt(capacityMin)) return false;
        if (capacityMax && capacity > parseInt(capacityMax)) return false;
        
        // Promo status filter
        if (promoStatus !== 'all') {
            if (promoStatus === 'active' && !promoColumn.includes('fa-gift')) return false;
            if (promoStatus === 'inactive' && promoColumn.includes('fa-gift') && !promoColumn.includes('Inactive')) return false;
            if (promoStatus === 'none' && promoColumn.includes('capacity')) return false;
        }
        
        // Group filter
        if (group !== 'all') {
            if (group === 'ungrouped') {
                // Show only materials without a group
                if (material && material.group) return false;
            } else {
                // Show only materials in the selected group
                if (!material || material.group !== group) return false;
            }
        }
        
        return true;
    });
    
    table.draw();
    this.showToast('Filters applied', 'info');
};

// Clear materials filter
UIManager.prototype.clearMaterialsFilter = function() {
    // Clear filter inputs
    document.getElementById('filterCapacityMin').value = '';
    document.getElementById('filterCapacityMax').value = '';
    document.getElementById('filterPromoStatus').value = 'all';
    document.getElementById('filterGroup').value = 'all';
    
    // Remove custom filters for this table
    $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(search => {
        return search.toString().indexOf('materialsTable') === -1;
    });
    
    // Redraw table
    const table = $('#materialsTable').DataTable();
    table.draw();
    
    this.showToast('Filters cleared', 'info');
};

// Quick filter materials by group (used from group cards)
UIManager.prototype.filterByGroup = function(groupId) {
    // Scroll to filter section
    const filterCard = document.querySelector('.card');
    if (filterCard) {
        filterCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Clear other filters
    document.getElementById('filterCapacityMin').value = '';
    document.getElementById('filterCapacityMax').value = '';
    document.getElementById('filterPromoStatus').value = 'all';
    
    // Set group filter
    document.getElementById('filterGroup').value = groupId;
    
    // Apply the filter
    setTimeout(() => {
        this.applyMaterialsFilter();
        
        const group = this.dataManager.getGroup(groupId);
        if (group) {
            this.showToast(`Showing materials in group: ${group.name}`, 'info');
        }
    }, 300);
};

// Populate group dropdown in modal
UIManager.prototype.populateGroupDropdown = function() {
    const select = document.getElementById('modalMaterialGroup');
    if (!select) return;
    
    // Clear existing options except first one
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Add groups
    const groups = this.dataManager.getAllGroups();
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        select.appendChild(option);
    });
};

// Populate filter group dropdown
UIManager.prototype.populateFilterGroupDropdown = function() {
    const select = document.getElementById('filterGroup');
    if (!select) return;
    
    // Clear existing options except first two (All and Ungrouped)
    while (select.children.length > 2) {
        select.removeChild(select.lastChild);
    }
    
    // Add groups with color indicators
    const groups = this.dataManager.getAllGroups();
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = `■ ${group.name}`;
        option.style.color = group.color || '#3b82f6';
        select.appendChild(option);
    });
};

// ========================
// Group Management
// ========================

// Render groups list
UIManager.prototype.renderGroupsList = function() {
    const container = document.getElementById('groupsGrid');
    if (!container) return;
    
    const groups = this.dataManager.getAllGroups();
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <div style="font-size: 3em; margin-bottom: 10px;"><i class="fa-solid fa-tags"></i></div>
                <p>No groups created yet. Create your first group to organize materials.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
            ${groups.map(group => {
                const materialCount = this.dataManager.getMaterialsByGroup(group.id).length;
                const groupColor = group.color || '#3b82f6';
                return `
                    <div class="group-card" style="
                        background: ${groupColor}10; 
                        border: 2px solid ${groupColor}; 
                        border-radius: 12px; 
                        padding: 20px;
                        transition: transform 0.2s, box-shadow 0.2s;
                        cursor: pointer;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px ${groupColor}40';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                            <div style="
                                width: 50px; 
                                height: 50px; 
                                border-radius: 10px; 
                                background: ${groupColor}; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center;
                                color: white;
                                font-size: 1.5em;
                            ">
                                <i class="fa-solid fa-tag"></i>
                            </div>
                            <div style="flex: 1;">
                                <h4 style="margin: 0; color: ${groupColor}; font-size: 1.1em;">${group.name}</h4>
                                <small style="color: var(--text-secondary);">
                                    <i class="fa-solid fa-boxes-stacked"></i> ${materialCount} material${materialCount !== 1 ? 's' : ''}
                                </small>
                            </div>
                        </div>
                        ${group.description ? `<p style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 15px; padding-left: 62px;">${group.description}</p>` : ''}
                        <div style="display: flex; gap: 8px; justify-content: space-between; padding-top: 10px; border-top: 1px solid ${groupColor}30;">
                            <button class="btn-small" onclick="event.stopPropagation(); ui.filterByGroup('${group.id}')" style="background: ${groupColor}20; color: ${groupColor}; border: 1px solid ${groupColor}; flex: 1;">
                                <i class="fa-solid fa-filter"></i> ${this.t('viewMaterials') || 'View Materials'} (${materialCount})
                            </button>
                            <button class="btn-primary btn-small" onclick="event.stopPropagation(); ui.editGroup('${group.id}')" style="background: ${groupColor}; border-color: ${groupColor};">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn-danger btn-small" onclick="event.stopPropagation(); ui.deleteGroup('${group.id}')">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                        <div style="font-size: 0.75em; color: var(--text-secondary); margin-top: 10px; text-align: right;">
                            ${this.t('created')}: ${new Date(group.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
};

// Show group modal for creating/editing
UIManager.prototype.showGroupModal = function(groupId = null) {
    const isEdit = groupId !== null;
    const group = isEdit ? this.dataManager.getGroup(groupId) : null;
    
    const modalHtml = `
        <div class="modal active" id="groupModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${isEdit ? this.t('btnEditGroup') : this.t('btnCreateGroup')}</h2>
                    <button class="modal-close" onclick="ui.closeGroupModal()">×</button>
                </div>
                
                <div class="form-group">
                    <label for="groupName">${this.t('groupName')} *</label>
                    <input type="text" id="groupName" value="${group?.name || ''}" placeholder="${this.t('enterGroupName')}" required>
                </div>
                
                <div class="form-group">
                    <label for="groupColor">${this.t('groupColor') || 'Group Color'}</label>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                        ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'].map(color => `
                            <button 
                                type="button" 
                                class="color-option ${group?.color === color ? 'selected' : ''}" 
                                data-color="${color}"
                                onclick="ui.selectGroupColor('${color}')"
                                style="width: 40px; height: 40px; border-radius: 8px; background: ${color}; border: 3px solid ${group?.color === color ? 'var(--text-color)' : 'transparent'}; cursor: pointer; transition: all 0.2s;"
                                title="${color}">
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="groupColor" value="${group?.color || '#3b82f6'}">
                </div>
                
                <div class="form-group">
                    <label for="groupDescription">${this.t('descriptionOptional')}</label>
                    <textarea id="groupDescription" placeholder="${this.t('enterGroupDescription')}" rows="3">${group?.description || ''}</textarea>
                </div>
                
                <div class="button-group">
                    <button class="btn-success" onclick="ui.saveGroup('${groupId || ''}')">
                        <i class="fa-solid fa-floppy-disk"></i> ${isEdit ? this.t('btnSave') : this.t('btnCreateGroup')}
                    </button>
                    <button class="btn-secondary" onclick="ui.closeGroupModal()">
                        <i class="fa-solid fa-xmark"></i> ${this.t('btnCancel')}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('groupModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('groupName').focus();
};

// Select group color in modal
UIManager.prototype.selectGroupColor = function(color) {
    // Update hidden input
    document.getElementById('groupColor').value = color;
    
    // Update visual selection
    document.querySelectorAll('.color-option').forEach(btn => {
        if (btn.dataset.color === color) {
            btn.classList.add('selected');
            btn.style.border = '3px solid var(--text-color)';
        } else {
            btn.classList.remove('selected');
            btn.style.border = '3px solid transparent';
        }
    });
};

// Save group (create or edit)
UIManager.prototype.saveGroup = function(groupId) {
    const name = document.getElementById('groupName').value.trim();
    const description = document.getElementById('groupDescription').value.trim();
    const color = document.getElementById('groupColor').value;
    
    if (!name) {
        this.showToast('Group name is required', 'error');
        return;
    }
    
    let success = false;
    
    if (groupId) {
        // Edit existing group
        success = this.dataManager.updateGroup(groupId, { name, description, color });
        if (success) {
            this.showToast(`Group "${name}" updated successfully!`, 'success');
        }
    } else {
        // Create new group
        const newGroupId = this.dataManager.createGroup(name, description, color);
        if (newGroupId) {
            success = true;
            this.showToast(`Group "${name}" created successfully!`, 'success');
        }
    }
    
    if (success) {
        this.closeGroupModal();
        this.renderGroupsList();
        this.populateGroupDropdown(); // Update dropdowns
        this.populateFilterGroupDropdown(); // Update filter dropdown
    } else {
        this.showToast('Error saving group', 'error');
    }
};

// Edit group
UIManager.prototype.editGroup = function(groupId) {
    this.showGroupModal(groupId);
};

// Delete group
UIManager.prototype.deleteGroup = async function(groupId) {
    const group = this.dataManager.getGroup(groupId);
    if (!group) return;
    
    const materialCount = this.dataManager.getMaterialsByGroup(groupId).length;
    
    let message;
    if (materialCount > 0) {
        message = this.t('deleteGroupWithMaterialsMessage')
            .replace('{name}', group.name)
            .replace('{count}', materialCount);
    } else {
        message = this.t('deleteGroupMessage').replace('{name}', group.name);
    }
    
    const confirmed = await this.showDeleteModal(message);
    
    if (!confirmed) {
        return;
    }
    
    if (this.dataManager.deleteGroup(groupId)) {
        this.showToast(`Group "${group.name}" deleted successfully!`, 'success');
        this.renderGroupsList();
        this.renderMaterialsList(); // Update materials list to reflect changes
        this.populateGroupDropdown(); // Update dropdowns
    } else {
        this.showToast('Error deleting group', 'error');
    }
};

// Close group modal
UIManager.prototype.closeGroupModal = function() {
    const modal = document.getElementById('groupModal');
    if (modal) {
        modal.remove();
    }
};

// ========================
// Notes Management
// ========================

// Render notes list
UIManager.prototype.renderNotesList = function() {
    const container = document.getElementById('notesList');
    if (!container) return;
    
    const notes = this.dataManager.getAllNotes();
    
    if (notes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <div style="font-size: 3em; margin-bottom: 10px;"><i class="fa-solid fa-note-sticky"></i></div>
                <p>${this.t('noNotesYet')}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${notes.map(note => {
                const material = note.materialCode ? this.dataManager.getMaterial(note.materialCode) : null;
                const createdDate = new Date(note.createdAt).toLocaleString();
                const updatedDate = note.updatedAt && note.updatedAt !== note.createdAt 
                    ? new Date(note.updatedAt).toLocaleString() 
                    : null;
                
                return `
                    <div class="note-card" style="background: var(--card-bg); border: 2px solid var(--border-color); border-radius: 12px; padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            <div>
                                ${material ? `
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                        <span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 600;">
                                            <i class="fa-solid fa-boxes-stacked"></i> ${note.materialCode}
                                        </span>
                                        ${material.name ? `<span style="color: var(--text-secondary); font-size: 0.9em;">${material.name}</span>` : ''}
                                    </div>
                                ` : `
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                        <span style="background: var(--secondary-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 600;">
                                            <i class="fa-solid fa-clipboard"></i> ${this.t('generalNote')}
                                        </span>
                                    </div>
                                `}
                                <div style="font-size: 0.85em; color: var(--text-secondary);">
                                    ${this.t('created')}: ${createdDate}
                                    ${updatedDate ? `<br>${this.t('updatedLabel')}: ${updatedDate}` : ''}
                                </div>
                            </div>
                            <div>
                                <button class="btn-primary btn-small" onclick="ui.editNote('${note.id}')" style="margin-right: 5px;">
                                    <i class="fa-solid fa-pen-to-square"></i> ${this.t('btnEdit')}
                                </button>
                                <button class="btn-danger btn-small" onclick="ui.deleteNote('${note.id}')">
                                    <i class="fa-solid fa-trash-can"></i> ${this.t('btnDelete')}
                                </button>
                            </div>
                        </div>
                        <div style="background: var(--background-secondary); padding: 15px; border-radius: 8px; line-height: 1.6;">
                            ${note.content.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
};

// Show add note modal
UIManager.prototype.showAddNoteModal = function(materialCode = null) {
    const materials = this.dataManager.getAllMaterials();
    
    const modalHtml = `
        <div class="modal active" id="noteModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.t('addNote')}</h2>
                    <button class="modal-close" onclick="ui.closeNoteModal()">×</button>
                </div>
                
                <div class="form-group">
                    <label for="noteMaterial">${this.t('associatedMaterialOptional')}</label>
                    <select id="noteMaterial">
                        <option value="">${this.t('generalNote')}</option>
                        ${materials.map(material => `
                            <option value="${material.code}" ${materialCode === material.code ? 'selected' : ''}>
                                ${material.code} ${material.name ? `- ${material.name}` : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="noteContent">${this.t('noteContent')} *</label>
                    <textarea id="noteContent" placeholder="${this.t('notePlaceholder')}" rows="6" required></textarea>
                </div>
                
                <div class="button-group">
                    <button class="btn-success" onclick="ui.saveNote()">
                        <i class="fa-solid fa-floppy-disk"></i> ${this.t('addNote')}
                    </button>
                    <button class="btn-secondary" onclick="ui.closeNoteModal()">
                        <i class="fa-solid fa-xmark"></i> ${this.t('btnCancel')}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('noteModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('noteContent').focus();
};

// Edit note
UIManager.prototype.editNote = function(noteId) {
    const note = this.dataManager.getNote(noteId);
    if (!note) return;
    
    const materials = this.dataManager.getAllMaterials();
    
    const modalHtml = `
        <div class="modal active" id="noteModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.t('editNote')}</h2>
                    <button class="modal-close" onclick="ui.closeNoteModal()">×</button>
                </div>
                
                <div class="form-group">
                    <label for="noteMaterial">${this.t('associatedMaterialOptional')}</label>
                    <select id="noteMaterial">
                        <option value="">${this.t('generalNote')}</option>
                        ${materials.map(material => `
                            <option value="${material.code}" ${note.materialCode === material.code ? 'selected' : ''}>
                                ${material.code} ${material.name ? `- ${material.name}` : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="noteContent">${this.t('noteContent')} *</label>
                    <textarea id="noteContent" placeholder="${this.t('notePlaceholder')}" rows="6" required>${note.content}</textarea>
                </div>
                
                <div class="button-group">
                    <button class="btn-success" onclick="ui.saveNote('${noteId}')">
                        <i class="fa-solid fa-floppy-disk"></i> ${this.t('btnSave')}
                    </button>
                    <button class="btn-secondary" onclick="ui.closeNoteModal()">
                        <i class="fa-solid fa-xmark"></i> ${this.t('btnCancel')}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('noteModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('noteContent').focus();
};

// Save note
UIManager.prototype.saveNote = function(noteId = null) {
    const materialCode = document.getElementById('noteMaterial').value || null;
    const content = document.getElementById('noteContent').value.trim();
    
    if (!content) {
        this.showToast('Note content is required', 'error');
        return;
    }
    
    let success = false;
    
    if (noteId) {
        // Edit existing note
        success = this.dataManager.updateNote(noteId, { materialCode, content });
        if (success) {
            this.showToast('Note updated successfully!', 'success');
        }
    } else {
        // Create new note
        const newNoteId = this.dataManager.addNote(materialCode, content);
        if (newNoteId) {
            success = true;
            this.showToast('Note added successfully!', 'success');
        }
    }
    
    if (success) {
        this.closeNoteModal();
        this.renderNotesList();
    } else {
        this.showToast('Error saving note', 'error');
    }
};

// Delete note
UIManager.prototype.deleteNote = async function(noteId) {
    const note = this.dataManager.getNote(noteId);
    if (!note) return;
    
    const message = this.t('deleteNoteMessage');
    const confirmed = await this.showDeleteModal(message);
    
    if (!confirmed) {
        return;
    }
    
    if (this.dataManager.deleteNote(noteId)) {
        this.showToast('Note deleted successfully!', 'success');
        this.renderNotesList();
    } else {
        this.showToast('Error deleting note', 'error');
    }
};

// Close note modal
UIManager.prototype.closeNoteModal = function() {
    const modal = document.getElementById('noteModal');
    if (modal) {
        modal.remove();
    }
};

// ========================
// Bulk Operations
// ========================

// Toggle material selection
UIManager.prototype.toggleMaterialSelection = function(materialCode) {
    const checkbox = document.querySelector(`.material-select-checkbox[data-material-code="${materialCode}"]`);
    if (!checkbox) return;
    
    if (checkbox.checked) {
        this.selectedItems.add(materialCode);
    } else {
        this.selectedItems.delete(materialCode);
    }
    
    this.updateBulkActionsToolbar();
    this.updateSelectAllCheckbox();
};

// Toggle select all materials
UIManager.prototype.toggleSelectAll = function() {
    const selectAllCheckbox = document.getElementById('selectAllMaterials');
    const checkboxes = document.querySelectorAll('.material-select-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const materialCode = checkbox.getAttribute('data-material-code');
        
        if (selectAllCheckbox.checked) {
            this.selectedItems.add(materialCode);
        } else {
            this.selectedItems.delete(materialCode);
        }
    });
    
    this.updateBulkActionsToolbar();
};

// Update select all checkbox state
UIManager.prototype.updateSelectAllCheckbox = function() {
    const selectAllCheckbox = document.getElementById('selectAllMaterials');
    const checkboxes = document.querySelectorAll('.material-select-checkbox');
    const checkedCount = document.querySelectorAll('.material-select-checkbox:checked').length;
    
    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
};

// Update bulk actions toolbar
UIManager.prototype.updateBulkActionsToolbar = function() {
    const toolbar = document.getElementById('bulkActionsToolbar');
    const countSpan = document.getElementById('bulkSelectedCount');
    
    if (!toolbar || !countSpan) return;
    
    const count = this.selectedItems.size;
    countSpan.textContent = count;
    
    if (count > 0) {
        toolbar.style.display = 'flex';
    } else {
        toolbar.style.display = 'none';
    }
};

// Clear bulk selection
UIManager.prototype.clearBulkSelection = function() {
    this.selectedItems.clear();
    
    const checkboxes = document.querySelectorAll('.material-select-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    const selectAllCheckbox = document.getElementById('selectAllMaterials');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    
    this.updateBulkActionsToolbar();
};

// Show bulk edit modal
UIManager.prototype.showBulkEditModal = function() {
    if (this.selectedItems.size === 0) {
        this.showToast('Please select at least one material', 'warning');
        return;
    }
    
    const groups = this.dataManager.getAllGroups();
    
    const modalHtml = `
        <div class="modal active" id="bulkEditModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fa-solid fa-pen-to-square"></i> ${this.t('bulkEditTitle')}</h2>
                    <button class="modal-close" onclick="ui.closeBulkEditModal()">×</button>
                </div>
                
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    ${this.t('bulkEditDescription').replace('{count}', this.selectedItems.size)}
                </p>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="bulkEditCapacityToggle" onchange="ui.toggleBulkEditField('capacity')">
                        ${this.t('updateCapacity')}
                    </label>
                    <div id="bulkEditCapacityField" style="display: none; margin-top: 10px;">
                        <input type="number" id="bulkEditCapacity" min="0" placeholder="${this.t('newCapacity')}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="bulkEditPromoToggle" onchange="ui.toggleBulkEditField('promo')">
                        ${this.t('updatePromoCapacity')}
                    </label>
                    <div id="bulkEditPromoField" style="display: none; margin-top: 10px;">
                        <input type="number" id="bulkEditPromoCapacity" min="0" placeholder="${this.t('newPromoCapacity')}">
                        <label style="margin-top: 10px; display: block;">
                            <input type="checkbox" id="bulkEditPromoActive">
                            ${this.t('setPromoActive')}
                        </label>
                        <input type="date" id="bulkEditPromoEndDate" style="margin-top: 10px;" placeholder="${this.t('promoEndDate')}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="bulkEditGroupToggle" onchange="ui.toggleBulkEditField('group')">
                        ${this.t('updateGroup')}
                    </label>
                    <div id="bulkEditGroupField" style="display: none; margin-top: 10px;">
                        <select id="bulkEditGroup">
                            <option value="">${this.t('groupUngrouped')}</option>
                            ${groups.map(group => `<option value="${group.id}">${group.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="btn-success" onclick="ui.applyBulkEdit()">
                        <i class="fa-solid fa-check"></i> ${this.t('btnApplyChanges')}
                    </button>
                    <button class="btn-secondary" onclick="ui.closeBulkEditModal()">
                        <i class="fa-solid fa-xmark"></i> ${this.t('btnCancel')}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('bulkEditModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// Toggle bulk edit field
UIManager.prototype.toggleBulkEditField = function(fieldType) {
    const toggle = document.getElementById(`bulkEdit${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}Toggle`);
    const field = document.getElementById(`bulkEdit${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}Field`);
    
    if (toggle && field) {
        field.style.display = toggle.checked ? 'block' : 'none';
    }
};

// Apply bulk edit
UIManager.prototype.applyBulkEdit = function() {
    const updates = {};
    let hasUpdates = false;
    
    // Check capacity update
    if (document.getElementById('bulkEditCapacityToggle').checked) {
        const capacity = document.getElementById('bulkEditCapacity').value;
        if (capacity) {
            updates.capacity = parseInt(capacity);
            hasUpdates = true;
        }
    }
    
    // Check promo update
    if (document.getElementById('bulkEditPromoToggle').checked) {
        const promoCapacity = document.getElementById('bulkEditPromoCapacity').value;
        if (promoCapacity) {
            updates.promoCapacity = parseInt(promoCapacity);
            updates.promoActive = document.getElementById('bulkEditPromoActive').checked;
            updates.promoEndDate = document.getElementById('bulkEditPromoEndDate').value || null;
            hasUpdates = true;
        }
    }
    
    // Check group update
    if (document.getElementById('bulkEditGroupToggle').checked) {
        updates.group = document.getElementById('bulkEditGroup').value || null;
        hasUpdates = true;
    }
    
    if (!hasUpdates) {
        this.showToast('Please select at least one field to update', 'warning');
        return;
    }
    
    // Apply updates
    const result = this.dataManager.bulkUpdateMaterials(Array.from(this.selectedItems), updates);
    
    if (result.success) {
        this.showToast(`<i class="fa-solid fa-check"></i> ${result.count} materials updated successfully!`, 'success');
        this.closeBulkEditModal();
        this.clearBulkSelection();
        this.renderMaterialsList();
    } else {
        this.showToast('Error updating materials: ' + result.error, 'error');
    }
};

// Close bulk edit modal
UIManager.prototype.closeBulkEditModal = function() {
    const modal = document.getElementById('bulkEditModal');
    if (modal) modal.remove();
};

// Bulk delete materials
UIManager.prototype.bulkDeleteMaterials = async function() {
    if (this.selectedItems.size === 0) {
        this.showToast('Please select at least one material', 'warning');
        return;
    }
    
    const materialCodes = Array.from(this.selectedItems);
    const materials = materialCodes.map(code => this.dataManager.getMaterial(code)).filter(m => m);
    
    // Create confirmation modal with list of materials
    const materialsList = materials.map(m => 
        `<li><strong>${m.code}</strong>${m.name ? ` - ${m.name}` : ''}</li>`
    ).join('');
    
    const message = `
        <p>${this.t('bulkDeleteConfirm').replace('{count}', materials.length)}</p>
        <div style="max-height: 200px; overflow-y: auto; margin: 15px 0; padding: 10px; background: var(--background-secondary); border-radius: 8px;">
            <ul style="margin: 0; padding-left: 20px;">
                ${materialsList}
            </ul>
        </div>
        <p style="color: var(--error-color); font-weight: 600;">${this.t('bulkDeleteWarning')}</p>
    `;
    
    const confirmed = await this.showDeleteModal(message);
    
    if (!confirmed) return;
    
    const result = this.dataManager.bulkDeleteMaterials(materialCodes);
    
    if (result.success) {
        this.showToast(`<i class="fa-solid fa-trash-can"></i> ${result.count} materials deleted successfully!`, 'success');
        this.clearBulkSelection();
        this.renderMaterialsList();
    } else {
        this.showToast('Error deleting materials: ' + result.error, 'error');
    }
};

// Export selected or filtered materials
UIManager.prototype.exportFilteredMaterials = function() {
    const table = $('#materialsTable').DataTable();
    const filteredData = table.rows({ search: 'applied' }).data();
    
    if (filteredData.length === 0) {
        this.showToast('No materials to export', 'warning');
        return;
    }
    
    // Extract material codes from filtered rows
    const materialCodes = [];
    filteredData.each(function(row) {
        // The row data is HTML, extract from first column after checkbox
        const parser = new DOMParser();
        const doc = parser.parseFromString(row[1], 'text/html');
        const code = doc.querySelector('strong')?.textContent;
        if (code) materialCodes.push(code);
    });
    
    const result = this.dataManager.exportMaterialsCSV(materialCodes);
    
    if (result.success) {
        this.showToast(`<i class="fa-solid fa-file-arrow-down"></i> ${result.count} materials exported successfully!`, 'success');
    } else {
        this.showToast('Error exporting materials', 'error');
    }
};

// ========================
// Storage Management
// ========================

// Update storage status display
UIManager.prototype.updateStorageStatus = function() {
    const archive = this.dataManager.getArchive();
    const archiveSize = this.dataManager.estimateArchiveSize();
    
    document.getElementById('archiveCount').textContent = archive.length;
    document.getElementById('archiveSize').textContent = archiveSize.toFixed(2) + ' MB';
    
    if (archive.length > 0) {
        const oldestEntry = archive[archive.length - 1];
        const oldestDate = new Date(oldestEntry.timestamp);
        const daysAgo = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
        document.getElementById('oldestEntry').textContent = `${daysAgo} days ago`;
    } else {
        document.getElementById('oldestEntry').textContent = 'N/A';
    }
};

// Cleanup old archive entries
UIManager.prototype.cleanupOldArchive = async function() {
    const message = `
        <p>${this.t('cleanupOldConfirm')}</p>
    `;
    
    const confirmed = await this.showDeleteModal(message);
    
    if (!confirmed) return;
    
    const beforeCount = this.dataManager.getArchive().length;
    await this.dataManager.clearOldArchive();
    const afterCount = this.dataManager.getArchive().length;
    const removed = beforeCount - afterCount;
    
    if (removed > 0) {
        this.showToast(`<i class="fa-solid fa-broom"></i> ${removed} old archive entries removed`, 'success');
    } else {
        this.showToast('No old entries to remove', 'info');
    }
    
    this.updateStorageStatus();
};

// Optimize storage
UIManager.prototype.optimizeStorage = async function() {
    const message = `
        <p>${this.t('optimizeConfirm')}</p>
    `;
    
    const confirmed = await this.showDeleteModal(message);
    
    if (!confirmed) return;
    
    this.showLoading('Optimizing storage...');
    
    try {
        // Force cleanup
        await this.dataManager.cleanupArchiveIfNeeded();
        
        // Get size before aggressive cleanup
        const beforeSize = this.dataManager.estimateArchiveSize();
        
        // Perform aggressive cleanup if needed
        if (beforeSize > 20) {
            await this.dataManager.aggressiveArchiveCleanup();
            await this.dataManager.saveArchive();
        }
        
        const afterSize = this.dataManager.estimateArchiveSize();
        const saved = beforeSize - afterSize;
        
        this.hideLoading();
        
        if (saved > 0.1) {
            this.showToast(`<i class="fa-solid fa-gauge-high"></i> Storage optimized! Freed ${saved.toFixed(2)} MB`, 'success');
        } else {
            this.showToast('Storage already optimized', 'info');
        }
        
        this.updateStorageStatus();
    } catch (error) {
        this.hideLoading();
        this.showToast('Error optimizing storage: ' + error.message, 'error');
    }
};

