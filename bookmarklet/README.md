# BV Bookmarklets – SAP Instorelogistik

Browser bookmarklets for automating repetitive tasks in SAP Instorelogistik. Each bookmarklet runs entirely in the browser — no server, no extensions required. Open [bookmarklet.html](./bookmarklet.html) and drag the buttons into your browser's bookmarks bar.

## Bookmarklets

### BV Auto-Eintragen
Automates inventory change entries (Bestandsveränderungen). Paste a list of articles in `ARTNO MENGE EINHEIT` format (one per line), click **Starten**, and the bookmarklet enters each item into the SAP mask in sequence — filling the article number, confirming, setting the quantity and direction switch, and confirming again.

**Input format:**
```
219320 -8 ST
317014 -2 CO
414951 -4 ST
```

Supports German number formatting (e.g. `-109,000` or `1.234,56`). Decimal quantities are rounded away from zero. Items where the SAP unit doesn't match the expected unit are skipped with an error.

---

### Abgang-Trend
Annotates each row in the F&R **Bestellvorschlag** with a small projection badge appended to the **Abgang aktuelles Jahr** cell. The badge shows the extrapolated full-year sales figure and the percentage trend against last year:

| Badge | Range | Meaning |
|-------|-------|---------|
| ↑ ~3.229 (+28%) | ≥ +10 % | Wachsend |
| → ~856 (−3%)   | ±10 %  | Stabil  |
| ↓ ~412 (−18%)  | −10 to −30 % | Schwächer |
| ↓↓ ~120 (−42%) | < −30 % | Deutlich schwächer |

Projection formula: `Abgang YTD × 365 ÷ day-of-year`. The day-of-year is computed at run time, so the projection stays accurate regardless of when the bookmarklet is run. A tooltip on the cell shows the full details. `MutationObserver` re-annotates rows added by virtual scroll.

---

### Ampel-Highlighter
Colors every row in the F&R **Bestellvorschlag** table according to its current **Reichweite Bestand** (stock reach in days):

| Color  | Range        | Meaning   |
|--------|--------------|-----------|
| Red    | ≤ 7 days     | Critical  |
| Orange | 8–14 days    | Warning   |
| Yellow | 15–21 days   | Caution   |
| Green  | > 21 days    | OK        |

A floating legend panel appears in the lower-right corner. Clicking the bookmarklet again (or the × button) removes all highlights. A `MutationObserver` ensures rows added by virtual scroll are colored immediately without any user action.

---

### Artikelliste extrahieren
Scans the SAP article list (Reporting-Übersicht) and builds a copyable list in `ARTNO MENGE EINHEIT` format — ready to paste directly into BV Auto-Eintragen.

---

### PAL löschen
Accepts a list of pallet numbers (one per line) and automatically deletes each one: enters the number, clicks submit, waits for the confirmation dialog, confirms, waits for SAP processing, then moves to the next entry.

- Duplicate entries are silently removed before processing
- Non-numeric lines (e.g. pasted column headers) are ignored
- **Skip-001191 option** (on by default): pallets starting with `001191` are skipped and counted separately in the summary

---

### Palettennummern extrahieren
Scans the SAP Reporting-Übersicht for all `oLabelReportingOverviewPALL2` elements and presents a deduplicated, copyable list of pallet numbers — useful as input for PAL löschen.

---

## Combined Workflow

1. **Palettennummern extrahieren** → copy the pallet list
2. **PAL löschen** → paste the list, delete all pallets
3. **Artikelliste extrahieren** → copy the article list from the reporting overview
4. Open the BV mask in SAP Instorelogistik
5. **BV Auto-Eintragen** → paste the article list, click Starten

---

## Installation

1. Open `bookmarklet.html` in your browser
2. Make sure the bookmarks bar is visible (`Ctrl+Shift+B` in Chrome/Edge)
3. Drag each button from the page directly into the bookmarks bar
4. Navigate to SAP Instorelogistik and click a bookmarklet to activate it
5. Clicking the same bookmarklet again while it is open closes the modal

---

## Development

| File | Purpose |
|---|---|
| `bookmarklet.html` | Bookmarklet install page (hosts all minified `javascript:` URLs) |
| `bv-auto-source.js` | Readable, unminified source for BV Auto-Eintragen |
| `ampel-highlighter-source.js` | Readable, unminified source for Ampel-Highlighter |
| `abgang-trend-source.js` | Readable, unminified source for Abgang-Trend |
| `pal-loeschen-source.js` | Readable, unminified source for PAL löschen |
| `test-page.html` | Mock SAP page for testing BV Auto-Eintragen locally |
| `pal-loeschen-test.html` | Mock SAP page for testing PAL löschen locally |
| `CHANGELOG.md` | Full version history |

To modify a bookmarklet:
1. Edit the corresponding `-source.js` file
2. Minify with a tool like [minify-js.com](https://www.minify-js.com/) or `terser`
3. Replace the `href="javascript:..."` value in `bookmarklet.html`

> **Note:** Literal newline characters in `javascript:` URLs are stripped by browsers. Always use the `\n` escape sequence inside strings (e.g. `split('\n')`) and in `placeholder` attributes.

---

## Requirements

- A modern browser (Chrome, Edge, Firefox)
- Access to SAP Instorelogistik with the relevant screens open before activating the bookmarklet
- No internet connection required — all scripts run locally

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.
