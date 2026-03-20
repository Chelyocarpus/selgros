# Changelog

All notable changes to BV Bookmarklets are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2026-03-19

### Added
- **PB-Empfehlung** (`pb-recommend-source.js`): new bookmarklet that analyses the Präsentationsbestand (PB in Basis-ME) for all visible rows on the F&R Bestellvorschlag and recommends a target PB per article.
  - Formula: `Empf.-PB = min(⌈(Prog/KW ÷ 7) × Ziel-Tage⌉, ⌊(Prog/KW ÷ 7) × RLZ⌋)`. For perishable articles (RLZ < 9999) the recommendation is capped by RLZ so that the shelf stock can realistically be sold before expiry.
  - Target days: quick-select buttons for 2 / 3 / 5 / 7 days plus a free number input for any custom value. Default is 3 days.
  - Status classification with a small **color-coded dot** (Unicode ●) injected inline next to the PB value in the SAP grid — sits inside `sapMObjectNumberInner` so it aligns on the same text line as the number (hover for recommendation and status details):
    - Red dot — PB = 0 (Kein PB) or Ist-PB < 80 % of recommended (Zu niedrig)
    - Orange dot — Ist-PB > 150 % of recommended (Zu hoch)
    - Green dot — Ist-PB within 80–150 % of recommended (OK)
  - Additional text badges for special conditions (also in the PB column):
    - **RLZ↓** (teal) — recommendation is being capped by RLZ (Frischartikel)
    - **⚠ Verderb** (orange) — Ist-PB exceeds the RLZ-based maximum, items risk expiring unsold
  - Result table in the panel shows Artikel-Nr | Ist-PB | Empf. | RLZ | Status. RLZ column shows `Xd` in teal/orange for perishables, `–` for non-perishables. Clicking a table row scrolls and briefly highlights the corresponding article row in the SAP grid.
  - Summary feedback line with counts per status; orange warning line for Verderbgefahr when applicable.
  - Panel is draggable (grab title bar). × button closes panel and removes all badges. Re-clicking the bookmarklet also toggles off completely. "Badges" secondary button clears only the grid overlays without closing the panel.

## [1.7.0] - 2026-03-19

### Added
- **BV-Menge Auto-Fill** (`bv-autofill-source.js`): new bookmarklet with a draggable floating panel on the F&R Bestellvorschlag. Three functions in one:
  1. **Befüllen** — computes and fills BV-Menge for all visible rows to reach a configurable target coverage in days (Ziel-Reichweite). Quick-select buttons for 7 / 14 / 21 days plus a free-input field. Optional "Nur leere Felder befüllen" checkbox to skip rows that already have a non-zero entry. Formula: `ceil(max(0, (targetDays ÷ 7 × Prog/KW) − (Bestand + PB)) ÷ Faktor)` — PB (Planbestand/Sicherheitsbestand) is included to match SAP's displayed RW Bestand, preventing fills when the displayed RW already meets the target.
  2. **Leeren** — sets all currently filled BV-Menge fields to 0.
  3. **ME-Wächter** — automatically clears a row's BV-Menge when its Bestell-ME button is clicked and the unit text changes (polls for up to 5 s after each ME button click), preventing wrong-unit order quantities after a unit switch.
  - Panel is draggable and the × button hides it without disabling the ME-Wächter. Re-clicking the bookmarklet fully toggles off including the click listener.
  - Uses the native `HTMLInputElement.prototype.value` setter + `input`/`change` events to set values in SAP UI5 inputs where `sap.ui.getCore().byId()` is not available.



### Fixed
- **Ampel-Highlighter**: fixed three bugs that prevented any rows from being highlighted on the F&R Bestellvorschlag page:
  1. `getColIdx()` was querying all column headers globally across all four grids on the page (calendar, info, article table, time series — 53 total), returning the wrong index (22) instead of the correct index within the article grid (9).
  2. `scan()` iterated `[role="rowgroup"]` elements, but F&R renders rows as direct children of `[role="grid"]` with no rowgroup wrapper — so the loop always processed 0 rows.
  3. The MutationObserver was attached to the first grid (the calendar week grid) instead of the article grid, so virtual-scroll re-coloring never triggered.
  - Added `getMainGrid()` to locate the correct grid by detecting the "RW Bestand" column header within each grid. `getColIdx()` now takes the located grid as a parameter and queries column headers within it. `scan()` now queries rows directly on `mainGrid`, skipping header rows by checking for `[role="gridcell"]` descendants. Observer attaches to `mainGrid`.

### Changed
- **Ampel-Highlighter**: legend panel is now draggable (grab the title bar to reposition) and the × button only hides the panel without disabling the row highlighting or disconnecting the MutationObserver. Click the bookmarklet again to fully toggle off.

## [1.6.2] - 2026-03-19

### Added
- **Artikel-Info Tooltip**: `artikel-info-userscript.js` — Tampermonkey userscript version that uses `GM_xmlhttpRequest` with `withCredentials: true` to bypass the CORS restriction. Works on any domain (SAP F&R, different origin) since Tampermonkey's privileged XHR skips the browser's CORS enforcement entirely while still sending the user's Transgourmet session cookies.

### Notes
- The plain bookmarklet version works only when run from the same origin as `apps.transgourmet.de`. For cross-origin SAP pages the userscript version is required.

## [1.6.1] - 2026-03-19

### Fixed
- **Artikel-Info Tooltip**: updated field mappings to match actual API response structure — `content[]` (paginated wrapper), `p.name`, `p.imageUrl`, `p.ean`, `p.brand`, `p.unitName`, `p.productGroup.name` (nested), `p.description`, `p.packagingText`. Previous guessed field names (`productName`, `category`, `manufacturer`, `salesUnit`, etc.) resolved to empty strings.
- **Artikel-Info Tooltip**: tooltip now shows product name as header subtitle, truncated description (≤120 chars) next to the image, and a "Verpackung" row in the detail table.

## [1.6.0] - 2026-03-19

### Added
- **Artikel-Info Tooltip**: new bookmarklet that enters a passive hover mode on the F&R Bestellvorschlag list. After hovering over any Artikel-Name cell for 2 seconds, the bookmarklet reads the corresponding Artikel-Nr from the same row, calls the Transgourmet product search API (`/recor/api/productposterdocument/product/search?term={nr}`), and renders the result as a floating tooltip next to the cursor — with product name, thumbnail image, brand, order unit, EAN, and category. A small status badge (bottom-right) shows the mode is active; clicking × or re-running the bookmarklet cleans up all listeners and UI elements.



### Added
- **Abgang-Trend**: new `↑↑` tier for projected growth above **+100 %** vs. prior year, displayed in deep emerald green (`#005f27`). The threshold sits above the existing `↑` tier (≥ +10 %) so extremely high-growth articles are visually distinct. Updated the legend panel accordingly.

## [1.5.3] - 2026-03-19

### Changed
- **Abgang-Trend**: removed "Vorjahr" value from the hover tooltip — the tooltip now shows only the projected full-year value and the day reference (e.g. `↑ ~3.188 (+26 %) | Tag 79/365`).
- **Abgang-Trend**: panel `×` button now only hides the panel (`display:none`) without disabling the badges or the MutationObserver. Re-clicking the bookmarklet still performs a full teardown.
- **Abgang-Trend**: panel is now draggable — grab the header to reposition it anywhere on the page. The header shows a `grab` cursor; `×` still closes the panel only.
- **Abgang-Trend**: panel z-index raised to `2147483647` (true 32-bit max) to reduce the chance of SAP popups appearing on top.

## [1.5.2] - 2026-03-19

### Fixed
- **Abgang-Trend**: badge text was being clipped horizontally because the "Abgang aktuelles Jahr" column is narrow and the old format included the full projected value (e.g. `↑ ~3.188 (+26 %)`). Changed to a compact format: `↑ +26 %` (arrow + percentage only) in the cell; the full projection, prior-year baseline, and formula are shown in the native browser tooltip (`title` attribute) on hover. Cell `overflow` and `position` are set to `visible`/`relative` to let the badge overflow the SAP cell boundary rather than be clipped. Cells are restored to their original style on toggle-off.
- **Abgang-Trend**: legend panel moved from bottom-right to **top-right** (`top: 70px`) to avoid overlap with SAP action buttons at the bottom.
- **Abgang-Trend**: panel subtitle updated to "Akt. Jahr vs. Vorjahr · Hover für Details" to hint at the tooltip interaction.

## [1.5.1] - 2026-03-19

### Fixed
- **Abgang-Trend**: corrected column and row detection — the SAP F&R Bestellvorschlag page contains multiple `[role="grid"]` elements (calendar widget, filter panel, etc.); the old code scanned `document.querySelectorAll('[role="columnheader"]')` globally which returned wrong column indices (34/35 instead of 21/22), causing zero rows to be annotated. Replaced `getColIndices()` with `findTargetGrid()` which iterates all grids and picks the one whose headers contain "vorjahr" and "aktuell". Row iteration now uses `targetGrid.querySelectorAll('[role="row"]')` skipping index 0 (header row), since the Positionen grid does not use `[role="rowgroup"]`. `MutationObserver` now observes `targetGrid` instead of the first grid found globally.

## [1.5.0] - 2026-03-19

### Added
- New bookmarklet **Abgang-Trend**: annotates each row in the F&R Bestellvorschlag with a projected full-year sales badge (YTD ÷ day-fraction × 365) and a percentage trend against Abgang Vorjahr — ↑ Wachsend (≥ +10 %), → Stabil (±10 %), ↓ Schwächer (−10 to −30 %), ↓↓ Deutlich schwächer (< −30 %)
- `abgang-trend-source.js` — readable, unminified source for Abgang-Trend
- Day-of-year is computed at run time so the projection remains accurate on any date
- `MutationObserver` with busy-flag debounce via `requestAnimationFrame` prevents badge injection from re-triggering scan (infinite loop guard)
- Cell `title` attribute provides full projection detail as a tooltip when row height clips the badge
- New indigo color variant (`.bm-icon--indigo` / `.bm-link--indigo`) for analytical/trend bookmarklets

## [1.4.0] - 2026-03-19

### Added
- New bookmarklet **Ampel-Highlighter**: colors every row in the F&R Bestellvorschlag table according to its **Reichweite Bestand** (stock reach in days) — red (≤ 7), orange (8–14), yellow (15–21), green (> 21). A floating legend panel appears in the lower-right corner; clicking the bookmarklet again or the × button removes all highlights
- `ampel-highlighter-source.js` — readable, unminified source for Ampel-Highlighter
- `MutationObserver` in Ampel-Highlighter automatically colors rows added by virtual scroll without requiring any user interaction
- Column detection by scanning `[role="columnheader"]` aria-labels for "reichweite" — works regardless of exact column position in the table
- New teal color variant (`.bm-icon--teal` / `.bm-link--teal`) for analysis/visualization bookmarklets

## [1.3.7] - 2026-03-18

### Fixed
- PAL löschen: `waitForMbox` was using a flat `button[id^="__mbox-btn-"]` query and returning the first match in the DOM, which could be the oldest/bottom dialog when multiple were stacked. It now queries all visible `[role="alertdialog"]` elements and targets the last one (topmost), then finds the primary button inside it.
- PAL löschen: `waitForMbox` now distinguishes between SAP confirmation dialogs ("Bestätigung") and error dialogs ("Fehler"). When SAP shows an error (e.g. unknown PAL number), the script now correctly closes the error dialog, logs an error entry, and advances without waiting for a busy indicator or field clear — instead of incorrectly counting the pallet as "Gelöscht" after timing out.

## [1.3.6] - 2026-03-18

### Fixed
- PAL löschen: dialogs were stacking up because `waitBusy` started polling 400 ms after the confirm click — if SAP hadn't shown the busy indicator yet, the function returned immediately (false "not busy"), advancing the loop to the next pallet before the previous one was processed.
  - `waitBusy` now uses a **two-phase approach**: Phase 1 polls up to 3 s for the busy indicator to *appear*; Phase 2 then polls up to 15 s for it to *disappear*. This guarantees SAP processing is actually detected instead of returning prematurely on a timing gap.
- PAL löschen: added `waitForMboxGone` — after clicking the confirm button the script now waits until the MessageBox dialog is no longer visible before continuing. This ensures the action actually registered in SAP and prevents new dialogs from opening on top of an unclosed one.
- PAL löschen: `next()` now checks for any open dialogs at the start of each iteration and retries after 500 ms if one is still visible, acting as a safety net to prevent dialog stacking even if a previous step finished early.
- PAL löschen: the script no longer manually clears the pallet-number input after processing. Instead, `waitForInputClear` polls (up to 8 s) until SAP empties the field naturally — avoiding the race condition where a forced clear would fight with SAP's own form reset on slow connections.

## [1.3.5] - 2026-03-17

### Fixed
- PAL löschen test page: `showMbox` now also updates the inner `<span>` IDs (e.g. `__mbox-btn-12-inner`) alongside the outer `<button>` IDs, eliminating duplicate IDs across consecutive dialogs and better mirroring real SAP UI5 DOM structure.
- PAL löschen: `waitForMbox` visibility check replaced `offsetParent !== null` with `getClientRects().length > 0`, which correctly detects fixed-position elements as visible (unlike `offsetParent` which is `null` for `position:fixed` regardless of visibility).

## [1.3.4] - 2026-03-17

### Fixed
- PAL löschen: `waitForMbox` now only matches a **visible** `__mbox-btn-N` button (`offsetParent !== null`), preventing it from clicking stale hidden buttons from a previous dialog before the new confirmation dialog has appeared. The root cause was that `button[id^="__mbox-btn-"]` matched buttons inside the collapsed `display:none` overlay at the 200 ms poll point, 200 ms before the dialog's 400 ms appearance delay.
- PAL löschen: `waitForMbox` now selects the correct button regardless of the counter value in the ID (e.g. `__mbox-btn-37`), replacing the previous hard-coded `__mbox-btn-4` exact match.
- PAL löschen test page now simulates the real SAP behaviour by advancing the button ID counter by 10 on each dialog invocation (e.g. `__mbox-btn-12`, `__mbox-btn-22`, …)

## [1.3.3] - 2026-03-14

### Changed
- BV Auto-Eintragen now accepts German locale number formatting in the quantity column — comma as decimal separator and dot as thousands separator (e.g. `70297	-109,000	CO` or `12345	1.234,56	ST`); plain dot-decimal values continue to work unchanged
- Updated subtitle and placeholder to reflect the extended format

## [1.3.2] - 2026-03-14

### Changed
- PAL löschen input parsing now strips non-numeric lines (e.g. pasted column headers like "Palettennummer") and silently deduplicates repeated numbers — only unique, all-digit entries are processed

## [1.3.1] - 2026-03-14

### Fixed
- PAL löschen bookmarklet was processing pallet numbers digit-by-digit: the minified `javascript:` URL contained a literal newline character inside the `split()` string, which browsers strip from URLs, turning `split('\n')` into `split('')` (split-by-character). Replaced the literal newline with the `\n` escape sequence.
- Same literal-newline issue fixed in the textarea `placeholder` string in the minified bookmarklet.

## [1.3.0] - 2026-03-14

### Added
- New bookmarklet **PAL löschen**: accepts a list of pallet numbers (one per line) and deletes each one automatically — enters the number into `oInputPalPage4`, clicks `oButtonSubmitPage4`, waits for the `__mbox-btn-4` confirmation button, confirms, waits for SAP processing, clears the input, then moves to the next entry
- **Skip-001191 option** in PAL löschen: checkbox (on by default) — pallets whose number starts with `001191` are skipped automatically and counted separately in the summary; the option can be toggled per run
- `pal-loeschen-source.js` — readable, unminified source of the PAL löschen script for easier editing before minification
- `pal-loeschen-test.html` — mock SAP test page for validating the bookmarklet locally, including a `001191xxx` test pill
- Red color variant (`.bm-icon--red` / `.bm-link--red`) for destructive-action bookmarklets

## [1.2.0] - 2026-03-13

### Added
- `bv-auto-source.js` — readable, unminified source of the BV Auto-Eintragen script for easier editing before minification
- **Artikelliste extrahieren** now includes the unit in the output (e.g. `219320 -8 ST`), matching the mandatory `ARTNO QTY UNIT` format required by BV Auto-Eintragen
- New bookmarklet **Palettennummern extrahieren**: scans the SAP Reporting-Übersicht for all `oLabelReportingOverviewPALL2` elements and presents a deduplicated, copyable list of pallet numbers

### Fixed
- Decimal quantities (e.g. `219320 -1.0004`) now accepted and rounded up via `Math.ceil` instead of failing validation
- Log panel no longer forces auto-scroll to the bottom when the user has manually scrolled up; auto-scroll resumes once the user returns to the bottom
- "Starten" button is hidden after a fully successful run so the completed state is unambiguous; "Schließen" remains as the only action

## [1.1.0] - 2026-03-12

### Added
- Viewport meta tag for proper mobile rendering
- Inter font and FontAwesome 6.5.1 for consistent typography and icons
- Dark mode toggle with `localStorage` persistence, matching the portal design system
- Back navigation button linking to the main portal
- Aurora gradient background matching the project design language
- Installation guide with numbered step indicators at the top of the page
- Combined Workflow section explaining the end-to-end automation process
- FontAwesome icons on all five bookmarklet drag buttons
- Card grid layout with hover effects for each bookmarklet

### Changed
- Replaced plain inline-style page with the project's full design system (CSS variables, design tokens, glassmorphism cards)
- All five bookmarklets now display in a responsive two-column card grid
- Bookmarklet buttons styled via CSS classes instead of inline `style` attributes
- Structural HTML updated to use semantic elements (`<section>`, `<article>`, `<header>`, `<footer>`)
- Page title updated to "BV Bookmarklets – SAP Instorelogistik"

### Preserved
- All five bookmarklet `href` JavaScript payloads are unchanged and fully functional

## [1.0.0] - 2025-01-01

### Added
- Initial release with five bookmarklets: BV Auto-Eintragen, BV Artikel eintragen, Switch Debug, BV Anzahl eintragen, Artikelliste extrahieren
