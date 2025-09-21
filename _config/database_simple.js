const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Einfache Sequelize-Konfiguration für MariaDB ohne Zeitzonenprobleme
 * Diese Datei stellt eine robuste Datenbankverbindung bereit.
 */

const sequelize = new Sequelize(
    process.env.DATABASE || 'your_database_name',
    process.env.DATABASE_USER || 'your_database_user',
    process.env.DATABASE_PASSWORD || 'your_database_password',
    {
        host: process.env.DATABASE_SERVER || 'localhost',
        port: process.env.DATABASE_PORT || 3306,
        dialect: 'mariadb',
        dialectOptions: {
            // Keine Zeitzonenkonfiguration - vermeidet IANA-Zeitzonenprobleme
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
        // Sequelize verwendet UTC standardmäßig - keine explizite Zeitzone nötig
        define: {
            freezeTableName: true, // Verhindert Pluralisierung von Tabellennamen
            timestamps: true       // Aktiviert createdAt/updatedAt automatisch
        }
    }
);

/**
 * Testet die Datenbankverbindung
 */
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('MariaDB-Verbindung erfolgreich hergestellt (ohne Zeitzonenkonfiguration).');
        return true;
    } catch (error) {
        console.error('Fehler bei der MariaDB-Verbindung:', error);
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
