/**
 * PB-Empfehlung – F&R Bestellvorschlag
 *
 * Analysiert den Präsentationsbestand (PB in Basis-ME) aller sichtbaren Zeilen
 * und empfiehlt einen Ziel-PB basierend auf dem Ø Prog/KW.
 *
 * Formel: Empf.-PB = min(⌈(Prog/KW ÷ 7) × Ziel-Tage⌉, ⌊(Prog/KW ÷ 7) × RLZ⌋)
 *   Für Frischartikel (RLZ < 9999) wird die Empfehlung auf den RLZ-basierten
 *   Maximalwert begrenzt — mehr auf dem Regal könnte verderben.
 *
 * Status-Einstufung (konfigurierbar über Schwellenwerte unten):
 *   Kein PB    – PB = 0              → nicht gesetzt
 *   Zu niedrig – Ist-PB < 80 %  des Empf.-PB
 *   Zu hoch    – Ist-PB > 150 % des Empf.-PB
 *   OK         – Ist-PB ∈ 80–150 % des Empf.-PB
 *
 * Zusatzhinweise (farbige Dot-Badges direkt hinter dem PB-Wert):
 *   ⚠ Verderb   – Ist-PB > RLZ-Maximum → Artikel droht zu verfallen
 *   RLZ↓        – Empf.-PB wird durch RLZ begrenzt (Frischartikel)
 *
 * Overlays: Farbige Badges werden direkt in die PB-Spalte der Tabelle injiziert.
 * Toggle:   Bookmarklet erneut klicken → Panel + alle Badges werden entfernt.
 */
(function () {
  'use strict';

  const PANEL_ID  = '__bk_pb_panel';
  const BADGE_CLS = '__bk_pb_badge';
  const WARN_ID   = '__bk_pb_warn';

  // Klassifizierungs-Schwellenwerte (Anteil des Empf.-PB)
  const THRESH_LOW  = 0.80;  // Ist < 80 % → zu niedrig
  const THRESH_HIGH = 1.50;  // Ist > 150 % → zu hoch

  /* ── Toggle off ─────────────────────────────────────────────────────────── */
  if (document.getElementById(PANEL_ID)) {
    document.getElementById(PANEL_ID).remove();
    document.querySelectorAll('.' + BADGE_CLS).forEach(b => b.remove());
    return;
  }

  /* ── Grid detection ─────────────────────────────────────────────────────── */
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
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#c62828;color:#fff;padding:12px 18px;border-radius:6px;font-size:14px;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.3);font-family:72,Arial,sans-serif';
    t.textContent = 'Kein BV-Raster gefunden. Bitte öffne den Bestellvorschlag.';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
    return;
  }

  /* ── Column detection ───────────────────────────────────────────────────── */
  const hdrs = Array.from(mainGrid.querySelectorAll('[role="columnheader"]'))
    .map(h => h.textContent.trim().toLowerCase());

  const fi = s => hdrs.findIndex(h => h.includes(s));

  const COLS = {
    art:  fi('artikel-nr'),
    txt:  fi('artikel-text'),
    prog: fi('prog'),
    bst:  fi('bestand in'),
    fak:  fi('faktor'),
    rlz:  fi('rlz'),
    pb:   fi('pb in'),
  };

  // RLZ = 9999 means no MHD restriction (non-perishable)
  const RLZ_UNLIMITED = 9999;

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function numCell(cell) {
    return parseFloat(
      (cell?.textContent || '').replace(/Hervorgehoben/g, '').replace(/\s/g, '').replace(',', '.')
    ) || 0;
  }

  function getDataRows() {
    return Array.from(mainGrid.querySelectorAll('[role="row"]'))
      .filter(r => r.querySelector('[role="gridcell"]'));
  }

  function getRowData(row) {
    const cells = Array.from(row.querySelectorAll('[role="gridcell"]'));
    const rlzRaw = numCell(cells[COLS.rlz]);
    return {
      cells,
      art:  (cells[COLS.art]?.textContent  || '').replace(/\s+/g, '').trim(),
      txt:  (cells[COLS.txt]?.textContent  || '').replace(/\s+/g, ' ').trim().substring(0, 30),
      prog: numCell(cells[COLS.prog]),
      bst:  numCell(cells[COLS.bst]),
      fak:  Math.max(1, numCell(cells[COLS.fak])),
      rlz:  rlzRaw,
      pb:   numCell(cells[COLS.pb]),
    };
  }

  /* ── Core formula ───────────────────────────────────────────────────────── */
  // Max PB before items expire: for perishables, cap at what can be sold within RLZ.
  function maxPBbyRLZ(prog, rlz) {
    if (rlz <= 0 || rlz >= RLZ_UNLIMITED) return Infinity;
    return Math.floor((prog / 7) * rlz);
  }

  // Empf.-PB in Basis-ME: Tagesdurchschnitt × Ziel-Tage, aufgerundet,
  // dann für Frischartikel auf den RLZ-basierten Maximalwert begrenzt.
  function recommendPB(prog, targetDays, rlz) {
    if (prog <= 0) return 0;
    const wantedPB = Math.ceil((prog / 7) * targetDays);
    const limitPB  = maxPBbyRLZ(prog, rlz);
    return Math.min(wantedPB, limitPB);
  }

  /* ── Status classification ──────────────────────────────────────────────── */
  function classifyStatus(istPB, recPB) {
    if (istPB === 0)                  return 'missing';  // kein PB gesetzt
    if (istPB < recPB * THRESH_LOW)   return 'low';      // zu niedrig
    if (istPB > recPB * THRESH_HIGH)  return 'high';     // zu hoch
    return 'ok';
  }

  const STATUS_COLOR = { missing: '#c62828', low: '#e53935', high: '#e65100', ok: '#107e3e' };
  const STATUS_LABEL = { missing: 'Kein PB', low: 'Zu niedrig', high: 'Zu hoch', ok: 'OK' };

  /* ── Analysis ───────────────────────────────────────────────────────────── */
  function analyze(targetDays) {
    const results = [];
    for (const row of getDataRows()) {
      const d = getRowData(row);
      if (!d.art || d.prog <= 0) continue;
      const perishable = d.rlz > 0 && d.rlz < RLZ_UNLIMITED;
      const recPB      = recommendPB(d.prog, targetDays, d.rlz);
      const rlzMax     = perishable ? maxPBbyRLZ(d.prog, d.rlz) : Infinity;
      const rlzCapped  = perishable && recPB < Math.ceil((d.prog / 7) * targetDays);
      const overRLZ    = perishable && d.pb > rlzMax;  // Ist-PB exceeds RLZ → Verderbgefahr
      const status     = classifyStatus(d.pb, recPB);
      results.push({ ...d, row, recPB, rlzMax, perishable, rlzCapped, overRLZ, status });
    }
    return results;
  }

  /* ── Badge overlays ─────────────────────────────────────────────────────── */
  function clearBadges() {
    document.querySelectorAll('.' + BADGE_CLS).forEach(b => b.remove());
  }

  function applyBadges(results) {
    clearBadges();
    for (const r of results) {
      const pbCell = r.cells[COLS.pb];
      if (pbCell) {
        // Status dot — colored circle, recommendation + status label in tooltip
        const b = document.createElement('span');
        b.className = BADGE_CLS;
        const rlzNote = r.rlzCapped ? ` · RLZ begrenzt auf ${r.recPB} (RLZ=${r.rlz}d)` : '';
        b.title = `Empfehlung: ${r.recPB} Basis-ME · Status: ${STATUS_LABEL[r.status]}${rlzNote}`;
        b.style.cssText = `display:inline;font-size:14px;margin-left:2px;color:${STATUS_COLOR[r.status]};cursor:default;line-height:1;vertical-align:middle`;
        b.textContent = '\u25cf';
        const innerSpan = pbCell.querySelector('.sapMObjectNumberInner') || pbCell;
        innerSpan.style.whiteSpace = 'nowrap';
        innerSpan.appendChild(b);

        // RLZ-capped indicator for perishables
        if (r.rlzCapped) {
          const rb = document.createElement('span');
          rb.className = BADGE_CLS;
          rb.title = `RLZ = ${r.rlz} Tage → max. PB = ${r.rlzMax} Basis-ME`;
          rb.style.cssText = 'display:inline-block;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;margin-left:3px;color:#fff;vertical-align:middle;white-space:nowrap;background:#00838f;cursor:default';
          rb.textContent = 'RLZ↓';
          pbCell.appendChild(rb);
        }

        // Verderbgefahr: Ist-PB exceeds what can be sold within RLZ
        if (r.overRLZ) {
          const vb = document.createElement('span');
          vb.className = BADGE_CLS;
          vb.title = `Ist-PB (${r.pb}) > RLZ-Max (${r.rlzMax}) – Verderbgefahr!`;
          vb.style.cssText = 'display:inline-block;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;margin-left:3px;color:#fff;vertical-align:middle;white-space:nowrap;background:#e65100;cursor:default';
          vb.textContent = '⚠ Verderb';
          pbCell.appendChild(vb);
        }
      }

    }
  }

  /* ── Panel ──────────────────────────────────────────────────────────────── */
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText = 'position:fixed;top:70px;left:16px;z-index:2147483646;background:#fff;border-radius:8px;padding:14px 16px 12px;box-shadow:0 4px 20px rgba(0,0,0,.22);font-family:72,Arial,sans-serif;font-size:12px;color:#32363a;min-width:240px;max-width:300px;border:1px solid #e0e0e0;user-select:none';

  /* Title bar */
  const hdr = document.createElement('div');
  hdr.style.cssText = 'font-weight:bold;font-size:13px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;cursor:grab';

  const htSpan = document.createElement('span');
  htSpan.textContent = 'PB-Empfehlung';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Panel schließen');
  closeBtn.style.cssText = 'background:none;border:none;font-size:17px;line-height:1;cursor:pointer;color:#6a6d70;padding:0;flex-shrink:0';
  closeBtn.addEventListener('click', () => { panel.remove(); clearBadges(); });

  hdr.appendChild(htSpan);
  hdr.appendChild(closeBtn);
  panel.appendChild(hdr);

  /* Formula hint */
  const fml = document.createElement('div');
  fml.style.cssText = 'font-size:10px;color:#8b90a8;margin-bottom:10px;line-height:1.5;padding:5px 7px;background:#f7f7f7;border-radius:4px';
  fml.textContent = 'Empf.-PB = min(⌈Prog÷7×d⌉, ⌊Prog÷7×RLZ⌋)';
  panel.appendChild(fml);

  /* Days label */
  const daysLbl = document.createElement('div');
  daysLbl.style.cssText = 'font-size:11px;color:#6a6d70;margin-bottom:5px';
  daysLbl.textContent = 'Ziel-Tage für PB-Empfehlung:';
  panel.appendChild(daysLbl);

  /* Quick-day buttons (default: 3d) */
  let selDays = 3;
  const qr = document.createElement('div');
  qr.style.cssText = 'display:flex;gap:4px;margin-bottom:6px';

  // Custom input created early so button-click handlers can reference it via closure
  const customInput = document.createElement('input');
  customInput.type = 'number';
  customInput.min = '1';
  customInput.max = '30';
  customInput.placeholder = 'eigene';
  customInput.setAttribute('aria-label', 'Eigene Ziel-Tage eingeben');
  customInput.style.cssText = 'width:56px;height:26px;border-radius:4px;border:1px solid #d9d9d9;padding:0 6px;font-size:11px;color:#32363a;font-family:72,Arial,sans-serif;box-sizing:border-box';

  const dBtns = [];
  [2, 3, 5, 7].forEach(d => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = d + 'd';
    const active = d === selDays;
    btn.style.cssText = `flex:1;height:26px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;${active ? 'background:#6c3483;color:#fff;border:1px solid #6c3483' : 'background:#f4f4f4;color:#32363a;border:1px solid #d9d9d9'}`;
    btn.addEventListener('click', () => {
      selDays = d;
      customInput.value = '';
      dBtns.forEach(b => {
        const s = b === btn;
        b.style.background  = s ? '#6c3483' : '#f4f4f4';
        b.style.color       = s ? '#fff'    : '#32363a';
        b.style.borderColor = s ? '#6c3483' : '#d9d9d9';
      });
    });
    dBtns.push(btn);
    qr.appendChild(btn);
  });
  panel.appendChild(qr);

  /* Custom days input row */
  const customRow = document.createElement('div');
  customRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:10px';
  customInput.addEventListener('input', () => {
    const v = parseInt(customInput.value, 10);
    if (v > 0) {
      selDays = v;
      dBtns.forEach(b => {
        b.style.background  = '#f4f4f4';
        b.style.color       = '#32363a';
        b.style.borderColor = '#d9d9d9';
      });
    }
  });
  const customLbl = document.createElement('span');
  customLbl.style.cssText = 'font-size:11px;color:#6a6d70';
  customLbl.textContent = 'Tage (eigene)';
  customRow.appendChild(customInput);
  customRow.appendChild(customLbl);
  panel.appendChild(customRow);

  /* Feedback line */
  const fb = document.createElement('div');
  fb.style.cssText = 'font-size:11px;min-height:16px;margin-bottom:8px;font-weight:600';
  panel.appendChild(fb);

  /* Result table – hidden until first analysis */
  const tblWrap = document.createElement('div');
  tblWrap.style.cssText = 'display:none;max-height:200px;overflow-y:auto;border:1px solid #e8e8e8;border-radius:4px;margin-bottom:10px';

  const tbl   = document.createElement('table');
  tbl.style.cssText = 'width:100%;border-collapse:collapse;font-size:11px';

  const thead = document.createElement('thead');
  const hrow  = document.createElement('tr');
  hrow.style.cssText = 'background:#f4f4f4';
  ['Artikel-Nr', 'Ist-PB', 'Empf.', 'RLZ', 'Status'].forEach(lbl => {
    const th = document.createElement('th');
    th.style.cssText = 'padding:4px 6px;text-align:left;color:#6a6d70;font-weight:600;white-space:nowrap;border-bottom:1px solid #e8e8e8;font-size:10px;position:sticky;top:0;background:#f4f4f4';
    th.textContent = lbl;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  const tbody = document.createElement('tbody');
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  tblWrap.appendChild(tbl);
  panel.appendChild(tblWrap);

  /* Action buttons */
  const ar = document.createElement('div');
  ar.style.cssText = 'display:flex;gap:8px';

  const analyzeBtn = document.createElement('button');
  analyzeBtn.type = 'button';
  analyzeBtn.textContent = 'Analysieren';
  analyzeBtn.style.cssText = 'flex:2;height:32px;border-radius:4px;border:none;background:#6c3483;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:72,Arial,sans-serif';

  const badgesBtn = document.createElement('button');
  badgesBtn.type = 'button';
  badgesBtn.textContent = 'Badges';
  badgesBtn.title = 'Badges aus der Tabelle entfernen';
  badgesBtn.style.cssText = 'flex:1;height:32px;border-radius:4px;border:1px solid #8b90a8;background:#fff;color:#6a6d70;font-size:12px;font-weight:600;cursor:pointer;font-family:72,Arial,sans-serif';

  ar.appendChild(analyzeBtn);
  ar.appendChild(badgesBtn);
  panel.appendChild(ar);

  /* ── Render result table ─────────────────────────────────────────────────── */
  function renderTable(results) {
    tbody.innerHTML = '';
    results.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.style.cssText = `background:${i % 2 === 0 ? '#fff' : '#fafafa'};cursor:pointer`;
      tr.title = r.txt;

      // Click → scroll article row into view and briefly highlight it
      tr.addEventListener('click', () => {
        r.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        r.row.style.outline = '2px solid #6c3483';
        setTimeout(() => { r.row.style.outline = ''; }, 1500);
      });

      const tdArt = document.createElement('td');
      tdArt.style.cssText = 'padding:3px 6px;color:#32363a;border-bottom:1px solid #f0f0f0;white-space:nowrap';
      tdArt.textContent = r.art;

      const tdIst = document.createElement('td');
      tdIst.style.cssText = 'padding:3px 6px;border-bottom:1px solid #f0f0f0;text-align:right;color:#32363a;white-space:nowrap';
      tdIst.textContent = r.pb;

      const tdRec = document.createElement('td');
      tdRec.style.cssText = `padding:3px 6px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;white-space:nowrap;color:${STATUS_COLOR[r.status]}`;
      tdRec.textContent = r.recPB;

      // RLZ column: show value for perishables, dash for non-perishable
      const tdRlz = document.createElement('td');
      tdRlz.style.cssText = 'padding:3px 6px;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap;';
      if (r.perishable) {
        tdRlz.style.color = r.overRLZ ? '#e65100' : '#00838f';
        tdRlz.style.fontWeight = '600';
        tdRlz.textContent = r.rlz + 'd';
      } else {
        tdRlz.style.color = '#bbb';
        tdRlz.textContent = '–';
      }

      const tdSt = document.createElement('td');
      tdSt.style.cssText = 'padding:3px 6px;border-bottom:1px solid #f0f0f0;white-space:nowrap';

      const badge = document.createElement('span');
      badge.style.cssText = `display:inline-block;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;color:#fff;background:${STATUS_COLOR[r.status]}`;
      badge.textContent = STATUS_LABEL[r.status];
      tdSt.appendChild(badge);

      if (r.overRLZ) {
        const vb = document.createElement('span');
        vb.style.cssText = 'display:inline-block;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;color:#fff;background:#e65100;margin-left:3px';
        vb.title = `Ist-PB (${r.pb}) > RLZ-Max (${r.rlzMax})`;
        vb.textContent = '⚠V';
        tdSt.appendChild(vb);
      } else if (r.rlzCapped) {
        const cb = document.createElement('span');
        cb.style.cssText = 'display:inline-block;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;color:#fff;background:#00838f;margin-left:3px';
        cb.title = 'Empfehlung durch RLZ begrenzt';
        cb.textContent = 'RLZ↓';
        tdSt.appendChild(cb);
      }

      tr.appendChild(tdArt);
      tr.appendChild(tdIst);
      tr.appendChild(tdRec);
      tr.appendChild(tdRlz);
      tr.appendChild(tdSt);
      tbody.appendChild(tr);
    });
  }

  /* ── Event handlers ──────────────────────────────────────────────────────── */
  analyzeBtn.addEventListener('click', () => {
    const results = analyze(selDays);

    if (!results.length) {
      fb.style.color = '#6a6d70';
      fb.textContent = 'Keine Zeilen mit Prog-Daten gefunden.';
      return;
    }

    applyBadges(results);
    renderTable(results);
    tblWrap.style.display = 'block';

    // Summary counts
    const cnt = { missing: 0, low: 0, high: 0, ok: 0, overRLZ: 0 };
    results.forEach(r => {
      cnt[r.status]++;
      if (r.overRLZ) cnt.overRLZ++;
    });

    const parts = [];
    if (cnt.missing) parts.push(cnt.missing + ' kein PB');
    if (cnt.low)     parts.push(cnt.low     + ' zu niedrig');
    if (cnt.high)    parts.push(cnt.high    + ' zu hoch');
    if (cnt.ok)      parts.push(cnt.ok      + ' OK');

    fb.style.color  = (cnt.missing + cnt.low + cnt.high + cnt.overRLZ) > 0 ? '#c62828' : '#107e3e';
    fb.textContent  = results.length + ' Artikel: ' + parts.join(', ');

    const oldWarn = document.getElementById(WARN_ID);
    if (oldWarn) oldWarn.remove();

    // Build extra warning lines
    const extraLines = [];
    if (cnt.overRLZ) extraLines.push({ color: '#e65100', text: '⚠ ' + cnt.overRLZ + ' × Ist-PB > RLZ-Max (Verderbgefahr)' });

    if (extraLines.length) {
      const warn = document.createElement('div');
      warn.id = WARN_ID;
      warn.style.cssText = 'font-size:10px;margin-top:3px;font-weight:600;line-height:1.7';
      extraLines.forEach(({ color, text }) => {
        const line = document.createElement('div');
        line.style.color = color;
        line.textContent = text;
        warn.appendChild(line);
      });
      fb.after(warn);
    }
  });

  badgesBtn.addEventListener('click', clearBadges);

  /* ── Drag ───────────────────────────────────────────────────────────────── */
  let isDragging = false, dragOffX = 0, dragOffY = 0;

  hdr.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    dragOffX = e.clientX - rect.left;
    dragOffY = e.clientY - rect.top;
    panel.style.top  = rect.top  + 'px';
    panel.style.left = rect.left + 'px';
    e.preventDefault();
  });

  document.addEventListener('pointermove', e => {
    if (!isDragging) return;
    panel.style.left = (e.clientX - dragOffX) + 'px';
    panel.style.top  = (e.clientY - dragOffY) + 'px';
  });

  document.addEventListener('pointerup', () => { isDragging = false; });

  document.body.appendChild(panel);
}());
