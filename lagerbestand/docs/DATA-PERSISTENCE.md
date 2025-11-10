# Data Persistence System

## Overview
The warehouse system now has **three layers of data persistence** to ensure your data is safe:

1. **localStorage** (Primary) - Fast, synchronous storage
2. **IndexedDB** (Automatic Backup) - More reliable, larger capacity
3. **JSON Export/Import** (Manual Backup) - User-controlled file-based backups

## Features

### 1. Manual Export/Import (Immediate Use)

#### Export Data
- **Location**: Materials tab → "Data Backup" card
- **Button**: 📥 Export Data
- **What it does**: Downloads a JSON file with all your materials and archived reports
- **Filename format**: `warehouse_backup_YYYY-MM-DD.json`
- **Use cases**:
  - Before major changes
  - Regular backups to disk
  - Sharing data between computers
  - Version control of your configuration

#### Import Data
- **Location**: Materials tab → "Data Backup" card  
- **Button**: 📤 Import Data
- **What it does**: Restores data from a previously exported JSON file
- **Features**:
  - Validates JSON structure before importing
  - Shows count of imported materials and reports
  - Automatically refreshes UI
  - Updates IndexedDB sync after import

### 2. Automatic IndexedDB Sync (Background)

#### How It Works
- **Automatic**: Every time you save materials or archive, data is synced to IndexedDB
- **Background**: Happens asynchronously, doesn't block UI
- **Fail-safe**: If IndexedDB isn't available, app continues with localStorage only
- **Capacity**: IndexedDB can store gigabytes (vs localStorage's ~10MB limit)

#### Sync Status Display
Located in Materials tab → "Automatic Sync" card:

**Active Status** (Green ✅):
- Shows last sync time for materials and archive
- Shows count of synced items
- Means IndexedDB is working and backing up your data

**Inactive Status** (Yellow ⚠️):
- IndexedDB not supported or failed to initialize
- App will still work with localStorage only
- Export/import still available

#### Restore from IndexedDB
- **Location**: Materials tab → "Automatic Sync" card
- **Button**: ⚡ Restore from IndexedDB
- **What it does**: Copies data from IndexedDB back to localStorage
- **Use cases**:
  - Recover if localStorage was cleared
  - Fix corrupted localStorage data
  - Restore after accidental deletion

**⚠️ Warning**: Restore operation replaces current localStorage data

## Architecture

### Data Flow
```
User Action
    ↓
DataManager (sync operation)
    ↓
localStorage (immediate save)
    ↓
IndexedDB (background sync)
```

### Storage Structure

#### localStorage Keys
- `warehouse_materials` - All material configurations
- `warehouse_archive` - Last 50 report analyses

#### IndexedDB Database
- **Database**: `WarehouseDB`
- **Version**: 1
- **Object Stores**:
  - `materials` (key: code) - All material configurations
  - `archive` (key: id) - All archived reports
  - `metadata` (key: key) - Sync timestamps and counts

#### JSON Export Format
```json
{
  "version": "1.0",
  "exportDate": "2025-10-02T...",
  "materials": {
    "266920": {
      "code": "266920",
      "name": "Product XYZ",
      "capacity": 10,
      "threshold": 5,
      "promoCapacity": 20,
      "promoActive": true,
      "promoEndDate": "2025-12-31",
      "createdAt": "2025-01-01T...",
      "updatedAt": "2025-10-02T..."
    }
  },
  "archive": [
    {
      "id": 1234567890,
      "timestamp": "2025-10-02T...",
      "rawData": "...",
      "results": {...},
      "summary": {...}
    }
  ]
}
```

## Technical Details

### Files Added/Modified

#### New Files
- **`js/db-manager.js`** - IndexedDB wrapper class
  - `DBManager` class with async methods
  - Object stores management
  - Sync metadata tracking

#### Modified Files
- **`js/data-manager.js`** - Enhanced with dual persistence
  - Added `dbManager` instance
  - Sync methods: `syncMaterialsToIndexedDB()`, `syncArchiveToIndexedDB()`
  - Export/import: `exportData()`, `importData()`, `downloadBackup()`, `uploadBackup()`
  - Recovery: `restoreFromIndexedDB()`, `getSyncStatus()`

- **`js/ui-manager.js`** - New backup UI methods
  - `exportData()` - Triggers download
  - `importData()` - Handles file upload
  - `restoreFromIndexedDB()` - Recovery from IndexedDB

- **`js/tab-materials.js`** - Enhanced materials tab
  - Backup UI card
  - Sync status card with live updates
  - `updateSyncStatus()` - Displays sync info

- **`js/translations.js`** - New UI strings
  - Backup section translations
  - IndexedDB sync status translations
  - Both German and English

- **`index.html`** - Script loading order
  - Added `db-manager.js` before `data-manager.js`

### Browser Compatibility

#### IndexedDB Support
- ✅ Chrome/Edge 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Opera 15+
- ❌ IE 10+ (partial support)

**Fallback**: If IndexedDB isn't available, app continues with localStorage only

#### localStorage Support
- ✅ All modern browsers
- ~5-10MB limit (varies by browser)

## Best Practices

### Regular Backups
1. **Weekly Export**: Download JSON backup once a week
2. **Before Updates**: Export before major configuration changes
3. **Version Control**: Keep multiple dated backups

### Recovery Scenarios

#### Scenario 1: Browser cleared localStorage
```
1. Check "Automatic Sync" status - if active, IndexedDB should have data
2. Click "⚡ Restore from IndexedDB"
3. Verify materials list is populated
```

#### Scenario 2: Browser doesn't support IndexedDB
```
1. Rely on localStorage (works fine for small datasets)
2. Use manual Export/Import regularly
3. Keep JSON backups in safe location
```

#### Scenario 3: Both localStorage and IndexedDB lost
```
1. Go to Materials tab
2. Click "📤 Import Data"
3. Select your latest JSON backup
4. Data will be restored to both localStorage and IndexedDB
```

### Performance

#### Sync Performance
- **localStorage save**: ~1-5ms (synchronous)
- **IndexedDB sync**: ~10-50ms (asynchronous, non-blocking)
- **Export download**: ~50-200ms (depends on data size)
- **Import upload**: ~100-500ms (depends on file size)

#### Storage Limits
- **localStorage**: ~5-10MB (browser dependent)
- **IndexedDB**: ~50% of available disk space (Chrome), unlimited with permission (Firefox)
- **JSON files**: Only limited by disk space

## Troubleshooting

### "IndexedDB not available"
**Cause**: Browser doesn't support IndexedDB or it's disabled  
**Solution**: App will work fine with localStorage only. Use manual export/import for backups.

### "Error saving to IndexedDB"
**Cause**: Storage quota exceeded or permission denied  
**Solution**: 
1. Clear old archive entries
2. Export data to free up space
3. Check browser storage settings

### "Restore failed"
**Cause**: IndexedDB empty or corrupted  
**Solution**: Use manual import with JSON backup file

### Export file is too large
**Cause**: Too many archived reports  
**Solution**: 
1. System auto-limits to 50 reports
2. If needed, manually clear old archive entries before export

## Future Enhancements

Possible future improvements:
- Automatic periodic backups to file system
- Cloud storage integration (Google Drive, Dropbox)
- Backup scheduling
- Differential backups (only changes)
- Compression for large datasets
- Data encryption for sensitive materials

## Code Examples

### Manual Export
```javascript
// In UI
ui.exportData();

// Under the hood
dataManager.downloadBackup();
// Creates blob, triggers download
```

### Manual Import
```html
<input type="file" accept=".json" onchange="ui.importData(event)">
```

```javascript
// In UI
ui.importData(event);

// Under the hood
dataManager.uploadBackup(file)
  .then(result => {
    // result.materialsCount
    // result.archiveCount
  });
```

### Check Sync Status
```javascript
const status = await dataManager.getSyncStatus();
if (status.available) {
  console.log('Last materials sync:', status.metadata.materials.timestamp);
  console.log('Last archive sync:', status.metadata.archive.timestamp);
}
```

### Manual Restore
```javascript
await dataManager.restoreFromIndexedDB();
// Copies IndexedDB → localStorage
// Reloads data into memory
```

## Summary

You now have a **robust, multi-layered data persistence system**:

✅ **localStorage** for fast primary storage  
✅ **IndexedDB** for automatic reliable backup  
✅ **JSON Export** for manual file-based backups  

Your data is protected against:
- Browser cache clearing
- localStorage corruption
- Accidental deletions
- Browser incompatibility

**Recommendation**: Export a JSON backup weekly and keep it in a safe location!
