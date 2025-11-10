# 🚀 Quick Start Guide

## 📂 You Have These Files

### Main Entry
- `index.html` - Open this in your browser!

### Styles (CSS)
- `css/main.css` - Colors, layout, header, tabs
- `css/components.css` - Buttons, forms, cards, badges
- `css/tables.css` - All table styling
- `css/modals.css` - Pop-up dialogs

### Scripts (JavaScript)
- `js/translations.js` - German/English text
- `js/data-manager.js` - Save/load data
- `js/report-processor.js` - Analyze reports
- `js/ui-manager.js` - Handle UI interactions
- `js/tab-check-stock.js` - Stock checking tab
- `js/tab-materials.js` - Materials tab
- `js/tab-archive.js` - Archive tab
- `js/app.js` - Start everything

### Documentation
- `README.md` - How to use the app
- `FILE-ORGANIZATION.md` - How files are organized
- `FILE-MAP.md` - Which file does what
- `SUMMARY.md` - Overview of everything
- `QUICK-START.md` - This file!

---

## ⚡ I Want To...

### ...change colors
→ `css/main.css` lines 1-10 (CSS variables)

### ...translate text
→ `js/translations.js` (add to `de:` or `en:` objects)

### ...add a material field
1. `js/tab-materials.js` - Add to form
2. `js/data-manager.js` - Add to material object
3. `js/translations.js` - Add labels

### ...modify alerts
→ `js/report-processor.js` - `analyzeStock()` function

### ...change button styles
→ `css/components.css` - Button section

### ...change table appearance
→ `css/tables.css`

### ...add a new tab
1. Create `js/tab-mynewfeature.js`
2. Edit `js/app.js` - Add initialization
3. Edit `index.html` - Add tab div
4. Edit `js/translations.js` - Add tab name

---

## 🎨 Color Theme

Want different colors? Edit `css/main.css`:

```css
:root {
    --primary-color: #2563eb;   /* Main blue */
    --danger-color: #dc2626;    /* Red for alerts */
    --warning-color: #f59e0b;   /* Orange for promos */
    --success-color: #16a34a;   /* Green for OK */
    --bg-color: #f8fafc;        /* Background */
}
```

---

## 🔍 Finding Things

### Looking for...
- **A button style?** → `css/components.css`
- **Table styling?** → `css/tables.css`
- **German text?** → `js/translations.js` (de object)
- **English text?** → `js/translations.js` (en object)
- **Data saving?** → `js/data-manager.js`
- **Stock analysis?** → `js/report-processor.js`
- **Upload logic?** → `js/tab-check-stock.js`
- **Material CRUD?** → `js/tab-materials.js`
- **Archive viewing?** → `js/tab-archive.js`

---

## 🐛 Troubleshooting

### Nothing loads?
- Check browser console (F12)
- Verify all files are in correct folders
- Check file names match exactly

### Styles look wrong?
- Check CSS files loaded in `index.html`
- Clear browser cache (Ctrl+F5)

### JavaScript errors?
- Check console for error messages
- Verify script load order in `index.html`

### Data not saving?
- Check if localStorage is enabled
- Try different browser

---

## 📱 Test Checklist

Before deploying:
- [ ] Open `index.html` in browser
- [ ] Upload an Excel file
- [ ] Paste data
- [ ] Add a material
- [ ] Edit a material
- [ ] Check promotional settings
- [ ] View archived report
- [ ] Switch languages
- [ ] Test on mobile/tablet
- [ ] Test in different browsers

---

## 🎓 Understanding the Code

### Data Flow
```
1. User uploads file
   ↓
2. tab-check-stock.js reads file
   ↓
3. report-processor.js analyzes
   ↓
4. ui-manager.js displays results
   ↓
5. data-manager.js saves to localStorage
```

### File Dependencies
```
app.js needs:
  → translations.js
  → data-manager.js
  → report-processor.js (needs data-manager.js)
  → ui-manager.js (needs all above)
  → All tab-*.js files (need ui-manager.js)
```

---

## 💾 Backup Important

**Before making changes:**
1. Copy the entire folder
2. Name it with date (e.g., `Höchstmenge-backup-2025-10-02`)
3. Keep original safe!

---

## 🎯 Most Common Edits

95% of changes will be in:
1. `js/translations.js` - Text changes
2. `css/main.css` - Color changes
3. `js/tab-*.js` - Feature changes
4. `css/components.css` - Style tweaks

---

## ⚠️ Don't Edit

Rarely need to change:
- `index.html` (structure is set)
- `js/app.js` (bootstrap logic)
- `css/modals.css` (rarely changes)

---

## 🚦 Safe to Edit

Always safe to modify:
- CSS files (just styling)
- `translations.js` (just text)
- Individual tab files (isolated)

---

## 🎁 Pro Tips

1. **Use browser DevTools** (F12) to test CSS changes live
2. **Test translations** by switching languages in app
3. **Console.log()** is your friend for debugging
4. **Keep backups** before major changes
5. **One change at a time** - easier to debug
6. **Test immediately** after each change
7. **Read comments** in code for context

---

## 📞 Need Help?

1. **Check the docs** - README.md, FILE-MAP.md
2. **Read code comments** - They explain complex parts
3. **Use browser console** - Shows errors
4. **Look at patterns** - Copy existing code style
5. **Test in isolation** - Comment out code to find issues

---

## ✅ That's It!

You're ready to work with the code. Remember:
- 📂 Everything is organized logically
- 📝 Documentation explains each file
- 🔍 Use this guide for quick reference
- 💾 Always backup before changes
- 🧪 Test after each edit

**Happy coding! 🎉**

---

*Need more details? Check the other documentation files!*
