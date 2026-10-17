# Raum-Dashboard

3D-Ansicht deiner Räume als Seite „Räume“ in der Home-Assistant-Seitenleiste. Läuft komplett lokal, keine Cloud, keine Bibliotheken aus dem Netz.

Stand 0.1.0: Arbeitszimmer. Lampen zeigen und schalten den echten Zustand, Pins zeigen Luftsensor, Fenster, Heizung, Robi und Drucker-Steckdose.

## Installation (HACS)

1. HACS › Drei Punkte › Benutzerdefinierte Repositories › Adresse dieses Repos, Typ **Integration**.
2. Herunterladen, Home Assistant neu starten.
3. Einstellungen › Geräte & Dienste › Integration hinzufügen › **Raum-Dashboard** (nur bestätigen).
4. Seite „Räume“ erscheint in der Seitenleiste.

## Was die Seite darf

- Lesen: alle Zustände, die das Home-Assistant-Frontend dem angemeldeten Benutzer zeigt.
- Schalten: nur Lampen (`light.turn_on` / `light.turn_off`), nur durch Klick in der Seite. Sonst nichts.

## Gerätenamen

Die Seite findet Geräte über ihren Anzeigenamen (`frontend/raum-dashboard.js`, Block `NAMEN`). Wird ein Gerät umbenannt, dort anpassen.
