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

    socket.on('login', function (userId, usercolor) {
        console.log(usercolor);
        doLogin(socket, userId, usercolor);
    });

    function doLogin(socket, userId, usercolor) {
        socket.userId = userId;
        socket.userColor = usercolor;

        if (!users[userId]) {
            console.log('creating new user');
            users[userId] = {userId: socket.userId, userColor: socket.userColor, games: {}};
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

        let userColor = socket.userId.substr(-1);
        let opponentColor = opponentId.substr(-1);
        if(userColor!==opponentColor) {
            let firstGamer;
            let secondGamer;
            if(userColor==='Б'){
                firstGamer = socket.userId;
                secondGamer = opponentId;
            }
            else if(userColor==='Ч') {
                firstGamer = opponentId;
                secondGamer = socket.userId;
            }
            socket.broadcast.emit('leavelobby', socket.userId);
            socket.broadcast.emit('leavelobby', opponentId);

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

            socket.broadcast.emit('gameadd', {gameId: game.id, gameState: game});
        }
        else{
            socket.emit('colorErr');
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
        socket.broadcast.emit('move', msg);
        console.log(msg);
    });

    socket.on('resign', function (msg) {
        console.log("resign: " + msg);

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

