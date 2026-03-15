/* ===========================
   REPORT PROCESSOR
   =========================== */

class ReportProcessor {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // Parse LX02 report data
    parseReport(inputText) {
        const lines = inputText.trim().split('\n');
        const stockData = {};
        const totalReported = {};
        const storageTypesSet = new Set();
        const materialNames = {}; // Store material descriptions
        
        let isFirstLine = true;

        lines.forEach((line, index) => {
            if (!line.trim()) return;

            // Split by tab or multiple spaces
            const cols = line.split(/\t/);
            
            // Skip header row (contains "Artikel" or similar)
            if (isFirstLine && (cols[0]?.toLowerCase().includes('artikel') || cols[0]?.toLowerCase().includes('material'))) {
                isFirstLine = false;
                return;
            }
            isFirstLine = false;

            // Extract fields based on LX02 format
            // Artikel | Artikelkurztext | Verfügbarer Bestand | Basismengeneinheit (ST) | Lagertyp | Lagerplatz | ...
            const material = cols[0]?.trim();
            const materialDesc = cols[1]?.trim();
            const availableStock = parseInt(cols[2]?.trim()) || 0; // Verfügbarer Bestand (Available Stock)
            const unit = cols[3]?.trim(); // ST - Base unit of measurement (Basismengeneinheit)
            const storageType = cols[4]?.trim(); // Lagertyp (e.g., MKT, LAG, 916, etc.)
            const totalStock = parseInt(cols[cols.length - 1]?.trim()) || 0;

            // Skip lines without material code or storage type
            if (!material || !storageType) return;
            
            // Skip lines with zero quantity
            if (availableStock === 0 && totalStock === 0) return;

            // Store material description if available
            if (materialDesc && !materialNames[material]) {
                materialNames[material] = materialDesc;
            }

            if (!stockData[material]) {
                stockData[material] = {};
            }

            // Add stock for this storage type
            stockData[material][storageType] = (stockData[material][storageType] || 0) + availableStock;
            
            if (storageType) {
                storageTypesSet.add(storageType);
            }

            // Store total reported stock
            if (totalStock > 0) {
                totalReported[material] = totalStock;
            }
        });

        return {
            stockData,
            totalReported,
            storageTypes: Array.from(storageTypesSet),
            materialNames
        };
    }

    // Analyze stock data and generate alerts
    analyzeStock(parsedData) {
        const { stockData, totalReported, materialNames } = parsedData;
        const materialGroups = []; // Group by material
        let totalAlerts = 0;

        Object.keys(stockData).forEach(material => {
            const storageTypes = stockData[material];
            let totalStock = 0;
            const materialName = materialNames[material] || '';
            const rows = [];

            Object.keys(storageTypes).forEach(storageType => {
                const qty = storageTypes[storageType];
                totalStock += qty;

                const alerts = [];

                // Check capacity for enabled storage types
                if (this.dataManager.isStorageTypeEnabled(storageType)) {
                    const materialConfig = this.dataManager.getMaterial(material);
                    
                    if (materialConfig) {
                        // Check if promotion is active and not expired (only for MKT)
                        let isPromoActive = storageType === 'MKT' && materialConfig.promoActive;
                        
                        if (isPromoActive && materialConfig.promoEndDate) {
                            const endDate = new Date(materialConfig.promoEndDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            if (endDate < today) {
                                isPromoActive = false;
                            }
                        }

                        // Determine which capacity to check against
                        let effectiveCapacity;
                        if (storageType === 'MKT') {
                            // For MKT, use promo capacity if active, otherwise normal capacity
                            effectiveCapacity = (isPromoActive && materialConfig.promoCapacity) 
                                ? materialConfig.promoCapacity 
                                : materialConfig.capacity;
                        } else {
                            // For other storage types, use default capacity if no material-specific value
                            effectiveCapacity = materialConfig.capacities?.[storageType] || 
                                              this.dataManager.getDefaultCapacityForStorageType(storageType);
                        }

                        const capacityType = (isPromoActive && materialConfig.promoCapacity) ? 'promo' : 'normal';

                        if (qty > effectiveCapacity) {
                            alerts.push({
                                type: 'danger',
                                message: `Over capacity (${qty}/${effectiveCapacity})`,
                                capacityType: capacityType
                            });
                            totalAlerts++;
                        }

                        // Store capacity info for display
                        rows.capacityInfo = {
                            effectiveCapacity: effectiveCapacity,
                            capacityType: capacityType,
                            isPromoActive: isPromoActive
                        };
                    }
                }

                rows.push({
                    material,
                    materialName,
                    storageType,
                    qty,
                    totalStock,
                    alerts
                });
            });

            // Add material group
            materialGroups.push({
                material,
                materialName,
                totalStock,
                rows,
                hasMultipleStorageTypes: rows.length > 1,
                capacityInfo: rows.capacityInfo
            });
        });

        return {
            materialGroups,
            totalMaterials: Object.keys(stockData).length,
            totalAlerts,
            storageLocations: parsedData.storageTypes.length
        };
    }
}
