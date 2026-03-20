/**
 * Ampel-Highlighter – Source Script
 * F&R Bestellvorschlag · Zeilen nach Reichweite Bestand (RW Bestand) einfärben
 *
 * Klick auf aktives Bookmarklet entfernt alle Markierungen (Toggle).
 * Verwendet MutationObserver, um auch bei virtuellem Scroll neu gerenderte
 * Zeilen automatisch einzufärben.
 */

(function () {
  'use strict';

  const PANEL_ID = '__bk_ampel_panel';
  const ATTR_ORIG = 'data-ampel-orig'; // stores original row background
  const OBS_KEY  = '__bk_ampel_obs';

  // ── Toggle off ─────────────────────────────────────────────────────────────

  if (document.getElementById(PANEL_ID)) {
    document.querySelectorAll(`[${ATTR_ORIG}]`).forEach(el => {
      el.style.background = el.getAttribute(ATTR_ORIG);
      el.style.borderLeft = '';
      el.removeAttribute(ATTR_ORIG);
    });
    document.getElementById(PANEL_ID).remove();
    if (window[OBS_KEY]) { window[OBS_KEY].disconnect(); delete window[OBS_KEY]; }
    return;
  }

  // ── Thresholds (RW Bestand in Tagen) ──────────────────────────────────────
  //   max:    days threshold (inclusive)
  //   bg:     row background tint
  //   border: left-border accent color
  //   label:  legend label
  //   suffix: secondary label text

  const LEVELS = [
    { max:  7,  bg: 'rgba(211,47,47,0.18)',  border: '#c62828', label: '≤ 7 Tage',   suffix: 'Kritisch' },
    { max: 14,  bg: 'rgba(230,119,0,0.18)',  border: '#e65100', label: '8–14 Tage',  suffix: 'Warnung'  },
    { max: 21,  bg: 'rgba(249,168,37,0.15)', border: '#f9a825', label: '15–21 Tage', suffix: 'Beachten' },
    { max: 1e9, bg: 'rgba(56,142,60,0.10)',  border: '#388e3c', label: '> 21 Tage',  suffix: 'OK'       },
  ];

  /** Returns the matching threshold level for a given day count. */
  function getLevel(days) {
    return LEVELS.find(l => days <= l.max);
  }

  // ── Grid & Column detection ────────────────────────────────────────────────

  /**
   * Finds the grid element that contains the "RW Bestand" column.
   * The F&R page renders multiple grids (calendar, info header, article table,
   * time series), so we must locate the correct one by its column headers.
   * Returns null if not found (wrong page or table not yet rendered).
   */
  function getMainGrid() {
    for (const grid of document.querySelectorAll('[role="grid"]')) {
      for (const h of grid.querySelectorAll('[role="columnheader"]')) {
        const label = (h.getAttribute('aria-label') || h.textContent || '').toLowerCase();
        if (label.includes('rw bestand') || label.includes('reichweite')) return grid;
      }
    }
    return null;
  }

  /**
   * Finds the 0-based column index of "RW Bestand" within the given grid.
   * Must be scoped to the correct grid – querying all column headers globally
   * returns headers from other grids on the page, yielding a wrong index.
   * Returns -1 if not found.
   */
  function getColIndex(grid) {
    const headers = grid.querySelectorAll('[role="columnheader"]');
    for (let i = 0; i < headers.length; i++) {
      const label = (headers[i].getAttribute('aria-label') || headers[i].textContent || '').toLowerCase();
      if (label.includes('reichweite') || label.includes('rw bestand')) return i;
    }
    return -1;
  }

  // ── Row highlighting ───────────────────────────────────────────────────────

  /**
   * Reads the RW Bestand value from the given data row, determines the
   * matching threshold, and applies the background and border styling.
   *
   * @param {Element} row    - ARIA grid row element
   * @param {number}  colIdx - 0-based column index of RW Bestand
   */
  function applyToRow(row, colIdx) {
    const cells = row.querySelectorAll('[role="gridcell"]');
    if (cells.length <= colIdx) return;

    // Cell text may contain "Hervorgehoben" suffix from SAP accessibility markup
    const rawText = cells[colIdx].textContent.trim();
    const match   = rawText.match(/^(\d+(?:[.,]\d+)?)/);
    if (!match) return;

    const days = parseFloat(match[1].replace(',', '.'));
    if (isNaN(days)) return;

    const level = getLevel(days);
    if (!level) return;

    // Persist original background so the toggle can restore it
    if (!row.hasAttribute(ATTR_ORIG)) {
      row.setAttribute(ATTR_ORIG, row.style.background || '');
    }
    row.style.background = level.bg;
    row.style.borderLeft = `4px solid ${level.border}`;
  }

  // ── Scan all visible data rows ─────────────────────────────────────────────

  let colIdx   = -1;
  let mainGrid = null;

  function scan() {
    if (!mainGrid) mainGrid = getMainGrid();
    if (!mainGrid) return; // not on BV page or table not yet rendered

    if (colIdx === -1) colIdx = getColIndex(mainGrid);
    if (colIdx === -1) return;

    // F&R renders rows as direct children of the grid — no [role="rowgroup"]
    // wrapper exists. Skip header rows by checking for gridcell descendants.
    mainGrid.querySelectorAll('[role="row"]').forEach(row => {
      if (!row.querySelector('[role="gridcell"]')) return; // header row
      applyToRow(row, colIdx);
    });
  }

  scan();

  // ── MutationObserver for virtual scroll ────────────────────────────────────
  // F&R tables use virtual scrolling — newly rendered rows are added to the
  // DOM as the user scrolls. The observer re-runs scan() on any DOM change
  // inside the correct grid so rows are immediately colored when they appear.

  const gridEl = mainGrid || document.querySelector('[role="grid"]') || document.body;
  const obs = new MutationObserver(scan);
  obs.observe(gridEl, { childList: true, subtree: true });
  window[OBS_KEY] = obs;

  // ── Floating legend panel ──────────────────────────────────────────────────

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = [
    'position:fixed;bottom:70px;right:16px;z-index:2147483646',
    'background:#fff;border-radius:8px;padding:14px 16px 12px',
    'box-shadow:0 4px 20px rgba(0,0,0,.22)',
    'font-family:72,Arial,sans-serif;font-size:12px;color:#32363a',
    'min-width:190px;border:1px solid #e0e0e0;user-select:none',
  ].join(';');

  // ── Drag-to-move ──────────────────────────────────────────────────────────
  // Track pointer offset from the panel's top-left corner on pointerdown,
  // then reposition on pointermove. Uses left/top (converted from bottom/right)
  // so the panel stays wherever the user drops it.

  let dragging = false, dragOffX = 0, dragOffY = 0;

  function startDrag(e) {
    if (e.button !== 0) return;
    dragging  = true;
    const r   = panel.getBoundingClientRect();
    dragOffX  = e.clientX - r.left;
    dragOffY  = e.clientY - r.top;
    // Switch from bottom/right anchoring to top/left so movement math is simple
    panel.style.bottom = '';
    panel.style.right  = '';
    panel.style.left   = r.left + 'px';
    panel.style.top    = r.top  + 'px';
    e.preventDefault();
  }

  function onDrag(e) {
    if (!dragging) return;
    panel.style.left = (e.clientX - dragOffX) + 'px';
    panel.style.top  = (e.clientY - dragOffY) + 'px';
  }

  function stopDrag() { dragging = false; }

  document.addEventListener('pointermove', onDrag);
  document.addEventListener('pointerup',   stopDrag);

  // Title row
  const titleRow = document.createElement('div');
  titleRow.style.cssText = [
    'font-weight:bold;font-size:13px;margin-bottom:10px',
    'display:flex;align-items:center;justify-content:space-between',
    'cursor:grab',
  ].join(';');
  titleRow.addEventListener('pointerdown', startDrag);

  const titleText = document.createElement('span');
  titleText.textContent = 'Ampel – RW Bestand';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Legende ausblenden');
  closeBtn.style.cssText = [
    'background:none;border:none;font-size:17px;line-height:1',
    'cursor:pointer;color:#6a6d70;padding:0;flex-shrink:0',
  ].join(';');

  // Close hides the panel only — highlighting and the observer stay active.
  // Clicking the bookmarklet again will toggle everything off.
  closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    panel.remove();
  });

  titleRow.appendChild(titleText);
  titleRow.appendChild(closeBtn);
  panel.appendChild(titleRow);

  // Legend rows
  LEVELS.forEach(level => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:9px;margin-bottom:7px';

    const dot = document.createElement('div');
    dot.style.cssText = [
      `background:${level.bg}`,
      `border:2px solid ${level.border}`,
      'width:16px;height:16px;border-radius:3px;flex-shrink:0',
    ].join(';');

    const lbl = document.createElement('div');
    lbl.style.cssText = 'line-height:1.3';

    const strong = document.createElement('strong');
    strong.textContent = level.label;

    const muted = document.createElement('span');
    muted.style.color = '#6a6d70';
    muted.textContent = ' ' + level.suffix;

    lbl.appendChild(strong);
    lbl.appendChild(muted);
    row.appendChild(dot);
    row.appendChild(lbl);
    panel.appendChild(row);
  });

  document.body.appendChild(panel);
}());
