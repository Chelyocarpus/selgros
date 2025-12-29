// Data Analyzer Module
const DataAnalyzer = {
    workbook: null,
    currentSheet: null,
    currentData: null,

    /**
     * Initialize analyzer with workbook
     * @param {Object} workbook - SheetJS workbook
     */
    init(workbook) {
        this.workbook = workbook;
        this.populateSheetSelector();
    },

    /**
     * Populate sheet selector dropdown
     */
    populateSheetSelector() {
        const sheetSelect = Utils.getElement(CONSTANTS.ELEMENTS.SHEET_SELECT);
        if (!sheetSelect) return;

        // Clear existing options
        sheetSelect.innerHTML = '<option value="">Bitte wählen...</option>';

        // Add sheet names as options
        if (this.workbook && this.workbook.SheetNames) {
            this.workbook.SheetNames.forEach((sheetName) => {
                const option = document.createElement('option');
                option.value = sheetName;
                option.textContent = sheetName;
                sheetSelect.appendChild(option);
            });
        }

        // Set up change event listener
        sheetSelect.addEventListener('change', (e) => {
            this.handleSheetChange(e.target.value);
        });

        // Auto-select first sheet if only one exists
        if (this.workbook.SheetNames.length === 1) {
            sheetSelect.value = this.workbook.SheetNames[0];
            this.handleSheetChange(this.workbook.SheetNames[0]);
        }
    },

    /**
     * Handle sheet selection change
     * @param {string} sheetName - Selected sheet name
     */
    handleSheetChange(sheetName) {
        if (!sheetName) {
            this.hideAnalysis();
            return;
        }

        try {
            this.currentSheet = sheetName;
            const sheet = this.workbook.Sheets[sheetName];
            
            if (!sheet) {
                throw new Error(Utils.getMessage('NO_DATA_FOUND'));
            }

            // Convert sheet to JSON
            this.currentData = XLSX.utils.sheet_to_json(sheet);

            if (!this.currentData || this.currentData.length === 0) {
                throw new Error(Utils.getMessage('NO_DATA_FOUND'));
            }

            // Initialize business analyzer
            BusinessAnalyzer.init(this.currentData);

            // Display basic statistics (for data preview tab)
            this.displayStatistics();
            this.displayPreview();
            
            // Display business analysis (default tab)
            this.displayBusinessAnalysis();
            
            // Show sections
            Utils.showElement(CONSTANTS.ELEMENTS.STATISTICS);
            Utils.showElement(CONSTANTS.ELEMENTS.DATA_PREVIEW);
            Utils.showElement(CONSTANTS.ELEMENTS.EXPORT_SECTION);

            // Setup tab switching
            this.setupTabs();

            // Setup article search
            this.setupArticleSearch();

            UIRenderer.hideError();

        } catch (error) {
            console.error('Error analyzing sheet:', error);
            UIRenderer.showError(error.message);
            this.hideAnalysis();
        }
    },

    /**
     * Display business analysis
     */
    displayBusinessAnalysis() {
        const analysis = BusinessAnalyzer.analyzeAll();
        if (analysis) {
            BusinessUIRenderer.renderAnalysis(analysis);
        }
    },

    /**
     * Setup tab switching functionality
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const dataPreviewTab = document.getElementById('dataPreviewTab');
        const businessAnalysisTab = document.getElementById('businessAnalysisTab');

        // Move data preview content into tab
        if (dataPreviewTab) {
            const statistics = Utils.getElement(CONSTANTS.ELEMENTS.STATISTICS);
            const dataPreview = Utils.getElement(CONSTANTS.ELEMENTS.DATA_PREVIEW);
            const exportSection = Utils.getElement(CONSTANTS.ELEMENTS.EXPORT_SECTION);

            if (statistics) {
                statistics.style.display = '';
                dataPreviewTab.appendChild(statistics);
            }
            if (dataPreview) {
                dataPreview.style.display = '';
                dataPreviewTab.appendChild(dataPreview);
            }
            if (exportSection) {
                exportSection.style.display = '';
                dataPreviewTab.appendChild(exportSection);
            }
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Hide all tabs
                if (dataPreviewTab) dataPreviewTab.style.display = 'none';
                if (businessAnalysisTab) businessAnalysisTab.style.display = 'none';

                // Activate clicked tab
                button.classList.add('active');
                const tabName = button.getAttribute('data-tab');

                if (tabName === 'data' && dataPreviewTab) {
                    dataPreviewTab.style.display = 'block';
                } else if (tabName === 'business' && businessAnalysisTab) {
                    businessAnalysisTab.style.display = 'block';
                }
            });
        });
    },

    /**
     * Setup article search functionality
     */
    setupArticleSearch() {
        const searchBtn = document.getElementById('searchArticleBtn');
        const searchInput = document.getElementById('articleSearch');

        if (searchBtn && searchInput) {
            const handleSearch = () => {
                const artikel = searchInput.value.trim();
                if (artikel) {
                    this.searchArticle(artikel);
                }
            };

            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }
    },

    /**
     * Search for article details
     * @param {string} artikel - Article number
     */
    searchArticle(artikel) {
        const details = BusinessAnalyzer.getArticleDetails(artikel);
        const detailsContainer = document.getElementById('articleDetails');

        if (!detailsContainer) return;

        if (!details) {
            detailsContainer.style.display = 'block';
            detailsContainer.innerHTML = `
                <div class="article-detail-card" style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: #856404;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <strong>Artikel nicht gefunden:</strong> ${Utils.sanitizeHTML(artikel)}
                    </div>
                </div>
            `;
            
            // Scroll to results
            this.scrollToResults(detailsContainer);
            return;
        }

        // Calculate net values
        const netQuantity = details.totalGained - details.totalWrittenOff;
        const netValue = details.totalValue;

        detailsContainer.style.display = 'block';
        detailsContainer.innerHTML = `
            <div class="article-detail-card" style="background: white; color: var(--color-text-primary);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; color: var(--color-primary); margin: 0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        </svg>
                        ${Utils.sanitizeHTML(details.artikel)}
                    </h3>
                    <button onclick="document.getElementById('articleDetails').style.display='none';document.getElementById('articleSearch').value='';" style="background: transparent; border: none; color: var(--color-text-secondary); cursor: pointer; font-size: 1.5rem; padding: 0; line-height: 1;" title="Schließen">&times;</button>
                </div>
                <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem; font-size: 1.1rem;">${Utils.sanitizeHTML(details.artikeltext)}</p>
                
                <div class="article-detail-header" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
                    <div class="article-detail-item">
                        <div class="label">Bewegungen</div>
                        <div class="value">${Utils.formatNumber(details.movementCount)}</div>
                    </div>
                    <div class="article-detail-item" style="background: #d4edda;">
                        <div class="label">Zugänge (+)</div>
                        <div class="value" style="color: #155724;">${Utils.formatNumber(details.totalGained)}</div>
                    </div>
                    <div class="article-detail-item" style="background: #f8d7da;">
                        <div class="label">Abschreibungen (-)</div>
                        <div class="value" style="color: #721c24;">${Utils.formatNumber(details.totalWrittenOff)}</div>
                    </div>
                    <div class="article-detail-item" style="background: ${netQuantity >= 0 ? '#d1ecf1' : '#f8d7da'}; border: 2px solid ${netQuantity >= 0 ? '#17a2b8' : '#dc3545'};">
                        <div class="label" style="font-weight: 700;">Netto-Menge</div>
                        <div class="value" style="color: ${netQuantity >= 0 ? '#0c5460' : '#721c24'}; font-weight: bold; font-size: 1.3rem;">${netQuantity > 0 ? '+' : ''}${Utils.formatNumber(netQuantity)}</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-secondary); margin-top: 0.25rem;">${Utils.formatNumber(details.totalGained)} - ${Utils.formatNumber(details.totalWrittenOff)}</div>
                    </div>
                    <div class="article-detail-item" style="background: ${netValue >= 0 ? '#d1ecf1' : '#f8d7da'}; border: 2px solid ${netValue >= 0 ? '#17a2b8' : '#dc3545'};">
                        <div class="label" style="font-weight: 700;">Netto-Wert</div>
                        <div class="value" style="color: ${netValue >= 0 ? '#0c5460' : '#721c24'}; font-weight: bold; font-size: 1.3rem;">${new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(netValue)}</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-secondary); margin-top: 0.25rem;">Gesamt aller Bewegungen</div>
                    </div>
                </div>

                <div style="background: #e7f3ff; border-left: 4px solid #0066cc; padding: 1rem; margin: 1.5rem 0; border-radius: 0.25rem;">
                    <div style="font-size: 0.875rem; color: #004085;">
                        <strong>ℹ️ Erklärung:</strong> Die Netto-Menge zeigt die tatsächliche Veränderung (Zugänge minus Abschreibungen). 
                        Der Netto-Wert ist die Summe aller Bewegungswerte und kann negativ sein, wenn mehr abgeschrieben als hinzugefügt wurde.
                    </div>
                </div>

                <h4 style="margin: 1.5rem 0 1rem;">Bewegungsverlauf (chronologisch)</h4>
                <div class="movement-history">
                    ${details.movements.map(mov => `
                        <div class="movement-item ${mov.menge < 0 ? 'negative' : 'positive'}">
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Datum</div>
                                    <div style="font-weight: 600;">${Utils.sanitizeHTML(mov.datum)}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Bewegungsart</div>
                                    <div style="font-weight: 600;">${Utils.sanitizeHTML(mov.bewegungsart)}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Menge</div>
                                    <div style="font-weight: 600; color: ${mov.menge < 0 ? '#dc3545' : '#28a745'};">${mov.menge > 0 ? '+' : ''}${Utils.formatNumber(mov.menge)}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Wert Hauswähr.</div>
                                    <div style="font-weight: 600;">${new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(mov.betragHaus)}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">VK-Wert</div>
                                    <div style="font-weight: 600;">${new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(mov.vkWert)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Scroll to results
        this.scrollToResults(detailsContainer);
    },

    /**
     * Scroll to article details results
     * @param {HTMLElement} element - Element to scroll to
     */
    scrollToResults(element) {
        if (!element) return;
        
        setTimeout(() => {
            const offset = 80; // Account for any fixed headers
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }, 100);
    },

    /**
     * Display statistics for current sheet
     */
    displayStatistics() {
        if (!this.currentData) return;

        const rowCount = this.currentData.length;
        const colCount = Utils.getColumnCount(this.currentData);
        const cellCount = Utils.countNonEmptyCells(this.currentData);

        // Update statistics display
        const rowCountEl = Utils.getElement(CONSTANTS.ELEMENTS.ROW_COUNT);
        const colCountEl = Utils.getElement(CONSTANTS.ELEMENTS.COL_COUNT);
        const cellCountEl = Utils.getElement(CONSTANTS.ELEMENTS.CELL_COUNT);

        if (rowCountEl) rowCountEl.textContent = Utils.formatNumber(rowCount);
        if (colCountEl) colCountEl.textContent = Utils.formatNumber(colCount);
        if (cellCountEl) cellCountEl.textContent = Utils.formatNumber(cellCount);
    },

    /**
     * Display data preview
     */
    displayPreview() {
        if (!this.currentData) return;

        const rowLimitSelect = Utils.getElement(CONSTANTS.ELEMENTS.ROW_LIMIT);
        
        // Set up row limit change listener if not already set
        if (rowLimitSelect && !rowLimitSelect.dataset.listenerSet) {
            rowLimitSelect.addEventListener('change', () => {
                this.displayPreview();
            });
            rowLimitSelect.dataset.listenerSet = 'true';
        }

        // Get row limit
        const limit = this.getRowLimit();
        const dataToShow = limit === 'all' ? this.currentData : this.currentData.slice(0, parseInt(limit));

        // Render table
        UIRenderer.renderTable(dataToShow, this.currentData.length);
    },

    /**
     * Get current row limit setting
     * @returns {string|number} Row limit
     */
    getRowLimit() {
        const rowLimitSelect = Utils.getElement(CONSTANTS.ELEMENTS.ROW_LIMIT);
        return rowLimitSelect ? rowLimitSelect.value : CONSTANTS.DEFAULT_ROW_LIMIT;
    },

    /**
     * Hide analysis sections
     */
    hideAnalysis() {
        Utils.hideElement(CONSTANTS.ELEMENTS.STATISTICS);
        Utils.hideElement(CONSTANTS.ELEMENTS.DATA_PREVIEW);
        Utils.hideElement(CONSTANTS.ELEMENTS.EXPORT_SECTION);
    },

    /**
     * Export current data as JSON
     */
    exportJSON() {
        if (!this.currentData) {
            UIRenderer.showError(Utils.getMessage('SELECT_SHEET_FIRST'));
            return;
        }

        try {
            const jsonString = JSON.stringify(this.currentData, null, 2);
            const fileName = `${this.currentSheet || 'export'}_${Date.now()}.json`;
            
            Utils.downloadFile(
                jsonString,
                fileName,
                CONSTANTS.MIME_TYPES.JSON
            );

        } catch (error) {
            console.error('Error exporting JSON:', error);
            UIRenderer.showError(Utils.getMessage('FILE_READ_ERROR'));
        }
    },

    /**
     * Export current data as CSV
     */
    exportCSV() {
        if (!this.currentData) {
            UIRenderer.showError(Utils.getMessage('SELECT_SHEET_FIRST'));
            return;
        }

        try {
            const csvString = Utils.arrayToCSV(this.currentData);
            const fileName = `${this.currentSheet || 'export'}_${Date.now()}.csv`;
            
            Utils.downloadFile(
                csvString,
                fileName,
                CONSTANTS.MIME_TYPES.CSV
            );

        } catch (error) {
            console.error('Error exporting CSV:', error);
            UIRenderer.showError(Utils.getMessage('FILE_READ_ERROR'));
        }
    },

    /**
     * Get current data
     * @returns {Array|null} Current data array
     */
    getData() {
        return this.currentData;
    },

    /**
     * Get current sheet name
     * @returns {string|null} Current sheet name
     */
    getCurrentSheet() {
        return this.currentSheet;
    },

    /**
     * Get analysis summary
     * @returns {Object} Analysis summary
     */
    getSummary() {
        if (!this.currentData) {
            return null;
        }

        return {
            sheetName: this.currentSheet,
            rowCount: this.currentData.length,
            columnCount: Utils.getColumnCount(this.currentData),
            cellCount: Utils.countNonEmptyCells(this.currentData),
            columns: this.currentData.length > 0 ? Object.keys(this.currentData[0]) : []
        };
    }
};

// Make DataAnalyzer available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataAnalyzer;
}
