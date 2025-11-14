/* ===========================
   ACCESSIBILITY UTILITIES
   =========================== */

/**
 * @fileoverview Accessibility enhancements for WCAG 2.1 AA compliance
 * @version 1.0.0
 */

class AccessibilityManager {
    constructor() {
        this.focusTrapElements = [];
        this.lastFocusedElement = null;
        this.highContrastMode = this.loadHighContrastMode();
        this.reducedMotionMode = this.loadReducedMotionMode();
        
        this.init();
    }

    /**
     * Initialize accessibility features
     */
    init() {
        this.applyHighContrastMode();
        this.applyReducedMotionMode();
        this.setupKeyboardNavigation();
        this.observeModalChanges();
        this.detectSystemPreferences();
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announce(message, priority = 'polite') {
        const announcer = document.getElementById('srAnnouncements');
        if (!announcer) return;
        
        announcer.setAttribute('aria-live', priority);
        announcer.textContent = '';
        
        // Small delay to ensure screen reader picks up the change
        setTimeout(() => {
            announcer.textContent = SecurityUtils.escapeHTML(message);
        }, 100);
        
        // Clear after announcement
        setTimeout(() => {
            announcer.textContent = '';
        }, 3000);
    }

    /**
     * Setup focus trap for modals
     * @param {HTMLElement} modal - Modal element
     */
    setupFocusTrap(modal) {
        if (!modal) return;

        // Store last focused element
        this.lastFocusedElement = document.activeElement;

        // Get all focusable elements in modal
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element
        setTimeout(() => firstElement.focus(), 100);

        // Handle tab key
        const trapFocus = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        modal.addEventListener('keydown', trapFocus);
        
        // Store reference for cleanup
        this.focusTrapElements.push({ modal, handler: trapFocus });
    }

    /**
     * Remove focus trap from modal
     * @param {HTMLElement} modal - Modal element
     */
    removeFocusTrap(modal) {
        if (!modal) return;

        // Find and remove handler
        const index = this.focusTrapElements.findIndex(item => item.modal === modal);
        if (index !== -1) {
            const { handler } = this.focusTrapElements[index];
            modal.removeEventListener('keydown', handler);
            this.focusTrapElements.splice(index, 1);
        }

        // Restore focus to last focused element
        if (this.lastFocusedElement) {
            setTimeout(() => {
                this.lastFocusedElement.focus();
                this.lastFocusedElement = null;
            }, 100);
        }
    }

    /**
     * Setup keyboard navigation indicators
     */
    setupKeyboardNavigation() {
        let isTabbing = false;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                isTabbing = true;
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            isTabbing = false;
            document.body.classList.remove('keyboard-navigation');
        });
    }

    /**
     * Observe modal changes to setup/remove focus traps
     */
    observeModalChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList?.contains('modal') && node.classList?.contains('active')) {
                        this.setupFocusTrap(node);
                        this.announce('Modal opened', 'assertive');
                    }
                });

                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList?.contains('modal')) {
                        this.removeFocusTrap(node);
                    }
                });

                // Check for class changes on modal
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const modal = mutation.target;
                    if (modal.classList.contains('modal')) {
                        if (modal.classList.contains('active')) {
                            this.setupFocusTrap(modal);
                            this.announce('Modal opened', 'assertive');
                        } else {
                            this.removeFocusTrap(modal);
                            this.announce('Modal closed', 'polite');
                        }
                    }
                }
            });
        });

        // Observe all modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            observer.observe(modal, {
                attributes: true,
                attributeFilter: ['class']
            });
        });

        // Observe body for new modals
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Toggle high contrast mode
     */
    toggleHighContrastMode() {
        this.highContrastMode = !this.highContrastMode;
        this.saveHighContrastMode();
        this.applyHighContrastMode();
        this.announce(
            this.highContrastMode ? 'High contrast mode enabled' : 'High contrast mode disabled',
            'polite'
        );
    }

    /**
     * Apply high contrast mode styles
     */
    applyHighContrastMode() {
        if (this.highContrastMode) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    /**
     * Save high contrast preference
     */
    saveHighContrastMode() {
        try {
            localStorage.setItem('warehouse_high_contrast', this.highContrastMode.toString());
        } catch (e) {
            console.error('Failed to save high contrast mode to localStorage:', e);
        }
    }

    /**
     * Load high contrast preference
     * @returns {boolean}
     */
    loadHighContrastMode() {
        try {
            return localStorage.getItem('warehouse_high_contrast') === 'true';
        } catch (e) {
            console.warn('Failed to load high contrast mode from localStorage:', e);
            return false;
        }
    }

    /**
     * Add ARIA label to element
     * @param {HTMLElement} element - Element to label
     * @param {string} label - ARIA label text
     */
    setAriaLabel(element, label) {
        if (element) {
            element.setAttribute('aria-label', SecurityUtils.escapeHTML(label));
        }
    }

    /**
     * Add ARIA description to element
     * @param {HTMLElement} element - Element to describe
     * @param {string} description - ARIA description text
     */
    setAriaDescription(element, description) {
        if (element) {
            element.setAttribute('aria-describedby', SecurityUtils.escapeHTML(description));
        }
    }

    /**
     * Mark element as busy
     * @param {HTMLElement} element - Element to mark
     * @param {boolean} busy - Busy state
     */
    setBusy(element, busy = true) {
        if (element) {
            element.setAttribute('aria-busy', busy.toString());
        }
    }

    /**
     * Set element expanded state
     * @param {HTMLElement} element - Element to update
     * @param {boolean} expanded - Expanded state
     */
    setExpanded(element, expanded = true) {
        if (element) {
            element.setAttribute('aria-expanded', expanded.toString());
        }
    }

    /**
     * Make element visible to screen readers only
     * @param {HTMLElement} element - Element to hide visually
     */
    makeScreenReaderOnly(element) {
        if (element) {
            element.classList.add('sr-only');
        }
    }

    /**
     * Check if element is visible
     * @param {HTMLElement} element - Element to check
     * @returns {boolean}
     */
    isVisible(element) {
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }

    /**
     * Get next focusable element
     * @param {HTMLElement} currentElement - Current focused element
     * @returns {HTMLElement|null}
     */
    getNextFocusableElement(currentElement) {
        const focusableElements = Array.from(document.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
            'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));

        const currentIndex = focusableElements.indexOf(currentElement);
        return focusableElements[currentIndex + 1] || focusableElements[0];
    }

    /**
     * Get previous focusable element
     * @param {HTMLElement} currentElement - Current focused element
     * @returns {HTMLElement|null}
     */
    getPreviousFocusableElement(currentElement) {
        const focusableElements = Array.from(document.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
            'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));

        const currentIndex = focusableElements.indexOf(currentElement);
        return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
    }

    /**
     * Detect system preferences for accessibility
     */
    detectSystemPreferences() {
        // Detect system prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        // If user has system preference and hasn't manually set reduced motion, apply it
        if (prefersReducedMotion.matches && this.reducedMotionMode === null) {
            this.reducedMotionMode = true;
            this.applyReducedMotionMode();
        }
        
        // Listen for changes to system preference
        prefersReducedMotion.addEventListener('change', (e) => {
            if (this.reducedMotionMode === null) {
                this.reducedMotionMode = e.matches;
                this.applyReducedMotionMode();
            }
        });
    }

    /**
     * Load reduced motion preference
     * @returns {boolean|null} Reduced motion state or null if not set
     */
    loadReducedMotionMode() {
        const stored = localStorage.getItem('reducedMotionMode');
        return stored === null ? null : stored === 'true';
    }

    /**
     * Save reduced motion preference
     */
    saveReducedMotionMode() {
        localStorage.setItem('reducedMotionMode', this.reducedMotionMode);
    }

    /**
     * Toggle reduced motion mode
     */
    toggleReducedMotionMode() {
        this.reducedMotionMode = !this.reducedMotionMode;
        this.saveReducedMotionMode();
        this.applyReducedMotionMode();
        
        const status = this.reducedMotionMode ? 'enabled' : 'disabled';
        this.announce(`Reduced motion mode ${status}`, 'polite');
        
        if (window.ui) {
            window.ui.showToast(
                `<i class="fa-solid fa-${this.reducedMotionMode ? 'pause' : 'play'}"></i> Reduced motion ${status}`,
                'success'
            );
        }
    }

    /**
     * Apply reduced motion mode
     */
    applyReducedMotionMode() {
        if (this.reducedMotionMode) {
            document.body.classList.add('reduced-motion');
            this.announce('Reduced motion mode enabled', 'polite');
        } else {
            document.body.classList.remove('reduced-motion');
        }
        
        // Update button state if it exists
        const reducedMotionBtn = document.getElementById('reducedMotionBtn');
        if (reducedMotionBtn) {
            reducedMotionBtn.setAttribute('aria-pressed', this.reducedMotionMode);
            reducedMotionBtn.title = this.reducedMotionMode 
                ? 'Disable Reduced Motion' 
                : 'Enable Reduced Motion (for better performance)';
        }
    }
}

// Initialize accessibility manager globally
let accessibilityManager;

document.addEventListener('DOMContentLoaded', () => {
    accessibilityManager = new AccessibilityManager();
});
