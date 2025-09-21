const { DataTypes } = require('sequelize');
const { sequelize } = require('../_config/database');

/**
 * Sequelize-Modell für die 'users' Tabelle in der MariaDB-Datenbank.
 * Jeder Eintrag in der 'users' Tabelle repräsentiert einen Benutzer mit folgenden Eigenschaften:
 * - email: Die E-Mail-Adresse des Benutzers.
 * - password: Das gehashte Passwort des Benutzers.
 * - firstName: Der Vorname des Benutzers.
 * - lastName: Der Nachname des Benutzers.
 * - club: JSON-Array von Strings, die die Vereine repräsentieren, denen der Benutzer angehört.
 * - showContact: Boolean, ob die Kontaktinformationen des Benutzers angezeigt werden sollen.
 * - contactInfo: Die Kontaktinformationen des Benutzers.
 * - showMail: Boolean, ob die E-Mail des Benutzers angezeigt werden soll.
 * - showInfo: Boolean, ob die Informationen des Benutzers angezeigt werden sollen.
 * - phone: Die Telefonnummer des Benutzers.
 * - whatsapp: Boolean, ob der Benutzer WhatsApp hat.
 * - getEmails: Boolean, ob der Benutzer E-Mails erhalten möchte.
 * - name: Der Name des Benutzers.
 * - resetToken: Token für Passwort-Reset.
 * - resetTokenExpires: Ablaufdatum des Reset-Tokens.
 */
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    club: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    showContact: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    contactInfo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    showMail: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    showInfo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    whatsapp: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    getEmails: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetTokenExpires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;