/* ===========================
   DASHBOARD TAB
   =========================== */

// Dashboard grid instance
let dashboardGrid = null;

// Available widget types
const WIDGET_TYPES = {
    ALERTS_COUNT: 'alerts-count',
    MATERIALS_COUNT: 'materials-count',
    CAPACITY_OVERVIEW: 'capacity-overview',
    RECENT_ALERTS: 'recent-alerts',
    STORAGE_DISTRIBUTION: 'storage-distribution',
    CAPACITY_TRENDS: 'capacity-trends',
    TOP_MATERIALS: 'top-materials',
    ANALYTICS_SUMMARY: 'analytics-summary'
};

// Widget configurations
const WIDGET_CONFIG = {
    [WIDGET_TYPES.ALERTS_COUNT]: {
        title: 'Total Alerts',
        icon: 'fa-triangle-exclamation',
        minW: 2,
        minH: 2,
        defaultW: 3,
        defaultH: 2
    },
    [WIDGET_TYPES.MATERIALS_COUNT]: {
        title: 'Total Materials',
        icon: 'fa-boxes-stacked',
        minW: 2,
        minH: 2,
        defaultW: 3,
        defaultH: 2
    },
    [WIDGET_TYPES.CAPACITY_OVERVIEW]: {
        title: 'Capacity Overview',
        icon: 'fa-chart-pie',
        minW: 4,
        minH: 3,
        defaultW: 6,
        defaultH: 4
    },
    [WIDGET_TYPES.RECENT_ALERTS]: {
        title: 'Recent Alerts',
        icon: 'fa-bell',
        minW: 4,
        minH: 3,
        defaultW: 6,
        defaultH: 4
    },
    [WIDGET_TYPES.STORAGE_DISTRIBUTION]: {
        title: 'Storage Distribution',
        icon: 'fa-chart-bar',
        minW: 4,
        minH: 3,
        defaultW: 6,
        defaultH: 4
    },
    [WIDGET_TYPES.CAPACITY_TRENDS]: {
        title: 'Capacity Trends',
        icon: 'fa-chart-line',
        minW: 6,
        minH: 4,
        defaultW: 12,
        defaultH: 5
    },
    [WIDGET_TYPES.TOP_MATERIALS]: {
        title: 'Top Materials by Alerts',
        icon: 'fa-ranking-star',
        minW: 4,
        minH: 3,
        defaultW: 6,
        defaultH: 4
    },
    [WIDGET_TYPES.ANALYTICS_SUMMARY]: {
        title: 'Analytics Summary',
        icon: 'fa-chart-simple',
        minW: 4,
        minH: 3,
        defaultW: 6,
        defaultH: 3
    }
};

// Render Dashboard Tab Content
function renderDashboardTab() {
    const tab = document.getElementById('dashboardTab');
    tab.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <div>
                    <h2><i class="fa-solid fa-table-columns"></i> <span id="dashboardTitle">Dashboard</span></h2>
                    <p id="dashboardSubtitle" style="margin: 5px 0 0 0; color: var(--text-secondary);">
                        Customize your dashboard with drag-and-drop widgets
                    </p>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-primary" onclick="ui.showAddWidgetMenu()" style="padding: 10px 20px;">
                        <i class="fa-solid fa-plus"></i> <span id="addWidgetBtn">Add Widget</span>
                    </button>
                    <button class="btn-secondary" onclick="ui.resetDashboardLayout()" style="padding: 10px 20px;">
                        <i class="fa-solid fa-arrows-rotate"></i> <span id="resetLayoutBtn">Reset Layout</span>
                    </button>
                    <button class="btn-secondary" onclick="ui.saveDashboardLayout()" style="padding: 10px 20px;">
                        <i class="fa-solid fa-floppy-disk"></i> <span id="saveLayoutBtn">Save Layout</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Add Widget Menu -->
        <div id="addWidgetMenu" class="add-widget-menu" style="display: none;">
            <div class="card">
                <h3><i class="fa-solid fa-plus"></i> <span id="selectWidgetTitle">Select Widget to Add</span></h3>
                <div class="widget-options-grid" id="widgetOptionsGrid"></div>
            </div>
        </div>

        <!-- Dashboard Grid Container -->
        <div class="grid-stack dashboard-grid" id="dashboardGrid"></div>

        <!-- Empty State -->
        <div id="dashboardEmptyState" class="empty-state" style="display: none;">
            <div class="empty-state-icon">
                <i class="fa-solid fa-table-columns" style="font-size: 4em; color: var(--text-secondary);"></i>
            </div>
            <h3 id="emptyDashboardTitle">Your Dashboard is Empty</h3>
            <p id="emptyDashboardMessage">Add widgets to get started with your custom dashboard</p>
            <button class="btn-primary" onclick="ui.showAddWidgetMenu()" style="margin-top: 20px;">
                <i class="fa-solid fa-plus"></i> <span id="addFirstWidgetBtn">Add Your First Widget</span>
            </button>
        </div>
    `;
}

// Initialize Dashboard
UIManager.prototype.initializeDashboard = function() {
    // Initialize GridStack
    if (!dashboardGrid) {
        const gridElement = document.getElementById('dashboardGrid');
        if (!gridElement) return;
        
        dashboardGrid = GridStack.init({
            column: 12,
            cellHeight: '80px',
            margin: '10px',
            animate: true,
            float: true,
            resizable: {
                handles: 'e, se, s, sw, w'
            },
            draggable: {
                handle: '.widget-header'
            }
        });

        // Listen for changes to save layout
        dashboardGrid.on('change', () => {
            this.autoSaveDashboardLayout();
        });
    }

    // Load saved layout or create default
    this.loadDashboardLayout();
    this.renderWidgetOptions();
};

// Render Widget Options Menu
UIManager.prototype.renderWidgetOptions = function() {
    const grid = document.getElementById('widgetOptionsGrid');
    if (!grid) return;

    const options = Object.entries(WIDGET_CONFIG).map(([type, config]) => {
        return `
            <div class="widget-option-card" onclick="ui.addWidget('${type}')">
                <div class="widget-option-icon">
                    <i class="fa-solid ${config.icon}"></i>
                </div>
                <div class="widget-option-title">${this.t(type + 'Title') || config.title}</div>
            </div>
        `;
    }).join('');

    grid.innerHTML = options;
};

// Show Add Widget Menu
UIManager.prototype.showAddWidgetMenu = function() {
    const menu = document.getElementById('addWidgetMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
};

// Add Widget to Dashboard
UIManager.prototype.addWidget = function(widgetType) {
    if (!dashboardGrid) return;

    const config = WIDGET_CONFIG[widgetType];
    if (!config) return;

    // Generate unique widget ID
    const widgetId = `widget-${widgetType}-${Date.now()}`;

    // Create widget HTML
    const widgetContent = this.createWidgetContent(widgetType, widgetId);

    // Add to grid
    dashboardGrid.addWidget({
        id: widgetId,
        w: config.defaultW,
        h: config.defaultH,
        minW: config.minW,
        minH: config.minH,
        content: widgetContent
    });

    // Render widget data
    setTimeout(() => {
        this.renderWidgetData(widgetType, widgetId);
    }, 100);

    // Hide add widget menu
    this.showAddWidgetMenu();

    // Hide empty state
    const emptyState = document.getElementById('dashboardEmptyState');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    this.showToast(`<i class="fa-solid fa-check"></i> Widget added successfully`, 'success');
};

// Create Widget HTML Content
UIManager.prototype.createWidgetContent = function(widgetType, widgetId) {
    const config = WIDGET_CONFIG[widgetType];
    const title = this.t(widgetType + 'Title') || config.title;

    return `
        <div class="dashboard-widget" data-widget-type="${widgetType}">
            <div class="widget-header">
                <div class="widget-title">
                    <i class="fa-solid ${config.icon}"></i>
                    <span>${title}</span>
                </div>
                <div class="widget-controls">
                    <button class="widget-btn" onclick="ui.refreshWidget('${widgetId}')" title="Refresh">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                    <button class="widget-btn" onclick="ui.removeWidget('${widgetId}')" title="Remove">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            <div class="widget-content" id="${widgetId}-content">
                <div class="widget-loading">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        </div>
    `;
};

// Render Widget Data
UIManager.prototype.renderWidgetData = function(widgetType, widgetId) {
    const contentEl = document.getElementById(`${widgetId}-content`);
    if (!contentEl) return;

    const archiveData = this.dataManager.getArchive();
    const latestReport = archiveData.length > 0 ? archiveData[archiveData.length - 1] : null;

    let content = '';

    switch (widgetType) {
        case WIDGET_TYPES.ALERTS_COUNT:
            content = this.renderAlertsCountWidget(latestReport);
            break;
        case WIDGET_TYPES.MATERIALS_COUNT:
            content = this.renderMaterialsCountWidget(latestReport);
            break;
        case WIDGET_TYPES.CAPACITY_OVERVIEW:
            content = this.renderCapacityOverviewWidget(latestReport);
            break;
        case WIDGET_TYPES.RECENT_ALERTS:
            content = this.renderRecentAlertsWidget(latestReport);
            break;
        case WIDGET_TYPES.STORAGE_DISTRIBUTION:
            content = this.renderStorageDistributionWidget(latestReport);
            break;
        case WIDGET_TYPES.CAPACITY_TRENDS:
            content = this.renderCapacityTrendsWidget(archiveData);
            break;
        case WIDGET_TYPES.TOP_MATERIALS:
            content = this.renderTopMaterialsWidget(archiveData);
            break;
        case WIDGET_TYPES.ANALYTICS_SUMMARY:
            content = this.renderAnalyticsSummaryWidget(archiveData);
            break;
        default:
            content = '<div class="widget-no-data">Unknown widget type</div>';
    }

    contentEl.innerHTML = content;
};

// Widget Rendering Methods
UIManager.prototype.renderAlertsCountWidget = function(report) {
    if (!report || !report.summary) {
        return '<div class="widget-no-data"><i class="fa-solid fa-info-circle"></i><p>No data available</p></div>';
    }

    const alertCount = report.summary.totalAlerts || 0;
    const alertClass = alertCount > 0 ? 'stat-danger' : 'stat-success';

    return `
        <div class="widget-stat-card ${alertClass}">
            <div class="stat-value">${alertCount}</div>
            <div class="stat-label">${this.t('totalAlerts') || 'Total Alerts'}</div>
            ${alertCount > 0 ? '<div class="stat-badge"><i class="fa-solid fa-exclamation-triangle"></i> Attention Required</div>' : ''}
        </div>
    `;
};

UIManager.prototype.renderMaterialsCountWidget = function(report) {
    if (!report || !report.summary) {
        return '<div class="widget-no-data"><i class="fa-solid fa-info-circle"></i><p>No data available</p></div>';
    }

    const materialCount = report.summary.totalMaterials || 0;

    return `
        <div class="widget-stat-card stat-info">
            <div class="stat-value">${materialCount}</div>
            <div class="stat-label">${this.t('totalMaterials') || 'Total Materials'}</div>
        </div>
    `;
};

UIManager.prototype.renderCapacityOverviewWidget = function(report) {
    if (!report || !report.results || !report.results.materialGroups) {
        return '<div class="widget-no-data"><i class="fa-solid fa-info-circle"></i><p>No data available</p></div>';
    }

    // Calculate total capacity utilization
    let totalStock = 0;
    let totalCapacity = 0;

    report.results.materialGroups.forEach(group => {
        group.rows.forEach(row => {
            totalStock += row.qty || 0;
            const materialConfig = this.dataManager.getMaterial(row.material);
            if (materialConfig) {
                totalCapacity += materialConfig.capacity || 10;
            }
        });
    });

    const utilizationPercent = totalCapacity > 0 ? ((totalStock / totalCapacity) * 100).toFixed(1) : 0;
    const statusClass = utilizationPercent > 100 ? 'stat-danger' : utilizationPercent > 80 ? 'stat-warning' : 'stat-success';

    return `
        <div class="widget-capacity-overview">
            <div class="capacity-ring ${statusClass}">
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" class="capacity-bg"></circle>
                    <circle cx="50" cy="50" r="40" class="capacity-fill" 
                            style="stroke-dashoffset: ${251.2 * (1 - Math.min(utilizationPercent / 100, 1.5))}"></circle>
                </svg>
                <div class="capacity-text">
                    <div class="capacity-percent">${utilizationPercent}%</div>
                    <div class="capacity-label">${this.t('utilized') || 'Utilized'}</div>
                </div>
            </div>
            <div class="capacity-stats">
                <div class="capacity-stat-item">
                    <span class="capacity-stat-label">${this.t('currentStock') || 'Current Stock'}:</span>
                    <span class="capacity-stat-value">${totalStock}</span>
                </div>
                <div class="capacity-stat-item">
                    <span class="capacity-stat-label">${this.t('maxCapacity') || 'Max Capacity'}:</span>
                    <span class="capacity-stat-value">${totalCapacity}</span>
                </div>
            </div>
        </div>
    `;
};

UIManager.prototype.renderRecentAlertsWidget = function(report) {
    if (!report || !report.results || !report.results.alerts || report.results.alerts.length === 0) {
        return '<div class="widget-no-data"><i class="fa-solid fa-info-circle"></i><p>No alerts</p></div>';
    }

    const recentAlerts = report.results.alerts.slice(0, 5);

    const alertsHtml = recentAlerts.map(alert => `
        <div class="alert-item">
            <div class="alert-icon ${alert.status === 'critical' ? 'alert-critical' : 'alert-warning'}">
                <i class="fa-solid fa-${alert.status === 'critical' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
            </div>
            <div class="alert-details">
                <div class="alert-material">${alert.material}</div>
                <div class="alert-message">${alert.reason}</div>
            </div>
        </div>
    `).join('');

    return `<div class="widget-alerts-list">${alertsHtml}</div>`;
};

UIManager.prototype.renderStorageDistributionWidget = function(report) {
    if (!report || !report.results || !report.results.materialGroups) {
        return '<div class="widget-no-data"><i class="fa-solid fa-info-circle"></i><p>No data available</p></div>';
    }

    const storageTypes = {};
    report.results.materialGroups.forEach(group => {
        group.rows.forEach(row => {
            if (!storageTypes[row.storageType]) {
                storageTypes[row.storageType] = 0;
            }
            storageTypes[row.storageType] += row.qty || 0;
        });
    });

    const total = Object.values(storageTypes).reduce((sum, qty) => sum + qty, 0);

    const distributionHtml = Object.entries(storageTypes).map(([type, qty]) => {
        const percent = total > 0 ? ((qty / total) * 100).toFixed(1) : 0;
        return `
            <div class="distribution-item">
                <div class="distribution-label">
                    <span class="distribution-type">${type}</span>
                    <span class="distribution-value">${qty} (${percent}%)</span>
                </div>
                <div class="distribution-bar">
                    <div class="distribution-fill" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    }).join('');

    return `<div class="widget-distribution">${distributionHtml}</div>`;
};

UIManager.prototype.renderCapacityTrendsWidget = function(archiveData) {
    if (!archiveData || archiveData.length === 0) {
        return '<div class="widget-no-data"><i class="fa-solid fa-info-circle"></i><p>No historical data</p></div>';
    }

    // Create a simple mini chart
    const canvasId = `trend-chart-${Date.now()}`;
    setTimeout(() => {
        this.renderMiniTrendChart(canvasId, archiveData);
    }, 100);

    return `<div class="widget-chart-container"><canvas id="${canvasId}"></canvas></div>`;
};

UIManager.prototype.renderTopMaterialsWidget = function(archiveData) {
    if (!archiveData || archiveData.length === 0) {
        return '<div class="widget-no-data"><i class="fa-solid fa-info-circle"></i><p>No data available</p></div>';
    }

    const materialAlerts = {};
    archiveData.forEach(entry => {
        if (entry.results && entry.results.alerts) {
            entry.results.alerts.forEach(alert => {
                materialAlerts[alert.material] = (materialAlerts[alert.material] || 0) + 1;
            });
        }
    });

    const topMaterials = Object.entries(materialAlerts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    if (topMaterials.length === 0) {
        return '<div class="widget-no-data"><i class="fa-solid fa-info-circle"></i><p>No alerts recorded</p></div>';
    }

    const materialsHtml = topMaterials.map(([material, count], index) => `
        <div class="ranking-item">
            <div class="ranking-number">${index + 1}</div>
            <div class="ranking-content">
                <div class="ranking-material">${material}</div>
                <div class="ranking-count">${count} ${this.t('alerts') || 'alerts'}</div>
            </div>
        </div>
    `).join('');

    return `<div class="widget-ranking">${materialsHtml}</div>`;
};

UIManager.prototype.renderAnalyticsSummaryWidget = function(archiveData) {
    if (!archiveData || archiveData.length === 0) {
        return '<div class="widget-no-data"><i class="fa-solid fa-info-circle"></i><p>No data available</p></div>';
    }

    const latestReport = archiveData[archiveData.length - 1];
    const totalReports = archiveData.length;
    const totalAlerts = archiveData.reduce((sum, entry) => sum + (entry.summary?.totalAlerts || 0), 0);
    const avgAlertsPerReport = (totalAlerts / totalReports).toFixed(1);

    return `
        <div class="widget-summary-grid">
            <div class="summary-item">
                <div class="summary-icon"><i class="fa-solid fa-file-lines"></i></div>
                <div class="summary-data">
                    <div class="summary-value">${totalReports}</div>
                    <div class="summary-label">${this.t('totalReports') || 'Total Reports'}</div>
                </div>
            </div>
            <div class="summary-item">
                <div class="summary-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="summary-data">
                    <div class="summary-value">${totalAlerts}</div>
                    <div class="summary-label">${this.t('totalAlerts') || 'Total Alerts'}</div>
                </div>
            </div>
            <div class="summary-item">
                <div class="summary-icon"><i class="fa-solid fa-chart-line"></i></div>
                <div class="summary-data">
                    <div class="summary-value">${avgAlertsPerReport}</div>
                    <div class="summary-label">${this.t('avgAlerts') || 'Avg Alerts'}</div>
                </div>
            </div>
        </div>
    `;
};

// Mini chart rendering helper
UIManager.prototype.renderMiniTrendChart = function(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const labels = data.slice(-10).map(entry => new Date(entry.timestamp).toLocaleDateString());
    const alertData = data.slice(-10).map(entry => entry.summary?.totalAlerts || 0);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: this.t('alerts') || 'Alerts',
                data: alertData,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { display: true },
                y: { beginAtZero: true }
            }
        }
    });
};

// Refresh Widget
UIManager.prototype.refreshWidget = function(widgetId) {
    const widgetEl = document.querySelector(`[id="${widgetId}"]`);
    if (!widgetEl) return;

    const widgetType = widgetEl.closest('.dashboard-widget')?.dataset.widgetType;
    if (widgetType) {
        this.renderWidgetData(widgetType, widgetId);
        this.showToast(`<i class="fa-solid fa-check"></i> Widget refreshed`, 'success');
    }
};

// Remove Widget
UIManager.prototype.removeWidget = function(widgetId) {
    if (!dashboardGrid) return;

    const widgetEl = document.querySelector(`[gs-id="${widgetId}"]`);
    if (widgetEl) {
        dashboardGrid.removeWidget(widgetEl);
        this.showToast(`<i class="fa-solid fa-check"></i> Widget removed`, 'info');
        
        // Show empty state if no widgets left
        const remainingWidgets = dashboardGrid.getGridItems();
        if (remainingWidgets.length === 0) {
            const emptyState = document.getElementById('dashboardEmptyState');
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
        }
    }
};

// Save Dashboard Layout
UIManager.prototype.saveDashboardLayout = function() {
    if (!dashboardGrid) return;

    const layout = dashboardGrid.save(false);
    const widgets = layout.map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        widgetType: document.querySelector(`[gs-id="${item.id}"] .dashboard-widget`)?.dataset.widgetType
    }));

    this.dataManager.saveDashboardLayout(widgets);
    this.showToast(`<i class="fa-solid fa-floppy-disk"></i> Dashboard layout saved`, 'success');
};

// Auto-save with debouncing
UIManager.prototype.autoSaveDashboardLayout = debounce(function() {
    this.saveDashboardLayout();
}, 2000);

// Load Dashboard Layout
UIManager.prototype.loadDashboardLayout = function() {
    if (!dashboardGrid) return;

    const savedLayout = this.dataManager.getDashboardLayout();
    
    if (savedLayout && savedLayout.length > 0) {
        savedLayout.forEach(widget => {
            const content = this.createWidgetContent(widget.widgetType, widget.id);
            dashboardGrid.addWidget({
                id: widget.id,
                x: widget.x,
                y: widget.y,
                w: widget.w,
                h: widget.h,
                content: content
            });
            
            setTimeout(() => {
                this.renderWidgetData(widget.widgetType, widget.id);
            }, 100);
        });

        document.getElementById('dashboardEmptyState').style.display = 'none';
    } else {
        // Load default layout
        this.loadDefaultDashboardLayout();
    }
};

// Load Default Dashboard Layout
UIManager.prototype.loadDefaultDashboardLayout = function() {
    const defaultWidgets = [
        { type: WIDGET_TYPES.ALERTS_COUNT, x: 0, y: 0 },
        { type: WIDGET_TYPES.MATERIALS_COUNT, x: 3, y: 0 },
        { type: WIDGET_TYPES.CAPACITY_OVERVIEW, x: 6, y: 0 },
        { type: WIDGET_TYPES.RECENT_ALERTS, x: 0, y: 2 },
        { type: WIDGET_TYPES.STORAGE_DISTRIBUTION, x: 6, y: 2 }
    ];

    if (dashboardGrid.getGridItems().length === 0) {
        defaultWidgets.forEach(widget => {
            const config = WIDGET_CONFIG[widget.type];
            const widgetId = `widget-${widget.type}-${Date.now()}-${Math.random()}`;
            const content = this.createWidgetContent(widget.type, widgetId);
            
            dashboardGrid.addWidget({
                id: widgetId,
                x: widget.x,
                y: widget.y,
                w: config.defaultW,
                h: config.defaultH,
                content: content
            });
            
            setTimeout(() => {
                this.renderWidgetData(widget.type, widgetId);
            }, 100);
        });

        document.getElementById('dashboardEmptyState').style.display = 'none';
    } else {
        document.getElementById('dashboardEmptyState').style.display = 'flex';
    }
};

// Reset Dashboard Layout
UIManager.prototype.resetDashboardLayout = async function() {
    if (!dashboardGrid) return;

    const message = `
        <p>${this.t('confirmResetDashboard') || 'Are you sure you want to reset the dashboard layout? This will remove all widgets and restore the default layout.'}</p>
    `;
    
    const confirmed = await this.showDeleteModal(message);
    
    if (confirmed) {
        dashboardGrid.removeAll();
        this.loadDefaultDashboardLayout();
        this.saveDashboardLayout();
        this.showToast(`<i class="fa-solid fa-arrows-rotate"></i> Dashboard reset to default layout`, 'success');
    }
};
