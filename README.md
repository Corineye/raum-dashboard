# Raum-Dashboard

3D-Ansicht deiner Räume als Seite „Räume“ in der Home-Assistant-Seitenleiste. Läuft komplett lokal, keine Cloud, keine Bibliotheken aus dem Netz.

Stand 0.3.0: die ganze Wohnung (Wohnzimmer, Esszimmer, Arbeitszimmer, Flur, Schlafzimmer, Bad, Küche) in Schrägansicht von oben. Raum antippen zoomt hinein.

## Eigene Punkte

Oben links **✎ Punkte** (nur für Administratoren):

1. Auf eine Stelle im Plan tippen (Boden, Wand oder Möbel). Dort entsteht ein neuer Punkt.
2. Gerät aus Home Assistant suchen und wählen, Namen und Symbol anpassen, **Speichern**.
3. Einen vorhandenen Punkt antippen, um ihn zu ändern, zu **verschieben** (danach neue Stelle antippen) oder zu **löschen**.
4. **✓ Fertig** beendet das Bearbeiten.

Lampen, Schalter, Lüfter und Ein/Aus-Helfer werden als runder Knopf gezeigt und schalten beim Antippen. Alles andere (Sensoren, Fenster, Heizung, Robi …) zeigt seinen Wert. Die Lampen und Sensoren aus dem Plan sind schon als Punkte da und lassen sich genauso mit einem Gerät verbinden. Gestrichelt umrandete Punkte haben noch kein Gerät.

Die Punkte speichert die Integration in Home Assistant (`.storage/raum_dashboard.punkte`). Sie sind damit auf Handy und PC gleich und landen in den Backups.

## Installation (HACS)

1. HACS › Drei Punkte › Benutzerdefinierte Repositories › Adresse dieses Repos, Typ **Integration**.
2. Herunterladen, Home Assistant neu starten.
3. Einstellungen › Geräte & Dienste › Integration hinzufügen › **Raum-Dashboard** (nur bestätigen).
4. Seite „Räume“ erscheint in der Seitenleiste.

## Darstellung

Einstellungen › Geräte & Dienste › Raum-Dashboard › **Konfigurieren**: zwei Regler und zwei Schalter.

- **Möbel durchsichtig** (0–100 %): macht die Möbel durchsichtig, Wände und Böden bleiben.
- **Outlines leuchten** (0–100 %): lässt die Kanten leuchten. Braucht etwas mehr Rechenleistung, solange der Wert über 0 steht.

- **Temperatur-Farben**: der Boden jedes Raums färbt sich von blau (kalt) über grün bis orange (warm), die Raumtemperatur steht am Namen. Nutzt Klima- und Temperatursensor-Punkte im Raum.
- **Himmel nach Zeit und Wetter**: Licht und Hintergrund folgen `sun.sun`, Regen und Schnee kommen aus der ersten `weather`-Entität. Ohne diese Entitäten wird die Uhrzeit benutzt.

Nach dem Speichern die Seite „Räume“ einmal neu laden.

Raum antippen zoomt hinein, denselben Raum nochmal antippen zoomt wieder heraus.

## Was die Seite darf

- Lesen: alle Zustände, die das Home-Assistant-Frontend dem angemeldeten Benutzer zeigt.
- Schalten: nur an/aus für Lampen, Schalter, Lüfter und Ein/Aus-Helfer, die als Punkt im Plan stehen, nur durch Antippen in der Seite. Sonst nichts.
- Speichern: nur die eigenen Punkte, nur Administratoren.

## Gerätenamen

Die Lampen und Sensoren im Arbeitszimmer sowie Robi werden beim ersten Öffnen über ihren Anzeigenamen gefunden (`frontend/wohnung.html`, Block `HINT`). Alles andere verbindest du selbst über **✎ Punkte**.

## Warnungen und Szenen

- **Warnsymbole** erscheinen im Raum: Fenster offen, während geheizt wird; Kühl- oder Gefrierschrank-Tür länger als 3 Minuten offen (Name enthält „Kühl“, „Gefrier“ oder „Tief“); Gerät nicht erreichbar. Die Anzahl steht unten im Dock.
- **Szenen**: unten „＋ Szene“ (nur Administratoren) speichert, welche Lampen und Schalter gerade an und aus sind. Antippen stellt sie wieder her. Im Bearbeiten-Modus löscht „✕ Name“ eine Szene. Gespeichert in Home Assistant, auf allen Geräten gleich.

## Sensor-Details

Tippt man in der Wohnung auf ein Sensor-Schild (Temperatur, Luftfeuchte, Fenster, Heizung …), öffnet sich ein Fenster mit dem aktuellen Wert und einem Verlauf der letzten 6 Stunden, 24 Stunden oder 7 Tage. Über den Graphen streichen zeigt den Wert zu einer Uhrzeit. Nach unten wischen oder ✕ schließt es. Der Verlauf kommt aus dem Recorder von Home Assistant, das Gerät muss also aufgezeichnet werden (Standard).
