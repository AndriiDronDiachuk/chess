/**
 * Created by andrii on 24.06.17.
 */
const Game = require('./models/game');
const Player = require('./models/player');

Game.belongsTo(Player, {
    as: 'idWinner',
    foreignKey: 'idOfFirstPlayer'
});
Game.belongsTo(Player, {
    as: 'idLooser',
    foreignKey: 'idOfSecondPlayer'
});

console.info('relations sets.');