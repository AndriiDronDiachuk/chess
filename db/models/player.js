/**
 * Created by andrii on 24.06.17.
 */
const Sequelize = require('sequelize');
const connection = require('../connection');

const Player = connection.define('player', {
    name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: Sequelize.STRING
});

module.exports = Player;