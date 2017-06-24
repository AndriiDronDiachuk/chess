/**
 * Created by andrii on 24.06.17.
 */
const Sequelize = require('sequelize');
const connection = require('../connection');

const Game = connection.define('game', {
    result: Sequelize.BOOLEAN,
    idOfFirstPlayer: Sequelize.INTEGER,
    idOfSecondPlayer: Sequelize.INTEGER
});

module.exports = Game;