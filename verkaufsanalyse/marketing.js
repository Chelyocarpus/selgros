function initializeMarketing(tableElement) {
    const table = tableElement.DataTable();

    function generateMarketingReport() {
        const today = new Date().toLocaleDateString('de-DE');
        const reportData = collectSalesData();
        const analysis = analyzeData(reportData);

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            header: createHeader(),
            footer: createFooter(today),
            content: [
                createExecutiveSummary(analysis),
                createKeyMetrics(analysis),
                createSalesAnalysis(analysis),
                createProductPerformance(reportData),
                createRecommendations(analysis)
            ],
            styles: createStyles(),
            defaultStyle: {
                fontSize: 11,
                lineHeight: 1.2
            }
        };

        // Generate and download PDF
        pdfMake.createPdf(docDefinition).download(`SalesAnalysis_${today.replace(/\./g, '-')}.pdf`);
    }

    function collectSalesData() {
        const data = {
            products: [],
            totals: {
                revenue: 0,
                regularSales: 0,
                discountedSales: 0,
                profit: 0,
                cost: 0,
                loss: 0,          // Add loss tracking
                lostItems: 0,     // Add lost items count
                lossValue: 0      // Add loss value in euros
            }
        };

        table.rows().every(function() {
            const $row = $(this.node());
            const verkauft = parseInt($row.find('.verkauft').val()) || 0;
            const rabbatiert = parseInt($row.find('.rabbatiert').val()) || 0;
            const schwund = parseInt($row.find('.schwund').val()) || 0;
            const bruttoPrice = parseFloat($row.find('td:nth-child(8)').text().replace('€', '').trim()) || 0;
            const ekPrice = parseFloat($row.find('td:nth-child(5)').text().replace('€', '').trim()) || 0;
            
            if (verkauft > 0 || rabbatiert > 0 || schwund > 0) {  // Include schwund in condition
                const lossValue = schwund * ekPrice;  // Calculate loss value
                
                const product = {
                    article: $row.find('td:nth-child(3)').text(),
                    regularSales: verkauft,
                    discountedSales: rabbatiert,
                    lostItems: schwund,
                    price: bruttoPrice,
                    cost: ekPrice,
                    revenue: parseFloat($row.find('.sumGesamt').text()),
                    profit: parseFloat($row.find('.sumProfit').text()),
                    lossValue: lossValue
                };
                
                data.products.push(product);
                data.totals.revenue += product.revenue;
                data.totals.regularSales += verkauft;
                data.totals.discountedSales += rabbatiert;
                data.totals.profit += product.profit;
                data.totals.cost += (verkauft + rabbatiert) * ekPrice;
                data.totals.lostItems += schwund;
                data.totals.lossValue += lossValue;
            }
        });

        return data;
    }

    function analyzeData(data) {
        const totalSales = data.totals.regularSales + data.totals.discountedSales;
        const profitMargin = (data.totals.profit / data.totals.revenue * 100) || 0;
        const discountRate = (data.totals.discountedSales / totalSales * 100) || 0;
        
        // Sort products by revenue
        const sortedProducts = [...data.products].sort((a, b) => b.revenue - a.revenue);
        const topProducts = sortedProducts.slice(0, 3);
        
        // Calculate market share for top products
        const topProductsRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);
        const marketShare = (topProductsRevenue / data.totals.revenue * 100) || 0;

        return {
            ...data.totals,
            profitMargin,
            discountRate,
            topProducts,
            marketShare,
            totalSales,
            averageTransactionValue: data.totals.revenue / totalSales || 0
        };
    }

    function createHeader() {
        return {
            columns: [
                {
                    text: 'Verkaufsanalyse',
                    alignment: 'right',
                    margin: [0, 20, 40, 0],
                    fontSize: 24,
                    bold: true,
                    color: '#2185d0'
                }
            ]
        };
    }

    function createFooter(today) {
        return function(currentPage, pageCount) {
            return {
                columns: [
                    { text: `Bericht erstellt am: ${today}`, alignment: 'left', margin: [40, 0, 0, 0], fontSize: 8 },
                    { text: `Seite ${currentPage} von ${pageCount}`, alignment: 'right', margin: [0, 0, 40, 0], fontSize: 8 }
                ]
            };
        };
    }

    function createExecutiveSummary(analysis) {
        return {
            stack: [
                { text: 'Zusammenfassung', style: 'mainHeader' },
                {
                    text: [
                        `Dieser Bericht analysiert unsere Verkaufsleistung und Bestandsverluste. `,
                        `Mit einem Gesamtumsatz von €${analysis.revenue.toFixed(2)} wurde eine Gewinnmarge von ${analysis.profitMargin.toFixed(1)}% erreicht. `,
                        `Wir verzeichneten einen Verlust von €${analysis.lossValue.toFixed(2)} durch ${analysis.lostItems} verlorene Artikel. `,
                        `Unsere Top 3 Produkte machen ${analysis.marketShare.toFixed(1)}% des Gesamtumsatzes aus. `,
                        `Die Rabattstrategie zeigt eine Nutzungsrate von ${analysis.discountRate.toFixed(1)}%.`
                    ],
                    style: 'paragraph'
                }
            ],
            margin: [0, 0, 0, 20]
        };
    }

    function createKeyMetrics(analysis) {
        return {
            columns: [
                createMetricBox('Umsatzleistung', [
                    ['Gesamtumsatz', `€${analysis.revenue.toFixed(2)}`],
                    ['Gewinnmarge', `${analysis.profitMargin.toFixed(1)}%`],
                    ['Gesamtgewinn', `€${analysis.profit.toFixed(2)}`]
                ]),
                createMetricBox('Verlustanalyse', [  // New metrics box
                    ['Verlorene Artikel', analysis.lostItems],
                    ['Verlustwert', `€${analysis.lossValue.toFixed(2)}`],
                    ['Verlustrate', `${((analysis.lostItems / (analysis.totalSales + analysis.lostItems)) * 100).toFixed(1)}%`]
                ]),
                createMetricBox('Verkaufskennzahlen', [
                    ['Verkaufte Einheiten', analysis.totalSales],
                    ['Durchschn. Verkauf', `€${analysis.averageTransactionValue.toFixed(2)}`],
                    ['Rabattrate', `${analysis.discountRate.toFixed(1)}%`]
                ])
            ],
            columnGap: 20,
            margin: [0, 0, 0, 30]
        };
    }

    function createMetricBox(title, data) {
        return {
            width: 'auto',
            stack: [
                { text: title, style: 'subheader' },
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: data
                    },
                    layout: 'lightHorizontalLines'
                }
            ]
        };
    }

    function createSalesAnalysis(analysis) {
        return {
            stack: [
                { text: 'Vertriebsanalyse', style: 'sectionHeader' },
                {
                    columns: [
                        {
                            width: '60%',
                            stack: [
                                createBarChart(analysis),
                                { text: 'Reguläre vs. Rabattierte Verkäufe', alignment: 'center', margin: [0, 5, 0, 0] }
                            ]
                        },
                        {
                            width: '40%',
                            stack: [
                                { text: 'Wichtige Erkenntnisse', style: 'subheader', margin: [0, 0, 0, 10] },
                                {
                                    ul: [
                                        `Reguläre Verkäufe dominieren mit ${(100 - analysis.discountRate).toFixed(1)}%`,
                                        `Rabattstrategie zeigt ${analysis.discountRate.toFixed(1)}% Nutzung`,
                                        `Gewinnmarge bleibt stabil bei ${analysis.profitMargin.toFixed(1)}%`
                                    ]
                                }
                            ]
                        }
                    ],
                    margin: [0, 10, 0, 20]
                }
            ]
        };
    }

    function createBarChart(analysis) {
        const regularWidth = 200;
        const discountWidth = (200 * analysis.discountRate) / 100;
        
        return {
            canvas: [
                { type: 'rect', x: 0, y: 0, w: regularWidth, h: 30, color: '#2185d0' },
                { type: 'rect', x: 0, y: 40, w: discountWidth, h: 30, color: '#21ba45' }
            ],
            margin: [0, 10, 0, 10]
        };
    }

    function createProductPerformance(data) {
        return {
            stack: [
                { text: 'Produktleistungsanalyse', style: 'sectionHeader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Produkt', style: 'tableHeader' },
                                { text: 'Regulär', style: 'tableHeader' },
                                { text: 'Rabattiert', style: 'tableHeader' },
                                { text: 'Verlust', style: 'tableHeader' },
                                { text: 'Umsatz', style: 'tableHeader' },
                                { text: 'Verlustwert', style: 'tableHeader' }
                            ],
                            ...data.products.map(item => [
                                item.article,
                                item.regularSales,
                                item.discountedSales,
                                item.lostItems,
                                `€${item.revenue.toFixed(2)}`,
                                `€${item.lossValue.toFixed(2)}`
                            ])
                        ]
                    }
                }
            ],
            margin: [0, 0, 0, 20]
        };
    }

    function createRecommendations(analysis) {
        const recommendations = [];
        
        // Revenue-based recommendations
        if (analysis.profitMargin < 20) {
            recommendations.push('Produktmix optimieren, um Gewinnmargen zu verbessern');
        } else {
            recommendations.push('Aktuellen profitablen Produktmix beibehalten');
        }

        // Loss-related recommendations
        const lossRate = (analysis.lostItems / (analysis.totalSales + analysis.lostItems)) * 100;
        if (lossRate > 5) {
            recommendations.push('Dringend: Bestandskontrollmaßnahmen zur Reduzierung der hohen Verlustrate einführen');
        } else if (lossRate > 2) {
            recommendations.push('Bestandsmanagementverfahren zur Minimierung von Verlusten überprüfen');
        }

        // High-loss products recommendations
        const highLossProducts = analysis.topProducts.filter(p => p.lostItems > 0);
        if (highLossProducts.length > 0) {
            recommendations.push(`Verluste reduzieren bei: ${highLossProducts[0].article}`);
        }

        // Discount strategy recommendations
        if (analysis.discountRate > 30) {
            recommendations.push('Rabattstrategie überprüfen - aktuelle Rate könnte die Rentabilität beeinträchtigen');
        }

        return {
            stack: [
                { text: 'Handlungsempfehlungen', style: 'sectionHeader' },
                {
                    ul: recommendations
                }
            ],
            margin: [0, 0, 0, 20]
        };
    }

    function createStyles() {
        return {
            mainHeader: {
                fontSize: 20,
                bold: true,
                color: '#2185d0',
                margin: [0, 0, 0, 10]
            },
            sectionHeader: {
                fontSize: 16,
                bold: true,
                color: '#666666',
                margin: [0, 15, 0, 10]
            },
            subheader: {
                fontSize: 14,
                bold: true,
                color: '#666666',
                margin: [0, 10, 0, 5]
            },
            tableHeader: {
                bold: true,
                fillColor: '#f3f3f3'
            },
            paragraph: {
                fontSize: 11,
                lineHeight: 1.5,
                margin: [0, 5, 0, 10]
            }
        };
    }

    return {
        generateMarketingReport
    };
}
