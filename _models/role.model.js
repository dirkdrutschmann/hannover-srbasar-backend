const { DataTypes } = require('sequelize');
const { sequelize } = require('../_config/database');

/**
 * Sequelize-Modell für die 'roles' Tabelle in der MariaDB-Datenbank.
 * Jeder Eintrag in der 'roles' Tabelle repräsentiert eine Rolle mit folgender Eigenschaft:
 * - name: Der Name der Rolle.
 */
const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'roles',
    timestamps: true
});

module.exports = Role;