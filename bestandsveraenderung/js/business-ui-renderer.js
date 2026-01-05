// Business UI Renderer - Enhanced visualizations for business analysis
const BusinessUIRenderer = {
    /**
     * Get SVG icon by name
     * @param {string} name - Icon name
     * @returns {string} SVG icon HTML
     */
    getIcon(name) {
        const icons = {
            chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
            edit: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
            package: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>',
            dollar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
            euro: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 15a7 7 0 1 0-7 7c3.87 0 7-3.13 7-7z"></path><path d="M3 9h7m-7 6h7"></path></svg>',
            trendUp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>',
            trendDown: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
            users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
            repeat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>',
            money: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2"></rect><circle cx="12" cy="12" r="3"></circle></svg>'
        };
        return icons[name] || '';
    },

    /**
     * Render complete business analysis
     * @param {Object} analysis - Complete analysis data
     */
    renderAnalysis(analysis) {
        if (!analysis) return;

        const container = Utils.getElement('businessAnalysis');
        if (!container) return;

        container.innerHTML = '';

        // Render each section
        this.renderOverviewCards(analysis.overview, container);
        this.renderFinancialSummary(analysis.financial, container);
        this.renderWriteOffsSection(analysis.writeOffs, container);
        this.renderGainsSection(analysis.gains, container);
        this.renderTopArticles(analysis.byArticle, container);
        this.renderMovementTypes(analysis.byMovementType, container);
        this.renderUsers(analysis.byUser, container);
        this.renderTimeline(analysis.byDate, container);
    },

    /**
     * Render overview cards
     * @param {Object} overview - Overview data
     * @param {HTMLElement} container - Container element
     */
    renderOverviewCards(overview, container) {
        const section = document.createElement('div');
        section.className = 'analysis-section';
        section.id = 'overview';
        section.innerHTML = `<h2>${this.getIcon('chart')} Gesamtübersicht</h2>`;

        const grid = document.createElement('div');
        grid.className = 'stats-grid stats-grid-4';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';

        const cards = [
            { label: 'Bewegungen', value: Utils.formatNumber(overview.totalRecords), icon: this.getIcon('edit') },
            { label: 'Artikel', value: Utils.formatNumber(overview.uniqueArticles), icon: this.getIcon('package') },
            { label: 'Gesamtmenge', value: Utils.formatNumber(overview.totalQuantity), icon: this.getIcon('chart') },
            { label: 'Benutzer', value: Utils.formatNumber(overview.uniqueUsers), icon: this.getIcon('users') }
        ];

        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `stat-card ${card.class || ''}`;
            cardEl.innerHTML = `
                <div class="stat-icon">${card.icon}</div>
                <div class="stat-label">${card.label}</div>
                <div class="stat-value">${card.value}</div>
            `;
            grid.appendChild(cardEl);
        });

        section.appendChild(grid);
        container.appendChild(section);
    },

    /**
     * Render financial summary
     * @param {Object} financial - Financial data
     * @param {HTMLElement} container - Container element
     */
    renderFinancialSummary(financial, container) {
        const section = document.createElement('div');
        section.className = 'analysis-section financial-section';
        section.id = 'financial';
        section.innerHTML = `<h2>${this.getIcon('dollar')} Finanzielle Auswirkung</h2>`;

        const grid = document.createElement('div');
        grid.className = 'financial-grid';
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem;';

        const items = [
            { 
                label: 'Umsatz (VK-Wert)', 
                value: this.formatCurrency(financial.totalRevenue),
                desc: 'Gesamter Verkaufswert',
                class: 'revenue'
            },
            { 
                label: 'Kosten (EK-Wert)', 
                value: this.formatCurrency(financial.totalCost),
                desc: 'Gesamte Einkaufskosten',
                class: 'cost'
            },
            { 
                label: 'Gewinn', 
                value: this.formatCurrency(financial.totalProfit),
                desc: `Marge: ${financial.profitMargin.toFixed(2)}%`,
                class: financial.totalProfit >= 0 ? 'profit' : 'loss'
            },
            { 
                label: 'Abschreibungen', 
                value: this.formatCurrency(-Math.abs(financial.writeOffLoss)),
                desc: 'Verluste durch Abschreibungen',
                class: 'writeoff'
            },
            { 
                label: 'Zugänge', 
                value: this.formatCurrency(financial.gainValue),
                desc: 'Wert der Zugänge',
                class: 'gain'
            },
            { 
                label: 'Netto-Auswirkung', 
                value: this.formatCurrency(financial.netImpact),
                desc: 'Zugänge minus Abschreibungen',
                class: financial.netImpact >= 0 ? 'positive' : 'negative'
            }
        ];

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = `financial-card ${item.class}`;
            card.style.cssText = 'background: white; padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid var(--color-primary); box-shadow: var(--box-shadow);';
            card.innerHTML = `
                <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">${item.label}</div>
                <div style="font-size: 1.75rem; font-weight: bold; color: var(--color-text-primary); margin-bottom: 0.25rem;">${item.value}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${item.desc}</div>
            `;
            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    },

    /**
     * Render write-offs section
     * @param {Object} writeOffs - Write-offs data
     * @param {HTMLElement} container - Container element
     */
    renderWriteOffsSection(writeOffs, container) {
        const section = document.createElement('div');
        section.className = 'analysis-section writeoffs-section';
        section.id = 'writeoffs';
        section.innerHTML = `<h2>${this.getIcon('trendDown')} Abschreibungen / Verluste</h2>`;

        const summary = document.createElement('div');
        summary.className = 'writeoff-summary';
        summary.style.cssText = 'background: #fff3cd; padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid #ffc107; margin: 1rem 0;';
        summary.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <div style="font-size: 0.875rem; color: #856404;">Anzahl Vorgänge</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #856404;">${Utils.formatNumber(writeOffs.count)}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: #856404;">Menge abgeschrieben</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #856404;">${Utils.formatNumber(writeOffs.totalQuantity)}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: #856404;">Wert Hauswährung</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #856404;">${this.formatCurrency(-Math.abs(writeOffs.totalBetragHaus))}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: #856404;">Potenzieller VK-Verlust</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #dc3545;">${this.formatCurrency(-Math.abs(writeOffs.potentialLoss))}</div>
                </div>
            </div>
        `;
        section.appendChild(summary);

        if (writeOffs.topArticles && writeOffs.topArticles.length > 0) {
            const topSection = document.createElement('div');
            topSection.innerHTML = '<h3 style="margin: 1.5rem 0 1rem;">Top 10 Artikel mit höchsten Abschreibungen</h3>';
            
            const table = this.createTable(
                ['Artikel', 'Artikeltext', 'Menge', 'Wert Hauswähr.', 'VK-Verlust'],
                writeOffs.topArticles.map(art => [
                    Utils.sanitizeHTML(art.artikel),
                    Utils.sanitizeHTML(art.artikeltext),
                    Utils.formatNumber(art.quantity),
                    this.formatCurrency(-Math.abs(art.betragHaus)),
                    this.formatCurrency(-Math.abs(art.vkWert))
                ])
            );
            topSection.appendChild(table);
            section.appendChild(topSection);
        }

        container.appendChild(section);
    },

    /**
     * Render gains section
     * @param {Object} gains - Gains data
     * @param {HTMLElement} container - Container element
     */
    renderGainsSection(gains, container) {
        const section = document.createElement('div');
        section.className = 'analysis-section gains-section';
        section.id = 'gains';
        section.innerHTML = `<h2>${this.getIcon('trendUp')} Zugänge / Gewinne</h2>`;

        const summary = document.createElement('div');
        summary.style.cssText = 'background: #d4edda; padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid #28a745; margin: 1rem 0;';
        summary.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <div style="font-size: 0.875rem; color: #155724;">Anzahl Vorgänge</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #155724;">${Utils.formatNumber(gains.count)}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: #155724;">Menge hinzugefügt</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #155724;">${Utils.formatNumber(gains.totalQuantity)}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: #155724;">Wert Hauswährung</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #155724;">${this.formatCurrency(gains.totalBetragHaus)}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: #155724;">Potenzieller VK-Wert</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #28a745;">${this.formatCurrency(gains.potentialGain)}</div>
                </div>
            </div>
        `;
        section.appendChild(summary);
        container.appendChild(section);
    },

    /**
     * Render top articles table
     * @param {Array} articles - Articles data
     * @param {HTMLElement} container - Container element
     */
    renderTopArticles(articles, container) {
        const section = document.createElement('div');
        section.className = 'analysis-section articles-section';
        section.id = 'articles';
        section.innerHTML = `<h2>${this.getIcon('package')} Top Artikel nach Wert</h2>`;

        // Filter out 'Unbekannt' articles
        const filteredArticles = articles.filter(art => art.artikel && art.artikel !== 'Unbekannt');
        
        const table = this.createTable(
            ['Artikel', 'Artikeltext', 'Bewegungen', 'Netto-Menge', 'Menge Abschr.', 'Menge Zugänge', 'Wert Hauswähr.', 'Wert Hauswähr / Netto-Menge'],
            filteredArticles.map(art => [
                Utils.sanitizeHTML(art.artikel),
                Utils.sanitizeHTML(art.artikeltext),
                Utils.formatNumber(art.movements),
                Utils.formatNumber(art.totalQuantity),
                Utils.formatNumber(art.writeOffs),
                Utils.formatNumber(art.gains),
                this.formatCurrency(art.totalBetragHaus),
                this.formatCurrency(art.avgValuePerUnit)
            ])
        );

        section.appendChild(table);
        container.appendChild(section);
    },

    /**
     * Render movement types
     * @param {Array} movements - Movement types data
     * @param {HTMLElement} container - Container element
     */
    renderMovementTypes(movements, container) {
        const section = document.createElement('div');
        section.className = 'analysis-section movements-section';
        section.id = 'movements';
        section.innerHTML = `<h2>${this.getIcon('repeat')} Bewegungsarten</h2>`;

        // Filter out 'Unbekannt'
        const filteredMovements = movements.filter(mov => mov.bewegungsart && mov.bewegungsart !== 'Unbekannt');

        const table = this.createTable(
            ['Bewegungsart', 'Anzahl', 'Menge', 'Wert Hauswähr.', 'EK-Wert', 'VK-Wert', 'Profit'],
            filteredMovements.map(mov => [
                Utils.sanitizeHTML(mov.bewegungsart),
                Utils.formatNumber(mov.count),
                Utils.formatNumber(mov.totalQuantity),
                this.formatCurrency(mov.totalBetragHaus),
                this.formatCurrency(mov.totalBetragEKP),
                this.formatCurrency(mov.totalVKWert),
                this.formatCurrency(mov.profit, mov.profit >= 0)
            ])
        );

        section.appendChild(table);
        container.appendChild(section);
    },

    /**
     * Render user activity
     * @param {Array} users - User activity data
     * @param {HTMLElement} container - Container element
     */
    renderUsers(users, container) {
        const section = document.createElement('div');
        section.className = 'analysis-section users-section';
        section.id = 'users';
        section.innerHTML = `<h2>${this.getIcon('users')} Benutzeraktivität</h2>`;

        // Filter out 'Unbekannt'
        const filteredUsers = users.filter(user => user.benutzer && user.benutzer !== 'Unbekannt');

        const table = this.createTable(
            ['Benutzer', 'Bewegungen', 'Artikel', 'Menge', 'Wert Hauswähr.'],
            filteredUsers.map(user => [
                Utils.sanitizeHTML(user.benutzer),
                Utils.formatNumber(user.movements),
                Utils.formatNumber(user.uniqueArticles),
                Utils.formatNumber(user.totalQuantity),
                this.formatCurrency(user.totalBetragHaus)
            ])
        );

        section.appendChild(table);
        container.appendChild(section);
    },

    /**
     * Render date timeline
     * @param {Array} dates - Date data
     * @param {HTMLElement} container - Container element
     */
    renderTimeline(timeline, container) {
        const section = document.createElement('div');
        section.className = 'analysis-section timeline-section';
        section.id = 'timeline';
        section.innerHTML = `<h2>${this.getIcon('calendar')} Zeitverlauf</h2>`;

        // Filter out 'Unbekannt'
        const filteredTimeline = timeline.filter(day => day.datum && day.datum !== 'Unbekannt');

        const table = this.createTable(
            ['Datum', 'Bewegungen', 'Menge', 'Wert Hauswähr.'],
            filteredTimeline.map(day => [
                day.datum,
                Utils.formatNumber(day.movements),
                Utils.formatNumber(day.totalQuantity),
                this.formatCurrency(day.totalBetragHaus)
            ])
        );

        section.appendChild(table);
        container.appendChild(section);
    },

    /**
     * Create HTML table with DataTables
     * @param {Array} headers - Table headers
     * @param {Array} rows - Table rows
     * @returns {HTMLElement} Table element
     */
    createTable(headers, rows) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';

        // Generate unique ID for each table
        const tableId = 'table-' + Math.random().toString(36).substr(2, 9);
        
        const table = document.createElement('table');
        table.className = 'analysis-table display';
        table.id = tableId;

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                // Cell content is pre-sanitized when passed to createTable
                td.innerHTML = cell;
                
                // Extract data-order from span and apply to td for proper sorting
                if (typeof cell === 'string' && cell.includes('data-order=')) {
                    const match = cell.match(/data-order="([^"]+)"/);
                    if (match) {
                        td.setAttribute('data-order', match[1]);
                    }
                }
                
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        tableContainer.appendChild(table);
        
        // Initialize DataTable after DOM insertion
        setTimeout(() => {
            if ($.fn.DataTable.isDataTable('#' + tableId)) {
                $('#' + tableId).DataTable().destroy();
            }
            
            $('#' + tableId).DataTable({
                pageLength: 25,
                lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Alle"]],
                language: {
                    search: "Suchen:",
                    lengthMenu: "_MENU_ Einträge anzeigen",
                    info: "Zeige _START_ bis _END_ von _TOTAL_ Einträgen",
                    infoEmpty: "Keine Einträge vorhanden",
                    infoFiltered: "(gefiltert von _MAX_ Einträgen)",
                    paginate: {
                        first: "Erste",
                        last: "Letzte",
                        next: "Nächste",
                        previous: "Vorherige"
                    },
                    zeroRecords: "Keine passenden Einträge gefunden",
                    emptyTable: "Keine Daten verfügbar"
                },
                order: [[0, 'asc']],
                responsive: true
            });
        }, 100);
        
        return tableContainer;
    },

    /**
     * Format currency with data-order attribute for proper DataTables sorting
     * @param {number} value - Currency value
     * @param {boolean} colorize - Apply color based on positive/negative
     * @returns {string} Formatted currency
     */
    formatCurrency(value, colorize = false) {
        const formatted = new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);

        if (colorize) {
            const color = value >= 0 ? '#28a745' : '#dc3545';
            return `<span style="color: ${color}; font-weight: 600;" data-order="${value}">${formatted}</span>`;
        }

        return `<span data-order="${value}">${formatted}</span>`;
    }
};

// Make BusinessUIRenderer available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusinessUIRenderer;
}
