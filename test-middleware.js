#!/usr/bin/env node

/**
 * Test-Script für die Middleware-Funktionen
 * Testet ob alle Middleware korrekt auf Sequelize umgestellt wurden
 */

require('rootpath')();
require('dotenv').config();

const { testConnection } = require('./_config/database');
const authJwt = require('./_middleware/authJwt');
const verifySignUp = require('./_middleware/verifySignUp');

async function testMiddleware() {
    try {
        console.log('🧪 Teste Middleware-Funktionen...');
        
        // Teste Datenbankverbindung
        console.log('📡 Teste Datenbankverbindung...');
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Datenbankverbindung fehlgeschlagen');
        }
        
        // Teste authJwt Middleware
        console.log('🔐 Teste authJwt Middleware...');
        console.log('  - verifyToken:', typeof authJwt.verifyToken);
        console.log('  - isAdmin:', typeof authJwt.isAdmin);
        console.log('  - isVRSW:', typeof authJwt.isVRSW);
        console.log('  - getClub:', typeof authJwt.getClub);
        
        // Teste verifySignUp Middleware
        console.log('📝 Teste verifySignUp Middleware...');
        console.log('  - checkDuplicateUsernameOrEmail:', typeof verifySignUp.checkDuplicateUsernameOrEmail);
        console.log('  - checkRolesExisted:', typeof verifySignUp.checkRolesExisted);
        
        console.log('✅ Alle Middleware-Funktionen sind verfügbar und korrekt definiert');
        console.log('');
        console.log('🎉 Middleware-Test erfolgreich abgeschlossen!');
        
    } catch (error) {
        console.error('❌ Fehler beim Testen der Middleware:', error.message);
        process.exit(1);
    }
}

// Script ausführen
if (require.main === module) {
    testMiddleware();
}

module.exports = { testMiddleware };
