# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2026-02-22

### Added
- `css/animations.css` — dedicated motion layer, linked after `main.css` (remove the `<link>` to disable all motion without touching styles)
- `@property` declarations for `--gradient-angle`, `--shimmer-pos`, and `--glow-opacity` enabling hardware-accelerated custom-property animations
- `interpolate-size: allow-keywords` on `:root` for smooth transitions to and from intrinsic sizes
- Spring easing presets `--ease-spring-2` and `--ease-spring-3` using `linear()` for native-mobile feel
- `@starting-style` entry animations: `header` slides down and fades in; `.card` slides up and fades in; `.column-selector` and its content scale + slide up; `.loading-content` slides up on overlay activation
- Scroll-driven row reveals: `tbody tr` animates via `animation-timeline: view()` — no JavaScript required
- Shimmer sweep on `.btn-primary` hover using an animated `--shimmer-pos` gradient
- Spring lift transition override on all buttons (`--ease-spring-3`) for a snappier feel
- Drop-zone pulse ring animation on `.file-input-label.drag-over`
- `view-transition-name` assigned to `header`, `.card`, `#status`, `.column-selector`, and `.table-container` for cross-state view transitions
- Gentle float animation on `.empty-state svg`
- Comprehensive `@media (prefers-reduced-motion: reduce)` safety net; spinner explicitly set to `animation: none`

## [2.5.0] - 2026-02-22

### Added
- Per-sort-option column presets: each sort selection now has its own saved column visibility, stored in localStorage under `visibleColumns_<sortValue>`
- Column selector modal now shows which sort preset is being edited (e.g., "Preset: Auffüllbedarf")
- Column visibility automatically switches when the sort option changes
- Success message after applying columns now reads which preset was saved

## [2.4.0] - 2026-02-22

### Changed
- Redesigned to match Style Guide 2026: zinc grey palette replaces indigo/purple/pink
- Header uses near-black gradient (`#09090b` → `#27272a`) with white title and zinc subtitle
- Aurora background blobs use neutral zinc mesh colours
- Card is solid white with zinc border and layered shadow (no glassmorphism)
- All buttons updated: primary = near-black, secondary/print = white + zinc border
- Status banners use semantic soft backgrounds with matching text and 4px left border
- Table headers use `letter-spacing: 0.08em` with 2px bottom separator; no sticky backdrop blur
- Row hover uses `--color-accent-soft` (zinc tint)
- Lagerplatz groups alternated with per-group `group--odd`/`group--even` shading (replaces thick border)
- Loading spinner uses near-black instead of indigo
- Column selector modal is clean white, no frosted glass
- `prefers-reduced-motion` wrapper on all animations
- Print: headers repeat on each page (`table-header-group`), group shading uses `#ececed`/`#ffffff` with `print-color-adjust: exact`
- Design tokens entirely replaced with style-guide-compliant custom properties

## [2.3.1] - 2026-02-22

### Changed
- Lagerplatz QR code is now only rendered on the first (topmost) row per unique Lagerplatz value; duplicate Lagerplatz entries below it show an empty QR cell

## [2.3.0] - 2026-02-22

### Changed
- Replaced indigo/purple/pink colour scheme with zinc grey palette (style-guide aligned)
- Primary actions now use near-black (`#18181b`) following the style guide
- `h1` heading uses solid near-black instead of a coloured gradient
- Card and modal backgrounds are solid white; removed decorative blurs on static surfaces
- Table header uses style-guide tracking (`letter-spacing: 0.08em`) and a 2px bottom border separator
- Table zebra stripe changed to near-invisible zinc tint; hover uses zinc instead of indigo
- Highlight column colour changed to a neutral zinc tint (print-safe grey)
- Status banners use semantic soft backgrounds with matching text colours
- Print override for highlighted cells uses mid-zinc grey instead of amber
- Buttons: primary is near-black, secondary is white/zinc border (no coloured gradients)
- Loading overlay backdrop is near-black zinc

## [2.2.0] - 2026-02-22

### Changed
- Extracted inline CSS from `index.html` into a separate `css/main.css` file

## [2.1.0] - 2026-01-02

### Changed
- Migrated QR code generation from qrcode.js to QRious library
- Simplified QR code generation with cleaner API (no DOM manipulation required)
- QRious generates QR codes directly to canvas without temporary DOM elements

### Improved
- Cleaner code with fewer memory management concerns
- More reliable QR code generation without async fallback handling
- Reduced bundle complexity

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
