# Spielebasar Backend

Ein Node.js/Express Backend für das BBV-Spielebasar System mit MariaDB-Datenbank und JWT-Authentifizierung.

## 👨‍💻 Autor

**Dirk Drutschmann**  
📧 [mail@drutschmann.dev](mailto:mail@drutschmann.dev)

## 📄 Lizenz

Dieses Projekt steht unter der **Creative Commons Attribution-NonCommercial 4.0 International License** (CC BY-NC 4.0).

### Was ist erlaubt:

- ✅ **Teilen**: Das Material in jedem Medium oder Format verbreiten
- ✅ **Anpassen**: Das Material remixen, verändern und darauf aufbauen
- ✅ **Open Source**: Das Projekt ist Open Source und kann geforkt werden

### Was ist nicht erlaubt

- ❌ **Kommerzielle Nutzung**: Das Material darf nicht für kommerzielle Zwecke verwendet werden

### Attribution

Bei der Nutzung oder Weiterverbreitung muss der Autor genannt werden:

```text
Autor: Dirk Drutschmann (mail@drutschmann.dev)
Lizenz: CC BY-NC 4.0
```

## 🤝 Beitragen

**Feel free to pull request!**

Wir freuen uns über Beiträge zur Verbesserung des Projekts:

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch
3. Committen Sie Ihre Änderungen
4. Pushen Sie zum Branch
5. Erstellen Sie einen Pull Request

## 🚀 Features

- **RESTful API**: Express.js Backend mit strukturierten Routen
- **MariaDB Integration**: Sequelize ORM für Datenbankoperationen
- **JWT Authentication**: Sichere Authentifizierung mit JSON Web Tokens
- **Role-based Access Control**: Benutzerrollen (user, vrsw, admin)
- **Email Integration**: Nodemailer für E-Mail-Versand
- **Password Reset**: Sichere Passwort-Zurücksetzung
- **CORS Support**: Cross-Origin Resource Sharing konfiguriert
- **Error Handling**: Zentrale Fehlerbehandlung
- **External API Integration**: Basketball-Bund.net API Integration

## 🛠️ Technologie-Stack

- **Node.js**: JavaScript Runtime
- **Express.js**: Web Framework
- **MariaDB**: Relationale Datenbank
- **Sequelize**: SQL ORM für Node.js
- **JWT**: JSON Web Tokens für Authentifizierung
- **bcryptjs**: Password Hashing
- **nodemailer**: E-Mail-Versand
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment Variables Management
- **axios**: HTTP Client für externe APIs
- **basketball-bund-sdk**: TypeScript SDK für die Basketball-Bund.net REST API

## 📁 Projekt-Struktur

```text
├── _controller/           # Controller für API-Endpunkte
│   ├── auth.controller.js # Authentifizierung & Benutzer-Management
│   ├── link.controller.js # Link-Management
│   ├── ref.controller.js  # Schiedsrichter-Management
│   ├── update.controller.js # Update-Operationen
│   └── user.controller.js # Benutzer-Operationen
├── _init/
│   └── roles.js          # Rollen-Initialisierung
├── _mailer/
│   ├── logo.png          # E-Mail Logo
│   └── mailer.js         # E-Mail-Service
├── _middleware/
│   ├── authJwt.js        # JWT-Authentifizierung
│   ├── error-handler.js  # Fehlerbehandlung
│   ├── index.js          # Middleware-Index
│   └── verifySignUp.js   # Registrierungs-Validierung
├── _models/
│   ├── answer.model.js   # Antwort-Model
│   ├── index.js          # Model-Index
│   ├── liga.model.js     # Liga-Model
│   ├── link.model.js     # Link-Model
│   ├── match.model.js    # Spiel-Model
│   ├── role.model.js     # Rolle-Model
│   └── user.model.js     # Benutzer-Model
├── _teamsl/
│   └── update.js         # Update-Operationen mit basketball-bund-sdk
├── routes/               # API-Routen
│   ├── auth.routes.js    # Authentifizierungs-Routen
│   ├── index.js          # Route-Index
│   ├── link.routes.js    # Link-Routen
│   ├── ref.routes.js     # Schiedsrichter-Routen
│   ├── update.routes.js  # Update-Routen
│   └── user.routes.js    # Benutzer-Routen
├── server.js             # Haupt-Server-Datei
├── cron.js               # Cron-Jobs
└── ecosystem.config.js   # PM2-Konfiguration
```

## 🌍 Umgebungsvariablen

Das Projekt verwendet Umgebungsvariablen für die Konfiguration. Kopiere `env.sample` zu `.env` und passe die Werte an:

```bash
# .env Datei erstellen
cp env.sample .env

# Werte anpassen
```

### Verfügbare Umgebungsvariablen

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
DEV_PORT=3000

# Database Configuration
DATABASE_SERVER=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_database_password
DATABASE=your_database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration
UNIX_SENTMAIL=true
MAILER_FROM=no-reply@yourdomain.com
MAILER_HOST=yourdomain.com
MAILER_PORT=465
MAILER_SECURE=true
MAILER_USER=no-reply@yourdomain.com
MAILER_PASS=your_email_password

# Frontend URLs
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS="https://yourdomain.com,http://localhost:5173"

# External APIs
BASKETBALL_BUND_API=https://www.basketball-bund.net/rest

# WhatsApp Configuration
WHATSAPP_API_URL=https://wa.me

# Security
BCRYPT_ROUNDS=8

# Logging
LOG_LEVEL=info
```

## 🚀 Installation & Entwicklung

### Voraussetzungen

- Node.js 18+
- MariaDB 10.3+
- npm oder yarn

### Installation

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp env.sample .env
# .env Datei bearbeiten und Werte anpassen
```

### Entwicklung

```bash
# Development Server starten
npm run serve
```

Server startet auf [http://localhost:3000](http://localhost:3000)

### Production

```bash
# Production Server starten
npm run run
```

## 🔧 API-Endpunkte

### Authentifizierung

- `POST /api/auth/signin` - Benutzer anmelden
- `POST /api/auth/signup` - Benutzer registrieren
- `POST /api/auth/forgotPassword` - Passwort vergessen
- `POST /api/auth/validateResetToken` - Reset-Token validieren
- `POST /api/auth/resetPassword` - Passwort zurücksetzen

### Benutzer

- `GET /api/user/profile` - Benutzerprofil abrufen
- `PUT /api/user/profile` - Benutzerprofil aktualisieren
- `GET /api/user/all` - Alle Benutzer abrufen (Admin)

### Schiedsrichter

- `GET /api/ref/basar` - Basar-Spiele abrufen
- `POST /api/ref/uebernahme` - Spielübernahme anfragen
- `GET /api/ref/vereine` - Vereine abrufen

### Links

- `GET /api/link/all` - Alle Links abrufen
- `POST /api/link/create` - Link erstellen
- `PUT /api/link/update` - Link aktualisieren
- `DELETE /api/link/delete` - Link löschen

## 🔐 Sicherheit

### JWT Authentication

- Tokens haben eine Gültigkeit von 24 Stunden
- Sichere Passwort-Hashing mit bcrypt
- Role-based Access Control

### CORS

- Konfiguriert für Cross-Origin Requests
- Credentials Support aktiviert

### Environment Variables

- Alle sensiblen Daten in Umgebungsvariablen
- Keine hartcodierten Secrets im Code

## 📧 E-Mail-Integration

### Features

- Passwort-Reset E-Mails
- Account-Erstellung Benachrichtigungen
- Spielübernahme-Anfragen
- HTML-E-Mail-Templates

### Konfiguration

```bash
UNIX_SENTMAIL=true
MAILER_FROM=no-reply@yourdomain.com
MAILER_HOST=yourdomain.com
MAILER_PORT=465
MAILER_SECURE=true
MAILER_USER=no-reply@yourdomain.com
MAILER_PASS=your_email_password
```

## 🔄 Externe API-Integration

### Basketball-Bund.net API

Das Projekt verwendet das **basketball-bund-sdk** für die Integration mit der Basketball-Bund.net REST API:

#### Installation

```bash
npm install git+https://github.com/dirkdrutschmann/basketball-bund-sdk.git
```

#### Verwendung

```javascript
const { BasketballBundSDK } = require('basketball-bund-sdk');

// SDK initialisieren
const sdk = new BasketballBundSDK();

// Liga-Liste abrufen
const ligen = await sdk.wam.getLigaList({
  akgGeschlechtIds: [],
  altersklasseIds: [],
  gebietIds: [],
  ligatypIds: [],
  sortBy: 0,
  spielklasseIds: [],
  token: "",
  verbandIds: [3],
  startAtIndex: 0,
});

// Spielplan für eine Liga abrufen
const spielplan = await sdk.competition.getSpielplan({
  competitionId: ligaId,
});

// Spiel-Informationen abrufen
const matchInfo = await sdk.match.getMatchInfo({
  matchId: matchId,
});
```

#### Features

- **Liga-Management**: Automatische Liga-Daten Abruf und Aktualisierung
- **Spielplan-Integration**: Spielplan-Daten für alle Ligen
- **Spiel-Details**: Detaillierte Spiel-Informationen mit Schiedsrichter-Daten
- **Authentifizierung**: Automatische API-Authentifizierung
- **Error Handling**: Robuste Fehlerbehandlung für API-Aufrufe

#### Verfügbare Services

- `sdk.wam` - WAM (Wettkampf-Ausschreibungs-Management) Services
- `sdk.competition` - Wettkampf-Management Services  
- `sdk.match` - Spiel-Management Services
- `sdk.club` - Verein-Management Services
- `sdk.team` - Team-Management Services
- `sdk.user` - Benutzer-Management Services
- `sdk.auth` - Authentifizierungs-Services

### WhatsApp Integration

- Direkte WhatsApp-Nachrichten
- Spielübernahme-Bestätigungen

## 🐛 Troubleshooting

### Häufige Probleme

1. **MariaDB-Verbindung fehlgeschlagen**: Prüfe DATABASE_SERVER, DATABASE_USER, DATABASE_PASSWORD in .env
2. **JWT-Fehler**: Prüfe JWT_SECRET in .env
3. **E-Mail-Versand fehlgeschlagen**: Prüfe E-Mail-Konfiguration
4. **CORS-Fehler**: CORS ist für alle Origins konfiguriert

### Debugging

```bash
# Logs anzeigen
tail -f error.log

# Server mit Debug-Modus starten
NODE_ENV=development npm run serve

# MariaDB-Verbindung testen
mysql -h localhost -u your_database_user -p your_database_name
```

## 📝 Changelog

### v0.0.2 - Basketball-Bund SDK Integration

- Integration des basketball-bund-sdk für verbesserte API-Aufrufe
- Ersetzung der direkten axios-Aufrufe durch SDK-Methoden
- Verbesserte Fehlerbehandlung für API-Integration
- Robuste Null-Checks für API-Responses

### v0.0.1 - Initial Release

- Express.js Backend mit MariaDB
- JWT-Authentifizierung
- Role-based Access Control
- E-Mail-Integration
- Externe API-Integration
- Passwort-Reset-Funktionalität
- WhatsApp-Integration
- Umgebungsvariablen-Konfiguration

---

**Entwickelt mit ❤️ von Dirk Drutschmann**  
📧 [mail@drutschmann.dev](mailto:mail@drutschmann.dev) | 📄 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
