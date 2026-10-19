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

Einstellungen › Geräte & Dienste › Raum-Dashboard › **Konfigurieren**: zwei Regler.

- **Möbel durchsichtig** (0–100 %): macht die Möbel durchsichtig, Wände und Böden bleiben.
- **Outlines leuchten** (0–100 %): lässt die Kanten leuchten. Braucht etwas mehr Rechenleistung, solange der Wert über 0 steht.

Nach dem Speichern die Seite „Räume“ einmal neu laden.

Raum antippen zoomt hinein, denselben Raum nochmal antippen zoomt wieder heraus.

## Was die Seite darf

- Lesen: alle Zustände, die das Home-Assistant-Frontend dem angemeldeten Benutzer zeigt.
- Schalten: nur an/aus für Lampen, Schalter, Lüfter und Ein/Aus-Helfer, die als Punkt im Plan stehen, nur durch Antippen in der Seite. Sonst nichts.
- Speichern: nur die eigenen Punkte, nur Administratoren.

## Gerätenamen

Die Lampen und Sensoren im Arbeitszimmer sowie Robi werden beim ersten Öffnen über ihren Anzeigenamen gefunden (`frontend/wohnung.html`, Block `HINT`). Alles andere verbindest du selbst über **✎ Punkte**.
