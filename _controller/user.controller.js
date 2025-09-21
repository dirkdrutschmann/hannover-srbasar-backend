const { User, Role } = require('../_models'); // Importing User and Role models
var bcrypt = require("bcryptjs"); // Importing bcryptjs for password hashing
const { mail, getEmailText } = require('../_mailer/mailer'); // Importing mail and getEmailText from mailer

/**
 * This function lists all the users.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.list = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] } // Exclude junction table attributes
            }],
            attributes: ['id', 'email', 'club']
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function updates a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.update = async (req, res) => {
    try {
        let user = await User.findByPk(req.userId, {
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] }
            }]
        });

        if (user && user.roles.some((role) => role.name === "admin")) {
            user = await User.findByPk(req.body.id);
        }

        if (user) {
            const updateFields = ['password', 'contactInfo', 'club', 'phone', 'getEmails', 'showContact', 'name', 'whatsapp', 'email', 'showInfo', 'showMail'];
            let updateData = {};
            
            updateFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    if (field === 'password') {
                        updateData[field] = bcrypt.hashSync(req.body[field], 8);
                        mail(user.email, "[SPIELEBASAR] Passwort wurde geändert", getEmailText("", `Du erhälst diese Mail da soeben das Passwort für den Spielebasar geändert wurde.<br/><br/>Solltest du dies nicht veranlasst haben, wende dich bitte an problems@srbasar.de.`, false, ""));
                    } else {
                        updateData[field] = req.body[field];
                    }
                }
            });

            await user.update(updateData);
        }
        
        res.status(204).send("updated");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};