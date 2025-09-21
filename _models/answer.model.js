const { DataTypes } = require('sequelize');
const { sequelize } = require('../_config/database');

/**
 * Sequelize-Modell für die 'answers' Tabelle in der MariaDB-Datenbank.
 * Jeder Eintrag in der 'answers' Tabelle repräsentiert eine Antwort mit folgenden Eigenschaften:
 * - linkId: Referenz zu einem Link-Eintrag (Foreign Key).
 * - name: Der Name der Person, die geantwortet hat.
 * - email: Die E-Mail der Person, die geantwortet hat.
 * - telefon: Die Telefonnummer der Person, die geantwortet hat.
 * - lizenzstufe: Die Lizenzstufe der Person, die geantwortet hat.
 * - message: Die Nachricht der Antwort.
 * - games: JSON-Array von Match-IDs.
 */
const Answer = sequelize.define('Answer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    linkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'links',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    telefon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lizenzstufe: {
        type: DataTypes.STRING,
        allowNull: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    games: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    }
}, {
    tableName: 'answers',
    timestamps: true
});

module.exports = Answer;