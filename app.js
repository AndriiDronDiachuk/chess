//подключение бд
const Sequelize = require('sequelize');
const connection = new Sequelize('chessdb', 'postgres', '1111', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres'/*,

    pool: {
        max: 20,
        min: 0,
        idle: 10000
    },*/
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
    timeDuration: Sequelize.DATE
});

Game.belongsTo(Player, {
    as: 'idFirstPlayer',
    foreignKey: 'idOfFirstPlayer'
});
Game.belongsTo(Player, {
    as: 'idSecondPlayer',
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
            console.log('gameid:!!!!',socket.gameId);
            activeGames[game.id] = game;

            users[game.users.white].games[game.id] = game.id;
            users[game.users.black].games[game.id] = game.id;

            console.log('starting game: ' + game.id);
            lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
            lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});

            delete lobbyUsers[game.users.white];
            delete lobbyUsers[game.users.black];

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
        activeGames[msg.gameId].board = msg.board;
        console.log(msg);
        socket.broadcast.emit('move', msg);
    });

    socket.on('resign', function (msg) {
        console.log("resign: " + msg);

        delete users[activeGames[msg.gameId].users.white].games[msg.gameId];
        delete users[activeGames[msg.gameId].users.black].games[msg.gameId];
        delete activeGames[msg.gameId];

        //мат

        socket.broadcast.emit('resign', msg);
    });


    socket.on('disconnect', function (msg) {

        console.log(msg);
        console.log('llllaaaaal');
        if (socket || socket.userId || socket.gameId || socket.opponentId) {
            console.log(socket.userId + ' disconnected us');
            console.log(socket.gameId + ' disconnected ga');
            console.log(socket.opponentId + ' disconnected op')
        }
        socket.emit('resign',{
            gameId: socket.gameId
        });
        delete lobbyUsers[socket.userId];
        delete lobbyUsers[socket.opponentId];
        delete activeGames[socket.gameId];

        socket.broadcast.emit('logout', {
            userId: socket.userId,
            gameId: socket.gameId,
            opponentId: socket.opponentId
        });
    });
})

