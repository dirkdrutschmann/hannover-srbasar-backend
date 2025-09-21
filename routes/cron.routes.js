const express = require('express');
const cronService = require('../_services/cronService');
const authJwt = require('../_middleware/authJwt');

const router = express.Router();

/**
 * Cron-Status API Routes
 * 
 * Diese Routes ermöglichen die Überwachung und Steuerung
 * des integrierten Cron-Services.
 */

/**
 * GET /api/cron/status
 * Gibt den aktuellen Status des Cron-Services zurück
 */
router.get('/status', [authJwt.verifyToken, authJwt.isAdmin], (req, res) => {
    try {
        const status = cronService.getStatus();
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen des Cron-Status',
            error: error.message
        });
    }
});

/**
 * POST /api/cron/start
 * Startet den Cron-Service (falls gestoppt)
 */
router.post('/start', [authJwt.verifyToken, authJwt.isAdmin], (req, res) => {
    try {
        cronService.start();
        res.json({
            success: true,
            message: 'Cron-Service gestartet',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Starten des Cron-Services',
            error: error.message
        });
    }
});

/**
 * POST /api/cron/stop
 * Stoppt den Cron-Service
 */
router.post('/stop', [authJwt.verifyToken, authJwt.isAdmin], (req, res) => {
    try {
        cronService.stop();
        res.json({
            success: true,
            message: 'Cron-Service gestoppt',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Stoppen des Cron-Services',
            error: error.message
        });
    }
});

/**
 * POST /api/cron/restart
 * Startet den Cron-Service neu
 */
router.post('/restart', [authJwt.verifyToken, authJwt.isAdmin], (req, res) => {
    try {
        cronService.stop();
        setTimeout(() => {
            cronService.start();
        }, 1000);
        
        res.json({
            success: true,
            message: 'Cron-Service neu gestartet',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Neustarten des Cron-Services',
            error: error.message
        });
    }
});

/**
 * POST /api/cron/run-now
 * Führt den Haupt-Update sofort aus (für Tests)
 */
router.post('/run-now', [authJwt.verifyToken, authJwt.isAdmin], async (req, res) => {
    try {
        // Führe Update sofort aus
        await cronService.runMainUpdate();
        
        res.json({
            success: true,
            message: 'Haupt-Update sofort ausgeführt',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim sofortigen Ausführen des Updates',
            error: error.message
        });
    }
});

/**
 * GET /api/cron/logs
 * Gibt die letzten Log-Einträge zurück (vereinfacht)
 */
router.get('/logs', [authJwt.verifyToken, authJwt.isAdmin], (req, res) => {
    try {
        const status = cronService.getStatus();
        
        res.json({
            success: true,
            data: {
                lastRun: status.lastRun,
                runCount: status.runCount,
                errorCount: status.errorCount,
                memoryUsage: status.memoryUsage,
                scheduledJobs: status.scheduledJobs
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen der Logs',
            error: error.message
        });
    }
});

module.exports = router;
