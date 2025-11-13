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
            if (typeof accessibilityManager !== 'undefined' && accessibilityManager) {
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
            if (typeof accessibilityManager !== 'undefined' && accessibilityManager) {
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
            if (typeof accessibilityManager !== 'undefined' && accessibilityManager) {
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

    // Helper method to detect material changes and build change summary
    detectMaterialChanges(oldMaterial, newData) {
        if (!oldMaterial) {
            return { hasChanges: true, changes: [] };
        }

        const changes = [];
        const newCapacityNum = parseInt(newData.capacity);

        // Check capacity change (capacity is already stored as a number in data model)
        if (oldMaterial.capacity !== newCapacityNum) {
            changes.push(`Capacity: ${oldMaterial.capacity} → ${newCapacityNum}`);
        }

        // Check group/category change
        const oldGroup = oldMaterial.group || null;
        const newGroup = newData.group || null;
        if (oldGroup !== newGroup) {
            const oldGroupName = oldGroup ? this.dataManager.getGroup(oldGroup)?.name || oldGroup : 'None';
            const newGroupName = newGroup ? this.dataManager.getGroup(newGroup)?.name || newGroup : 'None';
            changes.push(`Group: ${oldGroupName} → ${newGroupName}`);
        }

        // Check name change (trim whitespace for comparison)
        const oldName = (oldMaterial.name || '').trim();
        const newName = (newData.name || '').trim();
        if (oldName !== newName) {
            const oldDisplay = oldName || '(empty)';
            const newDisplay = newName || '(empty)';
            changes.push(`Name: ${oldDisplay} → ${newDisplay}`);
        }

        // Check promo capacity change
        const oldPromoCapacity = oldMaterial.promoCapacity || null;
        const newPromoCapacity = newData.promoCapacity ? parseInt(newData.promoCapacity) : null;
        if (oldPromoCapacity !== newPromoCapacity) {
            const oldDisplay = oldPromoCapacity || 'None';
            const newDisplay = newPromoCapacity || 'None';
            changes.push(`Promo Capacity: ${oldDisplay} → ${newDisplay}`);
        }

        return {
            hasChanges: changes.length > 0,
            changes: changes
        };
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
            
            // Get old material data for comparison (if editing)
            const oldMaterial = mode === 'edit' ? this.dataManager.getMaterial(code) : null;
            
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

            // Refresh materials list if on materials tab, preserving state
            this.renderMaterialsList({ 
                preserveState: true, 
                highlightMaterialCode: mode === 'edit' ? code : null 
            });
            
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
                // Detect changes and build contextual feedback
                const changeDetection = this.detectMaterialChanges(oldMaterial, {
                    capacity: capacityNum,
                    group: group,
                    name: name,
                    promoCapacity: promoCapacity
                });
                
                let toastMessage = `<i class="fa-solid fa-pen-to-square"></i> Material ${code} updated successfully!`;
                
                if (changeDetection.hasChanges) {
                    toastMessage += ` ${changeDetection.changes.join(', ')}.`;
                } else {
                    toastMessage += ' No changes detected.';
                }
                
                this.showToast(toastMessage, 'success', 'Updated');
            } else if (mode === 'quickadd') {
                this.showToast(`<i class="fa-solid fa-bolt"></i> Material ${code} quickly added! Capacity set to ${capacityNum}.`, 'success', 'Quick Added');
            } else {
                this.showToast(`<i class="fa-solid fa-plus"></i> Material ${code} added successfully! Capacity set to ${capacityNum}.`, 'success', 'Added');
            }

        } catch (error) {
            this.showToast('Error saving material: ' + SecurityUtils.escapeHTML(error.message), 'error');
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
            // Preserve state when deleting (but don't highlight anything)
            this.renderMaterialsList({ preserveState: true });
            
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
            this.showToast('Error clearing materials: ' + SecurityUtils.escapeHTML(error.message), 'error');
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
            this.showToast('Error clearing archive: ' + SecurityUtils.escapeHTML(error.message), 'error');
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
            this.showToast('Error exporting data: ' + SecurityUtils.escapeHTML(error.message), 'error');
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

    // ========================
    // Quick Category Assignment
    // ========================

    /**
     * Create a category option element safely
     * @param {Object} options - Option configuration
     * @param {string} options.groupId - Group ID (empty for ungrouped)
     * @param {string} options.groupName - Group name
     * @param {string} [options.color] - Group color
     * @param {boolean} options.isSelected - Whether this option is selected
     * @returns {HTMLElement} Category option element
     */
    createCategoryOption({ groupId, groupName, color, isSelected }) {
        const option = document.createElement('div');
        option.className = 'category-dropdown-option';
        option.dataset.groupId = groupId;
        option.dataset.groupName = groupName;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        option.setAttribute('tabindex', '0');
        
        const dot = document.createElement('span');
        dot.className = 'category-option-dot';
        // Validate color to prevent CSS injection
        const validatedColor = color ? SecurityUtils.validateColor(color) : null;
        dot.style.background = validatedColor || 'var(--default-category-color)';
        
        const name = document.createElement('span');
        name.className = 'category-option-name';
        name.textContent = groupName;
        
        option.appendChild(dot);
        option.appendChild(name);
        
        if (isSelected) {
            const check = document.createElement('i');
            check.className = 'fa-solid fa-check category-option-check';
            option.appendChild(check);
        }
        
        return option;
    }

    /**
     * Open custom category dropdown with search
     * @param {HTMLElement} button - The button that was clicked
     * @param {Event} event - Click event
     */
    openCategoryDropdown(button, event) {
        event.stopPropagation();
        
        // Close any existing dropdown
        this.closeCategoryDropdown();
        
        // Store button reference for accessibility updates
        this.currentCategoryButton = button;
        
        // Update aria-expanded on the button
        button.setAttribute('aria-expanded', 'true');
        
        const { materialCode, currentGroup: currentGroupId } = button.dataset;
        const groups = this.dataManager.getAllGroups();
        
        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.className = 'category-dropdown-popup';
        dropdown.id = 'categoryDropdownPopup';
        dropdown.setAttribute('role', 'listbox');
        dropdown.setAttribute('aria-label', this.t('selectCategory') || 'Select category');
        
        // Create header with search
        const header = document.createElement('div');
        header.className = 'category-dropdown-header';
        
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'category-dropdown-search-wrapper';
        
        const searchIcon = document.createElement('i');
        searchIcon.className = 'fa-solid fa-search category-search-icon';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'category-dropdown-search';
        searchInput.placeholder = this.t('searchCategories') || 'Search categories...';
        searchInput.autocomplete = 'off';
        searchInput.setAttribute('role', 'searchbox');
        searchInput.setAttribute('aria-label', this.t('searchCategories') || 'Search categories');
        searchInput.setAttribute('aria-controls', 'categoryDropdownOptions');
        
        searchWrapper.appendChild(searchIcon);
        searchWrapper.appendChild(searchInput);
        header.appendChild(searchWrapper);
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'category-dropdown-options';
        optionsContainer.id = 'categoryDropdownOptions';
        optionsContainer.setAttribute('role', 'group');
        
        // Add ungrouped option
        const ungroupedOption = this.createCategoryOption({
            groupId: '',
            groupName: this.t('groupUngrouped'),
            color: null, // Will use CSS variable
            isSelected: currentGroupId ? false : true
        });
        optionsContainer.appendChild(ungroupedOption);
        
        // Add group options
        groups.forEach(group => {
            const option = this.createCategoryOption({
                groupId: group.id,
                groupName: group.name,
                color: group.color || null, // Will use CSS variable if no color
                isSelected: currentGroupId === group.id
            });
            optionsContainer.appendChild(option);
        });
        
        // Create footer
        const footer = document.createElement('div');
        footer.className = 'category-dropdown-footer';
        
        const createButton = document.createElement('button');
        createButton.className = 'category-dropdown-create';
        createButton.type = 'button';
        createButton.addEventListener('click', () => {
            this.showGroupModal();
            this.closeCategoryDropdown();
        });
        
        const createIcon = document.createElement('i');
        createIcon.className = 'fa-solid fa-plus';
        
        const createText = document.createTextNode(' ' + (this.t('btnCreateGroup') || 'Create New'));
        
        createButton.appendChild(createIcon);
        createButton.appendChild(createText);
        footer.appendChild(createButton);
        
        // Assemble dropdown
        dropdown.appendChild(header);
        dropdown.appendChild(optionsContainer);
        dropdown.appendChild(footer);
        
        document.body.appendChild(dropdown);
        
        // Position dropdown with viewport overflow handling
        const buttonRect = button.getBoundingClientRect();
        const dropdownRect = dropdown.getBoundingClientRect();
        
        // Default position: below the button, left-aligned
        let top = buttonRect.bottom + window.scrollY + 4;
        let left = buttonRect.left + window.scrollX;
        
        // Check for right overflow
        if (left + dropdownRect.width > window.innerWidth) {
            left = Math.max(8, window.innerWidth - dropdownRect.width - 8);
        }
        
        // Check for bottom overflow
        if (buttonRect.bottom + dropdownRect.height > window.innerHeight) {
            // Position above the button
            top = Math.max(8, buttonRect.top + window.scrollY - dropdownRect.height - 4);
        }
        
        dropdown.style.position = 'absolute';
        dropdown.style.top = `${top}px`;
        dropdown.style.left = `${left}px`;
        dropdown.style.minWidth = `${Math.max(buttonRect.width, 200)}px`;
        
        // Focus search input
        setTimeout(() => {
            const searchInput = dropdown.querySelector('.category-dropdown-search');
            if (searchInput) searchInput.focus();
        }, 10);
        
        // Add event listeners
        this.setupCategoryDropdownListeners(dropdown, materialCode);
        
        // Add show class for animation
        setTimeout(() => dropdown.classList.add('show'), 10);
    }
    
    /**
     * Setup event listeners for category dropdown
     * @param {HTMLElement} dropdown - Dropdown element
     * @param {string} materialCode - Material code
     */
    setupCategoryDropdownListeners(dropdown, materialCode) {
        const searchInput = dropdown.querySelector('.category-dropdown-search');
        const optionsContainer = dropdown.querySelector('#categoryDropdownOptions');
        
        // Store event handlers for cleanup
        this.categoryDropdownHandlers = this.categoryDropdownHandlers || {};
        
        // Search functionality
        this.categoryDropdownHandlers.searchInput = (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const options = optionsContainer.querySelectorAll('.category-dropdown-option');
            
            options.forEach(option => {
                const groupName = option.dataset.groupName.toLowerCase();
                if (groupName.includes(searchTerm)) {
                    option.style.display = 'flex';
                } else {
                    option.style.display = 'none';
                }
            });
        };
        searchInput.addEventListener('input', this.categoryDropdownHandlers.searchInput);
        
        // Keyboard navigation for search input
        this.categoryDropdownHandlers.searchKeydown = (e) => {
            const options = optionsContainer.querySelectorAll('.category-dropdown-option');
            if (e.key === 'Escape') {
                this.closeCategoryDropdown();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const firstVisible = Array.from(options).find(opt => opt.style.display !== 'none');
                if (firstVisible) firstVisible.focus();
            }
        };
        searchInput.addEventListener('keydown', this.categoryDropdownHandlers.searchKeydown);
        
        // Prevent dropdown from closing when clicking inside
        this.categoryDropdownHandlers.dropdownClick = (e) => {
            e.stopPropagation();
        };
        dropdown.addEventListener('click', this.categoryDropdownHandlers.dropdownClick);
        
        // Option click and keyboard handlers
        const options = optionsContainer.querySelectorAll('.category-dropdown-option');
        this.categoryDropdownHandlers.optionHandlers = [];
        
        options.forEach((option, index) => {
            // Click handler
            const clickHandler = () => {
                const { groupId } = option.dataset;
                this.quickAssignCategory(materialCode, groupId);
                this.closeCategoryDropdown();
            };
            option.addEventListener('click', clickHandler);
            
            // Keyboard handler
            const keydownHandler = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    option.click();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    // Find next visible option
                    const visibleOptions = Array.from(options).filter(opt => opt.style.display !== 'none');
                    const currentVisibleIndex = visibleOptions.indexOf(option);
                    const nextVisible = visibleOptions[currentVisibleIndex + 1];
                    if (nextVisible) nextVisible.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    // Find previous visible option or return to search
                    const visibleOptions = Array.from(options).filter(opt => opt.style.display !== 'none');
                    const currentVisibleIndex = visibleOptions.indexOf(option);
                    if (currentVisibleIndex === 0) {
                        searchInput.focus();
                    } else {
                        const previousVisible = visibleOptions[currentVisibleIndex - 1];
                        if (previousVisible) previousVisible.focus();
                    }
                } else if (e.key === 'Escape') {
                    this.closeCategoryDropdown();
                }
            };
            option.addEventListener('keydown', keydownHandler);
            
            // Store handlers for cleanup
            this.categoryDropdownHandlers.optionHandlers.push({
                element: option,
                clickHandler,
                keydownHandler
            });
        });
        
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', this.closeCategoryDropdownHandler = () => {
                this.closeCategoryDropdown();
            }, { once: true });
        }, 10);
    }
    
    /**
     * Close category dropdown
     */
    closeCategoryDropdown() {
        const dropdown = document.getElementById('categoryDropdownPopup');
        if (dropdown) {
            // Explicitly remove all event listeners before removing the dropdown
            if (this.categoryDropdownHandlers) {
                const searchInput = dropdown.querySelector('.category-dropdown-search');
                
                // Remove search input listeners
                if (searchInput) {
                    if (this.categoryDropdownHandlers.searchInput) {
                        searchInput.removeEventListener('input', this.categoryDropdownHandlers.searchInput);
                    }
                    if (this.categoryDropdownHandlers.searchKeydown) {
                        searchInput.removeEventListener('keydown', this.categoryDropdownHandlers.searchKeydown);
                    }
                }
                
                // Remove dropdown click listener
                if (this.categoryDropdownHandlers.dropdownClick) {
                    dropdown.removeEventListener('click', this.categoryDropdownHandlers.dropdownClick);
                }
                
                // Remove option listeners
                if (this.categoryDropdownHandlers.optionHandlers) {
                    this.categoryDropdownHandlers.optionHandlers.forEach(({ element, clickHandler, keydownHandler }) => {
                        element.removeEventListener('click', clickHandler);
                        element.removeEventListener('keydown', keydownHandler);
                    });
                }
                
                // Clear handlers object
                this.categoryDropdownHandlers = null;
            }
            
            dropdown.classList.remove('show');
            
            // Clear any pending removal timeout to prevent race condition
            if (this.categoryDropdownRemovalTimeout) {
                clearTimeout(this.categoryDropdownRemovalTimeout);
            }
            
            // Schedule removal with stored timeout ID
            this.categoryDropdownRemovalTimeout = setTimeout(() => {
                // Check if dropdown still exists before removing
                const stillExists = document.getElementById('categoryDropdownPopup');
                if (stillExists) {
                    stillExists.remove();
                }
                this.categoryDropdownRemovalTimeout = null;
            }, 200);
        }
        
        // Update aria-expanded on the button
        if (this.currentCategoryButton) {
            this.currentCategoryButton.setAttribute('aria-expanded', 'false');
            this.currentCategoryButton = null;
        }
        
        // Remove click handler
        if (this.closeCategoryDropdownHandler) {
            document.removeEventListener('click', this.closeCategoryDropdownHandler);
            this.closeCategoryDropdownHandler = null;
        }
    }

    /**
     * Quick assign category to material without opening edit dialog
     * @param {string} materialCode - Material code
     * @param {string} groupId - Group ID (empty string for ungrouped)
     */
    quickAssignCategory(materialCode, groupId) {
        const material = this.dataManager.getMaterial(materialCode);
        if (!material) {
            this.showToast('Material not found', 'error');
            return;
        }

        const oldGroup = material.group;
        const newGroup = groupId || null;

        // No change
        if (oldGroup === newGroup) {
            return;
        }

        try {
            // Update material with new group
            const success = this.dataManager.assignMaterialToGroup(materialCode, newGroup);

            if (success) {
                // Get group names for feedback
                const oldGroupName = oldGroup 
                    ? (this.dataManager.getGroup(oldGroup)?.name || this.t('groupUngrouped'))
                    : this.t('groupUngrouped');
                const newGroupName = newGroup 
                    ? (this.dataManager.getGroup(newGroup)?.name || this.t('groupUngrouped'))
                    : this.t('groupUngrouped');

                // Show success message with escaped values to prevent XSS
                const message = `<i class="fa-solid fa-tag"></i> ${SecurityUtils.escapeHTML(materialCode)}: ${SecurityUtils.escapeHTML(oldGroupName)} → ${SecurityUtils.escapeHTML(newGroupName)}`;
                this.showToast(message, 'success', this.t('categoryUpdated') || 'Category Updated');

                // Update the visual indicator
                this.updateCategoryIndicator(materialCode, newGroup);

                // Announce to screen readers
                if (typeof accessibilityManager !== 'undefined' && accessibilityManager) {
                    accessibilityManager.announce(
                        `Material ${SecurityUtils.escapeHTML(materialCode)} moved to ${SecurityUtils.escapeHTML(newGroupName)}`,
                        'polite'
                    );
                }
            } else {
                this.showToast('Error updating category', 'error');
                // Revert dropdown to previous value
                this.revertCategoryDropdown(materialCode, oldGroup);
            }
        } catch (error) {
            console.error('Quick category assignment error:', error);
            this.showToast('Error: ' + SecurityUtils.escapeHTML(error.message), 'error');
            // Revert dropdown to previous value
            this.revertCategoryDropdown(materialCode, oldGroup);
        }
    }

    /**
     * Update the category indicator visual element
     * @param {string} materialCode - Material code
     * @param {string|null} groupId - New group ID
     */
    updateCategoryIndicator(materialCode, groupId) {
        // Escape materialCode to prevent selector injection
        const escapedCode = CSS.escape(materialCode);
        const row = document.querySelector(`tr[data-material-code="${escapedCode}"]`);
        if (!row) return;

        const wrapper = row.querySelector('.quick-category-select-wrapper');
        const button = row.querySelector('.quick-category-select');
        if (!wrapper || !button) return;

        // Add animation class
        wrapper.classList.add('category-changed');
        setTimeout(() => wrapper.classList.remove('category-changed'), 400);

        // Update styling and text based on new group
        if (groupId) {
            const group = this.dataManager.getGroup(groupId);
            if (group) {
                // Validate color to prevent CSS injection
                const rawColor = group.color || 'var(--default-group-color)';
                const color = SecurityUtils.validateColor(rawColor) || 'var(--default-group-color)';
                
                wrapper.style.setProperty('--category-color', color);
                wrapper.style.setProperty('--category-bg', `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`);
                wrapper.style.setProperty('--category-bg-hover', `linear-gradient(135deg, ${color}25 0%, ${color}40 100%)`);
                wrapper.style.setProperty('--category-text', this.getContrastColor(color));
                button.setAttribute('data-has-category', 'true');
                button.setAttribute('data-current-group', groupId);
                
                // Update button text
                const textSpan = button.querySelector('.category-select-text');
                if (textSpan) textSpan.textContent = group.name;
            }
        } else {
            // Reset to ungrouped state
            wrapper.style.setProperty('--category-color', 'var(--default-category-color)');
            wrapper.style.setProperty('--category-bg', '');
            wrapper.style.setProperty('--category-bg-hover', '');
            wrapper.style.setProperty('--category-text', '');
            button.setAttribute('data-has-category', 'false');
            button.setAttribute('data-current-group', '');
            
            // Update button text
            const textSpan = button.querySelector('.category-select-text');
            if (textSpan) textSpan.textContent = this.t('groupUngrouped');
        }
    }

    /**
     * Get contrasting text color for a given background color
     * @param {string} hexColor - Hex color code
     * @returns {string} - Black or color-adjusted text color
     */
    getContrastColor(hexColor) {
        // Validate input
        if (!hexColor || typeof hexColor !== 'string') {
            return '#000000'; // Default to black for invalid input
        }
        
        // Convert hex to RGB
        const hex = hexColor.replace('#', '');
        
        // Validate hex format (must be 3 or 6 characters)
        if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) {
            console.warn(`Invalid hex color: ${hexColor}, using default`);
            return '#000000';
        }
        
        // Expand shorthand format (e.g., '03F' to '0033FF')
        const fullHex = hex.length === 3 
            ? hex.split('').map(char => char + char).join('')
            : hex;
        
        const r = parseInt(fullHex.substring(0, 2), 16);
        const g = parseInt(fullHex.substring(2, 4), 16);
        const b = parseInt(fullHex.substring(4, 6), 16);
        
        // Validate parsed values
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            console.warn(`Failed to parse hex color: ${hexColor}, using default`);
            return '#000000';
        }
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return darker shade of the color for better readability
        return luminance > 0.5 ? `rgb(${Math.floor(r * 0.4)}, ${Math.floor(g * 0.4)}, ${Math.floor(b * 0.4)})` : hexColor;
    }

    /**
     * Revert category dropdown to previous value on error
     * @param {string} materialCode - Material code
     * @param {string|null} groupId - Previous group ID
     */
    revertCategoryDropdown(materialCode, groupId) {
        // Since we're using a custom button dropdown now (not a select element),
        // we need to update the visual indicator to revert to the previous state
        this.updateCategoryIndicator(materialCode, groupId);
    }


}

