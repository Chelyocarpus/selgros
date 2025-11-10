# Warehouse System - Quick Reference Card

## 🎯 New Features Quick Start

### ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Switch Tabs | `Ctrl+1/2/3` |
| Add Material | `Ctrl+N` |
| Save Form | `Ctrl+S` |
| Search | `Ctrl+F` |
| Export Data | `Ctrl+E` |
| Dark Mode | `Ctrl+Shift+D` |
| High Contrast | `Ctrl+Shift+H` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` |
| Close Modal | `Escape` |
| Show All Shortcuts | `Ctrl+/` or `F1` |

### 🌙 Dark Mode
- **Toggle**: Press `Ctrl+Shift+D` or look for toggle in header
- **Auto-saves**: Your preference is remembered
- **Smooth**: Transitions between modes

### 🎨 High Contrast Mode
- **Toggle**: Press `Ctrl+Shift+H`
- **For**: Better visibility for vision impairment
- **Includes**: Thicker borders, higher color contrast

### 📝 Material Notes & Tags
- **Notes**: Add free-form notes to any material
- **Tags**: Categorize materials (e.g., "seasonal", "urgent")
- **Search**: Find materials by tags or notes
- **Usage**: Open material edit dialog to add/edit

### 💾 Auto-Save
- **Automatic**: Saves drafts every 2 seconds while typing
- **Recovery**: Drafts restored if you close modal accidentally
- **Indicator**: Shows "Auto-saved" status

### 🔒 Security Features
- **File Validation**: Checks actual file type (not just extension)
- **Size Limit**: Max 10MB per file
- **XSS Protection**: All inputs sanitized automatically
- **Rate Limiting**: Prevents accidental spam clicks

### ♿ Accessibility
- **Screen Readers**: Full ARIA labels and announcements
- **Keyboard Only**: Navigate entire app without mouse
- **Focus Traps**: Modals keep focus inside
- **Skip Links**: Press Tab to see "Skip to content" links

### 📤 File Upload Progress
- **Visual Feedback**: Shows "Uploading..." then "Processing..."
- **Validation**: Verifies file type before processing
- **Errors**: Clear messages if something goes wrong

## 🆘 Common Tasks

### Upload Excel Report
1. Drag file to upload box OR click to browse
2. Wait for validation (automatically checks file type)
3. Processing indicator shows progress
4. Results appear automatically

### Add New Material
1. Press `Ctrl+N` OR click "Add Material"
2. Fill in Material Code (required)
3. Fill in Capacity (required)
4. Add optional: Name, Tags, Notes, Group
5. Press `Ctrl+S` OR click "Save"

### Quick Add from Results
1. After checking stock, see "Not Configured" materials
2. Click "Quick Add" button
3. Material code and name pre-filled
4. Just enter capacity and save

### Search Materials
1. Press `Ctrl+F` to focus search box
2. Type material code, name, tag, or note
3. Results filter instantly (debounced for performance)

### Undo Mistakes
1. Press `Ctrl+Z` to undo last action
2. Press `Ctrl+Y` to redo
3. Up to 50 actions stored

### Export Your Data
1. Press `Ctrl+E` OR click "Export Data"
2. JSON file downloads with timestamp
3. Includes: Materials, Archive, Groups, Notes, Settings

### Import Data
1. Press `Ctrl+I` OR click "Import Data"
2. Select .json backup file
3. Confirms before overwriting
4. All data restored

## 💡 Tips & Tricks

### Navigation
- Use `Ctrl+1/2/3` to switch tabs instantly
- Press `Tab` to move between fields
- `Shift+Tab` to go backwards
- `Escape` closes any open modal

### Productivity
- Start typing in Add Material dialog, auto-saves every 2 seconds
- Use tags like "seasonal", "high-priority", "check-weekly"
- Add notes for context: "Supplier changed", "Promotion next month"

### Performance
- Search is debounced - no lag even with 1000+ materials
- Tables cache data - no reload on tab switch
- Clear browser cache if things feel slow

### Accessibility
- If using screen reader, announcements on all actions
- High contrast mode for better visibility
- Keyboard shortcuts work everywhere (except text inputs)

## 🐛 Troubleshooting

### File Upload Fails
- **Check**: File is .xlsx or .xls (not .csv)
- **Check**: File is under 10MB
- **Try**: Use "Paste Data" instead

### Shortcuts Don't Work
- **Check**: Focus is not in text input (except Escape)
- **Check**: No browser extension blocking shortcuts
- **Try**: Click outside input field first

### Data Not Saving
- **Check**: Browser localStorage not full (Settings → Storage)
- **Check**: No private/incognito mode active
- **Try**: Export data, clear cache, import data back

### Dark Mode Looks Wrong
- **Check**: All CSS files loaded (check browser console)
- **Try**: Refresh page (Ctrl+R)
- **Try**: Clear browser cache

### Search Not Working
- **Check**: Correct tab selected (Materials or Archive)
- **Try**: Clear search and re-type
- **Try**: Refresh page

## 📊 Performance Tips

1. **Large Datasets**: Use filters to reduce displayed rows
2. **Archive**: Automatically limited to 50 reports (oldest deleted)
3. **Materials**: No hard limit, but 1000+ may slow down
4. **Storage**: Check usage in browser DevTools → Application → Local Storage

## 🔐 Security Best Practices

1. **Export Regularly**: Download backup weekly
2. **Validate Files**: System checks file types automatically
3. **Review Notes**: Check for sensitive info before sharing screen
4. **Browser**: Keep browser updated for latest security

## 📞 Need Help?

1. Press `Ctrl+/` to see all keyboard shortcuts
2. Check browser console (F12) for errors
3. Export data before making major changes
4. Refer to IMPROVEMENTS.md for detailed documentation

---

**Version**: 1.1.0 (October 5, 2025)
**Updates**: Security, Performance, Accessibility, UX enhancements
