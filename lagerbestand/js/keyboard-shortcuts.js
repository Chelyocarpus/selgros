/* ===========================
   KEYBOARD SHORTCUTS
   =========================== */

/**
 * @fileoverview Global keyboard shortcut management
 * @version 1.0.0
 */

class KeyboardShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.init();
    }

    /**
     * Initialize keyboard shortcuts
     */
    init() {
        this.registerDefaultShortcuts();
        this.setupListeners();
    }

    /**
     * Register default keyboard shortcuts
     */
    registerDefaultShortcuts() {
        // Navigation shortcuts
        this.register('ctrl+1', () => this.switchToTab(0), 'Switch to Check Stock tab');
        this.register('ctrl+2', () => this.switchToTab(1), 'Switch to Manage Materials tab');
        this.register('ctrl+3', () => this.switchToTab(2), 'Switch to Report Archive tab');

        // Action shortcuts
        this.register('ctrl+n', () => this.addNewMaterial(), 'Add new material');
        this.register('ctrl+s', (e) => this.saveCurrentForm(e), 'Save current form');
        this.register('ctrl+f', (e) => this.focusSearch(e), 'Focus search input');
        this.register('ctrl+e', () => this.exportData(), 'Export data');
        this.register('ctrl+i', () => this.importData(), 'Import data');
        
        // Material operations
        this.register('ctrl+shift+c', () => this.clearResults(), 'Clear results');
        this.register('ctrl+shift+d', () => this.toggleDarkMode(), 'Toggle dark mode');
        this.register('ctrl+shift+h', () => this.toggleHighContrast(), 'Toggle high contrast');
        
        // Undo/Redo
        this.register('ctrl+z', () => this.undo(), 'Undo last action');
        this.register('ctrl+y', () => this.redo(), 'Redo action');
        this.register('ctrl+shift+z', () => this.redo(), 'Redo action');

        // Modal shortcuts
        this.register('escape', () => this.closeActiveModal(), 'Close active modal');
        
        // Help
        this.register('ctrl+/', () => this.showKeyboardHelp(), 'Show keyboard shortcuts');
        this.register('f1', (e) => { e.preventDefault(); this.showKeyboardHelp(); }, 'Show keyboard shortcuts');
    }

    /**
     * Register a keyboard shortcut
     * @param {string} keys - Key combination (e.g., 'ctrl+s', 'escape')
     * @param {Function} handler - Handler function
     * @param {string} description - Description for help text
     */
    register(keys, handler, description = '') {
        const normalizedKeys = this.normalizeKeys(keys);
        this.shortcuts.set(normalizedKeys, { handler, description, keys });
    }

    /**
     * Unregister a keyboard shortcut
     * @param {string} keys - Key combination to remove
     */
    unregister(keys) {
        const normalizedKeys = this.normalizeKeys(keys);
        this.shortcuts.delete(normalizedKeys);
    }

    /**
     * Normalize key combination string
     * @param {string} keys - Raw key combination
     * @returns {string} Normalized key combination
     */
    normalizeKeys(keys) {
        return keys.toLowerCase()
            .split('+')
            .map(k => k.trim())
            .sort()
            .join('+');
    }

    /**
     * Get key combination from event
     * @param {KeyboardEvent} event - Keyboard event
     * @returns {string} Key combination string
     */
    getKeysFromEvent(event) {
        const keys = [];
        
        if (event.ctrlKey || event.metaKey) keys.push('ctrl');
        if (event.shiftKey) keys.push('shift');
        if (event.altKey) keys.push('alt');
        
        const key = event.key.toLowerCase();
        if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
            keys.push(key);
        }
        
        return this.normalizeKeys(keys.join('+'));
    }

    /**
     * Setup keyboard event listeners
     */
    setupListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;

            // Don't trigger shortcuts when typing in inputs (except Escape)
            const target = e.target;
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
            
            if (isInput && e.key !== 'Escape' && !e.ctrlKey && !e.metaKey) {
                return;
            }

            const keys = this.getKeysFromEvent(e);
            const shortcut = this.shortcuts.get(keys);

            if (shortcut) {
                e.preventDefault();
                shortcut.handler(e);
            }
        });
    }

    /**
     * Switch to tab by index
     * @param {number} index - Tab index (0-based)
     */
    switchToTab(index) {
        const tabs = document.querySelectorAll('.tab');
        if (tabs[index]) {
            tabs[index].click();
            accessibilityManager?.announce(`Switched to ${tabs[index].textContent.trim()}`, 'polite');
        }
    }

    /**
     * Add new material
     */
    addNewMaterial() {
        if (typeof addMaterial === 'function') {
            addMaterial();
            accessibilityManager?.announce('Add material dialog opened', 'assertive');
        }
    }

    /**
     * Save current form
     * @param {KeyboardEvent} event - Keyboard event
     */
    saveCurrentForm(event) {
        event.preventDefault();
        
        // Check if material modal is open
        const materialModal = document.getElementById('materialModal');
        if (materialModal?.classList.contains('active')) {
            if (typeof saveEditMaterial === 'function') {
                saveEditMaterial();
            }
            return;
        }
        
        // Check if on check stock tab with data
        const checkTab = document.getElementById('checkTab');
        if (checkTab?.classList.contains('active')) {
            const inputData = document.getElementById('inputData');
            if (inputData?.value.trim()) {
                if (typeof processData === 'function') {
                    processData();
                }
            }
        }
    }

    /**
     * Focus search input
     * @param {KeyboardEvent} event - Keyboard event
     */
    focusSearch(event) {
        event.preventDefault();
        
        // Find visible search input
        const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]');
        
        for (let input of searchInputs) {
            if (input.offsetParent !== null) {
                input.focus();
                input.select();
                accessibilityManager?.announce('Search focused', 'polite');
                return;
            }
        }
    }

    /**
     * Export data
     */
    exportData() {
        if (typeof ui !== 'undefined' && typeof ui.exportData === 'function') {
            ui.exportData();
            accessibilityManager?.announce('Exporting data', 'polite');
        }
    }

    /**
     * Import data
     */
    importData() {
        const importInput = document.getElementById('importInput');
        if (importInput) {
            importInput.click();
            accessibilityManager?.announce('Import file dialog opened', 'assertive');
        }
    }

    /**
     * Clear results
     */
    clearResults() {
        if (typeof clearResults === 'function') {
            clearResults();
            accessibilityManager?.announce('Results cleared', 'polite');
        }
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        if (typeof ui !== 'undefined' && typeof ui.toggleDarkMode === 'function') {
            ui.toggleDarkMode();
        } else {
            document.body.classList.toggle('dark-mode');
            const enabled = document.body.classList.contains('dark-mode');
            localStorage.setItem('warehouse_dark_mode', enabled);
            accessibilityManager?.announce(
                enabled ? 'Dark mode enabled' : 'Dark mode disabled',
                'polite'
            );
        }
    }

    /**
     * Toggle high contrast mode
     */
    toggleHighContrast() {
        if (accessibilityManager) {
            accessibilityManager.toggleHighContrastMode();
        }
    }

    /**
     * Undo last action
     */
    undo() {
        if (typeof ui !== 'undefined' && typeof ui.undo === 'function') {
            ui.undo();
        } else if (typeof dataManager !== 'undefined' && typeof dataManager.undo === 'function') {
            const result = dataManager.undo();
            if (result.success) {
                accessibilityManager?.announce(result.message, 'polite');
                // Refresh UI
                if (typeof ui !== 'undefined' && typeof ui.renderMaterialsList === 'function') {
                    ui.renderMaterialsList();
                }
            } else {
                accessibilityManager?.announce(result.message, 'polite');
            }
        }
    }

    /**
     * Redo action
     */
    redo() {
        if (typeof ui !== 'undefined' && typeof ui.redo === 'function') {
            ui.redo();
        } else if (typeof dataManager !== 'undefined' && typeof dataManager.redo === 'function') {
            const result = dataManager.redo();
            if (result.success) {
                accessibilityManager?.announce(result.message, 'polite');
                // Refresh UI
                if (typeof ui !== 'undefined' && typeof ui.renderMaterialsList === 'function') {
                    ui.renderMaterialsList();
                }
            } else {
                accessibilityManager?.announce(result.message, 'polite');
            }
        }
    }

    /**
     * Close active modal
     */
    closeActiveModal() {
        const activeModals = document.querySelectorAll('.modal.active');
        
        if (activeModals.length > 0) {
            // Close material modal
            if (typeof closeEditModal === 'function') {
                closeEditModal();
            }
            
            // Close view report modal
            if (typeof closeViewReportModal === 'function') {
                closeViewReportModal();
            }
            
            accessibilityManager?.announce('Modal closed', 'polite');
        }
    }

    /**
     * Show keyboard shortcuts help
     */
    showKeyboardHelp() {
        const shortcuts = Array.from(this.shortcuts.entries())
            .filter(([_, data]) => data.description)
            .sort((a, b) => a[1].keys.localeCompare(b[1].keys));

        const helpContent = `
            <div class="keyboard-help-modal">
                <h2><i class="fa-solid fa-keyboard"></i> Keyboard Shortcuts</h2>
                <div class="shortcuts-grid">
                    ${shortcuts.map(([_, data]) => `
                        <div class="shortcut-item">
                            <kbd>${this.formatKeys(data.keys)}</kbd>
                            <span>${SecurityUtils.escapeHTML(data.description)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-actions">
                    <button onclick="closeKeyboardHelp()" class="btn btn-primary">
                        <i class="fa-solid fa-check"></i> Close
                    </button>
                </div>
            </div>
        `;

        // Create or update help modal
        let helpModal = document.getElementById('keyboardHelpModal');
        if (!helpModal) {
            helpModal = document.createElement('div');
            helpModal.id = 'keyboardHelpModal';
            helpModal.className = 'modal';
            document.body.appendChild(helpModal);
        }

        helpModal.innerHTML = helpContent;
        helpModal.classList.add('active');

        accessibilityManager?.announce('Keyboard shortcuts help opened', 'assertive');
    }

    /**
     * Format keys for display
     * @param {string} keys - Key combination
     * @returns {string} Formatted keys
     */
    formatKeys(keys) {
        return keys
            .split('+')
            .map(key => {
                const keyMap = {
                    'ctrl': 'Ctrl',
                    'shift': 'Shift',
                    'alt': 'Alt',
                    'escape': 'Esc',
                    'arrowup': '↑',
                    'arrowdown': '↓',
                    'arrowleft': '←',
                    'arrowright': '→'
                };
                return keyMap[key.toLowerCase()] || key.toUpperCase();
            })
            .join(' + ');
    }

    /**
     * Enable shortcuts
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable shortcuts
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Check if shortcuts are enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }
}

// Global function to close keyboard help
function closeKeyboardHelp() {
    const helpModal = document.getElementById('keyboardHelpModal');
    if (helpModal) {
        helpModal.classList.remove('active');
        accessibilityManager?.announce('Keyboard shortcuts help closed', 'polite');
    }
}

// Initialize keyboard shortcut manager globally
let keyboardShortcuts;

document.addEventListener('DOMContentLoaded', () => {
    keyboardShortcuts = new KeyboardShortcutManager();
});
