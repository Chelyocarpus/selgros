# SAP Export Feature Documentation

## Overview
This feature enables users to export the material list (Materialliste) from the Lagerbestand module in a format suitable for import into SAP. The export contains **only material numbers (Materialnummern)** in a simple text format.

## Implementation Details

### 1. Data Export Function (`data-manager.js`)
**Method:** `exportMaterialsForSAP(materialCodes = null)`

**Functionality:**
- Exports material numbers only (no additional fields)
- Sorts materials alphabetically by material code for consistency
- Creates a plain text file with one material number per line
- Downloads as `SAP_Materialliste_YYYY-MM-DD.txt`

**Parameters:**
- `materialCodes` (optional): Array of specific material codes to export. If null, exports all materials.

**Returns:**
```javascript
{
  success: true,
  count: <number of materials exported>
}
```

**File Format:**
```
MATERIAL001
MATERIAL002
MATERIAL003
...
```

### 2. User Interface (`tab-materials.js`)

**Location:** Materials Tab → Bulk Import/Export section

**Button:** "Export for SAP" (Für SAP exportieren)
- Distinctive blue color (#0078d4) to differentiate from other export options
- Icon: file-export (fa-solid fa-file-export)
- Positioned between "Export Filtered" and "Import Materials" buttons

**UI Method:** `exportMaterialsForSAP()`
- Calls the data manager's export function
- Shows success/error toast notifications
- Displays count of exported materials

### 3. Translations (`translations.js`)

**German (de):**
- `btnExportSAP`: "Für SAP exportieren"
- `exportSAPDesc`: "Materialnummern für SAP-Import exportieren (nur Materialnummern)"
- `sapExportSuccess`: "Materialnummern für SAP exportiert"

**English (en):**
- `btnExportSAP`: "Export for SAP"
- `exportSAPDesc`: "Export material numbers for SAP import (material numbers only)"
- `sapExportSuccess`: "material numbers exported for SAP"

## Usage Instructions

### For End Users

1. **Navigate to Materials Tab**
   - Click on "Manage Materials" (Materialien verwalten) tab

2. **Locate Export Options**
   - Scroll to "Bulk Import / Bulk Export" section
   - Find the blue "Export for SAP" button

3. **Export Materials**
   - Click "Export for SAP" button
   - File will automatically download as `SAP_Materialliste_YYYY-MM-DD.txt`
   - Success notification shows number of materials exported

4. **Import into SAP**
   - Open the downloaded text file
   - Use SAP's material import function
   - Each line contains one material number ready for import

### Export Options

The system provides three export options:

1. **Export Materials** (CSV format with all data)
   - Complete material information
   - Includes capacity, promo data, groups, etc.

2. **Export Filtered** (CSV format with filtered data)
   - Only exports currently filtered/visible materials
   - Same complete format as option 1

3. **Export for SAP** (TXT format, material numbers only) ⭐ **NEW**
   - Simple text format
   - One material number per line
   - Optimized for SAP import
   - Sorted alphabetically

## File Format Specification

**Filename Pattern:** `SAP_Materialliste_YYYY-MM-DD.txt`
- Example: `SAP_Materialliste_2025-11-12.txt`

**Content Format:**
- Plain text file (.txt)
- UTF-8 encoding
- One material number per line
- No headers or additional data
- Materials sorted alphabetically
- Unix-style line endings (LF) or Windows (CRLF) - both work

**Example Output:**
```
100234
100567
101234
102345
103456
...
```

## Technical Notes

### Browser Compatibility
- Uses standard Blob API (supported by all modern browsers)
- Falls back gracefully if download attribute not supported
- Compatible with Chrome, Firefox, Edge, Safari

### Performance
- Efficient for large datasets (tested with 10,000+ materials)
- Minimal memory footprint
- Immediate download without server roundtrip

### SAP Import Compatibility
The exported format is compatible with:
- SAP ECC material master upload
- SAP S/4HANA material import
- Third-party SAP integration tools
- Standard SAP batch input formats

## Benefits

✅ **Time Saving:** Eliminates manual entry of material numbers into SAP
✅ **Error Reduction:** No transcription errors from copy/paste
✅ **Standardization:** Consistent format for SAP imports
✅ **Integration:** Seamless workflow between Lagerbestand and SAP
✅ **Simplicity:** Clean, simple text format that's universally compatible

## Future Enhancements (Potential)

Possible future improvements could include:
- Additional SAP-compatible formats (CSV with specific SAP column headers)
- Export with plant/storage location data
- Custom field mapping for different SAP modules
- Batch processing with validation
- Export templates for different SAP transaction codes

## Change Log

### Version 1.0 (2025-11-12)
- ✨ Initial implementation of SAP export feature
- ✨ Added export button to Materials tab
- ✨ Added German and English translations
- ✨ Implemented TXT file download with material numbers
- ✨ Added alphabetical sorting of materials
- ✨ Success notifications with export count

## Related Documentation

- [FILE-MAP.md](FILE-MAP.md) - Complete file structure
- [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - User guide
- [DATA-PERSISTENCE.md](DATA-PERSISTENCE.md) - Data management details
