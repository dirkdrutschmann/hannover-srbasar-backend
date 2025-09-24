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

        console.log("UPDATE BODY",req.body)
        console.log("USERID",req.userId)
        
        let user = await User.findByPk(req.userId, {
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] }
            }]
        });

        if (user && user.roles.some((role) => role.name === "admin")) {
            // Admin kann andere User bearbeiten
            if (req.body.id) {
                user = await User.findByPk(req.body.id);
                if (!user) {
                    return res.status(404).json({ message: "User not found!" });
                }
            }
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

            console.log("UPDATE DATA:", updateData);
            console.log("BEFORE UPDATE - User data:", {
                id: user.id,
                email: user.email,
                name: user.name,
                club: user.club
            });
            
            // Update durchführen - alternative Methode falls update() nicht funktioniert
            try {
                await user.update(updateData);
                console.log("Update with user.update() successful");
            } catch (updateError) {
                console.log("user.update() failed, trying alternative method:", updateError.message);
                // Alternative: Direktes Update über Model
                await User.update(updateData, { where: { id: user.id } });
                console.log("Alternative update method successful");
            }
            
            // User neu laden um Änderungen zu verifizieren
            await user.reload();
            
            console.log("USER UPDATED SUCCESSFULLY");
            console.log("AFTER UPDATE - User data:", {
                id: user.id,
                email: user.email,
                name: user.name,
                club: user.club
            });
        } else {
            return res.status(404).json({ message: "User not found!" });
        }
        
        res.status(204).send("updated");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * This function deletes a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.delete = async (req, res) => {
    try {
        // Prüfe ob der aktuelle User Admin ist
        let currentUser = await User.findByPk(req.userId, {
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] }
            }]
        });

        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found!" });
        }

        const isAdmin = currentUser.roles.some((role) => role.name === "admin");
        
        if (!isAdmin) {
            return res.status(403).json({ message: "Require Admin Role!" });
        }

        // User zum Löschen finden
        const userIdToDelete = req.body.id || req.body.userId;
        
        if (!userIdToDelete) {
            return res.status(400).json({ message: "User ID is required!" });
        }

        const userToDelete = await User.findByPk(userIdToDelete);
        if (!userToDelete) {
            return res.status(404).json({ message: "User to delete not found!" });
        }

        // User löschen
        await userToDelete.destroy();
        
        res.status(200).json({ message: "User deleted successfully" });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};