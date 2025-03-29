// Functions for statistics calculation and display

// Collect statistics from all rows
function collectStatsFromRows() {
    let stats = {
        totalProfit: 0,
        totalProfitWithoutNR: 0, // New field for profit without NR
        totalRevenue: 0,
        discountedSales: 0,
        totalLoss: 0,
        itemsSold: 0,
        discountItems: 0,
        lostItems: 0,
        naturalRabatt: 0, // New field to track NR value
        // Add these new properties for debug information
        totalUnitCost: 0,
        totalPurchaseCost: 0,
        totalQuantity: 0
    };

    const table = $('#sapTable').DataTable();
    table.rows().every(function() {
        const row = $(this.node());
        
        // Get values from the row
        const schwund = parseInt(row.find('.schwund').val()) || 0;
        const verkauft = parseInt(row.find('.verkauft').val()) || 0;
        const rabbatiert = parseInt(row.find('.rabbatiert').val()) || 0;
        const ekPrice = window.utils.parseGermanNumber(row.find('td:nth-child(6)').text());
        
        // Parse numbers from cells, removing any € symbol
        const sumProfitText = row.find('.sumProfit').text().replace(/€/g, '').trim();
        const sumGesamtText = row.find('.sumGesamt').text().replace(/€/g, '').trim();
        const sumRabbatiertText = row.find('.sumRabbatiert').text().replace(/€/g, '').trim();
        
        // Add to totals
        stats.totalProfit += window.utils.parseGermanNumber(sumProfitText) || 0;
        stats.totalRevenue += window.utils.parseGermanNumber(sumGesamtText) || 0;
        stats.discountedSales += window.utils.parseGermanNumber(sumRabbatiertText) || 0;
        
        // Calculate loss based on EK price and schwund quantity
        stats.totalLoss += schwund * ekPrice;
        
        // Update counters
        stats.itemsSold += verkauft;
        stats.discountItems += rabbatiert;
        stats.lostItems += schwund;
        
        // Calculate additional metrics for debug
        const totalRowQuantity = verkauft + rabbatiert + schwund;
        stats.totalQuantity += totalRowQuantity;
        stats.totalUnitCost += ekPrice; // Sum of all unit costs (for average)
        stats.totalPurchaseCost += (totalRowQuantity * ekPrice); // Total purchase cost
    });

    // Calculate the Naturalrabatt value (25% of discounted sales)
    stats.naturalRabatt = stats.discountedSales * 0.25;
    
    // The totalProfit we've calculated so far is actually without NR
    stats.totalProfitWithoutNR = stats.totalProfit;
    
    // Profit with NR means we add the Naturalrabatt amount (it's a rebate/refund)
    stats.totalProfit = stats.totalProfitWithoutNR + stats.naturalRabatt;
    
    // Calculate average unit cost if needed
    stats.averageUnitCost = stats.totalUnitCost / table.rows().count();

    return stats;
}

// Calculate profit margin
function calculateProfitMargin(totalRevenue, totalProfit) {
    if (totalRevenue > 0) {
        return (totalProfit / totalRevenue) * 100;
    } else if (totalProfit < 0) {
        return -100; // Show -100% when there's loss but no revenue
    }
    return 0;
}

// Update statistics display
function updateStatsDisplay(stats) {
    // Format the NR value
    const formattedNR = window.utils.formatGermanNumber(stats.naturalRabatt);
    
    // Update stats display with proper German number formatting - moved info icons to their own elements
    $('#totalProfit').html(`${window.utils.formatGermanNumber(stats.totalProfit)} € <span class="profit-note">(inkl. NR-Erstattung)</span>`);
    $('#profitWithoutNR').html(`${window.utils.formatGermanNumber(stats.totalProfitWithoutNR)} €`);
    $('#totalRevenue').html(`${window.utils.formatGermanNumber(stats.totalRevenue)} €`);
    $('#discountedSales').html(`${window.utils.formatGermanNumber(stats.discountedSales)} €`);
    $('#totalLoss').html(`${window.utils.formatGermanNumber(stats.totalLoss)} €`);
    $('#naturalRabatt').html(`${formattedNR} €`);
    
    $('#itemsSold').text(stats.itemsSold);
    $('#discountItems').text(stats.discountItems);
    $('#lostItems').text(stats.lostItems);
    
    // Calculate and display profit margins
    const profitMargin = calculateProfitMargin(stats.totalRevenue, stats.totalProfit);
    const profitMarginWithoutNR = calculateProfitMargin(stats.totalRevenue, stats.totalProfitWithoutNR);
    
    $('#profitMargin').text(profitMargin.toFixed(1) + '%');
    $('#profitMarginWithoutNR').text(profitMarginWithoutNR.toFixed(1) + '%');
    
    // Setup info icon click handlers
    setupInfoIconHandlers(stats);
}

// Setup info icon click handlers
function setupInfoIconHandlers(stats) {
    $('.stat-info-icon').off('click').on('click', function(e) {
        e.stopPropagation();
        
        const cardType = $(this).data('card');
        const detailsHtml = generateCardDetails(cardType, stats);
        
        // Close any existing popups
        $('.stat-details-popup').remove();
        
        // Create and position the popup - with improved structure to prevent header cutoff
        const popup = $(`
            <div class="stat-details-popup ui segment">
                <div class="ui top attached label">Calculation Details</div>
                <button class="ui mini icon button close-popup" style="position: absolute; right: 5px; top: 5px; z-index: 10;">
                    <i class="close icon"></i>
                </button>
                <div class="popup-content">${detailsHtml}</div>
            </div>
        `);
        
        // Append to body and position near the icon
        $('body').append(popup);
        positionPopup(popup, $(this));
        
        // Add close handler
        popup.find('.close-popup').on('click', function() {
            popup.remove();
        });
        
        // Close when clicking outside
        $(document).on('click.popup', function(e) {
            if (!$(e.target).closest('.stat-details-popup').length && 
                !$(e.target).closest('.stat-info-icon').length) {
                popup.remove();
                $(document).off('click.popup');
            }
        });
    });
}

// Generate card-specific details
function generateCardDetails(cardType, stats) {
    switch (cardType) {
        case 'profit':
            return `
                <h4>Total Profit Calculation</h4>
                <table class="ui compact table">
                    <tbody>
                        <tr>
                            <td>Profit without NR:</td>
                            <td>${window.utils.formatGermanNumber(stats.totalProfitWithoutNR)} €</td>
                        </tr>
                        <tr>
                            <td>Naturalrabatt (25%):</td>
                            <td>+ ${window.utils.formatGermanNumber(stats.naturalRabatt)} €</td>
                        </tr>
                        <tr class="positive">
                            <td><strong>Final Profit:</strong></td>
                            <td><strong>${window.utils.formatGermanNumber(stats.totalProfit)} €</strong></td>
                        </tr>
                        <tr>
                            <td>Profit Margin:</td>
                            <td>${calculateProfitMargin(stats.totalRevenue, stats.totalProfit).toFixed(1)}%</td>
                        </tr>
                    </tbody>
                </table>
                <p class="note">The final profit includes the 25% Naturalrabatt rebate on all discounted sales.</p>
            `;
        
        case 'profit-without-nr':
            return `
                <h4>Profit Before NR</h4>
                <table class="ui compact table">
                    <tbody>
                        <tr>
                            <td>Revenue:</td>
                            <td>${window.utils.formatGermanNumber(stats.totalRevenue)} €</td>
                        </tr>
                        <tr>
                            <td>Total Purchase Cost:</td>
                            <td>- ${window.utils.formatGermanNumber(stats.totalPurchaseCost)} €</td>
                        </tr>
                        <tr>
                            <td><strong>Profit without NR:</strong></td>
                            <td><strong>${window.utils.formatGermanNumber(stats.totalProfitWithoutNR)} €</strong></td>
                        </tr>
                        <tr>
                            <td>Profit Margin without NR:</td>
                            <td>${calculateProfitMargin(stats.totalRevenue, stats.totalProfitWithoutNR).toFixed(1)}%</td>
                        </tr>
                    </tbody>
                </table>
                <p class="note">This is the base profit before adding the NR rebate.</p>
            `;
            
        case 'nr':
            return `
                <h4>Naturalrabatt (NR) Calculation</h4>
                <table class="ui compact table">
                    <tbody>
                        <tr>
                            <td>Discounted Sales:</td>
                            <td>${window.utils.formatGermanNumber(stats.discountedSales)} €</td>
                        </tr>
                        <tr>
                            <td>NR Percentage:</td>
                            <td>25%</td>
                        </tr>
                        <tr>
                            <td><strong>Naturalrabatt Value:</strong></td>
                            <td><strong>${window.utils.formatGermanNumber(stats.naturalRabatt)} €</strong></td>
                        </tr>
                    </tbody>
                </table>
                <p class="note">NR = Discounted Sales × 25%</p>
                <p class="note">This amount is added back to your profit as a rebate.</p>
            `;
            
        case 'revenue':
            return `
                <h4>Total Revenue Details</h4>
                <table class="ui compact table">
                    <tbody>
                        <tr>
                            <td>Regular Sales:</td>
                            <td>${window.utils.formatGermanNumber(stats.totalRevenue - stats.discountedSales)} €</td>
                        </tr>
                        <tr>
                            <td>Discounted Sales:</td>
                            <td>${window.utils.formatGermanNumber(stats.discountedSales)} €</td>
                        </tr>
                        <tr>
                            <td><strong>Total Revenue:</strong></td>
                            <td><strong>${window.utils.formatGermanNumber(stats.totalRevenue)} €</strong></td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <em>Items sold: ${stats.itemsSold} at full price, ${stats.discountItems} at discount</em>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
            
        case 'discount':
            return `
                <h4>Discounted Sales Details</h4>
                <table class="ui compact table">
                    <tbody>
                        <tr>
                            <td>Discounted Items:</td>
                            <td>${stats.discountItems}</td>
                        </tr>
                        <tr>
                            <td>Discounted Sales Value:</td>
                            <td>${window.utils.formatGermanNumber(stats.discountedSales)} €</td>
                        </tr>
                        <tr>
                            <td>% of Total Revenue:</td>
                            <td>${stats.totalRevenue ? ((stats.discountedSales / stats.totalRevenue) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                            <td>Resulting NR (25%):</td>
                            <td>${window.utils.formatGermanNumber(stats.naturalRabatt)} €</td>
                        </tr>
                    </tbody>
                </table>
                <p class="note">Discounted items are typically sold at 50% of regular price.</p>
            `;
            
        case 'loss':
            return `
                <h4>Loss Details (Schwund)</h4>
                <table class="ui compact table">
                    <tbody>
                        <tr>
                            <td>Lost Items:</td>
                            <td>${stats.lostItems}</td>
                        </tr>
                        <tr>
                            <td>Total Loss Value (at EK price):</td>
                            <td>${window.utils.formatGermanNumber(stats.totalLoss)} €</td>
                        </tr>
                        <tr>
                            <td>% of Total Items:</td>
                            <td>${stats.totalQuantity ? ((stats.lostItems / stats.totalQuantity) * 100).toFixed(1) : 0}%</td>
                        </tr>
                    </tbody>
                </table>
                <p class="note">Loss value is calculated as the purchase price (EK) multiplied by the number of lost items.</p>
            `;
            
        default:
            return `<p>No detailed information available for this card.</p>`;
    }
}

// Improved position popup function to keep it within viewport
function positionPopup(popup, trigger) {
    // First render the popup off-screen to calculate its dimensions
    popup.css({
        position: 'absolute',
        left: -9999,
        top: -9999,
        visibility: 'hidden', // Hide initially for measurement
        display: 'block'
    });
    
    // Get necessary measurements after popup is in DOM
    setTimeout(() => {
        const triggerPos = trigger.offset();
        const windowWidth = $(window).width();
        const windowHeight = $(window).height();
        const popupWidth = Math.max(popup.outerWidth(), 350); // Ensure minimum width (increased from 320px)
        const popupHeight = popup.outerHeight();
        
        // Calculate best horizontal position (avoid going off-screen right)
        let left = triggerPos.left - (popupWidth / 2) + (trigger.outerWidth() / 2); // Center popup more above the card rather than left-aligned with the trigger
        
        // Make sure popup stays within viewport horizontally
        if (left + popupWidth > windowWidth - 20) {
            left = windowWidth - popupWidth - 20;
        }
        
        // Make sure popup isn't positioned too far left
        if (left < 20) {
            left = 20;
        }
        
        // Calculate best vertical position (avoid going off-screen bottom)
        let top = triggerPos.top + trigger.outerHeight() + 5; // Reduced from 10 to position closer
        if (top + popupHeight > windowHeight - 20) {
            // Position above the trigger if there's not enough space below
            top = triggerPos.top - popupHeight - 5;
            
            // If that would go off screen top, position at top of viewport with margin
            if (top < 20) {
                top = 20;
            }
        }
        
        // Apply final position and show
        popup.css({
            position: 'fixed',
            top: top,
            left: left,
            zIndex: 1000,
            width: 'auto',
            minWidth: '350px', // Ensure consistent width (increased from 320px)
            maxWidth: Math.min(550, windowWidth - 40) + 'px', // Increased from 500px for better readability
            maxHeight: windowHeight - 40,
            overflowY: 'auto',
            visibility: 'visible' // Show after positioning
        });
    }, 0);
}

// Update all statistics
function updateStats() {
    const stats = collectStatsFromRows();
    updateStatsDisplay(stats);
}

// Export statistics functions
window.stats = {
    updateStats
};
