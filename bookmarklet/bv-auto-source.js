/**
 * BV Auto-Eintragen – Source Script
 * SAP Instorelogistik · Bestandsveränderungen automatisch eintragen
 *
 * Fixes:
 *  - Decimal quantities (e.g. -1.0004) are accepted and rounded away from zero
 *  - Unit per line is mandatory (e.g. "219320 -8 ST"); skips item if SAP unit doesn't match
 *  - Log auto-scroll only activates when the user hasn't scrolled up
 *  - "Starten" button is hidden after a fully successful run
 */

(function () {
  'use strict';

  // Toggle: klick auf aktives Bookmarklet schließt das Modal
  const existing = document.getElementById('__bk_auto_modal');
  if (existing) { existing.remove(); return; }

  // ── SAP Helpers ────────────────────────────────────────────────────────────

  /**
   * Finds a SAP UI5 control by its ID suffix.
   * Falls back to the Element registry if byId misses.
   */
  function findCtrl(id) {
    try {
      const core = sap.ui.getCore();
      const direct = core.byId?.(id);
      if (direct) return direct;

      if (sap.ui.core?.Element?.registry) {
        let found = null;
        sap.ui.core.Element.registry.forEach((el, elId) => {
          if (!found && (elId === id || elId.endsWith(`--${id}`) || elId.endsWith(id))) {
            found = el;
          }
        });
        if (found) return found;
      }
    } catch (_) {}
    return null;
  }

  /**
   * Waits until the SAP busy indicator disappears, then calls cb.
   * Times out after 12 seconds.
   */
  function waitBusy(cb) {
    const start = Date.now();
    const chk = () => {
      const bi = document.getElementById('sapUiBusyIndicator');
      const busy = bi && bi.style.visibility !== 'hidden' && bi.style.display !== 'none';
      if (!busy || Date.now() - start > 12_000) { cb(); return; }
      setTimeout(chk, 150);
    };
    setTimeout(chk, 400);
  }

  /** Sets a SAP input field value and fires the change event. */
  function setInp(name, value) {
    const ctrl = findCtrl(name);
    if (ctrl) {
      ctrl.setValue(value);
      ctrl.fireChange({ value, newValue: value });
    } else {
      const el = document.querySelector(`[id$="${name}-inner"]`);
      if (!el) return;
      el.focus();
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
    }
  }

  /** Clicks a SAP button by ID suffix. Returns true if found. */
  function clickBtn(name) {
    const ctrl = findCtrl(name);
    if (ctrl) { ctrl.firePress(); return true; }
    const el = document.querySelector(`[id$="${name}"]`) ?? document.querySelector(`[id$="${name}-inner"]`);
    if (el) { el.click(); return true; }
    return false;
  }

  /** Sets a SAP Switch state and fires the change event. */
  function setSw(name, state) {
    const ctrl = findCtrl(name);
    if (ctrl) {
      ctrl.setState(state);
      ctrl.fireChange({ state });
    } else {
      const handle = document.querySelector(`[id$="${name}-handle"]`);
      if (!handle) return;
      let sw = handle.parentElement;
      while (sw && !sw.className?.includes('sapMSwt')) sw = sw.parentElement;
      if (sw && sw.classList.contains('sapMSwtOn') !== state) sw.click();
    }
  }

  /** Returns current time as HH:MM:SS string. */
  function timestamp() {
    return new Date().toTimeString().slice(0, 8);
  }

  // ── Modal DOM ──────────────────────────────────────────────────────────────

  const ov = document.createElement('div');
  ov.id = '__bk_auto_modal';
  ov.style.cssText = [
    'position:fixed;top:0;left:0;width:100%;height:100%',
    'background:rgba(0,0,0,.45);z-index:2147483647',
    'display:flex;align-items:center;justify-content:center',
    'font-family:72,Arial,sans-serif',
  ].join(';');

  const dlg = document.createElement('div');
  dlg.style.cssText = [
    'background:#fff;border-radius:8px;padding:24px 28px',
    'width:420px;max-width:94vw;box-shadow:0 8px 32px rgba(0,0,0,.3)',
  ].join(';');

  // Title
  const ttl = document.createElement('div');
  ttl.style.cssText = 'font-size:16px;font-weight:bold;color:#32363a;margin-bottom:2px';
  ttl.textContent = 'BV Auto-Eintragen';

  // Subtitle / hint (hidden while running)
  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:12px;color:#6a6d70;margin-bottom:14px';
  sub.textContent = 'Liste einfügen — eine Zeile pro Artikel (Format: 219320 -8 ST oder 70297 -109,000 CO)';

  // Input textarea
  const ta = document.createElement('textarea');
  ta.placeholder = '219320 -8 ST\n317014 -2 CO\n70297 -109,000 CO';
  ta.style.cssText = [
    'width:100%;min-height:110px;font-family:monospace;font-size:13px',
    'border:1px solid #89919a;border-radius:4px;padding:8px',
    'resize:vertical;box-sizing:border-box;color:#32363a',
  ].join(';');

  // Validation error line
  const errEl = document.createElement('div');
  errEl.style.cssText = 'color:#bb0000;font-size:12px;margin-top:6px;min-height:16px';

  // Progress bar
  const pbWrap = document.createElement('div');
  pbWrap.style.cssText = 'display:none;height:6px;background:#e5e5e5;border-radius:3px;margin-top:14px;overflow:hidden';
  const pb = document.createElement('div');
  pb.style.cssText = 'height:100%;width:0%;background:#0a6ed1;border-radius:3px;transition:width .3s';
  pbWrap.appendChild(pb);

  // Log panel
  const logWrap = document.createElement('div');
  logWrap.style.cssText = [
    'display:none;margin-top:10px;max-height:180px;overflow-y:auto',
    'border:1px solid #e5e5e5;border-radius:4px;background:#1d1d1d',
    'padding:8px 10px;font-family:monospace;font-size:12px;line-height:1.7',
  ].join(';');

  // Summary bar
  const summaryEl = document.createElement('div');
  summaryEl.style.cssText = [
    'display:none;font-size:12px;font-weight:bold;margin-top:8px',
    'padding:6px 10px;border-radius:4px;text-align:center',
  ].join(';');

  // Button row
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:16px';

  const btnC = document.createElement('button');
  btnC.type = 'button';
  btnC.textContent = 'Abbrechen';
  btnC.style.cssText = [
    'height:36px;padding:0 16px;border-radius:4px',
    'border:1px solid #89919a;background:#fff;font-size:14px;cursor:pointer;color:#32363a',
  ].join(';');

  const btnOK = document.createElement('button');
  btnOK.type = 'button';
  btnOK.textContent = 'Starten';
  btnOK.style.cssText = [
    'height:36px;padding:0 16px;border-radius:4px',
    'border:none;background:#0a6ed1;color:#fff;font-size:14px;font-weight:bold;cursor:pointer',
  ].join(';');

  // ── Log helpers ────────────────────────────────────────────────────────────

  const logRows = [];

  /* Track whether the user has manually scrolled up in the log.
     Auto-scroll resumes once they scroll back to the bottom. */
  let userScrolledUp = false;
  logWrap.addEventListener('scroll', () => {
    const distFromBottom = logWrap.scrollHeight - logWrap.scrollTop - logWrap.clientHeight;
    userScrolledUp = distFromBottom > 20;
  });

  const STATUS_ICONS  = { pending: '⏳', busy: '↻', done: '✓', error: '✗' };
  const STATUS_COLORS = { pending: '#888', busy: '#6db3f2', done: '#66bb6a', error: '#e57373' };

  function addLog(idx, art, qty, status, msg) {
    if (!logRows[idx]) {
      const row = document.createElement('div');
      row.style.cssText = 'padding:1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      logWrap.appendChild(row);
      logRows[idx] = row;
    }
    logRows[idx].style.color = STATUS_COLORS[status];
    logRows[idx].textContent = `[${timestamp()}] ${STATUS_ICONS[status]} ${art} · ${qty} — ${msg}`;

    if (!userScrolledUp) logWrap.scrollTop = logWrap.scrollHeight;
  }

  function setProgress(done, total) {
    pb.style.width = `${Math.round(done / total * 100)}%`;
  }

  // ── Run loop ───────────────────────────────────────────────────────────────

  function run(items) {
    ta.style.display    = 'none';
    sub.style.display   = 'none';
    errEl.style.display = 'none';
    btnRow.style.display = 'none';
    pbWrap.style.display = 'block';
    logWrap.style.display = 'block';
    userScrolledUp = false;

    let idx    = 0;
    let errors = 0;

    // Pre-populate all rows as "pending"
    items.forEach(([art, qty], k) => addLog(k, art, qty, 'pending', 'Wartend'));

    function next() {
      if (idx >= items.length) {
        const ok = items.length - errors;
        summaryEl.style.display = 'block';

        if (errors === 0) {
          summaryEl.style.background = '#e8f5e9';
          summaryEl.style.color      = '#1b5e20';
          summaryEl.textContent      = `✓ Fertig — alle ${items.length} Einträge erfolgreich`;
          btnOK.style.display        = 'none'; // no "Starten" when fully done
        } else {
          summaryEl.style.background = '#fff3e0';
          summaryEl.style.color      = '#e65100';
          summaryEl.textContent      = `${ok} ok — ${errors} Fehler`;
        }

        btnC.textContent    = 'Schließen';
        btnRow.style.display = 'flex';
        return;
      }

      const [art, qty, expectedUnit] = items[idx];
      const isNeg = qty < 0;
      const abs   = String(Math.abs(qty));

      addLog(idx, art, qty, 'busy', 'Artikelnummer…');
      setInp('oInputBKArtikel', art);

      setTimeout(() => {
        if (!clickBtn('btnBKBestaetigen')) {
          errors++;
          addLog(idx, art, qty, 'error', 'Artikel-Bestätigen nicht gefunden');
          setProgress(++idx, items.length);
          next();
          return;
        }

        addLog(idx, art, qty, 'busy', 'Warte auf SAP…');
        waitBusy(() => {
          if (expectedUnit) {
            const uomCtrl = findCtrl('oComboBoxBKAnzERFME');
            const uomEl   = document.querySelector('[id$="oComboBoxBKAnzERFME-inner"]');
            const sapUnit = (uomCtrl?.getValue?.() ?? uomEl?.value ?? '').trim().toUpperCase();
            if (sapUnit && sapUnit !== expectedUnit) {
              errors++;
              addLog(idx, art, qty, 'error', `Einheit: ${sapUnit} ≠ ${expectedUnit} — übersprungen`);
              setProgress(++idx, items.length);
              next();
              return;
            }
          }
          addLog(idx, art, qty, 'busy', `${isNeg ? 'Einbuchen' : 'Ausbuchen'}: Menge + Schalter…`);
          setInp('oInputBKAnzERFMG', abs);
          setSw('oSwitchBKAnzBwArt', isNeg);

          setTimeout(() => {
            if (!clickBtn('btnBKAnzBestaetigen')) {
              errors++;
              addLog(idx, art, qty, 'error', 'Anzahl-Bestätigen nicht gefunden');
              setProgress(++idx, items.length);
              next();
              return;
            }

            addLog(idx, art, qty, 'busy', 'Warte auf SAP…');
            waitBusy(() => {
              addLog(idx, art, qty, 'done', isNeg ? 'Eingebucht' : 'Ausgebucht');
              setProgress(++idx, items.length);
              next();
            });
          }, 200);
        });
      }, 150);
    }

    next();
  }

  // ── Input parsing & validation ─────────────────────────────────────────────

  /**
   * Parses a number string that may use German locale formatting:
   *   - comma as decimal separator (e.g. "-109,000" → -109)
   *   - dot as thousands separator (e.g. "1.109,50" → 1109.5)
   * Falls back to standard parseFloat for purely dot-decimal numbers.
   */
  function parseGermanNumber(s) {
    const lastDot   = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) {
      // comma is decimal separator; dots are thousands separators
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // dot is decimal separator (or no separator); commas are thousands separators
      s = s.replace(/,/g, '');
    }
    return parseFloat(s);
  }

  function parseItems(raw) {
    const items = [];
    const lines = raw.split('\n');

    for (let j = 0; j < lines.length; j++) {
      const ln = lines[j].trim();
      if (!ln) continue;

      // Accept space or tab separators; allow comma as decimal separator in quantity
      const m = ln.match(/^(\d{4,8})\s+(-?[\d.,]+)\s+([A-Za-z]{1,5})$/);
      if (!m) {
        return { error: `Zeile ${j + 1}: Ungültiges Format (erwartet: Artikelnr Menge Einheit)` };
      }

      const qty = parseGermanNumber(m[2]);
      if (isNaN(qty) || qty === 0) {
        return { error: `Zeile ${j + 1}: Menge darf nicht 0 oder ungültig sein` };
      }

      // Round away from zero (towards larger absolute value):
      // e.g.  2.3004 →  3  |  -1.0004 → -2  |  -1.9 → -2
      const rounded = qty >= 0 ? Math.ceil(qty) : Math.floor(qty);
      items.push([m[1], rounded, m[3].toUpperCase()]);
    }

    return { items };
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  btnOK.addEventListener('click', () => {
    const raw = ta.value.trim();
    if (!raw) {
      errEl.textContent    = 'Bitte Liste einfügen.';
      ta.style.borderColor = '#bb0000';
      ta.focus();
      return;
    }

    const { items, error } = parseItems(raw);
    if (error) {
      errEl.textContent    = error;
      ta.style.borderColor = '#bb0000';
      ta.focus();
      return;
    }
    if (!items.length) {
      errEl.textContent = 'Keine gültigen Einträge.';
      return;
    }

    run(items);
  });

  const closeM = () => ov.remove();

  btnC.addEventListener('click',  closeM);
  ov.addEventListener('click',   (e) => { if (e.target === ov) closeM(); });
  ta.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') closeM();
  });

  // ── Assemble & show ────────────────────────────────────────────────────────

  btnRow.append(btnC, btnOK);
  dlg.append(ttl, sub, ta, errEl, pbWrap, logWrap, summaryEl, btnRow);
  ov.appendChild(dlg);
  document.body.appendChild(ov);
  setTimeout(() => ta.focus(), 50);
})();
