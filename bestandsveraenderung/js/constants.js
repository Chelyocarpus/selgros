// Application Constants
const CONSTANTS = {
    // File size limits
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    
    // Default values
    DEFAULT_ROW_LIMIT: 25,
    
    // Supported file types
    SUPPORTED_FILE_TYPES: ['.xlsx', '.xls', '.xlsb'],
    
    // MIME types
    MIME_TYPES: {
        XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        XLS: 'application/vnd.ms-excel',
        CSV: 'text/csv',
        JSON: 'application/json'
    },
    
    // Export formats
    EXPORT_FORMATS: {
        JSON: 'json',
        CSV: 'csv'
    },
    
    // Messages - German
    MESSAGES: {
        de: {
            FILE_TOO_LARGE: 'Die Datei ist zu groß. Maximum: 50MB',
            INVALID_FILE_TYPE: 'Ungültiger Dateityp. Bitte wählen Sie eine XLSX-, XLS- oder XLSB-Datei.',
            FILE_READ_ERROR: 'Fehler beim Lesen der Datei',
            FILE_VALIDATION_ERROR: 'Fehler bei der Dateivalidierung',
            FILE_CORRUPTED: 'Die Datei scheint beschädigt oder ungültig zu sein',
            FILE_TYPE_MISMATCH: 'Die Dateistruktur stimmt nicht mit der Dateierweiterung überein',
            UNSUPPORTED_FILE_TYPE: 'Nicht unterstützter Dateityp',
            NO_SHEETS_FOUND: 'Keine Arbeitsblätter gefunden',
            NO_DATA_FOUND: 'Keine Daten im ausgewählten Arbeitsblatt gefunden',
            EXPORT_SUCCESS: 'Export erfolgreich',
            SELECT_SHEET_FIRST: 'Bitte wählen Sie zuerst ein Arbeitsblatt aus',
            FILE_VALID_EXCEL_XLSX: 'Gültige Excel-Datei (XLSX)',
            FILE_VALID_EXCEL_XLS: 'Gültige Excel-Datei (XLS)',
            FILE_VALID_EXCEL_XLSB: 'Gültige Excel-Datei (XLSB)'
        },
        en: {
            FILE_TOO_LARGE: 'File is too large. Maximum: 50MB',
            INVALID_FILE_TYPE: 'Invalid file type. Please select an XLSX, XLS, or XLSB file.',
            FILE_READ_ERROR: 'Error reading file',
            FILE_VALIDATION_ERROR: 'File validation error',
            FILE_CORRUPTED: 'The file appears to be corrupted or invalid',
            FILE_TYPE_MISMATCH: 'File structure does not match the file extension',
            UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
            NO_SHEETS_FOUND: 'No worksheets found',
            NO_DATA_FOUND: 'No data found in selected worksheet',
            EXPORT_SUCCESS: 'Export successful',
            SELECT_SHEET_FIRST: 'Please select a worksheet first',
            FILE_VALID_EXCEL_XLSX: 'Valid Excel file (XLSX)',
            FILE_VALID_EXCEL_XLS: 'Valid Excel file (XLS)',
            FILE_VALID_EXCEL_XLSB: 'Valid Excel file (XLSB)'
        }
    },
    
    // UI element IDs
    ELEMENTS: {
        DROP_ZONE: 'dropZone',
        FILE_INPUT: 'fileInput',
        UPLOAD_BTN: 'uploadBtn',
        FILE_INFO: 'fileInfo',
        FILE_NAME: 'fileName',
        FILE_SIZE: 'fileSize',
        FILE_DATE: 'fileDate',
        ANALYSIS_SECTION: 'analysisSection',
        SHEET_SELECT: 'sheetSelect',
        STATISTICS: 'statistics',
        ROW_COUNT: 'rowCount',
        COL_COUNT: 'colCount',
        CELL_COUNT: 'cellCount',
        DATA_PREVIEW: 'dataPreview',
        DATA_TABLE: 'dataTable',
        TABLE_HEAD: 'tableHead',
        TABLE_BODY: 'tableBody',
        ROW_LIMIT: 'rowLimit',
        EXPORT_SECTION: 'exportSection',
        EXPORT_JSON: 'exportJSON',
        EXPORT_CSV: 'exportCSV',
        ERROR_MESSAGE: 'errorMessage',
        ERROR_TEXT: 'errorText'
    }
};

// Make constants available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}
