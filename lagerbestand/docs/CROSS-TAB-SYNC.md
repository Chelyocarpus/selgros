# Cross-Tab Synchronization Guide

## Overview
The Warehouse Early Warning System now supports **real-time synchronization across browser tabs**. Any changes made in one tab automatically sync to all other open tabs instantly.

## How It Works

### Technology Stack
- **BroadcastChannel API**: Native browser API for tab-to-tab communication
- **Dexie.js**: Shared IndexedDB storage across tabs
- **Event-Driven Architecture**: Automatic UI updates when data changes

### Architecture

```
Tab 1: User adds material
    ↓
DexieDBManager saves to IndexedDB
    ↓
BroadcastChannel sends message → Tab 2, Tab 3, Tab 4...
    ↓                                  ↓
Each tab receives message      Reloads data from Dexie
    ↓                                  ↓
Updates UI automatically       Shows "Data updated" toast
```

## Supported Sync Events

### Materials
- ✅ `materials_updated` - Bulk material save/import
- ✅ `material_saved` - Single material add/edit
- ✅ `material_deleted` - Material deletion

### Archive
- ✅ `archive_updated` - New report uploaded or archive cleared

### Groups
- ✅ `groups_updated` - Material groups created/modified/deleted

### Notes
- ✅ `notes_updated` - Material notes added/edited/deleted

## User Experience

### What Users See
1. Open the app in **Tab 1**
2. Open the app in **Tab 2** (same browser)
3. In **Tab 1**: Add a new material
4. In **Tab 2**: 
   - See toast notification: "Data updated from another tab"
   - Material list automatically refreshes
   - New material appears instantly

### Visual Feedback
- 🔔 **Toast notification** when sync occurs
- ♻️ **Automatic UI refresh** - no manual reload needed
- 📊 **Real-time data** across all tabs

## Browser Support

### Full Support (BroadcastChannel)
- ✅ Chrome/Edge 54+
- ✅ Firefox 38+
- ✅ Safari 15.4+
- ✅ Opera 41+

### Graceful Degradation
- ⚠️ Older browsers: Sync disabled, but app works normally
- ℹ️ Data still shared via IndexedDB (refresh to see changes)

## Implementation Details

### DexieDBManager Changes

#### 1. BroadcastChannel Initialization
```javascript
initBroadcastChannel() {
    if ('BroadcastChannel' in window) {
        this.syncChannel = new BroadcastChannel('warehouse_sync');
    }
}
```

#### 2. Broadcasting Changes
```javascript
async saveMaterial(material) {
    await this.db.materials.put(material);
    
    // Notify other tabs
    this.broadcastChange('material_saved', { code: material.code });
}
```

#### 3. Listening for Messages
```javascript
onSyncMessage(callback) {
    this.syncChannel.onmessage = (event) => {
        callback(event.data);
    };
}
```

### DataManager Changes

#### Cross-Tab Sync Setup
```javascript
setupCrossTabSync() {
    this.dbManager.onSyncMessage(async (message) => {
        switch (message.type) {
            case 'materials_updated':
                this.materials = await this.dbManager.loadMaterials();
                renderMaterialsList();
                break;
            // ... handle other events
        }
        
        ui.showToast('Data updated from another tab', 'info');
    });
}
```

## Performance Considerations

### Efficiency
- ✅ **Small message payloads** - Only notification, not full data
- ✅ **Selective reloading** - Only affected data is reloaded
- ✅ **Debounced UI updates** - Prevents excessive re-renders
- ✅ **No polling** - Event-driven, zero background overhead

### Message Format
```javascript
{
    type: 'material_saved',       // Event type
    timestamp: 1699632000000,     // When it occurred
    data: { code: 'MAT001' }      // Minimal metadata
}
```

## Testing Cross-Tab Sync

### Test Scenario 1: Material Management
1. Open app in **Tab A**
2. Open app in **Tab B**
3. In **Tab A**: Add material "TEST-001"
4. In **Tab B**: Verify "TEST-001" appears automatically
5. In **Tab B**: Edit "TEST-001" capacity to 200
6. In **Tab A**: Verify capacity updated to 200

### Test Scenario 2: Report Upload
1. Open app in **Tab A** (on Materials tab)
2. Open app in **Tab B** (on Archive tab)
3. In **Tab A**: Switch to Check Stock, upload LX02 report
4. In **Tab B**: Archive list updates automatically
5. In **Tab A**: Switch to Archive, see same update

### Test Scenario 3: Multi-Tab Editing
1. Open app in **3+ tabs**
2. Make different changes in each tab
3. Verify all tabs stay synchronized
4. Check for race conditions or conflicts

### Test Scenario 4: Browser Compatibility
1. Test in Chrome, Firefox, Safari
2. Verify sync works in supported browsers
3. Verify graceful degradation in old browsers
4. Test in private/incognito mode

## Debugging

### Console Logs
Enable verbose logging to see sync events:

```javascript
// In browser console
localStorage.setItem('debug_sync', 'true');
```

Expected console output:
```
Dexie: BroadcastChannel initialized for cross-tab sync
DataManager: Cross-tab sync enabled
DataManager: Received sync message from another tab: material_saved
Dexie: Loaded 42 materials
```

### DevTools
1. **F12** → Application → Storage → IndexedDB
2. Check `WarehouseDB` for shared data
3. Verify data changes reflect in all tabs

### BroadcastChannel Monitoring
```javascript
// Monitor all messages (in console)
const monitor = new BroadcastChannel('warehouse_sync');
monitor.onmessage = (e) => console.log('Sync:', e.data);
```

## Known Limitations

### 1. Browser-Scoped Only
- ❌ Does **NOT** sync across different browsers
- ❌ Does **NOT** sync across devices
- ✅ Only syncs tabs in **same browser profile**

### 2. Privacy Mode
- ⚠️ Some browsers restrict BroadcastChannel in private mode
- ✅ App still works, but sync may be disabled

### 3. Service Workers
- ℹ️ If you add a service worker later, ensure it doesn't intercept BroadcastChannel messages

## Advanced Features

### Conflict Resolution
Currently uses "last write wins" strategy:
- Latest change always takes precedence
- No version control or merge conflicts
- Suitable for single-user warehouse management

### Future Enhancements
Possible improvements:
- 🔄 **Optimistic UI updates** - Update UI before Dexie save completes
- 🔐 **User awareness** - Show which tab made changes
- ⏱️ **Change history** - Track who changed what when
- 🌐 **Cross-device sync** - Using Dexie Cloud addon
- 🔔 **Selective notifications** - User can choose what to sync

## API Reference

### DexieDBManager Methods

#### `broadcastChange(type, data)`
Sends notification to other tabs.

**Parameters:**
- `type` (string): Event type (e.g., 'material_saved')
- `data` (object): Optional metadata

**Example:**
```javascript
this.broadcastChange('material_deleted', { code: 'MAT001' });
```

#### `onSyncMessage(callback)`
Registers listener for messages from other tabs.

**Parameters:**
- `callback` (function): Handler for incoming messages

**Example:**
```javascript
dbManager.onSyncMessage((message) => {
    console.log('Received:', message.type);
});
```

### DataManager Methods

#### `setupCrossTabSync()`
Initializes cross-tab sync listeners. Called automatically during initialization.

**No parameters**

## Troubleshooting

### Problem: Sync not working
**Solution:**
1. Check browser compatibility (F12 → Console)
2. Verify BroadcastChannel is initialized
3. Check for console errors
4. Test in non-private browsing mode

### Problem: Duplicate notifications
**Solution:**
1. Ensure only one instance of DataManager
2. Check for multiple event listeners
3. Verify message deduplication logic

### Problem: Performance issues with many tabs
**Solution:**
1. Close unused tabs
2. Check message payload size
3. Optimize rendering logic
4. Consider throttling updates

## Security Considerations

### Same-Origin Policy
- ✅ BroadcastChannel respects same-origin policy
- ✅ Only tabs from same domain can communicate
- ✅ No cross-site data leakage

### Data Privacy
- ✅ Messages only contain metadata (codes, counts)
- ✅ No sensitive data in broadcasts
- ✅ Full data only in IndexedDB (local)

## Migration Notes

### Upgrading from Previous Versions
No migration needed! Cross-tab sync is:
- ✅ Automatic
- ✅ Backwards compatible
- ✅ Optional (graceful degradation)

### Disabling Sync (If Needed)
```javascript
// In dixie-db-manager.js constructor
this.syncChannel = null; // Disable sync
```

## Best Practices

### For Developers
1. Always broadcast changes after Dexie writes
2. Keep message payloads small
3. Handle sync errors gracefully
4. Test with multiple tabs open
5. Verify UI updates correctly

### For Users
1. Keep related tabs open for auto-sync
2. Close tabs you're not using
3. Refresh if sync seems stuck
4. Use Export/Import for cross-browser data transfer

## Summary

✅ **Real-time sync** across browser tabs
✅ **Automatic UI updates** when data changes
✅ **Zero configuration** - works out of the box
✅ **High performance** - event-driven, no polling
✅ **Graceful degradation** - works without sync
✅ **Production ready** - tested and reliable

The cross-tab sync feature makes the Warehouse Early Warning System more collaborative and user-friendly, especially when working with multiple reports or coordinating across different views.
