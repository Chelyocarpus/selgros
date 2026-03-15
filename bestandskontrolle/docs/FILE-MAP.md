# 🗺️ File Responsibility Map

## 🎨 CSS Files - What Each File Styles

### `css/main.css`
**Foundation & Layout**
- ✓ CSS variables (colors, theme)
- ✓ Reset styles
- ✓ Body and container layout
- ✓ Header with gradient
- ✓ Tab navigation bar
- ✓ Language selector dropdown
- ✓ Responsive breakpoints

**When to edit**: Changing app-wide colors, layout, or responsive behavior

---

### `css/components.css`
**UI Building Blocks**
- ✓ Card containers
- ✓ Form elements (inputs, textareas, selects)
- ✓ All button styles and variants
- ✓ Statistics cards grid
- ✓ Badge components (alerts, promo, storage type)
- ✓ Promotional section styling
- ✓ Empty state displays
- ✓ Toast notifications
- ✓ Upload section (drag & drop UI)

**When to edit**: Modifying form appearance, button styles, or component look

---

### `css/tables.css`
**Data Display**
- ✓ Basic table styling
- ✓ Material grouping visualization
- ✓ Alert row highlighting
- ✓ DataTables customization
- ✓ Pagination controls
- ✓ Search and filter inputs
- ✓ Responsive table behavior

**When to edit**: Changing how tables look or DataTables appearance

---

### `css/modals.css`
**Dialog Windows**
- ✓ Modal overlay
- ✓ Modal content container
- ✓ Modal header styling
- ✓ Close button
- ✓ Modal animations

**When to edit**: Changing modal appearance or behavior

---

## 💻 JavaScript Files - What Each File Does

### `js/translations.js`
**Language System** (Lines: ~300)
```javascript
// Exports:
- translations object (de, en)
- LanguageManager class
```
- ✓ German translations
- ✓ English translations
- ✓ Language persistence (localStorage)
- ✓ Translation lookup function

**When to edit**: Adding new text, fixing translations, adding languages

---

### `js/data-manager.js`
**Data Layer** (Lines: ~150)
```javascript
// Exports:
- DataManager class
```
- ✓ Material CRUD operations
- ✓ Archive management
- ✓ LocalStorage persistence
- ✓ Data validation
- ✓ Material configuration

**When to edit**: Changing data structure, storage logic, or validation rules

---

### `js/report-processor.js`
**Business Logic** (Lines: ~200)
```javascript
// Exports:
- ReportProcessor class
```
- ✓ LX02 report parsing
- ✓ Stock analysis
- ✓ Alert generation
- ✓ Capacity checking
- ✓ Promotion logic

**When to edit**: Changing analysis rules, alert conditions, or report parsing

---

### `js/ui-manager.js`
**UI Controller** (Lines: ~200)
```javascript
// Exports:
- UIManager class
```
- ✓ Toast notifications
- ✓ Tab switching
- ✓ Modal management
- ✓ Language updates
- ✓ Material deletion
- ✓ Archive clearing
- ✓ CRUD operations coordination

**When to edit**: Changing UI behavior, notifications, or modal interactions

---

### `js/tab-check-stock.js`
**Stock Check Tab** (Lines: ~250)
```javascript
// Adds to UIManager.prototype:
- processReport()
- displayResults()
- clearResults()
- handleFileUpload()

// Functions:
- renderCheckStockTab()
```
- ✓ Upload UI rendering
- ✓ File upload handling
- ✓ Excel parsing
- ✓ Results display
- ✓ Statistics cards
- ✓ Results table population
- ✓ Quick add buttons

**When to edit**: Modifying stock check workflow or results display

---

### `js/tab-materials.js`
**Materials Tab** (Lines: ~200)
```javascript
// Adds to UIManager.prototype:
- addMaterial()
- renderMaterialsList()

// Functions:
- renderMaterialsTab()
- renderMaterialModal()
```
- ✓ Material form rendering
- ✓ Material list table
- ✓ DataTables initialization
- ✓ Material modal UI
- ✓ Promo status display
- ✓ Add/Edit/Delete UI

**When to edit**: Changing materials management UI or table display

---

### `js/tab-archive.js`
**Archive Tab** (Lines: ~200)
```javascript
// Adds to UIManager.prototype:
- renderArchiveList()
- viewArchivedReport()
- closeViewReportModal()
- deleteArchiveEntry()

// Functions:
- renderArchiveTab()
- renderViewReportModal()
```
- ✓ Archive list rendering
- ✓ Archive table display
- ✓ Report viewing modal
- ✓ Report deletion
- ✓ Archive statistics

**When to edit**: Changing archive display or report viewing

---

### `js/app.js`
**Bootstrap & Init** (Lines: ~150)
```javascript
// Initializes:
- languageManager
- dataManager
- reportProcessor
- ui (UIManager)

// Global functions:
- switchTab()
- processData()
- clearResults()
- addMaterial()
- changeLanguage()
- etc.
```
- ✓ Create manager instances
- ✓ Global function wrappers
- ✓ DOM ready initialization
- ✓ Drag & drop setup
- ✓ Keyboard shortcuts
- ✓ Event listeners

**When to edit**: Adding new global functions or initialization steps

---

## 🔗 Dependency Graph

```
app.js (initialization)
    ↓
    ├── translations.js → LanguageManager
    │       ↓
    ├── data-manager.js → DataManager
    │       ↓
    ├── report-processor.js → ReportProcessor
    │       ↓ (uses DataManager)
    │
    └── ui-manager.js → UIManager
            ↓ (uses all above)
            │
            ├── tab-check-stock.js (extends UIManager)
            ├── tab-materials.js (extends UIManager)
            └── tab-archive.js (extends UIManager)
```

**Load Order Matters!** Files must be loaded in this sequence:
1. translations.js
2. data-manager.js
3. report-processor.js
4. ui-manager.js
5. tab-*.js (any order)
6. app.js (last!)

---

## 🎯 Common Tasks - Which Files to Edit

### Adding a New Material Field
1. `tab-materials.js` - Add form field to modal
2. `data-manager.js` - Update material object structure
3. `translations.js` - Add field labels
4. `tab-materials.js` - Update table display

### Changing Alert Logic
1. `report-processor.js` - Modify `analyzeStock()`
2. `translations.js` - Update alert messages
3. `tab-check-stock.js` - Update display if needed

### Adding a New Tab
1. Create `tab-newtab.js` - Tab logic
2. `app.js` - Add initialization
3. `index.html` - Add tab content div
4. `translations.js` - Add tab labels
5. `ui-manager.js` - Add to switchTab if needed

### Changing Colors/Theme
1. `main.css` - Update CSS variables
2. That's it! Variables cascade everywhere

### Fixing a Translation
1. `translations.js` - Update appropriate key in de/en objects

### Modifying Table Display
1. `tables.css` - Styling changes
2. `tab-materials.js` or `tab-archive.js` - Logic changes

---

## 📊 File Size Distribution

```
CSS Files:
├── main.css:        ~300 lines
├── components.css:  ~400 lines
├── tables.css:      ~150 lines
└── modals.css:      ~50 lines
    Total CSS:       ~900 lines

JS Files:
├── translations.js:     ~300 lines
├── data-manager.js:     ~150 lines
├── report-processor.js: ~200 lines
├── ui-manager.js:       ~200 lines
├── tab-check-stock.js:  ~250 lines
├── tab-materials.js:    ~200 lines
├── tab-archive.js:      ~200 lines
└── app.js:              ~150 lines
    Total JS:            ~1650 lines

HTML:
└── index.html:      ~60 lines

GRAND TOTAL: ~2610 lines across 13 files
(Original: 3038 lines in 1 file)
```

---

## 🎓 Learning Resources

**Want to understand more about the patterns used?**

1. **Separation of Concerns**: Each file has ONE job
2. **Module Pattern**: JavaScript classes group related functions
3. **Progressive Enhancement**: HTML → CSS → JS layers
4. **Prototype Extension**: Tab files extend UIManager
5. **Dependency Injection**: Managers passed to constructors

---

## ✅ Quick Checklist for Edits

Before making changes:
- [ ] Identify which concern you're modifying (style, data, UI, logic)
- [ ] Find the appropriate file using this guide
- [ ] Check dependencies in the file
- [ ] Make changes in smallest possible scope
- [ ] Test in browser
- [ ] Update translations if adding UI text
- [ ] Check other tabs still work

---

**💡 Pro Tip**: Keep this file open while coding as a quick reference!
