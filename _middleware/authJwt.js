const jwt = require("jsonwebtoken"); // Importing jsonwebtoken for token verification
const {User, Role} = require('../_models/index') // Importing User and Role models
const { Op } = require('sequelize'); // Importing Sequelize operators

/**
 * Middleware function to verify the token in the request.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 */
verifyToken = (req, res, next) => {
  let token = req.headers["authorization"] || req.headers["Authorization"];
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  // Remove "Bearer " prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

/**
 * Middleware function to check if the user is an admin.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 */
isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    const hasAdminRole = user.roles.some(role => role.name === "admin");
    
    if (hasAdminRole) {
      next();
    } else {
      res.status(403).send({ message: "Require Admin Role!" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/**
 * Middleware function to check if the user is a VRSW or Admin.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 */
isVRSW = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    const hasVRSWRole = user.roles.some(role => role.name === "vrsw" || role.name === "admin");
    
    if (hasVRSWRole) {
      next();
    } else {
      res.status(403).send({ message: "Require VRSW or Admin Role!" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/**
 * Middleware function to get the club of the user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 */
getClub = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }
    
    req.club = user.club;
    next();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
}

const authJwt = {
  verifyToken,
  isAdmin,
  isVRSW,
  getClub
};
module.exports = authJwt;