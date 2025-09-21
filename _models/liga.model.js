const { DataTypes } = require('sequelize');
const { sequelize } = require('../_config/database');

/**
 * Sequelize-Modell für die 'ligas' Tabelle in der MariaDB-Datenbank.
 * Jeder Eintrag in der 'ligas' Tabelle repräsentiert eine Liga mit folgenden Eigenschaften:
 * - ligaId: Die eindeutige ID der Liga. Dies ist ein Pflichtfeld.
 * - liganame: Der Name der Liga.
 * - liganr: Die Nummer der Liga.
 * - akName: Der Name der Altersgruppe für die Liga.
 * - geschlechtId: Die ID des Geschlechts für die Liga.
 * - geschlecht: Das Geschlecht für die Liga.
 * - verbandId: Die ID des Verbands für die Liga.
 * - verbandName: Der Name des Verbands für die Liga.
 */
const Liga = sequelize.define('Liga', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ligaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    liganame: {
        type: DataTypes.STRING,
        allowNull: true
    },
    liganr: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    akName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    geschlechtId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    geschlecht: {
        type: DataTypes.STRING,
        allowNull: true
    },
    verbandId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    verbandName: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'ligas',
    timestamps: true
});

/**
 *     mögliche API-Eigenschaften
 *     seasonId: Number,
 *     seasonName: String,
 *     actualMatchDay: Number,
 *     skName: String,
 *     skNameSmall: String,
 *     skEbeneId: Number,
 *     skEbeneName: String,
 *     bezirknr: Number,
 *     bezirkName: String,
 *     kreisnr: Number,
 *     kreisname: String,
 *     statisticType: String,
 *     vorabliga: Boolean,
 *     tableExists: Boolean,
 *     crossTableExists: Boolean,
 */

module.exports = Liga;