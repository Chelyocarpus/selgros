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
   * Two-phase busy wait:
   *  Phase 1 – waits up to 3 s for the busy indicator to appear.
   *  Phase 2 – once it appears (or if it never did), waits for it to disappear.
   * Total timeout: 15 s.
   *
   * The old single-phase approach started polling 400 ms after a button click,
   * which was too soon — if SAP hadn't shown the indicator yet the function
   * returned immediately (false "not busy"), causing the loop to advance to
   * the next pallet while SAP was still processing.
   */
  function waitBusy(cb) {
    const start = Date.now();
    const isBusy = () => {
      const bi = document.getElementById('sapUiBusyIndicator');
      return bi && bi.style.visibility !== 'hidden' && bi.style.display !== 'none';
    };

    // Phase 2: busy indicator is visible – wait for it to disappear.
    function phase2() {
      if (!isBusy() || Date.now() - start > 15_000) { cb(); return; }
      let settled = false;
      const done = () => { if (settled) return; settled = true; obs.disconnect(); clearTimeout(fb); cb(); };
      const biEl = document.getElementById('sapUiBusyIndicator');
      const obs = new MutationObserver(() => { if (!isBusy()) done(); });
      obs.observe(biEl || document.body, { subtree: !biEl, attributes: true, attributeFilter: ['style', 'class'] });
      // Fallback: re-check every 500 ms in case MutationObserver misses a change.
      const fb = setTimeout(() => { obs.disconnect(); if (!settled) phase2(); }, 500);
    }

    // Phase 1: wait up to 3 s for the busy indicator to appear.
    function phase1() {
      if (isBusy()) { phase2(); return; }
      if (Date.now() - start > 3_000) { phase2(); return; }
      let advanced = false;
      const obs = new MutationObserver(() => {
        if (!advanced && isBusy()) { advanced = true; obs.disconnect(); clearTimeout(fb); phase2(); }
      });
      obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });
      const fb = setTimeout(() => { obs.disconnect(); if (!advanced) phase1(); }, 500);
    }

    setTimeout(phase1, 300);
  }

  /**
   * Polls until no visible SAP MessageBox confirmation button exists in the DOM.
   * This is used to verify that a dialog was actually dismissed before moving on.
   * Times out after 10 s and proceeds anyway.
   * @param {function} cb
   */
  function waitForMboxGone(cb) {
    const start = Date.now();
    const isGone = () => ![...document.querySelectorAll('button[id^="__mbox-btn-"]')]
                           .some(b => b.getClientRects().length > 0);
    if (isGone()) { setTimeout(cb, 0); return; }
    let settled = false;
    const done = () => { if (settled) return; settled = true; obs.disconnect(); clearTimeout(fb); cb(); };
    const obs = new MutationObserver(() => { if (isGone()) done(); });
    obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class', 'aria-hidden'] });
    let fb;
    const poll = () => {
      if (settled) return;
      if (isGone() || Date.now() - start > 10_000) { done(); return; }
      fb = setTimeout(poll, 400);
    };
    fb = setTimeout(poll, 150);
  }

  /**
   * Waits until the SAP pallet-number input field is empty (SAP clears it
   * automatically after a successful booking). Times out after 8 s.
   * @param {string}   name  - control ID suffix (e.g. 'oInputPalPage4')
   * @param {function} cb
   */
  function waitForInputClear(name, cb) {
    const start = Date.now();
    const getVal = () => {
      const ctrl = findCtrl(name);
      return ctrl
        ? (ctrl.getValue ? ctrl.getValue() : '')
        : (document.querySelector(`[id$="${name}-inner"]`)?.value ?? '');
    };
    if (!getVal()) { setTimeout(cb, 0); return; }
    const el = document.querySelector(`[id$="${name}-inner"]`);
    let settled = false;
    const done = () => {
      if (settled) return; settled = true;
      clearTimeout(fb);
      if (el) { el.removeEventListener('input', onEvt); el.removeEventListener('change', onEvt); }
      cb();
    };
    const onEvt = () => { if (!getVal()) done(); };
    if (el) {
      el.addEventListener('input', onEvt);
      el.addEventListener('change', onEvt);
    }
    let fb;
    const poll = () => {
      if (settled) return;
      if (!getVal() || Date.now() - start > 8_000) { done(); return; }
      fb = setTimeout(poll, 400);
    };
    fb = setTimeout(poll, 300);
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
   * Polls until a SAP MessageBox dialog appears and returns its primary button
   * plus metadata about the dialog type.
   *
   * SAP UI5 assigns an incrementing global element counter to dialog buttons,
   * producing IDs like __mbox-btn-4 on first load and __mbox-btn-37+ later.
   * When multiple dialogs are stacked (a bug state) the LAST one in the DOM
   * is the topmost/newest, so we always target that one.
   *
   * @param {function} cb  - called with {btn, isError, errorText} | null on timeout
   * @param {number}   t   - timeout in ms (default 8000)
   */
  function waitForMbox(cb, t) {
    const limit = t || 8_000;
    const start = Date.now();

    const findDialog = () => {
      const dialogs = [...document.querySelectorAll('[role="alertdialog"]')]
                        .filter(d => d.getClientRects().length > 0);
      const dialog = dialogs[dialogs.length - 1];
      if (!dialog) return null;
      const btn = [...dialog.querySelectorAll('button[id^="__mbox-btn-"]')]
                    .find(b => b.getClientRects().length > 0);
      if (!btn) return null;
      const heading   = dialog.querySelector('[role="heading"]')?.textContent?.trim() ?? '';
      const isError   = /fehler|error/i.test(heading)
                        || btn.textContent.trim().toLowerCase() === 'schließen';
      const contentEl = dialog.querySelector('[role="document"]')
                      || dialog.querySelector('.mbox-text')
                      || dialog;
      const errorText = isError ? (contentEl.innerText ?? '').trim() : '';
      return { btn, isError, errorText };
    };

    // Resolve immediately if the dialog is already present.
    const immediate = findDialog();
    if (immediate) { setTimeout(() => cb(immediate), 0); return; }

    let settled = false;
    const done = (result) => { if (settled) return; settled = true; obs.disconnect(); clearTimeout(fb); cb(result); };

    const obs = new MutationObserver(() => {
      const r = findDialog();
      if (r) done(r);
    });
    obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class', 'aria-hidden'] });

    let fb;
    const poll = () => {
      if (settled) return;
      if (Date.now() - start > limit) { done(null); return; }
      const r = findDialog();
      if (r) { done(r); return; }
      fb = setTimeout(poll, 300);
    };
    fb = setTimeout(poll, 200);
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

      // Guard: never start a new pallet while a dialog is still visible.
      // If the previous confirm click didn't close the mbox fast enough,
      // wait and retry rather than stacking a second dialog on top.
      const openDialog = [...document.querySelectorAll('button[id^="__mbox-btn-"]')]
                           .find(b => b.getClientRects().length > 0);
      if (openDialog) { setTimeout(next, 500); return; }

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
        waitForMbox((result) => {
          if (!result) {
            errors++;
            addLog(idx, pal, 'error', 'Bestätigungs-Dialog nicht erschienen');
            setProgress(++idx, pallets.length);
            next();
            return;
          }

          result.btn.click();

          if (result.isError) {
            // SAP showed an error dialog (e.g. PAL unbekannt) — log as error,
            // wait for the dialog to close, then continue without waitBusy/waitForInputClear.
            const msg = result.errorText ? result.errorText.slice(0, 80) : 'SAP-Fehler';
            errors++;
            addLog(idx, pal, 'error', msg);
            waitForMboxGone(() => {
              setProgress(++idx, pallets.length);
              setTimeout(next, 300);
            });
            return;
          }

          addLog(idx, pal, 'busy', 'Bestätigt – warte auf Dialog-Schluß…');

          // Step 3b: confirm the dialog actually closed before polling SAP
          waitForMboxGone(() => {
            addLog(idx, pal, 'busy', 'Warte auf SAP-Verarbeitung…');

            // Step 4: wait for SAP processing to finish
            waitBusy(() => {
              addLog(idx, pal, 'busy', 'Warte auf Feldleerung durch SAP…');

              // Step 5: wait for SAP to clear the input field naturally
              waitForInputClear('oInputPalPage4', () => {
                addLog(idx, pal, 'done', 'Gelöscht');
                setProgress(++idx, pallets.length);
                setTimeout(next, 200);
              });
            });
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
