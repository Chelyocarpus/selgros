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

    return {
        sap: $row.find('td:nth-child(3)').text(),
        article: $row.find('td:nth-child(4)').text(),
        stueck: $row.find('td:nth-child(5)').text(),
        ek: $row.find('td:nth-child(6)').text(),
        netto: $row.find('td:nth-child(7)').text(),
        brutto: $row.find('td:nth-child(8)').text(),
        verkauft: verkauft,
        schwund: schwund,
        rabbatiert: rabbatiert,
        rabattNetto: rabattNetto,  // Store as raw number without formatting
        rabattBrutto: rabattBrutto, // Also store the brutto value
        sumVerkauft: $row.find('.sumVerkauft').text(),
        sumRabbatiert: $row.find('.sumRabbatiert').text(),
        sumGesamt: $row.find('.sumGesamt').text(),
        sumProfit: $row.find('.sumProfit').text(),
        isEditing: $row.find('.edit-row').hasClass('save')
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
    
    table.rows().every(function() {
        const $row = $(this.node());
        const rowData = extractRowData($row);
        tableData.push(rowData);
    });

    saveDataToStorage(tableData);
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
