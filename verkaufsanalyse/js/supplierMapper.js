// Module for managing supplier article number mapping

// Main function to handle supplier file import
function handleSupplierFileImport(file, table) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const fileContent = e.target.result;
            const mappings = extractMappingsFromFile(fileContent);
            
            if (Object.keys(mappings).length === 0) {
                showNotification('No valid supplier article mappings found in the file.', 'warning');
                return;
            }
            
            const updatedCount = updateTableWithMappings(table, mappings);
            
            showNotification(`Successfully imported ${updatedCount} Duni supplier article numbers.`, 'success');
            
            // Save updated data
            window.storage.saveTableData();
        } catch (error) {
            console.error('Error processing supplier file:', error);
            showNotification(`Error processing file: ${error.message}`, 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification('Error reading the file.', 'error');
    };
    
    reader.readAsText(file);
}

// Extract mappings from MHTML file content
function extractMappingsFromFile(fileContent) {
    const mappings = {};
    let lineCount = 0;
    let duniMappingsCount = 0;
    let skippedTransgourmet = 0;
    let skippedOthers = 0;
    
    // Use regex to extract SAP number, supplier name, and Lieferanten-Artnr pairs
    // This expanded regex captures more columns from the HTML table including supplier name
    const tableRowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*>[^<]*<\/td>[\s\S]*?<td[^>]*>[^<]*<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>/g;
    
    let match;
    while ((match = tableRowRegex.exec(fileContent)) !== null) {
        lineCount++;
        const sapNumber = match[1].trim();
        const lieferantenArtNr = match[2].trim();
        const supplierName = match[3].trim();
        
        // Skip header rows or invalid data
        if (sapNumber === 'Artikel' || lieferantenArtNr === 'Lieferantenartikelnr.' || 
            !sapNumber || !lieferantenArtNr) {
            continue;
        }
        
        // Skip if supplier name is not Duni GmbH
        if (!supplierName.includes('Duni GmbH')) {
            if (supplierName.includes('Transgourmet')) {
                skippedTransgourmet++;
            } else {
                skippedOthers++;
            }
            continue;
        }
        
        // Skip if SAP number is identical to Lieferantenartikelnr
        if (sapNumber === lieferantenArtNr) {
            console.log(`Skipping self-reference: SAP=${sapNumber} = Lieferantenartikelnr`);
            continue;
        }
        
        // Store in mappings object
        mappings[sapNumber] = lieferantenArtNr;
        duniMappingsCount++;
    }
    
    console.log(`Processed ${lineCount} lines`);
    console.log(`Found ${duniMappingsCount} Duni GmbH mappings`);
    console.log(`Skipped ${skippedTransgourmet} Transgourmet entries`);
    console.log(`Skipped ${skippedOthers} other supplier entries`);
    
    return mappings;
}

// Update table rows with the extracted mappings
function updateTableWithMappings(table, mappings) {
    let updatedCount = 0;
    let skippedCount = 0;
    
    table.rows().every(function() {
        const $row = $(this.node());
        const sapCell = $row.find('td:nth-child(3)');
        const sapNumber = sapCell.text().trim();
        
        // Skip if no SAP number or not in our mappings
        if (!sapNumber || !mappings[sapNumber]) {
            return;
        }
        
        // Get current content of Lieferanten-Artnr field
        const lieferantenCell = $row.find('td:nth-child(4)');
        const currentValue = lieferantenCell.text().trim();
        
        // Don't overwrite existing values that don't match the SAP number
        // This prevents accidentally overwriting user-entered values
        if (currentValue && currentValue !== sapNumber && currentValue !== mappings[sapNumber]) {
            console.log(`Skipping update for SAP=${sapNumber}: already has Lieferantenartikelnr=${currentValue}`);
            skippedCount++;
            return;
        }
        
        // Update the Lieferanten-Artnr column (4th column)
        lieferantenCell.text(mappings[sapNumber]);
        updatedCount++;
    });
    
    console.log(`Updated ${updatedCount} rows with Duni article numbers`);
    console.log(`Skipped ${skippedCount} rows with existing different values`);
    return updatedCount;
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

// Export supplier mapper functions
window.supplierMapper = {
    handleSupplierFileImport
};
