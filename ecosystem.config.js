/**
 * PM2 Ecosystem Configuration für Spielebasar Backend
 * 
 * Diese Konfiguration startet nur den Hauptserver, da Cron-Jobs
 * jetzt über node-cron im Server-Prozess integriert sind.
 * 
 * Vorteile:
 * - Weniger Prozesse zu verwalten
 * - Bessere Ressourcennutzung
 * - Einfachere Überwachung
 * - Integrierte Fehlerbehandlung
 */
module.exports = {
    apps: [{
        name: "hannover-srbasar-backend",
        script: "./server.js",
        watch: process.env.NODE_ENV !== 'production',
        ignore_watch: [
            "node_modules",
            "\\.git",
            "logs/*.log",
            "*.log",
            "cron*.js",
            "migrations/*"
        ],
        autorestart: true,
        instances: process.env.NODE_ENV === 'production' ? 1 : 1,
        exec_mode: "fork", // Fork-Modus für bessere Cron-Integration
        max_memory_restart: "1G",
        // Erweiterte PM2-Konfiguration
        log_file: "./logs/combined.log",
        out_file: "./logs/out.log",
        error_file: "./logs/error.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        merge_logs: true,
        // Cron-Jobs sind jetzt im Server integriert
        // Kein separater Cron-Prozess mehr nötig
    }]
};