// Importing the Sequelize models for the different tables in the MariaDB database
const Liga = require('./liga.model');
const Match = require('./match.model');
const Role = require('./role.model');
const User = require('./user.model');
const Link = require('./link.model');
const Answer = require('./answer.model');

/**
 * Definiert die Assoziationen zwischen den Sequelize-Modellen
 */
// User hat viele Links
User.hasMany(Link, { foreignKey: 'userId', as: 'links' });
Link.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Link hat viele Answers
Link.hasMany(Answer, { foreignKey: 'linkId', as: 'answers' });
Answer.belongsTo(Link, { foreignKey: 'linkId', as: 'link' });

// Answer hat viele Matches über JSON-Feld (keine direkte Assoziation, da es über JSON-Array läuft)
// Answer.belongsToMany(Match, { through: 'answer_matches', foreignKey: 'answerId', otherKey: 'matchId' });

// Liga hat viele Matches (über liganame) - diese Beziehung ist optional, da sie über String-Felder läuft
// Liga.hasMany(Match, { foreignKey: 'liganame', sourceKey: 'liganame', as: 'matches' });
// Match.belongsTo(Liga, { foreignKey: 'liganame', targetKey: 'liganame', as: 'liga' });

// User und Role haben eine many-to-many Beziehung
User.belongsToMany(Role, { 
    through: 'user_roles',
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'roles'
});
Role.belongsToMany(User, { 
    through: 'user_roles',
    foreignKey: 'roleId',
    otherKey: 'userId',
    as: 'users'
});

/**
 * This module exports an object containing the Sequelize models for the different tables in the MariaDB database.
 * Each property of the object is a Sequelize model:
 * - Liga: The model for the 'ligas' table.
 * - Match: The model for the 'matches' table.
 * - Role: The model for the 'roles' table.
 * - User: The model for the 'users' table.
 * - Link: The model for the 'links' table.
 * - Answer: The model for the 'answers' table.
 */
module.exports = {
  Liga,
  Match,
  Role,
  Link,
  Answer,
  User
};