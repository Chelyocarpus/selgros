// PDF Format Extractors for different PDF formats

// Raw data extractor - just processes and returns the content without parsing
const rawDataExtractor = {
    name: 'Raw PDF Data',
    lastExtractedData: null, // Store last extracted data
    
    // Extract data from PDF text content
    extractData: function(content) {
        return {
            rawText: content,
            items: []  // Empty array since we're not parsing structured data
        };
    },
    
    // Display raw content in a modal
    displayRawData: function(content, previousData) {
        if (previousData) {
            this.lastExtractedData = previousData;
        }
        
        const modal = $(`
            <div class="ui modal raw-data-modal" style="display:block !important; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:80%; max-width:800px; max-height:90vh; background:white; z-index:1000; padding:20px; box-shadow:0 0 20px rgba(0,0,0,0.5); border-radius:5px; overflow:auto;">
                <div class="header" style="font-size:1.2em; font-weight:bold; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #eee;">
                    Raw PDF Content
                    <i class="close icon" style="float:right; cursor:pointer;">&times;</i>
                </div>
                <div class="content" style="margin-bottom:15px;">
                    <div class="ui form">
                        <div class="field">
                            <textarea readonly style="height: 400px; font-family: monospace; white-space: pre; overflow: auto; width:100%;">${escapeHtml(content)}</textarea>
                        </div>
                    </div>
                </div>
                <div class="actions" style="text-align:right; padding-top:10px; border-top:1px solid #eee;">
                    ${this.lastExtractedData ? `
                        <button class="ui button back-to-table" style="background:#2185d0; color:white; padding:8px 15px; margin-right:10px; border:none; border-radius:4px; cursor:pointer;">
                            <i class="table icon"></i> Back to Table View
                        </button>
                    ` : ''}
                    <button class="ui button copy-raw-data" style="background:#e0e1e2; padding:8px 15px; margin-right:10px; border:none; border-radius:4px; cursor:pointer;">Copy to Clipboard</button>
                    <button class="ui positive button close-modal" style="background:#21ba45; color:white; padding:8px 15px; border:none; border-radius:4px; cursor:pointer;">Close</button>
                </div>
            </div>
        `);
        
        // Create overlay
        const overlay = $('<div class="modal-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:999;"></div>');
        
        // Add to body
        overlay.appendTo('body');
        modal.appendTo('body');
        
        // Handle close actions
        modal.find('.close, .close-modal').on('click', () => {
            this.lastExtractedData = null;
            modal.remove();
            overlay.remove();
        });
        
        // Close on overlay click
        overlay.on('click', () => {
            this.lastExtractedData = null;
            modal.remove();
            overlay.remove();
        });
        
        // Handle copy button
        modal.find('.copy-raw-data').on('click', function() {
            const textarea = modal.find('textarea')[0];
            textarea.select();
            document.execCommand('copy');
            $(this).text('Copied!').css('background', '#21ba45').css('color', 'white');
            setTimeout(() => {
                $(this).text('Copy to Clipboard').css('background', '#e0e1e2').css('color', 'rgba(0,0,0,.6)');
            }, 2000);
        });
        
        // Handle back to table button
        modal.find('.back-to-table').on('click', () => {
            modal.remove();
            overlay.remove();
            if (this.lastExtractedData) {
                selgrosSalesExtractor.displayExtractedData(this.lastExtractedData);
            }
        });
    }
};

// Add a specialized extractor for Selgros sales data format
const selgrosSalesExtractor = {
    name: 'Selgros Sales Data',
    
    // Check if content matches this format
    canExtract: function(content) {
        // Look for patterns that indicate this is Selgros sales data
        // Check for MKT and ST markers plus typical item structure
        return content.includes('MKT') && content.includes('ST') && 
               content.match(/\[\d+\] "(\d+-\d+\.\d+)" \(x:[0-9.]+, y:[0-9.]+\)/);
    },
    
    // Extract data from PDF text content
    extractData: function(content) {
        const lines = content.split('\n');
        const items = [];
        
        // New pattern-based approach for better recognition
        // Process specific patterns in sequence
        for (let i = 0; i < lines.length - 10; i++) {
            // Look for a potential item number start
            const itemNumberMatch = lines[i].match(/\[\d+\] "(\d+)" \(x:[0-9.]+, y:[0-9.]+\)/);
            
            if (itemNumberMatch) {
                // Look for patterns in the subsequent lines
                const articleLine = lines[i+2]; // Article name is typically 2 lines after item number
                const locationLine = lines[i+4]; // Location (previously called sapNumber) is typically 4 lines after item number
                const mktLine = findLineWithText(lines, i, i+10, "MKT");
                const stLine = findLineWithText(lines, i, i+15, "ST");
                
                // Extract quantity more precisely - look for a number after "ST"
                let quantity = 0;
                if (stLine) {
                    // First try: Check lines after ST for a number
                    for (let j = stLine.index; j < stLine.index + 4 && j < lines.length; j++) {
                        const quantityMatch = lines[j].match(/\[\d+\] "(\d+)" \(x:[0-9.]+, y:[0-9.]+\)/);
                        if (quantityMatch && j !== stLine.index) {
                            quantity = parseInt(quantityMatch[1], 10);
                            break;
                        }
                    }
                    
                    // Second try: Check same line as ST
                    if (quantity === 0) {
                        const sameLineMatch = lines.slice(stLine.index, stLine.index+2).join('\n')
                            .match(/\[\d+\] "ST".*?\[\d+\] "(\d+)"/);
                        if (sameLineMatch) {
                            quantity = parseInt(sameLineMatch[1], 10);
                        }
                    }
                    
                    // Third try: Look for standalone numbers near ST
                    if (quantity === 0) {
                        for (let j = stLine.index; j < stLine.index + 5 && j < lines.length; j++) {
                            const altQuantityMatch = lines[j].match(/\[\d+\] "(\d{1,3})" \(x:[0-9.]+, y:[0-9.]+\)/);
                            if (altQuantityMatch && j > stLine.index) {
                                const potentialQty = parseInt(altQuantityMatch[1], 10);
                                if (potentialQty > 0 && potentialQty < 1000) {
                                    quantity = potentialQty;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // Extract article name
                const articleMatch = articleLine && articleLine.match(/\[\d+\] "([^"]+)" \(x:[0-9.]+, y:[0-9.]+\)/);
                const article = articleMatch && articleMatch[1].trim() !== "" ? articleMatch[1].trim() : "";
                
                // Skip if no meaningful article name
                if (article.length < 3 || article === " ") continue;
                
                // Extract location (previously called sapNumber)
                const locationMatch = locationLine && locationLine.match(/\[\d+\] "(\d+-\d+\.\d+)" \(x:[0-9.]+, y:[0-9.]+\)/);
                const location = locationMatch ? locationMatch[1] : "";
                
                // Skip if no location
                if (!location) continue;
                
                // Create item if we have all required data
                if (article && location) {
                    items.push({
                        itemNumber: itemNumberMatch[1],        // This is the SAP Number
                        article: article,
                        location: location,                    // This was previously called sapNumber
                        quantity: quantity
                    });
                    
                    // Skip ahead to avoid duplicate processing
                    i = stLine ? stLine.index + 2 : i + 6;
                }
            }
        }
        
        console.log('Extracted items:', items);
        
        return {
            rawText: content,
            items: items
        };
    },
    
    // Display extracted data and create import button
    displayExtractedData: function(data) {
        // Create a modal to display structured data
        const modal = $(`
            <div class="ui modal" style="display:block !important; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:90%; max-width:1000px; max-height:90vh; background:white; z-index:1000; padding:20px; box-shadow:0 0 20px rgba(0,0,0,0.5); border-radius:5px; overflow:auto;">
                <div class="header" style="font-size:1.4em; font-weight:bold; margin-bottom:15px; padding-bottom:15px; border-bottom:2px solid #eee;">
                    Extracted Sales Data (${data.items.length} items)
                    <i class="close icon" style="float:right; cursor:pointer;"></i>
                </div>
                <div class="content" style="margin-bottom:15px; max-height:calc(90vh - 150px); overflow:auto;">
                    <table class="ui celled table" style="width:100%; table-layout:auto;">
                        <thead>
                            <tr>
                                <th style="width:15%">SAP Number</th>
                                <th style="width:45%">Article</th>
                                <th style="width:20%">Location</th>
                                <th style="width:20%">Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.items.map(item => `
                                <tr>
                                    <td style="word-break:break-word">${item.itemNumber}</td>
                                    <td style="word-break:break-word">${item.article}</td>
                                    <td style="text-align:center; font-family:monospace">${item.location}</td>
                                    <td style="text-align:right; font-weight:bold">${item.quantity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="actions" style="text-align:right; padding-top:10px; border-top:1px solid #eee;">
                    <button class="ui button view-raw-data" style="background:#e0e1e2; padding:8px 15px; margin-right:10px; border:none; border-radius:4px; cursor:pointer;">View Raw Data</button>
                    <button class="ui positive button import-data" style="background:#21ba45; color:white; padding:8px 15px; border:none; border-radius:4px; cursor:pointer;">Import to Table</button>
                </div>
            </div>
        `);
        
        // Create overlay
        const overlay = $('<div class="modal-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:999;"></div>');
        
        // Add to body
        overlay.appendTo('body');
        modal.appendTo('body');
        
        // Store the data for access by buttons
        modal.data('extracted-items', data.items);
        
        // Handle close actions
        modal.find('.close').on('click', function() {
            modal.remove();
            overlay.remove();
        });
        
        // Close on overlay click
        overlay.on('click', function() {
            modal.remove();
            overlay.remove();
        });
        
        // Handle View Raw Data button
        modal.find('.view-raw-data').on('click', function() {
            modal.remove();
            overlay.remove();
            rawDataExtractor.displayRawData(data.rawText, data);
        });
        
        // Handle Import button
        modal.find('.import-data').on('click', function() {
            const items = modal.data('extracted-items');
            importItemsToTable(items);
            modal.remove();
            overlay.remove();
        });
    }
};

// Helper function to find a line containing specific text
function findLineWithText(lines, startIdx, endIdx, textToFind) {
    const maxIdx = Math.min(endIdx, lines.length);
    for (let i = startIdx; i < maxIdx; i++) {
        if (lines[i].includes(`"${textToFind}"`) || lines[i].includes(` ${textToFind} `)) {
            return { text: lines[i], index: i };
        }
    }
    return null;
}

// Helper function to find the next non-empty line after a specific index
function findLineAfter(lines, startIdx, maxDistance) {
    const maxIdx = Math.min(startIdx + maxDistance, lines.length);
    for (let i = startIdx + 1; i < maxIdx; i++) {
        if (lines[i].trim() !== "" && lines[i].includes("[") && lines[i].includes("]")) {
            return { text: lines[i], index: i };
        }
    }
    return null;
}

// Helper function to import extracted items to the table
function importItemsToTable(items) {
    if (!items || !items.length) {
        alert('No items to import');
        return;
    }
    
    const table = $('#sapTable').DataTable();
    if (!table) {
        console.error('DataTable not initialized');
        return;
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    
    items.forEach(item => {
        if (!item.article) return;
        
        // Skip if location doesn't match 990-XX.XXX pattern
        if (!item.location || !item.location.startsWith('990-')) {
            console.log('Skipping item due to invalid location:', item.location);
            skippedCount++;
            return;
        }
        
        // Create a new row
        const newRow = $(window.tableModule.getNewRowHtml());
        
        // Set the data in the correct columns, accounting for the new Lieferanten-Artnr column:
        // Column 3: SAP-Nr (using itemNumber)
        newRow.find('td:eq(2)').text(item.itemNumber);
        
        // Column 4: Lieferanten-Artnr (leave empty by default)
        newRow.find('td:eq(3)').text('');
        
        // Column 5: Article (moved from column 4)
        newRow.find('td:eq(4)').text(item.article);
        
        // Column 6: Stück (Quantity)
        newRow.find('td:eq(5)').text(item.quantity || 0);
        
        table.row.add(newRow);
        importedCount++;
    });
    
    if (importedCount > 0) {
        table.draw(false);
        window.tableModule.updateRowCounters(table);
        window.storage.saveTableData();
        
        const skipMessage = skippedCount > 0 ? ` (${skippedCount} items skipped)` : '';
        showImportNotification(`Successfully imported ${importedCount} items${skipMessage}`, 'success');
        
        highlightImportedRows();
    } else {
        showImportNotification(`No valid items found to import (${skippedCount} items skipped)`, 'warning');
    }
}

// Helper function to highlight newly imported rows
function highlightImportedRows() {
    // Add a class to all rows without data in Verkauft/Schwund/Rabbatiert
    const rows = $('#sapTable tbody tr').filter(function() {
        const verkauft = $(this).find('.verkauft').val();
        const schwund = $(this).find('.schwund').val();
        const rabbatiert = $(this).find('.rabbatiert').val();
        
        return (!verkauft || verkauft === '0') && 
               (!schwund || schwund === '0') && 
               (!rabbatiert || rabbatiert === '0');
    });
    
    // Add highlight effect
    rows.addClass('new-row-highlight');
    
    // Remove the highlighting after animation completes
    setTimeout(() => {
        rows.removeClass('new-row-highlight');
    }, 2000);
}

// Helper function for import notifications
function showImportNotification(message, type = 'success') {
    // First remove any existing notifications to prevent duplicates
    $('.ui.message[style*="position: fixed"]').remove();
    $('.pdf-import-status').remove();
    
    const colors = {
        success: '#21ba45',
        warning: '#fbbd08',
        error: '#db2828'
    };
    
    const notification = $(`
        <div style="position:fixed; top:20px; right:20px; padding:15px; background:white; 
                    box-shadow:0 2px 10px rgba(0,0,0,0.1); border-left:4px solid ${colors[type]};
                    z-index:9999; max-width:300px; font-size:14px;">
            <div style="display:flex; align-items:center;">
                <i class="icon check circle" style="margin-right:10px; color:${colors[type]};"></i>
                <span>${message}</span>
            </div>
        </div>
    `).appendTo('body');
    
    // Auto-remove after delay
    setTimeout(() => {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    }, 4000);
}

// Main extractor factory
const extractorFactory = {
    // Get appropriate extractor based on PDF content
    getExtractorForContent: function(content) {
        // Try the specialized extractor first
        if (selgrosSalesExtractor.canExtract(content)) {
            return selgrosSalesExtractor;
        }
        
        // Fall back to raw data extractor
        return rawDataExtractor;
    },
    
    // Expose extractors directly
    rawDataExtractor: rawDataExtractor,
    selgrosSalesExtractor: selgrosSalesExtractor
};

// Helper function to escape HTML
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Export the extractor factory
window.pdfExtractors = extractorFactory;
