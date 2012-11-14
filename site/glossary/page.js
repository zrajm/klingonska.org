/*jslint todo: true */
/*global $, makeTableArray, makeDictionary, makeRules, analyze */

var statusTimer;
function tmpStatus(msg) {
    'use strict';
    var statusElement = $('.status');
    clearTimeout(statusTimer);
    statusElement.html(msg);
    statusTimer = setTimeout(function () {
        statusElement.html('');
    }, 1500);
}

function status(msg) {
    'use strict';
    clearTimeout(statusTimer);
    $('.status').html(msg);
}

function log(str) {
    'use strict';
    $('#log').append('<br>&gt;' + str);
}

function errorMsg(str) {
    'use strict';
    $('#errors').append('<li>' + str + '</li>');
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

(function () {
    'use strict';
    var tlhSortkey = (function () {
        /*jslint white: true */
        var transl = {
            "a"  : "a",   "b" : "b",   "ch": "c",   "D" : "d",   "e" : "e",
            "gh" : "f",   "H" : "g",   "I" : "h",   "j" : "i",   "l" : "j",
            "m"  : "k",   "n" : "l",   "ng": "m",   "o" : "n",   "p" : "o",
            "q"  : "p",   "Q" : "q",   "r" : "r",   "S" : "s",   "t" : "t",
            "tlh": "u",   "u" : "v",   "v" : "w",   "w" : "x",   "y" : "y",
            "'"  : "z",   "‘" : "z",   "’" : "z",
            "0"  : "0",   "1" : "1",   "2" : "2",   "3" : "3",   "4" : "4",
            "5"  : "5",   "6" : "6",   "7" : "7",   "8" : "8",   "9" : "9"
        };
        /*jslint white: false */
        // split a Klingon word into characters (doesn't cope with puncuation)
        function splitCharacter(word) {
            return word.split(/(?=[abDeHIjmnopqQrStuvwy\'‘’]|[cg]h|ng|tlh|l(?!h))/);
        }
        return function (word) {
            var tlh = (word.match(/\{(.*?)\}/)     || [0, ''])[1],
                hyp = (word.match(/^\[(\d+)/)      || [0,  0])[1],
                sub = (word.match(/\}\s*\[(\d+)/)  || [0,  0])[1],
                subsub = (word.match(/\.(\d+)\]$/) || [0,  0])[1];
            // zero pad pre-word, post-word & post-word sub-counter
            if (hyp < 10) { hyp = '0' + hyp; }
            if (sub < 10) { sub = '0' + sub; }
            if (subsub < 10) { subsub = '0' + subsub; }
            return splitCharacter(tlh).map(function (character) {
                return transl[character] || '';
            }).join('') + '-' + [hyp, sub, subsub].join('-');
        };
    }());

    // create one HTML tag
    function tag(name, content, attr) {
        content = content || '';
        return '<' + name + (attr ? ' ' + attr : '') + '>' +
            content + '</' + name + '>';
    }

    // sorting function, use `array.sort(byKlingon)` to sort in Klingon
    // alphabetical order
    function byKlingon(a, b) {
        var x = tlhSortkey(a), y = tlhSortkey(b);
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
    }

    // go through processed tokens, generate HTML output
    function highlightedUserInput(tokens) {
        return tokens.map(function (obj) {
            var title;
            if (!obj.parts) { return obj.text; }     // space and/or punctuation
            // alert(JSON.stringify(obj, null, 2));
            title = obj.parts.map(function (part) {  // word
                return part.parts.map(function (part) {
                    return part.text + '(' + part.pos + ')';
                }).join('&ndash;');
            });
            //return '<span class="' + obj.getTags().join(' ') + '" title="' + title + '">' +
            return '<span class="' + obj.getTags().join(' ') + '" title="' +
                'Part of Speech: ' + (obj.getTags().join(', ') || 'N/A') + '\n' +
                'Breakdown:\n    ' + (title.join('\n    ') || 'N/A') + '\n' +
                JSON.stringify(obj, null, 4).replace(/\"/g, '&quot;') + '">' +
                '<span>' + obj.getText() + '</span></span>';
        }).join('');
    }

    function generateGlossaryTable(glossary) {
        /*jslint white: true */
        var tbody = [],
            posAbbrev = {
                "adverbial"              : "adv",  "conjunction"        : "conj",
                "exclamation"            : "excl", "name"               : "name",
                "noun"                   : "n",    "noun suffix type 1" : "ns1",
                "noun suffix type 2"     : "ns2",  "noun suffix type 3" : "ns3",
                "noun suffix type 4"     : "ns4",  "noun suffix type 5" : "ns5",
                "numeral"                : "num",  "pronoun"            : "pro",
                "question word"          : "ques", "verb"               : "v",
                "verb prefix"            : "vp",   "verb suffix type 1" : "vs1",
                "verb suffix type 2"     : "vs2",  "verb suffix type 3" : "vs3",
                "verb suffix type 4"     : "vs4",  "verb suffix type 5" : "vs5",
                "verb suffix type 6"     : "vs6",  "verb suffix type 7" : "vs7",
                "verb suffix type 8"     : "vs8",  "verb suffix type 9" : "vs9",
                "verb suffix type rover" : "vsr"
            },
            repl = {
                '«': {
                    en: '<u class=noncanon title="Headword: Not found as headword in canon.">',
                    sv: '<u class=noncanon title="Uppslagsord: Används inte som uppslagsord i kanon.">'
                },
                '»': { en: '</u>', sv: '</u>' },
                '<': {
                    en: '<u class=canon title="Headword: Found as headword in kanon.">',
                    sv: '<u class=noncanon title="Uppslagsord: Används som uppslagsord i kanon.">'
                },
                '>': { en: '</u>', sv: '</u>' }
            },
            thead = tag('tr',
                tag('th', '') +                // count
                tag('th',                      // Klingon
                    tag('span', 'Klingon',    'lang=en') +
                    tag('span', 'Klingonska', 'lang=sv')) +
                tag('th',                      // Word Type
                    tag('span', 'Type',  'lang=en') +
                    tag('span', 'Klass', 'lang=sv')) +
                tag('th', 'English' +          // English
                    tag('span', '↶', 'class=unzap title="Undo word remove."'),
                    'lang=en') +
                tag('th', 'Svenska' +          // Swedish
                    tag('span', '↶', 'class=unzap title="Ångra ordborttagning."'),
                    'lang=sv')
            );
        /*jslint white: false */
        tbody = glossary.get().map(function (entry) {
            /*jslint unparam: true */
            var pos = posAbbrev[entry.pos] || 'Huh?',
                tlh = entry.tlh.replace(/\{(.*)\}/, function (a, b) {
                    return tag('b', b.replace(/[\'‘’]/g, '’'),
                        'lang=tlh');
                }),
                en = entry.en.replace(/[«»<>]/g, function (a) { return repl[a].en; }),
                sv = entry.sv.replace(/[«»]/g,   function (a) { return repl[a].sv; }),
                count = glossary.count(entry);
            /*jslint unparam: false */
            return tag('tr',
                tag('td', count, 'class=count') + // Count
                tag('td', tlh,                    // Klingon
                    'sorttable_customkey="' +
                    tlhSortkey(entry.tlh) + '"') +
                tag('td', pos, 'class=pos') +     // Type
                tag('td',                         // English
                    tag('span', '×',
                        'class=zap title="Remove this word."') +
                    en,
                    'lang=en sorttable_customkey="' +
                    entry.en.replace(/[«»<>]/g, '').toLowerCase() + '"') +
                tag('td',                         // Swedish
                    tag('span', '×',
                        'class=zap title="Remove this word."') +
                    sv,
                    'lang=sv sorttable_customkey="' +
                    entry.sv.replace(/[«»<>]/g, '').toLowerCase() + '"'),
                'class=' + pos);
        });
        return tag('table',
                tag('thead', thead) + tag('tbody', tbody.join('')),
               'class=sortable'
            ) +
            tag('script', '', 'src="../includes/sorttable.js"') +
            tag('script', '', 'src="zaptablerow.js"');
    }

    // on document load
    $(function () {
        var knownWords, rules,
            glossary = makeGlossary().load('glossary'),
            outputElement = $('.glossary .output'),
            inputElement  = $('.extract .input'),
            dict = makeDictionary('../dict/dict.zdb', function (dict) {
                rules = makeRules(dict);
                tmpStatus('<a href="../dict/dict.zdb">Dictionary</a> loaded.');
            });
        if (glossary.length() > 0) {
            outputElement.html(generateGlossaryTable(glossary));
        }

        (function () {
            var html = localStorage.getItem('current-klingon-text');
            if (html !== null) {
                inputElement.html(html);
            }
        }());
        inputElement.focus();
        function clearButton() { inputElement.text(''); }  // clear text area
        function testButton() {
            inputElement.text("ghIq ngotlhwI' yIqel. (maw'be'; Hov leng " +
                "tIvqu' neH). roD DujHeyDaq yo'HeyDaq ghap ghom. patlh ghaj " +
                "yaSDaj, 'ej batlh cha'maHlogh Qapchugh lunumlu'. tlhIngan " +
                "nugh, tIgh je neH qel jeSwI'pu'vam. tlhIngan Hol qelchugh, " +
                "Holna' 'oHbe'. bachbe'bogh nISwI' HIchHey rur. nISwI' " +
                "lo'DI' bach 'e' lupIHbe'; Hol lo'DI' Qum 'e' lupIHbe' je. " +
                "Quj tIvbej ghommeyvam, 'ach tlhIngan Hol Dun tIvbe'bej. " +
                "Hol lughojmo' pop yajchu' jatlhwI' tlhInganmeyHeywI'Daq " +
                "ghIpDIjtaHDI' bIHe'So' HInughI'chu'!");
        }
        function extractButton() {
            var html      = inputElement.html(),
                result    = analyze(html, rules, dict),
                wordCount = result[0],
                tokens    = result[1],
                glossary  = result[2];

            // update word counters on page
            $('.wordcount').html(wordCount);
            $('.uniqcount').html(glossary.length());

            // color mark text in input field
            inputElement.html(highlightedUserInput(tokens));
            // output glossary table
            outputElement.html(generateGlossaryTable(glossary));
        }

        $('button.extract').click(extractButton);
        $('button.clear').click(clearButton);
        $('button.test').click(testButton);

        // Watcher for the Klingon input field. The watcher will start up
        // whenever user inputs anything in this field, and then run in
        // background, doing autosave every 2 seconds. If nothing has changed
        // since last invocation the watcher will silently kill itself. (Only
        // to be autospawned should the user start inputting again.)
        (function () {
            var watcher, saved = true, count = 1;
            inputElement.on('input DOMNodeInserted DOMNodeRemoved DOMCharacterDataModified', function () {
                if (watcher) { return; }
                saved = false;
                watcher = setInterval(function () {
                    if (saved === false) {
                        localStorage.setItem(
                            'current-klingon-text',
                            inputElement.html());
                        tmpStatus('Saved.');
                        saved = true;
                    } else {
                        clearTimeout(watcher);
                        watcher = undefined;
                    }
                }, 2000);
            });
        }());


        try {
            knownWords = makeTableArray({
                container: $('section.known table'),
                name: 'known',
                cells: [ 'tlh', 'pos', 'en' ],
                titles: {
                    tlh: 'Klingon',
                    pos: 'Type',
                    en:  'English'
                }
            });
        } catch (error) {
            errorMsg('<b>Fatal Error:</b> ' + error.message);
            throw new Error('Fatal error, execution stopped');
        }
    });

}());

//eof
