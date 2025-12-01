# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.7.1] - 2025-12-01

### Changed

#### Improved Button Hover Effects
- **Base buttons**: Replaced jarring 300px ripple animation with smooth gradient overlay and brightness filter
- **Primary/Success/Danger/Secondary buttons**: Enhanced shadows on hover for better depth perception, added focus-visible outlines for accessibility
- **Header buttons**: Added scale transform and box-shadow for more noticeable hover feedback
- **Widget buttons**: Added border, subtle transform and shadow for better visual response
- **Modal close buttons**: Redesigned with danger color feedback on hover and scale animation
- **Tab buttons**: Added gradient background and subtle lift effect on hover
- **Quick-add buttons**: Converted ripple to gradient overlay for smoother animation
- **DataTable pagination**: Replaced ripple with opacity-based gradient overlay

### Removed

#### Dashboard Feature
- Removed the Dashboard tab and all associated functionality
- Removed Gridstack library dependency
- Removed dashboard CSS (`css/dashboard.css`)
- Removed dashboard JavaScript (`js/tab-dashboard.js`)
- Removed dashboard documentation (`docs/DASHBOARD.md`)
- Removed dashboard layout persistence methods from data-manager
- Removed dashboard-related translations

---

## [2.7.0] - 2025-12-01

### Added

#### New Sync Tab
- **Dedicated Sync Tab**: Moved cloud synchronization to its own tab for better organization
  - Cloud sync settings and status
  - Cross-tab synchronization status
  - Sync activity log
  - Local backup options
  - IndexedDB status
  - Data statistics overview

#### Enhanced Cross-Tab/Cross-Device Synchronization
- **BroadcastChannel Integration**: Real-time sync between browser tabs
  - Automatic UI refresh when data changes in another tab
  - Unique tab ID generation for conflict resolution
  - Toast notifications for sync events from other tabs

- **Cross-Device Sync via Cloud**: 
  - Changes sync to cloud and propagate to other devices
  - Conflict resolution based on timestamp (newest wins)
  - Sync log tracks all sync activity across tabs/devices

- **Sync Activity Log**:
  - Persistent log of all sync operations (up to 100 entries)
  - Shows upload/download events, errors, and cross-tab sync events
  - Clear log functionality
  - Timestamp and status for each entry

- **Real-Time Status Display**:
  - Browser support indicator for BroadcastChannel
  - Tab ID display for debugging
  - Sync method indicator
  - Data statistics (materials, reports, groups, notes counts)

### Changed
- Moved cloud sync from Materials tab to dedicated Sync tab
- Cloud sync manager now broadcasts events to other tabs
- Settings changes propagate across tabs instantly
- Added callbacks for remote sync events and settings changes

### Technical Details
- New file: `js/tab-settings.js` - Settings/Sync tab content
- Updated: `js/cloud-sync-manager.js` - Cross-tab sync with BroadcastChannel
- Updated: `js/ui-manager.js` - Settings tab rendering methods
- Updated: `js/app.js` - Added settings tab initialization
- Updated: `js/translations.js` - New translations for sync tab (DE/EN)
- Updated: `index.html` - Added Sync tab navigation and content area
- Updated: `css/components.css` - Sync log and status styles

---

## [2.6.0] - 2025-12-01

### Added

#### Cloud Synchronization Feature
- **Multi-Provider Cloud Sync**: New cloud synchronization system for cross-device data access
  - **GitHub Gist Integration**: Sync data to GitHub Gists with personal access token authentication
    - Automatic gist creation on first sync
    - Support for both public and private gists
    - Configurable backup filename
  - **Local/Custom Server**: Support for self-hosted sync endpoints
    - Configurable upload and download URLs
    - Optional authentication headers (API keys, Bearer tokens, etc.)
    - Flexible server configuration

- **Graceful Error Handling**: Robust sync operations with user-friendly feedback
  - Exponential backoff retry logic (up to 3 attempts)
  - Clear error messages for authentication failures
  - Connection testing before sync operations
  - Progress indicators during sync

- **Auto-Sync Capability**: Optional automatic synchronization
  - Configurable interval (5 minutes to 24 hours)
  - Background sync without interrupting workflow
  - Visual status indicators for sync state

- **Security Considerations**: 
  - Warning message about local token storage
  - Tokens stored in localStorage (user responsibility for device trust)
  - Support for secure authentication headers

- **Translations**: Full German and English localization for all cloud sync features
  - 50+ new translation keys for cloud sync UI
  - Consistent terminology across languages

### Changed
- Updated Content Security Policy to allow GitHub API connections
- Added `--card-bg-secondary` CSS variable for nested card styling
- Enhanced badge system with new generic badge classes

### Technical Details
- New file: `js/cloud-sync-manager.js` - CloudSyncManager class
- Updated: `js/ui-manager.js` - Cloud sync UI methods
- Updated: `js/translations.js` - German and English translations
- Updated: `js/app.js` - Cloud sync initialization
- Updated: `index.html` - Script loading and CSP
- Updated: `css/main.css` - New CSS variables
- Updated: `css/components.css` - Cloud sync and badge styles

---

## [2.5.3] - 2025-12-01

### Changed

#### Results Table Styling Improvements
- **Cleaner Table Layout**: Removed heavy column borders and simplified visual design
  - Clean column alignment without vertical separators
  - Storage type and capacity columns centered
  - Quantity and actions columns right-aligned
  - Subtle row borders only

- **Improved Group/Single Entry Distinction**: 
  - Group headers: Bold purple gradient bar that clearly marks the start of a group
  - Group rows: Subtle indented styling with light purple background tint
  - Larger separator (20px gap) between groups for clear visual separation
  - Single entries: Clean white/card background, distinct from grouped items

- **Storage Type Badges**: Modernized pill-shaped design
  - Rounded corners with gradient backgrounds
  - Uppercase text with subtle letter-spacing
  - Distinct colors: MKT (blue), RES (amber), GNG (green), LAG (indigo)
  - Enhanced dark mode variants

- **Capacity Display**: Added background styling with distinct states
  - Green tint for configured capacity
  - Amber for promotional pricing
  - Gray for unconfigured

- **Alert Rows**: Subtle red background tint (no left border bar)

- Files modified: `css/tables.css`, `css/components.css`

---

## [2.5.2] - 2025-12-01

### Added

#### Storage Type Badge Styling
- **916 Zustellung Styling**: Added distinctive visual styling for the 916 (Zustellung/Delivery) storage type
  - Light mode: Purple background (#f3e8ff) with dark purple text (#6b21a8) and subtle border
  - Dark mode: Semi-transparent purple background with light purple text
  - CSS escape sequence support for numeric class names (`.storage-type-badge.\39 16`)
  - Alternative `.zustellung` class for easy fallback usage
- **LAG Warehouse Styling**: Added styling for the LAG (Warehouse) storage type
  - Light mode: Indigo background (#e0e7ff) with dark indigo text (#3730a3)
  - Dark mode: Semi-transparent indigo background with light indigo text
- Both light and dark mode variants ensure consistent UI across themes
- Files modified: `css/components.css`

### Fixed

#### Mobile Tab Navigation
- **Scroll Indicator**: Added visual fade indicators on mobile to show when more tabs are available
  - Right fade appears when there are more tabs to scroll right
  - Left fade appears when scrolled away from the start
  - Fades automatically hide when at the edge of scroll
  - Works in both light and dark modes
- Files modified: `css/main.css`, `js/app.js`

---

## [Unreleased]

### Removed

#### Hammer.js Dependency
- **Removed External Dependency**: Replaced Hammer.js with native touch events
  - Removed Hammer.js CDN script from `index.html`
  - Implemented native touch event handlers in `js/touch-gestures.js`
  - Replaced swipe gesture detection with native `touchstart` and `touchend` events
  - Updated swipe-to-delete functionality in `js/mobile-enhancements.js` to use native events
  - Benefits:
    - Reduced external dependencies
    - Smaller page load size
    - No breaking changes to functionality
    - Maintained all touch gesture features (tab navigation, swipe-to-delete)
  - Files modified: `index.html`, `js/touch-gestures.js`, `js/mobile-enhancements.js`

### Improved

#### Touch Gesture Code Quality
- **Shared Swipe Detection Utility**: Created reusable `TouchGestureUtils` class
  - Extracted common swipe detection logic to `js/utils.js`
  - Eliminated code duplication between `touch-gestures.js` and `mobile-enhancements.js`
  - Added multi-touch guard to prevent unintended gesture processing
  - Implemented `touchcancel` event handling to reset stale gesture state
  - Improved code quality by using function expressions instead of declarations in blocks
  - Uses `clientX`/`clientY` coordinates (viewport-relative) instead of `screenX`/`screenY` for better mobile behavior
  - Fixed swipe eligibility check to evaluate where touch **started**, not where it ended
  - Added `shouldPreventSwipe` callback option for proper gesture filtering
  - More maintainable and testable architecture
  - Files modified: `js/utils.js`, `js/touch-gestures.js`, `js/mobile-enhancements.js`

---

## [2.5.1] - 2025-11-13

### Fixed

#### Materials List State Preservation
- **List Reset After Update**: Fixed materials list resetting to initial state after editing a material
  - Previously: Scroll position, page number, search filters, and selections were lost after updates
  - Now: All table state is preserved when editing, deleting, or performing bulk operations
  - Implemented `saveMaterialsTableState()` method to capture:
    - Current page number
    - Search term
    - Column sorting
    - Checkbox selections
    - Scroll position
  - Implemented `restoreMaterialsTableState()` method to reapply saved state after re-render
  - Added optional highlighting of edited material with smooth scroll to location
  - Updated `renderMaterialsList()` to accept `options` parameter with:
    - `preserveState`: Boolean to enable state preservation
    - `highlightMaterialCode`: Material code to highlight after restore
  - Modified `saveMaterialModal()` to preserve state and highlight edited material
  - Modified `deleteMaterial()` to preserve state when deleting
  - Updated undo/redo operations to preserve state
  - Updated bulk edit/delete operations to preserve state
  - Updated group deletion to preserve state
  - Improved user experience: workflow continuity maintained when managing multiple materials
  - Files modified: `js/tab-materials.js`, `js/ui-manager.js`, `css/tables.css`, `js/utils.js`

### Improved

#### Code Quality & Browser Compatibility
- **Event-Driven State Restoration**: Replaced arbitrary timeouts with DataTable's draw event
  - Uses `table.on('draw.stateRestore')` for reliable DOM update detection
  - Eliminates race conditions from setTimeout-based approaches
  - Namespaced event handler ensures single execution and proper cleanup
  
- **Performance Optimization**: Streamlined DataTable rendering
  - Combined search, order, and page settings before single `table.draw(false)` call
  - Reduced from 2 draw calls to 1, minimizing flicker and improving performance
  - More efficient state application with less DOM manipulation
  
- **CSS Class-Based Highlighting**: Replaced inline styles with CSS class
  - Added `.highlighted-row` class in `css/tables.css`
  - Proper dark mode support with themed colors
  - Better maintainability and separation of concerns
  - No style conflicts with existing CSS rules
  
- **Selection Filtering**: Enhanced checkbox state restoration
  - Filters `selectedMaterials` to only include items present in current table data
  - Prevents errors when materials have been deleted or data has changed
  - Validates against current material codes before restoring selection
  - More robust handling of edge cases
  
- **Type Safety**: Added parameter validation for `renderMaterialsList()`
  - Type check ensures `options` is an object before destructuring
  - Prevents runtime errors if called with invalid arguments
  - Gracefully handles `null`, `undefined`, or non-object values
  
- **Browser Compatibility**: Added CSS.escape polyfill in `utils.js`
  - Full W3C spec-compliant implementation for older browsers
  - Supports browsers without native CSS.escape (IE, older Safari)
  - Handles edge cases: NULL characters, leading digits, special characters
  - Safe escaping for dynamic selector generation

---

## [2.5.0] - 2025-01-13

### Added - Quick Category Selection in Materials List

#### Inline Category Assignment
- **Quick Select Dropdown**: Category/group selection directly in the materials list table
  - Eliminates need to open full edit dialog for category changes
  - Dropdown appears in the "Group" column of materials table
  - Shows all available categories/groups with current selection highlighted
  - Instant save on selection change
  
- **Visual Indicators**: Real-time visual feedback for category assignments
  - Color-coded indicator dot next to dropdown matching category color
  - Smooth pulse animation when category changes
  - Indicator automatically updates on category assignment
  - Hidden when material is ungrouped
  
- **User Experience Improvements**:
  - Toast notifications showing category transition (old → new)
  - Error handling with automatic rollback on failure
  - Keyboard navigation support for accessibility
  - Screen reader announcements for all actions
  - Touch-friendly interface for mobile devices
  
- **Workflow Benefits**:
  - Streamlines bulk categorization workflows
  - Reduces time spent managing material categories
  - Enables quick recategorization when organizational needs change
  - Maintains focus on materials list without context switching
  
- **Mobile Responsive**: Optimized for all screen sizes
  - Vertical layout on mobile (dropdown above indicator)
  - Touch-optimized dropdown sizing
  - Reduced font sizes for compact display
  - Maintains full functionality on mobile devices

#### Technical Implementation
- New `quickAssignCategory()` method for instant category updates
- `updateCategoryIndicator()` for visual feedback updates
- `revertCategoryDropdown()` for error recovery
- Integrated with existing DataManager category system
- Dual persistence (Dexie IndexedDB + localStorage backup)

#### Styling
- Custom dropdown styling with branded colors
- Hover and focus states for better interactivity
- CSS animations for category indicator
- Dark mode support
- High contrast mode compatibility

#### Translations
- Added German translations: "Kategorie schnell zuweisen", "Kategorie aktualisiert"
- Added English translations: "Quick assign category", "Category Updated"

#### Documentation
- Created comprehensive feature documentation (QUICK-CATEGORY-SELECT.md)
- Includes usage guide, technical details, and testing scenarios
- API documentation for new methods

---

## [2.4.0] - 2025-11-11

### Added - Recently Added Materials Live Preview

#### Live Material Preview Feature
- **Session-Based Tracking**: Newly added materials are tracked in a session-based list
  - Materials added during current session are displayed in real-time
  - Persists using sessionStorage (cleared when browser is closed)
  - Displays up to 20 most recent materials
  
- **Live Preview Card**: Interactive preview section showing recently added materials
  - Appears automatically when materials are added
  - Shows material code, name, capacity, promo settings, and groups
  - Displays time elapsed since addition (e.g., "Added 2 minutes ago")
  - Material count badge with animated pulse effect
  - Smooth animations and visual feedback
  
- **Quick Actions**: Convenient actions directly from the preview
  - Edit button to quickly modify recently added materials
  - Remove button to take materials out of the preview list
  - Clear All button to reset the entire preview list
  - Auto-scroll to show newly added items
  
- **Enhanced User Experience**:
  - Auto-focus on material code input after adding material for continuous entry
  - Visual highlight for materials added within last 5 seconds
  - Color-coded details with icons for better readability
  - Responsive design supporting all screen sizes
  - Full dark mode and high contrast mode support
  
- **Improved Workflow**: 
  - Users can verify entries without leaving the entry screen
  - Reduces mistakes and duplicate entries
  - Enables efficient batch material addition
  - Materials remain visible for review throughout the session

#### Translations
- Added German and English translations for all new UI elements
- Localized time-ago strings (seconds, minutes, hours)

---

## [2.3.0] - 2025-11-10

### Added - Mobile Responsiveness & Touch Support

#### Comprehensive Responsive Design
- **CSS Media Queries**: Added responsive breakpoints for optimal viewing on all devices
  - Tablet (768px - 1024px): Optimized layout for medium screens
  - Mobile (max-width: 768px): Full mobile-friendly redesign
  - Small Mobile (max-width: 480px): Compact design for smaller phones
  - Landscape Orientation: Special handling for landscape mode on mobile
  
#### Touch Gesture Support
- **Hammer.js Integration**: Added touch gesture library (v2.0.8)
  - Swipe left/right to navigate between tabs
  - **Smart gesture detection**: Swipes on tables are ignored for tab navigation, allowing table scrolling
  - Haptic feedback on supported devices
  - Screen reader announcements for gesture actions
  - Configurable threshold and velocity settings
  
- **Table Swipe Gestures**: 
  - Horizontal scrolling for DataTables
  - Touch-scrollable with momentum (-webkit-overflow-scrolling)
  - Visual scroll indicators ("← Swipe to see more →")
  - Auto-hide indicator after scrolling
  
- **Pull-to-Refresh**: Basic pull-to-refresh gesture detection (foundation for future enhancement)

#### Mobile-Optimized Components

**Main Layout (main.css)**:
- Responsive header with stacked layout on mobile
- Touch-friendly header buttons (44x44px minimum)
- Horizontal scrollable tabs with hidden scrollbar
- Optimized stats grid (2 columns on mobile, 1 on small phones)
- Mobile-friendly toast notifications
- Reduced padding and margins for mobile

**Forms & Buttons (components.css)**:
- 16px font size for inputs (prevents iOS zoom)
- Touch-friendly buttons (44x44px minimum)
- Full-width button groups on mobile
- Collapsible upload sections
- Single-column stats grid on small screens
- Larger badges and interactive elements
- Stacked bulk actions toolbar
- Mobile-optimized filter panels

**DataTables (tables.css)**:
- Horizontal scroll wrapper with touch support
- Mobile-optimized pagination (larger buttons)
- Responsive search and length controls
- Sticky table headers
- Optional sticky first column
- Reduced font sizes for compact display
- Full-width controls on mobile
- Enhanced scroll indicators

**Modals (modals.css)**:
- Full-width modals on mobile (100% width)
- Scrollable modal content
- Larger close buttons (44x44px)
- Stacked footer buttons
- Reduced padding for small screens
- Keyboard shortcuts modal with stacked layout
- Touch-friendly form inputs

#### Mobile-Specific Enhancements

**New File: `js/mobile-enhancements.js`**:
- **Collapsible Sections**: Add collapsible functionality to long modal sections
- **FAB Optimization**: Enhanced floating action button for mobile
  - Fade during scroll for better UX
  - Touch ripple effects
  - Proper z-index management
  
- **Touch Feedback**: Tactile feedback on all interactive elements
  - Opacity changes on touch
  - Visual touch states
  - Smooth transitions
  
- **Form Improvements**:
  - Clear buttons on text inputs
  - Proper input modes for mobile keyboards
  - Numeric keyboards for capacity fields
  - Auto-expanding text areas
  
- **Back-to-Top Button**: Floating button for easy navigation
  - Appears after scrolling 300px
  - Smooth scroll animation
  - Haptic feedback
  - Mobile-optimized size and position
  
- **Input Enhancement**:
  - Prevent zoom on iOS when focusing inputs
  - Viewport manipulation for better UX
  - 16px minimum font size enforcement

**New File: `js/touch-gestures.js`**:
- Tab navigation via swipe gestures
- Table wrapper creation for horizontal scrolling
- DataTables touch optimization
- Larger pagination buttons
- Touch-friendly search inputs
- Orientation change handling

#### Touch-Friendly Improvements
- **Minimum Touch Targets**: All interactive elements at least 44x44px
- **Hover Effect Removal**: Disabled hover effects on touch devices
- **Larger Form Controls**: Increased size for better touch accuracy
- **Improved Checkboxes**: Larger checkboxes (22x22px) on touch devices
- **No Zoom on Input**: Prevents mobile browsers from zooming when focusing inputs

#### Responsive Features by Breakpoint

**Tablet (768px - 1024px)**:
- 2-3 column layouts
- Slightly reduced font sizes
- Optimized spacing
- Touch-friendly controls

**Mobile (max-width: 768px)**:
- Single column layouts
- Stacked navigation
- Full-width components
- Larger touch targets
- Simplified forms
- Collapsible sections
- Mobile-optimized tables

**Small Mobile (max-width: 480px)**:
- Extra compact layout
- Minimum viable UI
- Priority content only
- Simplified controls
- Single column everything

**Landscape Mode**:
- 2-column keyboard shortcuts
- 4-column stats grid
- Horizontal layout optimization
- Better space utilization

#### Updated Files
- `index.html`: Added Hammer.js CDN, new script includes
- `css/main.css`: Added comprehensive mobile media queries (~250 lines)
- `css/components.css`: Added mobile responsive styles (~400 lines)
- `css/tables.css`: Added DataTables mobile optimization (~200 lines)
- `css/modals.css`: Added modal mobile responsiveness (~300 lines)

### Technical Details

#### Media Query Strategy
- Mobile-first approach with progressive enhancement
- Breakpoints match common device sizes
- Touch detection via `@media (hover: none) and (pointer: coarse)`
- Orientation-specific layouts

#### Performance Optimizations
- Passive event listeners for scroll/touch
- CSS transforms for smooth animations
- Minimal reflows and repaints
- Efficient gesture detection

#### Accessibility
- Screen reader announcements for gestures
- Keyboard navigation maintained
- ARIA labels preserved
- Focus management on mobile

### Fixed

#### Touch Gesture Conflicts
- **Table Scrolling vs Tab Navigation**: Fixed conflict where swiping on tables would trigger tab navigation
  - Added `isSwipeOnScrollableElement()` function to detect swipes on scrollable areas
  - Tab navigation swipes now ignored when:
    - Swiping on `.table-responsive` wrappers
    - Swiping on DataTables wrappers
    - Swiping on elements with horizontal scroll
    - Swiping on `<table>`, `<td>`, or `<th>` elements
  - Tables can now be scrolled horizontally without changing tabs
  - Improves UX when viewing wide tables on mobile devices

---

## [2.2.0] - 2025-11-10

### Added - Material Groups Enhancement

#### Comprehensive Groups Overhaul
- **Color-Coded Groups**: Each group now has a customizable color for visual distinction
  - 10 vibrant color options (Blue, Green, Amber, Red, Purple, Cyan, Pink, Orange, Teal, Indigo)
  - Automatic color assignment for new groups (uses first available color)
  - Color picker in create/edit group modal with visual selection
  - Colors persist across sessions and are stored in the database

- **Enhanced Filter Functionality**:
  - Filter dropdown now dynamically populated with actual groups from database
  - Groups displayed with colored bullet points (■) matching their assigned color
  - "All Materials" and "Ungrouped" default options
  - Real filter implementation (replaces placeholder comment)
  - Filters work correctly with capacity and promo status filters
  - Filter resets properly without leaving stale filters

- **Visual Group Badges in Materials Table**:
  - New "Group" column added to materials table
  - Color-coded badges showing group name with matching color
  - Badges use subtle background tint and border in group color
  - Tag icon (fa-tag) for visual clarity
  - Ungrouped materials show "—" placeholder

- **Improved Group Cards Display**:
  - Larger, more colorful group cards (300px minimum width)
  - Color-coded icon box with tag icon in group color
  - Background uses subtle tint of group color (10% opacity)
  - Border uses full group color for strong visual identity
  - Hover effects with lift animation and colored shadow
  - Material count badge in card header
  - Edit and Delete buttons with group color styling
  - Responsive grid layout (auto-fill, minmax)

- **Quick Filter from Group Cards**:
  - "View Materials" button on each group card
  - Clicking scrolls to filter section and applies group filter
  - Shows material count in button
  - Provides toast notification confirming filter applied
  - Smooth scroll animation to filter card

- **Bulk Group Assignment**:
  - Existing bulk edit modal already supported group assignment
  - Verified group dropdown populates correctly
  - Checkbox to enable/disable group update
  - Can assign or remove groups from multiple materials at once
  - Full undo/redo support for bulk group changes

### Changed

#### Materials Tab Reorganization
- **Filter Card Repositioning**: Moved filter card from position 2 to position 6
  - Filter now directly above materials list table
  - Removed gap between filter controls and filtered content
  - Improved usability for group filtering workflow
  - New order: Import/Export → Backup → Groups Management → Notes → Undo → **Filter** → Materials List

#### Data Model Updates
- `data-manager.js` - `createGroup()` method now accepts `color` parameter
  - Default colors defined in array of 10 hex values
  - Auto-selection algorithm finds unused color or defaults to Blue
  - Color stored in group object alongside name and description
  - `updateGroup()` properly handles color updates

#### UI Component Enhancements
- `tab-materials.js` - Multiple improvements:
  - Added `selectGroupColor()` method for color picker interaction
  - Added `populateFilterGroupDropdown()` to populate filter dropdown
  - Updated `saveGroup()` to handle color selection
  - Enhanced `renderGroupsList()` with color-coded cards
  - Added `filterByGroup()` for quick filtering from group cards
  - Updated `renderMaterialsList()` to include group badges
  - Modified `applyMaterialsFilter()` with actual group filtering logic
  - Fixed `clearMaterialsFilter()` to properly remove filters

#### Translation Updates
- `translations.js` - Added new translation keys:
  - `groupColor` (German: "Gruppenfarbe", English: "Group Color")
  - `viewMaterials` (German: "Materialien anzeigen", English: "View Materials")
  - Both German and English translations provided

### Fixed

#### Filter Implementation
- Group filter dropdown now shows actual groups instead of only static "All" and "Ungrouped"
- Filter logic implemented (was previously a placeholder comment)
- Filter properly checks material.group property against selected group ID
- "Ungrouped" filter correctly shows materials with no group assigned
- Multiple filters work together correctly (capacity + promo + group)

#### DataTable Column Count
- Updated columnDefs to target column 7 for Actions (was 6)
- Accounts for new Group column in materials table
- Prevents sorting on checkbox and Actions columns

### Technical Details

#### Color System
- Colors stored as hex values (#RRGGBB format)
- Background tints use color + "20" suffix for 12.5% opacity
- Border and text use full color for contrast
- Hover effects use color + "40" suffix for 25% opacity shadow
- CSS custom properties used for dynamic theming

#### Filter Architecture
- Custom DataTables search extension for materials table
- Properly scoped to only filter materialsTable (not other tables)
- Filters removed cleanly on clear/re-apply
- Uses material code to look up full material object for group checking

#### Performance Optimizations
- Group dropdown population happens once on tab load
- Color picker uses event delegation for efficient updates
- Filter function uses early returns for performance
- Group badge rendering cached by DataTable

---

## [2.1.0] - 2025-11-10

### Added

#### Material Groups Management
- **Groups Management Card**: Added dedicated UI card in Materials tab for managing material groups
  - Create, edit, and delete groups with modal dialogs
  - Visual group cards showing material count and creation date
  - Group descriptions for better organization
  - Integrated with existing group assignment in material modals
  - Integrated with filter dropdown for easy group-based filtering
  - Empty state message when no groups exist
  - Full translation support (German and English)
  - Hover effects with subtle animations and color transitions
  - Gradient top border on hover for visual feedback
  - Enhanced styling for dark mode and high contrast modes
  - Responsive grid layout adapts to screen size

### Changed

#### UI/UX Improvements
- **Bulk Actions Toolbar Redesign**: Completely redesigned bulk actions toolbar with modern UI
  - Enhanced visual hierarchy with gradient backdrop and blur effects
  - Improved spacing and padding for better touch targets
  - Added badge-style selection counter with pill design
  - Enhanced button states with smooth transitions and hover effects
  - Added subtle top shimmer animation for visual polish
  - Improved shadow system for better depth perception
  - Better icon-text alignment in action buttons
  - Responsive design for mobile and tablet devices:
    - Stacks vertically on screens < 768px
    - Full-width buttons on mobile for easier interaction
    - Adjusted font sizes for smaller screens
  - Enhanced dark mode with improved contrast and transparency
  - Improved high contrast mode with stronger borders and clearer states
  - Better accessibility with focus states and keyboard navigation

---

## [Unreleased]

### Fixed

#### User Experience & Accessibility
- **Removed Browser Alerts**: Replaced all native browser `alert()` and `confirm()` dialogs with custom modals
  - Storage cleanup confirmations now use styled modal dialogs
  - Dashboard reset confirmation uses modal instead of browser confirm
  - Removed alert in data-manager.js, replaced with console error logging
  - All confirmations now support:
    - Consistent styling with app theme
    - Keyboard navigation
    - Screen reader announcements
    - Dark mode and high contrast support

#### Storage Management & Quota Handling
- **IndexedDB Quota Error**: Fixed "DOMException: The quota has been exceeded" error when saving archive
- **Automatic Cleanup**: `saveArchive()` now automatically cleans up old entries before saving
  - Removes entries older than 30 days
  - Limits archive to 50 entries maximum
  - Monitors total size (30MB threshold)
- **Aggressive Cleanup**: Emergency cleanup triggered on quota exceeded
  - Reduces to 20 most recent entries
  - Strips raw Excel data from old entries (keeps only summaries)
- **Retry Logic**: Automatically retries save after cleanup
- **Size Estimation**: New `estimateArchiveSize()` calculates storage in MB using Blob API
- **User Notifications**: Toast messages inform users of storage cleanup actions

#### Storage Management UI
- **Storage Status Display**: New card in Materials tab shows:
  - Total archive entries count
  - Estimated storage size in MB
  - Oldest entry date
- **Manual Cleanup Controls**:
  - "Cleanup Old" button removes entries older than 30 days
  - "Optimize Storage" button performs aggressive cleanup if size exceeds 20MB
  - "Refresh" button updates stats display
- **Real-time Monitoring**: Status auto-updates when Materials tab is rendered
- **Confirmation Dialogs**: User confirmation required before cleanup operations
- **Success Feedback**: Toast notifications confirm cleanup completion

### Added - Bulk Operations & Batch Processing

#### Bulk Material Management
- **Bulk Selection**: Checkboxes in materials table for multi-select
- **Select All/None**: Master checkbox in table header with indeterminate state
- **Bulk Actions Toolbar**: Appears when items selected, shows count and actions
- **Bulk Edit Modal**: Update capacity, promo settings, or groups for multiple materials
  - Selective field updates (choose which fields to change)
  - Group assignment
  - Promotional capacity and status
  - Regular capacity updates
- **Bulk Delete**: Delete multiple materials with confirmation showing selected items
- **Undo/Redo Support**: All bulk operations support undo/redo
- **Export Filtered**: Export only currently visible/filtered materials to CSV

#### Batch Import
- **Multiple File Upload**: Import CSV, JSON, and Excel files simultaneously
- **Multi-Format Support**: Handles .csv, .json, .xlsx, .xls files
- **JSON Import**: New `importMaterialsFromJSON()` method for JSON batch imports
- **Progress Tracking**: Shows current file being processed and progress bar
- **Error Aggregation**: Collects all errors from all files and reports summary
- **Success Statistics**: Shows total imported, files processed, and failures

#### Batch Report Processing
- **Multiple Excel Upload**: Process multiple LX02 reports at once
- **Progress Modal**: Real-time progress tracking with file names and percentage
- **Report Aggregation**: Combines data from multiple reports into unified view
- **Source Tracking**: Shows which reports contributed to each material
- **Error Handling**: Individual file failures don't stop batch processing
- **Batch Info Banner**: Visual indicator showing aggregated report data
- **Archive Integration**: All reports saved to archive with file names

#### UI Enhancements
- **Bulk Actions Toolbar**: Gradient background, animated appearance
- **Progress Indicators**: Smooth progress bars with shimmer animation
- **Batch Processing Modal**: Clean progress display with file count
- **Selection Checkboxes**: Styled checkboxes with primary color accent
- **Info Banners**: Visual feedback for batch operations

#### Data Manager Updates
- **`bulkUpdateMaterials()`**: Update multiple materials in one operation
- **`bulkDeleteMaterials()`**: Delete multiple materials with single undo point
- **`exportMaterialsCSV(materialCodes)`**: Export specific materials or all
- **Enhanced Undo/Redo**: Support for BULK_UPDATE and BULK_DELETE actions
- **History Tracking**: All bulk operations create single history entries

#### Translations
- Added 25+ new translation keys for bulk operations
- German and English support for all new features
- Bilingual labels for buttons, tooltips, and messages

#### CSS Additions
- `bulk-actions-toolbar` - Animated toolbar with gradient
- `material-select-checkbox` - Styled selection checkboxes
- `progress-bar` - Smooth progress with shimmer effect
- `batch-progress-info` - Progress modal styling
- Dark mode and high contrast support for all new components

### Added - Interactive Dashboards
- **Customizable Dashboard Tab**: New tab with drag-and-drop widget interface
- **Gridstack Integration**: Powered by Gridstack.js v10.3.1 for grid layout
- **8 Widget Types**: Comprehensive widget library for data visualization
  - Total Alerts Widget (stat card with status indicator)
  - Total Materials Widget (material count overview)
  - Capacity Overview Widget (visual gauge with ring chart)
  - Recent Alerts Widget (last 5 alerts with details)
  - Storage Distribution Widget (bar chart by storage type)
  - Capacity Trends Widget (line chart over time)
  - Top Materials Widget (ranked list by alerts)
  - Analytics Summary Widget (key metrics grid)
- **Drag & Drop**: Rearrange widgets by dragging headers
- **Resizable Widgets**: Adjust dimensions using corner/edge handles
- **Auto-Save Layout**: Automatically persists dashboard configuration
- **Widget Controls**: Refresh and remove buttons per widget
- **Default Layout**: Pre-configured layout for first-time users
- **Reset Functionality**: Restore default layout with confirmation

#### New Files
- `js/tab-dashboard.js` - Dashboard tab implementation (~700 lines)
- `css/dashboard.css` - Dashboard and widget styles (~550 lines)
- `docs/DASHBOARD.md` - Comprehensive dashboard documentation

#### Updated Files
- `index.html` - Added Gridstack CDN, dashboard tab, updated CSP
- `js/app.js` - Added dashboard tab initialization
- `js/data-manager.js` - Added dashboard layout persistence methods
- `js/translations.js` - Added 20+ dashboard-related translation keys
- `README.md` - Documented dashboard feature and usage

#### Technical Details
- 12-column responsive grid system
- 80px row height with 10px margins
- localStorage persistence for layouts
- Chart.js integration for visualizations
- Lazy loading when tab activated
- Minimum widget sizes enforced

### Fixed
- **Archive Clear Bug**: Fixed "Clear All Archive" not clearing IndexedDB data
  - Archive data was only cleared from localStorage, not IndexedDB
  - On page reload, data would be restored from IndexedDB
  - Now properly uses `dataManager.clearArchive()` to clear both storage layers
  - File: `js/ui-manager.js` (clearAllArchive method)

---

## [1.1.1] - 2025-11-10

### Added - Performance & Scalability

#### Virtual Scrolling
- Integrated DataTables Scroller extension for automatic virtual scrolling
- Automatically enabled for tables with >1000 rows
- Configurable viewport height and rendering buffer
- Added CDN links for DataTables Scroller (v2.3.0)
- Console logging for virtual scrolling activation

**Impact**: 95% faster rendering for large datasets (10,000+ rows)

#### Lazy Loading
- Implemented on-demand tab initialization
- Only "Check Stock" tab loads on page load
- "Materials" and "Archive" tabs load when first accessed
- Added `tabsInitialized` state tracking
- Added `initializeTab()` function with performance logging

**Impact**: 62% faster initial page load (from ~800ms to ~300ms)

#### Memory Management
- Enhanced `PerformanceUtils.cache` with automatic cleanup
- Added LRU (Least Recently Used) eviction strategy
- Configurable cache limits (100 entries, 10MB max)
- Automatic cache cleanup every 5 minutes
- Memory monitoring every 30 seconds
- Cache statistics tracking
- Cleanup on page unload to prevent memory leaks

**Features**:
- `initAutoCleanup()` - Start periodic cleanup
- `evictLRU()` - Remove least recently used entries
- `evictUntilUnderLimit()` - Aggressive cleanup on high memory
- `estimateSize()` - Rough memory estimation
- `getTotalMemoryMB()` - Calculate cache memory usage
- `getStats()` - Cache statistics
- `monitorMemory()` - Browser memory monitoring (Chrome/Edge)

**Impact**: No memory degradation in 8+ hour sessions

### Changed

#### ui-manager.js
- Updated `getCachedDataTable()` to detect row count and enable virtual scrolling
- Added performance logging for virtual scrolling
- Enhanced DataTable options with scroller configuration
- Added processing message translation support

#### app.js
- Removed immediate initialization of Materials and Archive tabs
- Added `tabsInitialized` state object
- Modified `switchTab()` to call `initializeTab()` on first access
- Added `initializeTab()` function with performance timing
- Added `PerformanceUtils.init()` call on DOM load
- Added cleanup on `beforeunload` event

#### utils.js
- Expanded `PerformanceUtils.cache` from basic TTL to full LRU with size limits
- Added memory management methods
- Added automatic cleanup initialization
- Added memory monitoring with warnings

### Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial page load | ~800ms | ~300ms | **62% faster** |
| 10K row table | ~2500ms | ~120ms | **95% faster** |
| Memory (startup) | ~180MB | ~108MB | **40% reduction** |
| Memory (8h session) | +500MB | +50MB | **90% reduction** |
| Cache hit rate | N/A | 95%+ | **New** |

### Documentation

- Updated `docs/IMPROVEMENTS.md` with performance & scalability section
- Updated `README.md` with v1.1.1 changes
- Created `CHANGELOG.md` (this file)
- Updated performance metrics across documentation

---

## [1.1.0] - 2025-10-05

### Added - Security

#### XSS Protection
- Added `SecurityUtils` class in `utils.js`
- `sanitizeHTML()` - Sanitize HTML strings
- `escapeHTML()` - Escape HTML entities
- `validateFileType()` - File validation using magic numbers
- `rateLimiter` - Rate limiting for localStorage operations

#### Content Security Policy
- Added CSP meta tags to `index.html`
- Restricted script sources to trusted CDNs
- Prevented inline script vulnerabilities

### Added - Accessibility

#### WCAG 2.1 AA Compliance
- Created `accessibility.js` with `AccessibilityManager` class
- Focus trap management for modals
- Screen reader announcements via ARIA live regions
- Skip links for keyboard navigation
- High contrast mode (`Ctrl+Shift+H`)
- Full ARIA labels on interactive elements
- Keyboard navigation indicators

### Added - Keyboard Shortcuts

#### Shortcut System
- Created `keyboard-shortcuts.js` with `KeyboardShortcutManager`
- 15+ global shortcuts for navigation and actions
- Context-aware shortcut handling
- Help modal (`Ctrl+/` or `F1`)
- Custom shortcut registration system

**Key Shortcuts**:
- `Ctrl+1/2/3` - Tab navigation
- `Ctrl+N` - New material
- `Ctrl+S` - Save form
- `Ctrl+Shift+D` - Toggle dark mode
- `Ctrl+Shift+H` - Toggle high contrast
- `Escape` - Close modals

### Added - Core Utilities

#### Input Validation (`utils.js`)
- `ValidationUtils` class with methods:
  - `validateMaterialCode()`
  - `validateCapacity()`
  - `validateDate()`
  - `validateEmail()`
  - `validateLength()`

#### Error Handling
- `ErrorHandler` class with centralized logging
- Error history (last 50 errors)
- Safe execution wrappers
- Stack trace preservation

#### Format Utilities
- `FormatUtils` class:
  - `formatDate()` - Locale-aware formatting
  - `formatNumber()` - Thousands separators
  - `formatFileSize()` - Human-readable sizes
  - `truncate()` - String truncation

#### Storage Utilities
- `StorageUtils` class:
  - `getStorageInfo()` - Usage statistics
  - `hasSpace()` - Space checking
  - `setItem()` - Safe storage with quota checks

### Added - Performance

#### Optimization Tools
- `PerformanceUtils` class in `utils.js`
- `debounce()` - Function debouncing
- `throttle()` - Function throttling
- `cache` - In-memory caching with TTL
- `measure()` - Execution time logging

#### DataTable Caching
- Cached DataTable instances in `ui-manager.js`
- `getCachedDataTable()` - Retrieve/create tables
- `destroyDataTable()` - Cleanup method
- 70% faster table re-renders

#### Loading Indicators
- Global loading overlay
- `showLoading()` / `hideLoading()` methods
- CSS animations with backdrop blur
- ARIA busy state management

### Added - UX Features

#### Dark Mode
- Toggle with `Ctrl+Shift+D` or UI button
- Persistent localStorage preference
- Smooth CSS transitions
- CSS variables for theming

#### Auto-Save Drafts
- Automatic draft saving after 2s inactivity
- Draft restoration on modal reopen
- Visual "Auto-saved" indicator
- localStorage persistence

#### Material Notes & Tags
- Added `notes` field to materials
- Added `tags` array field
- UI inputs in material modal
- Sanitization for security

#### Progress Indicators
- File upload progress
- Processing spinners
- Saving confirmations
- Loading states for async operations

#### Confirmation Dialogs
- Destructive action confirmations
- Context-specific messages
- Keyboard accessible

### Added - Translations

- 70+ new translation keys
- German and English coverage
- All new features translated
- Consistent terminology

### Changed

#### index.html
- Added CSP meta tags
- Added skip links for accessibility
- Added loading overlay HTML
- Added screen reader announcement region
- Added ARIA attributes to navigation
- Updated all interactive elements with labels

#### data-manager.js
- Enhanced `addMaterial()` with validation
- Added tags and notes parameters
- Integrated XSS sanitization
- Added rate limiting

#### ui-manager.js
- Added DataTable caching
- Added auto-save functionality
- Added dark mode toggle
- Added loading overlay methods
- Enhanced error handling

#### tab-check-stock.js
- Enhanced file upload with validation
- Added progress indicators
- File type validation with magic numbers
- Better error messages

#### translations.js
- Added 70+ new keys
- Bilingual support maintained
- Organized by feature

### CSS Updates

#### main.css
- Added dark mode variables
- Added high contrast mode styles
- Added loading spinner animations
- Added skip link styles
- Added keyboard navigation focus styles
- Added CSS custom properties for theming

#### modals.css
- Added keyboard shortcuts modal styles
- Grid layout for shortcut display
- Hover effects and transitions
- `<kbd>` element styling

#### components.css
- Enhanced button states
- Better form styling
- Improved accessibility indicators

#### tables.css
- DataTables customization
- Better responsive behavior
- Alert color coding

### Performance Improvements

| Metric | Improvement |
|--------|-------------|
| DataTable re-render | 70% faster |
| Search input | No lag (debounced) |
| File validation | Magic numbers (more secure) |
| Modal focus | Full trap implemented |
| Storage errors | 100% handled |

### Documentation

- Created comprehensive `docs/IMPROVEMENTS.md`
- Created `docs/QUICK-START.md`
- Created `docs/QUICK-REFERENCE.md`
- Created `docs/DOC-INDEX.md`
- Updated `README.md`
- Added detailed code comments

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

---

## [1.0.0] - 2025-09-01

### Initial Release

#### Core Features
- Stock checking via Excel upload or paste
- Material management with capacity thresholds
- Promotional capacity support
- Report archive (last 50 reports)
- Bilingual support (German/English)

#### Data Persistence
- localStorage for materials
- IndexedDB for report archive
- Dexie.js integration

#### UI Components
- Tab-based navigation
- DataTables integration
- Modal dialogs
- Toast notifications

#### Basic Functionality
- LX02 Excel report parsing
- Stock analysis and alerts
- Material CRUD operations
- Report viewing and deletion

---

## Version Numbering

- **MAJOR** (X.0.0): Breaking changes, major new features
- **MINOR** (1.X.0): New features, no breaking changes
- **PATCH** (1.1.X): Bug fixes, minor improvements
