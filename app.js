//подключение бд
const Sequelize = require('sequelize');
const connection = new Sequelize('chessdb', 'postgres', '1111', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres'
});

//проверка подключения к бд
connection
    .authenticate()
    .then(() => {
        console.log('Connection to DataBase has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

//установка архитеркуры бд
const Player = connection.define('player', {
    name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: Sequelize.STRING
});

const Game = connection.define('game', {
    result: Sequelize.BOOLEAN,
    idOfFirstPlayer: Sequelize.INTEGER,
    idOfSecondPlayer: Sequelize.INTEGER
});

Game.belongsTo(Player, {
    as: 'idWinner',
    foreignKey: 'idOfFirstPlayer'
});
Game.belongsTo(Player, {
    as: 'idLooser',
    foreignKey: 'idOfSecondPlayer'
});

/*connection.sync({
 force: true
 });*/

const express = require('express');
const app = express();
const http = require('http').Server(app);

app.use(express.static('public'));
app.use(express.static('dashboard'));

const io = require('socket.io')(http);

const lobbyUsers = {};
const users = {};
const activeGames = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/default.html');
});

http.listen(2000, function () {
    console.log('Server started on port 2000.');
});

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

io.on('connection', function (socket) {
    console.log('new connection ' + socket);

    socket.on('sign-up', function (newUser) {
        connection
            .sync()
            .then(function () {
                Player
                    .create({
                        name: newUser.name,
                        password: newUser.password
                    })
                    .then(function (insertedPlayer) {
                        socket.emit('sign-up', insertedPlayer.dataValues);
                    })
                    .catch(connection.ValidationError, function (err) {
                        console.log(err);
                        socket.emit('sign-up-err');
                    })
            });
    });

    socket.on('login-check', function (loginedUser) {
        let check = {};
        Player
            .count({
                where: {
                    name: loginedUser.name
                }
            })
            .then(function (count) {
                check.existCount = count;
            });
        Player
            .count({
                where: {
                    name: loginedUser.name,
                    password: loginedUser.password
                }
            })
            .then(function (count) {
                check.passCount = count;
                socket.emit('login-check', check);
            });
    });

    socket.on('login', function (userId) {
        doLogin(socket, userId);
    });

    function doLogin(socket, userId) {
        socket.userId = userId;

        if (!users[userId]) {
            console.log('creating new user');
            users[userId] = {userId: socket.userId, games: {}};
        } else {
            console.log('user found!');
            Object.keys(users[userId].games).forEach(function (gameId) {
                console.log('gameid - ' + gameId);
            });
        }

        socket.emit('login', {
            users: Object.keys(lobbyUsers),
            games: Object.keys(users[userId].games)
        });
        lobbyUsers[userId] = socket;

        socket.broadcast.emit('joinlobby', socket.userId);
    }

    socket.on('invite', function (opponentId) {
        console.log('got an invite from: ' + socket.userId + ' --> ' + opponentId);
        socket.opponentId = opponentId;
        let userColor = socket.userId.substr(-1);
        let opponentColor = socket.opponentId.substr(-1);
        if (userColor !== opponentColor) {
            let firstGamer;
            let secondGamer;
            if (userColor === 'Б') {
                firstGamer = socket.userId;
                secondGamer = socket.opponentId;
            }
            else if (userColor === 'Ч') {
                firstGamer = socket.opponentId;
                secondGamer = socket.userId;
            }
            socket.broadcast.emit('leavelobby', socket.userId);
            socket.broadcast.emit('leavelobby', socket.opponentId);

            let game = {
                id: Math.floor((Math.random() * 100) + 1),
                board: null,
                users: {white: firstGamer, black: secondGamer}
            };

            socket.gameId = game.id;
            activeGames[game.id] = game;

            users[game.users.white].games[game.id] = game.id;
            users[game.users.black].games[game.id] = game.id;

            console.log('starting game: ' + game.id);
            lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
            lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});

            delete lobbyUsers[game.users.white];
            delete lobbyUsers[game.users.black];

            saveGameInit({
                userId: socket.userId.slice(0, -3),
                opponentId: socket.opponentId.slice(0, -3)
            })
            socket.broadcast.emit('gameadd', {gameId: game.id, gameState: game});
        }
        else {
            socket.emit('color-err');
        }
    });

    socket.on('resumegame', function (gameId) {
        console.log('ready to resume game: ' + gameId);

        socket.gameId = gameId;
        let game = activeGames[gameId];

        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;

        console.log('resuming game: ' + game.id);
        if (lobbyUsers[game.users.white]) {
            lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
            delete lobbyUsers[game.users.white];
        }

        if (lobbyUsers[game.users.black]) {
            lobbyUsers[game.users.black] &&
            lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});
            delete lobbyUsers[game.users.black];
        }
    });

    socket.on('move', function (msg) {

        if(msg.move.isCheckMate || msg.move.isStalemate){
            let result;
            if(msg.move.isCheckMate) result = true;
            else result = false;

            if(socket.userId===users[activeGames[msg.gameId].users.white].userId)
            {
                socket.opponentId = users[activeGames[msg.gameId].users.black].userId;
            }
            else{
                socket.opponentId = users[activeGames[msg.gameId].users.white].userId;
            }

            saveGameResult({
                winnerId:socket.userId.slice(0,-3),
                looserId:socket.opponentId.slice(0,-3),
                result:result
            });

            delete users[activeGames[msg.gameId].users.white].games[msg.gameId];
            delete users[activeGames[msg.gameId].users.black].games[msg.gameId];
            delete activeGames[msg.gameId];

            socket.emit('resign', msg);
            socket.broadcast.emit('resign', msg);
        }
        else {
            activeGames[msg.gameId].board = msg.board;
            console.log(msg);
            socket.broadcast.emit('move', msg);
        }
    });

    socket.on('resign', function (msg) {
        console.log("resign: " + msg);
        console.log('user: ' + msg.userId);
        console.log('opponent: ' + socket.opponentId);

        saveGameResult({
            winnerId: socket.opponentId.slice(0, -3),
            looserId: msg.userId,
            result: true
        });

        delete users[activeGames[msg.gameId].users.white].games[msg.gameId];
        delete users[activeGames[msg.gameId].users.black].games[msg.gameId];
        delete activeGames[msg.gameId];

        socket.broadcast.emit('resign', msg);
    });

    socket.on('disconnect', function (msg) {

        console.log(msg);

        if (socket && socket.userId && socket.gameId) {
            console.log(socket.userId + ' disconnected');
            console.log(socket.gameId + ' disconnected');
        }

        delete lobbyUsers[socket.userId];

        socket.broadcast.emit('logout', {
            userId: socket.userId,
            gameId: socket.gameId
        });
    });
});

