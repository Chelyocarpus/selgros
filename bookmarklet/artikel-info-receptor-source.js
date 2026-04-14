/**
 * Artikel-Info Relay Receptor – Source Script
 * Läuft auf dem Transgourmet-Tab (apps.transgourmet.de)
 * und beantwortet Produktinfo-Anfragen vom F&R-Tab via window.postMessage.
 *
 * Kein CORS-Problem: fetch() läuft auf derselben Herkunft wie die API.
 *
 * Protokoll (cross-tab via window.postMessage):
 *   F&R → TG : { type: 'ARTIKEL_INFO_PING' }
 *   TG  → F&R: { type: 'ARTIKEL_INFO_PONG' }
 *   F&R → TG : { type: 'ARTIKEL_INFO_REQUEST', nr: '12345', reqId: 1 }
 *   TG  → F&R: { type: 'ARTIKEL_INFO_RESPONSE', reqId: 1, data: {...} }
 *              oder { type: 'ARTIKEL_INFO_RESPONSE', reqId: 1, error: 'HTTP 404' }
 *
 * Einrichtung (einmalig):
 *   1. Auf dem F&R-Tab das Artikel-Info-Bookmarklet aktivieren
 *      und dort auf »Relay« klicken → öffnet diesen Tab.
 *   2. Auf DIESEM Tab (apps.transgourmet.de) das Relay-Bookmarklet aktivieren.
 *   3. Verbindung wird automatisch aufgebaut (beide Badges werden grün).
 *
 * Aktivierung : Bookmarklet auf dem Transgourmet-Tab klicken.
 * Deaktivierung: × im Badge oder erneuter Klick.
 */

(function () {
  'use strict';

  const BADGE_ID   = '__tg_relay_badge';
  const API_URL    = 'https://apps.transgourmet.de/recor/api/productposterdocument/product/search';
  const API_URL_NEW = 'https://apps.transgourmet.de/search/api/product/search';

  // ── Toggle off ──────────────────────────────────────────────────────────────

  if (document.getElementById(BADGE_ID)) {
    deactivate();
    return;
  }

  // ── DOM helper ──────────────────────────────────────────────────────────────

  function mk(tag, css, txt) {
    const el = document.createElement(tag);
    if (css) el.style.cssText = css;
    if (txt != null) el.textContent = txt;
    return el;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * file:// origins appear as the string "null" — postMessage rejects that.
   * Fall back to '*' so the reply is still delivered.
   */
  function safeOrigin(ori) {
    return (ori && ori !== 'null') ? ori : '*';
  }

  /**
   * Converts a new-API single-product response to the Spring-pageable shape
   * the source script's renderProduct expects.
   */
  function normalizeNewApiData(raw) {
    if (!raw || !raw.name) return null;
    const selUnit = (raw.units || []).find(u => u.code === raw.selectedUnit) || (raw.units || [])[0] || {};
    return {
      _apiSource:    'new',
      content: [{
        name:          raw.name,
        imageUrl:      raw.asset || '',
        ean:           selUnit.ean || '',
        unitName:      selUnit.unitName || '',
        brand:         '',
        productGroup:  null,
        description:   '',
        packagingText: selUnit.content ? `${selUnit.content}\u00d7` : '',
      }],
      totalElements: 1,
    };
  }

  // ── Message handler ─────────────────────────────────────────────────────────

  function onMessage(e) {
    const { type, nr, reqId } = e.data || {};

    if (type === 'ARTIKEL_INFO_PING') {
      e.source.postMessage({ type: 'ARTIKEL_INFO_PONG' }, safeOrigin(e.origin));
      setConnected(e.origin);
      return;
    }

    if (type !== 'ARTIKEL_INFO_REQUEST') return;
    if (!nr || !/^\d{5,}$/.test(nr)) return;

    // Fetch is same-origin here → no CORS issue
    // Try old API first; fall back to new API when old returns no results.
    const { source, origin } = e;
    const tgt = safeOrigin(origin);
    fetch(`${API_URL}?size=12&page=0&term=${encodeURIComponent(nr)}`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        const items = data && (data.content || (Array.isArray(data) ? data : null));
        if (!Array.isArray(items) || !items.length) throw new Error('not_found');
        data._apiSource = 'old';
        return data;
      })
      .catch(() =>
        fetch(`${API_URL_NEW}?term=${encodeURIComponent(nr)}&locale=DE&plant=0119&isNameRequired=true`, { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(raw => {
            const normalized = normalizeNewApiData(raw);
            if (!normalized) throw new Error('Kein Produkt gefunden');
            return normalized;
          })
      )
      .then(data  => source.postMessage({ type: 'ARTIKEL_INFO_RESPONSE', reqId, data   }, tgt))
      .catch(err  => source.postMessage({ type: 'ARTIKEL_INFO_RESPONSE', reqId, error: String(err) }, tgt));
  }

  window.addEventListener('message', onMessage);

  // ── Deactivate ──────────────────────────────────────────────────────────────

  function deactivate() {
    window.removeEventListener('message', onMessage);
    document.getElementById(BADGE_ID)?.remove();
  }

  // ── Update badge to "connected" state ───────────────────────────────────────

  function setConnected(origin) {
    const dot = document.getElementById('__tg_relay_dot');
    const lbl = document.getElementById('__tg_relay_lbl');
    if (dot) dot.style.background = '#107e3e';
    if (lbl) {
      try { lbl.textContent = 'Relay \u00b7 ' + new URL(origin).hostname; }
      catch (_) { lbl.textContent = 'Relay \u00b7 verbunden'; }
    }
  }

  // ── Status badge ─────────────────────────────────────────────────────────────

  const badge = mk('div', [
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
    'user-select:none',
  ].join(';'));
  badge.id = BADGE_ID;

  const dot = mk('div', 'width:8px;height:8px;background:#e65100;border-radius:50%;flex-shrink:0');
  dot.id = '__tg_relay_dot';

  const lbl = mk('span');
  lbl.id = '__tg_relay_lbl';
  lbl.textContent = 'Artikel-Info Relay \u00b7 Bereit';

  const closeBtn = mk('button',
    'background:none;border:none;font-size:16px;line-height:1;cursor:pointer;color:#6a6d70;padding:0;margin-left:4px;flex-shrink:0',
    '\u00d7');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Relay beenden');
  closeBtn.onclick = deactivate;

  badge.appendChild(dot);
  badge.appendChild(lbl);
  badge.appendChild(closeBtn);
  document.body.appendChild(badge);

  // ── Announce to opener if F&R opened this tab ────────────────────────────────
  // Done AFTER badge is in the DOM so setConnected() can update the dot/label.

  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'ARTIKEL_INFO_PONG' }, '*');
      setConnected('*');
    }
  } catch (_) {}
})();
