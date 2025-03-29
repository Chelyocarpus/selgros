function initializeMarketing(tableElement) {
    const table = tableElement.DataTable();

    function generateMarketingReport() {
        // Generate report data with improved structure
        const reportData = collectSalesData();
        const analysis = analyzeData(reportData);
        
        // Generate document ID for tracking
        const documentId = generateDocumentId();
        const today = new Date().toLocaleDateString('de-DE');
        
        // Create modern, professional report definition
        const docDefinition = createReportDefinition(analysis, reportData, documentId, today);
        
        // Generate and download PDF
        pdfMake.createPdf(docDefinition).download(`MarketingAnalyse_${today.replace(/\./g, '-')}.pdf`);
        
        // Show success notification
        showNotification('Marketing report generated successfully.', 'success');
    }

    function collectSalesData() {
        const data = {
            products: [],
            totals: {
                revenue: 0,
                regularSales: 0,
                discountedSales: 0,
                profit: 0,
                profitWithoutNR: 0,
                naturalRabatt: 0,
                cost: 0,
                loss: 0,
                lostItems: 0,
                lossValue: 0,
                topSellingItems: 0
            }
        };

        table.rows().every(function() {
            const $row = $(this.node());
            
            // Extract main values from row
            const verkauft = parseInt($row.find('.verkauft').val()) || 0;
            const rabbatiert = parseInt($row.find('.rabbatiert').val()) || 0;
            const schwund = parseInt($row.find('.schwund').val()) || 0;
            const article = $row.find('td:nth-child(4)').text().trim();
            const sapNr = $row.find('td:nth-child(3)').text().trim();
            
            // Parse prices with German formatting
            const bruttoPrice = window.utils.parseGermanNumber($row.find('td:nth-child(8)').text()) || 0;
            const ekPrice = window.utils.parseGermanNumber($row.find('td:nth-child(6)').text()) || 0;
            
            // Only include rows with relevant data
            if (verkauft > 0 || rabbatiert > 0 || schwund > 0) {
                // Calculate values
                const lossValue = schwund * ekPrice;
                const totalSold = verkauft + rabbatiert;
                const sumRabbatiertText = $row.find('.sumRabbatiert').text().trim();
                const discountedSales = window.utils.parseGermanNumber(sumRabbatiertText) || 0;
                const revenue = parseFloat($row.find('.sumGesamt').text().replace('€', '').trim()) || 0;
                const profit = parseFloat($row.find('.sumProfit').text().replace('€', '').trim()) || 0;
                
                // Calculate NR value for this product (25% of discounted sales)
                const productNR = discountedSales * 0.25;
                
                // Create product object
                const product = {
                    sapNr: sapNr,
                    article: article,
                    regularSales: verkauft,
                    discountedSales: rabbatiert,
                    lostItems: schwund, 
                    price: bruttoPrice,
                    cost: ekPrice,
                    revenue: revenue,
                    profit: profit,
                    lossValue: lossValue,
                    totalSold: totalSold,
                    discountedValue: discountedSales,
                    naturalRabatt: productNR,
                    profitWithoutNR: profit - productNR,
                    marginPercentage: totalSold > 0 ? (profit / revenue * 100) : 0
                };
                
                // Add to products array
                data.products.push(product);
                
                // Update totals
                data.totals.revenue += revenue;
                data.totals.regularSales += verkauft;
                data.totals.discountedSales += discountedSales;
                data.totals.naturalRabatt += productNR;
                data.totals.profit += profit;
                data.totals.profitWithoutNR += (profit - productNR);
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
        const profitMarginWithoutNR = (data.totals.profitWithoutNR / data.totals.revenue * 100) || 0;
        const discountRate = totalSales > 0 ? (data.totals.discountedSales / totalSales * 100) : 0;
        const nrImpact = profitMargin - profitMarginWithoutNR;
        
        // Sort products by different metrics for various analyses
        const byRevenue = [...data.products].sort((a, b) => b.revenue - a.revenue);
        const byProfit = [...data.products].sort((a, b) => b.profit - a.profit);
        const byVolume = [...data.products].sort((a, b) => b.totalSold - a.totalSold);
        const byLoss = [...data.products].sort((a, b) => b.lostItems - a.lostItems);
        const byNR = [...data.products].sort((a, b) => b.naturalRabatt - a.naturalRabatt);
        
        // Get top performers
        const topRevenueProducts = byRevenue.slice(0, 5);
        const topProfitProducts = byProfit.slice(0, 5);
        const topVolumeProducts = byVolume.slice(0, 5);
        const topNRProducts = byNR.filter(p => p.naturalRabatt > 0).slice(0, 5);
        
        // Get problem products
        const highLossProducts = byLoss.filter(p => p.lostItems > 0).slice(0, 5);
        const lowMarginProducts = [...data.products]
            .filter(p => p.revenue > 0 && p.totalSold > 5)
            .sort((a, b) => a.marginPercentage - b.marginPercentage)
            .slice(0, 5);
        
        // Calculate market share for top products
        const topProductsRevenue = topRevenueProducts.reduce((sum, p) => sum + p.revenue, 0);
        const marketShare = (topProductsRevenue / data.totals.revenue * 100) || 0;

        // Find most discounted products
        const mostDiscountedProducts = [...data.products]
            .filter(p => p.totalSold > 0)
            .sort((a, b) => (b.discountedSales) - (a.discountedSales))
            .slice(0, 5);

        return {
            ...data.totals,
            profitMargin,
            profitMarginWithoutNR,
            nrImpact,
            discountRate,
            topRevenueProducts,
            topProfitProducts,
            topVolumeProducts,
            topNRProducts,
            highLossProducts,
            lowMarginProducts,
            mostDiscountedProducts,
            marketShare,
            totalSales,
            averageTransactionValue: totalSales > 0 ? (data.totals.revenue / totalSales) : 0
        };
    }

    function createReportDefinition(analysis, reportData, documentId, today) {
        return {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            header: createHeader(documentId, today),
            footer: createFooter(today),
            content: [
                createExecutiveSummary(analysis),
                createFinancialOverview(analysis),
                createNaturalRabattAnalysis(analysis),
                createProductPerformance(analysis),
                createInventoryAnalysis(analysis),
                createRecommendations(analysis)
            ],
            styles: createStyles(),
            defaultStyle: {
                fontSize: 10,
                lineHeight: 1.2
            }
        };
    }

    function createHeader(documentId, today) {
        return {
            columns: [
                {
                    stack: [
                        { text: 'VERKAUFSANALYSE', style: 'reportTitle' },
                        { text: `Berichtsdatum: ${today}`, style: 'reportSubtitle' }
                    ],
                    width: '*'
                },
                {
                    stack: [
                        { text: 'VERTRAULICH', style: 'confidential' },
                        { text: `Ref: ${documentId}`, style: 'reportRef' }
                    ],
                    width: 'auto',
                    alignment: 'right'
                }
            ],
            margin: [40, 20, 40, 40]
        };
    }

    function createFooter(today) {
        return function(currentPage, pageCount) {
            return {
                columns: [
                    { text: `Generiert am: ${today}`, alignment: 'left', margin: [40, 0, 0, 0], fontSize: 8 },
                    { text: `Seite ${currentPage} von ${pageCount}`, alignment: 'right', margin: [0, 0, 40, 0], fontSize: 8 }
                ]
            };
        };
    }

    function createExecutiveSummary(analysis) {
        return {
            stack: [
                { text: 'Zusammenfassung', style: 'sectionHeader' },
                {
                    columns: [
                        {
                            stack: [
                                {
                                    text: [
                                        `In diesem Zeitraum wurden insgesamt ${formatNumber(analysis.totalSales)} Artikel verkauft, `,
                                        `was einen Umsatz von ${formatCurrency(analysis.revenue)} generierte. `,
                                        `Die Gewinnmarge beträgt ${formatNumber(analysis.profitMargin, 1)}% `,
                                        `(${formatNumber(analysis.profitMarginWithoutNR, 1)}% ohne NR-Erstattung). `,
                                        `Der Naturalrabatt (NR) beträgt ${formatCurrency(analysis.naturalRabatt)} und erhöht den Gewinn um ${formatNumber(analysis.nrImpact, 1)} Prozentpunkte.\n\n`,
                                        `Der Verlust durch Schwund beträgt ${formatCurrency(analysis.lossValue)} (${analysis.lostItems} Artikel). `,
                                        `Die Top 5 Produkte machen ${formatNumber(analysis.marketShare, 1)}% des Gesamtumsatzes aus. `,
                                        `Die Rabattstrategie zeigt eine Nutzungsrate von ${formatNumber(analysis.discountRate, 1)}%.`
                                    ],
                                    style: 'paragraph'
                                }
                            ],
                            width: '*'
                        }
                    ]
                }
            ],
            margin: [0, 0, 0, 20]
        };
    }

    function createFinancialOverview(analysis) {
        return {
            stack: [
                { text: 'Finanzübersicht', style: 'sectionHeader' },
                {
                    columns: [
                        createMetricBox('Umsatz & Gewinn', [
                            ['Gesamtumsatz', formatCurrency(analysis.revenue)],
                            ['Gewinnmarge', `${formatNumber(analysis.profitMargin, 1)}%`],
                            ['Gesamtgewinn', formatCurrency(analysis.profit)]
                        ], 'revenue'),
                        createMetricBox('Naturalrabatt (NR)', [
                            ['NR-Erstattung', formatCurrency(analysis.naturalRabatt)],
                            ['Gewinn ohne NR', formatCurrency(analysis.profitWithoutNR)],
                            ['Marge ohne NR', `${formatNumber(analysis.profitMarginWithoutNR, 1)}%`]
                        ], 'nr'),
                        createMetricBox('Bestandsverluste', [
                            ['Verlorene Artikel', formatNumber(analysis.lostItems, 0)],
                            ['Verlustwert', formatCurrency(analysis.lossValue)],
                            ['Verlustrate', `${formatNumber((analysis.lostItems / (analysis.totalSales + analysis.lostItems)) * 100, 1)}%`]
                        ], 'loss')
                    ],
                    columnGap: 15
                },
                {
                    canvas: [createRevenueChart(analysis)],
                    margin: [0, 20, 0, 0]
                },
                {
                    text: 'Umsatzverteilung und Gewinnentwicklung',
                    fontSize: 9,
                    alignment: 'center',
                    margin: [0, 5, 0, 20]
                }
            ],
            margin: [0, 0, 0, 30]
        };
    }

    function createRevenueChart(analysis) {
        // Basic revenue split chart (regular sales vs discounted)
        const regularSalesRatio = analysis.regularSales / (analysis.regularSales + analysis.discountedSales) || 0;
        const discountedSalesRatio = analysis.discountedSales / (analysis.regularSales + analysis.discountedSales) || 0;
        
        return {
            type: 'line',
            x1: 0, y1: 0,
            x2: 400, y2: 0,
            lineWidth: 1,
            lineColor: '#cccccc'
        };
    }

    function createNaturalRabattAnalysis(analysis) {
        return {
            stack: [
                { text: 'Naturalrabatt (NR) Analyse', style: 'sectionHeader' },
                {
                    columns: [
                        {
                            stack: [
                                {
                                    text: [
                                        `Der Naturalrabatt (NR) ist eine Erstattung in Höhe von 25% des Umsatzes aus rabattierten Artikeln. `,
                                        `In diesem Zeitraum beträgt der NR insgesamt ${formatCurrency(analysis.naturalRabatt)}, `,
                                        `was die Gewinnmarge um ${formatNumber(analysis.nrImpact, 1)} Prozentpunkte verbessert.`
                                    ],
                                    style: 'paragraph',
                                    margin: [0, 0, 0, 15]
                                },
                                { text: 'Artikel mit höchstem NR-Beitrag', style: 'subheader' },
                                createNRProductsTable(analysis.topNRProducts)
                            ],
                            width: '*'
                        },
                        {
                            stack: [
                                {
                                    table: {
                                        widths: ['*', 'auto'],
                                        body: [
                                            [
                                                { text: 'NR-Übersicht', style: 'tableHeader', colSpan: 2, alignment: 'center' },
                                                {}
                                            ],
                                            ['Rabattierter Umsatz', formatCurrency(analysis.discountedSales)],
                                            ['NR-Erstattung (25%)', formatCurrency(analysis.naturalRabatt)],
                                            ['Gewinn mit NR', formatCurrency(analysis.profit)],
                                            ['Gewinn ohne NR', formatCurrency(analysis.profitWithoutNR)],
                                            ['NR-Anteil am Gewinn', `${formatNumber((analysis.naturalRabatt / analysis.profit) * 100, 1)}%`]
                                        ]
                                    },
                                    layout: {
                                        hLineWidth: function(i, node) { return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5; },
                                        vLineWidth: function(i, node) { return 0; },
                                        hLineColor: function(i, node) { return (i === 0 || i === 1) ? 'black' : '#dddddd'; },
                                        fillColor: function(rowIndex, node, columnIndex) {
                                            if (rowIndex === 0) return '#e3f2fd';
                                            return (rowIndex % 2 === 0) ? '#f9f9f9' : null;
                                        }
                                    },
                                    margin: [0, 0, 0, 15]
                                },
                                { 
                                    canvas: [
                                        {
                                            type: 'rect',
                                            x: 0, y: 0,
                                            w: 200, h: 20,
                                            color: '#90caf9'
                                        },
                                        {
                                            type: 'rect',
                                            x: 0, y: 30,
                                            w: analysis.naturalRabatt / analysis.profit * 200, h: 20,
                                            color: '#26a69a'
                                        },
                                        {
                                            type: 'text',
                                            x: 10, y: 14,
                                            text: 'Gesamtgewinn',
                                            fontSize: 10
                                        },
                                        {
                                            type: 'text',
                                            x: 10, y: 44,
                                            text: 'NR-Anteil',
                                            fontSize: 10
                                        }
                                    ]
                                }
                            ],
                            width: '*'
                        }
                    ],
                    columnGap: 15
                }
            ],
            margin: [0, 0, 0, 30]
        };
    }
    
    function createNRProductsTable(products) {
        return {
            table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto'],
                body: [
                    [
                        { text: 'Artikel', style: 'tableHeader' },
                        { text: 'Rabatt-Umsatz', style: 'tableHeader', alignment: 'right' },
                        { text: 'NR-Beitrag', style: 'tableHeader', alignment: 'right' }
                    ],
                    ...products.map(item => [
                        truncateText(item.article, 30),
                        { text: formatCurrency(item.discountedValue), alignment: 'right' },
                        { text: formatCurrency(item.naturalRabatt), alignment: 'right' }
                    ])
                ]
            },
            layout: {
                hLineWidth: function(i, node) { return (i === 0 || i === 1) ? 1 : 0.5; },
                vLineWidth: function(i, node) { return 0; },
                hLineColor: function(i, node) { return (i === 0 || i === 1) ? '#999999' : '#dddddd'; },
                fillColor: function(rowIndex, node, columnIndex) {
                    return (rowIndex % 2 === 0 && rowIndex > 0) ? '#f9f9f9' : null;
                }
            }
        };
    }

    function createProductPerformance(analysis) {
        return {
            stack: [
                { text: 'Produktleistung', style: 'sectionHeader' },
                {
                    columns: [
                        // Top revenue products
                        {
                            stack: [
                                { text: 'Top Umsatzartikel', style: 'subheader' },
                                createTopProductsTable(analysis.topRevenueProducts, 'revenue')
                            ],
                            width: '*'
                        },
                        // Top profit products
                        {
                            stack: [
                                { text: 'Top Gewinnbringer', style: 'subheader' },
                                createTopProductsTable(analysis.topProfitProducts, 'profit')
                            ],
                            width: '*'
                        }
                    ],
                    columnGap: 15,
                    margin: [0, 0, 0, 20]
                },
                {
                    columns: [
                        // Most popular (by volume)
                        {
                            stack: [
                                { text: 'Verkaufsstärkste Artikel', style: 'subheader' },
                                createTopProductsTable(analysis.topVolumeProducts, 'volume')
                            ],
                            width: '*'
                        },
                        // Most discounted products
                        {
                            stack: [
                                { text: 'Artikel mit höchstem Rabattumsatz', style: 'subheader' },
                                createTopProductsTable(analysis.mostDiscountedProducts, 'discount')
                            ],
                            width: '*'
                        }
                    ],
                    columnGap: 15
                }
            ],
            margin: [0, 0, 0, 30]
        };
    }

    function createInventoryAnalysis(analysis) {
        return {
            stack: [
                { text: 'Bestandsanalyse und Problembereiche', style: 'sectionHeader' },
                {
                    columns: [
                        // Products with high loss
                        {
                            stack: [
                                { text: 'Artikel mit höchstem Schwund', style: 'subheader' },
                                createProblemProductsTable(analysis.highLossProducts, 'loss')
                            ],
                            width: '*'
                        },
                        // Products with low margin
                        {
                            stack: [
                                { text: 'Artikel mit niedriger Marge', style: 'subheader' },
                                createProblemProductsTable(analysis.lowMarginProducts, 'margin')
                            ],
                            width: '*'
                        }
                    ],
                    columnGap: 15
                }
            ],
            margin: [0, 0, 0, 30]
        };
    }

    function createRecommendations(analysis) {
        // Generate specific, data-driven recommendations
        const recommendations = generateRecommendations(analysis);
        
        return {
            stack: [
                { text: 'Empfehlungen', style: 'sectionHeader' },
                {
                    ul: recommendations,
                    margin: [0, 10, 0, 0]
                }
            ],
            margin: [0, 0, 0, 20]
        };
    }

    function generateRecommendations(analysis) {
        const recommendations = [];
        
        // Revenue-based recommendations
        if (analysis.profitMargin < 15) {
            recommendations.push('Die Gewinnmarge liegt unter dem Zielwert von 15%. Preisstrategien sollten überprüft werden.');
        } else {
            recommendations.push('Die aktuelle Gewinnmarge ist gesund. Beibehalten Sie die aktuelle Preisstrategie.');
        }

        // NR-based recommendations
        const nrPercentage = (analysis.naturalRabatt / analysis.profit) * 100;
        if (nrPercentage > 30) {
            recommendations.push(`Der NR-Anteil am Gewinn ist mit ${formatNumber(nrPercentage, 1)}% sehr hoch. Die Rabattierung sollte überwacht werden.`);
        } else if (nrPercentage > 0) {
            recommendations.push(`Der NR-Anteil am Gewinn beträgt ${formatNumber(nrPercentage, 1)}% und verbessert die Marge deutlich.`);
        }

        // Loss-related recommendations
        const lossRate = (analysis.lostItems / (analysis.totalSales + analysis.lostItems)) * 100;
        if (lossRate > 5) {
            recommendations.push('Die Verlustrate ist mit über 5% kritisch hoch. Implementieren Sie strengere Bestandskontrollen.');
        } else if (lossRate > 2) {
            recommendations.push('Die Verlustrate liegt über dem Branchendurchschnitt. Überprüfen Sie die Bestandsführung.');
        }

        // Discount strategy recommendations
        if (analysis.discountRate > 30) {
            recommendations.push('Der Anteil rabattierter Artikel ist sehr hoch. Rabattstrategie sollte überprüft werden.');
        } else if (analysis.discountRate < 10) {
            recommendations.push('Der Rabattanteil ist niedrig. Erwägen Sie gezielte Aktionen zur Steigerung des Umsatzvolumens.');
        }

        // Product-specific recommendations
        if (analysis.highLossProducts.length > 0) {
            recommendations.push(`Fokus-Artikel für Schwundreduzierung: "${truncateText(analysis.highLossProducts[0].article, 30)}"`);
        }

        if (analysis.lowMarginProducts.length > 0) {
            recommendations.push(`Preisanpassung empfohlen für: "${truncateText(analysis.lowMarginProducts[0].article, 30)}"`);
        }
        
        // NR product recommendations
        if (analysis.topNRProducts.length > 0) {
            const topNRProduct = analysis.topNRProducts[0];
            recommendations.push(`"${truncateText(topNRProduct.article, 30)}" erzielt den höchsten NR-Beitrag (${formatCurrency(topNRProduct.naturalRabatt)}).`);
        }

        return recommendations;
    }

    function createMetricBox(title, data, type) {
        const boxColors = {
            revenue: '#e3f2fd',
            sales: '#e8f5e9',
            loss: '#ffebee',
            nr: '#e0f2f1'
        };
        
        return {
            stack: [
                { text: title, style: 'metricHeader' },
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: data
                    },
                    layout: {
                        hLineWidth: function(i, node) { return 0; },
                        vLineWidth: function(i, node) { return 0; },
                        fillColor: boxColors[type] || '#f5f5f5'
                    }
                }
            ],
            width: '*',
            margin: [0, 10, 0, 0]
        };
    }

    function createTopProductsTable(products, type) {
        let valueKey, headerText;
        
        // Set the right value key and header based on type
        switch(type) {
            case 'volume':
                valueKey = 'totalSold';
                headerText = 'Stück';
                break;
            case 'margin':
                valueKey = 'marginPercentage';
                headerText = 'Marge';
                break;
            case 'discount':
                valueKey = 'discountedValue';
                headerText = 'Rabatt-Umsatz';
                break;
            case 'revenue':
                valueKey = 'revenue';
                headerText = 'Umsatz';
                break;
            case 'profit':
            default:
                valueKey = 'profit';
                headerText = 'Gewinn';
                break;
        }
        
        const formatter = (type === 'volume') ? 
            (val) => formatNumber(val, 0) :
            (type === 'margin') ? 
                (val) => `${formatNumber(val, 1)}%` :
                (val) => formatCurrency(val);
        
        return {
            table: {
                headerRows: 1,
                widths: ['*', 'auto'],
                body: [
                    [
                        { text: 'Artikel', style: 'tableHeader' },
                        { text: headerText, style: 'tableHeader', alignment: 'right' }
                    ],
                    ...products.map(item => [
                        truncateText(item.article, 30),
                        { text: formatter(item[valueKey]), alignment: 'right' }
                    ])
                ]
            },
            layout: {
                hLineWidth: function(i, node) { return (i === 0 || i === 1) ? 1 : 0.5; },
                vLineWidth: function(i, node) { return 0; },
                hLineColor: function(i, node) { return (i === 0 || i === 1) ? '#999999' : '#dddddd'; },
                fillColor: function(rowIndex, node, columnIndex) {
                    return (rowIndex % 2 === 0 && rowIndex > 0) ? '#f9f9f9' : null;
                }
            }
        };
    }

    function createProblemProductsTable(products, type) {
        const isLoss = type === 'loss';
        
        return {
            table: {
                headerRows: 1,
                widths: ['*', 'auto'],
                body: [
                    [
                        { text: 'Artikel', style: 'tableHeader' },
                        { text: isLoss ? 'Schwund' : 'Marge', style: 'tableHeader', alignment: 'right' }
                    ],
                    ...products.map(item => [
                        truncateText(item.article, 30),
                        { 
                            text: isLoss ? 
                                formatNumber(item.lostItems, 0) : 
                                `${formatNumber(item.marginPercentage, 1)}%`, 
                            alignment: 'right' 
                        }
                    ])
                ]
            },
            layout: {
                hLineWidth: function(i, node) { return (i === 0 || i === 1) ? 1 : 0.5; },
                vLineWidth: function(i, node) { return 0; },
                hLineColor: function(i, node) { return (i === 0 || i === 1) ? '#999999' : '#dddddd'; },
                fillColor: function(rowIndex, node, columnIndex) {
                    return (rowIndex % 2 === 0 && rowIndex > 0) ? '#fff4f4' : null;
                }
            }
        };
    }

    function createStyles() {
        return {
            reportTitle: {
                fontSize: 24,
                bold: true,
                color: '#1976D2',
                margin: [0, 0, 0, 5]
            },
            reportSubtitle: {
                fontSize: 12,
                color: '#757575'
            },
            reportRef: {
                fontSize: 8,
                color: '#757575'
            },
            confidential: {
                fontSize: 10,
                color: '#D32F2F',
                bold: true,
                margin: [0, 0, 0, 5]
            },
            sectionHeader: {
                fontSize: 14,
                bold: true,
                color: '#1976D2',
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 12,
                bold: true,
                color: '#424242',
                margin: [0, 0, 0, 5]
            },
            metricHeader: {
                fontSize: 12,
                bold: true,
                color: '#424242',
                margin: [0, 0, 0, 5]
            },
            tableHeader: {
                bold: true,
                fontSize: 10,
                color: '#424242'
            },
            paragraph: {
                fontSize: 10,
                lineHeight: 1.3,
                color: '#424242'
            }
        };
    }

    // Helper functions for formatting
    function formatCurrency(value) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    function formatNumber(value, decimals = 2) {
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }

    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Generate unique document ID
    function generateDocumentId() {
        const timestamp = new Date().getTime().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 5);
        return `MKT-${timestamp}-${randomPart}`.toUpperCase();
    }

    // Helper function to show notifications
    function showNotification(message, type) {
        if (!window.showNotification) {
            console.log(message);
            return;
        }
        window.showNotification(message, type);
    }

    return {
        generateMarketingReport
    };
}
