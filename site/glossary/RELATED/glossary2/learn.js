/*
  TODO:

  * word list should auto-update on table changes (instead of being fully
    regenerated from table at specific times)

  * test
  * arrow key navigation
  * enter in any column except last should activate test
  * export/import to textarea
  * save to localstorage

 */

var wordInputTable = $('table.wordinput'),
    key = 'someRandomString',
    tab = {
        "current" : "add",
        "add" : {                    // tab.add
            'link': $('.addmode'),   //   tab.add.link
            'page': $('.page1'),     //   tab.add.page
            'init': function () { addTableRow() },
        },
        "test" : {                   // tab.test
            'link': $('.testmode'),  //   tab.test.link
            'page': $('.page2'),     //   tab.test.page
            'init': function () { },
        },
        "extract" : {
            'link': $('.extractmode'),  //   tab.test.link
            'page': $('.page3'),     //   tab.test.page
            'init': function () { },
        },
        "known" : {
            'link': $('.knownmode'),  //   tab.test.link
            'page': $('.page4'),     //   tab.test.page
            'init': function () { },
        },
        "init" : function () {
        },
        "change" : function (tab) {
            var mode = this[this.current];
            mode.link.removeClass('current');
            mode.page.addClass('hidden');
            this.current = tab;
            mode = this[this.current];
            mode.link.addClass('current');
            mode.page.removeClass('hidden');
            mode.init();
        },
    },
    questionNumber = 0,
    replyCommentElement = $('#replycomment'),
    words = [],
    current = 0;

function focusCell(row, col) {  // row = number, col = en | pos | tlh
    $('tr[data-index="' + row + '"] td.' + col).focus();
    current = row;
}


// localStorage load/save functions
function save(key, data) {
    return localStorage.setItem(key, JSON.stringify(data));
}
function load(key) {
    return JSON.parse(localStorage.getItem(key));
}
function remove(key) {
    return localStorage.removeItem(key);
}

function newTableRowHTML(word, count) {
    word  = word || {'tlh':'','pos':'','en':''};
    count = count === undefined ? words.length : count;
    return '<tr data-index=' + count + '>' +
        '<td contenteditable class=tlh>' +
        (word.tlh || '') +
        '<td contenteditable class=pos>' +
        (word.pos || '') +
        '<td contenteditable class=en>' +
        (word.en || '') +
        '</tr>';
}

function addTableRow () {
    var lastTableRow;
    wordInputTable.append(newTableRowHTML());
    lastTableRow = $('tr', wordInputTable).last();
    $('td', lastTableRow).first().focus(); // focus first cell in last table row
}

function getWordFromTableRow(tableRow) {
    var word = {};
    $('td', tableRow).each(function () {
        name = $(this).attr('class');
        data = $(this).text();
        word[name] = $.trim(data);
    });
    return word;
}

function getWordsFromTable(table) {
    var words = [];
    mapTableBodyRow(table, function (tableRowElement) {
        var word = getWordFromTableRow(tableRowElement);
        if (word.tlh || word.pos || word.en) {
            words.push(word);
        } else {
            $(tableRowElement).remove(); // remove blank rows
        }
    });
    return words;
}

function putWordsIntoTable(table, words) {
    var i = -1,
        tableBody = $('tbody', table);
    tableBody.empty().append(
        words.map(function (word) {
            i += 1;
            return newTableRowHTML(word, i);
        }).join('')
    );
}

function mapTableBodyRow(table, func) {
    var tableRows = $('tr', $('tbody', table));
    return $.map(tableRows, function (tableRowElement) {
        return func(tableRowElement);
    });
}

function testMode() {
    words = getWordsFromTable(wordInputTable);
    save(key, words);
    tab.change('test');
    askQuestion();
    $('td[contenteditable]').focus();
}

function addMode() {
    tab.change('add');
}
function extractMode() {
    tab.change('extract');
}
function knownMode() {
    tab.change('known');
}

function rnd(max) {
    return Math.floor(parseInt(max) * Math.random());
}

function log(str) {
    $('#log').append('<br>&gt;' + str);
}
function dump() {
    $('#dump').html(JSON.stringify(words, null, 2));
}

function askQuestion() {
    questionNumber = rnd(words.length);
    $('#question').empty().append(
        '<b lang=tlh>' +
        words[questionNumber].tlh + '</b> (' +
        words[questionNumber].pos + ')'
    );
}

function replyComment(str, type) {
    replyCommentElement.html(str || '');
    if (type) {
        replyCommentElement.attr('class', type);
    } else {
        replyCommentElement.removeAttr('class');
    }
}

function testReply() {
    var answer = $.trim($('#answer').text()),             // get answer
        regex  = new RegExp('\\b' + answer + '\\b', 'i'), // turn into regex
        word   = words[questionNumber],
        good   = '<b lang=tlh>' + word.tlh + '</b> (' + word.pos + ') <i>' + word.en + '</i>';

    if (answer.length < 3) {
        log('SORCUHOSERCUH');
        replyComment('Answer must be at least 3 characters log', 'bad');
        return;
    }
    if (word.en.match(regex)) {
        replyComment('You’re right!<br>' + good, 'good');
    } else {
        replyComment('INCORRECT!<br>' + good, 'bad');
    }
    askQuestion();
}


// on document load
$(function () {

    // when a table cell is focused
    wordInputTable.focusin(function (event) {
        var element = event.srcElement;
        current = $(element).parent().data('index');
        log('current: ' + current);
    });

    // when something is entered into a table cell
    wordInputTable.keydown(function (event) {
        var element = $(event.srcElement),
            nextElement,
        field = element.attr('class');

        switch (event.which) {
        case (13): // return
            event.preventDefault();
            nextElement = $(event.srcElement).next();
            if (nextElement.prop('tagName')) {
                nextElement.focus();
            } else {
                words = getWordsFromTable(wordInputTable);
                save(key, words);
                addTableRow();
            }
            break;
        case (38): // up arrow

            break;
        case (40): // down arrow

            break;
        }
        log(
            event.type  + ': ' +
            event.which + ' (line ' + current + '.' + field + ')'
        );
        dump();
    });

    $('#answer').keydown(function (event) {
        if (event.which == 13) {
            event.preventDefault();
            testReply();
        }
    });

    $('button.reply').click(testReply);
    $('.add').click(addTableRow);

    words = load(key);
    putWordsIntoTable(wordInputTable, words);

    tab.init();
    tab.test.link.click(testMode);
    tab.add.link.click(addMode);
    tab.extract.link.click(extractMode);
    tab.known.link.click(knownMode);
    tab.change('add');
});


// eof
