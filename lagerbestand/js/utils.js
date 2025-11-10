/* ===========================
   UTILITY FUNCTIONS & HELPERS
   =========================== */

/**
 * @fileoverview Core utility functions for validation, sanitization, and helpers
 * @author Warehouse Early Warning System
 * @version 1.0.0
 */

/**
 * XSS Protection and Sanitization Utilities
 */
class SecurityUtils {
    /**
     * Sanitize HTML string to prevent XSS attacks
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    static sanitizeHTML(str) {
        if (!str || typeof str !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Escape HTML entities in string
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
     * Validate file type using magic numbers (file signatures)
     * @param {File} file - File to validate
     * @returns {Promise<{valid: boolean, type: string, message: string}>}
     */
    static async validateFileType(file) {
        const validTypes = {
            // Excel file signatures
            'xlsx': {
                signature: [0x50, 0x4B, 0x03, 0x04], // ZIP archive (xlsx is ZIP-based)
                mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
            },
            'xls': {
                signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE/CFB
                mimeTypes: ['application/vnd.ms-excel']
            },
            'json': {
                signature: null, // JSON doesn't have magic numbers, validate structure
                mimeTypes: ['application/json', 'text/json']
            },
            'csv': {
                signature: null, // CSV is text-based
                mimeTypes: ['text/csv', 'text/plain']
            }
        };

        return new Promise((resolve) => {
            const reader = new FileReader();
            
            // Get language manager instance
            const lang = window.languageManager || { t: (key) => key };
            
            reader.onload = (e) => {
                const arr = new Uint8Array(e.target.result);
                
                // Check Excel formats
                if (this.matchesSignature(arr, validTypes.xlsx.signature)) {
                    resolve({ valid: true, type: 'xlsx', message: lang.t('fileValidExcelXlsx') });
                    return;
                }
                
                if (this.matchesSignature(arr, validTypes.xls.signature)) {
                    resolve({ valid: true, type: 'xls', message: lang.t('fileValidExcelXls') });
                    return;
                }
                
                // Check extension as fallback
                const extension = file.name.split('.').pop().toLowerCase();
                
                if (extension === 'json') {
                    // Try to parse JSON
                    try {
                        const text = new TextDecoder().decode(arr);
                        JSON.parse(text);
                        resolve({ valid: true, type: 'json', message: lang.t('fileValidJson') });
                    } catch (err) {
                        resolve({ valid: false, type: 'unknown', message: lang.t('errorInvalidJsonFile') });
                    }
                    return;
                }
                
                if (extension === 'csv') {
                    resolve({ valid: true, type: 'csv', message: lang.t('fileValidCsv') });
                    return;
                }
                
                resolve({ 
                    valid: false, 
                    type: 'unknown', 
                    message: `${lang.t('errorUnsupportedFileType')}: ${file.type || extension}` 
                });
            };
            
            reader.onerror = () => {
                resolve({ valid: false, type: 'error', message: lang.t('errorFileReadError') });
            };
            
            // Read first 8 bytes for magic number check
            reader.readAsArrayBuffer(file.slice(0, 8));
        });
    }

    /**
     * Check if file signature matches expected bytes
     * @param {Uint8Array} arr - File bytes
     * @param {number[]} signature - Expected signature bytes
     * @returns {boolean}
     */
    static matchesSignature(arr, signature) {
        if (!signature) return false;
        
        for (let i = 0; i < signature.length; i++) {
            if (arr[i] !== signature[i]) return false;
        }
        return true;
    }

    /**
     * Rate limiter for localStorage operations
     */
    static rateLimiter = {
        operations: {},
        
        /**
         * Check if operation is allowed
         * @param {string} key - Operation key
         * @param {number} limit - Max operations per window
         * @param {number} windowMs - Time window in milliseconds
         * @returns {boolean}
         */
        check(key, limit = 10, windowMs = 1000) {
            const now = Date.now();
            
            if (!this.operations[key]) {
                this.operations[key] = [];
            }
            
            // Remove old timestamps outside window
            this.operations[key] = this.operations[key].filter(
                timestamp => now - timestamp < windowMs
            );
            
            // Check if limit reached
            if (this.operations[key].length >= limit) {
                return false;
            }
            
            // Add current operation
            this.operations[key].push(now);
            return true;
        },
        
        /**
         * Reset rate limit for key
         * @param {string} key - Operation key
         */
        reset(key) {
            delete this.operations[key];
        }
    };
}

/**
 * Input Validation Utilities
 */
class ValidationUtils {
    /**
     * Validate material code format
     * @param {string} code - Material code to validate
     * @returns {{valid: boolean, message: string}}
     */
    static validateMaterialCode(code) {
        // Get language manager instance
        const lang = window.languageManager || { t: (key) => key };
        
        if (!code || typeof code !== 'string') {
            return { valid: false, message: lang.t('errorMaterialCodeRequired') };
        }
        
        const trimmed = code.trim();
        
        if (trimmed.length === 0) {
            return { valid: false, message: lang.t('errorMaterialCodeEmpty') };
        }
        
        if (trimmed.length > 50) {
            return { valid: false, message: lang.t('errorMaterialCodeTooLong') };
        }
        
        // Alphanumeric, hyphens, underscores only
        if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
            return { valid: false, message: lang.t('errorMaterialCodeInvalidChars') };
        }
        
        return { valid: true, message: lang.t('successMaterialCodeValid') };
    }

    /**
     * Validate capacity value
     * @param {any} capacity - Capacity value to validate
     * @returns {{valid: boolean, message: string, value: number|null}}
     */
    static validateCapacity(capacity) {
        // Get language manager instance
        const lang = window.languageManager || { t: (key) => key };
        
        if (capacity === null || capacity === undefined || capacity === '') {
            return { valid: false, message: lang.t('errorCapacityRequired'), value: null };
        }
        
        const num = Number(capacity);
        
        if (isNaN(num)) {
            return { valid: false, message: lang.t('errorCapacityInvalidNumber'), value: null };
        }
        
        if (num < 0) {
            return { valid: false, message: lang.t('errorCapacityNegative'), value: null };
        }
        
        if (num > 999999) {
            return { valid: false, message: lang.t('errorCapacityTooLarge'), value: null };
        }
        
        if (!Number.isInteger(num)) {
            return { valid: false, message: lang.t('errorCapacityNotInteger'), value: null };
        }
        
        return { valid: true, message: lang.t('successCapacityValid'), value: num };
    }

    /**
     * Validate date string
     * @param {string} dateStr - Date string to validate
     * @returns {{valid: boolean, message: string, date: Date|null}}
     */
    static validateDate(dateStr) {
        // Get language manager instance
        const lang = window.languageManager || { t: (key) => key };
        
        if (!dateStr) {
            return { valid: true, message: lang.t('optional'), date: null };
        }
        
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
            return { valid: false, message: lang.t('errorInvalidDateFormat'), date: null };
        }
        
        // Check if date is not too far in past or future
        const now = new Date();
        const minDate = new Date(now.getFullYear() - 10, 0, 1);
        const maxDate = new Date(now.getFullYear() + 10, 11, 31);
        
        if (date < minDate || date > maxDate) {
            return { valid: false, message: lang.t('errorDateOutOfRange'), date: null };
        }
        
        return { valid: true, message: lang.t('successDateValid'), date };
    }

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {{valid: boolean, message: string}}
     */
    static validateEmail(email) {
        // Get language manager instance
        const lang = window.languageManager || { t: (key) => key };
        
        if (!email || typeof email !== 'string') {
            return { valid: false, message: lang.t('errorEmailRequired') };
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            return { valid: false, message: lang.t('errorEmailInvalidFormat') };
        }
        
        return { valid: true, message: lang.t('successEmailValid') };
    }

    /**
     * Validate string length
     * @param {string} str - String to validate
     * @param {number} min - Minimum length
     * @param {number} max - Maximum length
     * @param {string} fieldName - Field name for error message
     * @returns {{valid: boolean, message: string}}
     */
    static validateLength(str, min, max, fieldName = 'Field') {
        // Get language manager instance
        const lang = window.languageManager || { t: (key) => key };
        
        if (str === null || str === undefined) {
            return { valid: false, message: `${fieldName} ${lang.t('required')}` };
        }
        
        const length = str.toString().length;
        
        if (length < min) {
            return { valid: false, message: `${fieldName} must be at least ${min} characters` };
        }
        
        if (length > max) {
            return { valid: false, message: `${fieldName} must be at most ${max} characters` };
        }
        
        return { valid: true, message: lang.t('successLengthValid') };
    }
}

/**
 * Performance Utilities
 */
class PerformanceUtils {
    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Cache manager for expensive operations with automatic cleanup
     */
    static cache = {
        store: new Map(),
        maxSize: 100, // Maximum number of cache entries
        maxMemoryMB: 10, // Maximum cache memory in MB
        cleanupInterval: null,
        
        /**
         * Initialize automatic cache cleanup
         * @param {number} intervalMs - Cleanup interval in milliseconds (default 5 minutes)
         */
        initAutoCleanup(intervalMs = 300000) {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
            }
            
            this.cleanupInterval = setInterval(() => {
                this.cleanup();
            }, intervalMs);
            
            console.log(`[Performance] Cache auto-cleanup initialized (every ${intervalMs / 1000}s)`);
        },
        
        /**
         * Stop automatic cache cleanup
         */
        stopAutoCleanup() {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }
        },
        
        /**
         * Get cached value
         * @param {string} key - Cache key
         * @returns {any|null}
         */
        get(key) {
            const item = this.store.get(key);
            if (!item) return null;
            
            // Check if expired
            if (Date.now() > item.expiry) {
                this.store.delete(key);
                return null;
            }
            
            // Update access time for LRU tracking
            item.lastAccessed = Date.now();
            
            return item.value;
        },
        
        /**
         * Set cached value with automatic size management
         * @param {string} key - Cache key
         * @param {any} value - Value to cache
         * @param {number} ttl - Time to live in milliseconds (default 5 minutes)
         */
        set(key, value, ttl = 300000) {
            // Check size limit before adding
            if (this.store.size >= this.maxSize) {
                this.evictLRU();
            }
            
            // Estimate memory usage (rough approximation)
            const estimatedSize = this.estimateSize(value);
            
            this.store.set(key, {
                value,
                expiry: Date.now() + ttl,
                lastAccessed: Date.now(),
                size: estimatedSize
            });
            
            // Check memory limit
            const totalMemory = this.getTotalMemoryMB();
            if (totalMemory > this.maxMemoryMB) {
                console.warn(`[Performance] Cache memory limit exceeded (${totalMemory.toFixed(2)}MB), evicting entries...`);
                this.evictUntilUnderLimit();
            }
        },
        
        /**
         * Evict least recently used cache entry
         */
        evictLRU() {
            let oldestKey = null;
            let oldestTime = Infinity;
            
            for (const [key, item] of this.store.entries()) {
                if (item.lastAccessed < oldestTime) {
                    oldestTime = item.lastAccessed;
                    oldestKey = key;
                }
            }
            
            if (oldestKey) {
                this.store.delete(oldestKey);
                console.log(`[Performance] Evicted LRU cache entry: ${oldestKey}`);
            }
        },
        
        /**
         * Evict entries until under memory limit
         */
        evictUntilUnderLimit() {
            let evicted = 0;
            
            while (this.getTotalMemoryMB() > this.maxMemoryMB && this.store.size > 0) {
                this.evictLRU();
                evicted++;
            }
            
            if (evicted > 0) {
                console.log(`[Performance] Evicted ${evicted} cache entries to free memory`);
            }
        },
        
        /**
         * Estimate size of value in bytes (rough approximation)
         * @param {any} value - Value to estimate
         * @returns {number} Estimated size in bytes
         */
        estimateSize(value) {
            const str = JSON.stringify(value);
            return str.length * 2; // UTF-16 uses 2 bytes per character
        },
        
        /**
         * Get total cache memory usage in MB
         * @returns {number} Total memory in MB
         */
        getTotalMemoryMB() {
            let total = 0;
            
            for (const item of this.store.values()) {
                total += item.size || 0;
            }
            
            return total / (1024 * 1024);
        },
        
        /**
         * Get cache statistics
         * @returns {object} Cache stats
         */
        getStats() {
            const stats = {
                entries: this.store.size,
                maxEntries: this.maxSize,
                memoryMB: this.getTotalMemoryMB(),
                maxMemoryMB: this.maxMemoryMB,
                hitRate: 0,
                expired: 0
            };
            
            const now = Date.now();
            for (const item of this.store.values()) {
                if (now > item.expiry) {
                    stats.expired++;
                }
            }
            
            return stats;
        },
        
        /**
         * Periodic cleanup of expired entries
         */
        cleanup() {
            const now = Date.now();
            let cleaned = 0;
            
            for (const [key, item] of this.store.entries()) {
                if (now > item.expiry) {
                    this.store.delete(key);
                    cleaned++;
                }
            }
            
            if (cleaned > 0) {
                console.log(`[Performance] Cache cleanup: removed ${cleaned} expired entries`);
            }
            
            const stats = this.getStats();
            console.log(`[Performance] Cache stats: ${stats.entries}/${stats.maxEntries} entries, ${stats.memoryMB.toFixed(2)}MB/${stats.maxMemoryMB}MB`);
        },
        
        /**
         * Clear cache
         * @param {string} key - Optional key to clear specific item
         */
        clear(key = null) {
            if (key) {
                this.store.delete(key);
            } else {
                this.store.clear();
                console.log('[Performance] Cache cleared');
            }
        }
    };

    /**
     * Measure function execution time
     * @param {Function} func - Function to measure
     * @param {string} label - Label for logging
     * @returns {Function} Wrapped function
     */
    static measure(func, label = 'Function') {
        return function(...args) {
            const start = performance.now();
            const result = func.apply(this, args);
            const end = performance.now();
            console.log(`[Performance] ${label} took ${(end - start).toFixed(2)}ms`);
            return result;
        };
    }
    
    /**
     * Initialize performance monitoring and automatic cleanup
     */
    static init() {
        // Start automatic cache cleanup (every 5 minutes)
        this.cache.initAutoCleanup(300000);
        
        // Monitor memory usage periodically (every 30 seconds)
        setInterval(() => {
            this.monitorMemory();
        }, 30000);
        
        console.log('[Performance] Performance monitoring initialized');
    }
    
    /**
     * Monitor and log memory usage
     */
    static monitorMemory() {
        if (!performance.memory) {
            return; // Not available in all browsers
        }
        
        const memoryMB = {
            used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
            total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
            limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
        };
        
        const usagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(1);
        
        // Warn if memory usage is high
        if (usagePercent > 80) {
            console.warn(`[Performance] High memory usage: ${memoryMB.used}MB/${memoryMB.limit}MB (${usagePercent}%)`);
            
            // Trigger aggressive cache cleanup
            this.cache.evictUntilUnderLimit();
        } else if (usagePercent > 60) {
            console.log(`[Performance] Memory usage: ${memoryMB.used}MB/${memoryMB.limit}MB (${usagePercent}%)`);
        }
    }
    
    /**
     * Cleanup resources to prevent memory leaks
     */
    static cleanup() {
        this.cache.clear();
        console.log('[Performance] Resources cleaned up');
    }
}

/**
 * Error Handling Utilities
 */
class ErrorHandler {
    static errors = [];
    static maxErrors = 50;

    /**
     * Log error with context
     * @param {Error|string} error - Error to log
     * @param {string} context - Context/location of error
     * @param {object} metadata - Additional metadata
     */
    static log(error, context = 'Unknown', metadata = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error?.message || error.toString(),
            context,
            metadata,
            stack: error?.stack || null
        };
        
        this.errors.unshift(errorEntry);
        
        // Keep only recent errors
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }
        
        console.error(`[Error] ${context}:`, error, metadata);
    }

    /**
     * Get recent errors
     * @param {number} limit - Number of errors to retrieve
     * @returns {Array} Recent errors
     */
    static getRecentErrors(limit = 10) {
        return this.errors.slice(0, limit);
    }

    /**
     * Clear error log
     */
    static clearErrors() {
        this.errors = [];
    }

    /**
     * Safe execution wrapper
     * @param {Function} func - Function to execute
     * @param {string} context - Context for error logging
     * @param {any} fallback - Fallback value on error
     * @returns {any} Function result or fallback
     */
    static safe(func, context = 'Unknown', fallback = null) {
        try {
            return func();
        } catch (error) {
            this.log(error, context);
            return fallback;
        }
    }

    /**
     * Async safe execution wrapper
     * @param {Function} func - Async function to execute
     * @param {string} context - Context for error logging
     * @param {any} fallback - Fallback value on error
     * @returns {Promise<any>} Function result or fallback
     */
    static async safeAsync(func, context = 'Unknown', fallback = null) {
        try {
            return await func();
        } catch (error) {
            this.log(error, context);
            return fallback;
        }
    }
}

/**
 * Format Utilities
 */
class FormatUtils {
    /**
     * Format date to locale string
     * @param {Date|string} date - Date to format
     * @param {string} locale - Locale code
     * @returns {string} Formatted date
     */
    static formatDate(date, locale = 'de-DE') {
        if (!date) return '-';
        
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) return 'Invalid Date';
        
        return d.toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    /**
     * Format number with thousands separator
     * @param {number} num - Number to format
     * @param {string} locale - Locale code
     * @returns {string} Formatted number
     */
    static formatNumber(num, locale = 'de-DE') {
        if (num === null || num === undefined) return '-';
        return num.toLocaleString(locale);
    }

    /**
     * Format file size in bytes to human readable
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Truncate string with ellipsis
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated string
     */
    static truncate(str, maxLength = 50) {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    }
}

/**
 * Storage Utilities
 */
class StorageUtils {
    /**
     * Get localStorage usage information
     * @returns {{used: number, total: number, percentage: number, available: number}}
     */
    static getStorageInfo() {
        let total = 0;
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        
        // Most browsers allow ~5-10MB, we'll estimate 5MB
        const estimatedTotal = 5 * 1024 * 1024; // 5MB in bytes
        const used = total * 2; // UTF-16 uses 2 bytes per character
        const percentage = (used / estimatedTotal) * 100;
        const available = estimatedTotal - used;
        
        return {
            used,
            total: estimatedTotal,
            percentage: Math.round(percentage * 100) / 100,
            available
        };
    }

    /**
     * Check if localStorage has enough space
     * @param {number} requiredBytes - Required space in bytes
     * @returns {boolean}
     */
    static hasSpace(requiredBytes) {
        const info = this.getStorageInfo();
        return info.available >= requiredBytes;
    }

    /**
     * Safe localStorage setItem with quota check
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {{success: boolean, message: string}}
     */
    static setItem(key, value) {
        // Get language manager instance
        const lang = window.languageManager || { t: (key) => key };
        
        try {
            localStorage.setItem(key, value);
            return { success: true, message: lang.t('successFileStored') };
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                return { 
                    success: false, 
                    message: lang.t('errorStorageQuotaExceeded')
                };
            }
            return { 
                success: false, 
                message: `${lang.t('errorStorageGeneric')}: ${e.message}` 
            };
        }
    }
}
