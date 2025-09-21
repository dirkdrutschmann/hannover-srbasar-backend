const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Sequelize-Konfiguration für MariaDB
 * Diese Datei stellt die Datenbankverbindung für die Anwendung bereit.
 */

// Zeitzonenkonfiguration - verschiedene Optionen für Kompatibilität
const timezoneOptions = [
    '+01:00',  // UTC+1 (Deutschland Winterzeit)
    '+02:00',  // UTC+2 (Deutschland Sommerzeit)
    'local',   // Lokale Zeitzone
    'Z'        // UTC
];

// Wähle die erste verfügbare Zeitzonenoption
const timezone = process.env.DATABASE_TIMEZONE || timezoneOptions[0];

const sequelize = new Sequelize(
    process.env.DATABASE || 'your_database_name',
    process.env.DATABASE_USER || 'your_database_user',
    process.env.DATABASE_PASSWORD || 'your_database_password',
    {
        host: process.env.DATABASE_SERVER || 'localhost',
        port: process.env.DATABASE_PORT || 3306,
        dialect: 'mariadb',
        dialectOptions: {
            timezone: timezone,
            // Zusätzliche MariaDB-spezifische Optionen
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        // Zeitzone auch auf Sequelize-Ebene setzen
        timezone: timezone
    }
);

/**
 * Testet die Datenbankverbindung mit verschiedenen Zeitzonenoptionen
 */
async function testConnection() {
    // Versuche zuerst mit der konfigurierten Zeitzone
    try {
        await sequelize.authenticate();
        console.log(`MariaDB-Verbindung erfolgreich hergestellt (Zeitzone: ${timezone}).`);
        return true;
    } catch (error) {
        console.warn(`Verbindung mit Zeitzone ${timezone} fehlgeschlagen:`, error.message);
        
        // Versuche alternative Zeitzonen
        for (const altTimezone of timezoneOptions.slice(1)) {
            try {
                console.log(`Versuche alternative Zeitzone: ${altTimezone}`);
                
                // Erstelle neue Sequelize-Instanz mit alternativer Zeitzone
                const altSequelize = new Sequelize(
                    process.env.DATABASE || 'your_database_name',
                    process.env.DATABASE_USER || 'your_database_user',
                    process.env.DATABASE_PASSWORD || 'your_database_password',
                    {
                        host: process.env.DATABASE_SERVER || 'localhost',
                        port: process.env.DATABASE_PORT || 3306,
                        dialect: 'mariadb',
                        dialectOptions: {
                            timezone: altTimezone,
                            charset: 'utf8mb4',
                            collate: 'utf8mb4_unicode_ci'
                        },
                        pool: {
                            max: 5,
                            min: 0,
                            acquire: 30000,
                            idle: 10000
                        },
                        logging: false,
                        timezone: altTimezone
                    }
                );
                
                await altSequelize.authenticate();
                console.log(`MariaDB-Verbindung erfolgreich mit Zeitzone: ${altTimezone}`);
                
                // Ersetze die globale sequelize-Instanz
                Object.assign(sequelize, altSequelize);
                return true;
                
            } catch (altError) {
                console.warn(`Alternative Zeitzone ${altTimezone} auch fehlgeschlagen:`, altError.message);
            }
        }
        
        console.error('Alle Zeitzonenoptionen fehlgeschlagen. Fehler bei der MariaDB-Verbindung:', error);
        return false;
    }
}

/**
 * Synchronisiert die Datenbank (erstellt Tabellen falls sie nicht existieren)
 */
async function syncDatabase() {
    try {
        await sequelize.sync({ alter: true });
        console.log('Datenbank erfolgreich synchronisiert.');
    } catch (error) {
        console.error('Fehler bei der Datenbanksynchronisation:', error);
    }
}

module.exports = {
    sequelize,
    testConnection,
    syncDatabase
};
