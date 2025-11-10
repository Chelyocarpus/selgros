/* ===========================
   DEXIE.JS DATABASE MANAGER
   Modern IndexedDB wrapper using Dexie.js
   Primary storage solution with localStorage fallback
   =========================== */

class DexieDBManager {
    constructor() {
        this.dbName = 'WarehouseDB';
        this.db = null;
        this.initialized = false;
        this.isAvailable = false;
        
        // Cross-tab sync using BroadcastChannel
        this.syncChannel = null;
        this.initBroadcastChannel();
        
        // Initialize Dexie database
        this.init();
    }
    
    // Initialize BroadcastChannel for cross-tab communication
    initBroadcastChannel() {
        try {
            if ('BroadcastChannel' in window) {
                this.syncChannel = new BroadcastChannel('warehouse_sync');
                console.log('Dexie: BroadcastChannel initialized for cross-tab sync');
            } else {
                console.warn('Dexie: BroadcastChannel not supported in this browser');
            }
        } catch (error) {
            console.warn('Dexie: Failed to initialize BroadcastChannel:', error);
        }
    }
    
    // Broadcast change notification to other tabs
    broadcastChange(type, data = null) {
        if (this.syncChannel) {
            try {
                this.syncChannel.postMessage({
                    type: type,
                    timestamp: Date.now(),
                    data: data
                });
            } catch (error) {
                console.warn('Dexie: Failed to broadcast change:', error);
            }
        }
    }
    
    // Listen for changes from other tabs
    onSyncMessage(callback) {
        if (this.syncChannel) {
            this.syncChannel.onmessage = (event) => {
                callback(event.data);
            };
        }
    }

    // Initialize Dexie database with schema
    init() {
        try {
            // Check if Dexie is available
            if (typeof Dexie === 'undefined') {
                console.error('Dexie.js not loaded');
                this.isAvailable = false;
                return;
            }

            // Create database instance
            this.db = new Dexie(this.dbName);

            // Define schema (version 1)
            this.db.version(1).stores({
                materials: 'code, name, capacity, group, updatedAt',
                archive: 'id, timestamp',
                groups: 'id, name',
                notes: 'id, materialCode, createdAt',
                alertRules: 'key',
                storageTypes: 'key',
                metadata: 'key'
            });

            // Set up populate hook for initial data
            this.db.on('populate', () => {
                console.log('Dexie: Populating initial metadata');
                this.db.metadata.add({
                    key: 'initialized',
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                });
            });

            // Open the database
            this.db.open()
                .then(() => {
                    this.initialized = true;
                    this.isAvailable = true;
                    console.log('Dexie: Database initialized successfully');
                })
                .catch(err => {
                    console.error('Dexie: Failed to open database:', err);
                    this.isAvailable = false;
                });

        } catch (error) {
            console.error('Dexie: Initialization error:', error);
            this.isAvailable = false;
        }
    }

    // Check if database is ready
    checkAvailability() {
        return this.initialized && this.isAvailable && this.db !== null;
    }

    // =================== MATERIALS ===================

    // Save all materials (bulk operation)
    async saveMaterials(materialsObj) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            // Convert object to array
            const materialsArray = Object.values(materialsObj);
            
            // Clear existing materials and add new ones
            await this.db.transaction('rw', this.db.materials, async () => {
                await this.db.materials.clear();
                await this.db.materials.bulkAdd(materialsArray);
            });

            // Update metadata
            await this.db.metadata.put({
                key: 'lastMaterialsSync',
                timestamp: new Date().toISOString(),
                count: materialsArray.length
            });

            console.log(`Dexie: Saved ${materialsArray.length} materials`);
            
            // Broadcast change to other tabs
            this.broadcastChange('materials_updated', { count: materialsArray.length });
            
            return true;
        } catch (error) {
            console.error('Dexie: Error saving materials:', error);
            throw error;
        }
    }

    // Load all materials
    async loadMaterials() {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const materialsArray = await this.db.materials.toArray();
            
            // Convert array to object keyed by code
            const materialsObj = {};
            materialsArray.forEach(material => {
                materialsObj[material.code] = material;
            });

            console.log(`Dexie: Loaded ${materialsArray.length} materials`);
            return materialsObj;
        } catch (error) {
            console.error('Dexie: Error loading materials:', error);
            throw error;
        }
    }

    // Add or update single material
    async saveMaterial(material) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.materials.put(material);
            console.log(`Dexie: Saved material ${material.code}`);
            
            // Broadcast change to other tabs
            this.broadcastChange('material_saved', { code: material.code });
            
            return true;
        } catch (error) {
            console.error('Dexie: Error saving material:', error);
            throw error;
        }
    }

    // Delete single material
    async deleteMaterial(code) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.materials.delete(code);
            console.log(`Dexie: Deleted material ${code}`);
            
            // Broadcast change to other tabs
            this.broadcastChange('material_deleted', { code: code });
            
            return true;
        } catch (error) {
            console.error('Dexie: Error deleting material:', error);
            throw error;
        }
    }

    // Get single material
    async getMaterial(code) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const material = await this.db.materials.get(code);
            return material || null;
        } catch (error) {
            console.error('Dexie: Error getting material:', error);
            throw error;
        }
    }

    // =================== ARCHIVE ===================

    // Save all archive entries (bulk operation)
    async saveArchive(archiveArray) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            // Limit to 50 entries
            const limitedArchive = archiveArray.slice(0, 50);

            await this.db.transaction('rw', this.db.archive, async () => {
                await this.db.archive.clear();
                await this.db.archive.bulkAdd(limitedArchive);
            });

            // Update metadata
            await this.db.metadata.put({
                key: 'lastArchiveSync',
                timestamp: new Date().toISOString(),
                count: limitedArchive.length
            });

            console.log(`Dexie: Saved ${limitedArchive.length} archive entries`);
            
            // Broadcast change to other tabs
            this.broadcastChange('archive_updated', { count: limitedArchive.length });
            
            return true;
        } catch (error) {
            console.error('Dexie: Error saving archive:', error);
            throw error;
        }
    }

    // Load all archive entries (sorted by timestamp descending)
    async loadArchive() {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            // Use orderBy to sort by timestamp in descending order
            const archive = await this.db.archive
                .orderBy('timestamp')
                .reverse()
                .toArray();

            console.log(`Dexie: Loaded ${archive.length} archive entries`);
            return archive;
        } catch (error) {
            console.error('Dexie: Error loading archive:', error);
            throw error;
        }
    }

    // Add single archive entry
    async addArchiveEntry(entry) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.archive.add(entry);
            
            // Keep only last 50 entries
            const count = await this.db.archive.count();
            if (count > 50) {
                const oldestEntries = await this.db.archive
                    .orderBy('timestamp')
                    .limit(count - 50)
                    .primaryKeys();
                await this.db.archive.bulkDelete(oldestEntries);
            }

            return true;
        } catch (error) {
            console.error('Dexie: Error adding archive entry:', error);
            throw error;
        }
    }

    // Delete archive entry
    async deleteArchiveEntry(id) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.archive.delete(id);
            console.log(`Dexie: Deleted archive entry ${id}`);
            return true;
        } catch (error) {
            console.error('Dexie: Error deleting archive entry:', error);
            throw error;
        }
    }

    // Clear all archive entries
    async clearArchive() {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.archive.clear();
            console.log('Dexie: Cleared all archive entries');
            return true;
        } catch (error) {
            console.error('Dexie: Error clearing archive:', error);
            throw error;
        }
    }

    // =================== GROUPS ===================

    // Save all groups
    async saveGroups(groupsObj) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const groupsArray = Object.values(groupsObj);
            
            await this.db.transaction('rw', this.db.groups, async () => {
                await this.db.groups.clear();
                await this.db.groups.bulkAdd(groupsArray);
            });

            console.log(`Dexie: Saved ${groupsArray.length} groups`);
            
            // Broadcast change to other tabs
            this.broadcastChange('groups_updated', { count: groupsArray.length });
            
            return true;
        } catch (error) {
            console.error('Dexie: Error saving groups:', error);
            throw error;
        }
    }

    // Load all groups
    async loadGroups() {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const groupsArray = await this.db.groups.toArray();
            
            const groupsObj = {};
            groupsArray.forEach(group => {
                groupsObj[group.id] = group;
            });

            console.log(`Dexie: Loaded ${groupsArray.length} groups`);
            return groupsObj;
        } catch (error) {
            console.error('Dexie: Error loading groups:', error);
            throw error;
        }
    }

    // =================== NOTES ===================

    // Save all notes
    async saveNotes(notesObj) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const notesArray = Object.values(notesObj);
            
            await this.db.transaction('rw', this.db.notes, async () => {
                await this.db.notes.clear();
                await this.db.notes.bulkAdd(notesArray);
            });

            console.log(`Dexie: Saved ${notesArray.length} notes`);
            
            // Broadcast change to other tabs
            this.broadcastChange('notes_updated', { count: notesArray.length });
            
            return true;
        } catch (error) {
            console.error('Dexie: Error saving notes:', error);
            throw error;
        }
    }

    // Load all notes
    async loadNotes() {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const notesArray = await this.db.notes.toArray();
            
            const notesObj = {};
            notesArray.forEach(note => {
                notesObj[note.id] = note;
            });

            console.log(`Dexie: Loaded ${notesArray.length} notes`);
            return notesObj;
        } catch (error) {
            console.error('Dexie: Error loading notes:', error);
            throw error;
        }
    }

    // =================== ALERT RULES ===================

    // Save alert rules
    async saveAlertRules(rules) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.alertRules.put({
                key: 'alertRules',
                data: rules,
                updatedAt: new Date().toISOString()
            });

            console.log('Dexie: Saved alert rules');
            return true;
        } catch (error) {
            console.error('Dexie: Error saving alert rules:', error);
            throw error;
        }
    }

    // Load alert rules
    async loadAlertRules() {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const record = await this.db.alertRules.get('alertRules');
            console.log('Dexie: Loaded alert rules');
            return record ? record.data : null;
        } catch (error) {
            console.error('Dexie: Error loading alert rules:', error);
            throw error;
        }
    }

    // =================== STORAGE TYPE SETTINGS ===================

    // Save storage type settings
    async saveStorageTypeSettings(settings) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.storageTypes.put({
                key: 'storageTypeSettings',
                data: settings,
                updatedAt: new Date().toISOString()
            });

            console.log('Dexie: Saved storage type settings');
            return true;
        } catch (error) {
            console.error('Dexie: Error saving storage type settings:', error);
            throw error;
        }
    }

    // Load storage type settings
    async loadStorageTypeSettings() {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const record = await this.db.storageTypes.get('storageTypeSettings');
            console.log('Dexie: Loaded storage type settings');
            return record ? record.data : null;
        } catch (error) {
            console.error('Dexie: Error loading storage type settings:', error);
            throw error;
        }
    }

    // =================== METADATA & SYNC ===================

    // Get sync metadata
    async getSyncMetadata() {
        if (!this.checkAvailability()) {
            return null;
        }

        try {
            const materialsSync = await this.db.metadata.get('lastMaterialsSync');
            const archiveSync = await this.db.metadata.get('lastArchiveSync');
            const initialized = await this.db.metadata.get('initialized');

            return {
                materials: materialsSync || null,
                archive: archiveSync || null,
                initialized: initialized || null,
                available: this.isAvailable
            };
        } catch (error) {
            console.error('Dexie: Error getting sync metadata:', error);
            return null;
        }
    }

    // Clear all data
    async clearAll() {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.transaction('rw', 
                [this.db.materials, this.db.archive, this.db.groups, 
                 this.db.notes, this.db.alertRules, this.db.storageTypes, this.db.metadata],
                async () => {
                    await this.db.materials.clear();
                    await this.db.archive.clear();
                    await this.db.groups.clear();
                    await this.db.notes.clear();
                    await this.db.alertRules.clear();
                    await this.db.storageTypes.clear();
                    await this.db.metadata.clear();
                }
            );

            console.log('Dexie: All data cleared');
            return true;
        } catch (error) {
            console.error('Dexie: Error clearing all data:', error);
            throw error;
        }
    }

    // Export all data for backup
    async exportAllData() {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const [materials, archive, groups, notes, alertRules, storageTypes] = await Promise.all([
                this.loadMaterials(),
                this.loadArchive(),
                this.loadGroups(),
                this.loadNotes(),
                this.loadAlertRules(),
                this.loadStorageTypeSettings()
            ]);

            return {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                appName: 'Warehouse Early Warning System',
                data: {
                    materials,
                    archive,
                    groups,
                    notes,
                    alertRules,
                    storageTypeSettings: storageTypes
                }
            };
        } catch (error) {
            console.error('Dexie: Error exporting data:', error);
            throw error;
        }
    }

    // Import all data from backup
    async importAllData(backupData) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const data = backupData.data;

            await this.db.transaction('rw',
                [this.db.materials, this.db.archive, this.db.groups, 
                 this.db.notes, this.db.alertRules, this.db.storageTypes],
                async () => {
                    if (data.materials) await this.saveMaterials(data.materials);
                    if (data.archive) await this.saveArchive(data.archive);
                    if (data.groups) await this.saveGroups(data.groups);
                    if (data.notes) await this.saveNotes(data.notes);
                    if (data.alertRules) await this.saveAlertRules(data.alertRules);
                    if (data.storageTypeSettings) await this.saveStorageTypeSettings(data.storageTypeSettings);
                }
            );

            console.log('Dexie: Data imported successfully');
            return true;
        } catch (error) {
            console.error('Dexie: Error importing data:', error);
            throw error;
        }
    }

    // Query materials by group
    async getMaterialsByGroup(groupId) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const materials = await this.db.materials
                .where('group')
                .equals(groupId)
                .toArray();
            
            return materials;
        } catch (error) {
            console.error('Dexie: Error getting materials by group:', error);
            throw error;
        }
    }

    // Query notes by material
    async getNotesByMaterial(materialCode) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const notes = await this.db.notes
                .where('materialCode')
                .equals(materialCode)
                .toArray();
            
            return notes;
        } catch (error) {
            console.error('Dexie: Error getting notes by material:', error);
            throw error;
        }
    }

    // Search materials by name (case-insensitive)
    async searchMaterialsByName(searchTerm) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const allMaterials = await this.db.materials.toArray();
            const lowerSearch = searchTerm.toLowerCase();
            
            return allMaterials.filter(material => 
                material.name && material.name.toLowerCase().includes(lowerSearch)
            );
        } catch (error) {
            console.error('Dexie: Error searching materials:', error);
            throw error;
        }
    }
}
