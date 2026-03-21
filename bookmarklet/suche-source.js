/**
 * Erweiterte Suche – Source Script
 * SAP F&R Bestellvorschlag: Schnelle Client-seitige Tabellensuche
 *
 * Suchsyntax:
 *   term            Enthält „term" (Groß-/Kleinschreibung egal)
 *   ter*m           Wildcard: * passt auf beliebige Zeichen
 *   "exakter text"  Exakte Phrase (in Anführungszeichen)
 *   +term           Zeile MUSS „term" enthalten
 *   -term           Zeile darf „term" NICHT enthalten
 *
 *   Mehrere Terme → implizit UND-Verknüpfung
 *
 * Beispiele:
 *   sv* 33*33 -pap       Alle Servettenl. 33x33, keine Papier-Eintr.
 *   "33x33 1/4" +A       Exakte Phrase + ABC-Klasse A erforderlich
 *   -0 +CO               Alle CO-Einträge ohne 0 in BV-Menge
 */

(function () {
  'use strict';

  const PANEL_ID = '__bk_exsearch_panel';
  const OBS_KEY  = '__bk_exsearch_obs';
  const HIDDEN_CLS = '__bk_exsearch_hidden';

  // Toggle: zweiter Klick entfernt das Tool
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    existing.remove();
    if (window[OBS_KEY]) { window[OBS_KEY].disconnect(); delete window[OBS_KEY]; }
    [...document.getElementsByClassName(HIDDEN_CLS)].forEach(el => {
      el.style.display = '';
      el.classList.remove(HIDDEN_CLS);
    });
    // Restore all native SAP search fields
    document.querySelectorAll('div.sapMSF.sapMBarChild').forEach(sf => {
      sf.style.display = '';
    });
    return;
  }

  /** Hides all native SAP search fields in toolbar bars. */
  function hideNativeSF() {
    document.querySelectorAll('div.sapMSF.sapMBarChild').forEach(sf => {
      sf.style.display = 'none';
    });
  }

  // ── Hilfsfunktionen ────────────────────────────────────────────────────────

  /** Findet das Positionen-Grid im Bestellvorschlag. */
  function getGrid() {
    const grids = document.querySelectorAll('[role="grid"]');
    for (const g of grids) {
      for (const h of g.querySelectorAll('[role="columnheader"]')) {
        const lbl = (h.getAttribute('aria-label') || h.textContent || '').toLowerCase();
        if (lbl.includes('artikel') || lbl.includes('bv-menge')) return g;
      }
    }
    return null;
  }

  /** Escapt Sonderzeichen für RegExp. */
  function escapeRe(s) {
    return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }

  // ── Query-Parser ────────────────────────────────────────────────────────────

  /**
   * Parst den Suchstring in ein Token-Array.
   * Jeder Token hat:
   *   { fn(text):boolean – Testfunktion, req: true | false | null }
   *   req = true  → erforderlich (+)
   *   req = false → ausschließen (-)
   *   req = null  → neutral (Standard-Suche)
   */
  function parseQuery(raw) {
    raw = raw.trim();
    const tokens = [];
    const Q = '"'; // Anführungszeichen
    let i = 0;

    while (i < raw.length) {
      // Leerzeichen überspringen
      while (i < raw.length && raw[i] === ' ') i++;
      if (i >= raw.length) break;

      // Modifier lesen
      let req = null;
      if      (raw[i] === '+') { req = true;  i++; }
      else if (raw[i] === '-') { req = false; i++; }
      if (i >= raw.length) break;

      let term = '';

      if (raw[i] === Q) {
        // Angeführter exakter Ausdruck
        i++;
        while (i < raw.length && raw[i] !== Q) term += raw[i++];
        if (raw[i] === Q) i++;
      } else {
        // Einzelnes Wort / Wildcard-Term
        while (i < raw.length && raw[i] !== ' ') term += raw[i++];
      }

      if (!term) continue;

      const low = term.toLowerCase();

      if (low.includes('*')) {
        // Wildcard → RegExp
        const pattern = low.split('*').map(escapeRe).join('.*');
        const re = new RegExp(pattern);
        tokens.push({ fn: (function (r) { return t => r.test(t); }(re)), req });
      } else {
        // Einfaches Substring-Match
        tokens.push({ fn: (function (v) { return t => t.includes(v); }(low)), req });
      }
    }

    return tokens;
  }

  // ── Filter-Logik ────────────────────────────────────────────────────────────

  /** Prüft ob der Zeilentext alle Token-Bedingungen erfüllt. */
  function rowMatches(text, tokens) {
    if (!tokens.length) return true;

    // Ausschlüsse prüfen (req === false)
    for (const tok of tokens) {
      if (tok.req === false && tok.fn(text)) return false;
    }

    // Pflicht-Terme prüfen (req === true)
    for (const tok of tokens) {
      if (tok.req === true && !tok.fn(text)) return false;
    }

    // Neutrale Terme: mindestens einer muss treffen (falls vorhanden)
    const neutral = tokens.filter(t => t.req === null);
    if (neutral.length > 0 && !neutral.some(t => t.fn(text))) return false;

    return true;
  }

  let lastTokens = [];

  /** Wendet den Filter auf alle Grid-Zeilen an und aktualisiert den Zähler. */
  function applyFilter(tokens, grid, countEl) {
    lastTokens = tokens;
    const dataRows = [...grid.querySelectorAll('[role="row"]')]
      .filter(r => r.querySelector('[role="gridcell"]'));

    let visible = 0;
    for (const row of dataRows) {
      const text = row.textContent.toLowerCase();
      const matches = rowMatches(text, tokens);
      row.style.display = matches ? '' : 'none';
      if (matches) {
        row.classList.remove(HIDDEN_CLS);
        visible++;
      } else {
        row.classList.add(HIDDEN_CLS);
      }
    }

    if (countEl) {
      countEl.textContent = tokens.length
        ? `${visible} von ${dataRows.length} Zeilen`
        : `${dataRows.length} Zeilen`;
      countEl.style.color = tokens.length
        ? (visible > 0 ? '#107e3e' : '#c62828')
        : '#8b90a8';
    }
  }

  // ── Grid suchen ────────────────────────────────────────────────────────────

  const grid = getGrid();
  if (!grid) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#c62828;color:#fff;padding:12px 18px;border-radius:6px;font-size:14px;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.3);font-family:72,Arial,sans-serif';
    toast.textContent = 'Kein BV-Raster gefunden. Bitte öffne den Bestellvorschlag.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
    return;
  }

  // ── Panel aufbauen ─────────────────────────────────────────────────────────

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = 'position:fixed;top:70px;right:16px;z-index:2147483646;background:#fff;border-radius:8px;padding:12px 14px 10px;box-shadow:0 4px 20px rgba(0,0,0,.22);font-family:72,Arial,sans-serif;font-size:12px;color:#32363a;min-width:290px;border:1px solid #e0e0e0;user-select:none';

  // Titelzeile
  const hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;cursor:grab';

  const ttl = document.createElement('span');
  ttl.style.cssText = 'font-weight:700;font-size:13px';
  ttl.textContent = 'Erweiterte Suche';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Suche schließen');
  closeBtn.style.cssText = 'background:none;border:none;font-size:18px;line-height:1;cursor:pointer;color:#6a6d70;padding:0;flex-shrink:0';

  function closePanel() {
    panel.remove();
    if (window[OBS_KEY]) { window[OBS_KEY].disconnect(); delete window[OBS_KEY]; }
    [...document.getElementsByClassName(HIDDEN_CLS)].forEach(el => {
      el.style.display = '';
      el.classList.remove(HIDDEN_CLS);
    });
    // Restore all native SAP search fields
    document.querySelectorAll('div.sapMSF.sapMBarChild').forEach(sf => {
      sf.style.display = '';
    });
  }

  closeBtn.onclick = closePanel;
  hdr.appendChild(ttl);
  hdr.appendChild(closeBtn);
  panel.appendChild(hdr);

  // Sucheingabe
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.placeholder = 'sv* 33*33 -pap  ·  +CO  ·  "exakt"';
  inp.setAttribute('aria-label', 'Suchbegriff eingeben');
  inp.style.cssText = 'width:100%;height:32px;border:2px solid #d0d0d0;border-radius:5px;padding:0 10px;font-size:13px;color:#32363a;font-family:72,Arial,sans-serif;box-sizing:border-box;outline:none;transition:border-color .15s';
  inp.addEventListener('focus', () => { inp.style.borderColor = '#0a6ed1'; });
  inp.addEventListener('blur',  () => { inp.style.borderColor = '#d0d0d0'; });
  inp.addEventListener('keydown', e => {
    e.stopPropagation(); // SAP key-capture verhindern
    if (e.key === 'Escape') closePanel();
  });
  panel.appendChild(inp);

  // Zähleranzeige
  const countEl = document.createElement('div');
  countEl.style.cssText = 'font-size:11px;margin-top:5px;min-height:14px;color:#8b90a8';
  panel.appendChild(countEl);

  // Syntax-Hilfe
  const hint = document.createElement('div');
  hint.style.cssText = 'margin-top:7px;padding:5px 8px;background:#f5f5f5;border-radius:4px;font-size:10px;color:#6a6d70;line-height:1.9';
  [
    ['*',       'Platzhalter  (sv*pap, 33*33)'],
    ['"text"',  'Exakte Phrase'],
    ['-term',   'Zeilen ausschließen'],
    ['+term',   'Zeile erforderlich'],
  ].forEach(([op, desc]) => {
    const row  = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px';
    const code = document.createElement('code');
    code.style.cssText = 'min-width:46px;font-weight:700;color:#0a6ed1;background:none;padding:0;font-size:10px';
    code.textContent = op;
    const span = document.createElement('span');
    span.textContent = desc;
    row.appendChild(code);
    row.appendChild(span);
    hint.appendChild(row);
  });
  panel.appendChild(hint);

  // Drag-Unterstützung
  let _dragging = false, _dx = 0, _dy = 0;
  hdr.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target === closeBtn) return;
    _dragging = true;
    const r = panel.getBoundingClientRect();
    _dx = e.clientX - r.left; _dy = e.clientY - r.top;
    panel.style.right = 'auto';
    panel.style.left  = r.left + 'px';
    panel.style.top   = r.top  + 'px';
    e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!_dragging) return;
    panel.style.left = (e.clientX - _dx) + 'px';
    panel.style.top  = (e.clientY - _dy) + 'px';
  });
  document.addEventListener('pointerup', () => { _dragging = false; });

  document.body.appendChild(panel);
  hideNativeSF();
  setTimeout(() => inp.focus(), 50);

  // Live-Suche
  let timer = null;
  inp.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      applyFilter(parseQuery(inp.value), grid, countEl);
    }, 100);
  });

  // Anfangszustand: Zeilenanzahl zählen
  applyFilter([], grid, countEl);

  // MutationObserver: Filter bei virtuellem Scroll neu anwenden
  const obs = new MutationObserver(() => {
    if (!lastTokens.length) return;
    clearTimeout(timer);
    timer = setTimeout(() => applyFilter(lastTokens, grid, countEl), 80);
  });
  obs.observe(grid, { childList: true, subtree: true, attributes: false });
  window[OBS_KEY] = obs;
})();
