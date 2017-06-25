const Sequelize = require('sequelize');
const connection = require('./db/connection');
const Player = require('./db/models/player');
const Game = require('./db/models/game');
require('./db/relations');
const queries = require('./db/queries');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));
app.use(express.static('dashboard'));

const lobbyUsers = {};
const users = {};
const activeGames = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/default.html');
});

http.listen(2000, function () {
    console.log('Server started on port 2000.');
});

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

    socket.on('get-statistics',function (username) {
        getWins(username);
        getFaults(username);
    });

    socket.on('login', function (userId) {
        doLogin(socket, userId);
    });

    socket.on('invite', function (opponentId) {
        console.log('got an invite from: ' + socket.userId + ' --> ' + opponentId);
        socket.opponentId = opponentId;
        let userColor = socket.userId.substr(-1);
        let opponentColor = socket.opponentId.substr(-1);
        if (userColor !== opponentColor) {
            let firstGamer, secondGamer;
            if (userColor === 'Б') {
                firstGamer = socket.userId;
                secondGamer = socket.opponentId;
            }
            else {
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

            queries.saveGameInit({
                userId: socket.userId.slice(0, -3),
                opponentId: socket.opponentId.slice(0, -3)
            });
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

            if(socket.userId===users[activeGames[msg.gameId].users.white].userId)
            {
                socket.opponentId = users[activeGames[msg.gameId].users.black].userId;
            }
            else{
                socket.opponentId = users[activeGames[msg.gameId].users.white].userId;
            }

            queries.saveGameResult({
                winnerId:socket.userId.slice(0,-3),
                looserId:socket.opponentId.slice(0,-3),
                result:msg.move.isCheckMate
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

        if(socket.userId===users[activeGames[msg.gameId].users.white].userId)
        {
            socket.opponentId = users[activeGames[msg.gameId].users.black].userId;
        }
        else{
            socket.opponentId = users[activeGames[msg.gameId].users.white].userId;
        }

        queries.saveGameResult({
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

    function getWins(username) {
        connection
            .sync()
            .then(function () {
                Game
                    .findAll({
                        attributes: ['result', 'createdAt', 'updatedAt', 'idLooser.name'],
                        include: [{
                            model: Player,
                            as: 'idWinner',
                            where: {
                                name: username
                            }
                        }, {
                            model: Player,
                            as: 'idLooser',
                        }],
                        raw: true,
                        where:{
                            result: true
                        }
                    })
                    .then(function (wins) {
                        socket.emit('show-st-wins',wins);
                    })
            });
    }

    function getFaults(username) {
        connection
            .sync()
            .then(function () {
                Game
                    .findAll({
                        attributes: ['result', 'createdAt', 'updatedAt', 'idWinner.name'],
                        include: [{
                            model: Player,
                            as: 'idLooser',
                            where: {
                                name: username
                            }
                        }, {
                            model: Player,
                            as: 'idWinner',
                        }],
                        raw: true,
                        where:{
                            result: true
                        }
                    })
                    .then(function (faults) {
                        socket.emit('show-st-faults',faults);
                    })
            });
    }
});