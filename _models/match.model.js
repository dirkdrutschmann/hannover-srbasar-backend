const { DataTypes } = require('sequelize');
const { sequelize } = require('../_config/database');

/**
 * Sequelize-Modell für die 'matches' Tabelle in der MariaDB-Datenbank.
 * Jeder Eintrag in der 'matches' Tabelle repräsentiert ein Spiel mit folgenden Eigenschaften:
 * - liganame: Der Name der Liga.
 * - matchId: Die eindeutige ID des Spiels. Dies ist ein Pflichtfeld und muss eindeutig sein.
 * - matchDay: Der Spieltag.
 * - matchNo: Die Nummer des Spiels.
 * - kickoffDate: Das Datum des Spiels.
 * - kickoffTime: Die Zeit des Spiels.
 * - homeTeam: Die Heimmannschaft des Spiels.
 * - guestTeam: Die Gastmannschaft des Spiels.
 * - verzicht: Boolean, ob das Spiel aufgegeben wurde.
 * - abgesagt: Boolean, ob das Spiel abgesagt wurde.
 * - spielfeld: Das Spielfeld des Spiels.
 * - sr1: Der erste Schiedsrichter des Spiels.
 * - sr1Name: Der Name des ersten Schiedsrichters.
 * - sr1Basar: Boolean, ob der erste Schiedsrichter vom Basar ist.
 * - sr1Besetzt: Boolean, ob der erste Schiedsrichter besetzt ist.
 * - sr1Bonus: Der Bonus des ersten Schiedsrichters.
 * - sr1Mail: Die E-Mail des ersten Schiedsrichters.
 * - sr1Info: Zusätzliche Informationen über den ersten Schiedsrichter.
 * - sr2: Der zweite Schiedsrichter des Spiels.
 * - sr2Name: Der Name des zweiten Schiedsrichters.
 * - sr2Basar: Boolean, ob der zweite Schiedsrichter vom Basar ist.
 * - sr2Besetzt: Boolean, ob der zweite Schiedsrichter besetzt ist.
 * - sr2Bonus: Der Bonus des zweiten Schiedsrichters.
 * - sr2Info: Zusätzliche Informationen über den zweiten Schiedsrichter.
 * - sr2Mail: Die E-Mail des zweiten Schiedsrichters.
 */
const Match = sequelize.define('Match', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    liganame: {
        type: DataTypes.STRING,
        allowNull: true
    },
    matchId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    matchDay: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    matchNo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    kickoffDate: {
        type: DataTypes.STRING,
        allowNull: true
    },
    kickoffTime: {
        type: DataTypes.STRING,
        allowNull: true
    },
    homeTeam: {
        type: DataTypes.STRING,
        allowNull: true
    },
    guestTeam: {
        type: DataTypes.STRING,
        allowNull: true
    },
    verzicht: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    abgesagt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    spielfeld: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sr1: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sr1Name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sr1Basar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sr1Besetzt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sr1Bonus: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sr1Mail: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sr1Info: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sr2: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sr2Name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sr2Basar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sr2Besetzt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sr2Bonus: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sr2Info: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sr2Mail: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'matches',
    timestamps: true
});

module.exports = Match;