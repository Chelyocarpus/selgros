// UI Renderer Module
const UIRenderer = {
    /**
     * Render data table
     * @param {Array} data - Data array to render
     * @param {number} totalRows - Total number of rows in dataset
     */
    renderTable(data, totalRows) {
        const tableHead = Utils.getElement(CONSTANTS.ELEMENTS.TABLE_HEAD);
        const tableBody = Utils.getElement(CONSTANTS.ELEMENTS.TABLE_BODY);

        if (!tableHead || !tableBody || !data || data.length === 0) {
            return;
        }

        // Clear existing content
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        // Get column names from first row
        const columns = Object.keys(data[0]);

        // Create table header
        const headerRow = document.createElement('tr');
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            th.setAttribute('scope', 'col');
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        // Create table body rows
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                const value = row[column];
                
                // Format and sanitize cell value
                td.innerHTML = Utils.sanitizeHTML(this.formatCellValue(value));
                
                tr.appendChild(td);
            });
            
            tableBody.appendChild(tr);
        });

        // Show info if data is limited
        if (data.length < totalRows) {
            this.showLimitInfo(data.length, totalRows);
        }
    },

    /**
     * Format cell value for display
     * @param {*} value - Cell value
     * @returns {string} Formatted value
     */
    formatCellValue(value) {
        if (value === null || value === undefined) {
            return '';
        }

        // Check if it's a date
        if (value instanceof Date) {
            return Utils.formatDate(value);
        }

        // Check if it's a number
        if (typeof value === 'number') {
            // Check if it looks like a date serial number (Excel dates)
            if (value > 25569 && value < 50000) {
                try {
                    const date = XLSX.SSF.parse_date_code(value);
                    if (date) {
                        return `${date.d}.${date.m}.${date.y}`;
                    }
                } catch (e) {
                    // If parsing fails, just return the number
                }
            }
            
            // Format regular numbers
            if (Number.isInteger(value)) {
                return Utils.formatNumber(value);
            } else {
                return value.toFixed(2).replace('.', ',');
            }
        }

        // Return as string
        return String(value);
    },

    /**
     * Show information about limited data display
     * @param {number} shown - Number of rows shown
     * @param {number} total - Total number of rows
     */
    showLimitInfo(shown, total) {
        const tableContainer = Utils.getElement(CONSTANTS.ELEMENTS.DATA_PREVIEW);
        if (!tableContainer) return;

        // Remove existing info message
        const existingInfo = tableContainer.querySelector('.limit-info');
        if (existingInfo) {
            existingInfo.remove();
        }

        // Create info message
        const infoDiv = document.createElement('div');
        infoDiv.className = 'limit-info';
        infoDiv.style.cssText = 'padding: 0.75rem; margin-top: 1rem; background-color: #e7f3ff; border-radius: 0.375rem; color: #004085;';
        infoDiv.innerHTML = `
            <strong>ℹ️ Hinweis:</strong> 
            Es werden ${Utils.formatNumber(shown)} von ${Utils.formatNumber(total)} Zeilen angezeigt. 
            Ändern Sie die Anzeigegrenze, um mehr Zeilen zu sehen.
        `;

        tableContainer.appendChild(infoDiv);
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorMessage = Utils.getElement(CONSTANTS.ELEMENTS.ERROR_MESSAGE);
        const errorText = Utils.getElement(CONSTANTS.ELEMENTS.ERROR_TEXT);

        if (errorText) {
            errorText.textContent = message;
        }

        Utils.showElement(errorMessage);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideError();
        }, 10000);
    },

    /**
     * Hide error message
     */
    hideError() {
        Utils.hideElement(CONSTANTS.ELEMENTS.ERROR_MESSAGE);
    },

    /**
     * Show loading state
     * @param {HTMLElement} container - Container element
     */
    showLoading(container) {
        if (!container) return;

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.setAttribute('role', 'status');
        loadingDiv.setAttribute('aria-live', 'polite');
        
        container.appendChild(loadingDiv);
    },

    /**
     * Hide loading state
     * @param {HTMLElement} container - Container element
     */
    hideLoading(container) {
        if (!container) return;

        const loadingDiv = container.querySelector('.loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    },

    /**
     * Create summary card
     * @param {string} label - Card label
     * @param {string} value - Card value
     * @returns {HTMLElement} Card element
     */
    createSummaryCard(label, value) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'stat-label';
        labelDiv.textContent = label;
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'stat-value';
        valueDiv.textContent = value;
        
        card.appendChild(labelDiv);
        card.appendChild(valueDiv);
        
        return card;
    },

    /**
     * Clear table
     */
    clearTable() {
        const tableHead = Utils.getElement(CONSTANTS.ELEMENTS.TABLE_HEAD);
        const tableBody = Utils.getElement(CONSTANTS.ELEMENTS.TABLE_BODY);

        if (tableHead) tableHead.innerHTML = '';
        if (tableBody) tableBody.innerHTML = '';
    },

    /**
     * Update statistics display
     * @param {Object} stats - Statistics object
     */
    updateStatistics(stats) {
        const { rowCount = 0, colCount = 0, cellCount = 0 } = stats;

        const rowCountEl = Utils.getElement(CONSTANTS.ELEMENTS.ROW_COUNT);
        const colCountEl = Utils.getElement(CONSTANTS.ELEMENTS.COL_COUNT);
        const cellCountEl = Utils.getElement(CONSTANTS.ELEMENTS.CELL_COUNT);

        if (rowCountEl) rowCountEl.textContent = Utils.formatNumber(rowCount);
        if (colCountEl) colCountEl.textContent = Utils.formatNumber(colCount);
        if (cellCountEl) cellCountEl.textContent = Utils.formatNumber(cellCount);
    },

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const container = document.querySelector('.container main');
        if (!container) return;

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            background-color: #d4edda;
            color: #155724;
            padding: 1rem 1.5rem;
            border-radius: 0.375rem;
            border-left: 4px solid #28a745;
            margin: 1rem 0;
            display: flex;
            align-items: center;
            gap: 1rem;
        `;
        successDiv.innerHTML = `
            <span style="font-size: 1.5rem;">✓</span>
            <span>${Utils.sanitizeHTML(message)}</span>
        `;

        container.insertBefore(successDiv, container.firstChild);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
};

// Make UIRenderer available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIRenderer;
}
