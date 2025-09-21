# Migration von MongoDB zu MariaDB mit Sequelize

Diese Anleitung beschreibt die Migration des Spielebasar-Backends von MongoDB (mit Mongoose) zu MariaDB (mit Sequelize).

## Durchgeführte Änderungen

### 1. Package.json aktualisiert
- `mongoose` entfernt
- `sequelize` und `mariadb` hinzugefügt

### 2. Umgebungsvariablen angepasst
Die folgenden Umgebungsvariablen wurden in `env.sample` geändert:
- `MONGO_DB_NAME` → `DB_NAME`
- `MONGO_URL` → `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`

### 3. Datenbankkonfiguration erstellt
- Neue Datei `_config/database.js` mit Sequelize-Konfiguration für MariaDB
- Verbindungstest und Synchronisationsfunktionen

### 4. Modelle konvertiert
Alle Mongoose-Modelle wurden zu Sequelize-Modellen konvertiert:
- `_models/role.model.js`
- `_models/user.model.js`
- `_models/liga.model.js`
- `_models/match.model.js`
- `_models/link.model.js`
- `_models/answer.model.js`

### 5. Assoziationen definiert
In `_models/index.js` wurden die Beziehungen zwischen den Modellen definiert:
- User ↔ Role (many-to-many)
- User ↔ Link (one-to-many)
- Link ↔ Answer (one-to-many)

### 6. Controller aktualisiert
Alle Controller wurden für Sequelize-Operationen angepasst:
- `_controller/user.controller.js`
- `_controller/auth.controller.js`
- `_controller/link.controller.js`
- `_controller/ref.controller.js`

### 7. Server-Konfiguration angepasst
`server.js` wurde für die neue Datenbankverbindung und -initialisierung angepasst.

## Installation und Setup

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. MariaDB-Datenbank einrichten
Stellen Sie sicher, dass MariaDB läuft und erstellen Sie eine Datenbank:
```sql
CREATE DATABASE spielebasar;
```

### 3. Umgebungsvariablen konfigurieren
Kopieren Sie `env.sample` zu `.env` und passen Sie die Werte an:
```bash
cp env.sample .env
```

Bearbeiten Sie `.env`:
```
DB_NAME=spielebasar
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
```

### 4. Server starten
```bash
npm run serve
```

Die Datenbanktabellen werden automatisch erstellt und die Rollen initialisiert.

## Wichtige Hinweise

### Datenbankstruktur
- Alle Tabellen haben `id` als Primary Key (auto-increment)
- Timestamps werden automatisch verwaltet (`createdAt`, `updatedAt`)
- JSON-Felder werden für komplexe Datenstrukturen verwendet (z.B. `club` Array)

### Assoziationen
- User-Role Beziehung über Junction-Tabelle `user_roles`
- Foreign Keys verwenden `userId`, `linkId` etc.
- Einige Beziehungen (wie Liga-Match) sind über String-Felder implementiert

### Migration von bestehenden Daten
Für die Migration bestehender MongoDB-Daten müssen Sie:
1. Ein Migrationsskript erstellen
2. Daten aus MongoDB exportieren
3. Daten in das neue MariaDB-Schema transformieren
4. Daten in MariaDB importieren

### Unterschiede zu MongoDB
- Keine `_id` Felder mehr (verwenden Sie `id`)
- Keine `populate()` Funktionen (verwenden Sie `include`)
- Query-Syntax ist anders (Sequelize statt Mongoose)
- Transaktionen sind explizit erforderlich

## Fehlerbehebung

### Verbindungsfehler
- Überprüfen Sie die MariaDB-Verbindungsparameter
- Stellen Sie sicher, dass MariaDB läuft
- Überprüfen Sie die Firewall-Einstellungen

### Modellfehler
- Überprüfen Sie die Assoziationen in `_models/index.js`
- Stellen Sie sicher, dass alle Foreign Keys korrekt definiert sind

### Controller-Fehler
- Überprüfen Sie die Sequelize-Query-Syntax
- Verwenden Sie `try-catch` Blöcke für Fehlerbehandlung
- Loggen Sie Fehler für bessere Debugging-Informationen
