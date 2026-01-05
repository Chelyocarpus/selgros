// Utility functions for number formatting and calculations

// Number formatting utilities
const parseGermanNumber = value => {
    if (typeof value === 'number') return value;
    
    // Handle special cases first
    if (!value || value === '' || value === '.' || value === ',') {
        return 0;
    }
    
    // Replace comma with period for decimal parsing
    return parseFloat(value.toString().replace(/\s/g, '').replace(',', '.')) || 0;
};

// Format number for display with German format (comma as decimal separator)
const formatGermanNumber = value => {
    // Ensure value is a valid number
    const numVal = parseFloat(value) || 0;
    // Format with 2 decimal places and change period to comma
    return numVal.toFixed(2).replace('.', ',');
};

// Calculation utilities
const calculateMargin = (netto, ek) => {
    if (!ek) return 0;
    return ((netto - ek) / netto * 100).toFixed(2);
};

const calculateSpanne = (netto, ek) => {
    if (!netto || !ek || netto <= 0) return 0;
    const margin = ((netto - ek) / ek * 100).toFixed(2);
    console.log(`Spanne calculation: (${netto} - ${ek}) / ${ek} * 100 = ${margin}%`);
    return margin;
};

const calculateBrutto = netto => (netto * 1.19).toFixed(2);

// Debounce utility - Fix to preserve 'this' context
const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
        const context = this; // Store the context
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            try {
                func.apply(context, args); // Use stored context
            } catch (e) {
                console.error('Error in debounced function:', e);
            }
        }, wait);
    };
};

// Security utilities to prevent XSS attacks
class SecurityUtils {
    /**
     * Escape HTML entities to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    static escapeHTML(str) {
        if (!str || typeof str !== 'string') return '';
        const entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        return str.replace(/[&<>"'\/]/g, char => entityMap[char]);
    }
    
    /**
     * Sanitize HTML by converting to text and back to entities
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    static sanitizeHTML(str) {
        if (!str || typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Export utilities
window.utils = {
    parseGermanNumber,
    formatGermanNumber,
    calculateMargin,
    calculateSpanne,
    calculateBrutto,
    debounce
};

// Export SecurityUtils globally
window.SecurityUtils = SecurityUtils;
