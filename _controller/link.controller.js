const { Link, User, Answer, Match } = require("../_models"); // Importing Link, User, Answer, Match models
const Crypto = require("crypto"); // Importing Crypto for generating random UUIDs
const { mail, getEmailText } = require("../_mailer/mailer"); // Importing mail and getEmailText from mailer
const { Op } = require('sequelize'); // Importing Sequelize operators

/**
 * This function lists all the links for a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.list = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user) {
            const links = await Link.findAll({
                where: { userId: user.id },
                include: [{
                    model: Answer,
                    as: 'answers'
                }]
            });

            const result = links.map(link => {
                const linkData = link.toJSON();
                if (!linkData.onlyShow) {
                    return { ...linkData, answer: linkData.answers };
                } else {
                    return linkData;
                }
            });

            return res.json(result);
        }
        res.json([]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function adds a link for a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.add = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        let alias = Crypto.randomUUID();
        
        if (user) {
            if (req.body.alias !== null) {
                const already = await Link.findOne({ where: { link: req.body.alias } });
                if (already !== null) {
                    return res.status(409).json({ message: "Alias-Link ist bereits in Verwendung bitte einen anderen wählen" });
                }
                alias = req.body.alias;
            }
            
            let verein = req.body.verein;
            if (req.body.verein === "ALLE") {
                verein = user.club;
            } else {
                verein = [req.body.verein];
            }
            
            const link = await Link.create({
                userId: user.id,
                start: req.body.start,
                end: req.body.end,
                verein: JSON.stringify(verein),
                lizenzstufe: req.body.lizenzstufe,
                link: alias,
                onlyShow: req.body.onlyShow
            });
            
            res.json({ message: "Link wurde angelegt." });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function removes a link for a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.remove = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user && req.params.link !== undefined) {
            const link = await Link.findByPk(req.params.link, {
                include: [{
                    model: User,
                    as: 'user'
                }]
            });
            
            if (link && link.userId === user.id) {
                // Delete associated answers first
                await Answer.destroy({ where: { linkId: link.id } });
                // Then delete the link
                await link.destroy();
            }
        }
        res.json({ message: "Link wurde gelöscht" });
    } catch (error) {
        res.json({ message: "Link nicht gefunden!" });
    }
};

/**
 * This function removes an answer for a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.removeAnswer = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user && req.params.answer !== undefined) {
            await Answer.destroy({ where: { id: req.params.answer } });
        }
        res.json({ message: "Antwort wurde gelöscht" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function gets an answer for a link.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.getAnswer = async (req, res) => {
    try {
        const link = req.params.answer;
        if (link) {
            const user = await User.findByPk(req.userId);
            const linkObject = await Link.findOne({ where: { link: link } });
            
            if (linkObject && linkObject.userId === user.id) {
            const answers = await Answer.findAll({
                where: { linkId: linkObject.id }
            });
                return res.status(200).json({ answers: answers });
            }
        }
        return res.status(400).json({ message: "Link wurde nicht gefunden" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function gets a link.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.get = async (req, res) => {
    try {
        const link = req.params.link;

        if (link) {
            const linkObject = await Link.findOne({ where: { link: link } });
            if (linkObject) {
                const gt = linkObject.start ? linkObject.start : `${(new Date()).getFullYear()}-${("0" + ((new Date()).getMonth() + 1)).slice(-2)}-${("0" + (new Date()).getDate()).slice(-2)}`;
                
                const whereConditions = {
                    kickoffDate: { [Op.gte]: gt }
                };
                
                if (linkObject.end) {
                    whereConditions.kickoffDate[Op.lte] = linkObject.end;
                }

                const vereinArray = JSON.parse(linkObject.verein);
                whereConditions[Op.or] = [
                    { sr1: { [Op.in]: vereinArray } },
                    { sr2: { [Op.in]: vereinArray } }
                ];

                let matches = await Match.findAll({ where: whereConditions });
                
                matches = matches.map(match => {
                    return { ...match.toJSON(), lizenzstufe: lizenzstufe(match) };
                });

                if (linkObject.lizenzstufe === "LSE+ | LSD") {
                    matches = matches.filter(match => match.lizenzstufe === "LSE+ | LSD" || match.lizenzstufe === "LSE");
                } else if (linkObject.lizenzstufe === "LSE") {
                    matches = matches.filter(match => match.lizenzstufe === "LSE");
                }

                return res.status(200).json({ 
                    club: linkObject.verein, 
                    matches: matches, 
                    onlyShow: linkObject.onlyShow, 
                    link: linkObject 
                });
            }
        }
        return res.status(400).json({ message: "Link wurde nicht gefunden" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function determines the license level based on the data.
 * @param {object} data - The data object.
 */
function lizenzstufe(data) {
    if (data.liganame.includes("Herren")) {
        if (data.liganame.includes("Kreisliga")) {
            return "LSE"
        }
        return "LSD"
    }
    if (data.liganame.includes("Damen")) {
        if (data.liganame.includes("Bezirksliga")) {
            return "LSE"
        }
        if (data.liganame.includes("Landesliga")) {
            return "LSE"
        }
        return "LSD"
    }
    if(data.liganame.includes("Oberliga")){
        return "LSE+ | LSD"
    }
    if(data.liganame.includes("Playoffs")){
        return "LSE+ | LSD"
    }
    return "LSE"
}

/**
 * This function creates an answer for a link.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.answer = async (req, res) => {
    try {
        const link = await Link.findByPk(req.body.link);
        if (!link) {
            return res.status(404).json({ message: "Link nicht gefunden" });
        }

        await Answer.create({
            linkId: link.id,
            name: req.body.name,
            email: req.body.email,
            telefon: req.body.telefon,
            lizenzstufe: req.body.lizenzstufe,
            message: req.body.message,
            games: req.body.games
        });

        const user = await User.findByPk(link.userId);

        if (req.body.sendMail) {
            await mail(req.body.email, `[LINK ANTWORT] Antwort übermittelt`,
                getEmailText(
                    "",
                    `deine Antwort wurde übertragen, du hast insgesamt ${req.body.games.length} Spiele angegeben, die du übernehmen möchtest.<br/><br/>${req.body.games.map(game => convertToGermanDate(game.kickoffDate) + " " + game.kickoffTime + " " + game.spielfeld + " " + game.liganame).join("<br>")}${req.body.message ? '<br/><br/>Zusätzliche Mitteilung:<br/>' + req.body.message : ""}`,
                    false,
                    "Bitte beachte, dass du mit dieser Auswahl lediglich den Wunsch äußerst die Spiele zu übernehmen, dies <strong><u>ist keine</u></strong> verbindliche Zusage des Vereines!",
                    null,
                    null)
            );
        }

        await mail(user.email, `[LINK ANTWORT] Neue Antwort von ${req.body.name}`,
            getEmailText(
                "",
                `es gibt eine Antwort von ${req.body.name},<br/>insgesamt können ${req.body.games.length} Spiele übernommen werden.<br/><br/>
                        ${req.body.games.map(game => convertToGermanDate(game.kickoffDate) + " " + game.kickoffTime + " " + game.spielfeld + " " + game.liganame).join("<br>")}${req.body.message ? '<br/><br/>Zusätzliche Mitteilung:<br/>' + req.body.message : ""}`,
                true,
                "Log dich ein um die Antwort zu sehen und die Spiele zu bearbeiten",
                "",
                ""),
            req.body.email);

        return res.status(200).json({ message: "Antwort gespeichert" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function converts an English date string to a German date string.
 * @param {string} englishDateString - The English date string.
 */
const convertToGermanDate = (englishDateString) => {
    // Aufteilen des Eingabe-Strings in Jahr, Monat und Tag
    const [year, month, day] = englishDateString.split('-');

    // Erstellen eines Date-Objekts
    const date = new Date(year, month - 1, day); // Monate sind in JavaScript 0-basiert

    // Überprüfen, ob das Date-Objekt gültig ist
    if (isNaN(date.getTime())) {
        return "Ungültiges Datum";
    }

    // Erstellen eines deutschen Datums-Strings
    const germanDateString = date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    return germanDateString;
}