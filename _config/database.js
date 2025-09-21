const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Sequelize-Konfiguration für MariaDB
 * Diese Datei stellt die Datenbankverbindung für die Anwendung bereit.
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
            timezone: 'Europe/Berlin'
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false
    }
);

/**
 * Testet die Datenbankverbindung
 */
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('MariaDB-Verbindung erfolgreich hergestellt.');
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
