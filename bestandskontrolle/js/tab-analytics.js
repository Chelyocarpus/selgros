/* ===========================
   ANALYTICS TAB
   =========================== */

// Render Analytics Tab Content
function renderAnalyticsTab() {
    const tab = document.getElementById('analyticsTab');
    tab.innerHTML = `
        <div class="card">
            <h2><i class="fa-solid fa-chart-line"></i> ${ui.t('analyticsTitle')}</h2>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div class="form-group" style="margin-bottom: 0; min-width: 200px;">
                    <label for="periodSelector">${ui.t('periodSelector')}</label>
                    <select id="periodSelector" onchange="ui.updateAnalytics()">
                        <option value="week">${ui.t('periodWeek')}</option>
                        <option value="month" selected>${ui.t('periodMonth')}</option>
                        <option value="quarter">${ui.t('periodQuarter')}</option>
                        <option value="year">${ui.t('periodYear')}</option>
                        <option value="all">${ui.t('periodAll')}</option>
                    </select>
                </div>
                <button class="btn-primary" onclick="ui.refreshAnalytics()" style="padding: 10px 20px;">
                    <i class="fa-solid fa-arrows-rotate"></i> Refresh
                </button>
            </div>
        </div>

        <div class="analytics-grid">
            <!-- Alerts Over Time Chart -->
            <div class="card analytics-chart">
                <h3><i class="fa-solid fa-triangle-exclamation"></i> ${ui.t('alertsOverTimeTitle')}</h3>
                <div class="chart-container">
                    <canvas id="alertsChart" width="400" height="200"></canvas>
                </div>
                <div id="alertsChartEmpty" class="empty-chart" style="display: none;">
                    <div class="empty-state-icon"><i class="fa-solid fa-chart-line" style="font-size: 3em; color: var(--text-secondary);"></i></div>
                    <p>${ui.t('noDataMessage')}</p>
                </div>
            </div>

            <!-- Current Capacity by Storage Type Chart -->
            <div class="card analytics-chart">
                <h3><i class="fa-solid fa-chart-simple"></i> ${ui.t('capacityByStorageTitle')}</h3>
                <div class="chart-container">
                    <canvas id="capacityByStorageChart" width="400" height="200"></canvas>
                </div>
                <div id="capacityByStorageChartEmpty" class="empty-chart" style="display: none;">
                    <div class="empty-state-icon"><i class="fa-solid fa-chart-simple" style="font-size: 3em; color: var(--text-secondary);"></i></div>
                    <p>${ui.t('noDataMessage')}</p>
                </div>
            </div>

            <!-- Capacity Trends Over Time Chart -->
            <div class="card analytics-chart full-width">
                <h3><i class="fa-solid fa-chart-line"></i> ${ui.t('capacityTrendsTitle')}</h3>
                <div class="chart-container">
                    <canvas id="capacityTrendsChart" width="800" height="300"></canvas>
                </div>
                <div id="capacityTrendsChartEmpty" class="empty-chart" style="display: none;">
                    <div class="empty-state-icon"><i class="fa-solid fa-chart-line" style="font-size: 3em; color: var(--text-secondary);"></i></div>
                    <p>${ui.t('noDataMessage')}</p>
                </div>
            </div>

            <!-- Material Performance Chart -->
            <div class="card analytics-chart full-width">
                <h3><i class="fa-solid fa-bullseye"></i> ${ui.t('materialPerformanceTitle')}</h3>
                <div class="chart-container">
                    <canvas id="materialChart" width="800" height="300"></canvas>
                </div>
                <div id="materialChartEmpty" class="empty-chart" style="display: none;">
                    <div class="empty-state-icon"><i class="fa-solid fa-bullseye" style="font-size: 3em; color: var(--text-secondary);"></i></div>
                    <p>${ui.t('noDataMessage')}</p>
                </div>
            </div>

            <!-- Stock Trends Chart -->
            <div class="card analytics-chart full-width">
                <h3><i class="fa-solid fa-chart-line"></i> ${ui.t('trendsTitle')}</h3>
                <div class="chart-container">
                    <canvas id="trendsChart" width="800" height="300"></canvas>
                </div>
                <div id="trendsChartEmpty" class="empty-chart" style="display: none;">
                    <div class="empty-state-icon"><i class="fa-solid fa-chart-line" style="font-size: 3em; color: var(--text-secondary);"></i></div>
                    <p>${ui.t('noDataMessage')}</p>
                </div>
            </div>
        </div>
    `;
}

// Analytics functionality
UIManager.prototype.updateAnalytics = function() {
    const period = document.getElementById('periodSelector').value;
    this.renderAnalyticsCharts(period);
};

UIManager.prototype.refreshAnalytics = function() {
    this.showToast('<i class="fa-solid fa-arrows-rotate"></i> Refreshing analytics...', 'info');
    this.updateAnalytics();
};

UIManager.prototype.renderAnalyticsCharts = function(period = 'month') {
    const archiveData = this.dataManager.getArchive();
    
    if (archiveData.length === 0) {
        this.showEmptyAnalytics();
        return;
    }

    // Filter data by period
    const filteredData = this.filterDataByPeriod(archiveData, period);
    
    if (filteredData.length === 0) {
        this.showEmptyAnalytics();
        return;
    }

    // Render individual charts
    this.renderAlertsChart(filteredData);
    this.renderCapacityByStorageChart(filteredData);
    this.renderCapacityTrendsChart(filteredData);
    this.renderMaterialPerformanceChart(filteredData);
    this.renderTrendsChart(filteredData);
};

UIManager.prototype.filterDataByPeriod = function(data, period) {
    const now = new Date();
    let cutoffDate;
    
    switch (period) {
        case 'week':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'quarter':
            cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        case 'all':
        default:
            return data;
    }
    
    return data.filter(entry => new Date(entry.timestamp) >= cutoffDate);
};

UIManager.prototype.renderAlertsChart = function(data) {
    const ctx = document.getElementById('alertsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.alertsChart) {
        this.alertsChart.destroy();
    }
    
    // Prepare data
    const labels = data.map(entry => new Date(entry.timestamp).toLocaleDateString());
    const alertCounts = data.map(entry => entry.summary.totalAlerts);
    
    this.alertsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: this.t('alertsCount'),
                data: alertCounts,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    document.getElementById('alertsChartEmpty').style.display = 'none';
};

UIManager.prototype.renderCapacityByStorageChart = function(data) {
    const ctx = document.getElementById('capacityByStorageChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.capacityByStorageChart) {
        this.capacityByStorageChart.destroy();
    }
    
    // Get latest data entry
    const latestEntry = data[data.length - 1];
    if (!latestEntry || !latestEntry.results || !latestEntry.results.materialGroups) {
        document.getElementById('capacityByStorageChartEmpty').style.display = 'flex';
        return;
    }
    
    // Calculate capacity utilization by storage type
    const storageCapacities = {};
    const storageStock = {};
    
    // Process each material group to get storage type data
    latestEntry.results.materialGroups.forEach(group => {
        group.rows.forEach(row => {
            const storageType = row.storageType;
            const stock = row.qty;
            
            // Initialize storage type if not exists
            if (!storageStock[storageType]) {
                storageStock[storageType] = 0;
                storageCapacities[storageType] = 0;
            }
            
            // Add stock
            storageStock[storageType] += stock;
            
            // Get capacity from material config
            const materialConfig = this.dataManager.getMaterial(row.material);
            if (materialConfig) {
                if (storageType === 'MKT') {
                    // For MKT, check if promotion is active
                    let capacity = materialConfig.capacity;
                    if (materialConfig.promoActive && materialConfig.promoCapacity) {
                        const endDate = new Date(materialConfig.promoEndDate);
                        const today = new Date();
                        if (!materialConfig.promoEndDate || endDate >= today) {
                            capacity = materialConfig.promoCapacity;
                        }
                    }
                    storageCapacities[storageType] += capacity;
                } else {
                    // For other storage types, use default capacity
                    const defaultCapacity = this.dataManager.getDefaultCapacityForStorageType(storageType) || 10;
                    storageCapacities[storageType] += defaultCapacity;
                }
            }
        });
    });
    
    // Prepare chart data
    const labels = Object.keys(storageStock);
    const stockData = labels.map(type => storageStock[type]);
    const capacityData = labels.map(type => storageCapacities[type]);
    const utilizationData = labels.map(type => {
        const capacity = storageCapacities[type];
        return capacity > 0 ? Math.min((storageStock[type] / capacity) * 100, 150) : 0; // Cap at 150% for visualization
    });
    
    if (labels.length === 0) {
        document.getElementById('capacityByStorageChartEmpty').style.display = 'flex';
        return;
    }
    
    this.capacityByStorageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: this.t('currentStock'),
                    data: stockData,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: this.t('maxCapacity'),
                    data: capacityData,
                    backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: this.t('utilizationPercent'),
                    data: utilizationData,
                    type: 'line',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    yAxisID: 'y1',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: this.t('units')
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: this.t('utilizationPercent')
                    },
                    beginAtZero: true,
                    max: 150,
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.datasetIndex === 2) { // Utilization percentage
                                return context.parsed.y > 100 ? '⚠ ' + ui.t('overCapacity') : '';
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
    
    document.getElementById('capacityByStorageChartEmpty').style.display = 'none';
};

UIManager.prototype.renderCapacityTrendsChart = function(data) {
    const ctx = document.getElementById('capacityTrendsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.capacityTrendsChart) {
        this.capacityTrendsChart.destroy();
    }
    
    if (data.length === 0) {
        document.getElementById('capacityTrendsChartEmpty').style.display = 'flex';
        return;
    }
    
    // Calculate capacity utilization trends over time
    const timeLabels = data.map(entry => new Date(entry.timestamp).toLocaleDateString());
    const storageTypes = new Set();
    
    // First pass: identify all storage types
    data.forEach(entry => {
        if (entry.results && entry.results.materialGroups) {
            entry.results.materialGroups.forEach(group => {
                group.rows.forEach(row => {
                    storageTypes.add(row.storageType);
                });
            });
        }
    });
    
    const storageTypeArray = Array.from(storageTypes);
    const datasets = [];
    
    // Colors for different storage types
    const colors = [
        'rgba(255, 99, 132, 1)',   // Red
        'rgba(54, 162, 235, 1)',   // Blue
        'rgba(255, 206, 86, 1)',   // Yellow
        'rgba(75, 192, 192, 1)',   // Teal
        'rgba(153, 102, 255, 1)',  // Purple
        'rgba(255, 159, 64, 1)'    // Orange
    ];
    
    // Create dataset for each storage type
    storageTypeArray.forEach((storageType, index) => {
        const utilizationData = [];
        
        data.forEach(entry => {
            let totalStock = 0;
            let totalCapacity = 0;
            
            if (entry.results && entry.results.materialGroups) {
                entry.results.materialGroups.forEach(group => {
                    group.rows.forEach(row => {
                        if (row.storageType === storageType) {
                            totalStock += row.qty;
                            
                            // Get capacity from material config
                            const materialConfig = this.dataManager.getMaterial(row.material);
                            if (materialConfig) {
                                if (storageType === 'MKT') {
                                    // For MKT, check if promotion was active at that time
                                    let capacity = materialConfig.capacity;
                                    if (materialConfig.promoActive && materialConfig.promoCapacity) {
                                        const endDate = new Date(materialConfig.promoEndDate);
                                        const entryDate = new Date(entry.timestamp);
                                        if (!materialConfig.promoEndDate || endDate >= entryDate) {
                                            capacity = materialConfig.promoCapacity;
                                        }
                                    }
                                    totalCapacity += capacity;
                                } else {
                                    // For other storage types, use default capacity
                                    const defaultCapacity = this.dataManager.getDefaultCapacityForStorageType(storageType) || 10;
                                    totalCapacity += defaultCapacity;
                                }
                            }
                        }
                    });
                });
            }
            
            // Calculate utilization percentage
            const utilization = totalCapacity > 0 ? (totalStock / totalCapacity) * 100 : 0;
            utilizationData.push(utilization);
        });
        
        datasets.push({
            label: `${storageType} ${this.t('utilizationPercent')}`,
            data: utilizationData,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length].replace('1)', '0.1)'),
            tension: 0.4,
            fill: false
        });
    });
    
    // Add horizontal line at 100% capacity
    datasets.push({
        label: '100% ' + this.t('maxCapacity'),
        data: new Array(timeLabels.length).fill(100),
        borderColor: 'rgba(255, 0, 0, 0.8)',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0
    });
    
    this.capacityTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    title: {
                        display: true,
                        text: this.t('utilizationPercent')
                    },
                    beginAtZero: true,
                    max: 150 // Cap at 150% for better visualization
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            return context.parsed.y > 100 ? '⚠ ' + ui.t('overCapacity') : '';
                        }
                    }
                }
            }
        }
    });
    
    document.getElementById('capacityTrendsChartEmpty').style.display = 'none';
};

UIManager.prototype.renderMaterialPerformanceChart = function(data) {
    const ctx = document.getElementById('materialChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.materialChart) {
        this.materialChart.destroy();
    }
    
    // Analyze material performance (most frequently alerted materials)
    const materialAlerts = {};
    
    data.forEach(entry => {
        if (entry.results && entry.results.alerts) {
            entry.results.alerts.forEach(alert => {
                const material = alert.material;
                if (!materialAlerts[material]) {
                    materialAlerts[material] = 0;
                }
                materialAlerts[material]++;
            });
        }
    });
    
    // Get top 10 materials by alert frequency
    const sortedMaterials = Object.entries(materialAlerts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    if (sortedMaterials.length === 0) {
        document.getElementById('materialChartEmpty').style.display = 'flex';
        return;
    }
    
    const labels = sortedMaterials.map(([material]) => material);
    const alertCounts = sortedMaterials.map(([, count]) => count);
    
    this.materialChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: this.t('alertsCount'),
                data: alertCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    document.getElementById('materialChartEmpty').style.display = 'none';
};

UIManager.prototype.renderTrendsChart = function(data) {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.trendsChart) {
        this.trendsChart.destroy();
    }
    
    // Prepare data for trends
    const labels = data.map(entry => new Date(entry.timestamp).toLocaleDateString());
    const totalMaterials = data.map(entry => entry.summary.totalMaterials);
    const totalAlerts = data.map(entry => entry.summary.totalAlerts);
    
    this.trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Materials',
                    data: totalMaterials,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: this.t('alertsCount'),
                    data: totalAlerts,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Materials Count'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: this.t('alertsCount')
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
    
    document.getElementById('trendsChartEmpty').style.display = 'none';
};

UIManager.prototype.showEmptyAnalytics = function() {
    // Show empty state for all charts
    const emptyElements = [
        'alertsChartEmpty',
        'capacityByStorageChartEmpty',
        'capacityTrendsChartEmpty',
        'materialChartEmpty',
        'trendsChartEmpty'
    ];
    
    emptyElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'flex';
        }
    });
    
    // Destroy existing charts
    if (this.alertsChart) this.alertsChart.destroy();
    if (this.capacityByStorageChart) this.capacityByStorageChart.destroy();
    if (this.capacityTrendsChart) this.capacityTrendsChart.destroy();
    if (this.materialChart) this.materialChart.destroy();
    if (this.trendsChart) this.trendsChart.destroy();
};

// Initialize analytics when tab is loaded
UIManager.prototype.initializeAnalytics = function() {
    this.updateAnalytics();
};
