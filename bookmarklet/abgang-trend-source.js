/**
 * Abgang-Trend – Source Script
 * F&R Bestellvorschlag · Projektionsbadge für Jahresabgang-Vergleich
 *
 * Hängt an die Zelle "Abgang aktuelles Jahr" jeder Zeile ein kleines Badge,
 * das den hochgerechneten Jahresabgang (YTD × 365 ÷ Tag des Jahres) und
 * den prozentualen Trend gegenüber dem Vorjahr anzeigt.
 *
 * Toggle: nochmaliger Klick entfernt alle Badges und Panels.
 * MutationObserver: neu gerenderte Zeilen beim virtuellen Scrollen
 * werden automatisch annotiert.
 */

(function () {
  'use strict';

  const PANEL_ID  = '__bk_trend_panel';
  const BADGE_CLS = '__bk_trend_badge';
  const OBS_KEY   = '__bk_trend_obs';

  // ── Toggle off ─────────────────────────────────────────────────────────────

  if (document.getElementById(PANEL_ID)) {
    document.querySelectorAll('.' + BADGE_CLS).forEach(el => el.remove());
    document.getElementById(PANEL_ID).remove();
    if (window[OBS_KEY]) { window[OBS_KEY].disconnect(); delete window[OBS_KEY]; }
    return;
  }

  // ── Day-of-year fraction ───────────────────────────────────────────────────
  // Projection formula: projected full-year = YTD ÷ (dayOfYear / 365)

  const now        = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear  = Math.ceil((now - startOfYear) / 86_400_000) + 1;
  const yearFraction = dayOfYear / 365;

  // ── Grid and column detection ────────────────────────────────────────────
  //
  // The SAP F&R page can contain multiple [role="grid"] elements (e.g. a
  // calendar widget). We must find the one that owns the Positionen table by
  // looking for column headers containing "vorjahr" and "aktuell" within each
  // grid, rather than scanning document-wide (which would yield wrong indices).

  /**
   * Finds the grid element that contains the Abgang columns and returns its
   * element together with the 0-based column indices for
   * "Abgang Vorjahr" and "Abgang aktuelles Jahr".
   * @returns {{ grid: Element, vorjahrIdx: number, aktJahrIdx: number } | null}
   */
  function findTargetGrid() {
    for (const g of document.querySelectorAll('[role="grid"],[role="treegrid"]')) {
      const headers = g.querySelectorAll('[role="columnheader"]');
      let vi = -1, ai = -1;
      for (let i = 0; i < headers.length; i++) {
        const l = (headers[i].getAttribute('aria-label') || headers[i].textContent || '').toLowerCase();
        if (l.includes('vorjahr'))  vi = i;
        if (l.includes('aktuell')) ai = i;
      }
      if (vi >= 0 && ai >= 0) return { grid: g, vorjahrIdx: vi, aktJahrIdx: ai };
    }
    return null;
  }

  // ── Number parsing ─────────────────────────────────────────────────────────

  /**
   * Parses SAP cell text like "2 532 Hervorgehoben" or "690 Hervorgehoben".
   * Treats space as thousands separator.
   * Returns NaN when no digit sequence is found.
   */
  function parseNum(text) {
    const m = text.match(/\d[\d\s]*/);
    if (!m) return NaN;
    return parseFloat(m[0].replace(/\s/g, '')) || 0;
  }

  /** Formats a number with German locale (dot as thousands separator). */
  function fmtNum(n) {
    return Math.round(n).toLocaleString('de-DE');
  }

  // ── Trend thresholds ───────────────────────────────────────────────────────
  //   p: minimum rounded pct value to match this level (first match wins)

  const THRESHOLDS = [
    { p: 100, a: '↑↑', c: '#005f27', b: 'rgba(0,95,39,0.16)'      },  // ≥ +100 %
    { p:  10, a: '↑',  c: '#107e3e', b: 'rgba(16,126,62,0.13)'   },  // ≥ +10 %
    { p: -10, a: '→',  c: '#5b607a', b: 'rgba(0,0,0,0.07)'        },  // ±10 %
    { p: -30, a: '↓',  c: '#e65100', b: 'rgba(230,81,0,0.13)'     },  // -10 to -30 %
    { p: -9999, a: '↓↓', c: '#c62828', b: 'rgba(198,40,40,0.14)' },  // < -30 %
  ];

  /**
   * Computes the trend badge descriptor for a single row.
   * @param {number} vorjahr  - full-year sales previous year
   * @param {number} aktJahr  - YTD sales current year
   * @returns {{ lbl: string, c: string, b: string } | null}
   */
  function computeTrend(vorjahr, aktJahr) {
    if (isNaN(vorjahr) || isNaN(aktJahr)) return null;

    // Both negligible — no meaningful sales data
    if (vorjahr < 5 && aktJahr < 3) return null;

    const projected = aktJahr / yearFraction;
    const projFmt   = fmtNum(projected);

    // New or rare article (no prior-year baseline) — just show projection
    if (vorjahr < 5) {
      return {
        short: `~${projFmt}`,
        title: `Projektion: ~${projFmt} | Tag ${dayOfYear}/365`,
        c: '#0a6ed1', b: 'rgba(10,110,209,0.10)',
      };
    }

    const pct   = (projected - vorjahr) / vorjahr * 100;
    const sign  = pct >= 0 ? '+' : '';
    const pctStr = `${sign}${Math.round(pct)}\u202f%`; // narrow no-break space before %
    const level = THRESHOLDS.find(t => Math.round(pct) >= t.p);
    const { a, c, b } = level;

    // `short` is shown in the cell badge; `title` goes into the tooltip
    return {
      short: `${a} ${pctStr}`,
      title: `${a} ~${projFmt} (${pctStr}) | Tag ${dayOfYear}/365`,
      c, b,
    };
  }

  // ── Row annotation ─────────────────────────────────────────────────────────

  let vorjahrIdx = -1;
  let aktJahrIdx = -1;
  let targetGrid  = null;

  function applyToRow(row) {
    if (vorjahrIdx < 0 || aktJahrIdx < 0) return;

    const cells = row.querySelectorAll('[role="gridcell"]');
    if (cells.length <= Math.max(vorjahrIdx, aktJahrIdx)) return;

    // Remove stale badge (virtual-scroll row reuse)
    cells[aktJahrIdx].querySelectorAll('.' + BADGE_CLS).forEach(b => b.remove());

    const vorjahr = parseNum(cells[vorjahrIdx].textContent);
    const aktJahr = parseNum(cells[aktJahrIdx].textContent);
    const trend   = computeTrend(vorjahr, aktJahr);
    if (!trend) return;

    const badge = document.createElement('div');
    badge.className = BADGE_CLS;
    badge.title = trend.title;
    badge.style.cssText = [
      `color:${trend.c}`,
      `background:${trend.b}`,
      'font-size:10px;font-weight:700;line-height:1.4',
      'padding:1px 4px;border-radius:3px;margin-top:2px',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
      'font-family:72,Arial,sans-serif;display:block;max-width:100%',
    ].join(';');
    badge.textContent = trend.short;
    cells[aktJahrIdx].appendChild(badge);
  }

  // ── Scan ───────────────────────────────────────────────────────────────────

  let busy = false;

  function scan() {
    if (!targetGrid) {
      const found = findTargetGrid();
      if (!found) return;
      targetGrid  = found.grid;
      vorjahrIdx  = found.vorjahrIdx;
      aktJahrIdx  = found.aktJahrIdx;
    }
    // The Positionen grid does not use [role="rowgroup"] — iterate rows directly
    // and skip index 0 (the header row).
    targetGrid.querySelectorAll('[role="row"]').forEach((row, i) => {
      if (i > 0) applyToRow(row);
    });
  }

  scan();

  // ── MutationObserver (virtual scroll) ─────────────────────────────────────
  // Use a busy flag to prevent badge injection from re-triggering scan.
  // Observe targetGrid (or body as fallback) once it has been identified;
  // if targetGrid is still unknown run findTargetGrid on first mutation.

  const obsTarget = targetGrid || document.body;
  const obs = new MutationObserver(() => {
    if (busy) return;
    busy = true;
    requestAnimationFrame(() => { scan(); busy = false; });
  });
  obs.observe(obsTarget, { childList: true, subtree: true });
  window[OBS_KEY] = obs;

  // ── Legend / info panel ────────────────────────────────────────────────────

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = [
    'position:fixed;top:70px;right:16px;z-index:2147483647',
    'background:#fff;border-radius:8px;padding:14px 16px 12px',
    'box-shadow:0 4px 20px rgba(0,0,0,.22)',
    'font-family:72,Arial,sans-serif;font-size:12px;color:#32363a',
    'min-width:200px;border:1px solid #e0e0e0;user-select:none',
  ].join(';');

  // Title + close button
  const hdr = document.createElement('div');
  hdr.style.cssText = 'font-weight:bold;font-size:13px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between';

  const ht = document.createElement('span');
  ht.textContent = 'Abgang-Trend';

  const cb = document.createElement('button');
  cb.type = 'button';
  cb.textContent = '×';
  cb.setAttribute('aria-label', 'Panel schließen');
  cb.style.cssText = 'background:none;border:none;font-size:17px;line-height:1;cursor:pointer;color:#6a6d70;padding:0;flex-shrink:0';
  cb.addEventListener('click', () => {
    // Hide panel only — badges and observer remain active
    panel.style.display = 'none';
  });

  hdr.appendChild(ht);
  hdr.appendChild(cb);

  // ── Drag to move panel ────────────────────────────────────────────────────
  let _dragging = false, _dx = 0, _dy = 0;
  hdr.style.cursor = 'grab';
  hdr.addEventListener('mousedown', (e) => {
    if (e.target === cb) return;
    _dragging = true;
    const r = panel.getBoundingClientRect();
    _dx = e.clientX - r.left;
    _dy = e.clientY - r.top;
    // Switch from right-anchored to left-anchored so position math is simple
    panel.style.right = 'auto';
    panel.style.left  = r.left + 'px';
    panel.style.top   = r.top  + 'px';
    hdr.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!_dragging) return;
    panel.style.left = (e.clientX - _dx) + 'px';
    panel.style.top  = (e.clientY - _dy) + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (_dragging) { _dragging = false; hdr.style.cursor = 'grab'; }
  });

  panel.appendChild(hdr);

  // subtitle
  const subtitle = document.createElement('div');
  subtitle.style.cssText = 'font-size:10px;color:#8b90a8;margin-bottom:10px;margin-top:-4px';
  subtitle.textContent = 'Akt. Jahr vs. Vorjahr \u00b7 Hover f\u00fcr Details';
  panel.appendChild(subtitle);

  // Legend rows
  const LEGEND = [
    { a: '↑↑', l: '> +100\u202f%',       c: '#005f27', b: 'rgba(0,95,39,0.16)',   d: 'Starkes Wachstum' },
    { a: '↑',  l: '≥ +10\u202f%',        c: '#107e3e', b: 'rgba(16,126,62,0.13)', d: 'Wachsend' },
    { a: '→',  l: '±10\u202f%',          c: '#5b607a', b: 'rgba(0,0,0,0.07)',     d: 'Stabil' },
    { a: '↓',  l: '−10 bis −30\u202f%', c: '#e65100', b: 'rgba(230,81,0,0.13)',  d: 'Schwächer' },
    { a: '↓↓', l: '< −30\u202f%',        c: '#c62828', b: 'rgba(198,40,40,0.14)',d: 'Deutlich schwächer' },
  ];

  LEGEND.forEach(({ a, l, c, b, d }) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:7px';

    const chip = document.createElement('span');
    chip.style.cssText = [
      `color:${c};background:${b}`,
      'font-size:10px;font-weight:600;padding:1px 5px;border-radius:3px',
      'min-width:28px;text-align:center;white-space:nowrap',
    ].join(';');
    chip.textContent = a;

    const lbl = document.createElement('div');
    lbl.style.cssText = 'line-height:1.3;font-size:11px';

    const strong = document.createElement('strong');
    strong.textContent = l;

    const muted = document.createElement('span');
    muted.style.color = '#6a6d70';
    muted.textContent = '\u00a0' + d;

    lbl.appendChild(strong);
    lbl.appendChild(muted);
    row.appendChild(chip);
    row.appendChild(lbl);
    panel.appendChild(row);
  });

  // Footer note
  const note = document.createElement('div');
  note.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid #e0e0e0;font-size:10px;color:#8b90a8;line-height:1.5';
  note.textContent = `Proj.: YTD \u00d7 365\u2044${dayOfYear} (Tag\u00a0${dayOfYear}/365)`;
  panel.appendChild(note);

  document.body.appendChild(panel);
}());
