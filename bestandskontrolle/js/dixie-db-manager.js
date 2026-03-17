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
        this.tabId = 'tab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
        this.syncChannel = null;
        this.initBroadcastChannel();
        
        // Initialize Dexie database
        this.init();
    }
    
    // Initialize BroadcastChannel for cross-tab communication
    initBroadcastChannel() {
        try {
            if ('BroadcastChannel' in window) {
                this.syncChannel = new BroadcastChannel('warehouse_app_sync');
                console.log('Dexie: BroadcastChannel initialized for cross-tab sync');
            } else {
                console.warn('Dexie: BroadcastChannel not supported in this browser');
            }
        } catch (error) {
            console.warn('Dexie: Failed to initialize BroadcastChannel:', error);
        }
    }
    
    // Broadcast change notification to other tabs
    broadcastChange(type, payload = null) {
        if (this.syncChannel) {
            try {
                this.syncChannel.postMessage({
                    type,
                    source: 'dexie',
                    tabId: this.tabId,
                    timestamp: Date.now(),
                    payload
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

            // Define schema (version 1) — kept for upgrade path from existing databases
            this.db.version(1).stores({
                materials: 'code, name, capacity, group, updatedAt',
                archive: 'id, timestamp',
                groups: 'id, name',
                notes: 'id, materialCode, createdAt',
                alertRules: 'key',
                storageTypes: 'key',
                metadata: 'key'
            });

            // Version 2: Add compound indexes for common query patterns.
            // Dexie handles the upgrade automatically — no data migration needed
            // because we are only adding new indexes, not changing existing ones.
            //   [group+capacity]   — getMaterialsByGroup sorted by capacity
            //   [group+updatedAt]  — getMaterialsByGroup sorted by recency
            //   [materialCode+createdAt] — getNotesByMaterial chronologically ordered
            //   groups.updatedAt   — detect group staleness during sync
            this.db.version(2).stores({
                materials: 'code, name, capacity, group, updatedAt, [group+capacity], [group+updatedAt]',
                archive: 'id, timestamp',
                groups: 'id, name, updatedAt',
                notes: 'id, materialCode, createdAt, [materialCode+createdAt]',
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
    async saveMaterials(materialsObj, { silent = false } = {}) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const materialsArray = Object.values(materialsObj);
            const incomingKeys = new Set(materialsArray.map(m => m.code));

            await this.db.transaction('rw', this.db.materials, async () => {
                // Remove records that no longer exist in the incoming set
                const existingKeys = await this.db.materials.toCollection().primaryKeys();
                const keysToDelete = existingKeys.filter(k => !incomingKeys.has(k));
                if (keysToDelete.length > 0) {
                    await this.db.materials.bulkDelete(keysToDelete);
                }
                // Upsert all incoming records
                await this.db.materials.bulkPut(materialsArray);
            });

            // Update metadata
            await this.db.metadata.put({
                key: 'lastMaterialsSync',
                timestamp: new Date().toISOString(),
                count: materialsArray.length
            });

            console.log(`Dexie: Saved ${materialsArray.length} materials`);
            // silent=true suppresses broadcast for mirror writes that should not
            // trigger cross-tab sync handlers (e.g. mirrorToDexie after GitHub fetch)
            if (!silent) this.broadcastChange('MATERIALS_UPDATED', { count: materialsArray.length });
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
    async saveMaterial(material, { silent = false } = {}) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.materials.put(material);
            console.log(`Dexie: Saved material ${material.code}`);

            if (!silent) this.broadcastChange('MATERIAL_SAVED', { code: material.code });

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
            this.broadcastChange('MATERIAL_DELETED', { code: code });
            
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
    async saveArchive(archiveArray, { silent = false } = {}) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            // Limit to 50 entries (newest first — caller is expected to pre-sort)
            const limitedArchive = archiveArray.slice(0, 50);
            const incomingIds = new Set(limitedArchive.map(e => e.id));

            await this.db.transaction('rw', this.db.archive, async () => {
                // Remove entries that are no longer in the incoming set
                const existingKeys = await this.db.archive.toCollection().primaryKeys();
                const keysToDelete = existingKeys.filter(k => !incomingIds.has(k));
                if (keysToDelete.length > 0) {
                    await this.db.archive.bulkDelete(keysToDelete);
                }
                // Upsert all incoming entries
                await this.db.archive.bulkPut(limitedArchive);
            });

            // Update metadata
            await this.db.metadata.put({
                key: 'lastArchiveSync',
                timestamp: new Date().toISOString(),
                count: limitedArchive.length
            });

            console.log(`Dexie: Saved ${limitedArchive.length} archive entries`);
            if (!silent) this.broadcastChange('ARCHIVE_UPDATED', { count: limitedArchive.length });
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

    // Add single archive entry — capped at 50 entries, atomic via transaction
    async addArchiveEntry(entry) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            await this.db.transaction('rw', this.db.archive, async () => {
                // Read count inside the transaction to avoid TOCTOU race between
                // two concurrent addArchiveEntry calls.
                const count = await this.db.archive.count();
                if (count >= 50) {
                    const oldestEntries = await this.db.archive
                        .orderBy('timestamp')
                        .limit(count - 49)
                        .primaryKeys();
                    await this.db.archive.bulkDelete(oldestEntries);
                }
                await this.db.archive.add(entry);
            });

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
    async saveGroups(groupsObj, { silent = false } = {}) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const groupsArray = Object.values(groupsObj);
            const incomingKeys = new Set(groupsArray.map(g => g.id));

            await this.db.transaction('rw', this.db.groups, async () => {
                // Remove groups that no longer exist in the incoming set
                const existingKeys = await this.db.groups.toCollection().primaryKeys();
                const keysToDelete = existingKeys.filter(k => !incomingKeys.has(k));
                if (keysToDelete.length > 0) {
                    await this.db.groups.bulkDelete(keysToDelete);
                }
                // Upsert all incoming groups
                await this.db.groups.bulkPut(groupsArray);
            });

            console.log(`Dexie: Saved ${groupsArray.length} groups`);
            if (!silent) this.broadcastChange('GROUPS_UPDATED', { count: groupsArray.length });
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
    async saveNotes(notesObj, { silent = false } = {}) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            const notesArray = Object.values(notesObj);
            const incomingKeys = new Set(notesArray.map(n => n.id));

            await this.db.transaction('rw', this.db.notes, async () => {
                // Remove notes that no longer exist in the incoming set
                const existingKeys = await this.db.notes.toCollection().primaryKeys();
                const keysToDelete = existingKeys.filter(k => !incomingKeys.has(k));
                if (keysToDelete.length > 0) {
                    await this.db.notes.bulkDelete(keysToDelete);
                }
                // Upsert all incoming notes
                await this.db.notes.bulkPut(notesArray);
            });

            console.log(`Dexie: Saved ${notesArray.length} notes`);
            if (!silent) this.broadcastChange('NOTES_UPDATED', { count: notesArray.length });
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

    // Query materials by group using the dedicated group index
    async getMaterialsByGroup(groupId) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            return await this.db.materials
                .where('group')
                .equals(groupId)
                .toArray();
        } catch (error) {
            console.error('Dexie: Error getting materials by group:', error);
            throw error;
        }
    }

    // Query notes by material, sorted newest-first using the compound index
    async getNotesByMaterial(materialCode) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            // Use the [materialCode+createdAt] compound index (added in schema v2)
            // to retrieve notes for this material in chronological order without
            // a client-side sort — O(log N) lookup instead of full-table scan.
            const notes = await this.db.notes
                .where('[materialCode+createdAt]')
                .between(
                    [materialCode, Dexie.minKey],
                    [materialCode, Dexie.maxKey]
                )
                .reverse() // newest first
                .toArray();

            return notes;
        } catch (error) {
            console.error('Dexie: Error getting notes by material:', error);
            throw error;
        }
    }

    // Query materials by group sorted by capacity (descending) using compound index
    async getMaterialsByGroupSortedByCapacity(groupId) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            return await this.db.materials
                .where('[group+capacity]')
                .between(
                    [groupId, Dexie.minKey],
                    [groupId, Dexie.maxKey]
                )
                .reverse() // highest capacity first
                .toArray();
        } catch (error) {
            console.error('Dexie: Error getting materials by group (sorted by capacity):', error);
            throw error;
        }
    }

    // Search materials by name (case-insensitive)
    async searchMaterialsByName(searchTerm) {
        if (!this.checkAvailability()) {
            throw new Error('Database not available');
        }

        try {
            if (!searchTerm) {
                return await this.db.materials.toArray();
            }
            return await this.db.materials
                .where('name')
                .startsWithIgnoreCase(searchTerm)
                .toArray();
        } catch (error) {
            console.error('Dexie: Error searching materials:', error);
            throw error;
        }
    }
}
