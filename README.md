# Selgros Warehouse Management Suite

A comprehensive collection of web-based applications for retail warehouse management, built with modern web technologies and designed for efficiency and accessibility.

## 📦 Applications

This suite includes several specialized applications for different aspects of warehouse and retail operations:

### 🏭 Warehouse Stock Monitoring (`lagerbestand/`)
A modern, accessible web application for monitoring warehouse inventory levels and receiving alerts for capacity issues.

**Features:**
- **Stock Checking**: Upload LX02 Excel reports or paste data directly
- **Material Management**: Configure materials with capacity thresholds and promotional support
- **Interactive Dashboards**: Customizable drag-and-drop dashboard with analytics widgets
- **Report Archive**: Automatic saving and review of past reports (last 50)
- **Bilingual Support**: Full German and English language support
- **WCAG 2.1 AA Compliant**: Complete accessibility with screen reader support
- **Performance Optimized**: Virtual scrolling, lazy loading, and memory management

**[📖 Full Documentation →](./lagerbestand/README.md)**

### 📊 Sales Analysis (`verkaufsanalyse/`)
Advanced sales data analysis and reporting tool for retail performance tracking.

**Features:**
- **Data Import**: Support for PDF and Excel sales reports
- **Interactive Tables**: Sortable, filterable data tables with export capabilities
- **Statistical Analysis**: Comprehensive sales metrics and trend analysis
- **Row Editing**: In-place editing of sales data
- **Backup & Restore**: Data persistence and recovery features

### 🏷️ Label Printing (`labels.html`)
Professional label printing system for warehouse products.

**Features:**
- **A4 Page Layout**: Optimized for standard label sheets
- **Print-Ready Design**: Clean, professional label formatting
- **Responsive Interface**: Works on desktop and mobile devices

### 📥 Goods Receipt (`Wareneingang.html`)
Streamlined goods receipt and inventory intake system.

**Features:**
- **Product Registration**: Easy entry of received goods
- **Validation**: Input sanitization and data validation
- **Professional UI**: Clean, accessible interface with Tailwind CSS

### 🔗 QR Code Generator (`index.html`)
Quick QR code generation for product labeling and tracking.

**Features:**
- **Instant Generation**: Real-time QR code creation
- **Customizable Size**: Adjustable QR code dimensions
- **Print-Ready**: High-resolution output for printing

### 📈 Stock Change Analysis (`bestandsveränderung/`)
Business analysis tool for stock movements and financial impacts from XLSX files.

**Features:**
- **Business Analysis**: Complete statistics on movements, items, quantities, and values
- **Financial Impact**: Detailed profit/loss analysis with margin calculations
- **Item Search**: Detailed view of write-offs, additions, and movement history per item
- **Data Preview**: Tabular display with configurable row counts and export options
- **Responsive Design**: Optimized for desktop and mobile with accessibility support

### 📋 Protocol Sorting (`protokoll/`)
XLSX sorting and visualization tool with QR code generation and intelligent column detection.

**Features:**
- **Dynamic Column Detection**: Automatic recognition of key columns (item, storage location, refill needs)
- **QR Code Generation**: Automatic QR codes for items and storage locations
- **Sorting Options**: Sort by refill needs, percentage, or storage location
- **Column Highlighting**: Visual emphasis on important columns
- **Export/Print**: Direct export and printing capabilities

### 📄 Protocol to QR (`protokoll2qr/`)
Protocol processing tool with QR code integration for PDF and XLSX files.

**Features:**
- **PDF Analysis**: Process protocol documents with QR code generation
- **Data Extraction**: Intelligent parsing of protocol data
- **QR Integration**: Embedded QR codes for quick access
- **Responsive Interface**: Clean, accessible design with Tailwind CSS

### 🔳 Advanced QR Code Generator (`qrcode/`)
Advanced QR code creation tool with customization options.

**Features:**
- **Styling Options**: Custom colors, shapes, and designs
- **High Resolution**: Print-ready high-quality output
- **Dark Mode Support**: Automatic theme adaptation
- **Export Formats**: Multiple output formats for various uses

## 🚀 Quick Start

### Prerequisites
- Modern web browser (latest stable versions recommended: Chrome 120+, Firefox 120+, Edge 120+, Safari 17+)
- No installation required - all applications run client-side
- Enable localStorage and IndexedDB in browser settings

### Getting Started

1. **Clone or download** the repository
2. **Open any HTML file** directly in your web browser
3. **No server required** - works completely offline
4. **Choose your application** based on your needs

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **UI Frameworks**: Tailwind CSS, Semantic UI, DataTables
- **Data Processing**: SheetJS (Excel), PDF.js, Dexie.js (IndexedDB)
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Dependencies**: All loaded via CDN - zero installation

### Design Principles
- **Client-Side Only**: No server infrastructure required
- **Progressive Enhancement**: Works without JavaScript (basic functionality)
- **Accessibility First**: WCAG 2.1 AA compliant across all applications
- **Performance Optimized**: Lazy loading, virtual scrolling, caching
- **Security Focused**: Input sanitization, CSP headers, file validation
- **Modular Architecture**: Clean separation of concerns

### Data Storage
- **localStorage**: Settings, configurations, small datasets
- **IndexedDB**: Large datasets, report archives, complex data structures
- **File-Based**: Direct Excel/PDF processing without server upload
- **Automatic Migration**: Legacy data compatibility maintained

## 📁 Project Structure

```
selgros/
│
├── index.html                    # QR Code Generator
├── labels.html                   # Label Printing System
├── Wareneingang.html            # Goods Receipt Application
│
├── bestandsveränderung/          # Stock Change Analysis
│   ├── index.html               # Main application
│   ├── CHANGELOG.md             # Change log
│   ├── README.md                # Documentation
│   ├── css/                     # Stylesheets
│   └── js/                      # JavaScript modules
│
├── lagerbestand/                 # Warehouse Stock Monitoring
│   ├── index.html               # Main application
│   ├── force-clear-storage.html # Storage reset utility
│   ├── package.json             # Testing dependencies
│   ├── css/                     # Stylesheets
│   ├── js/                      # JavaScript modules
│   └── docs/                    # Comprehensive documentation
│
├── protokoll/                    # Protocol Sorting Tool
│   ├── index.html               # Main application
│   ├── CHANGELOG.md             # Change log
│   ├── README.md                # Documentation
│
├── protokoll2qr/                 # Protocol to QR Tool
│   ├── index.html               # Main application
│   ├── analyze_pdf.py           # PDF analysis script
│
├── qrcode/                       # Advanced QR Code Generator
│   └── index.html               # Main application
│
├── verkaufsanalyse/              # Sales Analysis
│   ├── index.html               # Main application
│   ├── main.css                 # Styles
│   └── js/                      # Application modules
│
└── README.md                     # This file
```

## 🎯 Key Features

### Cross-Application Features
- **Zero Installation**: All applications work directly in the browser
- **Offline Capable**: No internet connection required for core functionality
- **Data Persistence**: Automatic saving and recovery
- **Multi-Language**: German and English support where applicable
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Print Support**: Print-optimized layouts for labels and reports

### Security & Privacy
- **Client-Side Processing**: All data stays on the user's device
- **No Data Transmission**: No server communication or cloud storage
- **Input Validation**: Comprehensive sanitization and validation
- **File Security**: Magic number verification for uploads
- **CSP Headers**: Content Security Policy protection

### Performance & Scalability
- **Virtual Scrolling**: Handles large datasets efficiently
- **Lazy Loading**: Fast initial page loads
- **Memory Management**: Automatic cleanup and optimization
- **Caching**: Intelligent data and UI caching
- **Debounced Operations**: Smooth user interactions

## 🔧 Development

### Contributing
1. **Choose Application**: Select the relevant application directory
2. **Follow Patterns**: Study existing code structure and conventions
3. **Test Thoroughly**: Verify functionality across browsers
4. **Update Documentation**: Keep READMEs current with changes
5. **Accessibility**: Ensure WCAG compliance for new features

### Code Standards
- **JavaScript**: ES6+ features, modular design, JSDoc comments
- **CSS**: CSS variables, responsive design, accessibility considerations
- **HTML**: Semantic markup, ARIA labels, progressive enhancement
- **Dependencies**: CDN-hosted, version-pinned for stability

### Testing
- **Browser Testing**: Chrome, Firefox, Edge, Safari
- **Device Testing**: Desktop, tablet, mobile
- **Accessibility Testing**: Screen readers, keyboard navigation
- **Performance Testing**: Large datasets, long sessions

## 📞 Support

### Getting Help
1. Check application-specific documentation
2. Review browser console for errors
3. Verify browser compatibility requirements
4. Test in incognito mode to rule out extension conflicts

### Troubleshooting
- **Data not saving?** Check localStorage/IndexedDB permissions
- **Files not uploading?** Verify file format and size limits
- **Performance issues?** Clear browser cache and storage
- **Display problems?** Ensure modern browser with ES6+ support

## 📄 License

This project is provided as-is for internal Selgros use.

## 🤝 Contributing

We welcome contributions to improve the warehouse management suite. Please:

1. Test changes across all applications
2. Maintain accessibility standards
3. Update documentation accordingly
4. Follow existing code patterns
5. Test on multiple browsers and devices

---

**Built with ❤️ for Selgros warehouse efficiency**
