const { DataTypes } = require('sequelize');
const { sequelize } = require('../_config/database');

/**
 * Sequelize-Modell für die 'clubs' Tabelle in der MariaDB-Datenbank.
 * Jeder Eintrag in der 'clubs' Tabelle repräsentiert einen Verein mit folgenden Eigenschaften:
 * - clubId: Die eindeutige ID des Vereins (von der API).
 * - vereinsname: Der Name des Vereins.
 * - lastUpdated: Zeitstempel der letzten Aktualisierung.
 */
const Club = sequelize.define('Club', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    clubId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    vereinsname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastUpdated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'clubs',
    timestamps: true
});

module.exports = Club;
