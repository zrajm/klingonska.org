/*global $, Modernizr, localStorage, HookedArray */
// requires: hookedarray.js

//
// FIXME: this should enhance HookedArray, adding an additional layer for the
// prototype for its own methods
//
function makeTableArray(opts) {
    'use strict';
    var obj, currentIndex, currentField, keyCount = 0;
    if (Object.prototype.toString.call(opts) !== '[object Object]') {
        throw new TypeError('makeTableArray() argument must object with options');
    }
    if (!Modernizr.localstorage) {
        throw new ReferenceError('makeTableArray() localstorage not available in this browser');
    }

    // create one HTML tag
    function tag(name, content, attr) {
        content = content || '';
        return '<' + name + (attr ? ' ' + attr : '') + '>' +
            content + '</' + name + '>';
    }

    function current() {
        $('#current').html(Array.prototype.slice.call(arguments, 0).join(' + '));
    }

    function dump(someArray) {
        var newArray = $.extend(true, {}, someArray);  // clone object
        newArray.tableOpts.container = 'ZAPPED';       // zap the DOM container thingy
        $('#dump').html('<pre>' + JSON.stringify(newArray, null, 4) + '</pre>');
    }

    // get/set currently selected element
    function focusin(event) {
        var element = $(event.target);
        currentIndex = parseInt(element.parent().attr('data-index'), 10);
        currentField = element.attr('class');
        //log('focusin ' + element.parent().prop('tagName') + ' ' + currentIndex + '/' + currentField);
        current(currentIndex, currentField);
    }

    function keydown(event) {
        //log('keydown');
        var element = $(event.target), next;
        switch (event.which) {
        case (13): // enter
            // move to next table cell, insert empty table row beneath current
            // if on last table cell
            event.preventDefault();
            next = element.next();
            if (next.length > 0) {
                next.trigger('focus');
            } else {
                obj.insert(currentIndex + 1, { tlh: '', en: '', pos: '' });
                element.parent().next().children().first().focus();
            }
            break;
        case (38): // up arrow
            // move to cell above current
            event.preventDefault();
            $('tr[data-index="' + (currentIndex - 1) + '"] td.' + currentField).trigger('focus');
            break;
        case (40): // down arrow
            // move to cell below current
            event.preventDefault();
            $('tr[data-index="' + (currentIndex + 1) + '"] td.' + currentField).trigger('focus');
            break;
        // case (8): // backspace
        //     // * if in first cell in empty table row, remove table row
        //     // * MAYBE: if in empty table cell, move to last in previous cell
        //     log('keypress: backspace');
        //     //log(index + ' ' + field + ' &gt;' + glossaryList[index][field] + '&lt;');
        //     if (glossaryList[index][field] === "") {
        //         event.preventDefault();
        //         if ($(event.target).is(':first-child')) {
        //             if (glossaryList[index].tlh   === '' &&
        //                 glossaryList[index].pos === '' &&
        //                 glossaryList[index].en  === '') {
        //                 glossaryList.splice(index, 1);  // erase line
        //                 tableState.element = drawTable(tableState.outerElement, glossaryList, tableOption);
        //                 cellFocus(tableState.element, index-1, -1);
        //                 log('focuscell');
        //                 //$('tr[data-index="' + (index-1) + '"] td:last-child', tableState.element).focus();
        //                 saveArray(glossaryList, index);
        //             }
        //         } else {
        //             $(event.target).prev().focus();
        //         }
        //     }
        //     // if at beginning of line and all fields empty, delete field
        //     break;
        // case (37): // left arrow
        //     // FIXME: should move to prev field if at beg of field
        //     log('keypress: left');
        //     break;
        // case (39): // right arrow
        //     log('keypress: right');
        //     // FIXME: should move to next field if at end of field
        //     break;
        // case (48): // delete
        //     // if at beginning of line and all fields empty, delete field
        //     log('keypress: ' + event.which);
        //     break;
        }
        // dump(obj);
        // current(currentIndex, currentField, keyCount += 1);
    }

    function keyup(event) {
        //log('keyup');
        //event.preventDefault();
        var element = $(event.target),
            text    = element.text();
        if (currentField && obj[currentIndex][currentField] !== text) {
            obj.set(currentIndex, function (values) { values[0][currentField] = text; });
        }
        dump(obj);
        current(currentIndex, currentField, keyCount += 1);
    }

    // define methods & properties of object
    obj = new HookedArray();   // create object
    obj.tableOpts = {};        // store options
    ['cells', 'titles', 'container', 'name'].forEach(function (name) {
        obj.tableOpts[name] = opts[name];
    });
    obj.load = function () {
        var dataJSON = localStorage.getItem(this.tableOpts.name);
        if (dataJSON) {
            this.splice(0, this.length, JSON.parse(dataJSON));
        }
        return this;
    };
    obj.save = function () {
        var dataJSON = JSON.stringify(this);
        localStorage.setItem(this.tableOpts.name, dataJSON);
        return this;
    };
    obj.container = function (domObj) { this.tableOpts.container = domObj; };
    obj.cells     = function (list) {   this.tableOpts.cells     = list;   };
    obj.titles    = function (titles) { this.tableOpts.titles    = titles; };
    obj.name      = function (name) {   this.tableOpts.name      = name;   };
    obj.redraw    = function () {
        // FIXME: don't redraw existing parts of table
        //
        // Should insert new values into existing table, only adding/removing
        // lines at end of table. This should solve focusing problems. (?)
        //
        var opts = obj.tableOpts,
            title = tag('thead', tag('tr', opts.cells.map(function (field) {
                return tag('th', opts.titles[field]);
            }).join(''))),
            content = tag('tbody', obj.map(function (row, index) {
                return tag('tr', opts.cells.map(function (field) {
                    return tag('td', row[field], 'contenteditable class=' + field);
                }).join(''), 'data-index=' + index);
            }).join(''));
        opts.container.html(title + content);
    };
    /*jslint unparam: true */
    obj.partRedraw = function (index, newValues, oldValues) {
        // FIXME: should insert stuff
        var trLast, content,
            opts  = obj.tableOpts,
            tbody = $(opts.container.children('tbody')),
            trCount = 0;
        // replace existing <td> values
        tbody.children('tr').each(function (index, tr) {
            tr = $(tr);
            if (!obj[index]) { return false; }
            tr.children('td').each(function (count, td) {
                $(td).text(obj[index][opts.cells[count]]);
            });
            trCount += 1;
            trLast  = tr;
        });
        if (trCount < obj.length) {
            content = obj.slice(trCount).map(function (row, index) {
                return tag('tr', opts.cells.map(function (field) {
                    return tag('td', row[field], 'contenteditable class=' + field);
                }).join(''), 'data-index=' + (index + trCount));
            }).join('');
            tbody.append(content);
        } else {
            if (obj.length > 0) {
                trLast.nextAll().remove();
            } else {
                tbody.empty();
            }
        }
    };
    /*jslint unparam: false */

    // init object
    obj.postChange(function (index, newValues, oldValues, calledAs) {
        obj.save();
        if (calledAs === 'set') { return; }
        obj.partRedraw(index, newValues, oldValues, calledAs);
        // var func = (calledAs === 'set') ? 'partRedraw' : 'redraw';
        // obj[func](index, newValues, oldValues, calledAs);
    });
    obj.load();    // load previous content from localStorage
    if (obj.length === 0) {
        obj.push({ tlh: '', pos: '', en: '' });
    }

    opts.container.on('focusin', focusin);
    opts.container.on('keyup', keyup);
    opts.container.on('keydown', keydown);
    obj.redraw();

    return obj;
}

// eof
