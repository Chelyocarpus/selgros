// Main application initialization

// Make sure all modules are loaded before running
$(document).ready(function() {
    // Ensure window.events exists before proceeding
    if (!window.events) {
        console.error("Error: window.events is not defined. Check script loading order.");
        showErrorMessage("Application initialization failed. Please refresh the page.");
        return;
    }
    
    // Initialize the DataTable
    const table = window.tableModule.initializeDataTable();
    
    // Move Add Row button to custom position
    $('.add-row-button').appendTo('.add-button');
    
    // Initialize event handlers
    window.events.initializeEventHandlers(table);
    
    // Load data
    window.events.loadTableData(table);
    
    // Initialize all calculations
    window.calculations.initializeAllCalculations();
    
    // Update row counters
    window.tableModule.updateRowCounters(table);
    
    // Setup additional components
    setupButtons(table);
    
    // Initialize clipboard functionality
    initializeClipboard($('#sapTable'), {
        formatGermanNumber: window.utils.formatGermanNumber,
        parseGermanNumber: window.utils.parseGermanNumber,
        forceCalculateRow: window.calculations.forceCalculateRow,
        hasInputValues: window.tableModule.hasInputValues,
        updateStats: window.stats.updateStats,
        saveTableData: window.storage.saveTableData
    });

    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
});

// Helper function to show error message on the page
function showErrorMessage(message) {
    const errorDiv = $('<div class="ui negative message">')
        .append($('<div class="header">').text("Error"))
        .append($('<p>').text(message));
    
    $('.ui.container').prepend(errorDiv);
}

// Set up buttons
function setupButtons(table) {
    // Initialize backup functionality
    const backup = initializeBackup($('#sapTable'), { 
        saveTableData: window.storage.saveTableData 
    });
    
    // Add backup buttons to DataTables buttons
    const buttons = table.buttons();
    buttons.container().prepend(`
        <button class="ui button backup-btn">
            <i class="download icon"></i> Backup
        </button>
        <label class="ui button restore-btn">
            <i class="upload icon"></i> Restore
            <input type="file" accept=".json" style="display: none;">
        </label>
        <button class="ui negative button delete-all-button">
            <i class="trash icon"></i> Delete All
        </button>
    `);

    // Initialize PDF Import if available
    if (window.pdfImport) {
        // Add PDF import button
        buttons.container().prepend(`
            <label class="ui primary button pdf-import-btn">
                <i class="file pdf outline icon"></i> Import PDF
                <input type="file" accept=".pdf" style="display: none;">
            </label>
        `);
        
        // Add PDF import button handler with robust error handling
        $('.pdf-import-btn input').on('change', function(e) {
            if (e.target.files.length > 0) {
                try {
                    const file = e.target.files[0];
                    $(this).val(''); // Reset file input immediately
                    
                    showNotification(`Processing PDF: ${file.name}`, 'info');
                    
                    const pdfImporter = window.pdfImport.initializePdfImport(table);
                    
                    if (!window.pdfjsLib) {
                        showNotification('Loading PDF.js library, please wait...', 'info');
                    }
                    
                    pdfImporter.handlePdfFileSelect(file);
                } catch (error) {
                    console.error('PDF import error:', error);
                    showNotification(`PDF import error: ${error.message}. Please try again.`, 'error');
                }
            }
        });
    }

    // Add backup button handler
    $('.backup-btn').on('click', backup.downloadBackup);
    
    // Add restore button handler
    $('.restore-btn input').on('change', function(e) {
        if (e.target.files.length > 0) {
            if (confirm('This will override all current data. Are you sure?')) {
                handleRestore(e.target.files[0], table);
                $(this).val(''); // Reset file input
            }
        }
    });
    
    // Add delete all button handler
    $('.delete-all-button').on('click', function() {
        if (confirm('Are you sure you want to delete all rows? This cannot be undone.')) {
            table.clear().draw();
            localStorage.removeItem('tableData');
            window.stats.updateStats();
            window.tableModule.updateRowCounters(table);
        }
    });

    // Initialize reports
    const reports = initializeReports($('#sapTable'));
    
    // Add NR Report button
    buttons.container().append(`
        <button class="ui teal button nr-report-btn">
            <i class="file alternate outline icon"></i> NR Report
        </button>
    `);
    
    // Add NR Report button handler
    $('.nr-report-btn').on('click', reports.generateNRReport);
    
    // Initialize marketing reports
    const marketing = initializeMarketing($('#sapTable'));
    
    // Add Marketing Report button
    buttons.container().append(`
        <button class="ui blue button marketing-report-btn">
            <i class="chart bar outline icon"></i> Marketing Report
        </button>
    `);
    
    // Add Marketing Report button handler
    $('.marketing-report-btn').on('click', marketing.generateMarketingReport);
}

// Handle file restore
function handleRestore(file, table) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            // Parse the data first
            const fileData = JSON.parse(event.target.result);
            
            // Handle both old and new backup formats
            let parsedData;
            if (fileData.version && fileData.data) {
                // New format with version and timestamp
                parsedData = fileData.data;
            } else if (Array.isArray(fileData)) {
                // Old format (direct array)
                parsedData = fileData;
            } else {
                throw new Error('Invalid backup format');
            }

            if (!Array.isArray(parsedData)) {
                throw new Error('Backup data must be an array');
            }

            // Clean the data and fix German number format
            const cleanedData = parsedData.map(row => ({
                ...row,
                ek: row.ek.toString().replace(',', '.'),
                netto: row.netto.toString().replace(',', '.'),
                spanne: row.spanne ? row.spanne.toString().replace(',', '.') : '',
                brutto: row.brutto.toString().replace(',', '.')
            }));

            // Store and load the cleaned data
            localStorage.setItem('tableData', JSON.stringify(cleanedData));
            table.clear().draw();
            
            setTimeout(() => {
                window.events.loadTableData(table);
                window.calculations.initializeAllCalculations();
                window.stats.updateStats();
            }, 100);
            
        } catch (error) {
            console.error('Error restoring data:', error);
            alert('Error restoring backup file: ' + error.message);
        }
    };
    
    reader.onerror = function() {
        alert('Error reading backup file');
    };
    
    reader.readAsText(file);
}

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
    $(document).on('keydown', function(e) {
        // Check if Ctrl+Alt+N is pressed for adding a new row (normal mode)
        if (e.ctrlKey && e.altKey && e.key === 'n') {
            e.preventDefault();
            $('.add-row-button').trigger('click');
        }
        
        // Check if Ctrl+Alt+Shift+N is pressed for adding a new row (quick mode)
        if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'n') {
            e.preventDefault();
            // Simulate Shift+Click
            const event = jQuery.Event('click');
            event.shiftKey = true;
            $('.add-row-button').trigger(event);
        }
    });
}

// Helper function to show notifications
function showNotification(message, type) {
    const colors = {
        info: 'blue',
        error: 'red',
        success: 'green',
        warning: 'yellow'
    };
    
    const icons = {
        info: 'info circle',
        error: 'times circle',
        success: 'check circle',
        warning: 'exclamation triangle'
    };
    
    // Custom header based on type
    const header = type === 'error' ? 'Error' : 
                  type === 'warning' ? 'Warning' : 
                  type === 'success' ? 'Success' : 'Information';
    
    const notification = $(`
        <div class="ui ${colors[type]} message" style="position: fixed; top: 20px; right: 20px; z-index: 9999; width: 300px;">
            <i class="${icons[type]} icon"></i>
            <div class="content">
                <div class="header">${header}</div>
                <p>${message}</p>
            </div>
            <i class="close icon"></i>
        </div>
    `).appendTo('body');
    
    notification.find('.close.icon').on('click', function() {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    });
    
    // Auto close after delay, longer for error/warning
    const delay = (type === 'error' || type === 'warning') ? 8000 : 5000;
    setTimeout(() => {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    }, delay);
}
