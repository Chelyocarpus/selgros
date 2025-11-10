/* ===========================
   CHECK STOCK TAB
   =========================== */

// Render Check Stock Tab Content
function renderCheckStockTab() {
    const tab = document.getElementById('checkTab');
    tab.innerHTML = `
        <div class="card">
            <h2>${ui.t('uploadTitle')}</h2>
            
            <div class="upload-section">
                <div class="upload-methods">
                    <!-- File Upload Box -->
                    <div class="upload-box" id="uploadBox">
                        <input type="file" id="fileUpload" accept=".xlsx,.xls" onchange="handleFileUpload(event)" style="display: none;" multiple>
                        <div class="upload-box-content">
                            <div class="upload-icon"><i class="fa-solid fa-folder-open"></i></div>
                            <h3 class="upload-title">${ui.t('uploadFileTitle')}</h3>
                            <p class="upload-description">${ui.t('uploadFileDragDrop')}</p>
                            <p class="upload-description-or">${ui.t('uploadFileOr')}</p>
                            <button class="btn-primary" onclick="document.getElementById('fileUpload').click()">
                                <i class="fa-solid fa-folder-open"></i> ${ui.t('uploadFileBrowse')}
                            </button>
                            <p class="upload-hint">${ui.t('uploadFileHint')}</p>
                            <small style="color: var(--primary-color); font-weight: 600; display: block; margin-top: 10px;">
                                <i class="fa-solid fa-layer-group"></i> ${ui.t('multipleFilesSupported')}
                            </small>
                        </div>
                    </div>

                    <!-- Divider -->
                    <div class="upload-divider">
                        <span>${ui.t('uploadFileOr')}</span>
                    </div>

                    <!-- Paste Data Box -->
                    <div class="upload-box paste-box" id="pasteBox">
                        <div class="upload-box-content">
                            <div class="upload-icon"><i class="fa-solid fa-clipboard"></i></div>
                            <h3 class="upload-title">${ui.t('uploadPasteTitle')}</h3>
                            <p class="upload-description">${ui.t('uploadPasteDesc')}</p>
                        </div>
                    </div>
                </div>

                <!-- Text Area (shown after clicking paste box) -->
                <div class="form-group" id="pasteAreaGroup" style="display: none;">
                    <label for="inputData"><i class="fa-solid fa-clipboard"></i> ${ui.t('uploadPasteLabel')}</label>
                    <textarea id="inputData" placeholder="${ui.t('uploadPastePlaceholder')}"></textarea>
                </div>
            </div>

            <div class="button-group" id="actionButtons" style="margin-top: 20px;">
                <button class="btn-primary" onclick="processData()"><i class="fa-solid fa-magnifying-glass"></i> ${ui.t('btnCheckStock')}</button>
                <button class="btn-secondary" onclick="clearResults()">
                    <i class="fa-solid fa-broom"></i> ${ui.t('btnClear')}
                </button>
            </div>
        </div>

        <div id="statsContainer" style="display: none;">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">${ui.t('statTotalMaterials')}</div>
                    <div class="stat-value" id="statTotalMaterials">0</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-label">${ui.t('statAlerts')}</div>
                    <div class="stat-value" id="statAlerts">0</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-label">${ui.t('statLocations')}</div>
                    <div class="stat-value" id="statLocations">0</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>${ui.t('resultsTitle')}</h2>
            
            <!-- Filter Controls -->
            <div id="resultsFilterControls" style="display: none; margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <label style="margin: 0; font-weight: 600; color: var(--text-color);">
                        ${ui.t('filterResults')}:
                    </label>
                    <select id="alertFilter" onchange="filterResults()" style="width: auto; min-width: 200px;">
                        <option value="all">${ui.t('showAll')}</option>
                        <option value="alerts">${ui.t('showAlertsOnly')}</option>
                    </select>
                </div>
            </div>
            
            <div id="resultsContainer">
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fa-solid fa-chart-simple"></i></div>
                    <p>${ui.t('resultsEmpty')}</p>
                </div>
            </div>
            <div id="resultsTableContainer" style="display: none;">
                <table id="resultsTable">
                    <thead>
                        <tr>
                            <th>${ui.t('colMaterial')}</th>
                            <th>${ui.t('colStorageType')}</th>
                            <th>${ui.t('colQuantity')}</th>
                            <th>${ui.t('colMKTCapacity')}</th>
                            <th>${ui.t('colAlerts')}</th>
                            <th>${ui.t('colActions')}</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;
}

// Process and display report data
UIManager.prototype.processReport = function() {
    const inputData = document.getElementById('inputData').value.trim();

    if (!inputData) {
        this.showToast('Please paste report data or upload a file first.', 'warning');
        return;
    }

    try {
        // Parse report
        const parsedData = this.reportProcessor.parseReport(inputData);
        
        // Analyze stock
        const analysis = this.reportProcessor.analyzeStock(parsedData);

        // Save to archive
        this.dataManager.addToArchive(inputData, analysis);

        // Display results
        this.displayResults(analysis);

        this.showToast('Report processed successfully!', 'success');

    } catch (error) {
        console.error('Error processing report:', error);
        this.showToast('Error processing report: ' + error.message, 'error');
    }
};

// Display analysis results
UIManager.prototype.displayResults = function(analysis) {
    const { materialGroups, totalMaterials, totalAlerts, storageLocations } = analysis;

    // Store analysis for filtering
    this.currentAnalysis = analysis;

    // Update stats
    document.getElementById('statTotalMaterials').textContent = totalMaterials;
    document.getElementById('statAlerts').textContent = totalAlerts;
    document.getElementById('statLocations').textContent = storageLocations;
    document.getElementById('statsContainer').style.display = 'block';

    // Show filter controls if there are results
    const filterControls = document.getElementById('resultsFilterControls');
    if (filterControls && materialGroups.length > 0) {
        filterControls.style.display = 'block';
        // Reset filter to "all" when new data is loaded
        const alertFilter = document.getElementById('alertFilter');
        if (alertFilter) {
            alertFilter.value = 'all';
        }
    }

    // Show table container
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('resultsTableContainer').style.display = 'block';

    // Populate table
    this.renderResultsTable(materialGroups);
};

// Render results table
UIManager.prototype.renderResultsTable = function(materialGroups) {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = '';

    if (materialGroups.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">${this.t('noDataToDisplay')}</td></tr>`;
        return;
    }

    materialGroups.forEach(group => {
        const { material, materialName, rows, hasMultipleStorageTypes } = group;

        // If material has multiple storage types, add a header row
        if (hasMultipleStorageTypes) {
            const headerRow = document.createElement('tr');
            headerRow.className = 'material-group-header';
            const materialDisplay = materialName 
                ? `<strong>${material}</strong> • ${materialName}`
                : `<strong>${material}</strong>`;
            
            const groupAlerts = rows.filter(r => r.alerts && r.alerts.length > 0).length;
            const alertIndicator = groupAlerts > 0 
                ? `<span style="background: rgba(220, 38, 38, 0.9); padding: 4px 10px; border-radius: 12px; font-size: 0.85em; margin-left: 10px;"><i class="fa-solid fa-triangle-exclamation"></i> ${groupAlerts} Alert${groupAlerts > 1 ? 's' : ''}</span>`
                : '';
            
            headerRow.innerHTML = `
                <td colspan="6" style="padding: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>${materialDisplay}${alertIndicator}</div>
                        <div style="font-size: 0.9em; opacity: 0.9;">
                            <i class="fa-solid fa-chart-simple"></i> ${this.t('total')}: <strong>${group.totalStock}</strong> ${this.t('units')} • ${rows.length} ${this.t('location')}${rows.length > 1 ? 's' : ''}
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(headerRow);
        }

        // Add rows for each storage type
        rows.forEach((row, index) => {
            const tr = document.createElement('tr');
            
            if (row.alerts && row.alerts.length > 0) {
                tr.classList.add('alert-row');
            }

            if (hasMultipleStorageTypes) {
                tr.classList.add('material-group-row');
            }

            const alertsHtml = row.alerts && row.alerts.length > 0
                ? row.alerts.map(alert => 
                    `<span class="alert-badge ${alert.type}">${alert.message}</span>`
                ).join(' ')
                : '-';

            const materialDisplay = hasMultipleStorageTypes
                ? ''
                : (materialName 
                    ? `<strong>${material}</strong><br><small style="color: var(--text-secondary);">${materialName}</small>`
                    : material);

            const storageTypeBadge = row.storageType !== 'Total'
                ? `<span class="storage-type-badge ${row.storageType.toLowerCase()}">${row.storageType}</span>`
                : row.storageType;

            // Get material capacity
            const materialConfig = this.dataManager.getMaterial(material);
            
            let isPromoActive = false;
            let effectiveCapacity = null;
            
            if (materialConfig) {
                isPromoActive = materialConfig.promoActive;
                
                if (isPromoActive && materialConfig.promoEndDate) {
                    const endDate = new Date(materialConfig.promoEndDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (endDate < today) {
                        isPromoActive = false;
                    }
                }
                
                effectiveCapacity = (isPromoActive && materialConfig.promoCapacity) 
                    ? materialConfig.promoCapacity 
                    : materialConfig.capacity;
            }
            
            const promoBadge = (isPromoActive && materialConfig?.promoCapacity) 
                ? `<span class="promo-badge"><i class="fa-solid fa-gift"></i> ${this.t('alertPromo')}</span>`
                : '';
            
            const capacityDisplay = materialConfig 
                ? `<span class="capacity-display has-capacity ${isPromoActive ? 'promo-active' : ''}">${effectiveCapacity}${promoBadge}</span>`
                : `<span class="capacity-display no-capacity">—</span>`;

            const showQuickAdd = row.storageType === 'MKT' && !materialConfig;
            const actionButton = showQuickAdd
                ? `<button class="quick-add-btn" onclick="ui.quickAddMaterial('${material}', '${materialName}', ${row.qty})"><i class="fa-solid fa-plus"></i> ${this.t('btnQuickAdd')}</button>`
                : (materialConfig && row.storageType === 'MKT' 
                    ? `<button class="quick-add-btn" onclick="ui.openEditModal('${material}')"><i class="fa-solid fa-pen-to-square"></i> ${this.t('btnEdit')}</button>`
                    : '—');

            tr.innerHTML = `
                <td>${materialDisplay}</td>
                <td>${storageTypeBadge}</td>
                <td>${row.qty}</td>
                <td>${capacityDisplay}</td>
                <td>${alertsHtml}</td>
                <td>${actionButton}</td>
            `;

            tbody.appendChild(tr);
        });

        // Add separator row
        if (hasMultipleStorageTypes) {
            const separatorRow = document.createElement('tr');
            separatorRow.className = 'material-group-separator';
            separatorRow.innerHTML = '<td colspan="6"></td>';
            tbody.appendChild(separatorRow);
        }
    });
};

// Clear results
UIManager.prototype.clearResults = function() {
    document.getElementById('inputData').value = '';
    document.getElementById('fileUpload').value = '';
    document.getElementById('pasteAreaGroup').style.display = 'none';
    document.getElementById('statsContainer').style.display = 'none';
    document.getElementById('resultsTableContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';
    
    // Hide filter controls and reset filter
    const filterControls = document.getElementById('resultsFilterControls');
    if (filterControls) {
        filterControls.style.display = 'none';
    }
    const alertFilter = document.getElementById('alertFilter');
    if (alertFilter) {
        alertFilter.value = 'all';
    }
    
    // Clear stored analysis
    this.currentAnalysis = null;
};

// Handle XLSX file upload
/**
 * Handle file upload with validation and progress indicators
 * Supports single or multiple file uploads with batch processing
 * @param {Event} event - File input change event
 */
UIManager.prototype.handleFileUpload = async function(event) {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    try {
        const isBatch = files.length > 1;
        
        // Show loading
        if (isBatch) {
            this.showBatchProcessingModal(files.length);
        } else {
            this.showLoading(this.t('uploading'));
        }
        
        // Validate all files first
        const validationResults = await Promise.all(
            files.map(file => SecurityUtils.validateFileType(file))
        );
        
        const invalidFiles = validationResults.filter(r => !r.valid);
        if (invalidFiles.length > 0) {
            this.hideLoading();
            this.closeBatchProcessingModal();
            this.showToast(`${invalidFiles.length} file(s) failed validation`, 'error');
            accessibilityManager?.announce('File validation failed', 'assertive');
            event.target.value = '';
            return;
        }
        
        // Validate file sizes (max 10MB each)
        const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            this.hideLoading();
            this.closeBatchProcessingModal();
            this.showToast(`${oversizedFiles.length} file(s) exceed 10MB limit`, 'error');
            accessibilityManager?.announce('Files too large', 'assertive');
            event.target.value = '';
            return;
        }
        
        // Process files
        const results = {
            processed: 0,
            failed: 0,
            errors: [],
            analyses: []
        };
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (isBatch) {
                this.updateBatchProgress(i + 1, files.length, file.name);
            }
            
            try {
                const analysis = await this.processFileAsync(file);
                results.analyses.push({
                    fileName: file.name,
                    analysis: analysis,
                    success: true
                });
                results.processed++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    fileName: file.name,
                    error: error.message
                });
            }
        }
        
        // Hide loading/progress
        this.hideLoading();
        this.closeBatchProcessingModal();
        
        // Display results
        if (results.processed > 0) {
            if (isBatch) {
                // Aggregate results from multiple reports
                this.displayBatchResults(results);
            } else {
                // Display single report
                this.displayResults(results.analyses[0].analysis);
            }
            
            // Show summary toast
            let message = isBatch
                ? `<i class="fa-solid fa-file-excel"></i> ${results.processed} report(s) processed successfully!`
                : `<i class="fa-solid fa-file-excel"></i> Excel file loaded and processed successfully!`;
            
            if (results.failed > 0) {
                message += ` (${results.failed} failed)`;
            }
            
            this.showToast(message, results.failed > 0 ? 'warning' : 'success');
            accessibilityManager?.announce('Reports processed', 'polite');
        } else {
            this.showToast('All files failed to process', 'error');
            accessibilityManager?.announce('Processing failed', 'assertive');
        }
        
        // Show errors if any
        if (results.errors.length > 0) {
            console.error('Batch processing errors:', results.errors);
        }
        
        // Reset file input
        event.target.value = '';
        
    } catch (error) {
        this.hideLoading();
        this.closeBatchProcessingModal();
        ErrorHandler.log(error, 'File upload');
        this.showToast('Error uploading file(s): ' + error.message, 'error');
        accessibilityManager?.announce('File upload error', 'assertive');
        event.target.value = '';
    }
};

// Process single file asynchronously
UIManager.prototype.processFileAsync = function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                const tsvData = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
                
                // Parse and analyze
                const parsedData = this.reportProcessor.parseReport(tsvData);
                const analysis = this.reportProcessor.analyzeStock(parsedData);
                
                // Save to archive
                this.dataManager.addToArchive(tsvData, analysis, file.name);
                
                resolve(analysis);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
};

// Show batch processing modal
UIManager.prototype.showBatchProcessingModal = function(totalFiles) {
    const modalHtml = `
        <div class="modal active" id="batchProcessingModal" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fa-solid fa-gear fa-spin"></i> ${this.t('batchProcessingTitle')}</h2>
                </div>
                
                <div style="padding: 20px 0;">
                    <div class="batch-progress-info" style="margin-bottom: 15px; text-align: center;">
                        <div style="font-size: 2em; font-weight: 700; color: var(--primary-color);">
                            <span id="batchCurrentFile">0</span> / <span id="batchTotalFiles">${totalFiles}</span>
                        </div>
                        <div style="color: var(--text-secondary); margin-top: 5px;">
                            ${this.t('filesProcessed')}
                        </div>
                    </div>
                    
                    <div class="progress-bar" style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden; margin-bottom: 15px;">
                        <div id="batchProgressBar" style="height: 100%; background: var(--primary-color); width: 0%; transition: width 0.3s;"></div>
                    </div>
                    
                    <div id="batchCurrentFileName" style="text-align: center; color: var(--text-secondary); font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${this.t('preparingFiles')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('batchProcessingModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// Update batch progress
UIManager.prototype.updateBatchProgress = function(current, total, fileName) {
    const currentSpan = document.getElementById('batchCurrentFile');
    const progressBar = document.getElementById('batchProgressBar');
    const fileNameDiv = document.getElementById('batchCurrentFileName');
    
    if (currentSpan) currentSpan.textContent = current;
    if (progressBar) {
        const percentage = (current / total) * 100;
        progressBar.style.width = percentage + '%';
    }
    if (fileNameDiv) {
        fileNameDiv.textContent = `${this.t('processing')}: ${fileName}`;
    }
};

// Close batch processing modal
UIManager.prototype.closeBatchProcessingModal = function() {
    const modal = document.getElementById('batchProcessingModal');
    if (modal) modal.remove();
};

// Display batch results (aggregate from multiple reports)
UIManager.prototype.displayBatchResults = function(results) {
    // Aggregate all material data
    const aggregatedMaterials = new Map();
    let totalAlerts = 0;
    const storageLocationsSet = new Set();
    
    results.analyses.forEach(({ fileName, analysis, success }) => {
        if (!success || !analysis) return;
        
        totalAlerts += analysis.totalAlerts || 0;
        
        // Aggregate materials
        analysis.materialGroups.forEach(group => {
            const key = group.material;
            
            if (!aggregatedMaterials.has(key)) {
                aggregatedMaterials.set(key, {
                    material: group.material,
                    materialName: group.materialName,
                    rows: [],
                    totalStock: 0,
                    sources: new Set()
                });
            }
            
            const agg = aggregatedMaterials.get(key);
            agg.sources.add(fileName);
            
            // Merge rows by storage type
            group.rows.forEach(row => {
                storageLocationsSet.add(row.storageType);
                
                const existingRow = agg.rows.find(r => r.storageType === row.storageType);
                if (existingRow) {
                    existingRow.qty += row.qty;
                    // Merge alerts
                    if (row.alerts && row.alerts.length > 0) {
                        existingRow.alerts = existingRow.alerts || [];
                        existingRow.alerts.push(...row.alerts);
                    }
                } else {
                    agg.rows.push({ ...row });
                }
            });
            
            agg.totalStock = agg.rows.reduce((sum, row) => sum + row.qty, 0);
        });
    });
    
    // Convert to array and calculate hasMultipleStorageTypes
    const materialGroups = Array.from(aggregatedMaterials.values()).map(agg => ({
        ...agg,
        hasMultipleStorageTypes: agg.rows.length > 1,
        sources: Array.from(agg.sources)
    }));
    
    const aggregatedAnalysis = {
        materialGroups: materialGroups,
        totalMaterials: materialGroups.length,
        totalAlerts: totalAlerts,
        storageLocations: storageLocationsSet.size,
        isBatch: true,
        fileCount: results.processed,
        errors: results.errors
    };
    
    // Store for filtering
    this.currentAnalysis = aggregatedAnalysis;
    
    // Update stats
    document.getElementById('statTotalMaterials').textContent = aggregatedAnalysis.totalMaterials;
    document.getElementById('statAlerts').textContent = aggregatedAnalysis.totalAlerts;
    document.getElementById('statLocations').textContent = aggregatedAnalysis.storageLocations;
    document.getElementById('statsContainer').style.display = 'block';
    
    // Add batch info banner
    const resultsContainer = document.getElementById('resultsTableContainer');
    const existingBanner = document.getElementById('batchInfoBanner');
    if (existingBanner) existingBanner.remove();
    
    const banner = document.createElement('div');
    banner.id = 'batchInfoBanner';
    banner.style.cssText = 'background: var(--info-bg); border-left: 4px solid var(--primary-color); padding: 15px; margin-bottom: 20px; border-radius: 8px;';
    banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-layer-group" style="font-size: 1.5em; color: var(--primary-color);"></i>
            <div>
                <strong>${this.t('batchReportAggregated')}</strong>
                <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                    ${results.processed} report(s) processed and combined
                    ${results.failed > 0 ? ` • ${results.failed} failed` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Show filter controls
    const filterControls = document.getElementById('resultsFilterControls');
    if (filterControls) filterControls.style.display = 'block';
    
    // Show results
    document.getElementById('resultsContainer').style.display = 'none';
    resultsContainer.style.display = 'block';
    resultsContainer.insertBefore(banner, resultsContainer.firstChild);
    
    // Render table
    this.renderResultsTable(materialGroups);
};

// Filter results by alert status
UIManager.prototype.filterResults = function() {
    if (!this.currentAnalysis) return;
    
    const filterValue = document.getElementById('alertFilter').value;
    const { materialGroups } = this.currentAnalysis;
    
    let filteredGroups;
    
    if (filterValue === 'alerts') {
        // Filter to show only materials/rows with alerts
        filteredGroups = materialGroups
            .map(group => {
                // Filter rows that have alerts
                const alertRows = group.rows.filter(row => row.alerts && row.alerts.length > 0);
                
                if (alertRows.length === 0) {
                    return null; // Exclude this group entirely
                }
                
                // Return group with only alert rows
                return {
                    ...group,
                    rows: alertRows
                };
            })
            .filter(group => group !== null); // Remove null groups
    } else {
        // Show all
        filteredGroups = materialGroups;
    }
    
    // Re-render table with filtered data
    this.renderResultsTable(filteredGroups);
};
