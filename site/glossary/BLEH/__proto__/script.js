TableArray.prototype = new Array;

// rearrange whole array
TableArray.prototype.sort = function () {            // sort
    var x = Array.prototype.sort.apply(this, arguments);
    this.redraw();
    return x;
};
TableArray.prototype.reverse = function () {         // reverse
    var x = Array.prototype.reverse.apply(this, arguments);
    this.redraw();
    return x;
};

// minor changes
TableArray.prototype.splice = function () {          // splice
    var x = Array.prototype.splice.apply(this, arguments);
    this.redraw();
    return x;
};
TableArray.prototype.pop = function () {             // pop
    var x = Array.prototype.pop.apply(this, arguments);
    this.redraw();
    return x;
};
TableArray.prototype.push = function () {            // push
    var x = Array.prototype.push.apply(this, arguments);
    this.redraw();
    return x;
};
TableArray.prototype.shift = function () {           // shift
    var x = Array.prototype.shift.apply(this, arguments);
    this.redraw();
    return x;
};
TableArray.prototype.unshift = function () {         // unshift
    var x = Array.prototype.unshift.apply(this, arguments);
    this.redraw();
    return x;
};

// HTML updates
TableArray.prototype.redraw = function () {
    var that   = this,
        titles = this.opts.cells.map(function (field) {
            return tag('th', that.opts.titles[field]);
        }),
        content = this.map(function (row, index) {
            return tag('tr', that.opts.cells.map(function (field) {
                return tag('td', row[field], 'contenteditable class=' + field);
            }).join(''), 'data-index=' + index);
        }).join('');
    this.opts.container.html(
        tag('table', tag('tr', titles.join('')) +
            content
        )
    );
};

// create one HTML tag
function tag(tag, content, attr) {
     content = content || '';
     return '<' + tag + (attr ? ' ' + attr : '') + '>' +
         content + '</' + tag + '>';
}

// constructor function
function TableArray(opts) {
    if (Object.prototype.toString.call(opts) !== '[object Object]') {
        throw new TypeError('TableArray() 1st arg must object with opts');
    }
    var contents = opts.contents || [];
    delete opts.contents;
    if (Object.prototype.toString.call(contents) !== '[object Array]') {
        throw new TypeError('TableArray() <contents> must be array');
    }
    contents.opts = opts;        // options in 'opts' property
    contents.__proto__ = TableArray.prototype;
    contents.redraw();
    return contents;
}

/////////////////////////////////////////////////////////////

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

var table = new TableArray({
        container: $('#table'),
        cells: [ 'tlh', 'pos', 'en' ],
        titles: {
            tlh: 'Klingon',
            pos: '<abbr title="Part-of-Speech">Type</abbr>',
            en:  'English'
        },
        contents: [
            { tlh: 'bach', pos: 'n', en: 'shot' }
        ]
    }
);

table.push({ tlh: 'bach', pos: 'v', en: 'shoot' });
table[3] = { tlh: 'bach', pos: 'v', en: 'shoot' };


$('#log').html(
    tag('pre', JSON.stringify(table, null, 4)) +
    tag('p', 'Length: ' + table.length)
);

//eof
