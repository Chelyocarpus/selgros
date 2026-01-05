# Bestandsveränderung - Update Summary

## Security Fix (2026-01-05)

### XSS Vulnerability Fixes 🔒
**Security Improvements:**
- **Fixed XSS vulnerabilities in table rendering** - All user-provided data from Excel/CSV files is now properly sanitized
- **Sanitized article data** - Article names and descriptions are escaped before display
- **Sanitized movement types** - Movement type names are escaped to prevent script injection
- **Sanitized user data** - Username fields are escaped before rendering
- **Added security documentation** - Comprehensive security guidelines added to project

**Technical Details:**
- Applied `Utils.sanitizeHTML()` to all user-controlled fields in `business-ui-renderer.js`
- Fixed 4 critical XSS attack vectors in data tables
- All Excel/CSV imported data now passes through sanitization layer
- Follows OWASP XSS prevention best practices

**Impact:**
- Prevents malicious script execution from crafted Excel files
- Protects against stored XSS attacks
- Improves overall application security posture
- No functionality changes - purely security hardening

## Latest Changes (November 14, 2025)

### Sidebar Search Integration ✅
**Major Improvements:**
- **Artikel-Suche moved to sidebar** - Now integrated directly in the navigation sidebar
- **Persistent access** - Search available at all times without taking up main content space
- **Smart collapse behavior** - When sidebar minimizes, shows only icon (not completely hidden)
- **Icon-only mode** - Collapsed sidebar shows icons with tooltips for quick navigation
- **Better UX** - Article details display in main content area below tabs

**New Sidebar Features:**
- Compact search input in sidebar (collapses to icon-only when minimized)
- Clean section divider ("Bereiche") separating search from navigation
- Smooth animations for collapse/expand
- Width transitions: 260px (expanded) → 70px (collapsed)
- Main content adjusts accordingly (no overlap)

**Benefits:**
- More screen space for analysis data
- Quick article lookup always accessible
- Cleaner, more professional layout
- Better mobile experience
- Reduced visual clutter

### Enhanced Sidebar Behavior ✅
- **Icon-only collapsed state** instead of completely hiding
- Tooltips appear on hover when collapsed
- Centered icons in collapsed mode
- Active section highlighting in both states
- Smooth width transitions

## Previous Changes

### 1. Sidebar Navigation ✅
- **Location**: Left side of the screen
- **Features**:
  - Fixed position sidebar with smooth animations
  - 9 navigation links with SVG icons:
    - Datei Upload (upload icon)
    - Übersicht (grid icon)
    - Finanzen (dollar icon)
    - Abschreibungen (trending down icon)
    - Zugänge (trending up icon)
    - Artikel (package icon)
    - Bewegungen (repeat icon)
    - Benutzer (users icon)
    - Zeitverlauf (calendar icon)
  - Auto-highlighting based on scroll position
  - Smooth scrolling to sections
  - Collapsible on desktop (toggle button)
  - Mobile-responsive (slides in from left)

### 2. Icon Replacement ✅
All emojis replaced with professional SVG icons:

**Before → After**
- 📁 → File SVG icon (upload area)
- 💼 → Briefcase SVG icon (business analysis tab)
- 📊 → Bar chart SVG icon (data preview tab)
- 🔍 → Search SVG icon (article search tab)
- ⚠️ → Alert triangle SVG icon (error messages)
- 📦 → Package SVG icon (articles)
- 💰 → Dollar SVG icon (financial)
- 📈 → Trending up SVG icon (gains)
- 📉 → Trending down SVG icon (writeoffs)
- 👥 → Users SVG icon (user activity)
- 📅 → Calendar SVG icon (timeline)
- 🔄 → Repeat SVG icon (movements)

### 3. Top 10 Abschreibungen Fix ✅
**Problem**: Articles with offsetting transactions showed large values
**Solution**: Calculate net write-offs per article
- First aggregates ALL movements (positive + negative) per article
- Calculates net impact
- Only shows articles with net negative impact (> 0.01€)
- Sorts by net write-off amount

**Example**:
```
Before:
Article X had -708,36€ shown as large write-off
(even though +647,06€ + 54,48€ nearly offset it)

After:
Article X shows -6,82€ (actual net loss)
```

### 4. Layout Improvements ✅
- Main content area expanded (max-width 1400px vs 1200px)
- Sidebar: 260px width with dark gradient background
- Main wrapper automatically adjusts margin for sidebar
- Smooth scroll behavior enabled globally
- Section scroll-margin-top for better navigation alignment

### 5. Mobile Responsiveness ✅
- Sidebar collapses off-screen on mobile
- Mobile menu toggle button (top-left)
- Sidebar opens with smooth animation
- Auto-closes after navigation on mobile
- Closes when clicking outside sidebar

## File Changes

### New Files
1. `css/sidebar.css` - Sidebar navigation styles
2. `js/sidebar.js` - Sidebar navigation logic

### Modified Files
1. `index.html` - Added sidebar structure, replaced emoji icons with SVG
2. `css/main.css` - Updated container width, smooth scroll, icon support
3. `js/business-ui-renderer.js` - Added icon helper, replaced all emojis
4. `js/business-analyzer.js` - Fixed Top 10 calculation logic
5. `js/data-analyzer.js` - Replaced emoji in article details
6. `README.md` - Added changelog section

## How to Use

### Desktop
1. Sidebar is visible by default on the left
2. Click toggle button (☰) in sidebar header to collapse/expand
3. Click any navigation item to jump to that section
4. Active section auto-highlights as you scroll

### Mobile
1. Tap hamburger menu (☰) in top-left corner
2. Sidebar slides in from left
3. Tap any section to navigate
4. Sidebar auto-closes after selection

## Testing Checklist
- [ ] Sidebar navigation works on desktop
- [ ] Sidebar collapses/expands correctly
- [ ] Mobile menu toggle appears on small screens
- [ ] Smooth scrolling to sections works
- [ ] Active section highlights in nav
- [ ] All SVG icons display correctly
- [ ] Upload icon visible and centered
- [ ] Tab buttons show icons properly
- [ ] Section headers show icons
- [ ] Top 10 Abschreibungen shows correct net values
- [ ] No JavaScript errors in console
- [ ] Responsive layout works on various screen sizes
