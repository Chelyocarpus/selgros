/**
 * Artikel-Info Tooltip – Source Script
 * F&R Bestellvorschlag · Hover 1 Sek. über Artikel-Name → Transgourmet Produktinfos
 *
 * Nach 1 Sekunde Hover auf einem Artikelnamen in der Bestellvorschlag-Liste
 * wird die Artikel-Nr. des Eintrags ermittelt und die Transgourmet-Produktsuche
 * aufgerufen. Das Ergebnis erscheint als schwebendes Tooltip neben dem Cursor.
 *
 * Datenabruf ausschließlich via Relay:
 *   window.postMessage an einen Transgourmet-Tab mit aktivem Relay-Receptor.
 *   Der Receptor läuft same-origin auf transgourmet.de und führt die API-Abfragen
 *   dort direkt aus, ohne CORS-Einschränkungen.
 *
 * Relay-Einrichtung (einmalig):
 *   1. Dieses Bookmarklet auf dem F&R-Tab starten.
 *   2. Im Badge auf »Relay« klicken → öffnet einen Transgourmet-Tab.
 *   3. Auf dem Transgourmet-Tab das Bookmarklet »Artikel-Info Relay« aktivieren.
 *   4. Verbindung wird automatisch aufgebaut (Badge: »Relay ✓«).
 *
 * Aktivierung : Bookmarklet-Klick startet den Hover-Modus (Badge wird orange bis Relay verbunden).
 * Deaktivierung: × im Badge oder erneuter Bookmarklet-Klick beendet den Modus.
 */


(function () {
  'use strict';

  const PANEL_ID   = '__bk_tip_panel';
  const TOOLTIP_ID = '__bk_tip_box';
  const CURSOR_ID  = '__bk_tip_cursor';
  const STYLE_ID   = '__bk_tip_style';
  const TIMER_KEY  = '__bk_tip_timer';

  const RELAY_PAGE = 'https://apps.transgourmet.de/recor/';
  const RELAY_WIN  = 'tg_artikel_relay';
  const RELAY_ORI  = 'https://apps.transgourmet.de';

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

  // ── Relay state ──────────────────────────────────────────────────────────────

  let relayWin     = null;
  let relayReady   = false;
  let pingTimer    = null;
  let pingAttempts = 0;
  const pendingReqs  = {};
  let reqIdCounter   = 0;
  const apiCache     = new Map();

  // Badge element refs for dynamic relay status updates
  let badgeDot = null;
  let badgeLbl = null;
  let relayBtn = null;

  /** Opens the transgourmet tab and starts a PING handshake loop. */
  function connectRelay() {
    relayWin     = window.open(RELAY_PAGE, RELAY_WIN);
    relayReady   = false;
    pingAttempts = 0;
    updateRelayBadge('connecting');
    schedulePing();
  }

  function schedulePing() {
    clearTimeout(pingTimer);
    if (pingAttempts > 20) {
      updateRelayBadge('timeout');
      return;
    }
    pingTimer = setTimeout(() => {
      if (relayReady) return;
      if (!relayWin || relayWin.closed) { updateRelayBadge('disconnected'); return; }
      pingAttempts++;
      try { relayWin.postMessage({ type: 'ARTIKEL_INFO_PING' }, RELAY_ORI); } catch (_) {}
      schedulePing();
    }, 500);
  }

  /** Sends an API request via the relay tab and returns a Promise. */
  function requestViaRelay(nr) {
    return new Promise((resolve, reject) => {
      const reqId = ++reqIdCounter;
      const timer = setTimeout(() => {
        delete pendingReqs[reqId];
        reject(new Error('Relay-Timeout'));
      }, 10_000);
      pendingReqs[reqId] = { resolve, reject, timer };
      try {
        relayWin.postMessage({ type: 'ARTIKEL_INFO_REQUEST', nr, reqId }, RELAY_ORI);
      } catch (err) {
        clearTimeout(timer);
        delete pendingReqs[reqId];
        reject(err);
      }
    });
  }

  /**
   * Fetches product data via the relay tab.
   * The receptor handles both API variants same-origin on transgourmet.de.
   * Returns cached result when available.
   */
  function fetchData(nr) {
    if (apiCache.has(nr)) return Promise.resolve(apiCache.get(nr));
    if (!relayReady || !relayWin || relayWin.closed) {
      return Promise.reject(new Error('Kein Relay verbunden. Bitte »Relay« klicken.'));
    }
    return requestViaRelay(nr).then(data => { apiCache.set(nr, data); return data; });
  }

  /** Handles incoming postMessages from the relay tab. */
  function onRelayMessage(e) {
    const { type, reqId, data, error } = e.data || {};

    if (type === 'ARTIKEL_INFO_PONG') {
      if (!relayWin || e.source !== relayWin) return;
      relayReady = true;
      clearTimeout(pingTimer);
      updateRelayBadge('connected');
      return;
    }

    if (type === 'ARTIKEL_INFO_RESPONSE') {
      const pending = pendingReqs[reqId];
      if (!pending) return;
      clearTimeout(pending.timer);
      delete pendingReqs[reqId];
      if (error) pending.reject(new Error(error));
      else       pending.resolve(data);
    }
  }

  window.addEventListener('message', onRelayMessage);

  function updateRelayBadge(state) {
    if (!badgeDot || !badgeLbl) return;
    switch (state) {
      case 'connecting':
        badgeDot.style.background = '#e65100';
        badgeLbl.textContent      = 'Artikel-Info \u00b7 Relay verbindet\u2026';
        if (relayBtn) relayBtn.style.display = 'none';
        break;
      case 'connected':
        badgeDot.style.background = '#107e3e';
        badgeLbl.textContent      = 'Artikel-Info \u00b7 Relay \u2713 \u00b7 1s Hover';
        if (relayBtn) relayBtn.style.display = 'none';
        break;
      case 'timeout':
        badgeDot.style.background = '#c62828';
        badgeLbl.textContent      = 'Artikel-Info \u00b7 Relay Timeout';
        if (relayBtn) { relayBtn.textContent = 'Retry'; relayBtn.style.display = ''; }
        break;
      case 'disconnected':
        badgeDot.style.background = '#c62828';
        badgeLbl.textContent      = 'Artikel-Info \u00b7 Relay getrennt';
        if (relayBtn) { relayBtn.textContent = 'Relay'; relayBtn.style.display = ''; }
        break;
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  function cleanup() {
    document.removeEventListener('mouseover', onOver, true);
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('mouseout',  onOut,  true);
    window.removeEventListener('message', onRelayMessage);
    if (window[TIMER_KEY]) { clearTimeout(window[TIMER_KEY]); delete window[TIMER_KEY]; }
    clearTimeout(pingTimer);
    for (const { reject, timer } of Object.values(pendingReqs)) {
      clearTimeout(timer);
      reject(new Error('Beendet'));
    }
    [PANEL_ID, TOOLTIP_ID, CURSOR_ID].forEach(id => document.getElementById(id)?.remove());
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
      imgEl.style.cssText = 'width:120px;height:120px;object-fit:contain;border-radius:6px;border:1px solid #f0f0f0;flex-shrink:0';
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

    const apiLabel = data._apiSource === 'new' ? ' \u00b7 neue API' : '';
    tip.appendChild(mk('div',
      'margin-top:10px;padding-top:8px;border-top:1px solid #f0f0f0;font-size:10px;color:#8b90a8',
      'transgourmet.de \u00b7 ' + nr + apiLabel));
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

  function showCursorSpinner(x, y) {
    let svg = document.getElementById(CURSOR_ID);
    if (!svg) {
      const NS = 'http://www.w3.org/2000/svg';
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width',   '16');
      svg.setAttribute('height',  '16');
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;overflow:visible';
      svg.id = CURSOR_ID;

      const track = document.createElementNS(NS, 'circle');
      track.setAttribute('cx', '8'); track.setAttribute('cy', '8'); track.setAttribute('r', '6');
      track.setAttribute('fill', 'none'); track.setAttribute('stroke', 'rgba(0,0,0,.12)'); track.setAttribute('stroke-width', '2');
      svg.appendChild(track);

      const arc = document.createElementNS(NS, 'circle');
      arc.setAttribute('cx', '8'); arc.setAttribute('cy', '8'); arc.setAttribute('r', '6');
      arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', '#0a6ed1'); arc.setAttribute('stroke-width', '2');
      arc.setAttribute('stroke-linecap', 'round');
      arc.setAttribute('stroke-dasharray', '37.7'); arc.setAttribute('stroke-dashoffset', '37.7');
      arc.setAttribute('transform', 'rotate(-90 8 8)');
      arc.id = '__bk_tip_arc';
      svg.appendChild(arc);

      document.body.appendChild(svg);
    } else {
      // Restart animation for new cell
      const arc = document.getElementById('__bk_tip_arc');
      if (arc) {
        arc.style.animation = 'none';
        void arc.getBoundingClientRect();
        arc.style.animation = '';
      }
    }
    const arc = document.getElementById('__bk_tip_arc');
    if (arc) arc.style.animation = '__bkProg 1s linear forwards';
    svg.style.left = (x + 12) + 'px';
    svg.style.top  = (y + 12) + 'px';
  }

  function hideCursorSpinner() {
    document.getElementById(CURSOR_ID)?.remove();
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
        hideCursorSpinner();
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
    showCursorSpinner(lastX, lastY);

    window[TIMER_KEY] = setTimeout(() => {
      delete window[TIMER_KEY];
      hideCursorSpinner();
      if (!currentCell) return;

      const tip = showLoading(info.nr, info.txt);
      position(tip, lastX, lastY);

      fetchData(info.nr)
        .then(data => { renderProduct(tip, info.nr, data); position(tip, lastX, lastY); })
        .catch(err  => renderError(tip, info.nr, err));
    }, 1000);
  }

  function onMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    const cs = document.getElementById(CURSOR_ID);
    if (cs) { cs.style.left = (lastX + 12) + 'px'; cs.style.top = (lastY + 12) + 'px'; }
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
    hideCursorSpinner();
    hideTooltip();
  }

  document.addEventListener('mouseover', onOver, true);
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('mouseout',  onOut,  true);

  // ── Spinner animation ────────────────────────────────────────────────────────

  if (!document.getElementById(STYLE_ID)) {
    const style = mk('style', null,
      '@keyframes __bkSpin{to{transform:rotate(360deg)}}' +
      '@keyframes __bkProg{from{stroke-dashoffset:37.7}to{stroke-dashoffset:0}}');
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

  badgeDot = mk('div', 'width:8px;height:8px;background:#e65100;border-radius:50%;flex-shrink:0');
  badgeLbl = mk('span', null, 'Artikel-Info \u00b7 Relay ben\u00f6tigt');

  relayBtn = mk('button',
    'background:none;border:1px solid #c0c0c0;border-radius:4px;font-size:11px;font-weight:600;' +
    'padding:2px 8px;cursor:pointer;color:#32363a;font-family:72,Arial,sans-serif;flex-shrink:0',
    'Relay');
  relayBtn.type  = 'button';
  relayBtn.title = 'Transgourmet-Tab als Relay verbinden (CORS-Umgehung)';
  relayBtn.onclick = connectRelay;

  const closeBtn = mk('button',
    'background:none;border:none;font-size:16px;line-height:1;cursor:pointer;color:#6a6d70;padding:0;margin-left:4px;flex-shrink:0',
    '\u00d7');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Artikel-Info beenden');
  closeBtn.onclick = cleanup;

  panel.appendChild(badgeDot);
  panel.appendChild(badgeLbl);
  panel.appendChild(relayBtn);
  panel.appendChild(closeBtn);
  document.body.appendChild(panel);
})();
