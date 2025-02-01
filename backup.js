function initializeBackup(tableElement, { saveTableData }) {
    const table = tableElement.DataTable();

    function downloadBackup() {
        // Get all table data
        const tableData = [];
        
        table.rows().every(function() {
            const $row = $(this.node());
            const rowData = {
                sap: $row.find('td:nth-child(2)').text(),
                article: $row.find('td:nth-child(3)').text(),
                stueck: $row.find('td:nth-child(4)').text(),
                ek: $row.find('td:nth-child(5)').text(),
                netto: $row.find('td:nth-child(6)').text(),
                spanne: $row.find('td:nth-child(7)').text(),
                brutto: $row.find('td:nth-child(8)').text(),
                verkauft: $row.find('.verkauft').val(),
                schwund: $row.find('.schwund').val(),
                rabbatiert: $row.find('.rabbatiert').val(),
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
            version: '1.0',
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

                // Add rows from backup
                backup.data.forEach(rowData => {
                    const verkauftValue = rowData.verkauft !== undefined && rowData.verkauft !== null ? rowData.verkauft : '0';
                    const schwundValue = rowData.schwund !== undefined && rowData.schwund !== null ? rowData.schwund : '0';
                    const rabbatiertValue = rowData.rabbatiert !== undefined && rowData.rabbatiert !== null ? rowData.rabbatiert : '0';
                    
                    const newRow = $(`
                        <tr>
                            <td class="actions-column">
                                <div class="row-actions">
                                    <i class="edit outline icon edit-row" title="Edit row"></i>
                                    <i class="trash alternate outline icon delete-row" title="Delete row"></i>
                                </div>
                            </td>
                            <td>${rowData.sap || ''}</td>
                            <td>${rowData.article || ''}</td>
                            <td>${rowData.stueck || '0'}</td>
                            <td>${rowData.ek || '0.00'}</td>
                            <td>${rowData.netto || '0.00'}</td>
                            <td>${rowData.spanne || '0.00'}</td>
                            <td>${rowData.brutto || '0.00'}</td>
                            <td>
                                <div class="input-container">
                                    <input type="number" class="number-input verkauft" min="0" value="${parseInt(verkauftValue) || 0}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td>
                                <div class="input-container">
                                    <input type="number" class="number-input schwund" min="0" value="${parseInt(schwundValue) || 0}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td>
                                <div class="input-container">
                                    <input type="number" class="number-input rabbatiert" min="0" value="${parseInt(rabbatiertValue) || 0}">
                                    <div class="error-message"></div>
                                </div>
                            </td>
                            <td class="calculated sumVerkauft">${rowData.sumVerkauft || '0.00 €'}</td>
                            <td class="calculated sumRabbatiert">${rowData.sumRabbatiert || '0.00 €'}</td>
                            <td class="calculated sumGesamt">${rowData.sumGesamt || '0.00 €'}</td>
                            <td class="calculated sumProfit">${rowData.sumProfit || '0.00 €'}</td>
                        </tr>
                    `);

                    table.row.add(newRow);
                });

                // Redraw table and save
                table.draw();
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
