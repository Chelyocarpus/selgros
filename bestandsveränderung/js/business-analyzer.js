// Business Analyzer Module - Bestandsveränderung
const BusinessAnalyzer = {
    data: null,
    
    // Column mappings (German to internal)
    COLUMNS: {
        ARTIKEL: 'Artikel',
        ARTIKELTEXT: 'Artikelkurztext',
        BEWEGUNGSART: 'Bewegungsartentext',
        BELEG: 'Artikelbeleg',
        DATUM: 'Erfassungsdatum',
        UHRZEIT: 'Erfassungsuhrzeit',
        MENGE_ERFASS: 'Menge in ErfassME',
        EINHEIT_ERFASS: 'ErfassungsMngEinh',
        MENGE: 'Menge',
        EINHEIT: 'Basismengeneinheit',
        BETRAG_HAUS: 'Betrag Hauswähr',
        BETRAG_EKP: 'Betrag zu EKP',
        VK_WERT: 'VK-Wert mit MWST',
        BENUTZER: 'Name des Benutzers'
    },

    /**
     * Initialize with data
     * @param {Array} data - Sheet data
     */
    init(data) {
        // Filter out canceling transactions and 'Unbekannt' entries before storing
        const filtered = this.filterCancelingTransactions(data);
        this.data = filtered.filter(row => {
            const artikel = row[this.COLUMNS.ARTIKEL];
            const bewegungsart = row[this.COLUMNS.BEWEGUNGSART];
            const benutzer = row[this.COLUMNS.BENUTZER];
            const datum = row[this.COLUMNS.DATUM];
            
            // Exclude rows with 'Unbekannt' in key fields
            return artikel !== 'Unbekannt' && 
                   bewegungsart !== 'Unbekannt' && 
                   benutzer !== 'Unbekannt' &&
                   datum !== 'Unbekannt';
        });
    },

    /**
     * Analyze all data and generate comprehensive report
     * @returns {Object} Complete analysis report
     */
    analyzeAll() {
        if (!this.data || this.data.length === 0) {
            return null;
        }

        return {
            overview: this.getOverview(),
            byArticle: this.analyzeByArticle(),
            byMovementType: this.analyzeByMovementType(),
            byUser: this.analyzeByUser(),
            byDate: this.analyzeByDate(),
            writeOffs: this.analyzeWriteOffs(),
            gains: this.analyzeGains(),
            financial: this.analyzeFinancial()
        };
    },

    /**
     * Get general overview statistics
     * @returns {Object} Overview data
     */
    getOverview() {
        const { MENGE, BETRAG_HAUS, BETRAG_EKP, VK_WERT } = this.COLUMNS;
        
        let totalQuantity = 0;
        let totalBetragHaus = 0;
        let totalBetragEKP = 0;
        let totalVKWert = 0;
        let uniqueArticles = new Set();
        let uniqueUsers = new Set();

        for (const row of this.data) {
            const menge = this.parseNumber(row[MENGE]);
            totalQuantity += menge;

            // For write-offs (negative MENGE), values MUST be negative to reduce profit
            // For gains (positive MENGE), values MUST be positive to increase profit
            let betragHaus = this.parseNumber(row[BETRAG_HAUS]);
            let betragEKP = this.parseNumber(row[BETRAG_EKP]);
            let vkWert = this.parseNumber(row[VK_WERT]);
            
            if (menge < 0) {
                // Write-off: force all values to be negative
                betragHaus = -Math.abs(betragHaus);
                betragEKP = -Math.abs(betragEKP);
                vkWert = -Math.abs(vkWert);
            } else if (menge > 0) {
                // Gain: force all values to be positive  
                betragHaus = Math.abs(betragHaus);
                betragEKP = Math.abs(betragEKP);
                vkWert = Math.abs(vkWert);
            }
            
            totalBetragHaus += betragHaus;
            totalBetragEKP += betragEKP;
            totalVKWert += vkWert;

            if (row[this.COLUMNS.ARTIKEL]) {
                uniqueArticles.add(row[this.COLUMNS.ARTIKEL]);
            }
            if (row[this.COLUMNS.BENUTZER]) {
                uniqueUsers.add(row[this.COLUMNS.BENUTZER]);
            }
        }

        // Calculate profit based on net movement direction
        let overallProfit;
        if (totalQuantity < 0) {
            // Net write-off: profit is the negative cost (loss)
            overallProfit = totalBetragEKP;
        } else if (totalQuantity > 0) {
            // Net gain: normal profit calculation
            overallProfit = totalVKWert - totalBetragEKP;
        } else {
            // No net movement: no profit/loss
            overallProfit = 0;
        }

        return {
            totalRecords: this.data.length,
            totalQuantity,
            totalBetragHaus,
            totalBetragEKP,
            totalVKWert,
            uniqueArticles: uniqueArticles.size,
            uniqueUsers: uniqueUsers.size,
            profit: overallProfit
        };
    },

    /**
     * Analyze data grouped by article
     * @returns {Array} Analysis by article
     */
    analyzeByArticle() {
        const { ARTIKEL, ARTIKELTEXT, MENGE, BETRAG_HAUS, BETRAG_EKP, VK_WERT } = this.COLUMNS;
        const articleMap = new Map();

        for (const row of this.data) {
            const artikel = row[ARTIKEL];
            if (!artikel) continue;

            if (!articleMap.has(artikel)) {
                articleMap.set(artikel, {
                    artikel,
                    artikeltext: row[ARTIKELTEXT],
                    totalQuantity: 0,
                    totalBetragHaus: 0,
                    totalBetragEKP: 0,
                    totalVKWert: 0,
                    movements: 0,
                    writeOffs: 0,
                    gains: 0
                });
            }

            const article = articleMap.get(artikel);
            const menge = this.parseNumber(row[MENGE]);
            
            // For write-offs (negative MENGE), values MUST be negative to reduce profit
            // For gains (positive MENGE), values MUST be positive to increase profit
            let betragHaus = this.parseNumber(row[BETRAG_HAUS]);
            let betragEKP = this.parseNumber(row[BETRAG_EKP]);
            let vkWert = this.parseNumber(row[VK_WERT]);
            
            if (menge < 0) {
                // Write-off: force all values to be negative
                betragHaus = -Math.abs(betragHaus);
                betragEKP = -Math.abs(betragEKP);
                vkWert = -Math.abs(vkWert);
            } else if (menge > 0) {
                // Gain: force all values to be positive
                betragHaus = Math.abs(betragHaus);
                betragEKP = Math.abs(betragEKP);
                vkWert = Math.abs(vkWert);
            }
            
            article.totalQuantity += menge;
            article.totalBetragHaus += betragHaus;
            article.totalBetragEKP += betragEKP;
            article.totalVKWert += vkWert;
            article.movements++;

            if (menge < 0) {
                article.writeOffs += Math.abs(menge);
            } else if (menge > 0) {
                article.gains += menge;
            }
        }

        return Array.from(articleMap.values())
            .map(item => {
                const netQuantity = item.totalQuantity;
                const netBetragHaus = item.totalBetragHaus;
                
                // Calculate Wert Hauswähr / Netto-Menge (average value per unit)
                // Use absolute values for division, then apply the sign of the value
                const avgValuePerUnit = netQuantity !== 0 
                    ? (Math.abs(netBetragHaus) / Math.abs(netQuantity)) * (netBetragHaus < 0 ? -1 : 1)
                    : 0;
                
                return {
                    ...item,
                    avgValuePerUnit: avgValuePerUnit
                };
            })
            .sort((a, b) => Math.abs(b.totalBetragHaus) - Math.abs(a.totalBetragHaus));
    },

    /**
     * Analyze data grouped by movement type
     * @returns {Array} Analysis by movement type
     */
    analyzeByMovementType() {
        const { BEWEGUNGSART, MENGE, BETRAG_HAUS, BETRAG_EKP, VK_WERT } = this.COLUMNS;
        const movementMap = new Map();

        for (const row of this.data) {
            const bewegungsart = row[BEWEGUNGSART] || 'Unbekannt';

            if (!movementMap.has(bewegungsart)) {
                movementMap.set(bewegungsart, {
                    bewegungsart,
                    count: 0,
                    totalQuantity: 0,
                    totalBetragHaus: 0,
                    totalBetragEKP: 0,
                    totalVKWert: 0
                });
            }

            const movement = movementMap.get(bewegungsart);
            const menge = this.parseNumber(row[MENGE]);
            
            // For write-offs (negative MENGE), values MUST be negative to reduce profit
            // For gains (positive MENGE), values MUST be positive to increase profit
            let betragHaus = this.parseNumber(row[BETRAG_HAUS]);
            let betragEKP = this.parseNumber(row[BETRAG_EKP]);
            let vkWert = this.parseNumber(row[VK_WERT]);
            
            if (menge < 0) {
                // Write-off: force all values to be negative
                betragHaus = -Math.abs(betragHaus);
                betragEKP = -Math.abs(betragEKP);
                vkWert = -Math.abs(vkWert);
            } else if (menge > 0) {
                // Gain: force all values to be positive
                betragHaus = Math.abs(betragHaus);
                betragEKP = Math.abs(betragEKP);
                vkWert = Math.abs(vkWert);
            }
            
            movement.count++;
            movement.totalQuantity += menge;
            movement.totalBetragHaus += betragHaus;
            movement.totalBetragEKP += betragEKP;
            movement.totalVKWert += vkWert;
        }

        return Array.from(movementMap.values())
            .map(item => {
                // Calculate profit based on net movement direction
                let profit;
                if (item.totalQuantity < 0) {
                    // Net write-off: profit is the negative cost (loss)
                    profit = item.totalBetragEKP;
                } else if (item.totalQuantity > 0) {
                    // Net gain: normal profit calculation
                    profit = item.totalVKWert - item.totalBetragEKP;
                } else {
                    // No net movement: no profit/loss
                    profit = 0;
                }
                
                return {
                    ...item,
                    profit: profit
                };
            })
            .sort((a, b) => b.count - a.count);
    },

    /**
     * Analyze data grouped by user
     * @returns {Array} Analysis by user
     */
    analyzeByUser() {
        const { BENUTZER, MENGE, BETRAG_HAUS } = this.COLUMNS;
        const userMap = new Map();

        for (const row of this.data) {
            const benutzer = row[BENUTZER] || 'Unbekannt';

            if (!userMap.has(benutzer)) {
                userMap.set(benutzer, {
                    benutzer,
                    movements: 0,
                    totalQuantity: 0,
                    totalBetragHaus: 0,
                    articles: new Set()
                });
            }

            const user = userMap.get(benutzer);
            user.movements++;
            user.totalQuantity += this.parseNumber(row[MENGE]);
            user.totalBetragHaus += this.parseNumber(row[BETRAG_HAUS]);
            
            if (row[this.COLUMNS.ARTIKEL]) {
                user.articles.add(row[this.COLUMNS.ARTIKEL]);
            }
        }

        return Array.from(userMap.values())
            .map(item => ({
                ...item,
                uniqueArticles: item.articles.size,
                articles: undefined // Remove Set from output
            }))
            .sort((a, b) => b.movements - a.movements);
    },

    /**
     * Analyze data grouped by date
     * @returns {Array} Analysis by date
     */
    analyzeByDate() {
        const { DATUM, MENGE, BETRAG_HAUS } = this.COLUMNS;
        const dateMap = new Map();

        for (const row of this.data) {
            const datum = this.formatDate(row[DATUM]) || 'Unbekannt';

            if (!dateMap.has(datum)) {
                dateMap.set(datum, {
                    datum,
                    movements: 0,
                    totalQuantity: 0,
                    totalBetragHaus: 0
                });
            }

            const date = dateMap.get(datum);
            date.movements++;
            date.totalQuantity += this.parseNumber(row[MENGE]);
            date.totalBetragHaus += this.parseNumber(row[BETRAG_HAUS]);
        }

        return Array.from(dateMap.values())
            .sort((a, b) => new Date(b.datum) - new Date(a.datum));
    },

    /**
     * Analyze write-offs (negative movements)
     * @returns {Object} Write-off analysis
     */
    analyzeWriteOffs() {
        const { MENGE, BETRAG_HAUS, BETRAG_EKP, VK_WERT, ARTIKEL, ARTIKELTEXT } = this.COLUMNS;
        const writeOffs = this.data.filter(row => this.parseNumber(row[MENGE]) < 0);

        let totalQuantity = 0;
        let totalBetragHaus = 0;
        let totalBetragEKP = 0;
        let totalVKWert = 0;

        // Calculate net write-offs per article (considering all movements)
        const articleNetMap = new Map();

        // First pass: aggregate all movements per article
        for (const row of this.data) {
            const artikel = row[ARTIKEL];
            if (!artikel) continue;

            if (!articleNetMap.has(artikel)) {
                articleNetMap.set(artikel, {
                    artikel,
                    artikeltext: row[ARTIKELTEXT],
                    netQuantity: 0,
                    netBetragHaus: 0,
                    netVKWert: 0
                });
            }

            const art = articleNetMap.get(artikel);
            art.netQuantity += this.parseNumber(row[MENGE]);
            art.netBetragHaus += this.parseNumber(row[BETRAG_HAUS]);
            art.netVKWert += this.parseNumber(row[VK_WERT]);
        }

        // Second pass: calculate totals from negative-only movements
        for (const row of writeOffs) {
            const menge = Math.abs(this.parseNumber(row[MENGE]));
            const betragHaus = Math.abs(this.parseNumber(row[BETRAG_HAUS]));
            const betragEKP = Math.abs(this.parseNumber(row[BETRAG_EKP]));
            const vkWert = Math.abs(this.parseNumber(row[VK_WERT]));

            totalQuantity += menge;
            totalBetragHaus += betragHaus;
            totalBetragEKP += betragEKP;
            totalVKWert += vkWert;
        }

        // Filter and prepare top articles with net negative impact
        const topArticles = Array.from(articleNetMap.values())
            .filter(art => art.netBetragHaus < -0.01) // Only articles with net write-offs
            .map(art => ({
                artikel: art.artikel,
                artikeltext: art.artikeltext,
                quantity: Math.abs(art.netQuantity),
                betragHaus: Math.abs(art.netBetragHaus),
                vkWert: Math.abs(art.netVKWert)
            }))
            .sort((a, b) => b.betragHaus - a.betragHaus)
            .slice(0, 10);

        return {
            count: writeOffs.length,
            totalQuantity,
            totalBetragHaus,
            totalBetragEKP,
            totalVKWert,
            potentialLoss: totalVKWert,
            topArticles
        };
    },

    /**
     * Analyze gains (positive movements)
     * @returns {Object} Gains analysis
     */
    analyzeGains() {
        const { MENGE, BETRAG_HAUS, BETRAG_EKP, VK_WERT } = this.COLUMNS;
        const gains = this.data.filter(row => this.parseNumber(row[MENGE]) > 0);

        let totalQuantity = 0;
        let totalBetragHaus = 0;
        let totalBetragEKP = 0;
        let totalVKWert = 0;

        for (const row of gains) {
            totalQuantity += this.parseNumber(row[MENGE]);
            totalBetragHaus += this.parseNumber(row[BETRAG_HAUS]);
            totalBetragEKP += this.parseNumber(row[BETRAG_EKP]);
            totalVKWert += this.parseNumber(row[VK_WERT]);
        }

        return {
            count: gains.length,
            totalQuantity,
            totalBetragHaus,
            totalBetragEKP,
            totalVKWert,
            potentialGain: totalVKWert
        };
    },

    /**
     * Analyze financial impact
     * @returns {Object} Financial analysis
     */
    analyzeFinancial() {
        const overview = this.getOverview();
        const writeOffs = this.analyzeWriteOffs();
        const gains = this.analyzeGains();

        return {
            totalRevenue: overview.totalVKWert,
            totalCost: overview.totalBetragEKP,
            totalProfit: overview.profit,
            writeOffLoss: writeOffs.potentialLoss,
            gainValue: gains.potentialGain,
            netImpact: gains.potentialGain - writeOffs.potentialLoss,
            profitMargin: overview.totalBetragEKP !== 0 
                ? ((overview.profit / overview.totalBetragEKP) * 100) 
                : 0
        };
    },

    /**
     * Get article details
     * @param {string} artikel - Article number
     * @returns {Object} Article details
     */
    getArticleDetails(artikel) {
        const { ARTIKEL, MENGE, BETRAG_HAUS, BETRAG_EKP, VK_WERT, BEWEGUNGSART, DATUM } = this.COLUMNS;
        const articleData = this.data.filter(row => row[ARTIKEL] === artikel);

        if (articleData.length === 0) {
            return null;
        }

        let totalBooked = 0;
        let totalWrittenOff = 0;
        let totalGained = 0;
        let totalValue = 0;
        const movements = [];

        for (const row of articleData) {
            const menge = this.parseNumber(row[MENGE]);
            totalBooked += Math.abs(menge);
            
            if (menge < 0) {
                totalWrittenOff += Math.abs(menge);
            } else {
                totalGained += menge;
            }
            
            totalValue += this.parseNumber(row[BETRAG_HAUS]);

            movements.push({
                datum: this.formatDate(row[DATUM]),
                bewegungsart: row[BEWEGUNGSART],
                menge,
                betragHaus: this.parseNumber(row[BETRAG_HAUS]),
                betragEKP: this.parseNumber(row[BETRAG_EKP]),
                vkWert: this.parseNumber(row[VK_WERT])
            });
        }

        return {
            artikel,
            artikeltext: articleData[0][this.COLUMNS.ARTIKELTEXT],
            totalBooked,
            totalWrittenOff,
            totalGained,
            totalValue,
            movementCount: articleData.length,
            movements: movements.sort((a, b) => new Date(b.datum) - new Date(a.datum))
        };
    },

    /**
     * Parse number from German format
     * @param {*} value - Value to parse
     * @returns {number} Parsed number
     */
    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        
        // Handle German number format (comma as decimal separator)
        const str = String(value).replace(/\./g, '').replace(',', '.');
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    },

    /**
     * Filter out canceling transactions
     * Transactions that cancel each other out (same date, article, opposite values) are excluded
     * @param {Array} data - Raw data array
     * @returns {Array} Filtered data array
     */
    filterCancelingTransactions(data) {
        const { DATUM, ARTIKEL, MENGE, BETRAG_HAUS, VK_WERT } = this.COLUMNS;
        
        // Group transactions by date and article
        const grouped = new Map();
        
        data.forEach((row, index) => {
            const key = `${row[DATUM]}_${row[ARTIKEL]}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push({ row, index });
        });
        
        // Track indices to exclude
        const excludeIndices = new Set();
        
        // Check each group for canceling pairs
        grouped.forEach((transactions) => {
            if (transactions.length < 2) return;
            
            // Check all pairs within the group
            for (let i = 0; i < transactions.length; i++) {
                if (excludeIndices.has(transactions[i].index)) continue;
                
                for (let j = i + 1; j < transactions.length; j++) {
                    if (excludeIndices.has(transactions[j].index)) continue;
                    
                    const row1 = transactions[i].row;
                    const row2 = transactions[j].row;
                    
                    // Parse values
                    const menge1 = this.parseNumber(row1[MENGE]);
                    const menge2 = this.parseNumber(row2[MENGE]);
                    const betrag1 = this.parseNumber(row1[BETRAG_HAUS]);
                    const betrag2 = this.parseNumber(row2[BETRAG_HAUS]);
                    const vk1 = this.parseNumber(row1[VK_WERT]);
                    const vk2 = this.parseNumber(row2[VK_WERT]);
                    
                    // Check if they cancel each other out (opposite signs, same absolute values)
                    const mengeCancel = Math.abs(menge1 + menge2) < 0.01 && Math.abs(menge1) > 0;
                    const betragCancel = Math.abs(betrag1 + betrag2) < 0.01 && Math.abs(betrag1) > 0;
                    const vkCancel = Math.abs(vk1 + vk2) < 0.01 && Math.abs(vk1) > 0;
                    
                    if (mengeCancel && betragCancel && vkCancel) {
                        // Mark both transactions for exclusion
                        excludeIndices.add(transactions[i].index);
                        excludeIndices.add(transactions[j].index);
                        break; // Move to next transaction
                    }
                }
            }
        });
        
        // Filter out excluded transactions
        return data.filter((_, index) => !excludeIndices.has(index));
    },

    /**
     * Format date for display
     * @param {*} value - Date value
     * @returns {string} Formatted date
     */
    formatDate(value) {
        if (!value) return '';
        
        // Handle various date formats
        if (value instanceof Date) {
            return value.toLocaleDateString('de-DE');
        }
        
        // Excel date serial number
        if (typeof value === 'number' && value > 25569 && value < 50000) {
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toLocaleDateString('de-DE');
        }
        
        // Try to parse as date string
        const str = String(value);
        if (str.includes('.') || str.includes('-') || str.includes('/')) {
            const date = new Date(str);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('de-DE');
            }
        }
        
        return str;
    }
};

// Make BusinessAnalyzer available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusinessAnalyzer;
}
