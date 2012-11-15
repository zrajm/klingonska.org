/*jslint browser: true */
/*global $ */

'use strict';

var glossaryList = [
    // {tlh:"bach", pos:"n", en:"shot"},
    // {tlh:"bach", pos:"v", en:"shoot"}
    ],
    color = [ 'red', 'green', 'blue' ],
    tableState = {
        element: undefined,         // DOM element for constructed table
        outerElement: undefined,    // DOM element for <div> outside table
        index: undefined,           // currently selected element in table
        field: undefined            // currently selected field in table
    },
    tableOption = {
        'order' : [ 'tlh', 'pos', 'en' ],
        'titles': { tlh: 'Klingon', pos: 'PoS', en: 'English', sv: 'Swedish' }
    },
    debugStatus = true;

function debug(str) {
    if (debugStatus) {
        console.log(str);
        //$('#log').append('<br>&gt;' + str);
    }
}

function log(str) {
    $('#log').append('<br>&gt;' + str);
}

function dump(obj) {
    $('#dump').html(JSON.stringify(obj, null, 4));
}

// functions for storing values
function saveValue(key, data) { return localStorage.setItem(key, JSON.stringify(data)); }
function loadValue(key) { return JSON.parse(localStorage.getItem(key)); }
function removeValue(key) { return localStorage.removeItem(key); }

function saveArray(array, startIndex) {
    var i;
    startIndex = startIndex || 0;
    log('saved from index ' + startIndex);
    for (i = array.length - 1; i >= startIndex; i -= 1) {
        saveValue(i, array[i]);
    }
    // array.forEach(function (value, index) {
    //     saveValue(index, value);
    // });
}
function loadArray(array) {
    var value;
    while (true) {
        value = loadValue(array.length); // load next value
        if (!value) { return array; }    // return if nothing found
        array.push(value);               // otherwise keep last value
    }
}

function tag(tagName, content, attr) {
    if (typeof content === 'string') { content = [ content ]; }
    return content.map(function (content) {
        return '<' + tagName + (attr !== undefined ? ' ' + attr : '') + '>' +
            (content !== undefined ? content + '</' + tagName + '>' : '');
    }).join('');
}

// <table> is a list of objects
// <props> is a list of property names in table
function table(objects, opts) {
    var props = opts.order || Object.keys(objects[0]).sort();
    return tag('table', tag('th',
        props.map(function (property) {
            return opts.titles ? opts.titles[property] : property;
        })) +
        objects.map(function (object, index) {
            return tag('tr',
                props.map(function (property) {   // one table line of <td>s
                    return tag('td', object[property], 'contenteditable class=' + property);
                }).join(''),
                'data-index=' + index);
        }).join(''));
}

function cellFocused(event) {
    var element = $(event.target);
    tableState.index = parseInt(element.parent().data('index'), 10);
    tableState.field = element.attr('class');
}

function drawTable(outerElement, objects, tableOptions) {
    outerElement.html(table(objects, tableOptions));
    return outerElement.children('table');      // return table DOM element
}


// field, falsy = first cell, -1 = last cell, string = specified cell
function cellFocus(table, index, field, cursorpos) {
    var trElement = $('tr[data-index="' + index + '"]'),  // select <tr>
        tdElement;//  = typeof field === 'string' ?
            // $('td.' + field, trElement) :
            // $('td',          trElement).eq(field || 0);

    if (typeof field === 'string') {           // string (= class)
        tdElement = $('td.' + field, trElement);
    } else {                                   // number
        tdElement = $('td', trElement).eq(field || 0);
    }

    if (tdElement.length === 0) { return false; }
    return tdElement.first().focus();
}


function cellKeypress(event) {
    var element, index = tableState.index, field = tableState.field;
    switch (event.which) {
    case (8): // backspace
        debug('keypress: backspace');
        //log(index + ' ' + field + ' &gt;' + glossaryList[index][field] + '&lt;');
        if (glossaryList[index][field] === "") {
            event.preventDefault();
            if ($(event.target).is(':first-child')) {
                if (glossaryList[index].tlh   === '' &&
                      glossaryList[index].pos === '' &&
                      glossaryList[index].en  === '') {
                    glossaryList.splice(index, 1);  // erase line
                    tableState.element = drawTable(tableState.outerElement, glossaryList, tableOption);
                    cellFocus(tableState.element, index-1, -1);
                    log('focuscell');
                    //$('tr[data-index="' + (index-1) + '"] td:last-child', tableState.element).focus();
                    saveArray(glossaryList, index);
                }
            } else {
                $(event.target).prev().focus();
            }
        }
        // if at beginning of line and all fields empty, delete field
        break;
    case (13): // return
        event.preventDefault();
        debug('keypress: return');
        element = $(event.target).next();
        if (element.prop('tagName')) {
            element.trigger('focus');
        } else {
            element = tableState.element;
            // insert new empty line (after current one)
            glossaryList.splice(index + 1, 0, { tlh: '', pos: '', en: '' });
            // redraw entire table (FIXME: only need to redraw parts below current line)
            tableState.element = drawTable(tableState.outerElement, glossaryList, tableOption);

            // tableState += 1;
            $('tr[data-index="' + (index + 1) + '"] td:first-child', tableState.element).focus();

            saveArray(glossaryList, index);

            // FIXME: focus newly created row
            // FIXME: focus first cell in added table row
            // element.append(tag('tr', '<td>aaa<td>aaa<td>aaa', 'data-index=' + glossaryList.length));
            // lastTableRow = $('tr', element).last();
            // $('td', lastTableRow).first().focus();
            // FIXME: add new empty row at end of table
        }
        break;
    case (37): // left arrow
        // FIXME: should move to prev field if at beg of field
        debug('keypress: left');
        break;
    case (38): // up arrow
        event.preventDefault();
        debug('keypress: up');
        index = tableState.index - 1;
        $('tr[data-index="' + index + '"] td.' + tableState.field).trigger('focus');
        break;
    case (39): // right arrow
        debug('keypress: right');
        // FIXME: should move to next field if at end of field
        break;
    case (40): // down arrow
        event.preventDefault();
        debug('keypress: down');
        index = tableState.index + 1;
        $('tr[data-index="' + index + '"] td.' + tableState.field).trigger('focus');
        break;
    case (48): // delete
        // if at beginning of line and all fields empty, delete field
        debug('keypress: ' + event.which);
        break;
    }
    dump(glossaryList);
}

function init(id, objects) {
    var outer = tableState.outerElement = $('#' + id),  // div containing constructed table
        inner;                                          // constructed table itself
    loadArray(objects);
    tableState.element = inner = drawTable(outer, objects, tableOption);
    // outer.html(table(objects, tableOption));
    // tableState.element = inner = outer.children('table');      // table element only
    outer.on('focusin', cellFocused);       // attach onfocus event
    outer.on('keydown', cellKeypress);      // attach keypress event
    outer.on('DOMNodeRemoved DOMCharacterDataModified', function (event) {
        var index = tableState.index,
            field = tableState.field,
            newValue = event.type === 'DOMNodeRemoved' ? '' : $(event.target).text();
        log('changing ' + index + ' ' + field + ' new value: ' + newValue);
        objects[index][field] = newValue;  // put new value in data
        saveValue(index, objects[index]);  // save it
    });
}

$(function () {
    init('input', glossaryList);
});

//eof
