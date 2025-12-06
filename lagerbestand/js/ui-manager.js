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
        
        // Cached DOM references for performance
        this.cachedElements = {
            resultsTableContainer: null
        };
        
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
        
        // Track the currently active report ID for accurate archive fallback
        this.currentReportId = null;
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
        
        // Escape title if it contains user data, but allow safe HTML icons in title
        const safeTitle = title ? SecurityUtils.escapeHTML(title) : titles[type];
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${safeTitle}</div>
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

        // Invalidate cached DOM references when switching tabs
        // as tab content may be re-rendered
        this.invalidateCachedElements();

        // Refresh content based on tab
        if (tabName === 'materials') {
            this.renderMaterialsList();
        } else if (tabName === 'archive') {
            this.renderArchiveList();
        } else if (tabName === 'settings') {
            // Refresh cloud sync status to show latest unsynced changes
            this.renderCloudSyncStatus();
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
        const modal = document.getElementById('materialModal');
        modal.classList.remove('active');
        modal.style.display = 'none';
        modal.onclick = null; // Remove any click handlers
        this.currentModalMode = null;
        this.currentEditingMaterial = null;
        this.quickAddContext = null;
        
        // Re-enable code field in case it was disabled
        const codeField = document.getElementById('modalMaterialCode');
        if (codeField) {
            codeField.disabled = false;
        }
    }

    // Alias for closing the material modal (used by cloud sync settings)
    closeModal() {
        this.closeMaterialModal();
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
            // Use textContent instead of innerHTML to prevent XSS
            document.getElementById('deleteModalMessage').textContent = message;
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
            // Use textContent instead of innerHTML to prevent XSS
            document.getElementById('clearAllModalMessage').textContent = message.replace('{count}', count);
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
        
        // Helper to escape HTML for safe display in toasts
        const esc = (str) => SecurityUtils.escapeHTML(String(str));

        // Check capacity change (capacity is already stored as a number in data model)
        if (oldMaterial.capacity !== newCapacityNum) {
            changes.push(`Capacity: ${esc(oldMaterial.capacity)} → ${esc(newCapacityNum)}`);
        }

        // Check group/category change
        const oldGroup = oldMaterial.group || null;
        const newGroup = newData.group || null;
        if (oldGroup !== newGroup) {
            const oldGroupName = oldGroup ? this.dataManager.getGroup(oldGroup)?.name || oldGroup : 'None';
            const newGroupName = newGroup ? this.dataManager.getGroup(newGroup)?.name || newGroup : 'None';
            changes.push(`Group: ${esc(oldGroupName)} → ${esc(newGroupName)}`);
        }

        // Check name change (trim whitespace for comparison)
        const oldName = (oldMaterial.name || '').trim();
        const newName = (newData.name || '').trim();
        if (oldName !== newName) {
            const oldDisplay = oldName || '(empty)';
            const newDisplay = newName || '(empty)';
            changes.push(`Name: ${esc(oldDisplay)} → ${esc(newDisplay)}`);
        }

        // Check promo capacity change
        const oldPromoCapacity = oldMaterial.promoCapacity || null;
        const newPromoCapacity = newData.promoCapacity ? parseInt(newData.promoCapacity) : null;
        if (oldPromoCapacity !== newPromoCapacity) {
            const oldDisplay = oldPromoCapacity || 'None';
            const newDisplay = newPromoCapacity || 'None';
            changes.push(`Promo Capacity: ${esc(oldDisplay)} → ${esc(newDisplay)}`);
        }

        return {
            hasChanges: changes.length > 0,
            changes: changes
        };
    }

    /**
     * Refresh results table with updated material configuration
     * Retrieves input data from memory or archive and re-analyzes stock
     * @returns {boolean} True if refresh was successful, false otherwise
     */
    refreshResultsTable() {
        // Get cached or fresh container reference
        if (!this.cachedElements.resultsTableContainer) {
            this.cachedElements.resultsTableContainer = document.getElementById('resultsTableContainer');
        }
        
        const resultsTableContainer = this.cachedElements.resultsTableContainer;
        
        // Validate cached reference is still in DOM
        if (resultsTableContainer && !document.body.contains(resultsTableContainer)) {
            this.invalidateCachedElements();
            return false;
        }
        
        if (!resultsTableContainer) {
            return false;
        }
        
        // Try to get input data from memory or archive
        let inputData = this.currentInputData;
        if (!inputData) {
            // Fallback: get from archive using tracked report ID
            // This ensures we refresh with the correct report data
            if (this.currentReportId) {
                const archiveEntry = this.dataManager.getArchiveEntryById(this.currentReportId);
                if (archiveEntry) {
                    const { rawData } = archiveEntry;
                    inputData = rawData;
                }
            }
            
            // Final fallback: if no tracked ID or entry not found, use most recent
            // This handles edge cases like page reload
            if (!inputData) {
                const archive = this.dataManager.getArchive();
                if (archive && archive.length > 0) {
                    const { rawData, id } = archive[0];
                    inputData = rawData;
                    // Update tracking to match the fallback entry
                    this.currentReportId = id;
                }
            }
        }
        
        // Refresh if we have both input data and container element
        // Note: Container must exist, but visibility state is not checked
        if (inputData) {
            try {
                // Store it back for next time
                this.currentInputData = inputData;
                
                // Re-parse and re-analyze with updated material configuration
                const parsedData = this.reportProcessor.parseReport(inputData);
                const analysis = this.reportProcessor.analyzeStock(parsedData);
                this.displayResults(analysis);
                
                return true;
            } catch (error) {
                console.error('Error refreshing results table:', error);
                return false;
            }
        }
        
        return false;
    }

    /**
     * Invalidate all cached DOM element references
     * Call this when DOM structure changes (e.g., tab switching, re-rendering)
     */
    invalidateCachedElements() {
        this.cachedElements = {
            resultsTableContainer: null
        };
    }

    /**
     * Get a cached DOM element reference with validation
     * @param {string} key - Cache key for the element
     * @param {string} elementId - DOM element ID to query if not cached
     * @returns {HTMLElement|null} The element or null if not found
     */
    getCachedElement(key, elementId) {
        // Check if we have a cached reference
        let element = this.cachedElements[key];
        
        // Validate cached reference is still in DOM
        if (element && !document.body.contains(element)) {
            this.cachedElements[key] = null;
            element = null;
        }
        
        // Fetch fresh reference if needed
        if (!element) {
            element = document.getElementById(elementId);
            this.cachedElements[key] = element;
        }
        
        return element;
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

            // Refresh results if we have data displayed (for any mode)
            // Use stored input data, or fallback to most recent archive entry
            const resultsTableContainer = document.getElementById('resultsTableContainer');
            
            // Try to get input data from memory or archive
            let inputData = this.currentInputData;
            if (!inputData) {
                // Fallback: get from most recent archive entry
                const archive = this.dataManager.getArchive();
                if (archive && archive.length > 0) {
                    inputData = archive[0].rawData;
                }
            }
            
            // Force refresh if we have the data, regardless of container visibility state
            if (inputData && resultsTableContainer) {
                try {
                    // Store it back for next time
                    this.currentInputData = inputData;
                    
                    // Re-parse and re-analyze with updated material configuration
                    const parsedData = this.reportProcessor.parseReport(inputData);
                    const analysis = this.reportProcessor.analyzeStock(parsedData);
                    this.displayResults(analysis);
                } catch (error) {
                    console.error('[Material Save] Error refreshing results:', error);
                }
            }

            // Close modal after refresh is complete
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

            // Different toast messages based on mode
            if (mode === 'edit') {
                // Detect changes and build contextual feedback
                const changeDetection = this.detectMaterialChanges(oldMaterial, {
                    capacity: capacityNum,
                    group: group,
                    name: name,
                    promoCapacity: promoCapacity
                });
                
                const safeCode = SecurityUtils.escapeHTML(code);
                let toastMessage = `<i class="fa-solid fa-pen-to-square"></i> Material ${safeCode} updated successfully!`;
                
                if (changeDetection.hasChanges) {
                    // Changes are already escaped in detectMaterialChanges method
                    toastMessage += ` ${changeDetection.changes.join(', ')}.`;
                } else {
                    toastMessage += ' No changes detected.';
                }
                
                this.showToast(toastMessage, 'success', 'Updated');
            } else if (mode === 'quickadd') {
                const safeCode = SecurityUtils.escapeHTML(code);
                const safeCapacity = SecurityUtils.escapeHTML(String(capacityNum));
                this.showToast(`<i class="fa-solid fa-bolt"></i> Material ${safeCode} quickly added! Capacity set to ${safeCapacity}.`, 'success', 'Quick Added');
            } else {
                const safeCode = SecurityUtils.escapeHTML(code);
                const safeCapacity = SecurityUtils.escapeHTML(String(capacityNum));
                this.showToast(`<i class="fa-solid fa-plus"></i> Material ${safeCode} added successfully! Capacity set to ${safeCapacity}.`, 'success', 'Added');
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
            // Remove from selected items if it was selected
            if (this.selectedItems && this.selectedItems.has(code)) {
                this.selectedItems.delete(code);
                this.updateBulkActionsToolbar();
                this.updateSelectAllCheckbox();
            }
            
            // Preserve state when deleting (but don't highlight anything)
            this.renderMaterialsList({ preserveState: true });
            
            // Update undo/redo buttons
            if (this.updateUndoRedoButtons) {
                this.updateUndoRedoButtons();
            }
            
            const safeCode = SecurityUtils.escapeHTML(code);
            this.showToast(`<i class="fa-solid fa-trash-can"></i> Material ${safeCode} deleted successfully`, 'success');
            
            // Refresh results if data is displayed
            const inputData = document.getElementById('inputData').value.trim();
            const resultsTableContainer = document.getElementById('resultsTableContainer');
            
            if (inputData && resultsTableContainer && resultsTableContainer.style.display !== 'none') {
                const parsedData = this.reportProcessor.parseReport(inputData);
                const analysis = this.reportProcessor.analyzeStock(parsedData);
                this.displayResults(analysis);
            }
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
    // Cloud Sync Operations
    // ========================

    /**
     * Initialize cloud sync manager
     */
    initCloudSync() {
        if (!this.cloudSyncManager) {
            this.cloudSyncManager = new CloudSyncManager(this.dataManager);
            // Connect DataManager to CloudSyncManager for change tracking
            this.dataManager.setCloudSyncManager(this.cloudSyncManager);
            this.setupCrossTabSyncListeners();
        }
        this.renderCloudSyncStatus();
    }

    /**
     * Render cloud sync status in the UI
     */
    renderCloudSyncStatus() {
        const container = document.getElementById('cloudSyncStatus');
        if (!container || !this.cloudSyncManager) return;

        const status = this.cloudSyncManager.getSyncStatus();
        const isConfigured = status.enabled && status.provider !== 'none';

        // Update button states
        const uploadBtn = document.getElementById('cloudSyncUploadBtn');
        const downloadBtn = document.getElementById('cloudSyncDownloadBtn');
        const testBtn = document.getElementById('cloudSyncTestBtn');

        if (uploadBtn) uploadBtn.disabled = !isConfigured || status.syncInProgress;
        if (downloadBtn) downloadBtn.disabled = !isConfigured || status.syncInProgress;
        if (testBtn) testBtn.disabled = !isConfigured || status.syncInProgress;

        // Get provider display name
        let providerName = this.t('cloudSyncProviderNone');
        if (status.provider === 'github-gist') {
            providerName = this.t('cloudSyncProviderGitHub');
        } else if (status.provider === 'local-server') {
            providerName = this.t('cloudSyncProviderLocal');
        }

        // Format last sync time
        let lastSyncDisplay = this.t('cloudSyncNever');
        if (status.lastSync) {
            const lastSyncDate = new Date(status.lastSync);
            lastSyncDisplay = lastSyncDate.toLocaleString();
        }

        // Status badge
        let statusBadge = '';
        if (isConfigured) {
            if (status.syncInProgress) {
                statusBadge = `<span class="badge badge-warning"><i class="fa-solid fa-spinner fa-spin"></i> ${this.t('cloudSyncInProgress')}</span>`;
            } else if (status.lastSyncStatus === 'success') {
                statusBadge = `<span class="badge badge-success"><i class="fa-solid fa-check"></i> ${this.t('cloudSyncStatusSuccess')}</span>`;
            } else if (status.lastSyncStatus === 'error') {
                statusBadge = `<span class="badge badge-danger"><i class="fa-solid fa-exclamation-triangle"></i> ${this.t('cloudSyncStatusError')}</span>`;
            } else {
                statusBadge = `<span class="badge badge-secondary"><i class="fa-solid fa-clock"></i> ${this.t('cloudSyncStatusPending')}</span>`;
            }
        }

        container.innerHTML = `
            <div class="sync-status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                <div class="sync-status-item">
                    <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                        <i class="fa-solid fa-toggle-${status.enabled ? 'on' : 'off'}"></i> Status
                    </div>
                    <div style="font-weight: 600; color: ${status.enabled ? 'var(--success-color)' : 'var(--text-secondary)'};">
                        ${status.enabled ? this.t('cloudSyncEnabled') : this.t('cloudSyncDisabled')}
                    </div>
                </div>
                <div class="sync-status-item">
                    <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                        <i class="fa-solid fa-cloud"></i> ${this.t('cloudSyncProvider')}
                    </div>
                    <div style="font-weight: 600;">
                        ${providerName}
                    </div>
                </div>
                <div class="sync-status-item">
                    <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> ${this.t('cloudSyncLastSync')}
                    </div>
                    <div style="font-weight: 600;">
                        ${lastSyncDisplay}
                    </div>
                </div>
                ${statusBadge ? `
                <div class="sync-status-item">
                    <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                        <i class="fa-solid fa-signal"></i> ${this.t('cloudSyncStatus')}
                    </div>
                    <div>
                        ${statusBadge}
                    </div>
                </div>
                ` : ''}
                ${status.hasUnsyncedChanges && status.unsyncedChangeCount > 0 ? `
                <div class="sync-status-item" style="cursor: pointer;" onclick="ui.showUnsyncedChangesList()" title="${this.t('cloudSyncClickToShowChanges')}">
                    <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                        <i class="fa-solid fa-exclamation-circle"></i> ${this.t('cloudSyncUnsyncedChanges')}
                    </div>
                    <div style="font-weight: 600; color: var(--warning-color); display: flex; align-items: center; gap: 8px;">
                        ${this.t('cloudSyncUnsyncedChangesCount').replace('{count}', parseInt(status.unsyncedChangeCount) || 0)}
                        <i class="fa-solid fa-chevron-right" style="font-size: 0.8em;"></i>
                    </div>
                </div>
                ` : ''}
            </div>
            ${status.autoSync && isConfigured ? `
            <div style="margin-top: 10px; padding: 8px 12px; background: var(--info-bg); border-radius: 6px; font-size: 0.85em;">
                <i class="fa-solid fa-sync"></i> ${this.t('cloudSyncAutoSyncLabel')}: ${parseInt(status.autoSyncInterval) || 0} min
            </div>
            ` : ''}
        `;
    }

    /**
     * Show cloud sync settings modal
     */
    showCloudSyncSettings() {
        if (!this.cloudSyncManager) {
            this.initCloudSync();
        }

        const settings = this.cloudSyncManager.getSettings();
        const modal = document.getElementById('materialModal');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fa-solid fa-cloud-arrow-up"></i> ${this.t('cloudSyncSettingsTitle')}</h2>
                    <button class="modal-close" onclick="ui.closeModal()" aria-label="${this.t('btnCancel')}">×</button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning" style="margin-bottom: 20px;">
                        <i class="fa-solid fa-shield-halved"></i> ${this.t('cloudSyncTokenWarning')}
                    </div>

                    <!-- Enable/Disable -->
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="cloudSyncEnabled" ${settings.enabled ? 'checked' : ''}>
                            <span>${this.t('cloudSyncEnableLabel')}</span>
                        </label>
                    </div>

                    <!-- Provider Selection -->
                    <div class="form-group">
                        <label for="cloudSyncProvider">${this.t('cloudSyncProviderLabel')}</label>
                        <select id="cloudSyncProvider" onchange="ui.toggleCloudSyncProviderSettings()">
                            <option value="none" ${settings.provider === 'none' ? 'selected' : ''}>${this.t('cloudSyncProviderNone')}</option>
                            <option value="github-gist" ${settings.provider === 'github-gist' ? 'selected' : ''}>${this.t('cloudSyncProviderGitHub')}</option>
                            <option value="local-server" ${settings.provider === 'local-server' ? 'selected' : ''}>${this.t('cloudSyncProviderLocal')}</option>
                        </select>
                    </div>

                    <!-- GitHub Gist Settings -->
                    <div id="githubGistSettings" class="provider-settings" style="display: ${settings.provider === 'github-gist' ? 'block' : 'none'}; padding: 15px; background: var(--card-bg-secondary); border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="margin-top: 0; margin-bottom: 15px;"><i class="fa-brands fa-github"></i> ${this.t('githubGistTitle')}</h4>
                        
                        <div class="form-group">
                            <label for="githubToken">${this.t('githubTokenLabel')} *</label>
                            <input type="password" id="githubToken" value="${settings.github?.token || ''}" 
                                   placeholder="${this.t('githubTokenPlaceholder')}"
                                   autocomplete="off">
                            <small style="color: var(--text-secondary); display: block; margin-top: 4px;">
                                ${this.t('githubTokenHelp')}
                            </small>
                        </div>
                        
                        <div class="form-group">
                            <label for="githubGistId">${this.t('githubGistIdLabel')}</label>
                            <input type="text" id="githubGistId" value="${settings.github?.gistId || ''}" 
                                   placeholder="${this.t('githubGistIdPlaceholder')}">
                            <small style="color: var(--text-secondary); display: block; margin-top: 4px;">
                                ${this.t('githubGistIdHelp')}
                            </small>
                        </div>
                        
                        <div class="form-group">
                            <label for="githubFilename">${this.t('githubFilenameLabel')}</label>
                            <input type="text" id="githubFilename" value="${settings.github?.filename || 'warehouse-backup.json'}">
                            <small style="color: var(--text-secondary); display: block; margin-top: 4px;">
                                ${this.t('githubFilenameHelp')}
                            </small>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="githubPublic" ${settings.github?.isPublic ? 'checked' : ''}>
                                <span>${this.t('githubPublicLabel')}</span>
                            </label>
                            <small style="color: var(--text-secondary); display: block; margin-top: 4px; margin-left: 24px;">
                                ${this.t('githubPublicHelp')}
                            </small>
                        </div>
                    </div>

                    <!-- Local Server Settings -->
                    <div id="localServerSettings" class="provider-settings" style="display: ${settings.provider === 'local-server' ? 'block' : 'none'}; padding: 15px; background: var(--card-bg-secondary); border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="margin-top: 0; margin-bottom: 15px;"><i class="fa-solid fa-server"></i> ${this.t('localServerTitle')}</h4>
                        
                        <div class="form-group">
                            <label for="localServerUploadUrl">${this.t('localServerUploadUrl')} *</label>
                            <input type="url" id="localServerUploadUrl" value="${settings.localServer?.uploadUrl || ''}" 
                                   placeholder="${this.t('localServerUploadUrlPlaceholder')}">
                        </div>
                        
                        <div class="form-group">
                            <label for="localServerDownloadUrl">${this.t('localServerDownloadUrl')} *</label>
                            <input type="url" id="localServerDownloadUrl" value="${settings.localServer?.downloadUrl || ''}" 
                                   placeholder="${this.t('localServerDownloadUrlPlaceholder')}">
                        </div>
                        
                        <div class="form-group">
                            <label for="localServerAuthHeader">${this.t('localServerAuthHeader')}</label>
                            <input type="text" id="localServerAuthHeader" value="${settings.localServer?.authHeader || ''}" 
                                   placeholder="${this.t('localServerAuthHeaderPlaceholder')}">
                        </div>
                        
                        <div class="form-group">
                            <label for="localServerAuthValue">${this.t('localServerAuthValue')}</label>
                            <input type="password" id="localServerAuthValue" value="${settings.localServer?.authValue || ''}" 
                                   placeholder="${this.t('localServerAuthValuePlaceholder')}"
                                   autocomplete="off">
                        </div>
                        
                        <small style="color: var(--text-secondary); display: block;">
                            <i class="fa-solid fa-info-circle"></i> ${this.t('localServerHelp')}
                        </small>
                    </div>

                    <!-- Auto Sync Settings -->
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="cloudSyncAutoSync" ${settings.autoSync ? 'checked' : ''}>
                            <span>${this.t('cloudSyncAutoSyncLabel')}</span>
                        </label>
                    </div>
                    
                    <div class="form-group" id="autoSyncIntervalGroup" style="display: ${settings.autoSync ? 'block' : 'none'};">
                        <label for="cloudSyncAutoSyncInterval">${this.t('cloudSyncAutoSyncInterval')}</label>
                        <input type="number" id="cloudSyncAutoSyncInterval" value="${parseInt(settings.autoSyncIntervalMinutes) || 30}" min="5" max="1440">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="ui.closeModal()">
                        <i class="fa-solid fa-times"></i> ${this.t('btnCancel')}
                    </button>
                    <button class="btn-primary" onclick="ui.saveCloudSyncSettings()">
                        <i class="fa-solid fa-save"></i> ${this.t('btnSave')}
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');

        // Add event listener for auto-sync checkbox
        document.getElementById('cloudSyncAutoSync')?.addEventListener('change', (e) => {
            document.getElementById('autoSyncIntervalGroup').style.display = e.target.checked ? 'block' : 'none';
        });
    }

    /**
     * Toggle cloud sync provider settings visibility
     */
    toggleCloudSyncProviderSettings() {
        const provider = document.getElementById('cloudSyncProvider')?.value;
        const githubSettings = document.getElementById('githubGistSettings');
        const localSettings = document.getElementById('localServerSettings');

        if (githubSettings) {
            githubSettings.style.display = provider === 'github-gist' ? 'block' : 'none';
        }
        if (localSettings) {
            localSettings.style.display = provider === 'local-server' ? 'block' : 'none';
        }
    }

    /**
     * Save cloud sync settings
     */
    saveCloudSyncSettings() {
        if (!this.cloudSyncManager) return;

        const enabled = document.getElementById('cloudSyncEnabled')?.checked || false;
        const provider = document.getElementById('cloudSyncProvider')?.value || 'none';
        const autoSync = document.getElementById('cloudSyncAutoSync')?.checked || false;
        const autoSyncIntervalMinutes = parseInt(document.getElementById('cloudSyncAutoSyncInterval')?.value) || 30;

        const settings = {
            enabled,
            provider,
            autoSync,
            autoSyncIntervalMinutes,
            github: {
                token: document.getElementById('githubToken')?.value || '',
                gistId: document.getElementById('githubGistId')?.value || '',
                filename: document.getElementById('githubFilename')?.value || 'warehouse-backup.json',
                isPublic: document.getElementById('githubPublic')?.checked || false
            },
            localServer: {
                uploadUrl: document.getElementById('localServerUploadUrl')?.value || '',
                downloadUrl: document.getElementById('localServerDownloadUrl')?.value || '',
                authHeader: document.getElementById('localServerAuthHeader')?.value || '',
                authValue: document.getElementById('localServerAuthValue')?.value || ''
            }
        };

        this.cloudSyncManager.updateSettings(settings);
        this.closeModal();
        this.renderCloudSyncStatus();
        this.showToast(this.t('cloudSyncSettingsSaved'), 'success', '<i class="fa-solid fa-gear"></i>');
    }

    /**
     * Upload data to cloud
     */
    async cloudSyncUpload() {
        if (!this.cloudSyncManager) {
            this.showToast(this.t('cloudSyncNotConfigured'), 'error');
            return;
        }

        try {
            this.showLoading(this.t('cloudSyncInProgress'));
            this.renderCloudSyncStatus();

            const result = await this.cloudSyncManager.syncWithLogging('upload');
            
            this.hideLoading();
            this.renderCloudSyncStatus();
            this.renderSyncLog();

            let message = this.t('cloudSyncUploadSuccess');
            if (result.gistUrl) {
                message += ` (${result.gistUrl})`;
            }
            this.showToast(message, 'success', '<i class="fa-solid fa-cloud-arrow-up"></i>');

        } catch (error) {
            this.hideLoading();
            this.renderCloudSyncStatus();
            this.renderSyncLog();
            this.showToast(
                `${this.t('cloudSyncUploadError')}: ${error.message}`,
                'error',
                '<i class="fa-solid fa-cloud-exclamation"></i>'
            );
        }
    }

    /**
     * Download data from cloud
     */
    async cloudSyncDownload() {
        if (!this.cloudSyncManager) {
            this.showToast(this.t('cloudSyncNotConfigured'), 'error');
            return;
        }

        // Confirm before overwriting local data
        const confirmed = await this.showDeleteModal(this.t('cloudSyncConfirmDownload'));
        if (!confirmed) return;

        try {
            this.showLoading(this.t('cloudSyncInProgress'));
            this.renderCloudSyncStatus();

            const result = await this.cloudSyncManager.syncWithLogging('download');
            
            this.hideLoading();
            this.renderCloudSyncStatus();
            this.renderSyncLog();

            // Refresh UI
            this.renderMaterialsList();
            if (typeof this.renderArchiveList === 'function') {
                this.renderArchiveList();
            }

            const message = `${this.t('cloudSyncDownloadSuccess')}: ${result.imported?.materialCount || 0} materials`;
            this.showToast(message, 'success', '<i class="fa-solid fa-cloud-arrow-down"></i>');

        } catch (error) {
            this.hideLoading();
            this.renderCloudSyncStatus();
            this.renderSyncLog();
            this.showToast(
                `${this.t('cloudSyncDownloadError')}: ${error.message}`,
                'error',
                '<i class="fa-solid fa-cloud-exclamation"></i>'
            );
        }
    }

    /**
     * Test cloud sync connection
     */
    async cloudSyncTest() {
        if (!this.cloudSyncManager) {
            this.showToast(this.t('cloudSyncNotConfigured'), 'error');
            return;
        }

        try {
            this.showLoading(this.t('cloudSyncInProgress'));

            const result = await this.cloudSyncManager.testConnection();
            
            this.hideLoading();
            this.showToast(
                `${this.t('cloudSyncConnectionSuccess')}: ${result.message}`,
                'success',
                '<i class="fa-solid fa-plug-circle-check"></i>'
            );

        } catch (error) {
            this.hideLoading();
            this.showToast(
                `${this.t('cloudSyncConnectionError')}: ${error.message}`,
                'error',
                '<i class="fa-solid fa-plug-circle-exclamation"></i>'
            );
        }
    }

    // ========================
    // Settings Tab Status Rendering
    // ========================

    /**
     * Render all status sections in the Settings tab
     */
    renderSettingsTabStatus() {
        this.renderCloudSyncStatus();
        this.renderCrossTabSyncStatus();
        this.renderIndexedDBStatus();
        this.renderDataStats();
        this.renderSyncLog();
    }

    /**
     * Render cross-tab sync status
     */
    renderCrossTabSyncStatus() {
        const container = document.getElementById('crossTabSyncStatus');
        if (!container) return;

        const hasBroadcastChannel = 'BroadcastChannel' in window;
        const tabId = this.cloudSyncManager?.tabId || 'unknown';

        container.innerHTML = `
            <div class="sync-status-item">
                <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                    <i class="fa-solid fa-browser"></i> ${this.t('crossTabStatus') || 'Browser Support'}
                </div>
                <div style="font-weight: 600;">
                    ${hasBroadcastChannel 
                        ? `<span class="badge badge-success"><i class="fa-solid fa-check"></i> ${this.t('supported') || 'Supported'}</span>`
                        : `<span class="badge badge-warning"><i class="fa-solid fa-exclamation-triangle"></i> ${this.t('notSupported') || 'Not Supported'}</span>`
                    }
                </div>
            </div>
            <div class="sync-status-item">
                <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                    <i class="fa-solid fa-fingerprint"></i> ${this.t('tabIdentifier') || 'Tab ID'}
                </div>
                <div style="font-weight: 600; font-family: monospace; font-size: 0.85em;">
                    ${tabId.substring(0, 15)}...
                </div>
            </div>
            <div class="sync-status-item">
                <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                    <i class="fa-solid fa-arrows-rotate"></i> ${this.t('syncMethod') || 'Sync Method'}
                </div>
                <div style="font-weight: 600;">
                    ${hasBroadcastChannel ? 'BroadcastChannel + IndexedDB' : 'IndexedDB only'}
                </div>
            </div>
        `;
    }

    /**
     * Render IndexedDB status
     */
    renderIndexedDBStatus() {
        const container = document.getElementById('indexedDBStatus');
        if (!container) return;

        const dbManager = this.dataManager?.dbManager;
        const isAvailable = dbManager?.checkAvailability?.() || false;

        container.innerHTML = `
            <div class="sync-status-item">
                <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                    <i class="fa-solid fa-database"></i> Status
                </div>
                <div style="font-weight: 600;">
                    ${isAvailable 
                        ? `<span class="badge badge-success"><i class="fa-solid fa-check"></i> ${this.t('syncStatusActive')}</span>`
                        : `<span class="badge badge-warning"><i class="fa-solid fa-exclamation-triangle"></i> ${this.t('syncStatusInactive')}</span>`
                    }
                </div>
            </div>
            <div class="sync-status-item">
                <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                    <i class="fa-solid fa-hard-drive"></i> ${this.t('database') || 'Database'}
                </div>
                <div style="font-weight: 600;">
                    ${dbManager?.dbName || 'WarehouseDB'}
                </div>
            </div>
            <div class="sync-status-item">
                <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">
                    <i class="fa-solid fa-layer-group"></i> ${this.t('storageEngine') || 'Engine'}
                </div>
                <div style="font-weight: 600;">
                    Dexie.js + IndexedDB
                </div>
            </div>
        `;
    }

    /**
     * Render data statistics
     */
    renderDataStats() {
        const container = document.getElementById('dataStatsContainer');
        if (!container) return;

        const materialsCount = Object.keys(this.dataManager?.materials || {}).length;
        const archiveCount = (this.dataManager?.archive || []).length;
        const groupsCount = Object.keys(this.dataManager?.groups || {}).length;
        const notesCount = Object.keys(this.dataManager?.notes || {}).length;

        container.innerHTML = `
            <div class="sync-status-item" style="text-align: center;">
                <div style="font-size: 2em; font-weight: 700; color: var(--primary-color);">${materialsCount}</div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    <i class="fa-solid fa-boxes-stacked"></i> ${this.t('totalMaterials') || 'Materials'}
                </div>
            </div>
            <div class="sync-status-item" style="text-align: center;">
                <div style="font-size: 2em; font-weight: 700; color: var(--success-color);">${archiveCount}</div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    <i class="fa-solid fa-folder-open"></i> ${this.t('archivedReports') || 'Reports'}
                </div>
            </div>
            <div class="sync-status-item" style="text-align: center;">
                <div style="font-size: 2em; font-weight: 700; color: var(--warning-color);">${groupsCount}</div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    <i class="fa-solid fa-tags"></i> ${this.t('groupsTitle') || 'Groups'}
                </div>
            </div>
            <div class="sync-status-item" style="text-align: center;">
                <div style="font-size: 2em; font-weight: 700; color: var(--info-color, #3b82f6);">${notesCount}</div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    <i class="fa-solid fa-note-sticky"></i> ${this.t('notesTitle') || 'Notes'}
                </div>
            </div>
        `;
    }

    /**
     * Render sync log
     */
    renderSyncLog() {
        const container = document.getElementById('syncLogContainer');
        if (!container || !this.cloudSyncManager) return;

        const log = this.cloudSyncManager.getSyncLog();

        if (log.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                    <i class="fa-solid fa-clock-rotate-left" style="font-size: 2em; margin-bottom: 10px; opacity: 0.5;"></i>
                    <p style="margin: 0;">${this.t('noSyncActivity') || 'No sync activity yet'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = log.map(entry => {
            const time = new Date(entry.timestamp).toLocaleString();
            const icon = this.getSyncLogIcon(entry.level);
            const message = this.getSyncLogMessage(entry.type, entry.data);
            const levelClass = entry.level === 'error' ? 'danger' : entry.level === 'warning' ? 'warning' : entry.level === 'success' ? 'success' : 'info';

            return `
                <div class="sync-log-entry" style="display: flex; gap: 12px; padding: 10px; border-bottom: 1px solid var(--border-color); align-items: flex-start;">
                    <div style="flex-shrink: 0;">
                        <span class="badge badge-${levelClass}">${icon}</span>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 500;">${message}</div>
                        <div style="font-size: 0.8em; color: var(--text-secondary);">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get icon for sync log entry
     */
    getSyncLogIcon(level) {
        const icons = {
            'success': '<i class="fa-solid fa-check"></i>',
            'error': '<i class="fa-solid fa-times"></i>',
            'warning': '<i class="fa-solid fa-exclamation"></i>',
            'info': '<i class="fa-solid fa-info"></i>'
        };
        return icons[level] || icons.info;
    }

    /**
     * Get message for sync log entry
     */
    getSyncLogMessage(type, data) {
        // Escape user-provided data to prevent XSS
        const esc = (str) => SecurityUtils.escapeHTML(str);
        const errorMsg = data?.error ? esc(String(data.error)) : 'Unknown error';
        
        const messages = {
            'upload_started': this.t('syncLogUploadStarted') || 'Upload started',
            'upload_success': this.t('syncLogUploadSuccess') || 'Upload completed successfully',
            'upload_error': `${this.t('syncLogUploadError') || 'Upload failed'}: ${errorMsg}`,
            'download_started': this.t('syncLogDownloadStarted') || 'Download started',
            'download_success': this.t('syncLogDownloadSuccess') || 'Download completed successfully',
            'download_error': `${this.t('syncLogDownloadError') || 'Download failed'}: ${errorMsg}`,
            'cloud_sync_from_tab': this.t('syncLogFromOtherTab') || 'Sync received from another tab',
            'sync_started_other_tab': this.t('syncLogOtherTabStarted') || 'Another tab started syncing',
            'settings_changed': this.t('syncLogSettingsChanged') || 'Sync settings changed'
        };
        return messages[type] || esc(String(type));
    }

    /**
     * Clear sync log
     */
    clearSyncLog() {
        if (this.cloudSyncManager) {
            this.cloudSyncManager.clearSyncLog();
            this.renderSyncLog();
            this.showToast(this.t('syncLogCleared') || 'Sync log cleared', 'success');
        }
    }

    /**
     * Show modal with list of unsynced changes
     */
    showUnsyncedChangesList() {
        if (!this.cloudSyncManager) return;
        
        const status = this.cloudSyncManager.getSyncStatus();
        const changes = status.unsyncedChangesList || [];
        const modal = document.getElementById('materialModal');
        
        const getChangeIcon = (type) => {
            const icons = {
                'materials': '<i class="fa-solid fa-box"></i>',
                'archive': '<i class="fa-solid fa-archive"></i>',
                'groups': '<i class="fa-solid fa-layer-group"></i>',
                'notes': '<i class="fa-solid fa-sticky-note"></i>'
            };
            return icons[type] || '<i class="fa-solid fa-edit"></i>';
        };
        
        const getActionBadge = (action) => {
            const badges = {
                'add': { class: 'success', label: this.t('actionAdd') || 'Hinzugefügt' },
                'edit': { class: 'warning', label: this.t('actionEdit') || 'Bearbeitet' },
                'delete': { class: 'danger', label: this.t('actionDelete') || 'Gelöscht' },
                'bulk_delete': { class: 'danger', label: this.t('actionBulkDelete') || 'Mehrfach gelöscht' }
            };
            const badge = badges[action] || { class: 'secondary', label: action };
            return `<span class="badge badge-${badge.class}">${badge.label}</span>`;
        };
        
        const formatChangeDetails = (change) => {
            const details = change.details || {};
            let description = '';
            
            // Handle material changes
            if (details.materialCode) {
                description = `<strong>${SecurityUtils.escapeHTML(details.materialCode)}</strong>`;
                if (details.materialName && details.materialName !== details.materialCode) {
                    description += ` (${SecurityUtils.escapeHTML(details.materialName)})`;
                }
                
                if (details.action === 'add' && details.capacity) {
                    description += ` - ${this.t('capacity') || 'Kapazität'}: ${SecurityUtils.escapeHTML(String(details.capacity))}`;
                } else if (details.action === 'edit' && details.changes) {
                    description += `<br><small style="color: var(--text-secondary);">${SecurityUtils.escapeHTML(details.changes)}</small>`;
                }
            }
            // Handle group changes
            else if (details.groupName || details.groupId) {
                description = `<strong>${SecurityUtils.escapeHTML(details.groupName || details.groupId)}</strong>`;
                
                if (details.action === 'add' && details.color) {
                    // Validate color is a safe hex format (#RGB or #RRGGBB)
                    const safeColor = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(details.color) ? details.color : '#3b82f6';
                    description += ` <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${safeColor}; vertical-align: middle;"></span>`;
                } else if (details.action === 'edit' && details.changes) {
                    description += `<br><small style="color: var(--text-secondary);">${SecurityUtils.escapeHTML(details.changes)}</small>`;
                }
            }
            // Handle bulk delete
            else if (details.action === 'bulk_delete' && details.count) {
                description = `${parseInt(details.count) || 0} ${this.t('materials') || 'Materialien'}`;
                if (details.materialCodes) {
                    description += `<br><small style="color: var(--text-secondary);">${SecurityUtils.escapeHTML(details.materialCodes)}</small>`;
                }
            }
            
            return description || this.t('changeNoDetails') || 'Keine Details verfügbar';
        };
        
        const changesHtml = changes.length > 0 ? changes.map(change => {
            const time = new Date(change.timestamp).toLocaleString();
            const safeChangeId = SecurityUtils.escapeHTML(String(change.id));
            return `
                <div class="unsynced-change-item" style="display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid var(--border-color); align-items: flex-start;">
                    <div style="flex-shrink: 0; width: 30px; text-align: center;">
                        ${getChangeIcon(change.type)}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            ${getActionBadge(change.details?.action || change.type)}
                            <span style="font-size: 0.8em; color: var(--text-secondary);">${SecurityUtils.escapeHTML(time)}</span>
                        </div>
                        <div>${formatChangeDetails(change)}</div>
                    </div>
                    <div style="flex-shrink: 0;">
                        <button class="btn-icon" onclick="ui.dismissUnsyncedChange('${safeChangeId}')" title="${this.t('dismiss') || 'Verwerfen'}">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('') : `
            <div class="empty-state" style="padding: 30px; text-align: center;">
                <i class="fa-solid fa-check-circle" style="font-size: 2em; color: var(--success-color); margin-bottom: 10px;"></i>
                <p>${this.t('noUnsyncedChanges') || 'Keine nicht synchronisierten Änderungen'}</p>
            </div>
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fa-solid fa-clock-rotate-left"></i> ${this.t('cloudSyncUnsyncedChanges') || 'Nicht synchronisierte Änderungen'}</h2>
                    <button class="modal-close" onclick="ui.closeModal()" aria-label="${this.t('btnCancel') || 'Abbrechen'}">×</button>
                </div>
                <div class="modal-body" style="max-height: 400px; overflow-y: auto; padding: 0;">
                    ${changesHtml}
                </div>
                <div class="modal-footer" style="display: flex; gap: 10px; justify-content: space-between;">
                    <button class="btn btn-danger" onclick="ui.dismissAllUnsyncedChanges()" ${changes.length === 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-trash"></i> ${this.t('dismissAll') || 'Alle verwerfen'}
                    </button>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-secondary" onclick="ui.closeModal()">
                            ${this.t('btnClose') || 'Schließen'}
                        </button>
                        <button class="btn btn-primary" onclick="ui.closeModal(); ui.cloudSyncUpload();" ${changes.length === 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-cloud-arrow-up"></i> ${this.t('btnCloudSyncUpload') || 'Jetzt hochladen'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Add click handler to close when clicking outside the modal content
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        };
        
        // Announce to screen readers if accessibility manager is available
        if (typeof accessibilityManager !== 'undefined' && accessibilityManager.announce) {
            accessibilityManager.announce(this.t('modalOpened') || 'Modal geöffnet');
        }
    }
    
    /**
     * Dismiss a specific unsynced change
     */
    dismissUnsyncedChange(changeId) {
        if (this.cloudSyncManager) {
            this.cloudSyncManager.dismissUnsyncedChange(changeId);
            this.showUnsyncedChangesList(); // Refresh the modal
            this.renderCloudSyncStatus(); // Refresh the status display
        }
    }
    
    /**
     * Dismiss all unsynced changes
     */
    dismissAllUnsyncedChanges() {
        if (confirm(this.t('confirmDismissAllChanges') || 'Möchten Sie wirklich alle nicht synchronisierten Änderungen verwerfen?') && this.cloudSyncManager) {
            this.cloudSyncManager.dismissAllUnsyncedChanges();
            this.closeModal();
            this.renderCloudSyncStatus();
            this.showToast(this.t('allChangesDiscarded') || 'Alle Änderungen verworfen', 'info');
        }
    }

    /**
     * Setup cross-tab sync listeners
     */
    setupCrossTabSyncListeners() {
        if (!this.cloudSyncManager) return;

        // Listen for remote sync completions
        this.cloudSyncManager.setOnRemoteSync(async (data) => {
            // Reload data from storage
            await this.dataManager.initializeData();
            
            // Refresh UI
            this.renderMaterialsList();
            if (typeof this.renderArchiveList === 'function') {
                this.renderArchiveList();
            }

            // Show notification
            this.showToast(
                this.t('dataUpdatedFromOtherTab') || 'Data updated from another tab/device',
                'info',
                '<i class="fa-solid fa-arrows-rotate"></i>'
            );

            // Update settings tab if visible
            this.renderSettingsTabStatus();
        });

        // Listen for settings changes
        this.cloudSyncManager.setOnSettingsChanged(() => {
            this.renderCloudSyncStatus();
            this.renderSettingsTabStatus();
        });

        // Listen for log updates
        this.cloudSyncManager.setOnLogUpdate(() => {
            this.renderSyncLog();
        });
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
        
        // Helper function to escape HTML
        const esc = (str) => SecurityUtils.escapeHTML(str);
        
        // Render list items
        list.innerHTML = this.recentlyAddedMaterials.map((item, index) => {
            const timeAgo = this.getTimeAgo(item.addedAt);
            const isJustAdded = index === 0 && (Date.now() - new Date(item.addedAt).getTime()) < 5000; // Within 5 seconds
            const groupName = item.group ? (this.dataManager.getGroup(item.group)?.name || item.group) : '';
            
            return `
                <div class="recently-added-item ${isJustAdded ? 'just-added' : ''}" data-material-code="${esc(item.code)}">
                    <div class="recently-added-item-content">
                        <div class="recently-added-item-header">
                            <span class="recently-added-item-code">
                                <i class="fa-solid fa-box"></i> ${esc(item.code)}
                            </span>
                            ${item.name ? `<span class="recently-added-item-name">${esc(item.name)}</span>` : ''}
                        </div>
                        <div class="recently-added-item-details">
                            <div class="recently-added-item-detail">
                                <i class="fa-solid fa-warehouse"></i>
                                <strong>${this.t('mktCapacity') || 'Capacity'}:</strong> ${esc(String(item.capacity))}
                            </div>
                            ${item.promoCapacity ? `
                                <div class="recently-added-item-detail">
                                    <i class="fa-solid fa-gift"></i>
                                    <strong>${this.t('promoCapacity') || 'Promo'}:</strong> ${esc(String(item.promoCapacity))}
                                </div>
                            ` : ''}
                            ${item.group ? `
                                <div class="recently-added-item-detail">
                                    <i class="fa-solid fa-tag"></i>
                                    <strong>${this.t('materialGroup') || 'Group'}:</strong> ${esc(groupName)}
                                </div>
                            ` : ''}
                        </div>
                        <div class="recently-added-item-time">
                            <i class="fa-regular fa-clock"></i> ${this.t('addedTimeAgo') || 'Added'} ${timeAgo}
                        </div>
                    </div>
                    <div class="recently-added-item-actions">
                        <button class="btn-primary btn-small recently-added-edit-btn" data-code="${esc(item.code)}" title="${this.t('btnEdit') || 'Edit'}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-danger btn-small recently-added-remove-btn" data-code="${esc(item.code)}" title="${this.t('btnRemove') || 'Remove from list'}">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners for action buttons (safer than inline onclick)
        list.querySelectorAll('.recently-added-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => ui.openEditModal(btn.dataset.code));
        });
        list.querySelectorAll('.recently-added-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => ui.removeFromRecentlyAdded(btn.dataset.code));
        });
        
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
        
        // Close on outside click - don't use once:true as it can cause blocking issues
        setTimeout(() => {
            // Remove any existing handler first to prevent duplicates
            if (this.closeCategoryDropdownHandler) {
                document.removeEventListener('click', this.closeCategoryDropdownHandler);
            }
            this.closeCategoryDropdownHandler = (e) => {
                // Check if click is outside the dropdown
                const dropdown = document.getElementById('categoryDropdownPopup');
                if (dropdown && !dropdown.contains(e.target)) {
                    this.closeCategoryDropdown();
                }
            };
            document.addEventListener('click', this.closeCategoryDropdownHandler);
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
                this.categoryDropdownRemovalTimeout = null;
            }
            
            // Remove immediately instead of with timeout to prevent race conditions
            dropdown.remove();
        }
        
        // Update aria-expanded on the button
        if (this.currentCategoryButton) {
            this.currentCategoryButton.setAttribute('aria-expanded', 'false');
            this.currentCategoryButton = null;
        }
        
        // Remove click handler to prevent memory leak
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
                
                // Update button inline styles
                button.style.background = `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`;
                button.style.border = `1px solid ${color}40`;
                button.style.color = this.getContrastColor(color);
                
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
            
            // Reset button inline styles
            button.style.background = '';
            button.style.border = '';
            button.style.color = '';
            
            // Update button text
            const textSpan = button.querySelector('.category-select-text');
            if (textSpan) textSpan.textContent = this.t('groupUngrouped');
        }
    }

    /**
     * Get contrasting text color for a given background color
     * @param {string} hexColor - Hex color code
     * @returns {string} - Adjusted text color for readability
     */
    getContrastColor(hexColor) {
        // Validate input
        if (!hexColor || typeof hexColor !== 'string') {
            return document.body.classList.contains('dark-mode') ? '#ffffff' : '#000000';
        }
        
        // Convert hex to RGB
        const hex = hexColor.replace('#', '');
        
        // Validate hex format (must be 3 or 6 characters)
        if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) {
            console.warn(`Invalid hex color: ${hexColor}, using default`);
            return document.body.classList.contains('dark-mode') ? '#ffffff' : '#000000';
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
            return document.body.classList.contains('dark-mode') ? '#ffffff' : '#000000';
        }
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            // In dark mode: light colors need darkening, dark colors need lightening
            if (luminance > 0.6) {
                // Very light colors - darken them for dark backgrounds
                return `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`;
            } else if (luminance < 0.3) {
                // Very dark colors - lighten them for dark backgrounds
                const factor = 1.8;
                return `rgb(${Math.min(255, Math.floor(r * factor + 60))}, ${Math.min(255, Math.floor(g * factor + 60))}, ${Math.min(255, Math.floor(b * factor + 60))})`;
            }
            // Medium luminance colors are usually fine
            return hexColor;
        } else {
            // In light mode: light colors need darkening for white backgrounds
            if (luminance > 0.5) {
                return `rgb(${Math.floor(r * 0.4)}, ${Math.floor(g * 0.4)}, ${Math.floor(b * 0.4)})`;
            }
            return hexColor;
        }
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

