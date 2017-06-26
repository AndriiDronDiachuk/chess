/**
 * Created by andrii on 25.06.17.
 */

function addUser(userId) {
    usersOnline.push(userId);
    updateUserList();
}

function removeUser(userId) {
    for (let i = 0; i < usersOnline.length; i++) {
        if (usersOnline[i] === userId) {
            usersOnline.splice(i, 1);
        }
    }
    updateUserList();
}

function createNewUserForDb() {
    return {
        name: $('#username').val(),
        password: $('#password').val()
    };
}

function setTimeDuration(statistics) {
    for (let i = 0; i < statistics.length; i++) {
        let tempTime = Date.parse(statistics[i].updatedAt) - Date.parse(statistics[i].createdAt);
        statistics[i].createdAt = new Date(Date.parse(statistics[i].createdAt));
        tempTime = new Date(tempTime - (3 * 60 * 60 * 1000));
        let options = {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };
        tempTime = tempTime.toLocaleString('ru', options);
        statistics[i].timeDuration = tempTime;
    }
    return statistics;
}

function isCaptured(move) {
    return move.captured !== '';
}

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
            msgConvert.flags = 'Повышение';
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