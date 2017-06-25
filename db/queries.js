/**
 * Created by andrii on 24.06.17.
 */
const connection = require('./connection');
const Game = require('./models/game');
const Player = require('./models/player');

function saveGameInit(msg) {
    let gameInfo = {};
    connection
        .sync()
        .then(function () {
            Player
                .findOne({where: {name: msg.userId}})
                .then(function (player) {
                    gameInfo.firstId = player.dataValues.id;
                    Player
                        .findOne({where: {name: msg.opponentId}})
                        .then(function (player) {
                            gameInfo.secondId = player.dataValues.id;
                            Game
                                .create({
                                    idOfFirstPlayer: gameInfo.firstId,
                                    idOfSecondPlayer: gameInfo.secondId
                                })
                        });
                })
        });
}

function saveGameResult(msg) {
    let looserId, winnerId;
    connection
        .sync()
        .then(function () {
            Player
                .findOne({where: {name: msg.winnerId}})
                .then(function (player) {
                    winnerId = player.dataValues.id;
                    Player
                        .findOne({where: {name: msg.looserId}})
                        .then(function (player) {
                            looserId = player.dataValues.id;
                        }).then(function () {
                            Game
                                .findOne({
                                        where: {
                                            $or: [
                                                {idOfSecondPlayer: looserId},
                                                {idOfSecondPlayer: winnerId}
                                            ],
                                            $and: {
                                                $or: [
                                                    {idOfFirstPlayer: looserId},
                                                    {idOfFirstPlayer: winnerId}
                                                ]
                                            },
                                            $and: {result: null}
                                        }
                                    }
                                )
                                .then(function (res) {
                                    console.log(res.dataValues.id);
                                    let condition = res.dataValues.id;
                                    Game
                                        .update({
                                                idOfFirstPlayer: winnerId,
                                                idOfSecondPlayer: looserId,
                                                result: true
                                            },
                                            {where: {id: condition}})
                                })
                        }
                    )
                })
        })
}

module.exports.saveGameResult = saveGameResult;
module.exports.saveGameInit = saveGameInit;