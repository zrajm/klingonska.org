/*jslint browser: true, regexp: true, todo: true, devel: true */
/*global $, makeTagged */
/*

  FIXME

  * zaptablerow should save stuff to "Known Words"
  * In '# different' word count we should disregard complex words like
    "Hej(v)-wI'(vs9n)" that are in the dictionary, and instead only count the
    base "Hej(v)" word. Processing ("Hejlu' HejwI' Hej" gives, "3 words (2
    different)", but should actually be "3 words (1 different)".)

  * Create FSM from dictionary.
    * should prolly not use numbers from dictionary (since those are defined in
      program itself)
    * avoid duplicated words from dictionary (e.g. bachwI' is both in dict and
      can be derived from rules)
  * result of {maH} looks bad

TEST CASES
==========
  * paghlogh / Hochlogh / paghDIch / HochDIch
  * wa'Hu' .. wa'maHHu' (for number not in dictionary)
  * cha'leS .. HutleS (for number not in dictionary)
  * test on lots of canon text

TODO
====
  * handle {-oy} when there is no glottal stop insertion before it
  * Text and glossary list should have a line where the number of words, verbs,
    nouns etc are listed.
  * Hovering over syllable in text should display the root word
    interpretations.
  * Color marking should be according to the part-of-speech of the *whole*
    word, while extracted glossary should be the root word (e.g. {ngotlhwI'}
    should be color marked as a noun, but included in the glossary should be
    {ngotlh} "be fanatical").
  * Explanatory words under input field should be clickable (and enable/disable
    highlight of their respective categories)
  * User should be able to select interpretations by clicking on words in input
    field (to clear up ambiguous words).

  * Hover over word in table should highlight all occurances of word in input
    field.
  * Hover over word in cheat-sheet should highlight word in input field.

  MEBBE LATER
  * Add affixes to glossary.

 */

// glossary = makeGlossary([ entries ]);
//
// glossary.add(entries);     // chainable
// glossary.remove(entries);  // chainable
// glossary.get(entries);
//
// Where <entry> is a dictionary entry.
//
// FIXME: What should happen when trying to add an entry that does not exist in
// dictionary? (this can never happen since words that aren't in the dictionary
// and will never be matched out in the parsing process, but in the future we
// should support any Klingon phonotax words, like {Qov}, and ungrammaticals
// like {Hejna'} eventually)

function makeGlossary(entries) {
    'use strict';
    var glossary = {}, counter = {};
    function numeric(a, b) { return a - b; }
    function each(entries, callback) {
        if (!entries) { return; }
        if (!(entries instanceof Array)) {
            throw new TypeError('argument must be array')
        }
        entries.forEach(function (entry) {
            if (entry.num === undefined) {
                throw new TypeError('dictionary entry is missing "num" ' +
                    'property\n' + JSON.stringify(entry, null, 4));
            }
            callback(entry);
        });
    }
    function get() {
        // return glossary sorted in dictionary order
        return Object.keys(glossary).sort(numeric).map(function (num) {
            return glossary[num];
        });
    }
    function length() { return Object.keys(glossary).length; }
    function count(entry) { return counter[entry.num] || 0; }
    function add(entries) {   // chainable
        each(entries, function (entry) {
            if (entry.count) {
                counter[entry.num] = entry.count;
                delete entry.count;
            } else {
                if (counter[entry.num]) {
                    counter[entry.num] += 1;
                } else {
                    counter[entry.num] = 1;
                }
            }
            glossary[entry.num] = entry;
        });
        return this;
    }
    function clear(entries) {   // chainable
        counter = {};
        glossary = {};
        return this;
    }
    function load(name) {
        this.clear().add(JSON.parse(localStorage.getItem(name)));
        return this;
    }
    function save(name) {
        var that = this;
        var state = this.get().map(function (entry) {
            entry.count = that.count(entry);
            return entry;
        });
        localStorage.setItem(name, JSON.stringify(state));
        return this;
    }
    function remove(entries) { // chainable
        each(entries, function (entry) {
            delete glossary[entry.num];
            delete counter[entry.num];
        });
        return this;
    }
    if (entries) { add(entries); }
    return {
        add:    add,
        clear:  clear,
        count:  count,
        get:    get,
        length: length,
        load:   load,
        remove: remove,
        save:   save
    };
}

var analyze = (function () {
    'use strict';

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

    function analyze(html, rules, dict) {
        var glossary = makeGlossary(),
            tokens   = tokenizeAndParse(html, rules),
            words    = tokens.filter(function (token) {
                return (token.parts ? true : false);
            });

        // go through processed tokens, generate glossary
        //glossary.clear();
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
        return [words.length, tokens, glossary];
    }

    return analyze;
}());

//eof
