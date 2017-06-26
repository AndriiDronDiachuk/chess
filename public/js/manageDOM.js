/**
 * Created by andrii on 25.06.17.
 */

function clearGamesList () {
    $('#gamesList').empty();
}

function showLog(msgConvert) {
    $('#logs-table').append(
        '<tr><th>' + msgConvert.dateTimeConvert + '</th>' +
        '<th>' + msgConvert.color + '</th>' +
        '<th>' + msgConvert.piece + '</th>' +
        '<th>' + msgConvert.from + ' -> ' + msgConvert.to + '</th>' +
        '<th>' + msgConvert.flags + ' ' +
        msgConvert.captured + ' ' +
        msgConvert.isCheck + ' ' +
        msgConvert.isCheckMate + '</th></tr>'
    );
}

function clearLog() {
    $('#logs-table').empty().append(
        '<tr><th class="wide-th">Время</th>' +
        '<th class="just-th">Цвет</th>' +
        '<th class="just-th">Фигура</th>' +
        '<th class="just-th">Координаты хода</th>' +
        '<th class="wide-th">Действие</th></tr>'
    );
}

function showCaptured(move) {
    if (move.color === 'Черный') {
        $('#fails').append('<a>' + move.captured + ', ' + '</a>');
    }
    else if (move.color === 'Белый') {
        $('#wins').append('<a>' + move.captured + ', ' + '</a>');
    }
}

function clearCaptured() {
    $('#wins').empty().append('<p>Сбитые белые:</p>');
    $('#fails').empty().append('<p>Сбитые черные:</p>');
}

function showStatistics(statistics) {
    for (let i = 0; i < statistics.length; i++) {
        $('.statistics-table').append(
            '<tr><td>' + statistics[i].name + '</td>' +
            '<td>' + statistics[i].createdAt + '</td>' +
            '<td>' + statistics[i].timeDuration + '</td>' +
            '<td>' + statistics[i].result + '</td></tr>'
        );
    }
}