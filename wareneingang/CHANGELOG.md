# Changelog

All notable changes to Wareneingang are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-02-22

### Added
- **Modern 2026 animation layer** — new `css/animations.css` file linked from `index.html` with full reduced-motion support, containing:
  - **`@starting-style` entry effects** — main card fades up on first render; notification banner slides down when shown; results chip scales in on appearance; all using `transition-behavior: allow-discrete` where needed to animate `display`.
  - **Scroll-driven animations (`animation-timeline: view()`)** — stat cards reveal with a 6-step staggered `fade-up` as they enter the viewport; `.stats-panel` and individual `.table-row` elements animate on scroll with no JavaScript required.
  - **`@property` animatable custom properties** — `--gradient-angle`, `--glow-opacity`, and `--shimmer-pos` registered with typed syntax, enabling gradient rotation on the header icon badge and a shimmer sweep on the primary button hover.
  - **`interpolate-size: allow-keywords`** on `:root` — allows height/width transitions to intrinsic sizing keywords (`auto`, `min-content`, etc.) without JavaScript.
  - **Spring easing via `linear()`** — two presets (`--ease-spring-2`, `--ease-spring-3`) approximating physics-based springs; applied to stat card hover lift, filter checkmark pop, and button active press.
  - **View transitions** — `view-transition-name` assigned to `.card-glass`, `#notificationBanner`, `#validationSummary`, `#validationWrapper`, and `#tableWrapper` with custom enter/exit animations for each named region.
  - **Drop zone pulse** — `badge-pulse` ring animation on drag-over state.
  - **Global reduced-motion reset** — `@media (prefers-reduced-motion: reduce)` strips all animation and transition durations to `0.01ms`; loading spinner explicitly disabled.
- Added [ANIMATIONS.md](ANIMATIONS.md) documenting all techniques, browser support table, and accessibility considerations.

## [1.4.0] - 2026-02-22

### Changed
- Removed `max-w-7xl` cap and double `px-3` horizontal padding from the validation summary and table wrappers so both sections stretch to the full available viewport width.
- Reduced outer page wrapper horizontal padding from `sm:px-6` to `sm:px-3` to reclaim additional horizontal space for the table.
- Reduced table header cell padding from `0.625rem 0.75rem` to `0.5rem 0.5rem` and font size from `0.6875rem` to `0.625rem` for a more compact header row.
- Reduced table data cell padding from `0.5rem 0.75rem` to `0.375rem 0.5rem` and font size from `0.75rem` to `0.6875rem` for higher row visibility.
- Lowered per-cell `max-width` from `200px` to `160px` (data cells) and from `120px/80px` to `100px/60px` (first/last columns) so more columns are visible without horizontal scrolling.

## [1.3.0] - 2026-02-22

### Changed
- Extracted all styles from the inline `<style>` block into a new external file `css/main.css`.
- Replaced all HTML `style="..."` attribute occurrences with semantic CSS classes (`skip-link`, `header-icon-badge`, `section-heading`, `drop-zone-icon`, `file-selected`, etc.).
- Converted JavaScript DOM manipulation from `element.style.cssText` to `element.className` using dedicated CSS classes (`table-header-row`, `table-th`, `table-td`, `table-td--number`, `table-row--*`, `table-td--highlight-*`, `loading-indicator`, `loading-indicator-inner`, `loading-indicator-icon`).
- Converted JS-generated template literal inline styles to CSS class-based markup (`stat-card--*` type variants, `summary-header`, `summary-icon-wrapper`, `summary-title`, `stats-panel`, `filter-section-header`, `filter-label-inner`, `filter-dot`, `filter-checkmark`, `results-chip-*`, `info-block-*`, `notification-bar--*`).
- Replaced `NotificationManager` inline style assignments (`banner.style.background`, etc.) with CSS class toggling (`notification-bar--info/success/warning/error/processing`).
- Moved notification icon size and color rules from inline `style=` attributes to `.notification-icon-svg` and per-variant `.notification-bar--* .notification-icon-svg` selectors.
- Added stat card type-specific CSS custom property variants (`.stat-card--total/normal/falschbuchung/genullt/invalid/kg`) eliminating per-card dynamic inline style injection.

## [1.2.0] - 2026-02-22

### Added
- **2026 design system** — token-driven CSS custom properties for all colors, radii, shadows, and motion durations.
- **Aurora ambient background** — soft animated radial mesh gradients inspired by visionOS and modern SaaS aesthetics; disabled automatically when `prefers-reduced-motion` is active.
- **Glassmorphism 2.0 card surfaces** — `backdrop-filter: blur` + semi-transparent backgrounds on the main card, validation summary card, and table wrapper.
- **Indigo-gradient app header** — replaced the dark slate header; features a subtle dot grid texture and decorative circle overlay.
- **Bento grid stat cards** — top-accent stripe per semantic color; hover lift animation; token-driven `--card-accent` variable.
- **Redesigned drop zone** — indigo-dashed border with fill transition on hover/drag-over; icon badge replaces the large 48px icon.
- **SVG-icon notification banners** — emoji icons removed; all five notification states now use inline stroke SVG icons sized consistently.
- **Inter font** — loaded via Google Fonts (`display=swap`) replacing system-ui fallback.
- **Styled scrollbar** — WebKit thin indigo scrollbar track/thumb.
- Added [STYLE-GUIDE.md](STYLE-GUIDE.md) documenting the full 2026 design language, component patterns, and token reference.

### Changed
- Stat card grid uses `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`; each card shows an ALL-CAPS micro-label above an 800-weight number.
- Filter toggle cards use new `--filter-*` CSS tokens; `sr-only` hack replaced by a proper `position:absolute` invisible checkbox pattern aligned with the style guide.
- Warning/info/success messages below the stats use the `notification-bar` component (4px left border, token colors).
- Table headers use ALL-CAPS labels at 11px/700 weight; row styling uses `style.cssText` with CSS tokens instead of Tailwind class strings.
- Loading indicator uses the same stroke-path SVG spinner as other UI states; label localized to German.
- Results counter displayed in a `results-chip` pill badge.
- All UI text labels localized from English to German (`entries` → `Einträge`, `Loading more rows` → `Weitere Zeilen werden geladen`, etc.).
- Drag-over state uses `.drag-over` CSS class instead of manual Tailwind class injection.
- Page padding increased to `py-6 sm:py-10` with `px-3 sm:px-6` for better breathing room on wide screens.

### Removed
- `.professional-card`, `.professional-header`, `.professional-button`, `.professional-table` — replaced by design-token components.
- Hard-coded Tailwind color class strings from `TableRenderer` and `LazyTableRenderer`.

## [1.1.0] - 2026-02-22

### Added
- Filter selections (Normal / Falschbuchungen / Genullt) are now persisted in `localStorage` and restored automatically on the next visit.

### Fixed
- Changing a filter no longer scrolls the viewport back to the top of the page. The view stays focused on the results table. The page-top scroll now only happens when a new file is loaded.
