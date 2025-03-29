function initializeBackup(tableElement, { saveTableData }) {
    const table = tableElement.DataTable();

    function downloadBackup() {
        // Get all table data
        const tableData = [];
        
        table.rows().every(function() {
            const $row = $(this.node());
            const rowData = {
                // Renamed fields to match their actual content
                index: $row.find('td.counter-cell').text(), // This is the row index
                sap: $row.find('td:nth-child(3)').text(),  // This is the SAP number
                article: $row.find('td:nth-child(4)').text(), // This is the article name
                stueck: $row.find('td:nth-child(5)').text(),
                ek: $row.find('td:nth-child(6)').text(),
                netto: $row.find('td:nth-child(7)').text(),
                spanne: $row.find('td:nth-child(8)').text(),
                brutto: $row.find('td:nth-child(9)').text(),
                verkauft: $row.find('.verkauft').val(),
                schwund: $row.find('.schwund').val(),
                rabbatiert: $row.find('.rabbatiert').val(),
                rabattNetto: $row.find('.rabatt-netto').val(), // Add rabattNetto to backup
                rabattBrutto: $row.find('.rabatt-brutto').text(), // Store text content instead of val()
                sumVerkauft: $row.find('.sumVerkauft').text(),
                sumRabbatiert: $row.find('.sumRabbatiert').text(),
                sumGesamt: $row.find('.sumGesamt').text(),
                sumProfit: $row.find('.sumProfit').text(),
                isEditing: $row.find('.edit-row').hasClass('save')
            };
            tableData.push(rowData);
        });

        // Create backup object with metadata
        const backup = {
            version: '1.1',
            timestamp: new Date().toISOString(),
            data: tableData
        };

        // Convert to JSON and create blob
        const jsonString = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create download link and trigger download
        const date = new Date().toISOString().split('T')[0];
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `table_backup_${date}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    function restoreBackup(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const backup = JSON.parse(e.target.result);
                
                // Version check
                if (!backup.version || !backup.data) {
                    throw new Error('Invalid backup file format');
                }

                // Clear existing table data
                table.clear();

                // Add rows from backup with corrected field mapping
                backup.data.forEach(rowData => {
                    const verkauftValue = rowData.verkauft !== undefined && rowData.verkauft !== null ? rowData.verkauft : '0';
                    const schwundValue = rowData.schwund !== undefined && rowData.schwund !== null ? rowData.schwund : '0';
                    const rabbatiertValue = rowData.rabbatiert !== undefined && rowData.rabbatiert !== null ? rowData.rabbatiert : '0';
                    const rabattNettoValue = rowData.rabattNetto !== undefined ? rowData.rabattNetto : '0,00';
                    
                    // Get rabattBrutto from backup if available, otherwise calculate it
                    let bruttoFormatted;
                    if (rowData.rabattBrutto) {
                        bruttoFormatted = rowData.rabattBrutto;
                    } else {
                        // Calculate Rabatt Brutto from Netto
                        const nettoNumeric = window.utils ? 
                            window.utils.parseGermanNumber(rabattNettoValue) : 
                            parseFloat(rabattNettoValue.replace(',', '.')) || 0;
                        
                        const bruttoNumeric = nettoNumeric * 1.19;
                        bruttoFormatted = window.utils ? 
                            window.utils.formatGermanNumber(bruttoNumeric) : 
                            bruttoNumeric.toFixed(2).replace('.', ',');
                    }
                    
                    // Create the row with the SAP number directly in the SAP cell
                    const newRow = $(`
                        <tr>
                            <td class="actions-column">
                                <div class="row-actions">
                                    <i class="edit outline icon edit-row" title="Edit row"></i>
                                    <i class="trash alternate outline icon delete-row" title="Delete row"></i>
                                </div>
                            </td>
                            <td class="counter-cell"></td>
                            <td>${rowData.article || ''}</td>
                            <td>${rowData.stueck || ''}</td>
                            <td>${rowData.ek || '0'}</td>
                            <td>${rowData.netto || '0,00'}</td>
                            <td>${rowData.spanne || '0,00'}</td>
                            <td>${rowData.brutto || '0,00'}</td>
                            <td>
                                <div class="input-container">
                                    <input type="number" class="number-input verkauft" min="0" step="1" value="${parseInt(verkauftValue) || 0}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td>
                                <div class="input-container">
                                    <input type="number" class="number-input schwund" min="0" step="1" value="${parseInt(schwundValue) || 0}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td>
                                <div class="input-container">
                                    <input type="number" class="number-input rabbatiert" min="0" step="1" value="${parseInt(rabbatiertValue) || 0}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td>
                                <div class="input-container rabatt-container">
                                    <input type="text" class="currency-input rabatt-netto" value="${rabattNettoValue}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td class="rabatt-brutto">${bruttoFormatted}</td>
                            <td class="calculated sumVerkauft">${rowData.sumVerkauft || '0,00'}</td>
                            <td class="calculated sumRabbatiert">${rowData.sumRabbatiert || '0,00'}</td>
                            <td class="calculated sumGesamt">${rowData.sumGesamt || '0,00'}</td>
                            <td class="calculated sumProfit">${rowData.sumProfit || '0,00'}</td>
                        </tr>
                    `);

                    table.row.add(newRow);
                });

                // Redraw table and update counters in a way that doesn't affect the SAP field
                table.draw();
                
                // Ensure counter cells are numbered but SAP numbers aren't affected
                let counter = 1;
                table.rows().every(function(rowIdx) {
                    $(this.node()).find('td.counter-cell').text(counter++);
                });
                
                saveTableData();

                // Show success message
                alert('Backup restored successfully!');
                
            } catch (error) {
                console.error('Error restoring backup:', error);
                alert('Error restoring backup. Please check the file format.');
            }
        };

        reader.readAsText(file);
    }

    return {
        downloadBackup,
        restoreBackup
    };
}
