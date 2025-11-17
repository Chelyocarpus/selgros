// Utility Functions
const Utils = {
    /**
     * Format file size in human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size string
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Format date in German format
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleString('de-DE', options);
    },

    /**
     * Check if file type is supported
     * @param {string} fileName - File name
     * @returns {boolean} True if supported
     */
    isSupportedFileType(fileName) {
        const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        return CONSTANTS.SUPPORTED_FILE_TYPES.includes(extension);
    },

    /**
     * Get file extension
     * @param {string} fileName - File name
     * @returns {string} File extension
     */
    getFileExtension(fileName) {
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    },

    /**
     * Sanitize string for HTML display
     * @param {string} str - Input string
     * @returns {string} Sanitized string
     */
    sanitizeHTML(str) {
        if (str === null || str === undefined) return '';
        
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    },

    /**
     * Convert array of objects to CSV string
     * @param {Array} data - Array of objects
     * @returns {string} CSV string
     */
    arrayToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        // Add headers
        csvRows.push(headers.map(header => `"${header}"`).join(','));
        
        // Add data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                const escaped = String(value).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    },

    /**
     * Download data as file
     * @param {string} data - File data
     * @param {string} fileName - File name
     * @param {string} mimeType - MIME type
     */
    downloadFile(data, fileName, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    },

    /**
     * Get message in specified language
     * @param {string} key - Message key
     * @param {string} lang - Language code (default: 'de')
     * @returns {string} Message text
     */
    getMessage(key, lang = 'de') {
        return CONSTANTS.MESSAGES[lang]?.[key] || CONSTANTS.MESSAGES.de[key] || key;
    },

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Count non-empty cells in sheet data
     * @param {Array} data - Sheet data array
     * @returns {number} Count of non-empty cells
     */
    countNonEmptyCells(data) {
        if (!Array.isArray(data)) return 0;
        
        let count = 0;
        for (const row of data) {
            for (const key in row) {
                if (row[key] !== null && row[key] !== undefined && row[key] !== '') {
                    count++;
                }
            }
        }
        return count;
    },

    /**
     * Get column count from data
     * @param {Array} data - Sheet data array
     * @returns {number} Number of columns
     */
    getColumnCount(data) {
        if (!Array.isArray(data) || data.length === 0) return 0;
        return Object.keys(data[0]).length;
    },

    /**
     * Validate workbook object
     * @param {Object} workbook - SheetJS workbook
     * @returns {boolean} True if valid
     */
    isValidWorkbook(workbook) {
        return workbook && 
               workbook.SheetNames && 
               Array.isArray(workbook.SheetNames) && 
               workbook.SheetNames.length > 0;
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Format number with thousand separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return new Intl.NumberFormat('de-DE').format(num);
    },

    /**
     * Safely get element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Element or null
     */
    getElement(id) {
        return document.getElementById(id);
    },

    /**
     * Show element
     * @param {string|HTMLElement} element - Element ID or element
     */
    showElement(element) {
        const el = typeof element === 'string' ? this.getElement(element) : element;
        if (el) {
            el.style.display = '';
        }
    },

    /**
     * Hide element
     * @param {string|HTMLElement} element - Element ID or element
     */
    hideElement(element) {
        const el = typeof element === 'string' ? this.getElement(element) : element;
        if (el) {
            el.style.display = 'none';
        }
    }
};

// Make Utils available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
