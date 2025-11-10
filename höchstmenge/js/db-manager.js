/* ===========================
   INDEXEDDB MANAGER
   Hybrid backup system: localStorage as primary, IndexedDB as reliable backup
   =========================== */

class DBManager {
    constructor() {
        this.dbName = 'WarehouseDB';
        this.dbVersion = 1;
        this.db = null;
        this.initialized = false;
        this.syncEnabled = true;
        
        // Initialize IndexedDB
        this.init().catch(err => {
            console.warn('IndexedDB initialization failed:', err);
            this.syncEnabled = false;
        });
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            // Check if IndexedDB is available
            if (!window.indexedDB) {
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.initialized = true;
                console.log('IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create materials store
                if (!db.objectStoreNames.contains('materials')) {
                    const materialsStore = db.createObjectStore('materials', { keyPath: 'code' });
                    materialsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                // Create archive store
                if (!db.objectStoreNames.contains('archive')) {
                    const archiveStore = db.createObjectStore('archive', { keyPath: 'id' });
                    archiveStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create metadata store (for sync tracking)
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }

    // Save materials to IndexedDB
    async saveMaterials(materials) {
        if (!this.initialized || !this.syncEnabled) {
            return false;
        }

        try {
            const transaction = this.db.transaction(['materials', 'metadata'], 'readwrite');
            const materialsStore = transaction.objectStore('materials');
            const metadataStore = transaction.objectStore('metadata');

            // Clear existing materials
            await this._promisifyRequest(materialsStore.clear());

            // Add all materials
            const materialsArray = Object.values(materials);
            for (const material of materialsArray) {
                await this._promisifyRequest(materialsStore.add(material));
            }

            // Update metadata
            await this._promisifyRequest(metadataStore.put({
                key: 'lastMaterialsSync',
                timestamp: new Date().toISOString(),
                count: materialsArray.length
            }));

            console.log(`IndexedDB: Synced ${materialsArray.length} materials`);
            return true;
        } catch (error) {
            console.error('Error saving materials to IndexedDB:', error);
            return false;
        }
    }

    // Load materials from IndexedDB
    async loadMaterials() {
        if (!this.initialized) {
            throw new Error('IndexedDB not initialized');
        }

        try {
            const transaction = this.db.transaction(['materials'], 'readonly');
            const store = transaction.objectStore('materials');
            const request = store.getAll();

            const materials = await this._promisifyRequest(request);
            
            // Convert array to object keyed by code
            const materialsObj = {};
            materials.forEach(material => {
                materialsObj[material.code] = material;
            });

            console.log(`IndexedDB: Loaded ${materials.length} materials`);
            return materialsObj;
        } catch (error) {
            console.error('Error loading materials from IndexedDB:', error);
            throw error;
        }
    }

    // Save archive to IndexedDB
    async saveArchive(archive) {
        if (!this.initialized || !this.syncEnabled) {
            return false;
        }

        try {
            const transaction = this.db.transaction(['archive', 'metadata'], 'readwrite');
            const archiveStore = transaction.objectStore('archive');
            const metadataStore = transaction.objectStore('metadata');

            // Clear existing archive
            await this._promisifyRequest(archiveStore.clear());

            // Add all archive entries
            for (const entry of archive) {
                await this._promisifyRequest(archiveStore.add(entry));
            }

            // Update metadata
            await this._promisifyRequest(metadataStore.put({
                key: 'lastArchiveSync',
                timestamp: new Date().toISOString(),
                count: archive.length
            }));

            console.log(`IndexedDB: Synced ${archive.length} archive entries`);
            return true;
        } catch (error) {
            console.error('Error saving archive to IndexedDB:', error);
            return false;
        }
    }

    // Load archive from IndexedDB
    async loadArchive() {
        if (!this.initialized) {
            throw new Error('IndexedDB not initialized');
        }

        try {
            const transaction = this.db.transaction(['archive'], 'readonly');
            const store = transaction.objectStore('archive');
            const index = store.index('timestamp');
            
            // Get all entries sorted by timestamp (newest first)
            const request = index.openCursor(null, 'prev');
            const archive = [];

            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        archive.push(cursor.value);
                        cursor.continue();
                    } else {
                        console.log(`IndexedDB: Loaded ${archive.length} archive entries`);
                        resolve(archive);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error loading archive from IndexedDB:', error);
            throw error;
        }
    }

    // Get sync metadata
    async getSyncMetadata() {
        if (!this.initialized) {
            return null;
        }

        try {
            const transaction = this.db.transaction(['metadata'], 'readonly');
            const store = transaction.objectStore('metadata');

            const materialsSync = await this._promisifyRequest(store.get('lastMaterialsSync'));
            const archiveSync = await this._promisifyRequest(store.get('lastArchiveSync'));

            return {
                materials: materialsSync || null,
                archive: archiveSync || null,
                enabled: this.syncEnabled,
                initialized: this.initialized
            };
        } catch (error) {
            console.error('Error getting sync metadata:', error);
            return null;
        }
    }

    // Restore from IndexedDB to localStorage (recovery function)
    async restoreToLocalStorage() {
        if (!this.initialized) {
            throw new Error('IndexedDB not initialized');
        }

        try {
            const materials = await this.loadMaterials();
            const archive = await this.loadArchive();

            // Save to localStorage
            localStorage.setItem('warehouse_materials', JSON.stringify(materials));
            localStorage.setItem('warehouse_archive', JSON.stringify(archive));

            return {
                success: true,
                materialsCount: Object.keys(materials).length,
                archiveCount: archive.length
            };
        } catch (error) {
            console.error('Error restoring from IndexedDB:', error);
            throw error;
        }
    }

    // Clear all IndexedDB data
    async clearAll() {
        if (!this.initialized) {
            return false;
        }

        try {
            const transaction = this.db.transaction(['materials', 'archive', 'metadata'], 'readwrite');
            
            await this._promisifyRequest(transaction.objectStore('materials').clear());
            await this._promisifyRequest(transaction.objectStore('archive').clear());
            await this._promisifyRequest(transaction.objectStore('metadata').clear());

            console.log('IndexedDB: All data cleared');
            return true;
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
            return false;
        }
    }

    // Helper to convert IDBRequest to Promise
    _promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Check if IndexedDB is available and working
    isAvailable() {
        return this.initialized && this.syncEnabled;
    }
}
