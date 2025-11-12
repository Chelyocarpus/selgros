/* ===========================
   UI MANAGER
   =========================== */

/**
 * @fileoverview UI Management and user interaction handling
 * @version 1.1.0
 */

/**
 * Debounce utility for expensive UI updates
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 * @deprecated Use PerformanceUtils.debounce instead
 */
function debounce(func, wait) {
    return PerformanceUtils.debounce(func, wait);
}

/**
 * UI Manager class - handles all UI interactions and state
 */
class UIManager {
    // Constants
    static MAX_RECENT_MATERIALS = 20; // Maximum number of recently added materials to track
    
    constructor(dataManager, reportProcessor) {
        this.dataManager = dataManager;
        this.reportProcessor = reportProcessor;
        this.languageManager = languageManager;
        this.currentModalMode = null; // 'add', 'edit', or 'quickadd'
        this.currentEditingMaterial = null;
        this.quickAddContext = null; // Store context for quick add
        
        // DataTable cache for performance
        this.dataTableCache = new Map();
        
        // Auto-save draft timer
        this.autoSaveDraftTimer = null;
        this.draftMaterial = null;
        
        // Dark mode state
        this.darkMode = this.loadDarkMode();
        this.applyDarkMode();
        
        // Selected items for bulk operations
        this.selectedItems = new Set();
        
        // Recently added materials (session-based tracking)
        this.recentlyAddedMaterials = [];
        this.loadRecentlyAdded();
    }

    /**
     * Helper method to get translation
     * @param {string} key - Translation key
     * @returns {string} Translated text
     */
    t(key) {
        return this.languageManager.t(key);
    }

    /**
     * Show loading overlay
     * @param {string} message - Loading message
     */
    showLoading(message = null) {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        
        if (overlay) {
            if (message) {
                text.textContent = SecurityUtils.escapeHTML(message);
            } else {
                text.textContent = this.t('loading');
            }
            overlay.style.display = 'flex';
            accessibilityManager?.setBusy(document.body, true);
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            accessibilityManager?.setBusy(document.body, false);
        }
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.saveDarkMode();
        this.applyDarkMode();
        
        const message = this.darkMode ? this.t('darkModeEnabled') : this.t('darkModeDisabled');
        this.showToast(message, 'success');
        accessibilityManager?.announce(message, 'polite');
    }

    /**
     * Apply dark mode styles
     */
    applyDarkMode() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    /**
     * Save dark mode preference
     */
    saveDarkMode() {
        try {
            localStorage.setItem('warehouse_dark_mode', this.darkMode.toString());
        } catch (e) {
            console.error('Failed to save dark mode to localStorage:', e);
        }
    }

    /**
     * Load dark mode preference
     * @returns {boolean}
     */
    loadDarkMode() {
        try {
            return localStorage.getItem('warehouse_dark_mode') === 'true';
        } catch (e) {
            console.warn('Failed to load dark mode from localStorage:', e);
            return false;
        }
    }

    /**
     * Get or create cached DataTable instance with automatic virtual scrolling for large datasets
     * @param {string} tableId - Table element ID
     * @param {object} options - DataTable options
     * @returns {object} DataTable instance
     */
    getCachedDataTable(tableId, options = {}) {
        const table = $(`#${tableId}`);
        
        // Check if DataTable already exists
        if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
            const existingTable = table.DataTable();
            
            // Clear and reload data instead of destroying
            existingTable.clear();
            return existingTable;
        }
        
        // Determine if virtual scrolling should be enabled
        const rowCount = table.find('tbody tr').length;
        const useVirtualScrolling = rowCount > 1000 || options.forceVirtualScrolling;
        
        // Create new DataTable with caching and performance optimizations
        const defaultOptions = {
            pageLength: useVirtualScrolling ? -1 : 25,
            lengthMenu: useVirtualScrolling ? [] : [[10, 25, 50, 100, -1], [10, 25, 50, 100, this.t('showAll')]],
            deferRender: true,
            processing: true,
            stateSave: true,
            stateDuration: 60 * 60 * 24, // 24 hours
            language: {
                search: this.t('filterPlaceholder'),
                lengthMenu: `${this.t('showAll')} _MENU_`,
                info: `_START_ - _END_ ${this.t('of')} _TOTAL_`,
                emptyTable: this.t('noData'),
                processing: this.t('processing') || 'Processing...'
            },
            ...options
        };
        
        // Enable virtual scrolling for large datasets (>1000 rows)
        if (useVirtualScrolling) {
            defaultOptions.scrollY = options.scrollY || '400px';
            defaultOptions.scroller = {
                loadingIndicator: true,
                boundaryScale: 0.5,
                displayBuffer: 9
            };
            defaultOptions.deferRender = true;
            defaultOptions.paging = false;
            defaultOptions.lengthChange = false;
            
            console.log(`[Performance] Virtual scrolling enabled for #${tableId} (${rowCount} rows)`);
        }
        
        const dataTable = table.DataTable(defaultOptions);
        this.dataTableCache.set(tableId, dataTable);
        
        return dataTable;
    }

    /**
     * Destroy cached DataTable
     * @param {string} tableId - Table element ID
     */
    destroyDataTable(tableId) {
        if (this.dataTableCache.has(tableId)) {
            const dataTable = this.dataTableCache.get(tableId);
            dataTable.destroy();
            this.dataTableCache.delete(tableId);
        }
    }

    /**
     * Auto-save material draft
     * @param {object} materialData - Material form data
     */
    autoSaveDraft(materialData) {
        // Clear existing timer
        if (this.autoSaveDraftTimer) {
            clearTimeout(this.autoSaveDraftTimer);
        }
        
        // Set new timer with debounce
        this.autoSaveDraftTimer = setTimeout(() => {
            try {
                localStorage.setItem('warehouse_draft_material', JSON.stringify(materialData));
                
                // Show subtle notification
                const draftIndicator = document.getElementById('draftIndicator');
                if (draftIndicator) {
                    draftIndicator.textContent = this.t('autoSaved');
                    draftIndicator.style.color = 'var(--success-color)';
                }
                
                accessibilityManager?.announce(this.t('autoSaved'), 'polite');
            } catch (error) {
                ErrorHandler.log(error, 'Auto-save draft');
            }
        }, 2000); // Auto-save after 2 seconds of inactivity
    }

    /**
     * Load material draft
     * @returns {object|null} Draft material data
     */
    loadDraft() {
        try {
            const draft = localStorage.getItem('warehouse_draft_material');
            return draft ? JSON.parse(draft) : null;
        } catch (error) {
            ErrorHandler.log(error, 'Load draft');
            return null;
        }
    }

    /**
     * Clear material draft
     */
    clearDraft() {
        try {
            localStorage.removeItem('warehouse_draft_material');
            const draftIndicator = document.getElementById('draftIndicator');
            if (draftIndicator) {
                draftIndicator.textContent = '';
            }
        } catch (error) {
            ErrorHandler.log(error, 'Clear draft');
        }
    }

    /**
     * Update all UI text when language changes
     */
    updateLanguage() {
        // Update header
        document.getElementById('headerTitle').innerHTML = `<i class="fa-solid fa-boxes-stacked"></i> ${this.t('appTitle')}`;
        document.getElementById('headerSubtitle').textContent = this.t('appSubtitle');
        
        // Update skip links and loading text
        const skipToMainContent = document.getElementById('skipToMainContent');
        const skipToNavigation = document.getElementById('skipToNavigation');
        const loadingText = document.getElementById('loadingText');
        
        if (skipToMainContent) {
            skipToMainContent.textContent = this.t('skipToContent');
        }
        
        if (skipToNavigation) {
            skipToNavigation.textContent = this.t('skipToNavigation');
        }
        
        if (loadingText) {
            loadingText.textContent = this.t('loading');
        }
        
        // Update theme button tooltips
        const darkModeBtn = document.getElementById('darkModeBtn');
        const highContrastBtn = document.getElementById('highContrastBtn');
        const shortcutsBtn = document.querySelector('[onclick="showKeyboardShortcuts()"]');
        
        if (darkModeBtn) {
            darkModeBtn.title = `${this.t('toggleDarkMode')} (Ctrl+Shift+D)`;
            darkModeBtn.setAttribute('aria-label', this.t('toggleDarkMode'));
        }
        
        if (highContrastBtn) {
            highContrastBtn.title = `${this.t('toggleHighContrast')} (Ctrl+Shift+H)`;
            highContrastBtn.setAttribute('aria-label', this.t('toggleHighContrast'));
        }
        
        if (shortcutsBtn) {
            shortcutsBtn.title = `${this.t('showKeyboardShortcuts')} (Ctrl+/)`;
            shortcutsBtn.setAttribute('aria-label', this.t('showKeyboardShortcuts'));
        }
        
        // Update tabs
        const tabs = document.querySelectorAll('.tab');
        tabs[0].innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> ${this.t('tabCheckStock')}`;
        tabs[1].innerHTML = `<i class="fa-solid fa-boxes-stacked"></i> ${this.t('tabManageMaterials')}`;
        tabs[2].innerHTML = `<i class="fa-solid fa-folder-open"></i> ${this.t('tabArchive')}`;
        
        // Update language selector
        document.getElementById('languageSelect').value = this.languageManager.getCurrentLanguage();
        
        // Re-render ALL initialized tabs to update their content
        const activeTab = document.querySelector('.tab.active');
        const activeTabIndex = activeTab ? Array.from(tabs).indexOf(activeTab) : -1;
        
        // Re-render all tabs that have been initialized (using global tabsInitialized object)
        if (typeof tabsInitialized !== 'undefined') {
            if (tabsInitialized.check && typeof renderCheckStockTab === 'function') {
                renderCheckStockTab();
            }
            if (tabsInitialized.materials && typeof renderMaterialsTab === 'function') {
                renderMaterialsTab();
                // Also re-render materials list, groups, and notes if they exist
                if (typeof this.renderMaterialsList === 'function') {
                    this.renderMaterialsList();
                }
                if (typeof this.renderGroupsList === 'function') {
                    this.renderGroupsList();
                }
                if (typeof this.renderNotesList === 'function') {
                    this.renderNotesList();
                }
            }
            if (tabsInitialized.archive && typeof renderArchiveTab === 'function') {
                renderArchiveTab();
                // Also re-render archive list
                if (typeof this.renderArchiveList === 'function') {
                    this.renderArchiveList();
                }
            }
        }
        
        // Update results if visible
        const resultsTableContainer = document.getElementById('resultsTableContainer');
        if (resultsTableContainer && resultsTableContainer.style.display !== 'none') {
            const inputData = document.getElementById('inputData').value.trim();
            if (inputData) {
                const parsedData = this.reportProcessor.parseReport(inputData);
                const analysis = this.reportProcessor.analyzeStock(parsedData);
                this.displayResults(analysis);
            }
        }
        
        // Re-render modals to update their text
        if (typeof renderMaterialModal === 'function') {
            renderMaterialModal();
        }
        if (typeof renderViewReportModal === 'function') {
            renderViewReportModal();
        }
    }

    // Toast notification system
    showToast(message, type = 'info', title = '') {
        const container = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '<i class="fa-solid fa-circle-check"></i>',
            error: '<i class="fa-solid fa-circle-xmark"></i>',
            warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
            info: '<i class="fa-solid fa-circle-info"></i>'
        };
        
        const titles = {
            success: title || 'Success',
            error: title || 'Error',
            warning: title || 'Warning',
            info: title || 'Info'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }

    // Switch between tabs
    switchTab(tabName) {
        // Create ripple effect
        const clickedTab = event.target;
        this.createRipple(clickedTab, event);

        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Refresh content based on tab
        if (tabName === 'materials') {
            this.renderMaterialsList();
        } else if (tabName === 'archive') {
            this.renderArchiveList();
        }
    }

    // Create ripple effect for buttons
    createRipple(element, event) {
        const ripple = document.createElement('span');
        ripple.classList.add('tab-ripple');
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Open material modal for adding
    openAddMaterialModal() {
        this.currentModalMode = 'add';
        this.currentEditingMaterial = null;
        this.quickAddContext = null;

        document.getElementById('materialModalTitle').textContent = this.t('modalAddTitle');
        document.getElementById('modalSaveButtonText').textContent = this.t('btnAddMaterial');

        // Clear and enable all fields
        document.getElementById('modalMaterialCode').value = '';
        document.getElementById('modalMaterialCode').disabled = false;
        document.getElementById('modalMaterialName').value = '';
        document.getElementById('modalMaterialCapacity').value = '';
        document.getElementById('modalPromoCapacity').value = '';
        document.getElementById('modalPromoActive').checked = false;
        document.getElementById('modalPromoEndDate').value = '';

        document.getElementById('materialModal').classList.add('active');
    }

    // Quick add material from results list
    quickAddMaterial(code, name, currentQty) {
        this.currentModalMode = 'quickadd';
        this.currentEditingMaterial = null;
        this.quickAddContext = { code, name, currentQty };

        document.getElementById('materialModalTitle').textContent = this.t('modalQuickAddTitle');
        document.getElementById('modalSaveButtonText').textContent = this.t('btnAddMaterial');

        // Populate group dropdown if available
        if (this.populateGroupDropdown) {
            this.populateGroupDropdown();
        }

        // Pre-fill fields
        document.getElementById('modalMaterialCode').value = code;
        document.getElementById('modalMaterialCode').disabled = true; // Can't change in quick add
        document.getElementById('modalMaterialName').value = name || '';
        document.getElementById('modalMaterialCapacity').value = ''; // Leave empty for user to enter
        if (document.getElementById('modalMaterialGroup')) {
            document.getElementById('modalMaterialGroup').value = '';
        }
        document.getElementById('modalPromoCapacity').value = '';
        document.getElementById('modalPromoActive').checked = false;
        document.getElementById('modalPromoEndDate').value = '';

        document.getElementById('materialModal').classList.add('active');

        // Focus on capacity field for quick editing
        setTimeout(() => {
            document.getElementById('modalMaterialCapacity').focus();
        }, 100);
    }

    // Open edit modal
    openEditModal(code) {
        const material = this.dataManager.getMaterial(code);
        if (!material) return;

        this.currentModalMode = 'edit';
        this.currentEditingMaterial = code;
        this.quickAddContext = null;

        document.getElementById('materialModalTitle').textContent = this.t('modalEditTitle');
        document.getElementById('modalSaveButtonText').textContent = this.t('btnSaveChanges');

        // Populate group dropdown if available
        if (this.populateGroupDropdown) {
            this.populateGroupDropdown();
        }

        // Pre-fill fields
        document.getElementById('modalMaterialCode').value = material.code;
        document.getElementById('modalMaterialCode').disabled = true; // Can't change code when editing
        document.getElementById('modalMaterialName').value = material.name || '';
        document.getElementById('modalMaterialCapacity').value = material.capacity;
        if (document.getElementById('modalMaterialGroup')) {
            document.getElementById('modalMaterialGroup').value = material.group || '';
        }
        document.getElementById('modalPromoCapacity').value = material.promoCapacity || '';
        document.getElementById('modalPromoActive').checked = material.promoActive || false;
        document.getElementById('modalPromoEndDate').value = material.promoEndDate || '';

        document.getElementById('materialModal').classList.add('active');
    }

    // Open add material modal
    openAddModal() {
        this.currentModalMode = 'add';
        this.currentEditingMaterial = null;
        this.quickAddContext = null;

        document.getElementById('materialModalTitle').textContent = this.t('modalAddTitle');
        document.getElementById('modalSaveButtonText').textContent = this.t('btnSave');

        // Populate group dropdown if available
        if (this.populateGroupDropdown) {
            this.populateGroupDropdown();
        }

        // Clear all fields
        document.getElementById('modalMaterialCode').value = '';
        document.getElementById('modalMaterialCode').disabled = false;
        document.getElementById('modalMaterialName').value = '';
        document.getElementById('modalMaterialCapacity').value = '';
        if (document.getElementById('modalMaterialGroup')) {
            document.getElementById('modalMaterialGroup').value = '';
        }
        document.getElementById('modalPromoCapacity').value = '';
        document.getElementById('modalPromoActive').checked = false;
        document.getElementById('modalPromoEndDate').value = '';

        document.getElementById('materialModal').classList.add('active');
        document.getElementById('modalMaterialCode').focus();
    }

    // Close material modal
    closeMaterialModal() {
        document.getElementById('materialModal').classList.remove('active');
        this.currentModalMode = null;
        this.currentEditingMaterial = null;
        this.quickAddContext = null;
        
        // Re-enable code field in case it was disabled
        const codeField = document.getElementById('modalMaterialCode');
        if (codeField) {
            codeField.disabled = false;
        }
    }

    /**
     * Show delete confirmation modal
     * @param {string} message - The confirmation message (can contain HTML)
     * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
     */
    showDeleteModal(message) {
        return new Promise((resolve) => {
            // Store the resolve function so confirmDelete can access it
            this.deleteModalResolve = resolve;
            
            // Update modal content with translations
            document.getElementById('deleteModalTitleText').textContent = this.t('deleteModalTitle');
            document.getElementById('deleteModalMessage').innerHTML = message;
            document.getElementById('deleteModalWarning').textContent = this.t('deleteWarning');
            document.getElementById('deleteModalCancelText').textContent = this.t('deleteModalCancel');
            document.getElementById('deleteModalConfirmText').textContent = this.t('deleteModalConfirm');
            
            // Show modal
            document.getElementById('deleteModal').classList.add('active');
            
            // Focus on cancel button for safety
            setTimeout(() => {
                const cancelBtn = document.querySelector('#deleteModal .btn-secondary');
                if (cancelBtn) cancelBtn.focus();
            }, 100);
            
            // Announce to screen readers
            if (accessibilityManager) {
                accessibilityManager.announce(this.t('deleteModalTitle') + ': ' + message.replace(/<[^>]*>/g, ''), 'assertive');
            }
        });
    }

    /**
     * Close delete confirmation modal
     */
    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        
        // Resolve with false (cancelled)
        if (this.deleteModalResolve) {
            this.deleteModalResolve(false);
            this.deleteModalResolve = null;
        }
    }

    /**
     * Confirm delete action
     */
    confirmDelete() {
        document.getElementById('deleteModal').classList.remove('active');
        
        // Resolve with true (confirmed)
        if (this.deleteModalResolve) {
            this.deleteModalResolve(true);
            this.deleteModalResolve = null;
        }
    }

    /**
     * Show clear all confirmation modal
     * @param {string} message - The confirmation message (can contain HTML)
     * @param {number} count - Number of items to be deleted
     * @returns {Promise<boolean>} Resolves to true if confirmed with "DELETE", false if cancelled
     */
    showClearAllModal(message, count) {
        return new Promise((resolve) => {
            // Store the resolve function
            this.clearAllModalResolve = resolve;
            
            // Update modal content with translations
            document.getElementById('clearAllModalTitleText').textContent = this.t('clearAllModalTitle');
            document.getElementById('clearAllModalMessage').innerHTML = message.replace('{count}', count);
            document.getElementById('clearAllModalWarning').textContent = this.t('clearAllWarning');
            document.getElementById('clearAllModalInstruction').textContent = this.t('clearAllInstruction');
            document.getElementById('clearAllModalCancelText').textContent = this.t('deleteModalCancel');
            document.getElementById('clearAllModalConfirmText').textContent = this.t('deleteModalConfirm');
            
            // Clear input field and error
            const input = document.getElementById('clearAllConfirmInput');
            input.value = '';
            input.classList.remove('error');
            input.placeholder = this.t('clearAllPlaceholder');
            
            const errorEl = document.getElementById('clearAllInputError');
            errorEl.classList.remove('show');
            errorEl.textContent = '';
            
            // Show modal
            document.getElementById('clearAllModal').classList.add('active');
            
            // Focus on input field
            setTimeout(() => {
                input.focus();
            }, 100);
            
            // Add Enter key listener for input
            const enterHandler = (e) => {
                if (e.key === 'Enter') {
                    this.confirmClearAll();
                    input.removeEventListener('keypress', enterHandler);
                }
            };
            input.addEventListener('keypress', enterHandler);
            
            // Announce to screen readers
            if (accessibilityManager) {
                accessibilityManager.announce(
                    this.t('clearAllModalTitle') + ': ' + message.replace(/<[^>]*>/g, '').replace('{count}', count),
                    'assertive'
                );
            }
        });
    }

    /**
     * Close clear all confirmation modal
     */
    closeClearAllModal() {
        document.getElementById('clearAllModal').classList.remove('active');
        
        // Clear input
        const input = document.getElementById('clearAllConfirmInput');
        input.value = '';
        input.classList.remove('error');
        
        const errorEl = document.getElementById('clearAllInputError');
        errorEl.classList.remove('show');
        
        // Resolve with false (cancelled)
        if (this.clearAllModalResolve) {
            this.clearAllModalResolve(false);
            this.clearAllModalResolve = null;
        }
    }

    /**
     * Confirm clear all action (validates DELETE input)
     */
    confirmClearAll() {
        const input = document.getElementById('clearAllConfirmInput');
        const inputValue = input.value.trim();
        const errorEl = document.getElementById('clearAllInputError');
        
        // Validate input
        if (inputValue !== 'DELETE') {
            input.classList.add('error');
            errorEl.textContent = this.t('clearAllTypeMismatch');
            errorEl.classList.add('show');
            
            // Shake animation and refocus
            input.focus();
            input.select();
            
            // Announce error to screen readers
            if (accessibilityManager) {
                accessibilityManager.announce(this.t('clearAllTypeMismatch'), 'assertive');
            }
            
            return;
        }
        
        // Close modal
        document.getElementById('clearAllModal').classList.remove('active');
        
        // Clear input
        input.value = '';
        input.classList.remove('error');
        errorEl.classList.remove('show');
        
        // Resolve with true (confirmed)
        if (this.clearAllModalResolve) {
            this.clearAllModalResolve(true);
            this.clearAllModalResolve = null;
        }
    }

    // Save material from modal
    saveMaterialModal() {
        const code = document.getElementById('modalMaterialCode').value.trim();
        const name = document.getElementById('modalMaterialName').value.trim();
        const capacity = document.getElementById('modalMaterialCapacity').value;
        const promoCapacity = document.getElementById('modalPromoCapacity').value;
        const promoActive = document.getElementById('modalPromoActive').checked;
        const promoEndDate = document.getElementById('modalPromoEndDate').value;
        const group = document.getElementById('modalMaterialGroup') ? document.getElementById('modalMaterialGroup').value : null;

        if (!code) {
            this.showToast('Material code is required', 'error');
            document.getElementById('modalMaterialCode').focus();
            return;
        }

        if (!capacity || capacity.toString().trim() === '') {
            this.showToast('Capacity is required', 'error');
            document.getElementById('modalMaterialCapacity').focus();
            return;
        }
        
        const capacityNum = parseInt(capacity);
        if (isNaN(capacityNum) || capacityNum < 0) {
            this.showToast('Capacity must be a valid number greater than or equal to 0', 'error');
            document.getElementById('modalMaterialCapacity').focus();
            return;
        }

        try {
            // Store mode before closing modal (as closeMaterialModal resets it)
            const mode = this.currentModalMode;
            
            this.dataManager.addMaterial(
                code,
                capacity,
                name,
                promoCapacity || null,
                promoActive,
                promoEndDate || null,
                group || null
            );

            // Add to recently added list if it's a new material (not editing)
            if (mode !== 'edit') {
                const material = this.createMaterialObject(
                    code,
                    name,
                    capacityNum,
                    promoCapacity ? parseInt(promoCapacity) : null,
                    promoActive,
                    promoEndDate || null,
                    group || null
                );
                this.addToRecentlyAdded(material);
            }

            this.closeMaterialModal();

            // Refresh materials list if on materials tab
            this.renderMaterialsList();
            
            // Update undo/redo buttons
            if (this.updateUndoRedoButtons) {
                this.updateUndoRedoButtons();
            }

            // Refresh results if we have data displayed (for any mode)
            const inputData = document.getElementById('inputData').value.trim();
            const resultsTableContainer = document.getElementById('resultsTableContainer');
            
            if (inputData && resultsTableContainer && resultsTableContainer.style.display !== 'none') {
                // Re-parse and re-analyze with updated material configuration
                const parsedData = this.reportProcessor.parseReport(inputData);
                const analysis = this.reportProcessor.analyzeStock(parsedData);
                this.displayResults(analysis);
            }

            // Different toast messages based on mode
            if (mode === 'edit') {
                this.showToast(`<i class="fa-solid fa-pen-to-square"></i> Material ${code} updated successfully! Capacity set to ${capacity}.`, 'success', 'Updated');
            } else if (mode === 'quickadd') {
                this.showToast(`<i class="fa-solid fa-bolt"></i> Material ${code} quickly added! Capacity set to ${capacity}.`, 'success', 'Quick Added');
            } else {
                this.showToast(`<i class="fa-solid fa-plus"></i> Material ${code} added successfully! Capacity set to ${capacity}.`, 'success', 'Added');
            }

        } catch (error) {
            this.showToast('Error saving material: ' + error.message, 'error');
        }
    }

    // Delete material
    async deleteMaterial(code) {
        const message = this.t('deleteMaterialMessage').replace('{code}', code);
        const confirmed = await this.showDeleteModal(message);
        
        if (!confirmed) {
            return;
        }

        if (this.dataManager.deleteMaterial(code)) {
            this.renderMaterialsList();
            
            // Update undo/redo buttons
            if (this.updateUndoRedoButtons) {
                this.updateUndoRedoButtons();
            }
            
            this.showToast(`<i class="fa-solid fa-trash-can"></i> Material ${code} deleted successfully`, 'success');
            
            // Refresh results if data is displayed
            const inputData = document.getElementById('inputData').value.trim();
            const resultsTableContainer = document.getElementById('resultsTableContainer');
            
            if (inputData && resultsTableContainer && resultsTableContainer.style.display !== 'none') {
                const parsedData = this.reportProcessor.parseReport(inputData);
                const analysis = this.reportProcessor.analyzeStock(parsedData);
                this.displayResults(analysis);
            }
            
            this.showToast(`Material ${code} deleted successfully!`, 'success');
        } else {
            this.showToast('Error deleting material.', 'error');
        }
    }

    // Clear all materials
    async clearAllMaterials() {
        const materials = this.dataManager.getAllMaterials();
        
        if (materials.length === 0) {
            this.showToast('No materials to clear.', 'info');
            return;
        }

        const materialCount = materials.length;
        const message = this.t('clearAllMaterialsMessage');
        const confirmed = await this.showClearAllModal(message, materialCount);
        
        if (!confirmed) {
            this.showToast(this.t('clearAllCancelled'), 'info');
            return;
        }

        // Clear all materials
        try {
            localStorage.removeItem(this.dataManager.STORAGE_KEYS.MATERIALS);
            this.dataManager.materials = {};
            this.renderMaterialsList();
            
            // Refresh results if data is present
            const inputData = document.getElementById('inputData').value.trim();
            if (inputData) {
                const parsedData = this.reportProcessor.parseReport(inputData);
                const analysis = this.reportProcessor.analyzeStock(parsedData);
                this.displayResults(analysis);
            }
            
            this.showToast(`<i class="fa-solid fa-trash-can"></i> All ${materialCount} material${materialCount > 1 ? 's' : ''} cleared successfully!`, 'success', 'Cleared');
        } catch (error) {
            this.showToast('Error clearing materials: ' + error.message, 'error');
        }
    }

    // Clear all archive
    async clearAllArchive() {
        const archive = this.dataManager.getArchive();
        
        if (archive.length === 0) {
            this.showToast('No archived reports to clear.', 'info');
            return;
        }

        const archiveCount = archive.length;
        const message = this.t('clearAllArchiveMessage');
        const confirmed = await this.showClearAllModal(message, archiveCount);
        
        if (!confirmed) {
            this.showToast(this.t('clearAllCancelled'), 'info');
            return;
        }

        // Clear all archive (both localStorage and IndexedDB)
        try {
            // Use dataManager's clearArchive method to properly clear both storage layers
            await this.dataManager.clearArchive();
            
            this.renderArchiveList();
            
            this.showToast(`<i class="fa-solid fa-trash-can"></i> All ${archiveCount} archived report${archiveCount > 1 ? 's' : ''} cleared successfully!`, 'success', 'Cleared');
        } catch (error) {
            this.showToast('Error clearing archive: ' + error.message, 'error');
        }
    }

    // Export data as JSON file
    exportData() {
        try {
            this.dataManager.downloadBackup();
            
            const materialsCount = Object.keys(this.dataManager.materials).length;
            const archiveCount = this.dataManager.archive.length;
            
            this.showToast(
                `Backup downloaded: ${materialsCount} materials, ${archiveCount} reports`, 
                'success', 
                '<i class="fa-solid fa-file-arrow-down"></i> Exported'
            );
        } catch (error) {
            this.showToast('Error exporting data: ' + error.message, 'error');
        }
    }

    // Import data from JSON file
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Reset file input so the same file can be selected again
        event.target.value = '';

        if (!file.name.endsWith('.json')) {
            this.showToast('Please select a valid JSON file', 'error');
            return;
        }

        this.dataManager.uploadBackup(file)
            .then(result => {
                // Refresh UI
                this.renderMaterialsList();
                
                // Show success message
                const message = this.t('backupImported')
                    .replace('{materials}', result.materialsCount)
                    .replace('{archive}', result.archiveCount);
                
                this.showToast(message, 'success', '<i class="fa-solid fa-file-arrow-up"></i> ' + this.t('backupSuccess'));
            })
            .catch(error => {
                this.showToast(
                    this.t('backupError') + ': ' + error.message, 
                    'error'
                );
            });
    }

    // Restore data from IndexedDB
    async restoreFromIndexedDB() {
        const message = this.t('restoreFromIndexedDBMessage');
        const confirmed = await this.showDeleteModal(message);
        
        if (!confirmed) {
            return;
        }

        try {
            const result = await this.dataManager.restoreFromIndexedDB();
            
            // Refresh UI
            this.renderMaterialsList();
            if (typeof this.renderArchiveList === 'function') {
                this.renderArchiveList();
            }
            
            // Update sync status
            if (typeof this.updateSyncStatus === 'function') {
                this.updateSyncStatus();
            }
            
            const message = `${this.t('restoreSuccess')}: ${result.materialsCount} materials, ${result.archiveCount} reports`;
            this.showToast(message, 'success', '<i class="fa-solid fa-bolt"></i> ' + this.t('restoreSuccess'));
        } catch (error) {
            this.showToast(
                this.t('restoreError') + ': ' + error.message, 
                'error'
            );
        }
    }

    // ========================
    // Recently Added Materials Management
    // ========================

    /**
     * Load recently added materials from sessionStorage
     */
    loadRecentlyAdded() {
        try {
            const stored = sessionStorage.getItem('recentlyAddedMaterials');
            if (stored) {
                this.recentlyAddedMaterials = JSON.parse(stored);
            } else {
                this.recentlyAddedMaterials = [];
            }
        } catch (error) {
            console.error('Error loading recently added materials:', error);
            this.recentlyAddedMaterials = [];
        }
    }

    /**
     * Save recently added materials to sessionStorage
     */
    saveRecentlyAdded() {
        try {
            sessionStorage.setItem('recentlyAddedMaterials', JSON.stringify(this.recentlyAddedMaterials));
        } catch (error) {
            console.error('Error saving recently added materials:', error);
        }
    }

    /**
     * Create a material object with consistent structure
     * @param {string} code - Material code
     * @param {string} name - Material name
     * @param {number} capacity - MKT capacity
     * @param {number|null} promoCapacity - Promotional capacity
     * @param {boolean} promoActive - Whether promo is active
     * @param {string|null} promoEndDate - Promo end date
     * @param {string|null} group - Group ID
     * @returns {Object} Material object with consistent structure
     */
    createMaterialObject(code, name, capacity, promoCapacity = null, promoActive = false, promoEndDate = null, group = null) {
        return {
            code: code,
            name: name,
            capacity: capacity,
            promoCapacity: promoCapacity,
            promoActive: promoActive,
            promoEndDate: promoEndDate,
            group: group
        };
    }

    /**
     * Add a material to the recently added list
     * @param {Object} material - Material object
     */
    addToRecentlyAdded(material) {
        // Add timestamp
        const item = {
            ...material,
            addedAt: new Date().toISOString()
        };
        
        // Add to beginning of array (most recent first)
        this.recentlyAddedMaterials.unshift(item);
        
        // Limit to maximum recent items
        if (this.recentlyAddedMaterials.length > UIManager.MAX_RECENT_MATERIALS) {
            this.recentlyAddedMaterials = this.recentlyAddedMaterials.slice(0, UIManager.MAX_RECENT_MATERIALS);
        }
        
        // Save to session storage
        this.saveRecentlyAdded();
        
        // Update UI
        this.renderRecentlyAdded();
    }

    /**
     * Remove a material from the recently added list
     * @param {string} materialCode - Material code to remove
     */
    removeFromRecentlyAdded(materialCode) {
        this.recentlyAddedMaterials = this.recentlyAddedMaterials.filter(
            item => item.code !== materialCode
        );
        this.saveRecentlyAdded();
        this.renderRecentlyAdded();
    }

    /**
     * Clear all recently added materials
     */
    clearRecentlyAdded() {
        if (this.recentlyAddedMaterials.length === 0) {
            this.showToast(this.t('noRecentlyAddedMaterials') || 'No materials in the list', 'info');
            return;
        }
        
        const count = this.recentlyAddedMaterials.length;
        this.recentlyAddedMaterials = [];
        this.saveRecentlyAdded();
        this.renderRecentlyAdded();
        
        const message = (this.t('recentlyAddedCleared') || 'Cleared {count} materials from the list').replace('{count}', count);
        this.showToast(message, 'success');
    }

    /**
     * Render the recently added materials list
     */
    renderRecentlyAdded() {
        const card = document.getElementById('recentlyAddedCard');
        const list = document.getElementById('recentlyAddedList');
        const countBadge = document.getElementById('recentlyAddedCount');
        
        if (!card || !list || !countBadge) return;
        
        // Update count badge
        countBadge.textContent = this.recentlyAddedMaterials.length;
        
        // Show/hide card based on whether there are items
        if (this.recentlyAddedMaterials.length === 0) {
            card.style.display = 'none';
            return;
        }
        
        card.style.display = 'block';
        
        // Render list items
        list.innerHTML = this.recentlyAddedMaterials.map((item, index) => {
            const timeAgo = this.getTimeAgo(item.addedAt);
            const isJustAdded = index === 0 && (Date.now() - new Date(item.addedAt).getTime()) < 5000; // Within 5 seconds
            
            return `
                <div class="recently-added-item ${isJustAdded ? 'just-added' : ''}" data-material-code="${item.code}">
                    <div class="recently-added-item-content">
                        <div class="recently-added-item-header">
                            <span class="recently-added-item-code">
                                <i class="fa-solid fa-box"></i> ${item.code}
                            </span>
                            ${item.name ? `<span class="recently-added-item-name">${item.name}</span>` : ''}
                        </div>
                        <div class="recently-added-item-details">
                            <div class="recently-added-item-detail">
                                <i class="fa-solid fa-warehouse"></i>
                                <strong>${this.t('mktCapacity') || 'Capacity'}:</strong> ${item.capacity}
                            </div>
                            ${item.promoCapacity ? `
                                <div class="recently-added-item-detail">
                                    <i class="fa-solid fa-gift"></i>
                                    <strong>${this.t('promoCapacity') || 'Promo'}:</strong> ${item.promoCapacity}
                                </div>
                            ` : ''}
                            ${item.group ? `
                                <div class="recently-added-item-detail">
                                    <i class="fa-solid fa-tag"></i>
                                    <strong>${this.t('materialGroup') || 'Group'}:</strong> ${this.dataManager.getGroup(item.group)?.name || item.group}
                                </div>
                            ` : ''}
                        </div>
                        <div class="recently-added-item-time">
                            <i class="fa-regular fa-clock"></i> ${this.t('addedTimeAgo') || 'Added'} ${timeAgo}
                        </div>
                    </div>
                    <div class="recently-added-item-actions">
                        <button class="btn-primary btn-small" onclick="ui.openEditModal('${item.code}')" title="${this.t('btnEdit') || 'Edit'}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-danger btn-small" onclick="ui.removeFromRecentlyAdded('${item.code}')" title="${this.t('btnRemove') || 'Remove from list'}">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll to top of the recently added card to show the new item
        if (this.recentlyAddedMaterials.length > 0) {
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }

    /**
     * Get human-readable time ago string
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Time ago string
     */
    getTimeAgo(timestamp) {
        if (!timestamp) return this.t('undoJustNow') || 'just now';
        
        const now = Date.now();
        const time = new Date(timestamp).getTime();
        const diff = now - time;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        
        if (seconds < 10) {
            return this.t('undoJustNow') || 'just now';
        } else if (seconds < 60) {
            return (this.t('secondsAgo') || '{seconds} seconds ago').replace('{seconds}', seconds);
        } else if (minutes < 60) {
            return (this.t('undoMinutesAgo') || '{minutes} minutes ago').replace('{minutes}', minutes);
        } else {
            return (this.t('undoHoursAgo') || '{hours} hours ago').replace('{hours}', hours);
        }
    }



}

