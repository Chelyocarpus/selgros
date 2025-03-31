// Event handlers and initialization

// Initialize all event handlers
function initializeEventHandlers(table) {
    // Initial pass to update all Rabatt Brutto values
    setTimeout(() => {
        $('#sapTable tbody tr').each(function() {
            const row = $(this);
            const rabattNettoInput = row.find('.rabatt-netto');
            if (rabattNettoInput.length) {
                const rabattNetto = window.utils.parseGermanNumber(rabattNettoInput.val()) || 0;
                const rabattBrutto = rabattNetto * 1.19;
                row.find('.rabatt-brutto').text(window.utils.formatGermanNumber(rabattBrutto));
            }
        });
    }, 500);

    // Handle edit row button
    $('#sapTable').on('click', '.edit-row', function() {
        let row = $(this).closest('tr');
        let icon = $(this);
        
        // If already in edit mode, save the changes
        if (icon.hasClass('save')) {
            window.rowEditor.saveRowChanges(row);
            return;
        }

        // Convert cells to input fields for editing
        window.rowEditor.setupRowForEditing(row);
    });

    // Handle delete row button with improved confirmation
    $('#sapTable').on('click', '.delete-row', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const row = $(this).closest('tr');
        const articleName = row.find('td:nth-child(5)').text().trim(); // Updated index
        const confirmMessage = articleName ? 
            `Are you sure you want to delete "${articleName}"?` : 
            'Are you sure you want to delete this row?';
            
        window.tableModule.showConfirmDialog(e, confirmMessage, (confirmed) => {
            if (confirmed) {
                let currentPage = table.page();
                
                // Remove row without redrawing
                table.row(row).remove();
                
                // Get info about table state after removal
                let pageInfo = table.page.info();
                let totalRows = pageInfo.recordsDisplay;
                let rowsPerPage = pageInfo.length;
                
                // Calculate what page we should be on after deletion
                let lastPage = Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1);
                let targetPage = Math.min(currentPage, lastPage);
                
                // Go to the calculated page and redraw
                table.page(targetPage).draw(false);
                
                window.storage.saveTableData();
                window.stats.updateStats();
                window.tableModule.updateRowCounters(table);
            }
        });
    });

    // Handle add row button
    $('.add-row-button').on('click', function(e) {
        // Check if Shift key is pressed for quick-add mode
        const quickAddMode = e.shiftKey;
        
        let currentPage = table.page();
        let newRow = $(window.tableModule.getNewRowHtml());
        
        // Add row and redraw maintaining current page
        table.row.add(newRow).draw(false);
        
        // Initialize the new row with possible auto-edit
        window.tableModule.initializeNewRow(newRow, !quickAddMode);
        
        // Go to the last page if we're not already there
        let pageInfo = table.page.info();
        if (currentPage !== pageInfo.pages - 1) {
            table.page('last').draw(false);
        }
        
        if (quickAddMode) {
            // Add a toast notification for quick add mode
            showQuickAddNotification();
        }
        
        window.storage.saveTableData();
        window.tableModule.updateRowCounters(table);
    });

    // Show a notification for quick add mode
    function showQuickAddNotification() {
        // Remove any existing notifications
        $('.quick-add-notification').remove();
        
        // Create notification
        const notification = $(`
            <div class="quick-add-notification">
                <div class="content">
                    <i class="info circle icon"></i>
                    Quick-add mode: Row added without auto-edit
                </div>
            </div>
        `).appendTo('body');
        
        // Position at the top of the page
        notification.css({
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 9999
        });
        
        // Auto-remove after a delay
        setTimeout(() => {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 2000);
    }

    // Show a notification for row movement
    function showRowMoveNotification(message) {
        // Remove any existing notifications
        $('.row-move-notification').remove();
        
        // Create notification
        const notification = $(`
            <div class="row-move-notification">
                <div class="content">
                    <i class="arrows alternate vertical icon"></i>
                    ${message}
                </div>
            </div>
        `).appendTo('body');
        
        // Position at the top of the page
        notification.css({
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 9999,
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        });
        
        // Auto-remove after a delay
        setTimeout(() => {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 2000);
    }

    // Add row reorder event handler
    table.on('row-reorder', function(e, diff, edit) {
        if (diff.length > 0) {
            const change = diff[0];
            const $movedRow = $(change.node);
            
            const fromPosition = parseInt($movedRow.find('td.counter-cell').text()) || 0;
            const targetNode = table.row(change.newPosition).node();
            const toPosition = parseInt($(targetNode).find('td.counter-cell').text()) || 0;
            
            // Handle row movement directly
            const nodes = table.rows().nodes().toArray();
            let fromRowIndex = -1, toRowIndex = -1;
            
            table.rows().every(function(rowIdx) {
                const position = parseInt($(this.node()).find('td.counter-cell').text()) || 0;
                if (position === fromPosition) fromRowIndex = rowIdx;
                if (position === toPosition) toRowIndex = rowIdx;
            });
            
            if (fromRowIndex !== -1 && toRowIndex !== -1) {
                const row = nodes.splice(fromRowIndex, 1)[0];
                nodes.splice(toRowIndex, 0, row);
                
                table.clear();
                nodes.forEach(node => table.row.add($(node)));
                table.draw();
                
                window.tableModule.updateRowCounters(table);
                window.storage.saveTableData();
                
                // Show move notification
                const articleName = $movedRow.find('td:nth-child(5)').text().trim(); // Updated index
                const message = articleName ? 
                    `Row "${articleName}" moved successfully` : 
                    'Row moved successfully';
                
                showRowMoveNotification(message);
            }
        }
    });

    // Handle number input changes - Fix for decimal comma entry
    $('#sapTable').on('input', '.number-input', function() {
        const input = $(this);
        const value = input.val();
        const isDecimalField = input.hasClass('rabatt-netto') || input.hasClass('rabatt-brutto');
        
        if (isDecimalField) {
            // For decimal fields, handle the comma/period input specially
            // Allow user to keep typing after comma without replacing it immediately
            if (value.includes(',')) {
                // Don't immediately replace comma during typing - let the user enter the full value
                return;
            }
            
            // Don't format during editing to allow proper decimal entry
            if (value === '' || value === '.' || value === ',') {
                // Allow empty field or just decimal point during editing
                return;
            }
        } else if (value === '' || isNaN(parseInt(value))) {
            // For integer fields, ensure it's a valid integer
            input.val('0');
        } else {
            // Keep what the user typed for integers
            input.val(parseInt(value));
        }
        
        let row = input.closest('tr');
        
        // Special handling for rabatt fields to auto-calculate
        if (input.hasClass('rabatt-netto') && parseFloat(input.val())) {
            const rabattNetto = window.utils.parseGermanNumber(input.val());
            const rabattBrutto = rabattNetto * 1.19;
            // Update the rabatt-brutto field with the formatted value
            row.find('.rabatt-brutto').text(window.utils.formatGermanNumber(rabattBrutto));
        } else if (input.hasClass('rabatt-brutto') && parseFloat(input.val())) {
            // Clear netto when brutto is manually entered
            row.find('.rabatt-netto').val('0.00');
        }
        
        // Validate input field when necessary
        if (!isNaN(parseFloat(value))) {
            if (!window.calculations.validateInputs(row, input)) {
                // Value was adjusted during validation
            } else if (window.tableModule.hasInputValues(row)) {
                // Calculate if there are valid input values
                window.calculations.calculateRow(row);
            } else {
                // Reset all sum fields to 0
                row.find('.sumVerkauft, .sumRabbatiert, .sumGesamt, .sumProfit').text('0.00 €');
                window.stats.updateStats();
            }
        }
        
        // Only save on valid numbers (don't save incomplete decimals)
        if (!isNaN(parseFloat(value))) {
            window.storage.saveTableData();
        }
    });

    // Add separate handler for blur events to format decimal numbers properly
    $('#sapTable').on('blur', '.rabatt-netto, .rabatt-brutto', function() {
        const input = $(this);
        const value = input.val();
        
        // On blur, normalize comma to period and format the decimal
        if (value === '' || value === '.' || value === ',') {
            input.val('0.00');
        } else {
            // Convert comma to period for calculation
            const normalizedValue = value.replace(',', '.');
            const numValue = parseFloat(normalizedValue) || 0;
            input.val(numValue.toFixed(2));
        }
        
        // Special handling for netto/brutto calculations
        if (input.hasClass('rabatt-netto') && parseFloat(input.val())) {
            const rabattNetto = parseFloat(input.val());
            const rabattBrutto = rabattNetto * 1.19;
            const row = input.closest('tr');
            row.find('.rabatt-brutto').val(rabattBrutto.toFixed(2));
        }
        
        // Recalculate and save
        const row = input.closest('tr');
        window.calculations.calculateRow(row);
        window.storage.saveTableData();
    });

    // Handle multi-column sorting with Shift+Click
    $('#sapTable thead th').on('click', function(e) {
        if (!e.shiftKey) {
            $('#sapTable thead th').not(this).removeClass('sorting_asc sorting_desc');
        }
    });

    // Add debounced handler for input changes with improved error handling
    const debouncedHandler = window.utils.debounce(function(e) {
        try {
            // Ensure 'this' is a valid DOM element
            if (!this || !this.nodeName) {
                console.error('Invalid element in debounced handler');
                return;
            }
            
            const input = $(this);
            if (!input.length) {
                console.error('jQuery could not find the element');
                return;
            }
            
            // Check if input is still in the DOM (might have been removed)
            if (!$.contains(document.documentElement, this)) {
                console.error('Element is no longer in the DOM');
                return;
            }
            
            // Handle different input types
            const isDecimalField = input.hasClass('rabatt-netto') || input.hasClass('rabatt-brutto');
            const currentValue = isDecimalField ? 
                parseFloat(input.val() || 0) : 
                parseInt(input.val() || 0);
            
            // Always force a valid number
            input.val(currentValue);
            
            const row = input.closest('tr');
            if (!row.length) {
                console.error('Could not find parent row');
                return;
            }
            
            window.calculations.calculateRow(row);
            window.storage.saveTableData();
        } catch (e) {
            console.error('Error in debounced handler:', e);
        }
    }, 100);

    // Use event delegation with a more reliable selector
    $('#sapTable').on('change input blur', '.number-input', debouncedHandler);

    // Table draw event - update counters and recalculate
    table.on('draw.dt', function() {
        window.tableModule.updateRowCounters(table);
        window.calculations.initializeAllCalculations();
    });

    // New handler specifically for currency inputs - simplify to only handle netto
    $('#sapTable').on('input', '.currency-input', function(e) {
        const input = $(this);
        if (input.attr('readonly')) { return; } // Skip readonly fields
        
        let value = input.val();
        
        // Allow empty input during typing
        if (!value) { return; }
        
        // Filter to only allow digits, comma and period
        const filteredValue = value.replace(/[^\d,\.]/g, '');
        if (filteredValue !== value) {
            input.val(filteredValue);
            value = filteredValue;
        }
        
        // If this is Rabatt Netto, immediately update Rabatt Brutto
        if (input.hasClass('rabatt-netto')) {
            const row = input.closest('tr');
            // Only try to parse and calculate if we have a valid input
            if (value && value !== ',' && value !== '.') {
                const nettoValue = window.utils.parseGermanNumber(value);
                const bruttoValue = nettoValue * 1.19;
                // Update the text of rabatt-brutto calculated field
                row.find('.rabatt-brutto').text(window.utils.formatGermanNumber(bruttoValue));
            }
        }
    });

    // Add blur handler to format currency inputs properly and auto-calculate brutto
    $('#sapTable').on('blur', '.currency-input', function() {
        const input = $(this);
        if (input.attr('readonly')) { return; } // Skip readonly fields
        
        const value = input.val();
        const row = input.closest('tr');
        
        // Format properly when leaving the field
        if (!value || value === ',' || value === '.') {
            input.val('0,00');
        } else {
            // Remove any € symbol if present in the value before parsing
            const cleanValue = value.replace(/€/g, '').trim();
            const numValue = window.utils.parseGermanNumber(cleanValue);
            input.val(window.utils.formatGermanNumber(numValue));
            
            // Auto-calculate Rabatt Brutto when Rabatt Netto changes
            if (input.hasClass('rabatt-netto')) {
                const bruttoValue = numValue * 1.19;
                // Update the text of rabatt-brutto calculated field
                row.find('.rabatt-brutto').text(window.utils.formatGermanNumber(bruttoValue));
            }
        }
        
        // Always recalculate on blur
        window.calculations.calculateRow(row);
        window.storage.saveTableData();
    });

    // Remove the old event handler and add a new one just for regular number inputs
    $('#sapTable').on('input', '.number-input', function() {
        const input = $(this);
        const value = input.val();
        
        // Handle integer-only fields
        if (value === '' || isNaN(parseInt(value))) {
            input.val('0');
        } else {
            input.val(parseInt(value));
        }
        
        let row = input.closest('tr');
        
        // Validate inputs
        if (!window.calculations.validateInputs(row, input)) {
            // Value was adjusted during validation
        } else if (window.tableModule.hasInputValues(row)) {
            // Calculate if there are valid input values
            window.calculations.calculateRow(row);
        } else {
            // Reset all sum fields to 0
            row.find('.sumVerkauft, .sumRabbatiert, .sumGesamt, .sumProfit').text('0,00 €');
            window.stats.updateStats();
        }
        
        window.storage.saveTableData();
    });
}

// Load data into table
function loadTableData(table) {
    try {
        const tableData = window.storage.parseStoredData();
        
        // If no saved data, just initialize empty table
        if (!tableData) {
            table.clear().draw();
            window.stats.updateStats();
            return;
        }

        // Clear table first
        table.clear();
        
        if (tableData.length === 0) {
            // Add one empty row for new tables
            const newRow = $(window.tableModule.getNewRowHtml());
            // Remove highlight class immediately for loaded rows
            newRow.removeClass('new-row-highlight');
            table.row.add(newRow).draw();
        } else {
            // Add saved rows without drawing after each row
            tableData.forEach(rowData => {
                const newRow = $(window.tableModule.getNewRowHtml());
                // Remove highlight class immediately for loaded rows
                newRow.removeClass('new-row-highlight');
                populateRowFromData(newRow, rowData);
                table.row.add(newRow);
            });
            
            // Draw once after all rows have been added
            table.draw();
        }
        
        window.calculations.initializeAllCalculations();
        window.stats.updateStats();
        
    } catch (e) {
        console.error('Error loading data:', e);
        // Recover by initializing empty table
        table.clear();
        const newRow = $(window.tableModule.getNewRowHtml());
        // Remove highlight class immediately for loaded rows
        newRow.removeClass('new-row-highlight');
        table.row.add(newRow).draw();
        window.stats.updateStats();
    }
}

// Helper function to populate a row from data
function populateRowFromData(newRow, rowData) {
    if (rowData.isEditing) {
        setupEditingRow(newRow, rowData);
    } else {
        setupNormalRow(newRow, rowData);
    }

    // Set input values
    setInputValues(newRow, rowData);
}

// Setup a row in editing mode
function setupEditingRow(newRow, rowData) {
    const cells = newRow.find('td');
    for (let i = 2; i < 9; i++) { // Updated upper limit to include brutto
        let cell = $(cells[i]);
        let value = '';
        
        switch(i) {
            case 2: value = rowData.sap; break;
            case 3: value = rowData.newColumn; break; // New column
            case 4: value = rowData.article; break;
            case 5: value = rowData.stueck; break;
            case 6: value = rowData.ek; break;
            case 7: value = rowData.netto; break;
            case 8: value = rowData.brutto; break;
        }
        
        let input = $('<input>')
            .val(value)
            .addClass('ui input')
            .css('width', '100%');

        if (i === 5) { // Updated index for Stück
            input.attr('type', 'number').attr('min', '0');
        } else if (i === 6 || i === 7) { // Updated indices for EK and Netto
            input.attr('type', 'number').attr('step', '0.01');
        }

        cell.html(input);
    }
    
    // Change edit icon to save icon
    newRow.find('.edit-row')
        .removeClass('edit outline')
        .addClass('save')
        .attr('title', 'Save changes');
}

// Setup a normal row
function setupNormalRow(newRow, rowData) {
    newRow.find('td:nth-child(3)').text(rowData.sap || '');
    newRow.find('td:nth-child(4)').text(rowData.newColumn || '');
    newRow.find('td:nth-child(5)').text(rowData.article || '');
    newRow.find('td:nth-child(6)').text(rowData.stueck || '0');
    newRow.find('td:nth-child(7)').text(rowData.ek || '0,00');
    newRow.find('td:nth-child(8)').text(rowData.netto || '0,00');
    newRow.find('td:nth-child(9)').text(rowData.brutto || '0,00');
}

// Set input values on a row
function setInputValues(newRow, rowData) {
    // For fields that are non-editable and set by text:
    newRow.find('td:nth-child(3)').text(rowData.sap || '');
    // Set new column value
    newRow.find('td:nth-child(4)').text(rowData.newColumn || '');
    newRow.find('td:nth-child(5)').text(rowData.article || '');
    newRow.find('td:nth-child(6)').text(rowData.stueck || '0');
    newRow.find('td:nth-child(7)').text(rowData.ek || '0,00');
    newRow.find('td:nth-child(8)').text(rowData.netto || '0,00');
    newRow.find('td:nth-child(9)').text(rowData.brutto || '0,00');
    
    // For integer-only fields
    newRow.find('.verkauft').val(rowData.verkauft !== undefined ? rowData.verkauft : '0');
    newRow.find('.schwund').val(rowData.schwund !== undefined ? rowData.schwund : '0');
    newRow.find('.rabbatiert').val(rowData.rabbatiert !== undefined ? rowData.rabbatiert : '0');
    
    // Handle rabattNetto value based on its type and existence
    let rabattNetto;
    if (rowData.rabattNetto !== undefined) {
        // Handle both string and numeric formats
        if (typeof rowData.rabattNetto === 'string' && rowData.rabattNetto.trim() !== '') {
            rabattNetto = window.utils.formatGermanNumber(window.utils.parseGermanNumber(rowData.rabattNetto));
        } else if (typeof rowData.rabattNetto === 'number' && rowData.rabattNetto > 0) {
            rabattNetto = window.utils.formatGermanNumber(rowData.rabattNetto);
        } else {
            rabattNetto = '0,00';
        }
    } else {
        rabattNetto = '0,00';
    }
    
    // Set the formatted rabattNetto
    newRow.find('.rabatt-netto').val(rabattNetto);
    
    // Calculate and set Rabatt Brutto based on Netto - always format properly
    const nettoValue = window.utils.parseGermanNumber(rabattNetto);
    const bruttoValue = nettoValue * 1.19;
    
    // Set the text content of the rabatt-brutto cell
    newRow.find('.rabatt-brutto').text(window.utils.formatGermanNumber(bruttoValue));
    
    // Set calculated values - don't include € symbol in the text
    const sumVerkauft = rowData.sumVerkauft ? rowData.sumVerkauft.replace(/€/g, '').trim() : '0,00';
    const sumRabbatiert = rowData.sumRabbatiert ? rowData.sumRabbatiert.replace(/€/g, '').trim() : '0,00';
    const sumGesamt = rowData.sumGesamt ? rowData.sumGesamt.replace(/€/g, '').trim() : '0,00';
    const sumProfit = rowData.sumProfit ? rowData.sumProfit.replace(/€/g, '').trim() : '0,00';
    
    newRow.find('.sumVerkauft').text(sumVerkauft);
    newRow.find('.sumRabbatiert').text(sumRabbatiert);
    newRow.find('.sumGesamt').text(sumGesamt);
    newRow.find('.sumProfit').text(sumProfit);
}

// Trigger input calculations
function triggerInputCalculations(newRow, rowData) {
    try {
        const inputs = {
            verkauft: rowData.verkauft,
            schwund: rowData.schwund,
            rabbatiert: rowData.rabbatiert,
            rabattNetto: rowData.rabattNetto,
            rabattBrutto: rowData.rabattBrutto
        };

        // Handle regular number inputs first
        ['verkauft', 'schwund', 'rabbatiert'].forEach(key => {
            const input = newRow.find(`.${key}`);
            if (input.length) {
                const numValue = parseInt(inputs[key]) || 0;
                input.val(numValue);
            }
        });
        
        // Then handle decimal inputs with proper decimal places
        ['rabattNetto', 'rabattBrutto'].forEach(key => {
            const className = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            const input = newRow.find(`.${className}`);
            if (input.length) {
                const numValue = parseFloat(inputs[key]) || 0;
                input.val(numValue.toFixed(2)); // Format to 2 decimal places
            }
        });
        
        // Directly recalculate instead of triggering event
        if (window.tableModule.hasInputValues(newRow)) {
            window.calculations.forceCalculateRow(newRow);
        }
    } catch (e) {
        console.error('Error triggering calculations:', e);
    }
}

// Export event and initialization functions
window.events = {
    initializeEventHandlers,
    loadTableData
};
