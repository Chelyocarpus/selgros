# 📊 Bestandsveränderung Business Analyse Tool

Ein professionelles Tool zur Analyse von Bestandsbewegungen und finanziellen Auswirkungen aus XLSX-Dateien.

## 🆕 Neueste Änderungen (Nov 2025)

### Sidebar Navigation & Icon-Update
- **Sidebar Navigation**: Eine neue Sidebar-Navigation wurde hinzugefügt für einfacheren Zugriff auf alle Analyseabschnitte
- **SVG Icons**: Alle Emojis wurden durch professionelle SVG-Icons ersetzt für ein moderneres Erscheinungsbild
- **Smooth Scrolling**: Klicken auf Navigationslinks scrollt sanft zum gewünschten Abschnitt
- **Responsive Design**: Die Sidebar klappt auf mobilen Geräten automatisch ein
- **Verbesserte Benutzerführung**: Der aktive Abschnitt wird in der Navigation automatisch hervorgehoben

### Top 10 Abschreibungen Fix
- Die "Top 10 Artikel mit höchsten Abschreibungen" zeigt jetzt korrekt die **Netto-Abschreibungen**
- Berücksichtigt alle Bewegungen (positiv + negativ) pro Artikel
- Artikel mit sich gegenseitig aufhebenden Transaktionen (z.B. +95/-104) werden nicht mehr fälschlicherweise als große Abschreibungen angezeigt
- Nur Artikel mit echten Netto-Verlusten erscheinen in der Liste

## 🎯 Hauptfunktionen

### 💼 Business Analyse
- **Gesamtübersicht**: Komplette Statistiken zu Bewegungen, Artikeln, Mengen und Werten
- **Finanzielle Auswirkung**: Detaillierte Profit/Loss-Analyse mit Margenberechnung
- **Abschreibungen**: Analyse aller negativen Bewegungen und Verluste
- **Zugänge**: Übersicht über positive Bestandsveränderungen
- **Top Artikel**: Ranking nach Wert und Bewegungen
- **Bewegungsarten**: Gruppierung nach Bewegungstypen
- **Benutzeraktivität**: Wer hat was gebucht?
- **Zeitverlauf**: Chronologische Analyse

### 🔍 Artikel-Suche
Für jeden Artikel können Sie sehen:
- **Wie viel wurde abgeschrieben?** Gesamtmenge der Abschreibungen
- **Wie viel wurde hinzugefügt?** Gesamtmenge der Zugänge
- **Wie viele Buchungen?** Anzahl aller Bewegungen
- **Gesamtwert?** Finanzieller Impact
- **Bewegungsverlauf** Chronologische Historie aller Buchungen

### 📊 Datenvorschau
- Tabellarische Darstellung aller Daten
- Konfigurierbare Zeilenzahl (10, 25, 50, 100, Alle)
- Export als JSON/CSV

### 🎨 Benutzerfreundlichkeit
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Barrierefreiheit**: WCAG-konform mit ARIA-Attributen
- **Drag & Drop**: Intuitive Datei-Upload-Funktion
- **Tab-Navigation**: Business Analyse, Datenvorschau, Artikel-Suche

## 📋 Beispiel-Analyse

Aus Daten wie:
```
Artikel: 468186
Artikelkurztext: Seba.Creme 75ml
Bewegungsartentext: WA Best.Korr.neg.
Menge: -3
Betrag Hauswähr: -12,15
VK-Wert mit MWST: -23,88
Benutzer: WEBERPAT
```

**Erhalten Sie Antworten auf:**
- ✅ Wie viel wurde abgeschrieben? **3 Stück**
- ✅ Welcher Wert ging verloren? **12,15 EUR (EK) / 23,88 EUR (VK)**
- ✅ Wer hat gebucht? **WEBERPAT**
- ✅ Wann? **14.11.2025**
- ✅ Gesamte Historie des Artikels? **Siehe Artikel-Suche!**

## Installation

Keine Installation erforderlich! Einfach die `index.html` im Browser öffnen.

### Voraussetzungen
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Internetverbindung (für SheetJS CDN)

## Verwendung

### 1. Datei hochladen
- **Option A**: Ziehen Sie eine XLSX-Datei in den Upload-Bereich
- **Option B**: Klicken Sie auf "Datei auswählen" und wählen Sie eine Datei aus

### 2. Arbeitsblatt auswählen
- Wählen Sie ein Arbeitsblatt aus dem Dropdown-Menü
- Bei nur einem Arbeitsblatt erfolgt die Auswahl automatisch

### 3. Analyse auswählen
- **💼 Business Analyse** (Standard): Umfassende Geschäftsauswertung
  - Gesamtübersicht mit allen wichtigen Kennzahlen
  - Finanzielle Auswirkung (Gewinn/Verlust, Margen)
  - Abschreibungen und Verluste
  - Zugänge und Gewinne
  - Top Artikel nach Wert
  - Bewegungsarten-Übersicht
  - Benutzeraktivität
  - Zeitverlauf

- **📊 Datenvorschau**: Rohdaten-Ansicht
  - Tabellarische Darstellung
  - Konfigurierbare Zeilenzahl
  - Export-Funktionen

- **🔍 Artikel-Suche**: Detailanalyse einzelner Artikel
  - Artikelnummer eingeben
  - Komplette Historie anzeigen
  - Abschreibungen, Zugänge, Buchungen
  - Chronologischer Bewegungsverlauf

### 4. Daten analysieren oder exportieren
- Durchsuchen Sie die automatisch generierten Analysen
- Nutzen Sie die Artikel-Suche für spezifische Fragen
- Exportieren Sie Daten als JSON oder CSV

## Projektstruktur

```
bestandsveränderung/
├── index.html              # Haupt-HTML-Datei
├── start.html              # Willkommensseite
├── test.html               # Test-Übersicht
├── css/
│   └── main.css           # Styling und Design (erweitert für Business-Features)
├── js/
│   ├── constants.js       # Anwendungskonstanten
│   ├── utils.js           # Hilfsfunktionen
│   ├── file-handler.js    # Datei-Upload und -Verarbeitung
│   ├── data-analyzer.js   # Datenanalyse-Logik (mit Tab-Support)
│   ├── business-analyzer.js    # **NEU** Business-Logik und Berechnungen
│   ├── business-ui-renderer.js # **NEU** Business-Visualisierungen
│   ├── ui-renderer.js     # UI-Rendering
│   └── app.js             # Hauptanwendung
├── README.md              # Diese Datei
├── QUICKSTART.md          # Schnellstart-Anleitung
└── SUMMARY.md             # Projekt-Zusammenfassung
```

## Technologien

- **SheetJS (xlsx)**: v0.20.3 - XLSX-Datei-Parsing
- **Vanilla JavaScript**: ES6+ Features
- **CSS3**: Moderne CSS-Features mit Custom Properties
- **HTML5**: Semantisches HTML mit ARIA-Attributen

## Unterstützte Dateiformate

- `.xlsx` - Excel 2007+ (Office Open XML)
- `.xls` - Excel 97-2004
- `.xlsb` - Excel Binary Format

## Einschränkungen

- **Maximale Dateigröße**: 50 MB
- **Browser-basiert**: Alle Verarbeitungen erfolgen im Browser (keine Server-Kommunikation)
- **Moderner Browser erforderlich**: IE11 wird nicht unterstützt

## Tastaturkürzel

- **Escape**: Fehlermeldung schließen
- **Strg+R / Cmd+R**: Anwendung zurücksetzen (mit Bestätigung)

## Sicherheit

- Alle Daten werden lokal im Browser verarbeitet
- Keine Server-Kommunikation außer SheetJS CDN-Laden
- Keine Datenspeicherung oder -übertragung
- Input-Validierung und -Sanitisierung

## Browser-Kompatibilität

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
❌ Internet Explorer

## Lizenz

Dieses Projekt verwendet SheetJS Community Edition, welche unter der Apache 2.0 Lizenz steht.

## Entwicklung

### Lokalen Server starten

```powershell
# Mit Python
python -m http.server 8000

# Mit Node.js (http-server)
npx http-server -p 8000
```

Dann öffnen Sie `http://localhost:8000` im Browser.

### Debugging

Die Anwendung exportiert ein globales `App`-Objekt für Debugging:

```javascript
// Im Browser-Konsole
App.getState()        // Aktuellen Zustand anzeigen
App.reset()           // Anwendung zurücksetzen
```

## Fehlerbehebung

### "Bibliothek konnte nicht geladen werden"
- Überprüfen Sie Ihre Internetverbindung
- SheetJS CDN muss erreichbar sein
- Browser-Konsole auf Fehler prüfen

### "Fehler beim Lesen der Datei"
- Datei könnte beschädigt sein
- Dateigröße überschreitet 50 MB
- Dateiformat wird nicht unterstützt

### Daten werden nicht angezeigt
- Arbeitsblatt könnte leer sein
- Wählen Sie ein anderes Arbeitsblatt aus
- Überprüfen Sie die Dateistruktur

## Mitwirkende

Entwickelt mit Fokus auf Benutzerfreundlichkeit, Leistung und Barrierefreiheit.

## Changelog

### Version 2.0.0 (2025-11-14)
- ✨ **Business Analyse** - Umfassende Geschäftsauswertung
- ✨ **Artikel-Suche** - Detailanalyse einzelner Artikel
- ✨ **Finanzielle Kennzahlen** - Gewinn/Verlust, Margen, Netto-Impact
- ✨ **Abschreibungs-Analyse** - Top-Verlierer identifizieren
- ✨ **Benutzer-Tracking** - Wer bucht wie viel?
- ✨ **Tab-Navigation** - Bessere Übersichtlichkeit
- 🎨 **Erweiterte Visualisierungen** - Farbkodierung, Sortierung
- 🚀 **Performance** - Optimierte Berechnungen
- 📊 **Neue Metriken** - Über 20 Business-KPIs

### Version 1.0.0 (2025-11-14)
- ✨ Initiales Release
- 📊 XLSX-Datei-Analyse
- 📤 JSON/CSV-Export
- 🎨 Responsive Design
- ♿ Barrierefreiheit

---

**Hinweis**: Dieses Tool dient der lokalen Analyse von Excel-Dateien und speichert keine Daten auf einem Server.
