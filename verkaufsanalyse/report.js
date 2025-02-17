function initializeReports(tableElement) {
    const table = tableElement.DataTable();

    function formatNumber(num) {
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    function generateNRReport() {
        const today = new Date().toLocaleDateString('de-DE');
        
        // Collect only rows with rabbatiert items
        const reportData = [];
        table.rows().every(function() {
            const $row = $(this.node());
            const rabbatiertCount = parseInt($row.find('.rabbatiert').val()) || 0;
            
            if (rabbatiertCount > 0) {
                const bruttoPrice = parseFloat($row.find('td:nth-child(8)').text()
                    .replace('€', '')
                    .replace('.', '')
                    .replace(',', '.')
                    .trim()) || 0;
                const totalValue = bruttoPrice * rabbatiertCount;
                
                reportData.push({
                    sapNr: $row.find('td:nth-child(2)').text(),
                    article: $row.find('td:nth-child(3)').text(),
                    brutto: `${formatNumber(bruttoPrice)} €`,
                    rabbatiertCount: rabbatiertCount,
                    totalValue: totalValue,
                    sumRabbatiert: `${formatNumber(totalValue)} €`
                });
            }
        });

        // Only proceed if there are discounted items
        if (reportData.length === 0) {
            alert('No discounted items found for the report.');
            return;
        }

        // Calculate totals
        const totalValue = reportData.reduce((sum, item) => sum + item.totalValue, 0);
        const totalNaturalrabatt = totalValue * 0.25;
        const totalItems = reportData.reduce((sum, item) => sum + item.rabbatiertCount, 0);

        // Create PDF document definition
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            header: {
                text: 'Naturalrabatt-Abrechnung',
                alignment: 'center',
                fontSize: 20,
                bold: true,
                margin: [0, 20, 0, 20]
            },
            footer: function(currentPage, pageCount) {
                return {
                    text: `Seite ${currentPage} von ${pageCount}`,
                    alignment: 'center',
                    fontSize: 10
                };
            },
            content: [
                {
                    text: `Datum: ${today}`,
                    alignment: 'right',
                    margin: [0, 0, 0, 20]
                },
                {
                    text: 'Zusammenfassung',
                    style: 'sectionHeader'
                },
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            ['Gesamtanzahl Rabbatierte Artikel:', formatNumber(totalItems)],
                            ['Gesamtwert (Brutto):', `€${formatNumber(totalValue.toFixed(2))}`],
                            ['Naturalrabatt (25%):', `€${formatNumber(totalNaturalrabatt.toFixed(2))}`]
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 10, 0, 20]
                },
                {
                    text: 'Detaillierte Artikelliste',
                    style: 'sectionHeader'
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'SAP-Nr', style: 'tableHeader' },
                                { text: 'Artikel', style: 'tableHeader' },
                                { text: 'Stück', style: 'tableHeader' },
                                { text: 'Brutto/Stück', style: 'tableHeader' },
                                { text: 'Gesamt', style: 'tableHeader' }
                            ],
                            ...reportData.map(item => [
                                item.sapNr,
                                item.article,
                                item.rabbatiertCount,
                                item.brutto,
                                item.sumRabbatiert
                            ])
                        ]
                    }
                },
                {
                    text: [
                        '\n\nHiermit wird bestätigt, dass die aufgeführten Artikel mit 50% Rabatt verkauft wurden ',
                        'und somit für die 25% Naturalrabatt-Vergütung qualifiziert sind.'
                    ],
                    margin: [0, 20, 0, 40]
                },
                {
                    columns: [
                        {
                            width: '*',
                            text: '_______________________\nDatum',
                            alignment: 'center'
                        },
                        {
                            width: '*',
                            text: '_______________________\nUnterschrift',
                            alignment: 'center'
                        }
                    ]
                }
            ],
            styles: {
                sectionHeader: {
                    fontSize: 14,
                    bold: true,
                    margin: [0, 15, 0, 10]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 12,
                    fillColor: '#f3f3f3'
                }
            },
            defaultStyle: {
                fontSize: 11
            }
        };

        // Generate and download PDF
        pdfMake.createPdf(docDefinition).download(`Naturalrabatt_${today.replace(/\./g, '-')}.pdf`);
    }

    return {
        generateNRReport
    };
}
