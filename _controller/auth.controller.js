const {User, Role} = require("../_models"); // Importing User and Role models
const randomstring = require("randomstring"); // Importing randomstring for generating random strings
var jwt = require("jsonwebtoken"); // Importing jsonwebtoken for generating tokens
var bcrypt = require("bcryptjs"); // Importing bcryptjs for password hashing
const { mail, getEmailText} = require("../_mailer/mailer"); // Importing mail and getEmailText from mailer

/**
 * This function deletes a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.delete = async (req, res) => {
    try {
        await User.destroy({ where: { email: req.body.email } });
        res.json("ok");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.reset = async (req, res) => {
    try {
        const resetToken = randomstring.generate(32);
        const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        const user = await User.findOne({
            where: { email: req.body.email.toLowerCase() }
        });
        
        if (user) {
            await user.update({
                resetToken: resetToken,
                resetTokenExpires: resetTokenExpires
            });
            
            const resetLink = `${process.env.RESET_PASSWORD_URL}?token=${resetToken}`;
            mail(user.email, "[SPIELEBASAR] Passwort zurücksetzen", getEmailText("", `Du erhälst diese Mail da soeben ein Passwort-Reset für den Spielebasar angefragt wurde.<br/><br>Klicke auf den folgenden Link um dein Passwort zurückzusetzen:<br/><br><a href="${resetLink}">${resetLink}</a><br/><br>Der Link ist 24 Stunden gültig.`, false, ""));
        }
        res.json("ok");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.validateResetToken = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ 
                valid: false, 
                message: "Token ist erforderlich" 
            });
        }
        
        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpires: { [require('sequelize').Op.gt]: new Date() }
            }
        });
        
        if (!user) {
            return res.status(200).json({ 
                valid: false, 
                message: "Ungültiger oder abgelaufener Reset-Token" 
            });
        }
        
        res.status(200).json({ 
            valid: true, 
            message: "Token ist gültig",
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        
        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpires: { [require('sequelize').Op.gt]: new Date() }
            },
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] }
            }]
        });
        
        if (!user) {
            return res.status(400).json({ message: "Ungültiger oder abgelaufener Reset-Token" });
        }
        
        await user.update({
            password: bcrypt.hashSync(password, 8),
            resetToken: null,
            resetTokenExpires: null
        });
        
        mail(user.email, "[SPIELEBASAR] Passwort wurde geändert", getEmailText("", `Dein Passwort für den Spielebasar wurde erfolgreich geändert.`, false, ""));
        
        const accessToken = jwt.sign({ id: user.id }, process.env.SECRET, {
            expiresIn: 86400
        });
        
        const authorities = [];
        for (let i = 0; i < user.roles.length; i++) {
            authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
        }
        
        res.status(200).send({
            id: user.id,
            username: user.email,
            email: user.email,
            roles: authorities,
            accessToken: accessToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function signs up a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.signup = async (req, res) => {
    try {
        const pass = randomstring.generate(7); // Generating a new password
        const roles = req.body.roles || ['vrsw', 'user']; // Setting roles
        
        const user = await User.create({
            email: req.body.email.toLowerCase(), // Setting email
            password: bcrypt.hashSync(pass, 8), // Setting password
            club: req.body.club || [] // Setting club
        });

        mail(user.email, "[SPIELEBASAR] Es wurde ein Account angelegt", getEmailText("", `Es wurde für dich ein Account für ${user.club.join()} angelegt.<br/><br/>Dein Benutzername ist deine E-Mail-Adresse: ${user.email}<br/><br/>das initiale Passwort: ${pass}`, false, "")); // Sending the email

        // Find and assign roles
        const roleObjects = await Role.findAll({
            where: { name: roles }
        });

        if (roleObjects.length > 0) {
            await user.setRoles(roleObjects);
        } else {
            // If no roles found, assign default user role
            const defaultRole = await Role.findOne({ where: { name: "user" } });
            if (defaultRole) {
                await user.setRoles([defaultRole]);
            }
        }

        res.send({ message: "User was registered successfully!" }); // Sending success response
    } catch (error) {
        res.status(500).send({ message: error.message }); // Sending error response
    }
};

/**
 * This function signs in a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.signin = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { email: req.body.email.toLowerCase() },
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] }
            }]
        });

        if (!user) {
            return res.status(404).send({ message: "Benutzer nicht gefunden." });
        }

        const passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );

        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Passwort falsch!"
            });
        }

        const token = jwt.sign({ id: user.id }, process.env.SECRET, {
            expiresIn: 86400 // 24 hours
        });

        const authorities = [];
        for (let i = 0; i < user.roles.length; i++) {
            authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
        }

        res.status(200).send({
            id: user.id,
            email: user.email,
            roles: authorities,
            club: user.club,
            accessToken: token,
            expireDate: (new Date()).setDate((new Date()).getDate() + 1),
            contactInfo: user.contactInfo,
            phone: user.phone,
            whatsapp: user.whatsapp,
            name: user.name,
            getEmails: user.getEmails,
            showInfo: user.showInfo,
            showMail: user.showMail,
            showContact: user.showContact
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};