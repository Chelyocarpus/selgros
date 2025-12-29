# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-29

### Added
- Dynamic column detection based on header names instead of fixed column indices
- Intelligent column recognition for Artikel, Lagerplatz, Auffüllbedarf, and Prozentual columns
- Case-insensitive and partial matching for column headers
- Automatic QR code generation for any column identified as "Artikel" or "Lagerplatz"
- Console logging for detected column indices to aid debugging
- Support for flexible XLSX file structures with varying column arrangements

### Changed
- Column indices (ARTIKEL_INDEX, LAGERPLATZ_INDEX, etc.) are now dynamically detected instead of hardcoded
- QR code columns now follow their source columns regardless of position
- Yellow highlighting (`.highlight` class) now applies to dynamically detected columns
- Table rendering adapts to detected column structure
- Sort functionality validates column existence before sorting
- Data filtering now handles missing Artikel column gracefully

### Improved
- Application now works with different XLSX file layouts
- Better error handling when expected columns are not found
- More flexible data validation
- Enhanced user feedback when columns cannot be detected

## [1.0.0] - 2025-12-XX

### Added
- Initial release with XLSX file import
- Table sorting by Auffüllbedarf, Prozentual, and Lagerplatz
- QR code generation for Artikel and Lagerplatz columns (hardcoded positions)
- Column customization with visibility toggle
- Export to XLSX functionality
- Print functionality with date stamp
- Loading spinner for data processing
- Responsive design with modern UI
- Keyboard shortcuts and accessibility features
- Group separation borders for different Lagerplätze
- Yellow highlighting for sort column and Lagerplatz (hardcoded positions)
