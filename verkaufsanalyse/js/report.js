function initializeReports(tableElement) {
    const table = tableElement.DataTable();

    function formatNumber(num, noDecimals = false) {
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: noDecimals ? 0 : 2,
            maximumFractionDigits: noDecimals ? 0 : 2
        }).format(num);
    }

    function generateNRReport() {
        const today = new Date().toLocaleDateString('de-DE');
        // Generate document ID once at the beginning
        const documentId = generateDocumentId();
        
        try {
            console.log("Starting report generation...");
            
            // Collect only rows with rabbatiert items
            const reportData = [];
            let debugMessage = "";
            
            table.rows().every(function(rowIdx) {
                try {
                    const $row = $(this.node());
                    
                    // Debug information
                    debugMessage = `Processing row ${rowIdx}`;
                    
                    // Find the rabbatiert input by class name
                    const rabbatiertInput = $row.find('input.rabbatiert');
                    
                    if (!rabbatiertInput.length) {
                        console.log(`Row ${rowIdx}: No rabbatiert input found`);
                        return;
                    }
                    
                    const rabbatiertCount = parseInt(rabbatiertInput.val()) || 0;
                    debugMessage = `Row ${rowIdx}: Rabbatiert count: ${rabbatiertCount}`;
                    
                    if (rabbatiertCount <= 0) {
                        return; // Skip rows without rabbatiert items
                    }
                    
                    // Get row data - using exact column positions based on the HTML structure
                    const indexNumber = $row.find('td.counter-cell').text().trim();
                    const sapNr = $row.find('td:eq(2)').text().trim();
                    const article = $row.find('td:eq(3)').text().trim();
                    
                    debugMessage = `Row ${rowIdx}: Index: ${indexNumber}, SAP: ${sapNr}, Article: ${article}`;
                    
                    // Get the rabatt-brutto cell - this is the discounted price
                    const rabattBruttoText = $row.find('td.rabatt-brutto').text().trim();
                    debugMessage = `Row ${rowIdx}: Rabatt Brutto text: ${rabattBruttoText}`;
                    
                    // Parse the price with proper German number format handling
                    const rabattBruttoPrice = window.utils.parseGermanNumber(rabattBruttoText);
                    debugMessage = `Row ${rowIdx}: Rabatt Brutto price parsed: ${rabattBruttoPrice}`;
                    
                    // Get the sumRabbatiert cell - this is the total for discounted items
                    const sumRabbatiertText = $row.find('td.sumRabbatiert').text().trim();
                    debugMessage = `Row ${rowIdx}: Sum Rabbatiert text: ${sumRabbatiertText}`;
                    
                    const sumRabbatiertValue = window.utils.parseGermanNumber(sumRabbatiertText);
                    debugMessage = `Row ${rowIdx}: Sum Rabbatiert parsed: ${sumRabbatiertValue}`;
                    
                    // Calculate total value for totals - use the same calculation as in the table
                    const totalValue = rabattBruttoPrice * rabbatiertCount;
                    
                    reportData.push({
                        indexNumber: indexNumber,
                        sapNr: sapNr,
                        article: article,
                        rabbatiertCount: rabbatiertCount,
                        bruttoPrice: rabattBruttoPrice,
                        brutto: window.utils.formatGermanNumber(rabattBruttoPrice) + ' €',
                        sumRabbatiert: window.utils.formatGermanNumber(sumRabbatiertValue) + ' €',
                        totalValue: totalValue
                    });
                    
                    console.log(`Successfully processed row ${rowIdx}`);
                } catch (err) {
                    console.error(`Error processing row: ${debugMessage}`, err);
                }
            });
            
            console.log(`Found ${reportData.length} rows with rabbatiert items`);

            // Only proceed if there are discounted items
            if (reportData.length === 0) {
                showNotification('No discounted items found for the report.', 'warning');
                return;
            }

            // Calculate totals
            const totalValue = reportData.reduce((sum, item) => sum + item.totalValue, 0);
            const totalNaturalrabatt = totalValue * 0.25;
            const totalItems = reportData.reduce((sum, item) => sum + item.rabbatiertCount, 0);
            
            console.log("Totals calculated:", {totalValue, totalNaturalrabatt, totalItems});

            // Create PDF document definition with improved German layout for digital use
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 100, 40, 60],
                header: {
                    columns: [
                        {
                            text: [
                                'Naturalrabatt-Abrechnung\n',
                                { text: `Datum: ${today}`, fontSize: 10 }
                            ],
                            alignment: 'right',
                            fontSize: 14,
                            bold: true,
                            margin: [0, 40, 40, 0]
                        }
                    ]
                },
                footer: function(currentPage, pageCount) {
                    return {
                        columns: [
                            {
                                text: `Dokument-ID: ${documentId}\nSeite ${currentPage} von ${pageCount}`,
                                alignment: 'right',
                                margin: [0, 0, 40, 0],
                                fontSize: 8
                            }
                        ]
                    };
                },
                content: [
                    {
                        text: 'Zusammenfassung',
                        style: 'sectionHeader',
                        margin: [0, 20, 0, 10]
                    },
                    {
                        table: {
                            widths: ['*', 'auto'],
                            body: [
                                [
                                    { text: 'Gesamtanzahl rabbatierte Artikel:', bold: true },
                                    { text: formatNumber(totalItems, true), alignment: 'right' }
                                ],
                                [
                                    { text: 'Gesamtwert (Brutto):', bold: true },
                                    { text: `${formatNumber(totalValue.toFixed(2))} €`, alignment: 'right' }
                                ],
                                [
                                    { text: 'Naturalrabatt (25%):', bold: true },
                                    { text: `${formatNumber(totalNaturalrabatt.toFixed(2))} €`, alignment: 'right' }
                                ]
                            ]
                        },
                        layout: {
                            hLineWidth: function(i, node) { return 0.5; },
                            vLineWidth: function(i, node) { return 0; },
                            hLineColor: function(i, node) { return '#aaa'; }
                        },
                        margin: [0, 0, 0, 20]
                    },
                    {
                        text: 'Detaillierte Artikelliste',
                        style: 'sectionHeader',
                        margin: [0, 20, 0, 10]
                    },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto'],
                            body: [
                                [
                                    { text: 'Nr.', style: 'tableHeader', alignment: 'center' },
                                    { text: 'SAP-Nr.', style: 'tableHeader', alignment: 'center' },
                                    { text: 'Artikelbezeichnung', style: 'tableHeader' },
                                    { text: 'Menge', style: 'tableHeader', alignment: 'center' },
                                    { text: 'Rabattpreis/Stück', style: 'tableHeader', alignment: 'right' },
                                    { text: 'Gesamtbetrag', style: 'tableHeader', alignment: 'right' }
                                ],
                                ...reportData.map(item => [
                                    { text: item.indexNumber, alignment: 'center' },
                                    { text: item.sapNr, alignment: 'center' },
                                    { text: item.article },
                                    { text: item.rabbatiertCount, alignment: 'center' },
                                    { text: item.brutto, alignment: 'right' },
                                    { text: item.sumRabbatiert, alignment: 'right' }
                                ])
                            ]
                        },
                        layout: {
                            hLineWidth: function(i, node) { return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5; },
                            vLineWidth: function(i, node) { return 0.5; },
                            hLineColor: function(i, node) { return (i === 0 || i === 1) ? 'black' : '#aaa'; },
                            vLineColor: function(i, node) { return '#aaa'; }
                        }
                    },
                    {
                        text: [
                            '\nErklärung: Die aufgeführten Artikel wurden mit 50% Rabatt verkauft ',
                            'und sind somit für die 25% Naturalrabatt-Vergütung qualifiziert.\n'
                        ],
                        margin: [0, 20, 0, 10],
                        fontSize: 10
                    },
                    {
                        table: {
                            widths: ['*'],
                            body: [
                                [
                                    { 
                                        text: [
                                            { text: 'Dokument-Verifizierung\n\n', bold: true },
                                            `Erstellt am: ${today}\n`,
                                            `Dokument-ID: ${documentId}\n`
                                        ], 
                                        alignment: 'left',
                                        fontSize: 9
                                    }
                                ]
                            ]
                        },
                        layout: {
                            hLineWidth: function(i, node) { return 0.5; },
                            vLineWidth: function(i, node) { return 0.5; },
                            hLineColor: function(i, node) { return '#aaa'; },
                            vLineColor: function(i, node) { return '#aaa'; }
                        },
                        margin: [0, 10, 0, 0]
                    }
                ],
                styles: {
                    sectionHeader: {
                        fontSize: 12,
                        bold: true,
                        decoration: 'underline'
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
                        fillColor: '#f0f0f0'
                    }
                },
                defaultStyle: {
                    fontSize: 10
                }
            };

            console.log("Generating PDF with document ID:", documentId);
            // Generate and download PDF
            pdfMake.createPdf(docDefinition).download(`Naturalrabatt_${today.replace(/\./g, '-')}_${documentId}.pdf`);
            showNotification('Report generated successfully.', 'success');
        } catch (error) {
            console.error('Error generating report:', error);
            showNotification(`Failed to generate report: ${error.message}`, 'error');
        }
    }
    
    // Helper function to generate a unique document ID
    function generateDocumentId() {
        const timestamp = new Date().getTime().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 5);
        return `NR-${timestamp}-${randomPart}`.toUpperCase();
    }
    
    // Helper function to get user info (or placeholder if not available)
    function getUserInfo() {
        // Use current user if available, otherwise use a placeholder
        return window.currentUser || 'System';
    }

    return {
        generateNRReport
    };
}
