/**
 * Created by andrii on 25.06.17.
 */

let objConvert = {
    colorObj: {w: 'Белый', b: 'Черный'},
    isCheckObj: {true: 'Шах', false: ''},
    isCheckMateObj: {true: 'Мат', false: ''},
    isStalemateObj: {true: 'Пат', false: ''},
    flagsObj: {
        b: 'Ход',
        n: 'Ход',
        p: 'Повышение',
        e: 'Бой',
        c: 'Бой',
        k: 'Рокировка от короля',
        q: 'Рокировка от королевы'
    },
    pieceObj: {
        b: 'Слоник',
        k: 'Король',
        n: 'Конь',
        p: 'Пешка',
        q: 'Королева',
        r: 'Тура'
    }
};

let dataTimeOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
};

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
    let dateTimeConvert = dateTime.toLocaleString('ru', dataTimeOptions);
    let msgConvert = {
        dateTime: dateTime,
        dateTimeConvert: dateTimeConvert,
        from: move.from,
        to: move.to
    };

    for (let key in objConvert.colorObj) {
        if (move.color === key) {
            msgConvert.color = objConvert.colorObj[key];
        }
    }

    for (let key in objConvert.isCheckObj) {
        if (move.isCheck.toString() === key) {
            msgConvert.isCheck = objConvert.isCheckObj[key];
        }
    }

    for (let key in objConvert.isCheckMateObj) {
        if (move.isCheckMate.toString() === key) {
            msgConvert.isCheckMate = objConvert.isCheckMateObj[key];
        }
    }

    for (let key in objConvert.isStalemateObj) {
        if (move.isStalemate.toString() === key) {
            msgConvert.isStalemate = objConvert.isStalemateObj[key];
        }
    }

    for (let key in objConvert.flagsObj) {
        if (move.flags === key) {
            msgConvert.flags = objConvert.flagsObj[key];
        }
    }

    for (let key in objConvert.pieceObj) {
        if (move.piece === key) {
            msgConvert.piece = objConvert.pieceObj[key];
        }
        if (move.captured === key) {
            msgConvert.captured = objConvert.pieceObj[key];
        }
        if (move.captured === undefined) {
            msgConvert.captured = '';
        }
    }

    return msgConvert;
}