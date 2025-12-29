// Main Application
const App = {
    /**
     * Initialize application
     */
    init() {
        console.log('Initializing Bestandsveränderung Analyse application...');
        
        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            console.error('SheetJS library not loaded!');
            UIRenderer.showError('Bibliothek konnte nicht geladen werden. Bitte laden Sie die Seite neu.');
            return;
        }

        // Initialize modules
        this.initializeModules();
        
        // Set up export buttons
        this.setupExportButtons();

        console.log('Application initialized successfully');
    },

    /**
     * Initialize all modules
     */
    initializeModules() {
        // Initialize file handler
        FileHandler.init();
    },

    /**
     * Set up export button event listeners
     */
    setupExportButtons() {
        const exportJSONBtn = Utils.getElement(CONSTANTS.ELEMENTS.EXPORT_JSON);
        const exportCSVBtn = Utils.getElement(CONSTANTS.ELEMENTS.EXPORT_CSV);

        if (exportJSONBtn) {
            exportJSONBtn.addEventListener('click', () => {
                this.handleExport(CONSTANTS.EXPORT_FORMATS.JSON);
            });
        }

        if (exportCSVBtn) {
            exportCSVBtn.addEventListener('click', () => {
                this.handleExport(CONSTANTS.EXPORT_FORMATS.CSV);
            });
        }
    },

    /**
     * Handle export action
     * @param {string} format - Export format (json or csv)
     */
    handleExport(format) {
        try {
            if (format === CONSTANTS.EXPORT_FORMATS.JSON) {
                DataAnalyzer.exportJSON();
                UIRenderer.showSuccess('JSON-Export erfolgreich');
            } else if (format === CONSTANTS.EXPORT_FORMATS.CSV) {
                DataAnalyzer.exportCSV();
                UIRenderer.showSuccess('CSV-Export erfolgreich');
            }
        } catch (error) {
            console.error('Export error:', error);
            UIRenderer.showError('Fehler beim Exportieren: ' + error.message);
        }
    },

    /**
     * Get application state
     * @returns {Object} Application state
     */
    getState() {
        return {
            hasWorkbook: FileHandler.getWorkbook() !== null,
            currentFile: FileHandler.getFile()?.name,
            currentSheet: DataAnalyzer.getCurrentSheet(),
            dataSummary: DataAnalyzer.getSummary()
        };
    },

    /**
     * Reset application
     */
    reset() {
        // Clear data
        FileHandler.currentWorkbook = null;
        FileHandler.currentFile = null;
        DataAnalyzer.currentSheet = null;
        DataAnalyzer.currentData = null;

        // Clear UI
        UIRenderer.clearTable();
        Utils.hideElement(CONSTANTS.ELEMENTS.FILE_INFO);
        Utils.hideElement(CONSTANTS.ELEMENTS.ANALYSIS_SECTION);
        Utils.hideElement(CONSTANTS.ELEMENTS.STATISTICS);
        Utils.hideElement(CONSTANTS.ELEMENTS.DATA_PREVIEW);
        Utils.hideElement(CONSTANTS.ELEMENTS.EXPORT_SECTION);
        UIRenderer.hideError();

        // Hide quick article search
        const sidebarSearch = document.getElementById('sidebarSearch');
        if (sidebarSearch) {
            sidebarSearch.style.display = 'none';
        }
        
        const articleDetails = document.getElementById('articleDetails');
        if (articleDetails) {
            articleDetails.innerHTML = '';
            articleDetails.style.display = 'none';
        }

        // Reset file input
        const fileInput = Utils.getElement(CONSTANTS.ELEMENTS.FILE_INPUT);
        if (fileInput) {
            fileInput.value = '';
        }

        // Reset sheet selector
        const sheetSelect = Utils.getElement(CONSTANTS.ELEMENTS.SHEET_SELECT);
        if (sheetSelect) {
            sheetSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        }

        console.log('Application reset');
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}

// Make App available globally for debugging
window.App = App;

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+R or Cmd+R to reset (prevent default page reload)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (confirm('Möchten Sie die Anwendung zurücksetzen?')) {
            App.reset();
        }
    }
    
    // Escape to clear errors
    if (e.key === 'Escape') {
        UIRenderer.hideError();
    }
});

// Handle window unload
window.addEventListener('beforeunload', (e) => {
    const state = App.getState();
    if (state.hasWorkbook) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
