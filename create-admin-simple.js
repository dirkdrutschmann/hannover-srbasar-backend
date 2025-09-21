#!/usr/bin/env node

/**
 * Einfaches Script zum Erstellen eines Admin-Users (ohne Datenbanksynchronisation)
 * 
 * Verwendung:
 * node create-admin-simple.js
 * 
 * Oder mit benutzerdefinierten Werten:
 * node create-admin-simple.js [email] [password] [firstName] [lastName]
 */

require('rootpath')();
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { User, Role } = require('./_models');
const { testConnection } = require('./_config/database');

async function createAdminUserSimple(email = 'dirkdrutschmann@gmail.com', password = 'password', firstName = 'Dirk', lastName = 'Drutschmann') {
    try {
        console.log('🔐 Erstelle Admin-User (einfach)...');
        
        // Datenbankverbindung testen
        console.log('📡 Teste Datenbankverbindung...');
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Datenbankverbindung fehlgeschlagen');
        }
        
        // Prüfen ob User bereits existiert
        console.log(`🔍 Prüfe ob User ${email} bereits existiert...`);
        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            console.log(`⚠️  User ${email} existiert bereits!`);
            
            // Prüfen ob User bereits Admin-Rolle hat
            const userWithRoles = await User.findByPk(existingUser.id, {
                include: [{
                    model: Role,
                    as: 'roles',
                    through: { attributes: [] }
                }]
            });
            
            const hasAdminRole = userWithRoles.roles.some(role => role.name === 'admin');
            if (hasAdminRole) {
                console.log('✅ User hat bereits Admin-Rolle');
                return;
            } else {
                console.log('🔧 Füge Admin-Rolle zu bestehendem User hinzu...');
                const adminRole = await Role.findOne({ where: { name: 'admin' } });
                if (adminRole) {
                    await existingUser.addRole(adminRole);
                    console.log('✅ Admin-Rolle hinzugefügt');
                    return;
                } else {
                    throw new Error('Admin-Rolle nicht gefunden');
                }
            }
        }
        
        // Passwort hashen
        console.log('🔒 Hashe Passwort...');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Admin-Rolle finden
        console.log('👑 Suche Admin-Rolle...');
        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        if (!adminRole) {
            throw new Error('Admin-Rolle nicht gefunden. Bitte zuerst die Datenbank initialisieren.');
        }
        
        // User erstellen
        console.log('👤 Erstelle User...');
        const newUser = await User.create({
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            name: `${firstName} ${lastName}`,
            club: [],
            showContact: true,
            showMail: true,
            showInfo: true,
            getEmails: true,
            whatsapp: false
        });
        
        // Admin-Rolle zuweisen
        console.log('🔗 Weise Admin-Rolle zu...');
        await newUser.addRole(adminRole);
        
        console.log('✅ Admin-User erfolgreich erstellt!');
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Name: ${firstName} ${lastName}`);
        console.log(`🔑 Passwort: ${password}`);
        console.log(`👑 Rolle: admin`);
        
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Admin-Users:', error.message);
        process.exit(1);
    }
}

// Script ausführen
async function main() {
    const args = process.argv.slice(2);
    const email = args[0] || 'dirkdrutschmann@gmail.com';
    const password = args[1] || 'password';
    const firstName = args[2] || 'Dirk';
    const lastName = args[3] || 'Drutschmann';
    
    console.log('🚀 Starte Admin-User Erstellung (einfach)...');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log('');
    
    await createAdminUserSimple(email, password, firstName, lastName);
    
    console.log('');
    console.log('🎉 Script erfolgreich abgeschlossen!');
    process.exit(0);
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
    main();
}

module.exports = { createAdminUserSimple };
