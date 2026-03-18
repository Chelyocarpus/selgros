# Changelog

All notable changes to BV Bookmarklets are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
