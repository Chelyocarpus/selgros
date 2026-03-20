/**
 * BV-Menge Auto-Fill – F&R Bestellvorschlag
 *
 * Features:
 *   • Befüllen:  füllt BV-Menge aller sichtbaren Zeilen basierend auf einer
 *     Ziel-Reichweite in Tagen.
 *     Formel: ceil(max(0, (targetDays/7 × Prog) − Bestand) / Faktor)
 *   • Leeren:    setzt alle BV-Menge-Felder auf 0.
 *   • ME-Wächter: leert BV-Menge automatisch, wenn Bestell-ME einer Zeile
 *     geändert wird — verhindert falsche Mengen nach Einheitenwechsel.
 *
 * Toggle: Bookmarklet erneut klicken → entfernt Panel & deaktiviert ME-Wächter.
 */
(function () {
  'use strict';

  const PANEL_ID = '__bk_bvfill_panel';
  const OBS_KEY  = '__bk_bvfill_teardown';

  /* ── Toggle off ────────────────────────────────────────────────────────────── */
  if (document.getElementById(PANEL_ID)) {
    document.getElementById(PANEL_ID).remove();
    if (window[OBS_KEY]) { window[OBS_KEY](); delete window[OBS_KEY]; }
    return;
  }

  /* ── Grid & column detection ──────────────────────────────────────────────── */
  function getMainGrid() {
    for (const g of document.querySelectorAll('[role="grid"]')) {
      for (const h of g.querySelectorAll('[role="columnheader"]')) {
        if ((h.textContent || '').toLowerCase().includes('rw bestand')) return g;
      }
    }
    return null;
  }

  const mainGrid = getMainGrid();

  if (!mainGrid) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#c62828;color:#fff;padding:12px 18px;border-radius:6px;font-size:14px;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.3);font-family:72,Arial,sans-serif';
    toast.textContent = 'Kein BV-Raster gefunden. Bitte \u00f6ffne den Bestellvorschlag.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
    return;
  }

  const hdrs = Array.from(mainGrid.querySelectorAll('[role="columnheader"]'))
    .map(h => h.textContent.trim().toLowerCase());

  const COLS = {
    bv:      hdrs.findIndex(h => h.includes('bv-menge')),
    me:      hdrs.findIndex(h => h.includes('bestell-me')),
    prog:    hdrs.findIndex(h => h.includes('prog')),
    bestand: hdrs.findIndex(h => h.includes('bestand in')),
    faktor:  hdrs.findIndex(h => h.includes('faktor')),
    pb:      hdrs.findIndex(h => h.includes('pb in')),
  };

  /* ── Native input setter (compatible with SAP UI5 / React value tracking) ─── */
  function setInput(inp, val) {
    if (!inp) return;
    inp.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inp, String(val));
    inp.dispatchEvent(new Event('input',  { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.blur();
  }

  /* ── Row helpers ─────────────────────────────────────────────────────────── */
  function numCell(cell) {
    return parseFloat(
      (cell?.textContent || '').replace(/Hervorgehoben/g, '').replace(/\s/g, '').replace(',', '.')
    ) || 0;
  }

  function getDataRows() {
    return Array.from(mainGrid.querySelectorAll('[role="row"]'))
      .filter(r => r.querySelector('[role="gridcell"]'));
  }

  function getRowParts(row) {
    const cells = Array.from(row.querySelectorAll('[role="gridcell"]'));
    return {
      cells,
      bvInput: cells[COLS.bv]?.querySelector('input') || null,
      meBtn:   cells[COLS.me]?.querySelector('button') || null,
      prog:    numCell(cells[COLS.prog]),
      bestand: numCell(cells[COLS.bestand]),
      faktor:  Math.max(1, numCell(cells[COLS.faktor])),
      pb:      numCell(cells[COLS.pb]),
    };
  }

  /* ── Calculation ────────────────────────────────────────────────────────── */
  // Returns Bestell-ME units to order to reach targetDays of coverage.
  // Mirrors SAP's RW formula: RW = (Bestand + PB) / Prog × 7,
  // so we include PB to avoid ordering when displayed RW already meets target.
  function calcOrderUnits(prog, bestand, pb, faktor, targetDays) {
    if (!prog) return 0;
    const neededBasis = Math.max(0, (targetDays / 7) * prog - (bestand + pb));
    return Math.ceil(neededBasis / faktor);
  }

  /* ── Fill / clear operations ─────────────────────────────────────────────── */
  function fillAll(targetDays, onlyEmpty) {
    let filled = 0, skipped = 0;
    for (const row of getDataRows()) {
      const { bvInput, prog, bestand, pb, faktor } = getRowParts(row);
      if (!bvInput) continue;
      if (onlyEmpty && bvInput.value !== '' && bvInput.value !== '0') { skipped++; continue; }
      const qty = calcOrderUnits(prog, bestand, pb, faktor, targetDays);
      if (qty > 0) { setInput(bvInput, qty); filled++; }
    }
    return { filled, skipped };
  }

  function clearAll() {
    let cleared = 0;
    for (const row of getDataRows()) {
      const { bvInput } = getRowParts(row);
      if (!bvInput) continue;
      if (bvInput.value !== '' && bvInput.value !== '0') { setInput(bvInput, 0); cleared++; }
    }
    return cleared;
  }

  /* ── ME-change watcher ──────────────────────────────────────────────────── */
  // When user clicks an ME button, poll until the text changes (SAP dialog closed).
  // On change: clear the corresponding BV-Menge to prevent wrong-unit orders.
  function watchMeChange(meBtn, bvInput) {
    const prevText = meBtn.textContent.trim();
    let polls = 0;
    const poll = () => {
      const newText = meBtn.textContent.trim();
      if (newText && prevText && newText !== prevText) {
        if (bvInput && bvInput.value !== '' && bvInput.value !== '0') {
          setInput(bvInput, 0);
          showFeedback(`ME ${prevText}\u2192${newText}: BV geleert`, '#8b90a8');
        }
        return;
      }
      if (++polls < 20) setTimeout(poll, 250); // poll for up to 5 s
    };
    setTimeout(poll, 300);
  }

  function onMEClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const row = btn.closest('[role="row"]');
    if (!row) return;
    const cells = Array.from(row.querySelectorAll('[role="gridcell"]'));
    if (!cells[COLS.me]?.contains(btn)) return;
    const bvInput = cells[COLS.bv]?.querySelector('input');
    watchMeChange(btn, bvInput);
  }

  mainGrid.addEventListener('click', onMEClick, true);

  // Register teardown for toggle-off
  window[OBS_KEY] = () => mainGrid.removeEventListener('click', onMEClick, true);

  /* ── Panel UI ─────────────────────────────────────────────────────────────── */
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = [
    'position:fixed;top:70px;left:16px;z-index:2147483646',
    'background:#fff;border-radius:8px;padding:14px 16px 12px',
    'box-shadow:0 4px 20px rgba(0,0,0,.22)',
    'font-family:72,Arial,sans-serif;font-size:12px;color:#32363a',
    'min-width:230px;border:1px solid #e0e0e0;user-select:none',
  ].join(';');

  /* header / drag handle */
  const hdr = document.createElement('div');
  hdr.style.cssText = 'font-weight:bold;font-size:13px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;cursor:grab';

  let _drag = false, _dx = 0, _dy = 0;
  hdr.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    _drag = true;
    const r = panel.getBoundingClientRect();
    _dx = e.clientX - r.left;
    _dy = e.clientY - r.top;
    panel.style.top  = r.top  + 'px';
    panel.style.left = r.left + 'px';
    e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!_drag) return;
    panel.style.left = (e.clientX - _dx) + 'px';
    panel.style.top  = (e.clientY - _dy) + 'px';
  });
  document.addEventListener('pointerup', () => { _drag = false; });

  const hTitle = document.createElement('span');
  hTitle.textContent = 'BV-Menge Auto-Fill';

  const hClose = document.createElement('button');
  hClose.type = 'button';
  hClose.textContent = '\u00d7';
  hClose.setAttribute('aria-label', 'Panel schlie\u00dfen');
  hClose.style.cssText = 'background:none;border:none;font-size:17px;line-height:1;cursor:pointer;color:#6a6d70;padding:0;flex-shrink:0';
  hClose.addEventListener('click', e => { e.stopPropagation(); panel.remove(); });

  hdr.appendChild(hTitle);
  hdr.appendChild(hClose);
  panel.appendChild(hdr);

  /* section label */
  const sLbl = document.createElement('div');
  sLbl.style.cssText = 'font-size:11px;color:#6a6d70;margin-bottom:6px';
  sLbl.textContent = 'Ziel-Reichweite (Tage)';
  panel.appendChild(sLbl);

  /* quick-select day buttons: 7 / 14 / 21 */
  const qRow = document.createElement('div');
  qRow.style.cssText = 'display:flex;gap:4px;margin-bottom:8px';
  let selectedDays = 14;
  const dayBtns = [];

  [7, 14, 21].forEach(d => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = d + 'd';
    const active = d === selectedDays;
    btn.style.cssText = `flex:1;height:28px;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer;${
      active ? 'background:#0a6ed1;color:#fff;border:1px solid #0a6ed1'
             : 'background:#f4f4f4;color:#32363a;border:1px solid #d9d9d9'
    }`;
    btn.addEventListener('click', () => {
      selectedDays = d;
      customInput.value = '';
      dayBtns.forEach(b => {
        const sel = b === btn;
        b.style.background  = sel ? '#0a6ed1' : '#f4f4f4';
        b.style.color       = sel ? '#fff'    : '#32363a';
        b.style.borderColor = sel ? '#0a6ed1' : '#d9d9d9';
      });
    });
    dayBtns.push(btn);
    qRow.appendChild(btn);
  });
  panel.appendChild(qRow);

  /* custom day input */
  const customInput = document.createElement('input');
  customInput.type        = 'number';
  customInput.min         = '1';
  customInput.max         = '365';
  customInput.placeholder = 'Eigene Tage\u2026';
  customInput.style.cssText = 'width:100%;height:28px;font-size:12px;border:1px solid #d9d9d9;border-radius:4px;padding:0 8px;box-sizing:border-box;margin-bottom:10px;color:#32363a;font-family:72,Arial,sans-serif;outline:none';
  customInput.addEventListener('input', () => {
    const v = parseInt(customInput.value, 10);
    if (v > 0) {
      selectedDays = v;
      dayBtns.forEach(b => { b.style.background = '#f4f4f4'; b.style.color = '#32363a'; b.style.borderColor = '#d9d9d9'; });
    }
  });
  panel.appendChild(customInput);

  /* only-empty checkbox */
  const chkLabel = document.createElement('label');
  chkLabel.style.cssText = 'display:flex;align-items:center;gap:7px;font-size:12px;color:#32363a;margin-bottom:12px;cursor:pointer;user-select:none';
  const chk = document.createElement('input');
  chk.type    = 'checkbox';
  chk.checked = true;
  chk.style.cssText = 'width:14px;height:14px;accent-color:#0a6ed1;cursor:pointer';
  const chkSpan = document.createElement('span');
  chkSpan.textContent = 'Nur leere Felder bef\u00fcllen';
  chkLabel.appendChild(chk);
  chkLabel.appendChild(chkSpan);
  panel.appendChild(chkLabel);

  /* feedback line */
  const fbLine = document.createElement('div');
  fbLine.style.cssText = 'font-size:11px;min-height:16px;margin-bottom:8px;font-weight:600';
  panel.appendChild(fbLine);

  function showFeedback(msg, color) {
    if (!document.getElementById(PANEL_ID)) return;
    fbLine.style.color = color || '#107e3e';
    fbLine.textContent = msg;
  }

  /* action buttons */
  const actRow = document.createElement('div');
  actRow.style.cssText = 'display:flex;gap:8px';

  const fillBtn = document.createElement('button');
  fillBtn.type = 'button';
  fillBtn.textContent = 'Bef\u00fcllen';
  fillBtn.style.cssText = 'flex:2;height:32px;border-radius:4px;border:none;background:#0a6ed1;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:72,Arial,sans-serif';
  fillBtn.addEventListener('click', () => {
    const { filled, skipped } = fillAll(selectedDays, chk.checked);
    const skipNote = skipped ? `, ${skipped} \u00fcbersprungen` : '';
    showFeedback(
      filled > 0 ? `${filled} Zeile${filled !== 1 ? 'n' : ''} bef\u00fcllt${skipNote}` : `Nichts zu tun${skipNote}`,
      filled > 0 ? '#107e3e' : '#6a6d70',
    );
  });

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = 'Leeren';
  clearBtn.style.cssText = 'flex:1;height:32px;border-radius:4px;border:1px solid #bb0000;background:#fff;color:#bb0000;font-size:13px;font-weight:600;cursor:pointer;font-family:72,Arial,sans-serif';
  clearBtn.addEventListener('click', () => {
    const cleared = clearAll();
    showFeedback(cleared > 0 ? `${cleared} Felder geleert` : 'Keine Felder mit Wert', '#6a6d70');
  });

  actRow.appendChild(fillBtn);
  actRow.appendChild(clearBtn);
  panel.appendChild(actRow);

  /* ME-watcher hint */
  const hint = document.createElement('div');
  hint.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid #f0f0f0;font-size:10px;color:#8b90a8;line-height:1.5';
  hint.textContent = 'BV-Menge wird bei Bestell-ME-\u00c4nderung auto. geleert.';
  panel.appendChild(hint);

  document.body.appendChild(panel);
}());
