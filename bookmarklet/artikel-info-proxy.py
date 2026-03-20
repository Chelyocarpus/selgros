"""
Artikel-Info Proxy – lokaler CORS-Umgehungs-Proxy
===================================================
Startet einen Mini-HTTP-Server auf localhost:17342, der Anfragen
an die Transgourmet-Produkt-API weiterleitet und dabei die
Session-Cookie des aktuell eingeloggten Benutzers mitsendet.

Benötigt: Python 3 (keine weiteren Pakete)
Starten:  python artikel-info-proxy.py

Einmalige Einrichtung:
  1. Im Browser auf apps.transgourmet.de einloggen
  2. DevTools öffnen (F12) → Application → Cookies → apps.transgourmet.de
  3. Den Cookie-Wert unten bei SESSION_COOKIE eintragen (alle Cookies
     als "name=wert; name2=wert2" einfügen)
"""

import http.server
import urllib.request
import urllib.parse
import json
import sys

# ── Konfiguration ──────────────────────────────────────────────────────────────

PORT = 17342

# Aus DevTools → Application → Cookies → apps.transgourmet.de kopieren.
# Alle Cookies als Semikolon-getrennte Liste:
# Beispiel: "JSESSIONID=abc123; XSRF-TOKEN=def456"
SESSION_COOKIE = "PASTE_COOKIES_HERE"

# ── Proxy-Handler ──────────────────────────────────────────────────────────────

API_BASE = (
    "https://apps.transgourmet.de"
    "/recor/api/productposterdocument/product/search"
)


class ProxyHandler(http.server.BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        term_list = params.get("term", [])

        if not term_list or not term_list[0].strip():
            self._error(400, "Fehlender Parameter: term")
            return

        term = term_list[0].strip()
        url = f"{API_BASE}?size=12&page=0&term={urllib.parse.quote(term)}"

        req = urllib.request.Request(
            url,
            headers={
                "Cookie":  SESSION_COOKIE,
                "Accept":  "application/json",
                "User-Agent": "Mozilla/5.0",
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read()

            self._cors()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(body)

        except urllib.error.HTTPError as exc:
            self._error(exc.code, f"API-Fehler: HTTP {exc.code}")
        except Exception as exc:
            self._error(502, str(exc))

    # ── helpers ────────────────────────────────────────────────────────────────

    def _cors(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _error(self, code, msg):
        body = json.dumps({"error": msg}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):  # noqa: suppress default Apache-style log
        print(f"[Proxy] {self.address_string()} – {fmt % args}")


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if SESSION_COOKIE == "PASTE_COOKIES_HERE":
        print("⚠  Bitte SESSION_COOKIE in dieser Datei eintragen (siehe Kommentar oben).")
        sys.exit(1)

    server = http.server.HTTPServer(("localhost", PORT), ProxyHandler)
    print(f"✓  Proxy läuft auf http://localhost:{PORT}")
    print(f"   Test: http://localhost:{PORT}/?term=292467")
    print("   Strg+C zum Beenden.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nProxy beendet.")
