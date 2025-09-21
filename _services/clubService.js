const { Club } = require('../_models');

/**
 * Service für Club-Management und API-Integration
 */
class ClubService {
    constructor() {
        this.sdk = null; // Wird dynamisch geladen
        this.cache = new Map(); // In-Memory Cache für bessere Performance
    }

    /**
     * Lädt das SDK dynamisch mit Fehlerbehandlung
     */
    async loadSDK() {
        if (!this.sdk) {
            try {
                // Versuche verschiedene Import-Methoden
                let BasketballBundSDK;
                try {
                    const module = await import('basketball-bund-sdk');
                    BasketballBundSDK = module.BasketballBundSDK || module.default;
                } catch (importError) {
                    console.error('Fehler beim Import des SDK:', importError.message);
                    // Fallback: Versuche require (falls verfügbar)
                    try {
                        const module = require('basketball-bund-sdk');
                        BasketballBundSDK = module.BasketballBundSDK || module.default;
                    } catch (requireError) {
                        throw new Error(`SDK konnte nicht geladen werden: ${importError.message}`);
                    }
                }
                
                if (!BasketballBundSDK) {
                    throw new Error('BasketballBundSDK Klasse nicht gefunden');
                }
                
                this.sdk = new BasketballBundSDK();
                console.log('Basketball-Bund SDK erfolgreich geladen');
            } catch (error) {
                console.error('Kritischer Fehler beim Laden des SDK:', error.message);
                throw error;
            }
        }
        return this.sdk;
    }

    /**
     * Holt oder erstellt einen Club basierend auf der clubId
     * @param {number} clubId - Die ID des Vereins
     * @returns {Promise<Object>} Club-Objekt mit Name und ID
     */
    async getOrCreateClub(clubId) {
        try {
            // Zuerst im Cache prüfen
            if (this.cache.has(clubId)) {
                return this.cache.get(clubId);
            }

            // In der Datenbank nachschauen
            let club = await Club.findOne({ where: { clubId: clubId } });

            if (!club) {
                // Club nicht in DB, von API holen
                console.log(`Club ${clubId} nicht in DB gefunden, hole von API...`);
                const clubData = await this.fetchClubFromAPI(clubId);
                
                if (clubData) {
                    club = await Club.create({
                        clubId: clubId,
                        vereinsname: clubData.vereinsname,
                        lastUpdated: new Date()
                    });
                    console.log(`Club ${clubId} (${clubData.vereinsname}) in DB gespeichert`);
                } else {
                    // Fallback: Erstelle Club mit unbekanntem Namen
                    console.warn(`Club ${clubId} konnte nicht von API abgerufen werden, erstelle Fallback-Eintrag`);
                    club = await Club.create({
                        clubId: clubId,
                        vereinsname: `Unbekannter Verein (${clubId})`,
                        lastUpdated: new Date()
                    });
                }
            } else {
                // Club in DB gefunden, prüfen ob Update nötig ist
                const now = new Date();
                const lastUpdate = new Date(club.lastUpdated);
                const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);

                // Wenn älter als 7 Tage, von API aktualisieren
                if (daysSinceUpdate > 7) {
                    console.log(`Club ${clubId} ist ${daysSinceUpdate.toFixed(1)} Tage alt, aktualisiere...`);
                    const clubData = await this.fetchClubFromAPI(clubId);
                    
                    if (clubData) {
                        await club.update({
                            vereinsname: clubData.vereinsname,
                            lastUpdated: new Date()
                        });
                        console.log(`Club ${clubId} aktualisiert`);
                    }
                }
            }

            // In Cache speichern
            this.cache.set(clubId, club);
            return club;

        } catch (error) {
            console.error(`Fehler beim Abrufen von Club ${clubId}:`, error.message);
            
            // Fallback: Versuche aus DB zu holen, auch wenn alt
            const fallbackClub = await Club.findOne({ where: { clubId: clubId } });
            if (fallbackClub) {
                console.log(`Verwende veraltete Daten für Club ${clubId}`);
                return fallbackClub;
            }
            
            // Wenn kein Club in DB gefunden und API fehlgeschlagen, Club-ID als Name verwenden
            console.log(`Club ${clubId} nicht verfügbar, verwende Club-ID als Name`);
            return {
                clubId: clubId,
                vereinsname: clubId.toString(),
                lastUpdated: new Date()
            };
        }
    }

    /**
     * Holt Club-Daten von der Basketball-Bund API mit Retry-Logik
     * @param {number} clubId - Die ID des Vereins
     * @param {number} retries - Anzahl der Wiederholungsversuche
     * @returns {Promise<Object|null>} Club-Daten oder null
     */
    async fetchClubFromAPI(clubId, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const sdk = await this.loadSDK();
                
                // Timeout für API-Aufruf setzen
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 Sekunden Timeout
                });
                
                const apiPromise = sdk.club.getActualMatches({ clubId: clubId });
                const response = await Promise.race([apiPromise, timeoutPromise]);
                console.log(response);
                if (response && response.club && response.club.vereinsname) {
                    return {
                        clubId: clubId,
                        vereinsname: response.club.vereinsname
                    };
                }
                
                return null;
            } catch (error) {
                console.error(`API-Fehler für Club ${clubId} (Versuch ${attempt}/${retries}):`, error.message);
                
                if (attempt === retries) {
                    // Letzter Versuch fehlgeschlagen, null zurückgeben
                    console.error(`Club ${clubId} konnte nach ${retries} Versuchen nicht abgerufen werden`);
                    return null;
                }
                
                // Warten vor dem nächsten Versuch (exponential backoff)
                const delay = Math.min(5000 * Math.pow(2, attempt - 1), 30000); // Noch längere Verzögerungen
                console.log(`Warte ${delay}ms vor nächstem Versuch...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        return null;
    }

    /**
     * Holt mehrere Clubs in kleinen Batches mit langen Pausen
     * @param {number[]} clubIds - Array von Club-IDs
     * @returns {Promise<Object[]>} Array von Club-Objekten
     */
    async getMultipleClubs(clubIds) {
        const uniqueClubIds = [...new Set(clubIds)]; // Duplikate entfernen
        const clubs = [];
        
        // Kleine Batches mit langen Pausen zwischen den Batches
        const batchSize = 2; // Nur 2 Clubs pro Batch
        const batchDelay = 10000; // 10 Sekunden Pause zwischen Batches
        
        for (let i = 0; i < uniqueClubIds.length; i += batchSize) {
            const batch = uniqueClubIds.slice(i, i + batchSize);
            console.log(`\n=== Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(uniqueClubIds.length/batchSize)} ===`);
            console.log(`Verarbeite Clubs: ${batch.join(', ')}`);
            
            // Verarbeite Batch seriell
            for (let j = 0; j < batch.length; j++) {
                const clubId = batch[j];
                
                try {
                    console.log(`Lade Club ${clubId} (${i + j + 1}/${uniqueClubIds.length})...`);
                    const club = await this.getOrCreateClub(clubId);
                    clubs.push(club);
                    
                    // Kurze Pause zwischen Clubs im gleichen Batch
                    if (j < batch.length - 1) {
                        console.log(`Warte 3 Sekunden...`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                } catch (error) {
                    console.error(`Fehler beim Abrufen von Club ${clubId}:`, error.message);
                    // Füge Club-ID als Name hinzu
                    clubs.push({
                        clubId: clubId,
                        vereinsname: clubId.toString(),
                        lastUpdated: new Date()
                    });
                    
                    // Auch bei Fehlern eine kurze Pause
                    if (j < batch.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
            
            // Lange Pause zwischen Batches
            if (i + batchSize < uniqueClubIds.length) {
                console.log(`\n⏳ Warte ${batchDelay/1000} Sekunden vor nächstem Batch...`);
                await new Promise(resolve => setTimeout(resolve, batchDelay));
            }
        }
        
        console.log(`\n✅ Alle ${uniqueClubIds.length} Clubs verarbeitet`);
        return clubs;
    }

    /**
     * Löscht den Cache für einen bestimmten Club
     * @param {number} clubId - Die ID des Vereins
     */
    clearClubCache(clubId) {
        this.cache.delete(clubId);
    }

    /**
     * Löscht den gesamten Cache
     */
    clearAllCache() {
        this.cache.clear();
    }

    /**
     * Aktualisiert alle Clubs in der Datenbank
     * @returns {Promise<number>} Anzahl der aktualisierten Clubs
     */
    async updateAllClubs() {
        try {
            const clubs = await Club.findAll();
            let updatedCount = 0;

            for (const club of clubs) {
                try {
                    const clubData = await this.fetchClubFromAPI(club.clubId);
                    if (clubData) {
                        await club.update({
                            vereinsname: clubData.vereinsname,
                            lastUpdated: new Date()
                        });
                        updatedCount++;
                    }
                } catch (error) {
                    console.error(`Fehler beim Aktualisieren von Club ${club.clubId}:`, error.message);
                }
            }

            console.log(`${updatedCount} Clubs aktualisiert`);
            this.clearAllCache(); // Cache leeren nach Update
            return updatedCount;
        } catch (error) {
            console.error('Fehler beim Aktualisieren aller Clubs:', error.message);
            throw error;
        }
    }
}

// Singleton-Instanz
const clubService = new ClubService();

module.exports = clubService;
