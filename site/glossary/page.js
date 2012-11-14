/*jslint todo: true */
/*global $, makeTagged, makeGlossary, makeDictionary, makeRules */

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
    var analyze, tlhSortkey = (function () {
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

    // go through processed tokens, generate HTML output
    function highlightedUserInput(tokens) {
        return tokens.map(function (obj) {
            var title;
            if (!obj.parts) { return obj.text; }     // space and/or punctuation
            title = obj.parts.map(function (part) {  // word
                return part.parts.map(function (part) {
                    return part.text + '(' + part.pos + ')';
                }).join('&ndash;');
            });
            // FIXME: write this using tag()
            return '<span class="' + obj.getTags().join(' ') + '" title="' +
                'Part of Speech: ' + (obj.getTags().join(', ') || 'N/A') + '\n' +
                'Breakdown:\n    ' + (title.join('\n    ') || 'N/A') + '\n' +
                JSON.stringify(obj, null, 4).replace(/\"/g, '&quot;') + '">' +
                '<span>' + obj.getText() + '</span></span>';
        }).join('');
    }

    function generateGlossaryTable(glossary, crossedOutGlossary) {
        /*jslint white: true */
        var tbody = [],
            entries = glossary.get(),
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
                tag('th', 'English',          // English
                    'lang=en') +
                tag('th', 'Svenska',          // Swedish
                    'lang=sv')
            );
        /*jslint white: false */
        if (entries.length === 0) {
            return tag('table', tag('tbody', tag('tr', tag('td',
                tag('span', 'There is nothing to see here (yet).', 'lang=en') +
                tag('span', 'Det finns inget att visa här (än).', 'lang=sv')))));
        }
        tbody = entries.map(function (entry) {
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
                tag('td', en,                      // English
                    'lang=en sorttable_customkey="' +
                    entry.en.replace(/[«»<>]/g, '').toLowerCase() + '"') +
                tag('td', sv,                     // Swedish
                    'lang=sv sorttable_customkey="' +
                    entry.sv.replace(/[«»<>]/g, '').toLowerCase() + '"'),
                   'class="' + pos + (crossedOutGlossary &&
                       crossedOutGlossary.has(entry.num) ? ' known' : '') +
                   '" data-num=' + entry.num);
        });
        return tag('table',
                tag('thead', thead) + tag('tbody', tbody.join('')),
               'class=sortable'
            ) +
            tag('script', '', 'src="../includes/sorttable.js"');
    }

    analyze = (function () {
        function analyzeSpace(text) {
            if (text.match(/[.!?]/)) {             // full stop
                return 'sf';                       //   separator, full stop
            }
            if (text.match(/[,;:()]/)) {           // half stop
                return 'sh';                       //   separator, half stop
            }                                      // space
            return 'ss';                           //   separator, space
        }

        function tokenizeAndParse(html, rules) {
            // split text into tokens
            var result = [],
                tokens = html.split(/(<[^>]*>|&[^;]{1,10};|[^&<a-z\'\u2018\u2019]+)/i);
            // NOTE: That we're *not* matching the words themselves above, since
            // anything we're splitting and anything neither matching an HTML tag,
            // nor an HTML entity nor whitespace will be a proper word, these words
            // will be given to us as being in between the other strings. Adding a
            // word matching expression would only increase the number of empty
            // elements in the resulting list.
            tokens.forEach(function (token) {
                if (token !== '') {                        // if non-empty token
                    if (token.match(/^[a-z\'\u2018\u2019]/i)) { // word
                        result.push(makeTagged.word(token, rules));
                    } else if (token[0] === '&') {         // HTML entity
                        result.push(makeTagged.string(token));
                    } else if (token[0] === '<') {         // HTML element
                        if (!token.match(/^<\/?span\b/)) { //   keep all but <span>
                            result.push(makeTagged.string(token));
                        }
                    } else {                               // punctuation
                        result.push(makeTagged.string(token, [ analyzeSpace(token) ]));
                    }
                }
            });
            return result;
        }

        return function (html, rules, dict) {
            var glossary = makeGlossary(),
                tokens   = tokenizeAndParse(html, rules),
                words    = tokens.filter(function (token) {
                    return (token.parts ? true : false);
                });

            // go through processed tokens, generate glossary
            glossary.clear();
            words.forEach(function (word) {
                var hasGottenType = {};
                word.parts.forEach(function (part) {
                    var type = part.root.pos, root = part.root.text;
                    // FIXME: this shouldn't be needed, but 'num1' occuring by
                    // themself (e.g. {maH}) cause this.
                    if (type === undefined || root === undefined) { return; }

                    // FIXME: do only once for each word type
                    // (this shouldn't be needed, but words like {maH}
                    // sometimes appear twice with same word type)
                    if (!hasGottenType[type]) {
                        hasGottenType[type] = true;
                        glossary.add(dict.query({ tlh: root, pos: type }));
                    }
                });
            });
            glossary.save('glossary');
            return [tokens, glossary];
        };
    }());

    /*************************************************************************\
    **                                                                       **
    **  On Document Load                                                     **
    **                                                                       **
    \*************************************************************************/
    $(function () {
        var rules, tokens = [],
            glossary = makeGlossary().load('glossary'),
            known    = makeGlossary().load('known'),
            outputElement = $('.glossary div.output'),
            inputElement  = $('.extract  div.input'),
            knownElement  = $('.known    div.output'),
            extractButtonElement = $('button.extract'),
            inputText = localStorage.getItem('current-klingon-text') || '',
            dict = makeDictionary('../dict/dict.zdb', function (dict) {
                rules = makeRules(dict);
                tmpStatus('<a href="../dict/dict.zdb">Dictionary</a> loaded.');
            });

        // on page tab click
        $('#tab-row .glossary').on('click', function () {
            outputElement.empty().html(generateGlossaryTable(glossary, known));
        });
        $('#tab-row .known').on('click', function () {
            knownElement.empty().html(generateGlossaryTable(known));
        });
        $('#tab-row .extract').on('click', function () {
            inputElement.html(inputText);

            var count = 0;
            inputText.replace(/<span /g, function () { count += 1; });

            // update word counters on page
            $('.wordcount').html(count);
            $('.uniqcount').html(glossary.length());
        });

        if (glossary.length() > 0) {
            outputElement.empty().html(generateGlossaryTable(glossary, known));
            outputElement.on('click', function (event) {
                var elem = $(event.target).closest('tr[data-num]'),
                    num  = elem.data('num');
                if (num !== undefined) {       // do stuff
                    if (elem.hasClass('known')) {// make word unknown
                        known.remove(dict.query({ num: num })).save('known');
                        elem.removeClass('known');
                    } else {                   //   make word known
                        known.add(dict.query({ num: num })).save('known');
                        elem.addClass('known');
                    }
                    knownElement.empty().html(generateGlossaryTable(known));
                }
            });
        }

        inputElement.focus();
        function clearButton() {               // clear text area
            inputElement.empty();
            extractButtonElement.trigger('click');
        }
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
            extractButtonElement.trigger('click');
        }
        function extractButton() {
            var html      = inputElement.html(),
                result    = analyze(html, rules, dict);
            glossary  = result[1];
            tokens = result[0];
            inputText = highlightedUserInput(tokens);

            // // update word counters on page
            // $('.wordcount').html(wordCount);
            // $('.uniqcount').html(glossary.length());

            $('#tab-row .extract').trigger('click'); // refresh this tab
        }

        extractButtonElement.click(extractButton);
        $('button.clear').click(clearButton);
        $('button.test').click(testButton);


        // Watcher for the Klingon input field. The watcher will start up
        // whenever user inputs anything in this field, and then run in
        // background, doing autosave every 2 seconds. If nothing has changed
        // since last invocation the watcher will silently kill itself. (Only
        // to be autospawned should the user start inputting again.)
        (function () {
            var watcher, saved = true, events = 'input DOMNodeInserted ' +
                'DOMNodeRemoved DOMCharacterDataModified';
            inputElement.on(events, function () {
                if (watcher) { return; }
                saved = false;
                watcher = setInterval(function () {
                    if (saved === false) {
                        localStorage.setItem(
                            'current-klingon-text',
                            inputElement.html()
                        );
                        tmpStatus('Saved.');
                        saved = true;
                    } else {
                        clearTimeout(watcher);
                        watcher = undefined;
                    }
                }, 2000);
            });
        }());
    });

}());

//eof
