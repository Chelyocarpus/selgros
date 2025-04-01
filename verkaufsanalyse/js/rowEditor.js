// Functions for row editing operations

// Set up a row for editing
function setupRowForEditing(row) {
    try {
        let cells = row.find('td');
        if (!cells.length) return;

        // Skip action and counter columns
        for (let i = 2; i < 9; i++) { // Extend to include through brutto at position 9
            if (i < cells.length) {
                setupCellForEditing(cells.eq(i), i, cells);
            }
        }
        
        // Store current rabatt values to restore them later
        const rabattNettoInput = row.find('.rabatt-netto');
        const rabattBruttoInput = row.find('.rabatt-brutto');
        
        const rabattNettoValue = rabattNettoInput.length ? rabattNettoInput.val() : '0,00';
        const rabattBruttoValue = rabattBruttoInput.length ? rabattBruttoInput.val() : '0,00';
        
        // Store these values as data attributes on the row for later retrieval
        row.data('rabattNetto', rabattNettoValue);
        row.data('rabattBrutto', rabattBruttoValue);
        
        // Also store if brutto was manually entered
        if (window.utils.parseGermanNumber(rabattBruttoValue) > 0 && 
            window.utils.parseGermanNumber(rabattNettoValue) === 0) {
            row.data('manual-brutto', true);
        } else {
            row.removeData('manual-brutto');
        }

        // Change edit icon to save icon
        row.find('.edit-row')
            .removeClass('edit outline')
            .addClass('save')
            .attr('title', 'Save changes');
    } catch (e) {
        console.error('Error setting up row for editing:', e);
    }
}

// Set up a cell for editing
function setupCellForEditing(cell, index, allCells) {
    let currentValue = cell.text();
    
    // Parse value if it's a number field - Only parse Price fields (not Stück)
    if (index === 6 || index === 7 || index === 8 || index === 13 || index === 14) { // EK, Netto, Brutto, Rabatt Netto, Rabatt Brutto
        currentValue = window.utils.parseGermanNumber(currentValue);
    }
    
    // Skip creating input for Brutto - just show text
    if (index === 8) { // Brutto
        cell.html(`<span class="calculated-field">${currentValue}</span>`);
        return;
    }
    
    // Create input field
    let input = createInputForCell(cell, index, currentValue, allCells);
    cell.html(input);
}

// Create an input for a cell - enforce SAP-Nr length and consistent input styling
function createInputForCell(cell, index, value, allCells) {
    let input = $('<input>')
        .val(value)
        .addClass('ui input')
        .css({
            'width': '100%',
            'height': '32px', // Consistent height
            'vertical-align': 'middle'
        })
        .on('change keyup', function() {
            handleCellInputChange($(this), index, allCells);
        });

    // Set appropriate size constraints based on column
    if (index === 2) { // SAP-Nr
        input.attr('maxlength', '6') // Limit to 6 digits
             .attr('type', 'text')   // Changed from 'number' to 'text' to allow leading zeros
             .css('width', '60px');  // Width appropriate for 6 digits
        return input;
    } else if (index === 5) { // Stück - index 5 is now column 6 in the table
        input.attr('type', 'number').attr('min', '0');
        return input;
    } else if (index === 6 || index === 7) { // EK, Netto
        input.attr('type', 'text').attr('inputmode', 'decimal')
             .css('text-align', 'right')  // Ensure right alignment
             .addClass('cell-currency-input');
        
        // Just return the input directly without the Euro symbol container
        return input;
    }

    return input;
}

// Handle cell input change
function handleCellInputChange(input, index, cells) {
    // Format decimal inputs properly
    if (index === 6 || index === 7) { // EK or Netto
        const value = input.val();
        
        // Allow typing, but handle formatting on blur
        input.on('blur', function() {
            if (!value || value === ',' || value === '.') {
                input.val('0,00');
            } else {
                // Remove any € symbol if present before parsing
                const cleanValue = value.replace('€', '').trim();
                const numValue = window.utils.parseGermanNumber(cleanValue);
                input.val(window.utils.formatGermanNumber(numValue));
            }
        });
        
        // Only proceed if we have a valid number
        const netto = window.utils.parseGermanNumber(cells.eq(7).find('input').val());
        
        // Update Brutto text immediately when Netto changes
        if (index === 7 && !isNaN(netto)) { // Only when Netto field changes
            const brutto = window.utils.calculateBrutto(netto);
            cells.eq(8).find('.calculated-field').text(window.utils.formatGermanNumber(brutto));
        }

        // Trigger recalculation of sales and profits
        const row = input.closest('tr');
        window.calculations.forceCalculateRow(row);
        window.stats.updateStats();
    }

    window.storage.saveTableData();
}

// Save row changes
function saveRowChanges(row) {
    try {
        let cells = row.find('td');
        if (!cells.length) return;
        
        // Save input values back to cells
        for (let i = 2; i < 9 && i < cells.length; i++) {
            let cell = $(cells[i]);
            
            // Handle calculated fields differently
            if (i === 8) { // Brutto
                let calculatedField = cell.find('.calculated-field');
                if (calculatedField.length) {
                    let value = calculatedField.text();
                    cell.html(value);
                }
                continue;
            }
            
            let input = cell.find('input');
            if (!input.length) continue;
            
            let value = input.val();
            
            // Format numbers with German number format - only for price fields
            if (i === 6 || i === 7) { // EK, Netto
                value = window.utils.formatGermanNumber(window.utils.parseGermanNumber(value));
            }
            
            cell.html(value);
        }
        
        // Restore rabatt values from data attributes
        const rabattNettoValue = row.data('rabattNetto') || '0,00';
        const rabattNettoInput = row.find('.rabatt-netto');
        
        if (rabattNettoInput.length) {
            rabattNettoInput.val(rabattNettoValue);
            
            // Calculate and update Rabatt Brutto
            const rabattNetto = window.utils.parseGermanNumber(rabattNettoValue);
            const rabattBrutto = rabattNetto * 1.19;
            row.find('.rabatt-brutto').text(window.utils.formatGermanNumber(rabattBrutto));
        }
        
        const rabattBruttoValue = row.data('rabattBrutto') || '0,00';
        const manualBrutto = row.data('manual-brutto') || false;
        
        const rabattBruttoInput = row.find('.rabatt-brutto');
        if (rabattBruttoInput.length) {
            rabattBruttoInput.val(rabattBruttoValue);
        }
        
        // Clean up temporary data
        row.removeData('rabattNetto');
        row.removeData('rabattBrutto');
        
        // Keep the manual-brutto flag if it was set
        if (!manualBrutto) {
            row.removeData('manual-brutto');
        }
        
        // Update Brutto after saving Netto
        if (cells.length > 8) {
            const nettoCell = cells.eq(7);
            const bruttoCell = cells.eq(8);
            if (nettoCell.length && bruttoCell.length) {
                const netto = window.utils.parseGermanNumber(nettoCell.text());
                bruttoCell.text(window.utils.formatGermanNumber(window.utils.calculateBrutto(netto))); // Brutto
            }
        }

        // Restore edit icon
        row.find('.edit-row')
            .removeClass('save')
            .addClass('edit outline')
            .attr('title', 'Edit row');
            
        // Force recalculation after saving prices
        window.calculations.forceCalculateRow(row);
        window.stats.updateStats();
        window.storage.saveTableData();
    } catch (e) {
        console.error('Error saving row changes:', e);
        // Restore edit icon in case of error
        row.find('.edit-row')
            .removeClass('save')
            .addClass('edit outline')
            .attr('title', 'Edit row');
    }
}

// Export row editor functions
window.rowEditor = {
    setupRowForEditing,
    saveRowChanges
};
