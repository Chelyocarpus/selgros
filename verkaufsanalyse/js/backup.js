function initializeBackup(tableElement, { saveTableData }) {
    const table = tableElement.DataTable();

    function downloadBackup() {
        // Get all table data
        const tableData = [];
        
        table.rows().every(function() {
            const $row = $(this.node());
            
            // Get position from the counter cell
            const position = parseInt($row.find('td.counter-cell').text()) || 0;
            
            // Get netto and brutto values - update column indices
            const nettoValue = $row.find('td:nth-child(8)').text().trim() || '0,00'; // Updated index
            const bruttoValue = $row.find('td:nth-child(9)').text().trim() || // Updated index
                window.utils.formatGermanNumber(window.utils.parseGermanNumber(nettoValue) * 1.19);

            const rowData = {
                index: position,
                position: position, // Add explicit position field
                sap: $row.find('td:nth-child(3)').text(),
                newColumn: $row.find('td:nth-child(4)').text(), // Add new column
                article: $row.find('td:nth-child(5)').text(), // Updated index
                stueck: $row.find('td:nth-child(6)').text(), // Updated index
                ek: $row.find('td:nth-child(7)').text(), // Updated index
                netto: nettoValue,
                brutto: bruttoValue,
                verkauft: $row.find('.verkauft').val(),
                schwund: $row.find('.schwund').val(),
                rabbatiert: $row.find('.rabbatiert').val(),
                rabattNetto: $row.find('.rabatt-netto').val() || '0,00',
                rabattBrutto: $row.find('.rabatt-brutto').text().trim() || '0,00',
                sumVerkauft: $row.find('.sumVerkauft').text(),
                sumRabbatiert: $row.find('.sumRabbatiert').text(),
                sumGesamt: $row.find('.sumGesamt').text(),
                sumProfit: $row.find('.sumProfit').text(),
                isEditing: $row.find('.edit-row').hasClass('save')
            };
            tableData.push(rowData);
        });

        // Sort data by position before saving
        tableData.sort((a, b) => (a.position || 0) - (b.position || 0));

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

                // Add rows from backup with simplified field mapping
                backup.data.forEach(rowData => {
                    const nettoValue = rowData.netto || '0,00';
                    const bruttoValue = rowData.brutto || 
                        window.utils.formatGermanNumber(window.utils.parseGermanNumber(nettoValue) * 1.19);
                    
                    // Properly format rabatt values for restoration
                    const rabattNettoValue = rowData.rabattNetto ? 
                        (typeof rowData.rabattNetto === 'number' ? 
                            window.utils.formatGermanNumber(rowData.rabattNetto) : 
                            rowData.rabattNetto.toString().replace('.', ',')) : 
                        '0,00';
                    
                    const rabattBruttoValue = rowData.rabattBrutto ? 
                        (typeof rowData.rabattBrutto === 'number' ? 
                            window.utils.formatGermanNumber(rowData.rabattBrutto) : 
                            rowData.rabattBrutto.toString().replace('.', ',')) : 
                        '0,00';

                    const newColumnVal = rowData.newColumn || '';

                    const newRow = $(`
                        <tr>
                            <td class="actions-column">
                                <div class="row-actions">
                                    <i class="edit outline icon edit-row" title="Edit row"></i>
                                    <i class="trash alternate outline icon delete-row" title="Delete row"></i>
                                </div>
                            </td>
                            <td class="counter-cell">${rowData.index || ''}</td>
                            <td>${rowData.sap || ''}</td>
                            <td>${newColumnVal}</td>
                            <td>${rowData.article || ''}</td>
                            <td>${rowData.stueck || '0'}</td>
                            <td>${rowData.ek || '0,00'}</td>
                            <td>${nettoValue}</td>
                            <td>${bruttoValue}</td>
                            <td>
                                <div class="input-container">
                                    <input type="number" class="number-input verkauft" min="0" step="1" value="${parseInt(rowData.verkauft) || 0}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td>
                                <div class="input-container">
                                    <input type="number" class="number-input schwund" min="0" step="1" value="${parseInt(rowData.schwund) || 0}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td>
                                <div class="input-container">
                                    <input type="number" class="number-input rabbatiert" min="0" step="1" value="${parseInt(rowData.rabbatiert) || 0}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td>
                                <div class="input-container rabatt-container">
                                    <input type="text" class="currency-input rabatt-netto" value="${rabattNettoValue}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td class="rabatt-brutto">${rabattBruttoValue}</td>
                            <td class="calculated sumVerkauft">${rowData.sumVerkauft || '0,00'}</td>
                            <td class="calculated sumRabbatiert">${rowData.sumRabbatiert || '0,00'}</td>
                            <td class="calculated sumGesamt">${rowData.sumGesamt || '0,00'}</td>
                            <td class="calculated sumProfit">${rowData.sumProfit || '0,00'}</td>
                        </tr>
                    `);

                    table.row.add(newRow);
                });

                // Redraw table and recalculate
                table.draw();
                
                // Ensure Rabatt Brutto values are updated after draw
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
                    
                    window.calculations.initializeAllCalculations();
                    window.stats.updateStats();
                    saveTableData();
                }, 100);

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
