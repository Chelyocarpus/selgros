# XLSX Sortier-Tool (Protokoll)

Ein Tool zum Sortieren und Visualisieren von XLSX-Dateien mit QR-Code-Generierung und intelligenter Spaltenerkennung.

## Features

### Dynamische Spaltenerkennung
Das Tool erkennt automatisch wichtige Spalten anhand ihrer Kopfzeilen (Header):

- **Artikel**: Spalten mit "artikel" im Namen
- **Lagerplatz**: Spalten mit "lagerplatz" im Namen
- **Auffüllbedarf**: Spalten mit "auffüll" oder "auffuell" im Namen
- **Proz. Ausgabemenge**: Spalten mit "proz" und "ausgabe" im Namen

Die Erkennung ist:
- **Case-insensitive**: Groß- und Kleinschreibung spielt keine Rolle
- **Partial matching**: Teilübereinstimmungen werden erkannt
- **Flexibel**: Funktioniert unabhängig von der Spaltenposition

### QR-Code-Generierung
QR-Codes werden automatisch für folgende Spalten generiert:
- **Artikel-Spalte**: Jeder Artikel erhält einen QR-Code
- **Lagerplatz-Spalte**: Jeder Lagerplatz erhält einen QR-Code

Die QR-Codes werden in separaten Spalten direkt neben den Quellspalten angezeigt.

### Spalten-Hervorhebung
Spalten werden mit gelber Hintergrundfarbe hervorgehoben:
- Die **Lagerplatz-Spalte** ist immer hervorgehoben
- Die **aktuelle Sortierspalte** (Auffüllbedarf oder Proz. Ausgabemenge) ist hervorgehoben

Die Hervorhebung passt sich automatisch an die gewählte Sortierung an.

### Anpassbare Spaltenanzeige
- Spalten können ein-/ausgeblendet werden
- Einstellungen werden im Browser gespeichert
- QR-Code-Spalten folgen automatisch ihren Quellspalten

### Sortieroptionen
- Nach **Auffüllbedarf** (gruppiert nach Lagerplatz)
- Nach **Prozentual** (gruppiert nach Lagerplatz)
- Nach **Lagerplatz** (A-Z oder Z-A)

## Verwendung

1. **Datei laden**: XLSX-Datei über "Datei auswählen" hochladen
2. **Spalten anpassen** (optional): Über "Spalten anpassen" gewünschte Spalten auswählen
3. **Sortierung wählen**: Gewünschte Sortierung aus Dropdown auswählen
4. **Export/Druck**: Über entsprechende Buttons exportieren oder drucken

## Unterstützte Dateistrukturen

Das Tool funktioniert mit verschiedenen XLSX-Strukturen, solange die Spaltenüberschriften die erkennbaren Begriffe enthalten:

### Beispiel 1: Standard-Layout
```
Artikel | Artikelkurztext | ... | Lagerplatz | ... | Auffüllbedarf | proz. Ausgabemenge
```

### Beispiel 2: Benutzerdefiniertes Layout
```
Produkt-Artikel | ... | Lager-Platz | ... | Auffüllbedarf neu
```

### Beispiel 3: Umstrukturiertes Layout
```
Lagerplatz | Artikel-Nr | ... | Prozentuale Ausgabemenge
```

## Technische Details

### Spaltenerkennung
Die Funktion `detectColumnIndices()` durchsucht alle Header und findet:
- Die erste Spalte, die den Suchbegriff enthält
- Exakte Übereinstimmungen werden bevorzugt
- Ergebnisse werden in der Konsole protokolliert

### QR-Code-Caching
- QR-Codes werden für jeden eindeutigen Wert nur einmal generiert
- Caching verbessert die Performance bei großen Dateien
- Cache wird beim Laden einer neuen Datei zurückgesetzt

### Browser-Kompatibilität
- Moderne Browser (Chrome, Firefox, Edge, Safari)
- Funktioniert vollständig offline
- Keine Server-Komponente erforderlich

## Fehlerbehebung

### "Spalte nicht gefunden"
Wenn eine Fehlermeldung über fehlende Spalten erscheint:
1. Prüfen Sie die Spaltenüberschriften in Ihrer XLSX-Datei
2. Stellen Sie sicher, dass die Überschriften die erkennbaren Begriffe enthalten
3. Öffnen Sie die Browser-Konsole (F12) und suchen Sie nach "Detected column indices"

### QR-Codes werden nicht angezeigt
- Stellen Sie sicher, dass die Zellen Werte enthalten
- QR-Codes werden nur für nicht-leere Zellen generiert
- Prüfen Sie, ob die Artikel/Lagerplatz-Spalten erkannt wurden

### Spalten fehlen nach Anpassung
- Mindestens eine Spalte muss immer ausgewählt sein
- Gespeicherte Einstellungen können über "Alle auswählen" zurückgesetzt werden

## Version
Letzte Aktualisierung: Dezember 2025
