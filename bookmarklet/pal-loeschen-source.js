/**
 * PAL löschen – Source Script
 * SAP Instorelogistik · Paletten automatisch löschen
 *
 * Workflow per Palette:
 *  1. Palettennummer in oInputPalPage4 eintragen
 *  2. oButtonSubmitPage4 klicken
 *  3. Auf Bestätigungsdialog warten → __mbox-btn-4 klicken
 *  4. SAP-Verarbeitung abwarten (busy indicator)
 *  5. Eingabefeld leeren, weiter zur nächsten Palette
 */

(function () {
  'use strict';

  // Toggle: nochmaliger Klick auf aktives Bookmarklet schließt das Modal
  const existing = document.getElementById('__bk_pal_modal');
  if (existing) { existing.remove(); return; }

  // ── SAP Helpers ────────────────────────────────────────────────────────────

  /**
   * Finds a SAP UI5 control by its ID suffix.
   * Falls back to the element registry when byId misses.
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
    const el = document.querySelector(`[id$="${name}"]`) ||
               document.querySelector(`[id$="${name}-content"]`) ||
               document.querySelector(`[id$="${name}-inner"]`);
    if (el) { el.click(); return true; }
    return false;
  }

  /**
   * Polls until the SAP MessageBox confirmation button appears in the DOM.
   * Tries the exact ID first, then a broad mbox selector.
   * @param {function} cb  - called with the button element, or null on timeout
   * @param {number}   t   - timeout in ms (default 8000)
   */
  function waitForMbox(cb, t) {
    const start = Date.now();
    const limit = t || 8_000;
    const chk = () => {
      const el = document.getElementById('__mbox-btn-4') ||
                 document.querySelector('[id*="mbox"][id$="-btn-4"]');
      if (el) { cb(el); return; }
      if (Date.now() - start > limit) { cb(null); return; }
      setTimeout(chk, 100);
    };
    setTimeout(chk, 200);
  }

  // ── UI Build ────────────────────────────────────────────────────────────────

  const ov = document.createElement('div');
  ov.id = '__bk_pal_modal';
  ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.45);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:72,Arial,sans-serif';

  const dlg = document.createElement('div');
  dlg.style.cssText = 'background:#fff;border-radius:8px;padding:24px 28px;width:420px;max-width:94vw;box-shadow:0 8px 32px rgba(0,0,0,.3)';

  const ttl = document.createElement('div');
  ttl.style.cssText = 'font-size:16px;font-weight:bold;color:#32363a;margin-bottom:2px';
  ttl.textContent = 'PAL löschen';

  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:12px;color:#6a6d70;margin-bottom:14px';
  sub.textContent = 'Palettennummern eintragen – eine pro Zeile';

  const skipRow = document.createElement('label');
  skipRow.style.cssText = 'display:flex;align-items:center;gap:7px;font-size:12px;color:#32363a;margin-bottom:12px;cursor:pointer;user-select:none';
  const skipChk = document.createElement('input');
  skipChk.type    = 'checkbox';
  skipChk.checked = true;
  skipChk.style.cssText = 'width:14px;height:14px;accent-color:#bb0000;cursor:pointer;flex-shrink:0';
  const skipLbl = document.createElement('span');
  skipLbl.textContent = '001191-Paletten überspringen';
  skipRow.appendChild(skipChk);
  skipRow.appendChild(skipLbl);

  const ta = document.createElement('textarea');
  ta.placeholder = '123456\n789012\n345678';
  ta.style.cssText = 'width:100%;min-height:110px;font-family:monospace;font-size:13px;border:1px solid #89919a;border-radius:4px;padding:8px;resize:vertical;box-sizing:border-box;color:#32363a';

  const errEl = document.createElement('div');
  errEl.style.cssText = 'color:#bb0000;font-size:12px;margin-top:6px;min-height:16px';

  const SKIP_PREFIX = '001191';

  const pbWrap = document.createElement('div');
  pbWrap.style.cssText = 'display:none;height:6px;background:#e5e5e5;border-radius:3px;margin-top:14px;overflow:hidden';
  const pb = document.createElement('div');
  pb.style.cssText = 'height:100%;width:0%;background:#bb0000;border-radius:3px;transition:width .3s';
  pbWrap.appendChild(pb);

  const logWrap = document.createElement('div');
  logWrap.style.cssText = 'display:none;margin-top:10px;max-height:180px;overflow-y:auto;border:1px solid #e5e5e5;border-radius:4px;background:#1d1d1d;padding:8px 10px;font-family:monospace;font-size:12px;line-height:1.7';

  const summaryEl = document.createElement('div');
  summaryEl.style.cssText = 'display:none;font-size:12px;font-weight:bold;margin-top:8px;padding:6px 10px;border-radius:4px;text-align:center';

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:16px';

  const btnC = document.createElement('button');
  btnC.type = 'button';
  btnC.textContent = 'Abbrechen';
  btnC.style.cssText = 'height:36px;padding:0 16px;border-radius:4px;border:1px solid #89919a;background:#fff;font-size:14px;cursor:pointer;color:#32363a';

  const btnOK = document.createElement('button');
  btnOK.type = 'button';
  btnOK.textContent = 'Starten';
  btnOK.style.cssText = 'height:36px;padding:0 16px;border-radius:4px;border:none;background:#bb0000;color:#fff;font-size:14px;font-weight:bold;cursor:pointer';

  const logRows = [];
  let userScrolledUp = false;
  logWrap.addEventListener('scroll', () => {
    userScrolledUp = (logWrap.scrollHeight - logWrap.scrollTop - logWrap.clientHeight) > 20;
  });

  function ts() { return new Date().toTimeString().slice(0, 8); }

  function addLog(idx, pal, status, msg) {
    if (!logRows[idx]) {
      const row = document.createElement('div');
      row.style.cssText = 'padding:1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      logWrap.appendChild(row);
      logRows[idx] = row;
    }
    const icons = { pending: '⏳', busy: '↻', done: '✓', error: '✗' };
    const cols  = { pending: '#888', busy: '#6db3f2', done: '#66bb6a', error: '#e57373' };
    logRows[idx].style.color = cols[status] || '#888';
    logRows[idx].textContent = `[${ts()}] ${icons[status] || '?'} ${pal} — ${msg}`;
    if (!userScrolledUp) logWrap.scrollTop = logWrap.scrollHeight;
  }

  function setProgress(done, total) {
    pb.style.width = Math.round(done / total * 100) + '%';
  }

  // ── Run Loop ────────────────────────────────────────────────────────────────

  function run(pallets) {
    ta.style.display       = 'none';
    sub.style.display      = 'none';
    errEl.style.display    = 'none';
    btnRow.style.display   = 'none';
    pbWrap.style.display   = 'block';
    logWrap.style.display  = 'block';
    userScrolledUp = false;

    const skipEnabled = skipChk.checked;
    let idx = 0, errors = 0, skipped = 0;
    for (let k = 0; k < pallets.length; k++) addLog(k, pallets[k], 'pending', 'Wartend');

    function next() {
      if (idx >= pallets.length) {
        const ok = pallets.length - errors;
        summaryEl.style.display = 'block';
        const skipNote = skipped > 0 ? ` (${skipped} übersprungen)` : '';
        if (errors === 0) {
          summaryEl.style.background = '#e8f5e9';
          summaryEl.style.color      = '#1b5e20';
          summaryEl.textContent      = `✓ Fertig — ${ok} gelöscht${skipNote}`;
          btnOK.style.display        = 'none';
        } else {
          summaryEl.style.background = '#fff3e0';
          summaryEl.style.color      = '#e65100';
          summaryEl.textContent      = `${ok} gelöscht — ${errors} Fehler${skipNote}`;
        }
        btnC.textContent       = 'Schließen';
        btnRow.style.display   = 'flex';
        return;
      }

      const pal = pallets[idx];

      if (skipEnabled && pal.startsWith(SKIP_PREFIX)) {
        addLog(idx, pal, 'done', 'Übersprungen (001191)');
        skipped++;
        setProgress(++idx, pallets.length);
        setTimeout(next, 0);
        return;
      }

      addLog(idx, pal, 'busy', 'Palettennummer eintragen…');

      // Step 1: fill the pallet number input
      setInp('oInputPalPage4', pal);

      setTimeout(() => {
        // Step 2: press the submit button
        if (!clickBtn('oButtonSubmitPage4')) {
          errors++;
          addLog(idx, pal, 'error', 'Submit-Button nicht gefunden');
          setProgress(++idx, pallets.length);
          next();
          return;
        }

        addLog(idx, pal, 'busy', 'Warte auf Bestätigungsdialog…');

        // Step 3: wait for the MessageBox confirmation button and click it
        waitForMbox((btn) => {
          if (!btn) {
            errors++;
            addLog(idx, pal, 'error', 'Bestätigungs-Dialog nicht erschienen');
            setProgress(++idx, pallets.length);
            next();
            return;
          }

          btn.click();
          addLog(idx, pal, 'busy', 'Bestätigt – warte auf SAP…');

          // Step 4: wait for SAP processing, then clear & continue
          waitBusy(() => {
            setInp('oInputPalPage4', '');
            addLog(idx, pal, 'done', 'Gelöscht');
            setProgress(++idx, pallets.length);
            setTimeout(next, 150);
          });
        });
      }, 200);
    }

    next();
  }

  // ── Event Wiring ─────────────────────────────────────────────────────────

  btnOK.onclick = () => {
    const raw = ta.value.trim();
    if (!raw) {
      errEl.textContent    = 'Bitte Palettennummern eingeben.';
      ta.style.borderColor = '#bb0000';
      ta.focus();
      return;
    }
    const pallets = [...new Set(
      raw.split('\n').map(l => l.trim()).filter(l => /^\d+$/.test(l))
    )];
    if (!pallets.length) {
      errEl.textContent = 'Keine gültigen Einträge (nur Zahlen, Duplikate werden ignoriert).';
      return;
    }
    run(pallets);
  };

  btnC.onclick   = () => ov.remove();
  ta.onkeydown   = (e) => { e.stopPropagation(); if (e.key === 'Escape') ov.remove(); };
  ov.onclick     = (e) => { if (e.target === ov) ov.remove(); };

  btnRow.appendChild(btnC);
  btnRow.appendChild(btnOK);
  dlg.appendChild(ttl);
  dlg.appendChild(sub);
  dlg.appendChild(skipRow);
  dlg.appendChild(ta);
  dlg.appendChild(errEl);
  dlg.appendChild(pbWrap);
  dlg.appendChild(logWrap);
  dlg.appendChild(summaryEl);
  dlg.appendChild(btnRow);
  ov.appendChild(dlg);
  document.body.appendChild(ov);
  setTimeout(() => ta.focus(), 50);
})();
