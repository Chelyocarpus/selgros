// Functions for row and statistics calculations

// Calculate values for a row
function calculateRowValues(inputs, bruttoPrice, ekPrice) {
    const sumVerkauft = inputs.verkauft * bruttoPrice;
    
    // Use rabattBrutto (which is always calculated from rabattNetto)
    let finalRabbatPrice = inputs.rabattBrutto;
    
    // If no rabatt value is provided, use the default calculation
    if (inputs.rabattNetto <= 0) {
        const discountedPrice = bruttoPrice * 0.5;
        const naturalrabattBonus = discountedPrice * 0.25;
        finalRabbatPrice = discountedPrice + naturalrabattBonus;
    }
    
    const sumRabbatiert = inputs.rabbatiert * finalRabbatPrice;
    const sumGesamt = sumVerkauft + sumRabbatiert;
    const soldItemsCost = inputs.verkauft * ekPrice;
    const discountedItemsCost = inputs.rabbatiert * ekPrice;
    const lostItemsCost = inputs.schwund * ekPrice;
    const totalCost = soldItemsCost + discountedItemsCost + lostItemsCost;
    const sumProfit = sumGesamt - totalCost;

    return {
        sumVerkauft,
        sumRabbatiert,
        sumGesamt,
        sumProfit
    };
}

// Update row display with calculated values
function updateRowDisplay(row, { sumVerkauft, sumRabbatiert, sumGesamt, sumProfit }) {
    // Don't include € symbol in the text - it's added via CSS ::after
    row.find('.sumVerkauft').text(window.utils.formatGermanNumber(sumVerkauft));
    row.find('.sumRabbatiert').text(window.utils.formatGermanNumber(sumRabbatiert));
    row.find('.sumGesamt').text(window.utils.formatGermanNumber(sumGesamt));
    row.find('.sumProfit').text(window.utils.formatGermanNumber(sumProfit));
}

// Get input values from a row
function getRowInputValues(row) {
    const rabattNetto = window.utils.parseGermanNumber(row.find('.rabatt-netto').val()) || 0;
    
    // Calculate Rabatt Brutto from Netto
    const rabattBrutto = rabattNetto * 1.19;
    
    return {
        verkauft: parseInt(row.find('.verkauft').val()) || 0,
        schwund: parseInt(row.find('.schwund').val()) || 0,
        rabbatiert: parseInt(row.find('.rabbatiert').val()) || 0,
        rabattNetto: rabattNetto,
        rabattBrutto: rabattBrutto
    };
}

// Get price values from a row
function getRowPrices(row) {
    return {
        bruttoPrice: window.utils.parseGermanNumber(row.find('td:nth-child(8)').text()),
        ekPrice: window.utils.parseGermanNumber(row.find('td:nth-child(6)').text())
    };
}

// Compute data for a row
function computeRowData(row) {
    const inputs = getRowInputValues(row);
    const { bruttoPrice, ekPrice } = getRowPrices(row);
    
    // Ensure Rabatt Brutto field is always updated
    const rabattBrutto = inputs.rabattNetto * 1.19;
    row.find('.rabatt-brutto').text(window.utils.formatGermanNumber(rabattBrutto));
    
    return calculateRowValues(inputs, bruttoPrice, ekPrice);
}

// Calculate a row
function calculateRow(row) {
    const result = computeRowData(row);
    updateRowDisplay(row, result);
    window.stats.updateStats();
}

// Force calculation for a row
function forceCalculateRow(row) {
    if (!window.tableModule.hasInputValues(row)) {
        return;
    }
    calculateRow(row);
}

// Validate row inputs
function validateInputs(row, currentInput) {
    const maxStueck = parseInt(row.find('td:nth-child(5)').text());
    const values = getRowInputValues(row);
    
    // Store the previous input value
    const previousValue = parseInt(currentInput.val()) || 0;
    
    // Calculate total
    const total = values.verkauft + values.schwund + values.rabbatiert;
    
    // Reset error states
    row.find('.number-input').removeClass('input-error');
    row.find('.error-message').removeClass('visible');
    
    if (total > maxStueck) {
        // Instead of setting to 0, reduce to the maximum allowed value
        // by returning to the previous valid value
        const otherInputsTotal = total - previousValue;
        const maxAllowedForThisInput = Math.max(0, maxStueck - otherInputsTotal);
        
        // Update the input with the maximum valid value
        currentInput.val(maxAllowedForThisInput);
        currentInput.addClass('input-error');
        
        const errorMessage = currentInput.siblings('.error-message');
        errorMessage
            .text(`Maximum total is ${maxStueck}`)
            .addClass('visible')
            .delay(2000)
            .queue(function() {
                $(this).removeClass('visible').dequeue();
                currentInput.removeClass('input-error').dequeue();
            });
            
        return false;
    }
    return true;
}

// Initialize all calculations
function initializeAllCalculations() {
    $('#sapTable tbody tr').each(function() {
        const row = $(this);
        if (window.tableModule.hasInputValues(row)) {
            forceCalculateRow(row);
        }
    });
    window.stats.updateStats();
}

// Export calculation functions
window.calculations = {
    calculateRow,
    forceCalculateRow,
    validateInputs,
    initializeAllCalculations
};
