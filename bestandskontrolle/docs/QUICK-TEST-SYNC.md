# Quick Test: Cross-Tab Sync

## 5-Minute Test

### Setup
1. Open `index.html` in your browser (Chrome, Firefox, or Edge recommended)
2. Duplicate the tab (Ctrl+Shift+D or Cmd+Shift+D on Mac)
3. Arrange tabs side-by-side (or use Windows Snap: Win+Left, Win+Right)

### Test 1: Add Material
**Tab A:**
1. Click "Manage Materials" tab
2. Scroll to "Materials List" section
3. Click "Add Material" button at top of page
4. Enter in the form at top:
   - Code: `SYNC-TEST-001`
   - Name: `Sync Test Material`
   - Capacity: `100`
5. Click "Add Material" button

**Tab B:**
- ✅ Should see toast notification: "📡 Data updated from another tab"
- ✅ Material list automatically refreshes
- ✅ Material `SYNC-TEST-001` appears in the table
- ✅ No page refresh needed
- ⏱️ Sync happens in < 1 second

### Test 2: Edit Material
**Tab B:**
1. Find `SYNC-TEST-001`
2. Click Edit
3. Change capacity to `200`
4. Click Save

**Tab A:**
- ✅ Should show toast notification
- ✅ Capacity updates to `200` automatically

### Test 3: Delete Material
**Tab A:**
1. Find `SYNC-TEST-001`
2. Click Delete
3. Confirm deletion

**Tab B:**
- ✅ Should show toast notification
- ✅ Material disappears from list

### Test 4: Report Upload
**Tab A:**
1. Go to "Check Stock" tab
2. Upload an LX02 report

**Tab B:**
1. Go to "Report Archive" tab
- ✅ New report appears automatically
- ✅ Toast notification shows

## Console Verification

Press **F12** → **Console** tab. You should see these messages:

```
Dexie: BroadcastChannel initialized for cross-tab sync
Dexie: Database initialized successfully
DataManager: Loaded data from Dexie successfully
DataManager: Cross-tab sync enabled
```

When you make a change in another tab:
```
DataManager: Received sync message from another tab: material_saved
Dexie: Loaded X materials
```

## Expected Behavior

✅ **Working Correctly:**
- Toast notification appears with 📡 icon
- Toast says "Data updated from another tab"
- Material list refreshes automatically (DataTable reloads)
- Data updates instantly (< 1 second)
- No console errors
- Smooth UI updates (no flickering)

❌ **Issues to Watch For:**
- No toast notification = BroadcastChannel not working
- Toast appears but list doesn't refresh = UI refresh issue
- Manual refresh needed = sync message not received
- Console shows BroadcastChannel errors = browser compatibility
- Multiple duplicate notifications = event listener issue

## Browser DevTools Check

1. F12 → Application → IndexedDB → WarehouseDB
2. Expand `materials` table
3. Make change in Tab A
4. Refresh DevTools in Tab B
5. ✅ Should see updated data

## Success Criteria

- [x] Toast notifications appear
- [x] Data syncs instantly (< 1 second)
- [x] No page refreshes needed
- [x] Works across 3+ tabs
- [x] No console errors
- [x] IndexedDB shows correct data

## If Something Goes Wrong

1. Check browser console for errors
2. Verify browser supports BroadcastChannel
3. Clear IndexedDB and reload
4. Try in a different browser
5. Check `CROSS-TAB-SYNC.md` for troubleshooting

## Advanced Test: Stress Test

Open 5+ tabs and:
1. Add materials in Tab 1
2. Edit materials in Tab 2
3. Delete materials in Tab 3
4. Upload reports in Tab 4
5. View different tabs in Tab 5

**Expected:** All tabs stay synchronized without conflicts.
