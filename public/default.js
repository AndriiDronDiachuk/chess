(function () {

    WinJS.UI.processAll().then(function () {

        let socket, serverGame;
        let username, playerColor;
        let game, board;
        let usersOnline = [];
        let myGames = [];
        socket = io();

        socket.on('login', function (msg) {
            usersOnline = msg.users;
            updateUserList();
            myGames = msg.games;
            updateGamesList();
        });

        socket.on('joinlobby', function (msg) {
            addUser(msg);
        });

        socket.on('leavelobby', function (msg) {
            removeUser(msg);
        });

        socket.on('gameadd', function (msg) {
        });

        socket.on('resign', function (msg) {
            if (msg.gameId == serverGame.id) {
                $('#play').attr('disabled', false);
                $('#play').attr('value', 'Играть');
                $('#page-game').hide();
                $('input[type=radio]').attr('disabled', false);
                $('#page-lobby').show();
                $('#userList').hide();
            }
        });

        socket.on('joingame', function (msg) {
            console.log("joined as game id: " + msg.game.id);
            playerColor = msg.color;
            initGame(msg.game);
            $('#page-lobby').hide();
            $('#page-game').show();
        });

        socket.on('move', function (msg) {
            if (serverGame && msg.gameId === serverGame.id) {
                game.move(msg.move);
                board.position(game.fen());
            }
        });

        socket.on('logout', function (msg) {
            removeUser(msg.username);
        });

        $('#login').on('click', function () {
            username = $('#username').val();
            $('#1radio').attr('checked', 'checked');
            if (username.length > 0) {
                $('#userLabel').text(username);
                $('#page-login').hide();
                $('#page-lobby').show();
            }
        });
        $('#play').on('click',function () {
            let username = $('#username').val();
            let usercolor = $('input[type=radio]:checked').val();
            if(usercolor==='black'){
                username = username + ' -Ч';
            }
            else{
                username = username + ' -Б';
            }
            $('input[type=radio]').attr('disabled', true);
            $('#play').attr('value', 'Вы в очереди');
            $('#play').attr('disabled', true);
            $('#page-lobby').show();
            $('#userList').show();
            socket.emit('login', username);
        });

        $('#game-back').on('click', function () {
            socket.emit('login', username);
            $('#play').attr('value', 'Вернуться в игру');
            $('#play').attr('disabled', false);
            $('#page-game').hide();
            $('#page-lobby').show();
        });

        $('#game-resign').on('click', function () {
            socket.emit('resign', {userId: username, gameId: serverGame.id});
            $('#play').attr('disabled', false);
            $('#play').attr('value', 'Играть');
            $('#page-game').hide();
            $('input[type=radio]').attr('disabled', false);
            $('#page-lobby').show();
            $('#userList').hide();
        });

        let addUser = function (userId) {
            usersOnline.push(userId);
            updateUserList();
        };

        let removeUser = function (userId) {
            for (let i = 0; i < usersOnline.length; i++) {
                if (usersOnline[i] === userId) {
                    usersOnline.splice(i, 1);
                }
            }
            updateUserList();
        };

        let updateGamesList = function () {
            document.getElementById('gamesList').innerHTML = '';
            myGames.forEach(function (game) {
                $('#gamesList').append($('<button>')
                    .text('#' + game)
                    .on('click', function () {
                        socket.emit('resumegame', game);
                    }));
            });
        };

        let updateUserList = function () {
            document.getElementById('userList').innerHTML = '';
            usersOnline.forEach(function (user) {
                $('#userList').append($('<button>')
                    .text(user)
                    .on('click', function () {
                        socket.emit('invite', user);
                    }));
            });
        };

        let initGame = function (serverGameState) {
            serverGame = serverGameState;

            let cfg = {
                draggable: true,
                showNotation: false,
                orientation: playerColor,
                position: serverGame.board ? serverGame.board : 'start',
                onDragStart: onDragStart,
                onDrop: onDrop,
                onSnapEnd: onSnapEnd
            };

            game = serverGame.board ? new Chess(serverGame.board) : new Chess();
            board = new ChessBoard('game-board', cfg);
        };

        let onDragStart = function (source, piece, position, orientation) {
            if (game.game_over() === true ||
                (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
                (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
                (game.turn() !== playerColor[0])) {
                return false;
            }
        };


        let onDrop = function (source, target) {
            let move = game.move({
                from: source,
                to: target,
                promotion: 'q'
            });

            if (move === null) {
                return 'snapback';
            } else {
                socket.emit('move', {move: move, gameId: serverGame.id, board: game.fen()});
            }
        };

        let onSnapEnd = function () {
            board.position(game.fen());
        };

        socket.on('colorErr',function () {
            alert("Этот игрок выбрал ваш цвет! Виберите другого игрока");
        })
    });
})();

