# Interactive Dashboard

## Overview

The Interactive Dashboard feature provides a fully customizable, drag-and-drop interface for monitoring your warehouse data. Built with **Gridstack.js**, it allows users to create personalized views with widgets tailored to their needs.

## Features

### 🎯 Core Capabilities

- **Drag & Drop**: Rearrange widgets by dragging their headers
- **Resizable**: Adjust widget dimensions using corner/edge handles
- **Persistent Layout**: Automatically saves your custom layout
- **Multiple Widgets**: Choose from 8 different widget types
- **Responsive**: Adapts to different screen sizes
- **Real-time Data**: Widgets update with latest archive data

### 🧩 Available Widgets

1. **Total Alerts Widget**
   - Displays current alert count
   - Color-coded status (green/yellow/red)
   - Shows "Attention Required" badge when alerts exist

2. **Total Materials Widget**
   - Shows total number of materials
   - Simple stat card with count

3. **Capacity Overview Widget**
   - Visual ring chart showing capacity utilization
   - Displays percentage and absolute values
   - Color-coded by status (under/near/over capacity)

4. **Recent Alerts Widget**
   - Lists the 5 most recent alerts
   - Shows material, reason, and severity
   - Icon-based alert type indicators

5. **Storage Distribution Widget**
   - Bar chart showing stock by storage type
   - Percentage and absolute values
   - Visual representation of distribution

6. **Capacity Trends Widget**
   - Line chart of capacity utilization over time
   - Based on last 10 archived reports
   - Trend visualization

7. **Top Materials by Alerts Widget**
   - Ranked list of materials with most alerts
   - Shows top 5 materials
   - Alert count for each

8. **Analytics Summary Widget**
   - Grid of key metrics
   - Total reports, alerts, and averages
   - Quick overview statistics

## Usage Guide

### Getting Started

1. Navigate to the **Dashboard** tab
2. If empty, you'll see the default layout with 5 widgets
3. Or click "Add Widget" to start building your own

### Adding Widgets

1. Click the **"Add Widget"** button at the top
2. A widget selection menu appears
3. Click on any widget card to add it
4. The widget appears on the dashboard
5. Menu automatically closes after selection

### Arranging Widgets

**Moving:**
- Click and drag the widget header
- Drop in desired position
- Grid automatically adjusts

**Resizing:**
- Hover near widget corners/edges
- Resize handles appear
- Click and drag to resize
- Minimum sizes enforced per widget

### Managing Widgets

**Refresh Widget:**
- Click the refresh icon in widget header
- Reloads widget data

**Remove Widget:**
- Click the X icon in widget header
- Widget is immediately removed
- No confirmation required

**Save Layout:**
- Click "Save Layout" to manually save
- Or wait - auto-saves after changes (2 second delay)

**Reset Layout:**
- Click "Reset Layout"
- Confirmation dialog appears
- Restores default widget arrangement
- Removes all custom widgets

## Technical Details

### Architecture

**Grid System:**
- 12-column grid layout
- 80px row height
- 10px margins between widgets
- Responsive breakpoints

**Storage:**
- Layouts saved in `localStorage`
- Key: `warehouse_dashboard_layout`
- Includes widget positions and types
- Timestamp tracked

**Data Flow:**
1. Widgets fetch data from `DataManager`
2. Latest archive report used for current data
3. Historical data from full archive
4. Charts rendered with Chart.js
5. Auto-refresh not implemented (manual refresh only)

### Widget Configuration

Each widget has:
- `minW`, `minH`: Minimum dimensions
- `defaultW`, `defaultH`: Default dimensions
- `title`: Display name
- `icon`: Font Awesome icon class
- Render function in `tab-dashboard.js`

### Performance

- Widgets render on-demand
- Charts use Chart.js (lightweight)
- No auto-refresh (user-triggered only)
- Lazy loading when tab activated
- Efficient DOM manipulation with Gridstack

## Customization

### Adding New Widget Types

1. **Define widget in `WIDGET_TYPES`:**
   ```javascript
   const WIDGET_TYPES = {
       // ...existing types
       MY_NEW_WIDGET: 'my-new-widget'
   };
   ```

2. **Add configuration to `WIDGET_CONFIG`:**
   ```javascript
   [WIDGET_TYPES.MY_NEW_WIDGET]: {
       title: 'My New Widget',
       icon: 'fa-icon-class',
       minW: 3,
       minH: 2,
       defaultW: 4,
       defaultH: 3
   }
   ```

3. **Add render method:**
   ```javascript
   UIManager.prototype.renderMyNewWidget = function(data) {
       // Return HTML string
       return `<div>Widget content</div>`;
   };
   ```

4. **Add to render switch:**
   ```javascript
   case WIDGET_TYPES.MY_NEW_WIDGET:
       content = this.renderMyNewWidget(latestReport);
       break;
   ```

5. **Add translations** in `translations.js`:
   ```javascript
   'my-new-widgetTitle': 'My New Widget'
   ```

### Styling Widgets

Styles in `css/dashboard.css`:

- `.dashboard-widget`: Base widget container
- `.widget-header`: Header with title and controls
- `.widget-content`: Main content area
- `.widget-[type]-specific`: Type-specific styles

### Modifying Grid Settings

In `tab-dashboard.js`, `initializeDashboard()`:

```javascript
dashboardGrid = GridStack.init({
    column: 12,          // Number of columns
    cellHeight: '80px',  // Row height
    margin: '10px',      // Widget margins
    animate: true,       // Animate movements
    float: true          // Allow floating
});
```

## Accessibility

### Keyboard Support

- **Tab**: Navigate between widgets
- **Enter**: Activate focused button
- **Escape**: Close widget menu
- **Arrow keys**: Move focus within widget

### Screen Readers

- All widgets have proper ARIA labels
- Header controls are keyboard accessible
- Status changes announced
- Focus management for modals

### High Contrast Mode

- Widget borders increased
- Icon contrast enhanced
- Color-blind friendly indicators

## Troubleshooting

### Widgets Not Loading

**Symptoms:** Empty dashboard or missing widgets

**Solutions:**
1. Check browser console for errors
2. Verify Gridstack.js loaded (check DevTools Network tab)
3. Clear localStorage: `localStorage.removeItem('warehouse_dashboard_layout')`
4. Refresh page (Ctrl+F5)

### Layout Not Saving

**Symptoms:** Dashboard resets on page reload

**Solutions:**
1. Check localStorage quota: `StorageUtils.getStorageInfo()`
2. Enable localStorage in browser settings
3. Check for storage errors in console
4. Try incognito mode to test

### Widgets Display "No Data"

**Symptoms:** All widgets show empty state

**Solutions:**
1. Upload a report in "Check Stock" tab
2. Verify archive has data: Switch to "Report Archive" tab
3. Check console for data loading errors
4. Manually refresh widgets using refresh icon

### Performance Issues

**Symptoms:** Slow dashboard interaction

**Solutions:**
1. Reduce number of widgets (recommended: <10)
2. Close other browser tabs
3. Clear old archive reports
4. Disable browser extensions
5. Use modern browser version

### Widget Rendering Issues

**Symptoms:** Charts not displaying, broken layout

**Solutions:**
1. Check Chart.js loaded (verify in DevTools)
2. Resize browser window to trigger re-render
3. Remove and re-add problematic widget
4. Reset dashboard layout

## Best Practices

### Recommended Layouts

**Executive Dashboard:**
- Alerts Count (top-left)
- Capacity Overview (top-right)
- Recent Alerts (middle-left)
- Storage Distribution (middle-right)
- Capacity Trends (bottom, full-width)

**Analyst Dashboard:**
- Analytics Summary (top)
- Top Materials (left)
- Capacity Trends (middle)
- Storage Distribution (right)

**Operations Dashboard:**
- Alerts Count (small, top-left)
- Materials Count (small, top-center)
- Recent Alerts (large, left)
- Capacity Overview (medium, right)

### Widget Organization Tips

1. **Most Important Top-Left**: Eye naturally scans top-left first
2. **Related Widgets Together**: Group by function
3. **Consistent Sizes**: Align widgets for clean look
4. **Leave Space**: Don't overcrowd - allows quick scanning
5. **Use Color Coding**: Rely on widget status colors

### Performance Tips

1. Limit total widgets to 8-10 for best performance
2. Use smaller widgets when possible
3. Manually refresh widgets only when needed
4. Clear old archive reports periodically
5. Close dashboard tab when not in use (lazy loaded)

## Future Enhancements

Potential improvements for future versions:

- [ ] Auto-refresh widgets at configurable intervals
- [ ] Export dashboard as image/PDF
- [ ] Share dashboard layouts with team
- [ ] More widget types (forecasting, heatmaps)
- [ ] Dark mode specific chart colors
- [ ] Widget settings/configuration UI
- [ ] Multiple dashboard presets
- [ ] Fullscreen mode
- [ ] Widget animations and transitions
- [ ] Real-time alerts in widgets

## API Reference

### Key Functions

**Initialize Dashboard:**
```javascript
ui.initializeDashboard()
```

**Add Widget:**
```javascript
ui.addWidget(widgetType)
// widgetType: One of WIDGET_TYPES values
```

**Remove Widget:**
```javascript
ui.removeWidget(widgetId)
// widgetId: Unique widget identifier
```

**Refresh Widget:**
```javascript
ui.refreshWidget(widgetId)
```

**Save Layout:**
```javascript
ui.saveDashboardLayout()
```

**Load Layout:**
```javascript
ui.loadDashboardLayout()
```

**Reset Layout:**
```javascript
ui.resetDashboardLayout()
```

### Data Methods

**Get Dashboard Layout:**
```javascript
dataManager.getDashboardLayout()
// Returns: Array of widget objects or null
```

**Save Dashboard Layout:**
```javascript
dataManager.saveDashboardLayout(widgets)
// widgets: Array of widget objects
```

**Clear Dashboard Layout:**
```javascript
dataManager.clearDashboardLayout()
```

## See Also

- [README.md](../README.md) - Main project documentation
- [QUICK-START.md](QUICK-START.md) - Getting started guide
- [tab-dashboard.js](../js/tab-dashboard.js) - Dashboard implementation
- [dashboard.css](../css/dashboard.css) - Dashboard styles
- [Gridstack Documentation](https://gridstackjs.com/) - Grid system docs

---

**Note:** The dashboard requires at least one archived report to display meaningful data. Upload a report in the "Check Stock" tab first.
