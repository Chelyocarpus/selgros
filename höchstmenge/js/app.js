/* ===========================
   APPLICATION INITIALIZATION
   =========================== */

// Initialize application
const languageManager = new LanguageManager();
const dataManager = new DataManager();
const reportProcessor = new ReportProcessor(dataManager);
const ui = new UIManager(dataManager, reportProcessor);

// Track which tabs have been initialized
const tabsInitialized = {
    check: false,
    materials: false,
    archive: false,
    dashboard: false
};

// Global functions for onclick handlers
function switchTab(tabName) {
    // Lazy load tab content if not already initialized
    if (!tabsInitialized[tabName]) {
        initializeTab(tabName);
        tabsInitialized[tabName] = true;
    }
    
    ui.switchTab(tabName);
}

/**
 * Initialize tab content on-demand
 * @param {string} tabName - Name of tab to initialize
 */
function initializeTab(tabName) {
    console.log(`[Performance] Lazy loading tab: ${tabName}`);
    
    const startTime = performance.now();
    
    switch(tabName) {
        case 'check':
            renderCheckStockTab();
            break;
        case 'materials':
            renderMaterialsTab();
            ui.renderMaterialsList();
            ui.renderGroupsList();
            ui.renderNotesList();
            break;
        case 'archive':
            renderArchiveTab();
            break;
        case 'dashboard':
            renderDashboardTab();
            ui.initializeDashboard();
            break;
    }
    
    const endTime = performance.now();
    console.log(`[Performance] Tab ${tabName} initialized in ${(endTime - startTime).toFixed(2)}ms`);
}

function processData() {
    ui.processReport();
}

function clearResults() {
    ui.clearResults();
}

function filterResults() {
    ui.filterResults();
}

function addMaterial() {
    ui.addMaterial();
}

function closeEditModal() {
    ui.closeMaterialModal();
}

function saveEditMaterial() {
    ui.saveMaterialModal();
}

function closeViewReportModal() {
    ui.closeViewReportModal();
}

function handleFileUpload(event) {
    ui.handleFileUpload(event);
}

function changeLanguage() {
    const select = document.getElementById('languageSelect');
    const newLang = select.value;
    languageManager.setLanguage(newLang);
    
    // Update HTML lang attribute
    document.documentElement.lang = newLang;
    
    // Update UI translations
    ui.updateLanguage();
}

function toggleDarkMode() {
    if (ui && typeof ui.toggleDarkMode === 'function') {
        ui.toggleDarkMode();
    }
}

function toggleHighContrast() {
    if (accessibilityManager && typeof accessibilityManager.toggleHighContrastMode === 'function') {
        accessibilityManager.toggleHighContrastMode();
    }
}

function showKeyboardShortcuts() {
    if (keyboardShortcuts && typeof keyboardShortcuts.showKeyboardHelp === 'function') {
        keyboardShortcuts.showKeyboardHelp();
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize performance monitoring and memory management
    PerformanceUtils.init();
    
    // Set initial language and update HTML lang attribute
    const currentLang = languageManager.getCurrentLanguage();
    document.documentElement.lang = currentLang;
    document.getElementById('languageSelect').value = currentLang;
    
    // Update UI language
    ui.updateLanguage();
    
    // Render modals (needed globally)
    renderMaterialModal();
    renderViewReportModal();
    
    // Initialize only the active tab (Check Stock) on load
    renderCheckStockTab();
    tabsInitialized.check = true;
    
    // Initialize undo/redo buttons (lightweight operation)
    ui.updateUndoRedoButtons();
    
    // Setup drag and drop
    setupDragAndDrop();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('[Performance] Initial load complete - other tabs will load on demand');
});

// Cleanup on page unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
    PerformanceUtils.cleanup();
});

// Setup drag and drop functionality
function setupDragAndDrop() {
    const uploadBox = document.getElementById('uploadBox');
    const fileUpload = document.getElementById('fileUpload');
    const pasteBox = document.querySelector('.paste-box');
    const pasteAreaGroup = document.getElementById('pasteAreaGroup');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadBox.addEventListener(eventName, () => {
            uploadBox.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, () => {
            uploadBox.classList.remove('drag-over');
        }, false);
    });

    // Handle dropped files
    uploadBox.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            fileUpload.files = files;
            handleFileUpload({ target: { files: files } });
        }
    }, false);

    // Make upload box clickable
    uploadBox.addEventListener('click', () => {
        fileUpload.click();
    });

    // Paste box interaction
    pasteBox.addEventListener('click', () => {
        // Show the textarea
        pasteAreaGroup.style.display = 'block';
        
        // Scroll to textarea
        pasteAreaGroup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Focus on textarea
        setTimeout(() => {
            document.getElementById('inputData').focus();
        }, 300);
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const materialModal = document.getElementById('materialModal');
        const viewReportModal = document.getElementById('viewReportModal');
        
        // Escape key closes modals
        if (e.key === 'Escape') {
            if (materialModal.classList.contains('active')) {
                ui.closeMaterialModal();
            }
            if (viewReportModal.classList.contains('active')) {
                ui.closeViewReportModal();
            }
        }
        
        // Enter key saves material modal (when focused on inputs)
        if (e.key === 'Enter' && materialModal.classList.contains('active')) {
            const target = e.target;
            if (target.tagName === 'INPUT') {
                e.preventDefault();
                ui.saveMaterialModal();
            }
        }
    });
}
