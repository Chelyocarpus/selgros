/**
 * MHD-Entscheidung – F&R Bestellvorschlag
 *
 * Finds all rows where BV-Menge = 1 CO (skips PAL, PLL, PA2, …) and
 * suggests an optimal order quantity based on Prognose and RLZ:
 *   RLZ = Mindesthaltbarkeit zur Lieferzeit (days until expiry on delivery)
 *
 * Recommended quantity:
 *   Opt = ⌈(RLZ÷7 × Prog/KW − Bestand − PB) ÷ Faktor⌉
 *
 * Min. MHD calculation:
 *   Min. MHD = heute + ⌈(Bestand + Opt×Faktor) ÷ (Prog/KW÷7)⌉
 *   A warning (⚠) appears when the sell-through time exceeds RLZ.
 *
 * Bulk actions:
 *   • Alle → 0:    sets all CO-1er to 0 (skip order)
 *   • Alle → Opt.: applies the RLZ-based recommendation to every row
 *   • Row-level:   individual toggle per row (0 ↔ Opt.)
 *
 * Toggle: clicking the bookmarklet again removes the panel.
 */
(function () {
  'use strict';

  const PANEL_ID = '__bk_mhd_panel';

  /* ── Toggle off ────────────────────────────────────────────────────────────── */
  if (document.getElementById(PANEL_ID)) {
    document.getElementById(PANEL_ID).remove();
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

  const fi = (needle) => hdrs.findIndex(h => h.includes(needle));

  const COLS = {
    art:     fi('artikel-nr'),
    txt:     fi('artikel-text'),
    bv:      fi('bv-menge'),
    me:      fi('bestell-me'),   // ordering unit column (CO / PAL / PLL / …)
    prog:    fi('prog'),
    bestand: fi('bestand in'),
    faktor:  fi('faktor'),
    pb:      fi('pb in'),
    rlz:     fi('rlz'),
  };

  /* ── Native input setter (SAP UI5 compatible) ────────────────────────────── */
  function setInput(inp, val) {
    if (!inp) return;
    inp.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inp, String(val));
    inp.dispatchEvent(new Event('input',  { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.blur();
  }

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
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
    // Extract ordering unit from Bestell-ME column (button text or cell text)
    let me = '';
    if (COLS.me >= 0) {
      const meBtn = cells[COLS.me]?.querySelector('button');
      me = (meBtn?.textContent || cells[COLS.me]?.textContent || '').replace(/\s+/g, '').trim().toUpperCase();
    } else {
      // Fallback: try to parse BV cell text (works when unit is embedded, e.g. "1 CO")
      const bvText = (cells[COLS.bv]?.textContent || '').toUpperCase();
      const m = bvText.match(/\b(CO\d*|PAL|PLL|PA2|PCE|ST|KAR)\b/);
      me = m ? m[1] : '';
    }
    return {
      cells,
      art:     (cells[COLS.art]?.textContent || '').replace(/\s+/g, '').trim(),
      txt:     (cells[COLS.txt]?.textContent || '').replace(/\s+/g, ' ').trim(),
      bvInput: cells[COLS.bv]?.querySelector('input') || null,
      me,
      prog:    numCell(cells[COLS.prog]),
      bestand: numCell(cells[COLS.bestand]),
      faktor:  Math.max(1, numCell(cells[COLS.faktor])),
      pb:      numCell(cells[COLS.pb]),
      rlz:     numCell(cells[COLS.rlz]),
      row,
    };
  }

  /* ── Order quantity calculation (mirrors BV-Menge Auto-Fill) ────────────── */
  function calcOrderUnits(prog, bestand, pb, faktor, targetDays) {
    if (!prog) return 0;
    const neededBasis = Math.max(0, (targetDays / 7) * prog - (bestand + pb));
    return Math.ceil(neededBasis / faktor);
  }

  /* ── Min. MHD date calculation ─────────────────────────────────────────── */
  // Returns { date: Date, days: number, exceeds: boolean }
  // date  = the minimum acceptable best-before date for this delivery
  // days  = sell-through time in days
  // exceeds = true when sell-through > RLZ (spoilage risk)
  //
  // Math:  daily_rate = Prog/KW ÷ 7
  //        total_stock = Bestand + qty_basisME
  //        days_to_sell = ⌈total_stock / daily_rate⌉
  //        min_mhd = today + days_to_sell
  function calcMinMHD(bestand, qtyBasis, prog, rlz) {
    const dailyRate = prog / 7;
    if (dailyRate <= 0) return null;
    const totalStock = bestand + qtyBasis;
    const daysToSell = Math.ceil(totalStock / dailyRate);
    const date = new Date();
    date.setDate(date.getDate() + daysToSell);
    const perishable = rlz > 0 && rlz < 9999;
    return {
      date,
      days: daysToSell,
      exceeds: perishable && daysToSell > rlz,
    };
  }

  function fmtDate(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + '.' + mm + '.' + d.getFullYear();
  }

  /* ── Collect CO rows where BV-Menge = 1, calc RLZ-based recommendation ──── */
  function findEinser() {
    const results = [];
    for (const row of getDataRows()) {
      const d = getRowParts(row);
      if (!d.bvInput) continue;
      if (d.bvInput.value.trim() !== '1') continue;
      if (!/^CO\d*$/.test(d.me)) continue;  // only CO/CO2/CO3/… units; skip PAL, PLL, PA2…
      if (!d.rlz || d.rlz >= 9999) continue; // skip non-perishable (no RLZ basis)
      const full = calcOrderUnits(d.prog, d.bestand, d.pb, d.faktor, d.rlz);
      const qtyBasis = full * d.faktor;
      const mhd = calcMinMHD(d.bestand, qtyBasis, d.prog, d.rlz);
      results.push({ ...d, full, perishable: true, mhd });
    }
    return results;
  }

  /* ── Panel UI ─────────────────────────────────────────────────────────────── */
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = [
    'position:fixed;top:70px;right:16px;z-index:2147483646',
    'background:#fff;border-radius:8px;padding:14px 16px 12px',
    'box-shadow:0 4px 20px rgba(0,0,0,.22)',
    'font-family:72,Arial,sans-serif;font-size:12px;color:#32363a',
    'min-width:340px;max-width:480px;border:1px solid #e0e0e0;user-select:none',
  ].join(';');

  /* header / drag handle */
  const hdr = document.createElement('div');
  hdr.style.cssText = 'font-weight:bold;font-size:13px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;cursor:grab';

  let _drag = false, _dx = 0, _dy = 0;
  hdr.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    _drag = true;
    const r = panel.getBoundingClientRect();
    _dx = e.clientX - r.left;
    _dy = e.clientY - r.top;
    panel.style.right = 'auto';
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
  hTitle.textContent = 'MHD-Entscheidung';

  const hClose = document.createElement('button');
  hClose.type = 'button';
  hClose.textContent = '\u00d7';
  hClose.setAttribute('aria-label', 'Panel schlie\u00dfen');
  hClose.style.cssText = 'background:none;border:none;font-size:17px;line-height:1;cursor:pointer;color:#6a6d70;padding:0;flex-shrink:0';
  hClose.addEventListener('click', e => { e.stopPropagation(); panel.remove(); });

  hdr.appendChild(hTitle);
  hdr.appendChild(hClose);
  panel.appendChild(hdr);

  /* description */
  const desc = document.createElement('div');
  desc.style.cssText = 'font-size:11px;color:#6a6d70;margin-bottom:8px;line-height:1.5';
  desc.textContent = 'BV-Menge\u00a0=\u00a01\u00a0CO: Empfohlene Menge auf Basis von Prognose und RLZ (Mindesthaltbarkeit zur Lieferzeit). Min.\u00a0MHD = letzter Verkaufstermin der Lieferung.';
  panel.appendChild(desc);

  /* formula display */
  const fml = document.createElement('div');
  fml.style.cssText = 'font-size:10px;color:#8b90a8;margin-bottom:10px;line-height:1.5;padding:5px 7px;background:#f7f7f7;border-radius:4px';
  fml.textContent = 'Opt.\u00a0= \u2308(RLZ\u00f77\u00d7Prog/KW \u2212 Bestand \u2212 PB) \u00f7 Faktor\u2309 \u2502 Min.\u00a0MHD = heute\u00a0+\u00a0\u2308(Bestand\u00a0+\u00a0Opt.\u00d7Faktor)\u00f7(Prog/KW\u00f77)\u2309';
  panel.appendChild(fml);


  /* feedback line */
  const fbLine = document.createElement('div');
  fbLine.style.cssText = 'font-size:11px;min-height:16px;margin-bottom:8px;font-weight:600';
  panel.appendChild(fbLine);

  function showFeedback(msg, color) {
    if (!document.getElementById(PANEL_ID)) return;
    fbLine.style.color = color || '#107e3e';
    fbLine.textContent = msg;
  }

  /* scrollable table wrapper */
  const tableWrap = document.createElement('div');
  tableWrap.style.cssText = 'display:none;max-height:260px;overflow-y:auto;border:1px solid #e8e8e8;border-radius:4px;margin-bottom:10px';
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:11px';
  const thead = document.createElement('thead');
  const theadRow = document.createElement('tr');
  theadRow.style.cssText = 'background:#f4f4f4';
  ['Art.-Nr', 'Artikel-Text', 'Opt.', 'Min.\u00a0MHD', ''].forEach(lbl => {
    const th = document.createElement('th');
    th.style.cssText = 'padding:4px 6px;text-align:left;color:#6a6d70;font-weight:600;white-space:nowrap;border-bottom:1px solid #e8e8e8;font-size:10px;position:sticky;top:0;background:#f4f4f4';
    th.textContent = lbl;
    theadRow.appendChild(th);
  });
  thead.appendChild(theadRow);
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  panel.appendChild(tableWrap);

  /* ── Render table rows ──────────────────────────────────────────────────── */
  let currentItems = [];

  function renderTable(items) {
    currentItems = items;
    tbody.innerHTML = '';
    items.forEach((item, i) => {
      const tr = document.createElement('tr');
      tr.style.cssText = `background:${i % 2 === 0 ? '#fff' : '#fafafa'};cursor:pointer`;
      tr.addEventListener('click', () => {
        item.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.row.style.outline = '2px solid #e65100';
        setTimeout(() => { item.row.style.outline = ''; }, 1500);
      });

      // Artikel-Nr
      const tdArt = document.createElement('td');
      tdArt.style.cssText = 'padding:3px 6px;color:#32363a;border-bottom:1px solid #f0f0f0;white-space:nowrap';
      tdArt.textContent = item.art;

      // Artikel-Text (truncated)
      const tdTxt = document.createElement('td');
      tdTxt.style.cssText = 'padding:3px 6px;color:#6a6d70;border-bottom:1px solid #f0f0f0;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      tdTxt.textContent = item.txt.length > 20 ? item.txt.slice(0, 17) + '\u2026' : item.txt;
      tdTxt.title = item.txt;

      // Voll (calculated)
      const tdFull = document.createElement('td');
      tdFull.style.cssText = 'padding:3px 6px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#107e3e;white-space:nowrap';
      tdFull.textContent = item.full || '\u2013';

      // Min. MHD date
      const tdMhd = document.createElement('td');
      tdMhd.style.cssText = 'padding:3px 6px;border-bottom:1px solid #f0f0f0;white-space:nowrap';
      if (item.mhd) {
        const dateStr = fmtDate(item.mhd.date);
        const daysStr = item.mhd.days + '\u00a0Tage';
        if (item.mhd.exceeds) {
          // Sell-through exceeds RLZ → spoilage risk
          tdMhd.style.color = '#c62828';
          tdMhd.style.fontWeight = '600';
          tdMhd.textContent = dateStr + ' ';
          const warn = document.createElement('span');
          warn.style.cssText = 'display:inline-block;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;color:#fff;background:#e65100;vertical-align:middle';
          warn.textContent = '\u26a0';
          warn.title = 'Abverkauf ' + daysStr + ' > RLZ ' + item.rlz + 'd \u2013 Verderbgefahr!';
          tdMhd.appendChild(warn);
        } else if (item.perishable) {
          tdMhd.style.color = '#e65100';
          tdMhd.style.fontWeight = '600';
          tdMhd.textContent = dateStr;
          tdMhd.title = 'Abverkauf ' + daysStr + ' (RLZ ' + item.rlz + 'd \u2013 OK)';
        } else {
          tdMhd.style.color = '#32363a';
          tdMhd.textContent = dateStr;
          tdMhd.title = 'Abverkauf ' + daysStr;
        }
      } else {
        tdMhd.style.color = '#bbb';
        tdMhd.textContent = '\u2013';
        tdMhd.title = 'Keine Prognose';
      }

      // Toggle button
      const tdBtn = document.createElement('td');
      tdBtn.style.cssText = 'padding:3px 6px;border-bottom:1px solid #f0f0f0;text-align:center';
      const togBtn = document.createElement('button');
      togBtn.type = 'button';
      togBtn.style.cssText = 'background:none;border:1px solid #d9d9d9;border-radius:3px;font-size:10px;font-weight:600;cursor:pointer;padding:2px 6px;font-family:72,Arial,sans-serif;color:#32363a';
      togBtn.textContent = '\u2192 0';
      togBtn.title = 'Auf 0 setzen';
      let isZero = false;
      togBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!isZero) {
          setInput(item.bvInput, 0);
          togBtn.textContent = '\u2192 ' + (item.full || 1);
          togBtn.title = 'Auf ' + (item.full || 1) + ' setzen';
          togBtn.style.color = '#c62828';
          isZero = true;
        } else {
          setInput(item.bvInput, item.full || 1);
          togBtn.textContent = '\u2192 0';
          togBtn.title = 'Auf 0 setzen';
          togBtn.style.color = '#32363a';
          isZero = false;
        }
      });
      tdBtn.appendChild(togBtn);

      tr.appendChild(tdArt);
      tr.appendChild(tdTxt);
      tr.appendChild(tdFull);
      tr.appendChild(tdMhd);
      tr.appendChild(tdBtn);
      tbody.appendChild(tr);
    });
  }

  /* ── Action buttons ─────────────────────────────────────────────────────── */
  const actRow = document.createElement('div');
  actRow.style.cssText = 'display:flex;gap:6px;margin-bottom:4px';

  // Scan button
  const scanBtn = document.createElement('button');
  scanBtn.type = 'button';
  scanBtn.textContent = 'Scannen';
  scanBtn.style.cssText = 'flex:2;height:32px;border-radius:4px;border:none;background:#e65100;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:72,Arial,sans-serif';
  scanBtn.addEventListener('click', () => {
    const items = findEinser();
    if (!items.length) {
      showFeedback('Keine CO-Artikel mit BV\u00a0=\u00a01 gefunden.', '#6a6d70');
      tableWrap.style.display = 'none';
      bulkRow.style.display = 'none';
      return;
    }
    const exceed = items.filter(i => i.mhd && i.mhd.exceeds).length;
    const suffix = exceed ? ` \u2013 ${exceed}\u00d7\u00a0\u26a0 Verderbgefahr` : '';
    showFeedback(`${items.length} BV\u00a0=\u00a01\u00a0CO gefunden${suffix}`, exceed ? '#c62828' : '#e65100');
    renderTable(items);
    tableWrap.style.display = 'block';
    bulkRow.style.display = 'flex';
  });

  actRow.appendChild(scanBtn);
  panel.appendChild(actRow);

  /* bulk action buttons (initially hidden) */
  const bulkRow = document.createElement('div');
  bulkRow.style.cssText = 'display:none;gap:6px;margin-top:6px';

  const allZeroBtn = document.createElement('button');
  allZeroBtn.type = 'button';
  allZeroBtn.textContent = 'Alle \u2192 0';
  allZeroBtn.style.cssText = 'flex:1;height:30px;border-radius:4px;border:1px solid #bb0000;background:#fff;color:#bb0000;font-size:12px;font-weight:600;cursor:pointer;font-family:72,Arial,sans-serif';
  allZeroBtn.addEventListener('click', () => {
    let count = 0;
    for (const item of currentItems) {
      if (item.bvInput) { setInput(item.bvInput, 0); count++; }
    }
    showFeedback(`${count} \u2192 0 gesetzt`, '#c62828');
  });

  const allFullBtn = document.createElement('button');
  allFullBtn.type = 'button';
  allFullBtn.textContent = 'Alle \u2192 Opt.';
  allFullBtn.style.cssText = 'flex:1;height:30px;border-radius:4px;border:none;background:#107e3e;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:72,Arial,sans-serif';
  allFullBtn.addEventListener('click', () => {
    let count = 0;
    for (const item of currentItems) {
      if (item.bvInput && item.full > 0) { setInput(item.bvInput, item.full); count++; }
    }
    showFeedback(`${count} \u2192 Opt. gesetzt`, '#107e3e');
  });

  bulkRow.appendChild(allZeroBtn);
  bulkRow.appendChild(allFullBtn);
  panel.appendChild(bulkRow);

  /* hint */
  const hint = document.createElement('div');
  hint.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid #f0f0f0;font-size:10px;color:#8b90a8;line-height:1.5';
  hint.textContent = 'Opt. = empfohlene Bestellmenge auf Basis des RLZ-Zeitraums. Min.\u00a0MHD = Datum, bis zu dem die letzte Einheit verkauft sein muss. \u26a0 = Abverkauf > RLZ (Verderbgefahr).';
  panel.appendChild(hint);

  document.body.appendChild(panel);
}());
