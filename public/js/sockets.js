/**
 * Created by andrii on 25.06.17.
 */

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
    if (msg.gameId === serverGame.id) {
        $('#play').attr('disabled', false).attr('value', 'Играть');
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

                socket.emit('get-statistics', username);
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

socket.on('color-err', function () {
    alert("Этот игрок выбрал Ваш цвет! Виберите другого игрока");
});

socket.on('show-st-wins', function (statistics) {
    for(let i=0;i<statistics.length;i++){
        if(statistics[i].result===true){
            statistics[i].result = 'Победа';
        }
        else{
            statistics[i].result = 'Пат';
        }
    }
    let extendedStatistics = setTimeDuration(statistics);
    showStatistics(extendedStatistics);
});
socket.on('show-st-faults', function (statistics) {
    for(let i=0;i<statistics.length;i++){
        if(statistics[i].result===true){
            statistics[i].result = 'Поражение';
        }
        else{
            statistics[i].result = 'Пат';
        }
    }
    let extendedStatistics = setTimeDuration(statistics);
    showStatistics(extendedStatistics);
});

socket.on('stalemate', function (user) {
    let answer = confirm(user + ' предложил ничю');
    if (answer) socket.emit('resign', {userId: username, gameId: serverGame.id, gameRes: false})
});

$('#sign-up').on('click', function () {
    socket.emit('sign-up', createNewUserForDb());
});

$('#sign-in').on('click', function () {
    socket.emit('login-check', createNewUserForDb());
});

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
    $('#play').attr('value', 'Вы в очереди').attr('disabled', true);
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
    socket.emit('resign', {userId: username, gameId: serverGame.id, gameRes: true});
});

$('#game-stalemate').on('click', function () {
    socket.emit('game-stalemate', username);
});