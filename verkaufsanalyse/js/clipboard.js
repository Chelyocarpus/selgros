// clipboard.js
function initializeClipboard($table, { formatGermanNumber, parseGermanNumber, forceCalculateRow, hasInputValues, updateStats, saveTableData }) {
    // Add clipboard paste handler
    $table.on('paste', 'td', function(e) {
        e.preventDefault();
        let clipboardData = e.originalEvent.clipboardData.getData('text');
        let row = $(this).closest('tr');
        let isEditing = row.find('.edit-row').hasClass('save');
        
        // Split by tab or multiple spaces
        let values = clipboardData.split(/[\t]+/);
        values = values.map(val => val.trim());
        
        if (values.length === 1) {
            // Handle single word paste
            let cellIndex = $(this).index();
            if (isEditing) {
                row.find(`td:nth-child(${cellIndex + 1}) input`).val(values[0]);
            } else {
                $(this).text(values[0]);
            }
        } else if (values.length >= 7) {
            // If row is in edit mode, update input values instead of text
            if (isEditing) {
                row.find('td:nth-child(2) input').val(values[0]); // SAP
                row.find('td:nth-child(3) input').val(values[1]); // Article
                row.find('td:nth-child(4) input').val(values[2]); // Stück
                row.find('td:nth-child(5) input').val(parseGermanNumber(values[3])); // EK
                row.find('td:nth-child(6) input').val(parseGermanNumber(values[4])); // Netto
                row.find('td:nth-child(7) input').val(values[5]); // Spanne
                row.find('td:nth-child(8) input').val(parseGermanNumber(values[6])); // Brutto
            } else {
                // Standard cell text update
                row.find('td:nth-child(2)').text(values[0]);
                row.find('td:nth-child(3)').text(values[1]);
                row.find('td:nth-child(4)').text(values[2]);
                row.find('td:nth-child(5)').text(formatGermanNumber(parseGermanNumber(values[3])));
                row.find('td:nth-child(6)').text(formatGermanNumber(parseGermanNumber(values[4])));
                row.find('td:nth-child(7)').text(values[5]);
                row.find('td:nth-child(8)').text(formatGermanNumber(parseGermanNumber(values[6])));
            }
            
            // Recalculate if there are existing values
            if (hasInputValues(row)) {
                forceCalculateRow(row);
                updateStats();
            }
            
            saveTableData();
        }
    });

    // Make cells clickable for paste
    $table.on('click', 'td:not(.actions-column):not(:has(input))', function() {
        // Visual feedback that cell is ready for paste
        $(this).addClass('ready-for-paste');
        
        // Remove highlight after a short delay
        setTimeout(() => {
            $(this).removeClass('ready-for-paste');
        }, 1000);
    });
}
