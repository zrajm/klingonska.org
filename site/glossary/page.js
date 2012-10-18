//
// TODO NEXT
// * tablearray.js: Deleting of table rows (backspace/delete)
// * tabs that look okay in older browsers
// * selecting tabs with keyboard (underline letter in tab name used to switch
//   + complete keyboard shortcut name in mouseover text)
//
// FUTURE
//
// * tablearray.js: optimize saving (currently obj.load()/obj.save()
//   saves/loads the *entire* data structure every time user does any kind of
//   change -- will be bad for big amounts of data)
// * Saving should be done with some sort of feedback (i.e. some status thingy
//   changing to 'saved' or somesuch)

// create one HTML tag
function tag(tag, content, attr) {
     content = content || '';
     return '<' + tag + (attr ? ' ' + attr : '') + '>' +
         content + '</' + tag + '>';
}

function log(str) {
    $('#log').append('<br>&gt;' + str);
}

function errorMsg(str) {
    $('#errors').append('<li>' + str + '</li>');
}

function dump(someArray) {
    var newArray = $.extend(true, {}, someArray);  // clone object
    newArray.tableOpts.container = 'ZAPPED';       // zap the DOM container thingy
    $('#dump').html(tag('pre', JSON.stringify(newArray, null, 4)));
}

function current() {
    $('#current').html(Array.prototype.slice.call(arguments, 0).join(' + '));
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

// on document load
$(function () {
    try {
        var thingy = makeTableArray({
                container: $('#table'),
                name: 'thingy',
                cells: [ 'tlh', 'pos', 'en' ],
                titles: {
                    tlh: 'Klingon',
                    pos: '<abbr title="Part-of-Speech">Type</abbr>',
                    en:  'English'
                },
            }
        );
    } catch(error) {
        errorMsg('<b>Fatal Error:</b> ' + error.message);
        throw new Error('Fatal error, execution stopped');
    }

    thingy.redraw();
});

//eof
