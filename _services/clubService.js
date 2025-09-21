const { Club } = require('../_models');
const { BasketballBundSDK } = require('basketball-bund-sdk');

/**
 * Service für Club-Management und API-Integration
 */
class ClubService {
    constructor() {
        this.sdk = new BasketballBundSDK();
        this.cache = new Map(); // In-Memory Cache für bessere Performance
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
                    throw new Error(`Club mit ID ${clubId} konnte nicht von der API abgerufen werden`);
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
            
            throw error;
        }
    }

    /**
     * Holt Club-Daten von der Basketball-Bund API
     * @param {number} clubId - Die ID des Vereins
     * @returns {Promise<Object|null>} Club-Daten oder null
     */
    async fetchClubFromAPI(clubId) {
        try {
            const response = await this.sdk.club.getActualMatches({ clubId: clubId });
            
            if (response && response.data && response.data.club && response.data.club.vereinsname) {
                return {
                    clubId: clubId,
                    vereinsname: response.data.club.vereinsname
                };
            }
            
            return null;
        } catch (error) {
            console.error(`API-Fehler für Club ${clubId}:`, error.message);
            return null;
        }
    }

    /**
     * Holt mehrere Clubs gleichzeitig
     * @param {number[]} clubIds - Array von Club-IDs
     * @returns {Promise<Object[]>} Array von Club-Objekten
     */
    async getMultipleClubs(clubIds) {
        const clubs = [];
        const uniqueClubIds = [...new Set(clubIds)]; // Duplikate entfernen

        for (const clubId of uniqueClubIds) {
            try {
                const club = await this.getOrCreateClub(clubId);
                clubs.push(club);
            } catch (error) {
                console.error(`Fehler beim Abrufen von Club ${clubId}:`, error.message);
                // Füge einen Fallback-Club hinzu
                clubs.push({
                    clubId: clubId,
                    vereinsname: `Unbekannter Verein (${clubId})`,
                    lastUpdated: new Date()
                });
            }
        }

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
