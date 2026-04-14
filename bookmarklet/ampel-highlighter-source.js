/**
 * Ampel-Highlighter – Source Script
 * F&R Bestellvorschlag · Zeilen nach berechneter Reichweite (Bestand ÷ Prognose) einfärben
 *
 * Geplante Wareneingänge (Zeitreihen-Sektion):
 *   Das Skript liest die "Geplante Wareneingänge"-Zeile aus dem unteren
 *   Zeitreihen-Panel aus und ermittelt für den dort angezeigten Artikel:
 *     – Hintergrundfarbe: angepasste Reichweite (MIT gepl. WE)
 *     – Linker Rahmen:    ursprüngliche Reichweite (OHNE gepl. WE)
 *     – Blaues Badge:     geplante Zulaufmenge + angepasste Tage
 *   Für alle anderen Zeilen bleibt die Standard-Ampelfarbe erhalten.
 *
 * Klick auf aktives Bookmarklet entfernt alle Markierungen (Toggle).
 * Verwendet MutationObserver (mit 100 ms Debounce), um auch bei virtuellem
 * Scroll und Artikel-Wechsel im Zeitreihen-Panel neu gerenderte Zeilen
 * automatisch einzufärben.
 *
 * Reichweite = Bestand ÷ (Ø Prog/KW ÷ 7) in Tagen
 */

(function () {
  'use strict';

  const PANEL_ID  = '__bk_ampel_panel';
  const ATTR_ORIG  = 'data-ampel-orig';  // stores original row background for toggle restore
  const BADGE_ATTR = 'data-ampel-badge'; // marks injected planned-WE badges
  const OBS_KEY    = '__bk_ampel_obs';

  // ── Toggle off ─────────────────────────────────────────────────────────────

  if (document.getElementById(PANEL_ID)) {
    document.querySelectorAll(`[${ATTR_ORIG}]`).forEach(el => {
      el.style.background = el.getAttribute(ATTR_ORIG);
      el.style.borderLeft = '';
      el.removeAttribute(ATTR_ORIG);
    });
    document.querySelectorAll(`[${BADGE_ATTR}]`).forEach(el => el.remove());
    document.getElementById(PANEL_ID).remove();
    if (window[OBS_KEY]) { window[OBS_KEY].disconnect(); delete window[OBS_KEY]; }
    return;
  }

  // ── Thresholds (Bestand ÷ Prognose in Tagen) ───────────────────────────────
  //   max:    days threshold (inclusive)
  //   bg:     row background tint
  //   border: left-border accent color
  //   label:  legend label
  //   suffix: secondary label text
  //
  // Note: when Geplante Wareneingänge are present, the row background uses the
  // adjusted (effective) level while the border retains the original level,
  // allowing both situations to be distinguished at a glance.

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
   * Finds the grid element that contains both "Bestand" and "Ø Prog/KW" columns.
   * The F&R page renders multiple grids (calendar, info header, article table,
   * time series), so we must locate the correct one by its column headers.
   * Returns null if not found (wrong page or table not yet rendered).
   */
  function getMainGrid() {
    for (const grid of document.querySelectorAll('[role="grid"]')) {
      const labels = Array.from(grid.querySelectorAll('[role="columnheader"]'))
        .map(h => (h.getAttribute('aria-label') || h.textContent || '').toLowerCase().trim());
      const hasBestand = labels.some(l => l.startsWith('bestand') && !l.includes('rw'));
      const hasProgKW  = labels.some(l => l.includes('prog') && l.includes('kw'));
      if (hasBestand && hasProgKW) return grid;
    }
    return null;
  }

  /**
   * Finds the 0-based column indices for "Bestand in Basis-ME", "Ø Prog/KW",
   * and "Artikel-Nr" within the given grid. Must be scoped to the correct grid
   * to avoid picking up headers from other grids on the page.
   * Returns an object with -1 for any column not found.
   */
  function getColIndices(grid) {
    const headers = grid.querySelectorAll('[role="columnheader"]');
    const indices = { bestand: -1, progKW: -1, artikelNr: -1 };
    for (let i = 0; i < headers.length; i++) {
      const label = (headers[i].getAttribute('aria-label') || headers[i].textContent || '').toLowerCase().trim();
      if (label.startsWith('bestand') && !label.includes('rw')) {
        indices.bestand = i;
      } else if (label.includes('prog') && label.includes('kw')) {
        indices.progKW = i;
      } else if (label.includes('artikel') && label.includes('nr')) {
        indices.artikelNr = i;
      }
    }
    return indices;
  }

  // ── Time series / Geplante Wareneingänge helpers ─────────────────────────

  /**
   * Returns the current ISO 8601 week number (1–53) for today.
   * Uses the standard Thursday-based algorithm.
   */
  function currentKW() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const w1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - w1) / 86_400_000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  }

  /**
   * Extracts the KW number from strings like "KW 12" or "KW12" → 12.
   * Returns null when no KW pattern is found.
   */
  function parseKW(text) {
    const m = (text || '').match(/\bkw\s*(\d{1,2})\b/i);
    return m ? parseInt(m[1], 10) : null;
  }

  /**
   * Finds the article number embedded in the Zeitreihen heading.
   * F&R renders it as "Zeitreihen für Artikel XXXXXX".
   * Returns the article number as a trimmed string, or null if not found.
   */
  function getTimeSeriesArticleNr() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const m = node.textContent.match(/Zeitreihen\s+f[üu]r\s+Artikel\s+(\d+)/i);
      if (m) return m[1];
    }
    return null;
  }

  /**
   * Reads the "Geplante Wareneingänge" row from the Zeitreihen section and
   * returns planned incoming entries for upcoming calendar weeks.
   *
   * Searches both HTML <table> elements and ARIA grid elements to be
   * resilient against different SAP UI5 rendering modes.
   *
   * @returns {Array<{ kw: number, weekOffset: number, amount: number }>|null}
   */
  function getPlannedIncoming() {
    const curKW = currentKW();

    // Strategy A: HTML <table> / <tr> / <td> elements (SAP standard rendering)
    for (const table of document.querySelectorAll('table')) {
      for (const tr of table.querySelectorAll('tr')) {
        const tds = Array.from(tr.querySelectorAll('td'));
        if (!tds.some(td => td.textContent.toLowerCase().includes('geplante wareneing'))) continue;

        // Resolve column headers – prefer <thead>, fall back to first <tr> in the table
        const hdrCells = Array.from(table.querySelectorAll('thead th, thead td'));
        if (!hdrCells.length) {
          const firstTr = table.querySelector('tr');
          if (firstTr) hdrCells.push(...firstTr.querySelectorAll('th, td'));
        }

        const result = parsePlanningCells(tds, hdrCells, curKW);
        if (result) return result;
      }
    }

    // Strategy B: ARIA grid elements
    for (const grid of document.querySelectorAll('[role="grid"], [role="treegrid"]')) {
      if (grid === mainGrid) continue;
      const hdrs = Array.from(grid.querySelectorAll('[role="columnheader"]'));
      for (const row of grid.querySelectorAll('[role="row"]')) {
        const cells = Array.from(row.querySelectorAll('[role="gridcell"]'));
        if (!cells.some(c => c.textContent.toLowerCase().includes('geplante wareneing'))) continue;
        const result = parsePlanningCells(cells, hdrs, curKW);
        if (result) return result;
      }
    }

    return null;
  }

  /**
   * Extracts planned incoming amounts per KW from the cells of a
   * "Geplante Wareneingänge" row, correlating each cell with its column header.
   *
   * Only includes weeks that are upcoming (weekOffset ≥ 0, within 13 weeks).
   *
   * @param {Element[]} cells   – all cells in the data row
   * @param {Element[]} headers – corresponding column header elements
   * @param {number}    curKW   – current ISO week number
   * @returns {Array|null}
   */
  function parsePlanningCells(cells, headers, curKW) {
    const result = [];
    for (let i = 0; i < cells.length; i++) {
      // Skip the label cell
      if (cells[i].textContent.toLowerCase().includes('geplante wareneing')) continue;

      const val = parseCellNumber(cells[i]);
      if (val === null || val <= 0) continue;

      const hdr = headers[i];
      if (!hdr) continue;

      const kwNum = parseKW(
        hdr.getAttribute('aria-label') || hdr.getAttribute('title') || hdr.textContent || ''
      );
      if (kwNum === null) continue;

      // Handle year boundary: a KW that appears to be 26+ weeks in the past
      // is actually an upcoming week in the next year.
      let weekOffset = kwNum - curKW;
      if (weekOffset < -26) weekOffset += 52;
      if (weekOffset >= 0 && weekOffset <= 13) {
        result.push({ kw: kwNum, weekOffset, amount: val });
      }
    }
    return result.length > 0 ? result : null;
  }

  /**
   * Calculates the effective stock reach (days) when planned incoming deliveries
   * are factored in. Deliveries are modelled as arriving at the start of their
   * respective week offset. Uses a day-by-day simulation.
   *
   * The original Bestand is NOT simply added to the planned total – instead,
   * the simulation tracks stock day-by-day and injects each planned delivery at
   * the correct future day, giving a realistic picture of when stock may run out.
   *
   * @param {number} bestand       – current stock in units
   * @param {number} progKW        – weekly forecast (Ø Prog/KW), must be > 0
   * @param {Array}  weeklyPlanned – [{ weekOffset, amount }, ...]
   * @returns {number} effective days until stockout (capped at 365)
   */
  function calcEffectiveReichweite(bestand, progKW, weeklyPlanned) {
    if (!weeklyPlanned || !weeklyPlanned.length) return (bestand / progKW) * 7;

    const progPerDay = progKW / 7;

    // Build a lookup: start-of-week day → incoming amount
    const incoming = {};
    for (const { weekOffset, amount } of weeklyPlanned) {
      const day = weekOffset * 7;
      incoming[day] = (incoming[day] || 0) + amount;
    }

    let stock = bestand;
    for (let day = 0; day <= 365; day++) {
      if (incoming[day]) stock += incoming[day];
      if (stock <= 0) return day;
      stock -= progPerDay;
    }
    return 365;
  }

  // ── Row highlighting ───────────────────────────────────────────────────────

  /**
   * Parses a numeric value from a SAP grid cell's text content.
   * Cell text may contain "Hervorgehoben" suffix from SAP accessibility markup.
   *
   * @param {Element} cell - gridcell element
   * @returns {number|null} parsed number or null if not parseable
   */
  function parseCellNumber(cell) {
    const match = cell.textContent.trim().match(/^(\d+(?:[.,]\d+)?)/);
    if (!match) return null;
    const value = parseFloat(match[1].replace(',', '.'));
    return isNaN(value) ? null : value;
  }

  /**
   * Applies Ampel highlighting to a single data row.
   *
   * When the row's Artikel-Nr matches the article shown in the Zeitreihen
   * section AND planned incoming data is available, the row visualises both:
   *   - background = adjusted (effective) level color, based on stock days
   *                  WITH planned incoming deliveries factored in via simulation
   *   - border     = original level color, showing severity without deliveries
   *
   * For all other rows the standard Ampel coloring is applied (background and
   * border use the same base level).
   *
   * @param {Element}     row      – ARIA grid row element
   * @param {object}      cols     – { bestand, progKW, artikelNr } column indices
   * @param {string|null} activeNr – Artikel-Nr from the Zeitreihen heading
   * @param {Array|null}  planned  – planned incoming data from getPlannedIncoming()
   */
  function applyToRow(row, cols, activeNr, planned) {
    const cells = row.querySelectorAll('[role="gridcell"]');
    if (cells.length <= Math.max(cols.bestand, cols.progKW)) return;

    const bestand = parseCellNumber(cells[cols.bestand]);
    const progKW  = parseCellNumber(cells[cols.progKW]);
    if (bestand === null || progKW === null || progKW === 0) return;

    // Ø Prog/KW is per calendar week → multiply by 7 to get days
    const baseDays  = (bestand / progKW) * 7;
    const baseLevel = getLevel(baseDays);
    if (!baseLevel) return;

    // Persist original background so the toggle can restore it
    if (!row.hasAttribute(ATTR_ORIG)) {
      row.setAttribute(ATTR_ORIG, row.style.background || '');
    }

    // Check whether this row corresponds to the Zeitreihen article
    let isActive = false;
    let effectiveDays = baseDays;

    if (activeNr && cols.artikelNr >= 0 && planned && planned.length > 0) {
      const artCell = cells[cols.artikelNr];
      const rowNr = artCell ? artCell.textContent.replace(/\D/g, '') : '';
      if (rowNr === activeNr) {
        isActive = true;
        effectiveDays = calcEffectiveReichweite(bestand, progKW, planned);
      }
    }

    const effectiveLevel = getLevel(effectiveDays);

    if (isActive && effectiveLevel !== baseLevel) {
      // Adjusted (improved) background; original severe color as border so
      // both states are visible at a glance.
      row.style.background = effectiveLevel.bg;
      row.style.borderLeft = `4px solid ${baseLevel.border}`;
      addPlannedBadge(row, cells[cols.bestand], planned, Math.round(baseDays), Math.round(effectiveDays));
    } else {
      row.style.background = baseLevel.bg;
      row.style.borderLeft = `4px solid ${baseLevel.border}`;
      // Remove any stale badge from a previous Zeitreihen article selection
      const stale = row.querySelector(`[${BADGE_ATTR}]`);
      if (stale) stale.remove();
    }
  }

  /**
   * Injects a small inline badge into the Bestand cell showing the planned
   * incoming total and the effective stock days:  ↑ +<total> ≈<days>T
   *
   * A detailed tooltip lists the per-KW delivery breakdown.
   *
   * @param {Element} row          – the grid row element
   * @param {Element} bestandCell  – the Bestand gridcell to append the badge to
   * @param {Array}   planned      – planned incoming entries
   * @param {number}  originalDays – Reichweite without planned incoming
   * @param {number}  adjustedDays – effective Reichweite with planned incoming
   */
  function addPlannedBadge(row, bestandCell, planned, originalDays, adjustedDays) {
    if (!bestandCell) return;

    // Replace any existing badge from a previous scan
    const old = row.querySelector(`[${BADGE_ATTR}]`);
    if (old) old.remove();

    const totalPlanned = planned.reduce((s, p) => s + p.amount, 0);

    const badge = document.createElement('span');
    badge.setAttribute(BADGE_ATTR, '1');
    badge.style.cssText = [
      'display:inline-flex;align-items:center;gap:2px',
      'margin-left:5px;padding:1px 5px;border-radius:3px',
      'font-size:10px;font-weight:600;line-height:1.4',
      'background:rgba(21,101,192,0.15);color:#1565c0',
      'border:1px solid rgba(21,101,192,0.35)',
      'vertical-align:middle;white-space:nowrap;cursor:default',
    ].join(';');

    // textContent only – no user input in markup
    badge.textContent = `\u2191 +${Math.round(totalPlanned)} \u2248${adjustedDays}T`;

    const perKW = planned
      .map(p => `  KW ${String(p.kw).padStart(2, '0')}: +${Math.round(p.amount)}`)
      .join('\n');
    badge.title = [
      `Geplante Wareneing\u00e4nge: +${Math.round(totalPlanned)} Einheiten`,
      `Urspr\u00fcngliche Reichweite: ${originalDays} Tage`,
      `Angepasste Reichweite:    ${adjustedDays} Tage`,
      perKW,
    ].join('\n');

    bestandCell.appendChild(badge);
  }

  // ── Scan all visible data rows ─────────────────────────────────────────────

  let cols     = { bestand: -1, progKW: -1, artikelNr: -1 };
  let mainGrid = null;

  function scan() {
    if (!mainGrid) mainGrid = getMainGrid();
    if (!mainGrid) return; // not on BV page or table not yet rendered

    if (cols.bestand === -1) cols = getColIndices(mainGrid);
    if (cols.bestand === -1 || cols.progKW === -1) return;

    // Read Geplante Wareneingänge from the Zeitreihen section
    const activeNr = getTimeSeriesArticleNr();
    const planned  = activeNr ? getPlannedIncoming() : null;

    // F&R renders rows as direct children of the grid — no [role="rowgroup"]
    // wrapper exists. Skip header rows by checking for gridcell descendants.
    mainGrid.querySelectorAll('[role="row"]').forEach(row => {
      if (!row.querySelector('[role="gridcell"]')) return; // header row
      applyToRow(row, cols, activeNr, planned);
    });
  }

  scan();

  // ── MutationObserver for virtual scroll and Zeitreihen changes ─────────────
  // Observes document.body with subtree to catch both virtual-scroll row
  // injections in the main grid AND Zeitreihen panel updates that occur when
  // the user selects a different article. A 100 ms debounce prevents excessive
  // re-scans during rapid DOM changes.

  let scanTimer = null;
  function debouncedScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 100);
  }

  const obs = new MutationObserver(debouncedScan);
  obs.observe(document.body, { childList: true, subtree: true });
  window[OBS_KEY] = obs;

  // ── Floating legend panel ──────────────────────────────────────────────────

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = [
    'position:fixed;bottom:70px;right:16px;z-index:2147483646',
    'background:#fff;border-radius:8px;padding:14px 16px 12px',
    'box-shadow:0 4px 20px rgba(0,0,0,.22)',
    'font-family:72,Arial,sans-serif;font-size:12px;color:#32363a',
    'min-width:220px;border:1px solid #e0e0e0;user-select:none',
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
  titleText.textContent = 'Ampel – Bestand/Prognose';

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

  // ── Geplante Wareneingänge legend section ───────────────────────────────────────

  const sep = document.createElement('hr');
  sep.style.cssText = 'border:none;border-top:1px solid #e0e0e0;margin:8px 0 7px';
  panel.appendChild(sep);

  const tsTitle = document.createElement('div');
  tsTitle.style.cssText = 'font-weight:600;font-size:10px;color:#888;margin-bottom:6px;letter-spacing:.4px;text-transform:uppercase';
  tsTitle.textContent = 'Geplante Wareneingänge';
  panel.appendChild(tsTitle);

  // Row explaining border vs background color duality
  const colorExplainRow = document.createElement('div');
  colorExplainRow.style.cssText = 'display:flex;align-items:flex-start;gap:9px;margin-bottom:6px';

  const swatchWrap = document.createElement('div');
  swatchWrap.style.cssText = 'flex-shrink:0;width:16px;height:30px;border-radius:3px;margin-top:1px;overflow:hidden;border:1px solid #ddd';
  const swatchTop = document.createElement('div');
  swatchTop.style.cssText = 'height:50%;background:rgba(211,47,47,0.18)';
  const swatchBot = document.createElement('div');
  swatchBot.style.cssText = 'height:50%;background:rgba(56,142,60,0.10)';
  swatchWrap.appendChild(swatchTop);
  swatchWrap.appendChild(swatchBot);
  colorExplainRow.appendChild(swatchWrap);

  const colorLbl = document.createElement('div');
  colorLbl.style.cssText = 'font-size:11px;line-height:1.45;color:#32363a';

  const bdrSpan = document.createElement('span');
  bdrSpan.textContent = 'Rahmen';
  bdrSpan.style.fontWeight = '600';
  const bdrRest = document.createElement('span');
  bdrRest.style.color = '#6a6d70';
  bdrRest.textContent = ' = ohne gepl. WE';
  const br = document.createElement('br');
  const bgSpan = document.createElement('span');
  bgSpan.textContent = 'Hintergrund';
  bgSpan.style.fontWeight = '600';
  const bgRest = document.createElement('span');
  bgRest.style.color = '#6a6d70';
  bgRest.textContent = ' = mit gepl. WE';

  colorLbl.appendChild(bdrSpan);
  colorLbl.appendChild(bdrRest);
  colorLbl.appendChild(br);
  colorLbl.appendChild(bgSpan);
  colorLbl.appendChild(bgRest);
  colorExplainRow.appendChild(colorLbl);
  panel.appendChild(colorExplainRow);

  // Row explaining the blue badge
  const badgeLegendRow = document.createElement('div');
  badgeLegendRow.style.cssText = 'display:flex;align-items:center;gap:9px';

  const badgeSample = document.createElement('span');
  badgeSample.style.cssText = [
    'display:inline-flex;align-items:center;padding:1px 5px;border-radius:3px',
    'font-size:10px;font-weight:600;line-height:1.4;flex-shrink:0',
    'background:rgba(21,101,192,0.15);color:#1565c0',
    'border:1px solid rgba(21,101,192,0.35)',
  ].join(';');
  badgeSample.textContent = '\u2191 +X \u2248YT';

  const badgeLbl = document.createElement('span');
  badgeLbl.style.cssText = 'font-size:11px;color:#6a6d70;line-height:1.4';
  badgeLbl.textContent = 'Zulauf + angepasste Tage';

  badgeLegendRow.appendChild(badgeSample);
  badgeLegendRow.appendChild(badgeLbl);
  panel.appendChild(badgeLegendRow);

  document.body.appendChild(panel);
}());
