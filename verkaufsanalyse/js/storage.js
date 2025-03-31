// Functions for data persistence

// Extract data from a row
function extractRowData($row) {
    // Integer values
    const verkauft = parseInt($row.find('.verkauft').val()) || 0;
    const schwund = parseInt($row.find('.schwund').val()) || 0;
    const rabbatiert = parseInt($row.find('.rabbatiert').val()) || 0;
    
    // Get Rabatt Netto value
    const rabattNettoEl = $row.find('.rabatt-netto');
    const rabattNetto = rabattNettoEl.length ? window.utils.parseGermanNumber(rabattNettoEl.val()) : 0;
    
    // Get Rabatt Brutto value - even though it's calculated from Netto, store the actual displayed value
    const rabattBruttoEl = $row.find('.rabatt-brutto');
    const rabattBrutto = rabattBruttoEl.length ? window.utils.parseGermanNumber(rabattBruttoEl.text()) : 0;

    // Get the row position/index from the counter cell with additional validation
    const rowPositionRaw = $row.find('td.counter-cell').text();
    const rowPosition = parseInt(rowPositionRaw) || 0;
    
    if (rowPosition === 0 && rowPositionRaw.trim() !== '0') {
        console.warn('Invalid row position found:', rowPositionRaw, 'Using default 0');
    }
    
    console.log(`Extracted row position ${rowPosition} for article: ${$row.find('td:nth-child(5)').text().trim()}`);

    return {
        sap: $row.find('td:nth-child(3)').text(),
        newColumn: $row.find('td:nth-child(4)').text(), // Add new column
        article: $row.find('td:nth-child(5)').text(), // Updated index
        stueck: $row.find('td:nth-child(6)').text(), // Updated index
        ek: $row.find('td:nth-child(7)').text(), // Updated index
        netto: $row.find('td:nth-child(8)').text(), // Updated index
        brutto: $row.find('td:nth-child(9)').text(), // Updated index
        verkauft: verkauft,
        schwund: schwund,
        rabbatiert: rabbatiert,
        rabattNetto: rabattNetto,  // Store as raw number without formatting
        rabattBrutto: rabattBrutto, // Also store the brutto value
        sumVerkauft: $row.find('.sumVerkauft').text(),
        sumRabbatiert: $row.find('.sumRabbatiert').text(),
        sumGesamt: $row.find('.sumGesamt').text(),
        sumProfit: $row.find('.sumProfit').text(),
        isEditing: $row.find('.edit-row').hasClass('save'),
        rowPosition: rowPosition // Store the position for reordering
    };
}

// Save data to localStorage
function saveDataToStorage(data) {
    try {
        localStorage.setItem('tableData', JSON.stringify(data));
        console.log('Data saved:', data);
        return true;
    } catch (e) {
        console.error('Error saving data:', e);
        return false;
    }
}

// Save all table data
function saveTableData() {
    const tableData = [];
    const table = $('#sapTable').DataTable();
    
    console.group('Saving Table Data');
    console.log('Starting to extract row data from table...');
    
    const positions = [];
    
    table.rows().every(function() {
        const $row = $(this.node());
        const rowData = extractRowData($row);
        positions.push(rowData.rowPosition);
        tableData.push(rowData);
    });
    
    console.log('Raw positions before sorting:', positions);
    
    // Check if positions are unique and sequential
    const uniquePositions = [...new Set(positions)].sort((a, b) => a - b);
    if (uniquePositions.length !== positions.length) {
        console.warn('Warning: Duplicate positions found!', {
            positions: positions,
            unique: uniquePositions
        });
    }
    
    // Check if positions are sequential
    const isSequential = uniquePositions.every((pos, idx) => 
        idx === 0 || pos === uniquePositions[idx-1] + 1
    );
    
    if (!isSequential) {
        console.warn('Warning: Positions are not sequential!', uniquePositions);
    }

    // Sort the data by row position before saving
    console.log('Sorting table data by position...');
    tableData.sort((a, b) => {
        console.log(`Comparing: ${a.article} (${a.rowPosition}) with ${b.article} (${b.rowPosition})`);
        return (a.rowPosition || 0) - (b.rowPosition || 0);
    });
    
    console.log('Final sorted positions:', tableData.map(item => ({
        article: item.article,
        position: item.rowPosition
    })));

    saveDataToStorage(tableData);
    console.groupEnd();
}

// Parse stored data from localStorage
function parseStoredData() {
    const savedData = localStorage.getItem('tableData');
    if (!savedData) return null;

    try {
        const parsedData = JSON.parse(savedData);
        if (!Array.isArray(parsedData)) {
            console.error('Invalid data format: not an array');
            return [];
        }
        return parsedData;
    } catch (e) {
        console.error('Invalid data format:', e);
        return [];
    }
}

// Export storage functions
window.storage = {
    saveTableData,
    parseStoredData,
    extractRowData
};
