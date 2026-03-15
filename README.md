# Selgros Warehouse Management Suite

A collection of client-side web applications for retail warehouse and sales operations. All tools run directly in the browser — no server, no installation, no data leaves the device.

---

## Applications

### Bestandskontrolle

**Path:** [bestandskontrolle/](./bestandskontrolle/) | **Docs:** [README](./bestandskontrolle/README.md) · [Changelog](./bestandskontrolle/CHANGELOG.md)

Monitors warehouse inventory levels against configured capacity thresholds. Processes LX02 Excel reports and raises alerts for capacity issues. Supports optional sync with GitHub Projects for team-wide visibility.

- Upload or paste LX02 Excel reports
- Material configuration with capacity thresholds and promotional flags
- Drag-and-drop analytics dashboard
- Report archive (last 50 reports) stored in IndexedDB
- Optional GitHub Projects cloud sync with GraphQL batching
- Cross-tab sync via BroadcastChannel
- German and English UI

---

### Bestandsveränderung Analyse

**Path:** [bestandsveraenderung/](./bestandsveraenderung/) | **Docs:** [README](./bestandsveraenderung/README.md) · [Changelog](./bestandsveraenderung/CHANGELOG.md)

Analyses stock movement XLSX files and calculates financial impact: write-offs, additions, margins, and top-10 lists.

- Full business statistics (movements, quantities, values, margins)
- Per-article drill-down with movement history
- Sidebar navigation with smooth scrolling
- Configurable row counts and CSV export

---

### Verkaufsanalyse

**Path:** [verkaufsanalyse/](./verkaufsanalyse/)

Sales data analysis and reporting tool for retail performance tracking.

- Import from PDF and Excel sales reports
- Sortable, filterable, in-place editable data tables
- Statistical summaries and trend metrics
- Backup and restore for session data

---

### Wareneingang

**Path:** [wareneingang/](./wareneingang/) | **Changelog:** [CHANGELOG.md](./wareneingang/CHANGELOG.md)

Goods receipt and inventory intake form for logging incoming deliveries.

- Structured entry form with input validation
- Print-ready confirmation layout
- Responsive design for desktop and mobile

---

### Protokoll (XLSX Sortier-Tool)

**Path:** [protokoll/](./protokoll/) | **Docs:** [README](./protokoll/README.md) · [Changelog](./protokoll/CHANGELOG.md)

Sorts and visualises XLSX protocol files. Automatically detects key columns and generates QR codes for items and storage locations.

- Intelligent column detection (article, storage location, refill need)
- QR code generation inline and for print
- Sort by refill need, percentage, or storage location
- Column highlighting and direct print/export

---

### Protokoll mit QR-Codes

**Path:** [protokoll2qr/](./protokoll2qr/)

Processes PDF and XLSX protocol documents and embeds QR codes for quick item lookup.

- PDF and XLSX ingestion
- Automatic QR code generation per row
- Clean print layout

---

### QR Code Generator

**Path:** [qrcode/](./qrcode/)

Advanced QR code creation tool with style and colour customisation.

- Real-time preview
- Custom colours and dot shapes
- High-resolution export for printing
- Dark mode support

---

### Label Printing

**Path:** [labels/](./labels/)

Generates print-ready product labels formatted for standard A4 label sheets.

- A4-optimised layout
- Works entirely offline

---

### SAP Bookmarklets

**Path:** [bookmarklet/](./bookmarklet/) | **Docs:** [README](./bookmarklet/README.md) · [Changelog](./bookmarklet/CHANGELOG.md)

Browser bookmarklets for automating repetitive tasks in SAP Instorelogistik. Open [bookmarklet.html](./bookmarklet/bookmarklet.html) and drag the buttons into the browser bookmarks bar.

| Bookmarklet | Purpose |
|---|---|
| BV Auto-Eintragen | Automates inventory change entries from a pasted article list |
| Artikelliste extrahieren | Extracts the article list from the SAP Reporting-Übersicht |
| PAL löschen | Deletes a list of pallet numbers with automatic confirmation |
| Palettennummern extrahieren | Extracts all pallet numbers from the SAP Reporting-Übersicht |

---

## Getting Started

1. Clone or download the repository.
2. Open [index.html](./index.html) in a modern browser to access the application portal, or open any tool's `index.html` directly.
3. No build step, no server, no account required.

**Browser requirements:** Chrome 120+, Firefox 120+, Edge 120+, or Safari 17+. localStorage and IndexedDB must be enabled.

---

## Tech Stack

| Area | Technology |
|---|---|
| Language | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| Excel / XLSX | SheetJS |
| PDF | PDF.js |
| Local database | Dexie.js (IndexedDB wrapper) |
| Charts | Chart.js |
| QR codes | QRCode.js |
| Dependencies | All loaded via CDN — nothing to install |

---

## Data & Privacy

All processing happens locally in the browser. No data is sent to any server unless GitHub Projects sync is explicitly configured in Bestandskontrolle. Uploaded files are read into memory only and never stored outside the browser.

---

## Project Structure

```
selgros/
├── index.html                   # Application portal
├── bestandskontrolle/           # Inventory monitoring
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── docs/
├── bestandsveraenderung/        # Stock change analysis
│   ├── index.html
│   ├── css/
│   └── js/
├── bookmarklet/                 # SAP browser bookmarklets
├── labels/                      # Label printing
├── protokoll/                   # XLSX sorting tool
├── protokoll2qr/                # Protocol + QR codes
├── qrcode/                      # QR code generator
├── verkaufsanalyse/             # Sales analysis
│   ├── index.html
│   ├── main.css
│   └── js/
└── wareneingang/                # Goods receipt
    ├── index.html
    └── css/
```
