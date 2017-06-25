(function () {

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
            $('#page-main').show();
            clearGamesList();
            clearLog();
            clearCaptured();
        }
    });

    socket.on('joingame', function (msg) {
        console.log("joined as game id: " + msg.game.id);
        playerColor = msg.color;
        initGame(msg.game);
        $('#page-lobby').hide();
        $('#page-game').show();
        $('#page-main').hide();
    });

    socket.on('move', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {
            game.move(msg.move);
            board.position(game.fen());
            let convertMove = convertLog(msg.move);
            if (isCaptured(convertMove)) {
                showCaptured(convertMove);
            }
            showLog(convertMove);
        }
    });

    socket.on('logout', function (msg) {
        removeUser(msg.username);
    });

    socket.on('sign-up-err', function () {
        alert('Пользователь с таким именем уже существует!');
    });

    socket.on('sign-up', function (insertedPlayer) {
        alert('Вы зарегистированы! Имя: ' + insertedPlayer.name + ', пароль: ' + insertedPlayer.password);
    });

    socket.on('login-check', function (check) {
        if (check.existCount !== 0) {
            if (check.passCount !== 0) {
                username = $('#username').val();
                $('#1radio').attr('checked', 'checked');
                if (username.length > 0) {
                    $('#userLabel').text(username);
                    $('#page-login').hide();
                    $('#page-lobby').show();
                    $('#page-main').show();

                    socket.emit('get-statistics',username);
                }
            }
            else {
                alert('Неверный пароль!');
            }
        }
        else {
            alert('Вы не зарегистрированы!');
        }
    });

    function setTimeDuration(statistics) {
        for(let i=0;i<statistics.length-1;i++){
            let tempTime = Date.parse(statistics[i].updatedAt) - Date.parse(statistics[i].createdAt);
            tempTime = new Date(tempTime - (3*60*60*1000));
            let options = {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            };
            tempTime = tempTime.toLocaleString('ru',options);
            statistics[i].timeDuration = tempTime;
        }
        return statistics;
    }

    function showStatistics(statistics) {
        for(let i =0;i<statistics.length-1;i++) {
            $('.statistics').append(
                '<tr>' +
                '<td>' + statistics[i].name + '</td>' +
                '<td>' + statistics[i].createdAt + '</td>' +
                '<td>' + statistics[i].timeDuration + '</td>' +
                '<td>' + statistics[statistics.length-1] + '</td>' +
                '</tr>');
        }
    }

    socket.on('show-st-wins',function (statistics) {
        statistics.push('Победа');
        let extendedStatistics = setTimeDuration(statistics);
        showStatistics(extendedStatistics);
    });
    socket.on('show-st-faults',function (statistics) {
        statistics.push('Поражение');
        let extendedStatistics = setTimeDuration(statistics);
        showStatistics(extendedStatistics);
    });

    $('#sign-up').on('click', function () {
        socket.emit('sign-up', createNewUserForDb());
    });

    $('#sign-in').on('click', function () {
        socket.emit('login-check', createNewUserForDb());
    });

    function createNewUserForDb() {
        let newUser = {
            name: $('#username').val(),
            password: $('#password').val()
        };
        return newUser;
    }

    $('#play').on('click', function () {
        let username = $('#username').val();
        let usercolor = $('input[type=radio]:checked').val();
        if (usercolor === 'black') {
            username = username + ' -Ч';
        }
        else {
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
        let username = $('#username').val();
        let usercolor = $('input[type=radio]:checked').val();
        if (usercolor === 'black') {
            username = username + ' -Ч';
        }
        else {
            username = username + ' -Б';
        }
        $('#play').attr('value', 'Вернуться в игру');
        $('#page-game').hide();
        $('#page-lobby').show();
        $('#page-main').show();
        socket.emit('login', username);
    });

    $('#game-resign').on('click', function () {
        $('#play').attr('disabled', false);
        $('#play').attr('value', 'Играть');
        $('#page-game').hide();
        $('input[type=radio]').attr('disabled', false);
        $('#page-lobby').show();
        $('#userList').hide();
        $('#page-main').show();
        clearGamesList();
        clearLog();
        clearCaptured();
        socket.emit('resign', {userId: username, gameId: serverGame.id});
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

    let clearGamesList = function () {
        document.getElementById('gamesList').innerHTML = '';
    };

    let updateGamesList = function () {
        document.getElementById('gamesList').innerHTML = '';
        myGames.forEach(function (game) {
            $('#gamesList').append($('<button>')
                .text('#' + game)
                .on('click', function () {
                    $('#page-main').hide();
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
                    $('#page-main').hide();
                    socket.emit('invite', user);
                }));
        });
    };

    let initGame = function (serverGameState) {
        serverGame = serverGameState;

        let cfg = {
            draggable: true,
            showNotation: true,
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
            promotion: 'q',
        });

        if (move === null) {
            return 'snapback';
        } else {
            move.isCheck = game.in_check();
            move.isCheckMate = game.in_checkmate();
            move.isStalemate = game.in_stalemate();
            let convertMove = convertLog(move);
            showLog(convertMove);

            if (isCaptured(convertMove) === true) {
                showCaptured(convertMove);
            }
            socket.emit('move', {move: move, gameId: serverGame.id, board: game.fen()});
        }
    };

    let onSnapEnd = function () {
        board.position(game.fen());
    };

    socket.on('color-err', function () {
        alert("Этот игрок выбрал Ваш цвет! Виберите другого игрока");
    });

    function convertLog(move) {
        let dateTime = new Date();
        let options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };
        let dateTimeConvert = dateTime.toLocaleString('ru', options);
        let msgConvert = {
            dateTime: dateTime,
            dateTimeConvert: dateTimeConvert,
            from: move.from,
            to: move.to
        };
        switch (move.color) {
            case 'w':
                msgConvert.color = 'Белый';
                break;
            case 'b':
                msgConvert.color = 'Черный';
                break;
        }
        switch (move.isCheck) {
            case true:
                msgConvert.isCheck = 'Шах';
                break;
            case false:
                msgConvert.isCheck = '';
                break;
        }
        switch (move.isCheckMate) {
            case true:
                msgConvert.isCheckMate = 'Мат';
                break;
            case false:
                msgConvert.isCheckMate = '';
                break;
        }
        switch (move.isStalemate) {
            case true:
                msgConvert.isStalemate = 'Пат';
                break;
            case false:
                msgConvert.isStalemate = '';
                break;
        }
        switch (move.flags) {
            case 'b': //a pawn push of two squares
            case 'n':
                msgConvert.flags = 'Ход';
                break; // a non-capture
            case 'p':
                mscConvert.flags = 'Повышение';
                break;  // a pawn promotion
            case 'e': //an en passant capture
            case 'c':
                msgConvert.flags = 'Бой';
                break; // standard capture
            case 'k':
                msgConvert.flags = 'Рокировка от короля';
                break;
            case 'q':
                msgConvert.flags = 'Рокировка от королевы';
                break;
        }
        switch (move.piece) {
            case 'b':
                msgConvert.piece = 'Слоник';
                break;
            case 'k':
                msgConvert.piece = 'Король';
                break;
            case 'n':
                msgConvert.piece = 'Конь';
                break;
            case 'p':
                msgConvert.piece = 'Пешка';
                break;
            case 'q':
                msgConvert.piece = 'Королева';
                break;
            case 'r':
                msgConvert.piece = 'Тура';
                break;
        }
        switch (move.captured) {
            case undefined:
                msgConvert.captured = '';
                break;
            case 'b':
                msgConvert.captured = 'Слоник';
                break;
            case 'k':
                msgConvert.captured = 'Король';
                break;
            case 'n':
                msgConvert.captured = 'Конь';
                break;
            case 'p':
                msgConvert.captured = 'Пешка';
                break;
            case 'q':
                msgConvert.captured = 'Королева';
                break;
            case 'r':
                msgConvert.captured = 'Тура';
                break;
        }
        return msgConvert;
    }

    function showLog(msgConvert) {
        $('#logs').append(
            '<table class="dynamic">' +
            '<tr>' +
            '<th class="wide-th">' + msgConvert.dateTimeConvert + '</th>' +
            '<th class="just-th">' + msgConvert.color + '</th>' +
            '<th class="just-th">' + msgConvert.piece + '</th>' +
            '<th class="just-th">' + msgConvert.from + ' -> ' + msgConvert.to + '</th>' +
            '<th class="wide-th">' + msgConvert.flags + ' ' +
            msgConvert.captured + ' ' +
            msgConvert.isCheck + ' ' +
            msgConvert.isCheckMate + '</th>' +
            '</tr>' +
            '</table>'
        );
    }

    function clearLog() {
        $('#logs').empty();
        $('#logs').append(
            '<table class="dynamic">' +
            '<tr>' +
            '<th class="wide-th">Время</th>' +
            '<th class="just-th">Цвет</th>' +
            '<th class="just-th">Фигура</th>' +
            '<th class="just-th">Координаты хода</th>' +
            '<th class="wide-th">Действие</th>' +
            '</tr>' +
            '</table>'
        );
    }

    function clearCaptured() {
        $('#wins').empty();
        $('#fails').empty();
        $('#fails').append('<p>Сбитые белые:</p>');
        $('#wins').append('<p>Сбитые черные:</p>');
    }

    function isCaptured(move) {
        if (move.captured !== '') {
            return true;
        }
        return false;
    }

    function showCaptured(move) {
        if (move.color === 'Черный') {
            $('#fails').append('<a>' + move.captured + ', ' + '</a>');
        }
        else if (move.color === 'Белый') {
            $('#wins').append('<a>' + move.captured + ', ' + '</a>');
        }
    }

})();