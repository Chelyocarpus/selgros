/**
 * Artikel-Info Tooltip – Source Script
 * F&R Bestellvorschlag · Hover 2 Sek. über Artikel-Name → Transgourmet Produktinfos
 *
 * Nach 2 Sekunden Hover auf einem Artikelnamen in der Bestellvorschlag-Liste
 * wird die Artikel-Nr. des Eintrags ermittelt und die Transgourmet-Produktsuche
 * aufgerufen. Das Ergebnis erscheint als schwebendes Tooltip neben dem Cursor.
 *
 * Aktivierung : Bookmarklet-Klick startet den Hover-Modus (grüner Status-Badge).
 * Deaktivierung: × im Badge oder erneuter Bookmarklet-Klick beendet den Modus.
 *
 * API: https://apps.transgourmet.de/recor/api/productposterdocument/product/search
 */

(function () {
  'use strict';

  const PANEL_ID  = '__bk_tip_panel';
  const TOOLTIP_ID = '__bk_tip_box';
  const STYLE_ID  = '__bk_tip_style';
  const TIMER_KEY = '__bk_tip_timer';

  // ── Toggle off ───────────────────────────────────────────────────────────────

  if (document.getElementById(PANEL_ID)) {
    cleanup();
    return;
  }

  // ── DOM helper ───────────────────────────────────────────────────────────────

  /**
   * Creates a DOM element with optional inline style and text content.
   * textContent is used for user data (XSS-safe).
   */
  function mk(tag, css, txt) {
    const el = document.createElement(tag);
    if (css) el.style.cssText = css;
    if (txt != null) el.textContent = txt;
    return el;
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  function cleanup() {
    document.removeEventListener('mouseover', onOver, true);
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('mouseout',  onOut,  true);
    if (window[TIMER_KEY]) { clearTimeout(window[TIMER_KEY]); delete window[TIMER_KEY]; }
    [PANEL_ID, TOOLTIP_ID].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  // ── Column detection ─────────────────────────────────────────────────────────

  let colInfo = null;

  /**
   * Scans all [role="grid"] elements on the page for the Artikel-Nr and
   * Artikel-Text column headers by their visible text content.
   * Returns { grid, nrIdx, textIdx } or null.
   */
  function findColumns() {
    const grids = document.querySelectorAll('[role="grid"],[role="treegrid"]');
    for (const grid of grids) {
      const headers = grid.querySelectorAll('[role="columnheader"]');
      let nrIdx = -1, textIdx = -1;
      headers.forEach((h, i) => {
        const lbl = h.textContent.toLowerCase();
        if (lbl.includes('artikel-nr'))   nrIdx   = i;
        if (lbl.includes('artikel-text')) textIdx = i;
      });
      if (nrIdx >= 0 && textIdx >= 0) return { grid, nrIdx, textIdx };
    }
    return null;
  }

  /**
   * Given any DOM element under the cursor, walks up to the enclosing gridcell
   * and checks whether it sits in the Artikel-Text column.
   * Returns { nr, txt, cell } or null.
   */
  function findArtInfo(target) {
    if (!colInfo) colInfo = findColumns();
    if (!colInfo) return null;

    const { nrIdx, textIdx } = colInfo;

    let cell = target;
    while (cell && cell.getAttribute('role') !== 'gridcell') {
      cell = cell.parentElement;
    }
    if (!cell) return null;

    const row = cell.closest('[role="row"]');
    if (!row) return null;

    const cells = Array.from(row.querySelectorAll('[role="gridcell"]'));
    if (cells.indexOf(cell) !== textIdx) return null;

    const nrCell = cells[nrIdx];
    if (!nrCell) return null;

    const nr  = nrCell.textContent.trim().replace(/\s+/g, '');
    const txt = cell.textContent.trim();
    if (!nr || !/^\d{5,}$/.test(nr)) return null;

    return { nr, txt, cell };
  }

  // ── Tooltip ──────────────────────────────────────────────────────────────────

  function ensureTooltip() {
    let tip = document.getElementById(TOOLTIP_ID);
    if (!tip) {
      tip = mk('div', [
        'position:fixed',
        'z-index:2147483647',
        'background:#fff',
        'border:1px solid #e0e0e0',
        'border-radius:10px',
        'box-shadow:0 8px 32px rgba(0,0,0,.22)',
        'padding:14px 16px',
        'max-width:320px',
        'min-width:220px',
        'font-family:72,Arial,sans-serif',
        'font-size:13px',
        'color:#32363a',
        'pointer-events:none',
        'opacity:0',
        'transition:opacity .15s ease',
        'display:none'
      ].join(';'));
      tip.id = TOOLTIP_ID;
      document.body.appendChild(tip);
    }
    return tip;
  }

  function clearContent(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function position(tip, mx, my) {
    const margin = 14, tipW = 320;
    const tipH = tip.offsetHeight || 180;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = mx + margin;
    let top  = my - tipH / 2;
    if (left + tipW > vw - margin) left = mx - tipW - margin;
    if (top  < margin)             top  = margin;
    if (top  + tipH > vh - margin) top  = vh - tipH - margin;
    tip.style.left = Math.max(margin, left) + 'px';
    tip.style.top  = Math.max(margin, top)  + 'px';
  }

  function buildHeader(container, nr, subtext) {
    const hdr = mk('div', 'border-bottom:1px solid #f0f0f0;padding-bottom:9px;margin-bottom:9px');
    hdr.appendChild(mk('div', 'font-weight:700;font-size:12px;color:#0a6ed1', nr));
    if (subtext) {
      hdr.appendChild(mk('div',
        'font-size:11px;color:#6a6d70;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
        subtext));
    }
    container.appendChild(hdr);
  }

  function showLoading(nr, txt) {
    const tip = ensureTooltip();
    clearContent(tip);
    tip.style.display = 'block';
    buildHeader(tip, nr, txt);

    const row = mk('div', 'display:flex;align-items:center;gap:7px;color:#6a6d70;font-size:12px');
    row.appendChild(mk('div',
      'width:13px;height:13px;border:2px solid #e0e0e0;border-top-color:#0a6ed1;' +
      'border-radius:50%;animation:__bkSpin .7s linear infinite;flex-shrink:0'));
    row.appendChild(mk('span', null, 'Lade Produktdaten\u2026'));
    tip.appendChild(row);
    requestAnimationFrame(() => { tip.style.opacity = '1'; });
    return tip;
  }

  function renderProduct(tip, nr, data) {
    clearContent(tip);

    // API returns a Spring-pageable wrapper: { content: [...], totalElements: n, ... }
    const items = data && (data.content || (Array.isArray(data) ? data : null));
    const p = Array.isArray(items) && items.length ? items[0] : null;

    if (!p) {
      buildHeader(tip, nr, '');
      tip.appendChild(mk('div', 'color:#c62828;font-size:12px', 'Kein Produkt gefunden.'));
      return;
    }

    const name  = p.name  || '';
    const img   = p.imageUrl || '';
    const ean   = p.ean   || '';
    const brand = p.brand || '';
    const cat   = (p.productGroup && p.productGroup.name) || '';
    const unit  = p.unitName || p.unit || '';
    const desc  = p.description || p.shopDescription || '';
    const pkg   = p.packagingText || '';

    buildHeader(tip, nr, name);

    // Body: product image + truncated description
    const body = mk('div', 'display:flex;gap:10px;align-items:flex-start;margin-bottom:10px');
    if (img) {
      const imgEl = document.createElement('img');
      imgEl.src = img;
      imgEl.alt = '';
      imgEl.style.cssText = 'width:60px;height:60px;object-fit:contain;border-radius:6px;border:1px solid #f0f0f0;flex-shrink:0';
      imgEl.onerror = function () { this.style.display = 'none'; };
      body.appendChild(imgEl);
    }
    if (desc) {
      body.appendChild(mk('div', 'flex:1;min-width:0;font-size:11px;color:#5b607a;line-height:1.4',
        desc.length > 120 ? desc.slice(0, 117) + '\u2026' : desc));
    }
    tip.appendChild(body);

    // Details table
    const rows = [];
    if (brand) rows.push(['Marke',      brand]);
    if (pkg)   rows.push(['Verpackung', pkg]);
    if (unit)  rows.push(['Einheit',    unit]);
    if (ean)   rows.push(['EAN',        ean]);
    if (cat)   rows.push(['Kategorie',  cat]);

    if (rows.length) {
      const tbl = mk('table', 'width:100%;border-collapse:collapse;font-size:11px;color:#32363a');
      for (const [k, v] of rows) {
        const tr  = document.createElement('tr');
        const td1 = mk('td', 'color:#6a6d70;padding:2px 8px 2px 0;white-space:nowrap;vertical-align:top', k);
        const td2 = mk('td', 'padding:2px 0', String(v));
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbl.appendChild(tr);
      }
      tip.appendChild(tbl);
    }

    tip.appendChild(mk('div',
      'margin-top:10px;padding-top:8px;border-top:1px solid #f0f0f0;font-size:10px;color:#8b90a8',
      'transgourmet.de \u00b7 ' + nr));
  }

  function renderError(tip, nr, err) {
    clearContent(tip);
    buildHeader(tip, nr, '');
    tip.appendChild(mk('div', 'color:#c62828;font-size:12px', 'Fehler beim Laden.'));
    tip.appendChild(mk('div', 'font-size:11px;color:#8b90a8;margin-top:4px', String(err)));
  }

  function hideTooltip() {
    const tip = document.getElementById(TOOLTIP_ID);
    if (!tip) return;
    tip.style.opacity = '0';
    setTimeout(() => { if (tip.style.opacity === '0') tip.style.display = 'none'; }, 200);
  }

  // ── Hover state ──────────────────────────────────────────────────────────────

  let currentCell = null;
  let lastX = 0, lastY = 0;

  function onOver(e) {
    const info = findArtInfo(e.target);

    if (!info) {
      if (currentCell) {
        currentCell = null;
        if (window[TIMER_KEY]) { clearTimeout(window[TIMER_KEY]); delete window[TIMER_KEY]; }
        hideTooltip();
      }
      return;
    }

    if (info.cell === currentCell) return;

    currentCell = info.cell;
    if (window[TIMER_KEY]) { clearTimeout(window[TIMER_KEY]); delete window[TIMER_KEY]; }
    hideTooltip();
    lastX = e.clientX;
    lastY = e.clientY;

    window[TIMER_KEY] = setTimeout(() => {
      delete window[TIMER_KEY];
      if (!currentCell) return;

      const tip = showLoading(info.nr, info.txt);
      position(tip, lastX, lastY);

      fetch(
        'https://apps.transgourmet.de/recor/api/productposterdocument/product/search' +
        '?size=12&page=0&term=' + encodeURIComponent(info.nr),
        { credentials: 'include' }
      )
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(data => { renderProduct(tip, info.nr, data); position(tip, lastX, lastY); })
        .catch(err  => renderError(tip, info.nr, err));
    }, 2000);
  }

  function onMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    const tip = document.getElementById(TOOLTIP_ID);
    if (tip && tip.style.display !== 'none' && tip.style.opacity !== '0') {
      position(tip, lastX, lastY);
    }
  }

  function onOut(e) {
    if (!currentCell) return;
    const related = e.relatedTarget;
    if (related && currentCell.contains(related)) return;
    currentCell = null;
    if (window[TIMER_KEY]) { clearTimeout(window[TIMER_KEY]); delete window[TIMER_KEY]; }
    hideTooltip();
  }

  document.addEventListener('mouseover', onOver, true);
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('mouseout',  onOut,  true);

  // ── Spinner animation ────────────────────────────────────────────────────────

  if (!document.getElementById(STYLE_ID)) {
    const style = mk('style', null, '@keyframes __bkSpin{to{transform:rotate(360deg)}}');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  // ── Status panel (bottom-right badge) ────────────────────────────────────────

  const panel = mk('div', [
    'position:fixed',
    'bottom:70px',
    'right:16px',
    'z-index:2147483647',
    'background:#fff',
    'border-radius:8px',
    'padding:10px 14px',
    'box-shadow:0 4px 20px rgba(0,0,0,.22)',
    'font-family:72,Arial,sans-serif',
    'font-size:12px',
    'color:#32363a',
    'border:1px solid #e0e0e0',
    'display:flex',
    'align-items:center',
    'gap:8px',
    'user-select:none'
  ].join(';'));
  panel.id = PANEL_ID;

  panel.appendChild(mk('div', 'width:8px;height:8px;background:#107e3e;border-radius:50%;flex-shrink:0'));
  panel.appendChild(mk('span', null, 'Artikel-Info \u00b7 2s Hover'));

  const closeBtn = mk('button',
    'background:none;border:none;font-size:16px;line-height:1;cursor:pointer;color:#6a6d70;padding:0;margin-left:4px;flex-shrink:0',
    '\u00d7');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Artikel-Info beenden');
  closeBtn.onclick = cleanup;
  panel.appendChild(closeBtn);

  document.body.appendChild(panel);
})();
