const cron = require('node-cron');
const { updateLigen, updateMatches } = require('../_teamsl/update');
const { testConnection, syncDatabase } = require('../_config/database');
const { mail, getEmailText } = require('../_mailer/mailer');

/**
 * Cron-Service für Spielebasar Backend
 * 
 * Dieser Service integriert Cron-Jobs direkt in den Server-Prozess
 * und ersetzt den separaten Cron-Prozess.
 */
class CronService {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
        this.lastRun = null;
        this.runCount = 0;
        this.errorCount = 0;
    }

    /**
     * Startet alle Cron-Jobs
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Cron-Service läuft bereits');
            return;
        }

        console.log('🚀 Starte Cron-Service...');
        this.isRunning = true;

        // Haupt-Cron-Job: Alle 15 Minuten
        this.scheduleJob('main', '*/15 * * * *', () => this.runMainUpdate());

        // Wartungs-Cron-Job: Täglich um 3:00 Uhr
        this.scheduleJob('maintenance', '0 3 * * *', () => this.runMaintenance());

        // Health-Check: Alle 5 Minuten
        this.scheduleJob('health', '*/5 * * * *', () => this.runHealthCheck());

        console.log('✅ Cron-Service gestartet');
        this.logScheduledJobs();
    }

    /**
     * Stoppt alle Cron-Jobs
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Cron-Service läuft nicht');
            return;
        }

        console.log('🛑 Stoppe Cron-Service...');
        
        this.jobs.forEach((job, name) => {
            job.destroy();
            console.log(`   ❌ Job "${name}" gestoppt`);
        });

        this.jobs.clear();
        this.isRunning = false;
        console.log('✅ Cron-Service gestoppt');
    }

    /**
     * Plant einen Cron-Job
     */
    scheduleJob(name, pattern, task) {
        try {
            const job = cron.schedule(pattern, async () => {
                console.log(`🔄 Führe Job "${name}" aus (${new Date().toISOString()})`);
                await task();
            }, {
                scheduled: false,
                timezone: 'Europe/Berlin'
            });

            this.jobs.set(name, job);
            job.start();
            console.log(`✅ Job "${name}" geplant: ${pattern}`);
            
        } catch (error) {
            console.error(`❌ Fehler beim Planen von Job "${name}":`, error);
        }
    }

    /**
     * Haupt-Update-Job
     */
    async runMainUpdate() {
        const startTime = Date.now();
        this.runCount++;

        try {
            console.log('🏆 Starte Haupt-Update...');

            // Datenbankverbindung testen
            const isConnected = await testConnection();
            if (!isConnected) {
                throw new Error('MariaDB-Verbindung fehlgeschlagen');
            }

            // Ligen aktualisieren
            console.log('📊 Aktualisiere Ligen...');
            await updateLigen(0);

            // Spiele aktualisieren
            console.log('⚽ Aktualisiere Spiele...');
            await updateMatches();

            const duration = Date.now() - startTime;
            console.log(`✅ Haupt-Update abgeschlossen (${duration}ms)`);
            
            this.lastRun = new Date();
            this.errorCount = 0; // Reset error count on success

        } catch (error) {
            this.errorCount++;
            console.error('❌ Fehler im Haupt-Update:', error);
            
            // E-Mail-Benachrichtigung bei wiederholten Fehlern
            if (this.errorCount >= 3) {
                await this.sendErrorNotification('Haupt-Update', error);
            }
        }
    }

    /**
     * Wartungs-Job
     */
    async runMaintenance() {
        const startTime = Date.now();

        try {
            console.log('🔧 Starte Wartungsarbeiten...');

            // Datenbank synchronisieren
            await syncDatabase();

            // Cache leeren (falls vorhanden)
            if (global.gc) {
                global.gc();
                console.log('🗑️  Garbage Collection ausgeführt');
            }

            const duration = Date.now() - startTime;
            console.log(`✅ Wartungsarbeiten abgeschlossen (${duration}ms)`);

        } catch (error) {
            console.error('❌ Fehler bei Wartungsarbeiten:', error);
            await this.sendErrorNotification('Wartungsarbeiten', error);
        }
    }

    /**
     * Health-Check-Job
     */
    async runHealthCheck() {
        try {
            // Einfacher Health-Check
            const isConnected = await testConnection();
            
            if (!isConnected) {
                console.warn('⚠️  Health-Check: Datenbankverbindung fehlgeschlagen');
            }

        } catch (error) {
            console.error('❌ Health-Check fehlgeschlagen:', error);
        }
    }

    /**
     * Sendet E-Mail-Benachrichtigung bei Fehlern
     */
    async sendErrorNotification(jobName, error) {
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@srbasar.de';
            const errorMessage = `
                <h2>🚨 Cron-Job Fehler: ${jobName}</h2>
                <p><strong>Zeit:</strong> ${new Date().toISOString()}</p>
                <p><strong>Fehler:</strong> ${error.message}</p>
                <p><strong>Stack Trace:</strong></p>
                <pre>${error.stack}</pre>
                <p><strong>Speicherverbrauch:</strong> ${this.getMemoryUsage()}</p>
                <p><strong>Uptime:</strong> ${process.uptime()}s</p>
                <p><strong>Laufende Jobs:</strong> ${this.jobs.size}</p>
                <p><strong>Fehleranzahl:</strong> ${this.errorCount}</p>
            `;

            await mail(
                adminEmail,
                `[SPIELEBASAR] Cron-Job Fehler: ${jobName}`,
                getEmailText("", errorMessage, false, "")
            );
            
            console.log(`📧 Fehler-E-Mail gesendet für Job: ${jobName}`);
            
        } catch (emailError) {
            console.error('❌ Fehler beim Senden der E-Mail:', emailError);
        }
    }

    /**
     * Gibt Status-Informationen zurück
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastRun: this.lastRun,
            runCount: this.runCount,
            errorCount: this.errorCount,
            scheduledJobs: Array.from(this.jobs.keys()),
            memoryUsage: this.getMemoryUsage()
        };
    }

    /**
     * Gibt aktuellen Speicherverbrauch zurück
     */
    getMemoryUsage() {
        const used = process.memoryUsage();
        return {
            rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
            external: `${Math.round(used.external / 1024 / 1024)} MB`
        };
    }

    /**
     * Loggt alle geplanten Jobs
     */
    logScheduledJobs() {
        console.log('📅 Geplante Cron-Jobs:');
        this.jobs.forEach((job, name) => {
            console.log(`   • ${name}: ${job.getStatus()}`);
        });
    }
}

// Singleton-Instanz
const cronService = new CronService();

module.exports = cronService;
