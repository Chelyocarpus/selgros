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
    
    // Add button container for better organization
    const buttonsContainer = table.buttons().container();
    
    // Clear existing buttons before adding new structure
    buttonsContainer.empty();
    
    // Create a wrapper div for all button groups
    const buttonGroupsWrapper = $('<div class="all-button-groups"></div>');
    buttonsContainer.append(buttonGroupsWrapper);
    
    // Create button groups with consistent class naming
    const importGroup = $('<div class="button-group-container"></div>');
    const dataGroup = $('<div class="button-group-container"></div>');
    const reportGroup = $('<div class="button-group-container"></div>');
    const exportGroup = $('<div class="button-group-container"></div>');
    
    // Add group headers for clearer organization
    importGroup.append('<div class="group-label">Import</div>');
    dataGroup.append('<div class="group-label">Data</div>');
    reportGroup.append('<div class="group-label">Reports</div>');
    exportGroup.append('<div class="group-label">Export</div>');
    
    // Create button containers inside each group
    const importButtons = $('<div class="button-container"></div>').appendTo(importGroup);
    const dataButtons = $('<div class="button-container"></div>').appendTo(dataGroup);
    const reportButtons = $('<div class="button-container"></div>').appendTo(reportGroup);
    const exportButtons = $('<div class="button-container"></div>').appendTo(exportGroup);
    
    // Add Import buttons
    if (window.pdfImport) {
        importButtons.append(`
            <label class="ui primary button pdf-import-btn">
                <i class="file pdf outline icon"></i> PDF
                <input type="file" accept=".pdf" style="display: none;">
            </label>
        `);
    }
    
    importButtons.append(`
        <label class="ui orange button supplier-import-btn">
            <i class="file alternate outline icon"></i> Lieferantenartikelnr.
            <input type="file" accept=".mhtml,.htm,.html" style="display: none;">
        </label>
    `);
    
    // Add Data management buttons
    dataButtons.append(`
        <button class="ui button backup-btn">
            <i class="download icon"></i> Backup
        </button>
        <label class="ui button restore-btn">
            <i class="upload icon"></i> Restore
            <input type="file" accept=".json" style="display: none;">
        </label>
        <button class="ui negative button delete-all-button">
            <i class="trash icon"></i> Delete
        </button>
    `);
    
    // Add Report buttons
    reportButtons.append(`
        <button class="ui teal button nr-report-btn">
            <i class="file alternate outline icon"></i> NR Report
        </button>
        <button class="ui blue button marketing-report-btn">
            <i class="chart bar outline icon"></i> Marketing
        </button>
    `);
    
    // Add Export buttons
    exportButtons.append(`
        <button class="ui button copy-btn">
            <i class="copy icon"></i> Copy
        </button>
        <button class="ui button excel-btn">
            <i class="file excel outline icon"></i> Excel
        </button>
        <button class="ui button print-btn">
            <i class="print icon"></i> Print
        </button>
    `);
    
    // Add all groups to the wrapper
    buttonGroupsWrapper.append(importGroup);
    buttonGroupsWrapper.append(dataGroup);
    buttonGroupsWrapper.append(reportGroup);
    buttonGroupsWrapper.append(exportGroup);
    
    // Add PDF import button handler
    if (window.pdfImport) {
        $('.pdf-import-btn input').on('change', function(e) {
            if (e.target.files.length > 0) {
                try {
                    const file = e.target.files[0];
                    $(this).val(''); // Reset file input immediately
                    
                    // Clear any existing notifications first
                    $('.ui.message[style*="position: fixed"]').remove();
                    $('.pdf-import-status').remove();
                    
                    showNotification(`Processing PDF: ${file.name}`, 'info');
                    
                    // Check if PDF.js is loaded
                    if (!window.pdfjsLib) {
                        showNotification('PDF.js library not loaded. Please refresh the page.', 'error');
                        return;
                    }
                    
                    // Initialize PDF importer with current table
                    const pdfImporter = window.pdfImport.initializePdfImport(table);
                    
                    // Handle the file
                    pdfImporter.handlePdfFileSelect(file);
                } catch (error) {
                    console.error('PDF import error:', error);
                    showNotification(`PDF import error: ${error.message}. Please try again.`, 'error');
                }
            }
        });
    }
    
    // Add Supplier Import button handler
    $('.supplier-import-btn input').on('change', function(e) {
        if (e.target.files.length > 0) {
            try {
                const file = e.target.files[0];
                $(this).val(''); // Reset file input immediately
                
                showNotification(`Processing supplier file: ${file.name}`, 'info');
                
                if (window.supplierMapper) {
                    window.supplierMapper.handleSupplierFileImport(file, table);
                } else {
                    showNotification('Supplier mapper module not loaded.', 'error');
                }
            } catch (error) {
                console.error('Supplier import error:', error);
                showNotification(`Supplier import error: ${error.message}. Please try again.`, 'error');
            }
        }
    });

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

    // Connect export buttons to DataTables buttons
    $('.copy-btn').on('click', function() {
        table.button('copy').trigger();
    });
    
    $('.excel-btn').on('click', function() {
        table.button('excel').trigger();
    });
    
    $('.print-btn').on('click', function() {
        table.button('print').trigger();
    });

    // Initialize reports
    const reports = initializeReports($('#sapTable'));
    
    // Add NR Report button handler
    $('.nr-report-btn').on('click', reports.generateNRReport);
    
    // Initialize marketing reports
    const marketing = initializeMarketing($('#sapTable'));
    
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

            // Clear existing table data
            table.clear();

            // Add rows from backup - rebuild each row fully with proper input initialization
            parsedData.forEach(rowData => {
                // Create a new row with our template
                const newRow = $(window.tableModule.getNewRowHtml());
                
                // Set basic text fields
                newRow.find('td.counter-cell').text(rowData.index || rowData.position || '');
                newRow.find('td:nth-child(3)').text(rowData.sap || '');
                newRow.find('td:nth-child(4)').text(rowData.newColumn || '');
                newRow.find('td:nth-child(5)').text(rowData.article || '');
                newRow.find('td:nth-child(6)').text(rowData.stueck || '0');
                newRow.find('td:nth-child(7)').text(rowData.ek || '0,00');
                newRow.find('td:nth-child(8)').text(rowData.netto || '0,00');
                newRow.find('td:nth-child(9)').text(rowData.brutto || '0,00');
                
                // Set number input values - ensure they're parsed as integers
                newRow.find('.verkauft').val(parseInt(rowData.verkauft) || 0);
                newRow.find('.schwund').val(parseInt(rowData.schwund) || 0);
                newRow.find('.rabbatiert').val(parseInt(rowData.rabbatiert) || 0);
                
                // Handle rabattNetto properly - could be number or string
                let rabattNettoValue;
                if (typeof rowData.rabattNetto === 'number') {
                    rabattNettoValue = window.utils.formatGermanNumber(rowData.rabattNetto);
                } else if (typeof rowData.rabattNetto === 'string') {
                    // Try to parse as number and then format
                    const parsed = window.utils.parseGermanNumber(rowData.rabattNetto);
                    rabattNettoValue = window.utils.formatGermanNumber(parsed);
                } else {
                    rabattNettoValue = '0,00';
                }
                newRow.find('.rabatt-netto').val(rabattNettoValue);
                
                // Set the calculated rabattBrutto based on rabattNetto
                const rabattNetto = window.utils.parseGermanNumber(rabattNettoValue);
                const rabattBrutto = rabattNetto * 1.19;
                newRow.find('.rabatt-brutto').text(window.utils.formatGermanNumber(rabattBrutto));
                
                // Set calculated fields - ensure German formatting
                newRow.find('.sumVerkauft').text(rowData.sumVerkauft || '0,00');
                newRow.find('.sumRabbatiert').text(rowData.sumRabbatiert || '0,00');
                newRow.find('.sumGesamt').text(rowData.sumGesamt || '0,00');
                newRow.find('.sumProfit').text(rowData.sumProfit || '0,00');
                
                // Add the row to the table
                table.row.add(newRow);
            });
            
            // Draw the table once after all rows are added
            table.draw();
            
            // Recalculate all rows and update stats
            window.calculations.initializeAllCalculations();
            window.stats.updateStats();
            window.tableModule.updateRowCounters(table);
            window.storage.saveTableData();
            
            showNotification('Backup restored successfully!', 'success');
        } catch (error) {
            console.error('Error restoring backup:', error);
            showNotification(`Error restoring backup: ${error.message}`, 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification('Error reading backup file', 'error');
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
    // Remove any existing notifications to prevent duplicates
    $('.ui.message[style*="position: fixed"]').remove();
    $('.pdf-import-status').remove();
    
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
