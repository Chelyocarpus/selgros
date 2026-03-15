# Troubleshooting Guide

## localStorage Corruption Errors

### Symptoms
- `NS_ERROR_FILE_CORRUPTED` errors in Firefox console
- App fails to load or initialize
- "Can't access lexical declaration 'ui' before initialization" error

### Common Causes
1. **Renamed project folder** (especially case changes like `Höchstmenge` → `höchstmenge`)
2. **Browser cache corruption**
3. **Incomplete browser shutdown during write operations**
4. **File path changes** affecting localStorage key mapping

### Solutions

#### Option 1: Use the Clear Storage Tool (Recommended)
1. Open `clear-storage.html` in your browser
2. Click "Clear All Storage"
3. Return to the main app (`index.html`)

#### Option 2: Manual Browser Clear
**Firefox:**
1. Press `F12` to open Developer Tools
2. Go to "Storage" tab
3. Right-click "Local Storage" → "Delete All"
4. Right-click "IndexedDB" → Delete "WarehouseDB"
5. Refresh the page

**Chrome/Edge:**
1. Press `F12` to open Developer Tools
2. Go to "Application" tab
3. Under "Storage" → "Local Storage" → Delete all entries
4. Under "IndexedDB" → Delete "WarehouseDB"
5. Refresh the page

#### Option 3: Browser Console Command
Open browser console (`F12`) and run:
```javascript
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('WarehouseDB');
location.reload();
```

### Prevention
- **Avoid renaming the project folder** while the app is running
- **Close all browser tabs** with the app before moving/renaming files
- **Export your data** regularly using the app's export features

### Data Recovery
If you had important data before the corruption:
1. Check browser backups (Firefox: `about:support` → Profile Folder)
2. Use browser history to find working versions
3. Check if you have exported CSV/Excel reports in your downloads

### Still Having Issues?
1. Try a different browser (Chrome, Firefox, Edge)
2. Check browser console for specific error messages
3. Ensure you're using a modern browser version
4. Disable browser extensions that might interfere with localStorage

---

## Other Common Issues

### DataTables Not Loading
- Ensure internet connection (DataTables loads from CDN)
- Check browser console for CSP violations
- Verify all external scripts are loading

### Language Not Switching
- Clear browser cache
- Check that `translations.js` loaded correctly
- Verify `languageManager` is initialized

### Reports Not Uploading
- Ensure file is Excel format (`.xlsx`, `.xls`)
- Check file isn't corrupted
- Verify file has proper LX02 report structure
- Check browser console for parsing errors
