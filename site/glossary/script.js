// create one HTML tag
function tag(tag, content, attr) {
     content = content || '';
     return '<' + tag + (attr ? ' ' + attr : '') + '>' +
         content + '</' + tag + '>';
}

function log(str) {
    $('#log').append('<br>&gt;' + str);
}

function dump(someArray) {
    var newArray = $.extend(true, {}, someArray);  // clone object
    newArray.tableOpts.container = 'ZAPPED';       // zap the DOM container thingy
    $('#dump').html(tag('pre', JSON.stringify(newArray, null, 4)));
}

function filter(obj, filter) {
    var filtered = {};
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && filter(prop, obj[prop])) {
            filtered[prop] = obj[prop];
        }
    }
    return filtered;
}

// alert(JSON.stringify(filter(opts, function (prop) { return prop !== 'container' }), null, 4));
// alert(
//     JSON.stringify(
//         filter(this, function (prop) {
//             return prop !== 'container';
//         }),
//         null,
//         4
//     )
// );

// sort() function
function by(field, reverse, primer) {
    'use strict';
    var key = primer ?
        function (x) { return primer(x[field]); } :
        function (x) { return x[field]; }
    return function (a, b) {
        var A = key(a), B = key(b);
        return  (A < B ? -1 :
                (A > B ?  1 : 0)) * [1,-1][+!!reverse];
    }
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//
// FIXME: this should enhance HookedArray, adding an additional layer for the
// prototype for its own methods
//

function makeTableArray(opts) {
    var obj;
    if (Object.prototype.toString.call(opts) !== '[object Object]') {
        throw new TypeError('makeTableArray() argument must object with options');
    }
    obj = new HookedArray();   // create object
    obj.tableOpts = {};        // store options
    ['cells', 'titles', 'container'].forEach(function (name) {
        obj.tableOpts[name] = opts[name];
    });
    // methods
    obj.container = function (domObj) { this.tableOpts.container = domObj; };
    obj.cells     = function (list)   { this.tableOpts.cells     = list; };
    obj.titles    = function (obj)    { this.tableOpts.titles    = titles; };
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
        opts.container.html(
            tag('table', title + content)
        );
    };
    obj.partRedraw = function (index, newValues, oldValues) {
        // FIXME: should insert stuff
        var opts  = obj.tableOpts,
            tbody = $(opts.container.children('tbody')),
            trCount = 0, trLast;
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

    // get/set currently selected element
    function focusin(event) {
        var element = $(event.target),
            index   = element.parent().attr('data-index'),
            field   = element.attr('class');
        log('focusin ' + element.parent().prop('tagName') + ' ' + index + '/' + field);
    }
    function focusout() {
        var element = $(event.target);
            index   = element.parent().attr('data-index'),
            field   = element.attr('class');
        log('focusout ' + element.parent().prop('tagName') + ' ' + index + '/' + field);
    }

    function keyup() {
        var element = $(event.target),
            index   = element.parent().attr('data-index'),
            field   = element.attr('class'),
            text    = element.text();

        var x = obj[index];
        x[field] = text;
        obj.set(index, x);

        obj.splice(index, 1, function (old) { old[0][field] = text });

        obj.set(index, function (x) { x[0][field] = text; });

        //obj[index][field] = text;          // FIXME: this should update table (requires HookedArray changes)

        //obj.set(index, obj[index]);
        dump(obj);
    }

    obj.postChange(function (index, newValues, oldValues, calledAs) {
        if (calledAs === 'set') { return; }
        obj.redraw(index, newValues, oldValues, calledAs);
        // var func = (calledAs === 'set') ? 'partRedraw' : 'redraw';
        // obj[func](index, newValues, oldValues, calledAs);
    });

    obj.push(opts.contents || []);  // add content
    obj.redraw();

    opts.container.on('focusin', focusin);
    opts.container.on('focusout', focusout);

    opts.container.on('keyup', keyup);

    return obj;
}



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var thingy = makeTableArray({
        container: $('#table'),
        cells: [ 'tlh', 'pos', 'en' ],
        titles: {
            tlh: 'Klingon',
            pos: '<abbr title="Part-of-Speech">Type</abbr>',
            en:  'English'
        },
        contents: [
            { tlh: 'bach', pos: 'n', en: 'shot' },
        ]
    }
);
thingy.push({ tlh: 'bach', pos: 'v', en: 'shoot' });

thingy.redraw();

//eof
