const { mail, getEmailText } = require("../_mailer/mailer"); // Importing mail and getEmailText from mailer
const { Match, User, Club } = require("../_models"); // Importing Match, User and Club models
const { Op } = require('sequelize'); // Importing Sequelize operators
const clubService = require('../_services/clubService'); // Importing club service

/**
 * This function lists all the matches for a club.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.list = async (req, res) => {
    try {
        const ref = await Match.findAll({
            where: {
                [Op.or]: [
                    { sr1: req.club },
                    { sr2: req.club }
                ]
            }
        });

        // Club-Namen sind bereits in sr1Name und sr2Name gespeichert
        const enrichedRef = ref.map(match => {
            const matchData = match.toJSON();
            matchData.sr1ClubName = match.sr1Name;
            matchData.sr2ClubName = match.sr2Name;
            return matchData;
        });

        res.json(enrichedRef);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function lists all the matches.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.all = async (req, res) => {
    try {
        const ref = await Match.findAll({
            attributes: { exclude: ['sr2Bonus', 'sr2Name', 'sr1Name', 'sr1Bonus', 'sr1Info', 'sr2Info'] }
        });
        
        const filteredRef = ref.filter((game) => {
            return (Math.floor(new Date() / 1000) - Math.floor(new Date(game.kickoffDate) / 1000)) < 86400 && 
                   !game.abgesagt && 
                   !game.verzicht && 
                   game.sr1 !== null && 
                   game.sr2 !== null;
        });

        // Club-Namen sind bereits in sr1Name und sr2Name gespeichert
        const enrichedRef = filteredRef.map(match => {
            const matchData = match.toJSON();
            matchData.sr1ClubName = match.sr1Name;
            matchData.sr2ClubName = match.sr2Name;
            return matchData;
        });
        
        res.json(enrichedRef);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function takes over a game.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.uebernehmen = async (req, res) => {
    try {
        const game = await Match.findOne({ 
            where: { matchId: parseInt(req.params.game) }
        });
        
        if (!game) {
            res.status(404);
            return res.send({ error: "Game doesn't exist!" });
        }
        
        const users = await User.findAll({ 
            where: { 
                club: { [Op.contains]: req.body.sr } 
            } 
        });
        if (!users || users.length === 0) {
            res.status(200);
            return res.send({ error: "No User found" });
        }
        
        const date = new Date(game.kickoffDate);
        
        // Club-Namen aus gespeicherten Daten verwenden
        const sr1ClubName = game.sr1Name || 'Unbekannter Verein';
        const sr2ClubName = game.sr2Name || 'Unbekannter Verein';
        
        await mail(users.map((user) => user.email), "[SPIELEBASAR] Übernahme " + game.liganame + game.matchNo,
            getEmailText("", `es gibt eine Übernahmeanfrage von ${req.body.name} <br/><br/><strong>Spiel:</strong><br/>${game.liganame}  ${game.matchNo}<br/>${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${game.kickoffTime} ${game.spielfeld}<br/>${game.homeTeam} - ${game.guestTeam}<br/><br/><strong>Schiedsrichter:</strong><br/><strong>SR1:</strong> ${sr1ClubName}<br/><strong>SR2:</strong> ${sr2ClubName}<br/><br/><strong>Anfrage von:</strong><br/><strong>Name:</strong> ${req.body.name}${req.body.email ? `<br/><strong>E-Mail:</strong> ` + req.body.email : ""}${req.body.mobile ? `<br/><strong>Handy:</strong> ` + req.body.mobile : ""}<br/><strong>Lizenz:</strong> ${req.body.lizenz}<br/><br/>${req.body.message ? `<strong>Nachricht:</strong><br/><br/>${req.body.message}<br/>` : ""}`, !!req.body.mobile,
                ``, `${process.env.WHATSAPP_API_URL}/${req.body.mobile}?text=${encodeURI(`Hallo ${req.body.name}, vielen Dank für deine Anfrage,  hiermit habe ich dich für das Spiel *${game.liganame}${game.matchNo}* am *${new Date(game.kickoffDate).getDate()}.${new Date(game.kickoffDate).getMonth() + 1}.${new Date(game.kickoffDate).getFullYear()}* um *${game.kickoffTime}* *${game.spielfeld}* für *${req.body.sr}* angesetzt. Liebe Grüße`)}`, "Per Whatsapp antworten"),
            req.body.email ? req.body.email : false);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function lists all the matches for a basar.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.basar = async (req, res) => {
    try {
        console.log("BASAR");
        const ref = await Match.findAll({
            where: {
                abgesagt: false,
                verzicht: false,
                [Op.or]: [
                    { sr1Basar: true, sr1Besetzt: false },
                    { sr2Basar: true, sr2Besetzt: false }
                ]
            }
        });
        
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { showContact: true },
                    { getEmails: true }
                ]
            }
        });

        const games = ref.filter((game) => {
            return (Math.floor(new Date() / 1000) - Math.floor(new Date(game.kickoffDate) / 1000)) < 86400;
        });

        const spiele = [];
        for (const game of games) {
            const newValue = { ...game.toJSON() };
            delete newValue.sr1Info;
            delete newValue.sr2Info;
            
            // Club-Namen aus gespeicherten Daten verwenden
            newValue.sr1ClubName = game.sr1Name;
            newValue.sr2ClubName = game.sr2Name;
            
            if (game.sr1Basar) {
                const sr1User = users.filter((user) => user.club && user.club.includes(game.sr1));
                newValue.sr1Contact = sr1User.map((user) => {
                    return {
                        getEmails: user.getEmails,
                        name: user.name,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        contactInfo: user.contactInfo,
                        showInfo: user.showInfo,
                        showMail: user.showMail,
                        showContact: user.showContact,
                        email: user.email,
                        phone: user.phone,
                        whatsapp: user.whatsapp
                    };
                });
            }
            
            if (game.sr2Basar) {
                const sr2User = users.filter((user) => user.club && user.club.includes(game.sr2));
                newValue.sr2Contact = sr2User.map((user) => {
                    return {
                        getEmails: user.getEmails,
                        name: user.name,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        contactInfo: user.contactInfo,
                        showInfo: user.showInfo,
                        showMail: user.showMail,
                        showContact: user.showContact,
                        email: user.email,
                        phone: user.phone,
                        whatsapp: user.whatsapp
                    };
                });
            }
            spiele.push(newValue);
        }

        res.json(spiele);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function lists all the clubs.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.vereine = async (req, res) => {
    try {
        const ref = await Match.findAll({
            attributes: ['sr1', 'sr2']
        });
        
        const refList = [];
        for (const _r of ref) {
            let index = refList.findIndex(_ref => _ref === _r.sr1);
            if (index === -1 && _r.sr1 !== null) {
                refList.push(_r.sr1);
            }
            index = refList.findIndex(_ref => _ref === _r.sr2);
            if (index === -1 && _r.sr2 !== null) {
                refList.push(_r.sr2);
            }
        }
        res.json(refList);
    } catch (error) {
        res.status(404).send({ error: "Ref doesn't exist!" });
    }
};
