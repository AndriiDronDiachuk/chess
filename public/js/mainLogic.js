/**
 * Created by andrii on 25.06.17.
 */

function initGame(serverGameState) {
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
}

function onDragStart(source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() !== playerColor[0])) {
        return false;
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

function onDrop(source, target) {

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
}

function updateGamesList() {
    $('#gamesList').empty();
    myGames.forEach(function (game) {
        $('#gamesList').append($('<button>')
            .text('#' + game)
            .on('click', function () {
                $('#page-main').hide();
                socket.emit('resumegame', game);
            }));
    });
}

function updateUserList() {
    $('#userList').empty();
    usersOnline.forEach(function (user) {
        $('#userList').append($('<button>')
            .text(user)
            .on('click', function () {
                $('#page-main').hide();
                socket.emit('invite', user);
            }));
    });
}