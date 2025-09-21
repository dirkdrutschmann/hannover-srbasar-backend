const { DataTypes } = require('sequelize');
const { sequelize } = require('../_config/database');

/**
 * Sequelize-Modell für die 'links' Tabelle in der MariaDB-Datenbank.
 * Jeder Eintrag in der 'links' Tabelle repräsentiert einen Link mit folgenden Eigenschaften:
 * - userId: Referenz zu einem User-Eintrag (Foreign Key).
 * - verein: Der Name des Vereins.
 * - lizenzstufe: Die Lizenzstufe.
 * - link: Der Link selbst.
 * - start: Das Startdatum/-zeit der Gültigkeit des Links.
 * - end: Das Enddatum/-zeit der Gültigkeit des Links.
 * - onlyShow: Boolean, ob der Link nur angezeigt werden soll.
 */
const Link = sequelize.define('Link', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    verein: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lizenzstufe: {
        type: DataTypes.STRING,
        allowNull: true
    },
    link: {
        type: DataTypes.STRING,
        allowNull: true
    },
    start: {
        type: DataTypes.STRING,
        allowNull: true
    },
    end: {
        type: DataTypes.STRING,
        allowNull: true
    },
    onlyShow: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'links',
    timestamps: true
});

module.exports = Link;