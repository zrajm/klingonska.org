/* jslint vars: true */
/*global $, Blob, FileReader, clearTimeout, document, history, localStorage,
  location, setTimeout, sorttable, window */

(function (window, document) {
    'use strict';

    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: globals */

    // Return a HTML tag.
    //
    // If content is a string (even an empty one) will result in both start and
    // end tags (e.g. `tag('X', '')` = `<X></X>`), if content is null (or
    // undefined) an empty tag is produced (e.g. `tag('X')` = `<X>`).
    function tag(name, content, attr) {
        if (typeof content === 'number') { content = content.toString(); }
        return '<' + name + (attr ? ' ' + attr : '') + '>' +
            (typeof content === 'string' ? (content + '</' + name + '>') : '');
    }


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: compatibility */

    /*****************************************************************************\
    **                                                                           **
    ** ECMAScript 5 Compatibility Functions for Older Browsers                   **
    **                                                                           **
    \*****************************************************************************/
    (function () {
        // Add Object.create()
        if (typeof Object.create !== 'function') {
            Object.create = function (o) {
                function F() {}
                F.prototype = o;
                return new F();
            };
        }
        // Add Object.keys()
        if (!Object.keys) {
            Object.keys = (function () {
                var hasOwnProperty = Object.prototype.hasOwnProperty,
                    hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
                    dontEnums = [
                        'toString',
                        'toLocaleString',
                        'valueOf',
                        'hasOwnProperty',
                        'isPrototypeOf',
                        'propertyIsEnumerable',
                        'constructor'
                    ],
                    dontEnumsLength = dontEnums.length;
                return function (obj) {
                    var result = [], prop, i;
                    if ((typeof obj !== 'object' && typeof obj !== 'function') || obj === null) {
                        throw new TypeError('Object.keys called on non-object');
                    }
                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            result.push(prop);
                        }
                    }
                    if (hasDontEnumBug) {
                        for (i = 0; i < dontEnumsLength; i += 1) {
                            if (hasOwnProperty.call(obj, dontEnums[i])) {
                                result.push(dontEnums[i]);
                            }
                        }
                    }
                    return result;
                };
            }());
        }
    }());


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: makeinputtext */

    // This keeps track of a text input field, and store whatever is written there
    // in a text string. It autosaves changes to localStorage (so that you will
    // never lose data).
    //
    // makeInputText({ opt: value ... });
    //
    // Options are:
    //   o 'name' -- Name to use for localStorage.
    //   o 'saveDelay' -- How long (in milliseconds) to wait until saving after
    //     user have stopped typing. Text is always saved immediately if textarea
    //     loses focus. While user is typing 'statusElement' will receive class
    //     'typing' (when typing stops this class will be removed again).
    //   o 'msgDelay' -- Time (in milliseconds) to give the status element the
    //     class 'saved', after typing has stopped.
    //   o 'inputElement' -- HTML element which content will be used as input.
    //   o 'lengthElement' -- HTML element to which updates of the 'length'
    //     property will be written.
    //   o 'statusElement' -- HTML element which will receive 'typing' and 'saved'
    //     classes when user is typing, or text has been saved.
    //
    // Methods are:
    //
    //   o '.save()' -- Saved the current object to localStorage.
    //   o '.load()' -- Loads object from localStorage (losing current values).
    //   o '.set(TEXT[, LENGTH])' -- Set object. TEXT may be any HTML string (not
    //     just plain text). The LENGTH value is only stored (never recalculated by
    //     makeInputText() itself), any number may be stored here (and will be
    //     loaded/saved together with TEXT).
    //   o '.redraw()' -- You should never need to call this explicitly, but it
    //     redraws the HTML elements with the current TEXT and LENGTH values.
    //
    // Properties are
    //
    //   o '.text' -- The text.
    //   o '.length' -- The length.
    //
    //     These values should not be set directly, but with the '.set()' method.
    //     If you set them directly you bypass the redrawing of the corresponding
    //     HTML elements.
    //
    function makeInputText(options) {
        var object = {}, typingTimer,
            events = 'input DOMNodeInserted DOMNodeRemoved DOMCharacterDataModified';

        // Refresh internal value with current value from HTML element.
        function readInput() {
            object.text = options.inputElement.html();
            if (typingTimer) {
                clearTimeout(typingTimer);
            } else {
                options.statusElement.addClass('typing');
            }
            typingTimer = setTimeout(object.save, options.saveDelay);
        }

        // Redraw HTML element with current value.
        function makeInputText_redraw() {
            options.inputElement.off(events);
            options.inputElement.html(object.text);
            options.lengthElement.html(object.length);
            options.inputElement.on(events, readInput);
            return object;
        }
        object.redraw = makeInputText_redraw;

        // Read input text values (return empty values if reading failed).
        function makeInputText_load() {
            var stored;
            try {
                stored = JSON.parse(localStorage.getItem(options.name));
                if (Object.keys(stored).length === 2 &&
                        typeof stored.text   === 'string' &&
                        typeof stored.length === 'number') {
                    object.length = stored.length;
                    object.text   = stored.text;
                }
            } catch (error) {
                object.length = 0;
                object.text   = '';
            }
            return object.redraw();
        }
        object.load = makeInputText_load;

        function makeInputText_save() {
            if (options.name) {
                localStorage.setItem(options.name, JSON.stringify({
                    length: object.length,
                    text:   object.text
                }));
            }
            if (typingTimer) {
                typingTimer = undefined;
                options.statusElement.removeClass('typing');
            }
            options.statusElement.addClass('saved');
            setTimeout(function () {
                options.statusElement.removeClass('saved');
            }, options.msgDelay);
            return object;
        }
        object.save = makeInputText_save;

        function makeInputText_set(text, length) {
            if (typeof length === 'number') { object.length = length; }
            if (typeof text   === 'string') { object.text   = text; }
            return object.redraw();
        }
        object.set = makeInputText_set;

        // save immediately on blur
        options.inputElement.on('focusout', function () {
            if (typingTimer) { object.save(); }
        });

        return object.load();
    }


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: makestore */

    function makeStore(storageName) {
        var proto = makeStore.proto;
        if (!proto) {
            proto = makeStore.proto = {
                load: function () {
                    var data, prop;
                    // FIXME: better way of handling error?

                    // load from localStorage
                    if (typeof storageName !== 'string') { return this; }
                    data = JSON.parse(localStorage.getItem(storageName));
                    if (typeof data !== 'object') { return this; }

                    // copy read properties into `this`
                    for (prop in data) {
                        if (data.hasOwnProperty(prop)) {
                            this[prop] = data[prop];
                        }
                    }
                    // remove properties not in read data from `this`
                    for (prop in this) {
                        if (this.hasOwnProperty(prop)) {
                            if (!data[prop]) { delete this[prop]; }
                        }
                    }
                    return this;
                },
                save: function () {
                    // FIXME: better way of handling error?
                    if (storageName) {
                        localStorage.setItem(storageName, JSON.stringify(this));
                    }
                    return this;
                },
                set: function (name, prop, value) {
                    if (!this[name]) { this[name] = {}; }
                    if (this[name][prop] !== value) {
                        this[name][prop] = value;
                        this.save();
                    }
                    return this;
                },
                get: function (name, prop) {
                    return this[name] ? this[name][prop] : undefined;
                },
                keys: function () {
                    return Object.keys(this);
                }
            };
        }
        return Object.create(proto).load();
    }


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: maketagged */

    /*****************************************************************************\
    **                                                                           **
    ** TaggedString Maker                                                        **
    **                                                                           **
    \*****************************************************************************/
    // Object Anatomy
    // --------------
    // taggedString = {
    //     text: "Da",            // text
    //     tags: [ "vp", "v" ],   // part-of-speech
    // }
    //
    // 'text' may contain any string (default: ""). 'tags' may contain any number
    // of (being true, or unset). Tags are get/set using array arguments, but only
    // non-existing tags are added (meaning that all tags occur only once).
    //
    // Get Methods
    // -----------
    // obj.getText();
    // obj.getTags() === [ "v", "n" ];   // return all 'tags'
    // obj.getTag(["v", "n"]) === ["n"]; // return all mentioned 'tags'
    // obj.getTag(["v", "n"]) === [];
    // obj.hasTag(["v"]) === true;       // true if any of mentioned 'tags' exist
    // obj.hasTag(["v", "n"]) === true;
    //
    // Set Methods
    // -----------
    // obj.setText("osuchroe") === "socuhoe"
    // obj.setTags([]) === [];
    // obj.setTags(["v"]) === [ "v" ];
    // obj.setTags(["v", "n"]) === [ "v", "n" ];


    /*****************************************************************************\
    **                                                                           **
    ** TaggedWord Maker                                                          **
    **                                                                           **
    \*****************************************************************************/
    // Object Anatomy
    // --------------
    // taggedWord = {
    //   "text": "pIqaD",               // unparsed text (original token)
    //   "syllables": [ "pI", "qaD" ],  // text split into syllables
    //   "tags": [ "v", "n" ],          // possible part-of-speech for whole
    //   "parts": [{                    // 1st interpretation ({qaD} = verb)
    //       "root": {
    //         "pos": "v",
    //         "text": "qaD"
    //       },
    //       "parts": [{
    //           "text": "pI",
    //           "pos": "vp"
    //         }, {
    //           "text": "qaD",
    //           "pos": "v"
    //       }]
    //     }, {                         // 2nd interpretation ({pIqaD} = noun)
    //       "root": {
    //         "pos": "n",
    //         "text": "pIqaD"
    //       },
    //       "parts": [{
    //           "pos": "n",
    //           "text": "pIqaD"
    //       }]
    //     }
    //   ],
    //   "roots": {
    //     "qaD"  : [ "v" ],
    //     "pIqaD": [ "n" ]
    //   }
    // }
    //
    // Get Methods
    // -----------
    // All get methods are inherited from taggedString.
    //
    // Set Methods
    // -----------
    // Sets string & recomputes tags.
    //
    // taggedWord.setText() -- analyzes and sets the 'syllables' part of the object.
    //
    // taggedWord.setTags() is inherited from taggedString.

    var makeTagged = (function () {
            /*jslint white: true */
            var taggedStringPrototype, taggedWordPrototype,
                isRoot = {
                    'adv'  : true,  'conj' : true,  'excl' : true,  'n'    : true,
                    'name' : true,  'num'  : true,  'pro'  : true,  'ques' : true,
                    'v'    : true,
                    // empty pos = nonfinal syllable of multisyllable word
                    '': true
                },
                isPos = {
                    'adv' : 'adv',   'advs': 'adv',   'conj': 'conj',  'excl': 'excl',
                    'name': 'name',  'n'   : 'n',     'ns1' : 'n',     'ns2' : 'n',
                    'ns3' : 'n',     'ns4' : 'n',     'ns5' : 'n',     'num' : 'num',
                    'num1': 'num',   'num2': 'num',   'pro' : 'pro',   'ques': 'ques',
                    'v'   : 'v',     'vs1' : 'v',     'vs2' : 'v',     'vs3' : 'v',
                    'vs4' : 'v',     'vs5' : 'v',     'vs6' : 'v',     'vs7' : 'v',
                    'vs8' : 'v',     'vs9' : 'v',     'vs9n': 'n',     'vsr' : 'v',
                    'num2n':'n'
                };
            /*jslint white: false */

            // split a Klingon word into syllables
            function splitSyllable(word) {
                var type = Object.prototype.toString.call(word).slice(8, -1);
                if (type !== "String") {
                    throw new TypeError("Function splitSyllable must be called " +
                        "on string (not " + type.toLowerCase() + ")");
                }
                return word.split(/(?=(?:[bDHjlmnpqQrStvwy\']|ch|gh|ng|tlh)[aeIou])/);
            }

            taggedStringPrototype = {
                getText: function () { return this.text; },
                setText: function (text, tags) {
                    if (text === this.text) { return this; }
                    this.text = text;
                    this.setTags(tags || []);
                    return this;
                },
                addTag: function (tags) {
                    if (Object.prototype.toString.call(tags) !== '[object Array]') {
                        throw new TypeError("Argument must be array");
                    }
                    var tagProp = this.tags;
                    tags.forEach(function (text) {
                        if (tagProp.indexOf(text) === -1) { tagProp.push(text); }
                    });
                    return this;
                },
                getTags: function (tags) {
                    var that = this;
                    if (tags === undefined) { return that.tags; }
                    if (Object.prototype.toString.call(tags) !== '[object Array]') {
                        throw new TypeError("Argument must be array");
                    }
                    return tags.filter(function (tag) {
                        return (that.tags.indexOf(tag) >= 0);
                    });
                },
                hasTag: function (tags) {
                    if (Object.prototype.toString.call(tags) !== '[object Array]') {
                        throw new TypeError("Argument must be array");
                    }
                    var that = this;
                    return tags.some(function (tag) {
                        return (that.tags.indexOf(tag) >= 0);
                    });
                },
                setTags: function (tags) {
                    this.tags = [];
                    return this.addTag(tags);
                }
            };
            taggedWordPrototype = Object.create(taggedStringPrototype);
            (function (that) { //... }(taggedWordPrototype));
                // Usage: analyzeWord2(syllables, rules, {});
                //
                // This function is called by analyzeWord() and should not be invoked
                // directly.
                //
                // 'syllables' argument is an array containing a Klingon word split by
                // syllables.
                //
                // 'rules' argument is a (slightly Finite-State Machine--like) rule
                // structure used to process and determine the part-of-speech (or word
                // class) of the word, which uses the following format:
                //
                //     rules = {
                //         "bach": [{ tag: 'n',  rules: nsRules }],
                //         "batlh": [
                //             { tag: 'adv' },
                //             { tag: 'n', rules: nsRules }
                //         ],
                //         //...
                //         "ghIp": [{
                //             rules: {
                //                 "DIj": { tag: 'v', rules: vsRules }
                //             }
                //         }],
                //         //...
                //     }
                //
                // Last argument is an accumulator (used internally as the function
                // calls itself recursively), when called initially this argument
                // should always be an empty object (i.e. '{}'). The base case returns
                // whatever has been accumulated in this argument (as is the convention
                // when using an accumulator in a recursive call).
                //
                // Return one word interpretation object, or null if analysis failed. A
                // word interpretation object look like this:
                //
                //     word = {
                //         root: {                // root word
                //             pos: 'n',          //   part-of-speech of root
                //             text: "tlhIngan",  //   text of root word
                //         },
                //         parts: [{              // whole word, in parts
                //             pos: 'n',          //   part-of-speech of root
                //             text: "tlhIngan"   //   text of root word
                //         ], [
                //             pos: 'ns2',
                //             text: "pu'"
                //         }]
                //     }
                //
                function analyzeWord2(syllables, rules, result) {
                    var head = syllables[0],                   // syllable to process
                        tail = syllables.slice(1),             // remaining syllables
                        lastPart = result.parts[result.parts.length - 1],
                        pos;

                    // out of syllables = ok if last syllable had pos, bad otherwise
                    if (!head) { return (lastPart.pos ? result : null); }
                    // out of rules to apply = bad
                    if (!rules || !rules[head]) { return null; }

                    pos = rules[head].tag;
                    if (lastPart && (!lastPart.pos || lastPart.pos === pos)) {
                        // syllable part of multi-syllable unit, join with previous
                        lastPart.pos   = pos;
                        lastPart.text += head;
                    } else {
                        lastPart = { 'pos' : pos, 'text': head };
                        result.parts.push(lastPart);
                    }
                    // set root, if not already set to current syllable
                    if (isRoot[pos] && result.root !== lastPart) {
                        if (result.root) {
                            throw new RangeError("Root part-of-speech already set " +
                                "Tried to set it to " + JSON.stringify(lastPart) +
                                ", but it's already set to " +
                                JSON.stringify(result.root) + ".");
                        }
                        result.root = lastPart;
                    }
                    return analyzeWord2(tail, rules[head].rules, result);
                }

                // Usage: wordObjArray = analyzeWord("bachwI'", rules);
                //
                // Return an array of word interpretation objects which all are possible
                // interpretations for 'word' (given the specified 'rules'). If no
                // intepretations can be found, an empty array is returned.
                //
                // For description of the word interpretation object, see analyzeWord2() (which
                // returns a single such object).
                //
                function analyzeWord(word, rules) {
                    var syllables = splitSyllable(word.replace(/[\u2018\u2019]/g, "'")),
                        head      = syllables[0],              // syllable to process
                        results   = [];                        // result
                    if (rules[head]) {                         // if 1st syllable exist in rules
                        rules[head].forEach(function (state) { //   for each possible interpet.
                            var x, newRules = {};
                            newRules[head] = state;
                            x = analyzeWord2(syllables, newRules, { 'parts': [] });
                            if (x && !x.root) { x.root = {}; }  // FIXME
                            if (x) { results.push(x); }
                        });
                    }
                    return results;
                }

                that.getSyllable = function (start, length) {
                    return this.syllables.slice(start, length).map(function (x) {
                        return x.text;
                    });
                };
                that.addRoot = function (word, pos) {
                    var tagProp,
                        type = Object.prototype.toString.call(word).slice(8, -1);
                    if (type !== "Array") {
                        throw new TypeError("Method addRoot must be called on array " +
                            "(not " + type.toLowerCase() + ")");
                    }
                    if (!this.roots) { this.roots = {}; }
                    if (!this.roots[word]) {           // set (if unset)
                        this.roots[word] = pos;
                    } else {                           // add to existing values
                        tagProp = this.roots[word];
                        pos.forEach(function (pos) {
                            if (tagProp.indexOf(pos) === -1) { tagProp.push(pos); }
                        });
                    }
                };
                that.setText = function (word, rules) {
                    var that = this;
                    if (word === this.text) { return this; } // skip if unchanged
                    this.text  = word;
                    this.parts = analyzeWord(word, rules);
                    this.setTags(this.parts.map(function (part) {
                        return isPos[part.parts[part.parts.length - 1].pos];
                    }));
                    this.roots = {};
                    this.parts.forEach(function (part) {
                        that.roots[part.root.text] = [part.root.pos];
                    });
                    return this;
                };
            }(taggedWordPrototype));

            return {
                string: function (text, tags) {
                    var f = Object.create(taggedStringPrototype);
                    return f.setText(text  || "", tags || []);
                },
                word: function (text, rules) {
                    var f = Object.create(taggedWordPrototype);
                    return f.setText(text  || "", rules || {});
                }
            };
        }());


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: makedictionary */

    /*************************************************************************\
    **                                                                       **
    ** Dictionary Loader                                                     **
    **                                                                       **
    \*************************************************************************/

    // Invocation
    // ----------
    // Load the dictionary using:
    //
    //     dict = makeDictionary('../dict/dict.zdb', function () {
    //         alert('Dictionary loaded');
    //     });
    //
    // Query
    // -----
    // Find stuff in the dictionary using `dict.query()`.
    //
    // Object Anatomy
    // --------------
    // The plain dictionary list can be obtained with 'dict.query()' (without
    // arguments), if your, for some reason, want to iterate over the entire
    // dictionary.
    //
    // The 'num:' field is not present in the original datafile, but added when
    // reading the dictionary. It indicates the entry's number in the original
    // database.
    //
    // dict = [
    //     {
    //         num :  1
    //         tlh : "{bach} [1]",
    //         pos : "verb",
    //         sv  : "«skjuta»",
    //         en  : "<shoot>",
    //         def : "TKD",
    //         ref : "TKW p.148",
    //         com : [...]
    //         tag : "fighting; KLCP1",
    //         file: "1992-01-01-tkd.txt",
    //     }, {
    //         num:  : 2,
    //         tlh : "{bach} [2]",
    //         pos : "noun",
    //         sv  : "«skott»",   // «...» retained
    //         en  : "<shot>",    // «...» / <...> retained
    //         def : "TKD",
    //         cat : "fighting",
    //         data: "KLCP-1",
    //         file: "1992-01-01-tkd.txt",
    //     },
    //     ...
    // ];
    //

    // Loads data from ZDB file format from URL, parses it (and stuff), and returns
    // a dictionary object. Dictionary can then be queried with '.query()'.
    //
    // Dictionary data can be loaded from: http://klingonska.org/dict/dict.zdb
    //
    function makeDictionary(url, onLoadCallback) {
        /*jslint white: true */
        var object = {},
            dict = [],
            index = {},
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
            };
        /*jslint white: false */

        if (!url) { throw new Error('No dictionary URL specified'); } // required options url

        // Usage: dict = parseZDB(data);
        //
        // Chew up ZDB database, spit out one giant list, with each element being
        // one dictionary entry object, looking like this (the 'num' field is added
        // while reading the dictionary, and is not part of the original data).
        //
        //     {
        //         num : 2,
        //         tlh : "{bach} [2]",
        //         pos : "noun",
        //         sv  : "«skott»",   // «...» retained
        //         en  : "<shot>",    // «...» / <...> retained
        //         def : "TKD",
        //         cat : "fighting",
        //         data: "KLCP-1",
        //         file: "1992-01-01-tkd.txt",
        //     }
        //
        function parseZDB(data) {
            var count = -1;
            // dictionary data preprocessing (strip header + footer etc.)
            data = data.replace(/^[\s\S]*\n=== start-of-word-list ===\n+/, ''); // head
            data = data.replace(/\n+=== end-of-word-list ===\n[\s\S]*$/, '');   // foot
            data = data.replace(/\n\t/g, ' ');         // unwrap long lines
            return data.split(/\n{2,}/).map(function (chunk) {
                var entry = { num: (count += 1) }, citeCount = 1;
                chunk.split(/\n/).forEach(function (line) {
                    /*jslint regexp: true */
                    var match = line.match(/^(\w*):\s+([^]*)/),
                        field = match[1],
                        value = match[2];
                    /*jslint regexp: false */
                    if (field === 'cite') {
                        field = field + '-' + citeCount;
                        citeCount += 1;
                    }
                    entry[field] = value;
                });
                return entry;
            });
        }

        // The passed in arguments <tlh> and <pos> are not the same as the
        // corresponding dicttionary fields. Instead <tlh> is the plain Klingon
        // word (without the brackets or counters in the dictionary) and <pos> is
        // the abbreviated part-of-speech.
        function addIndexItem(index, entry, tlh, pos) {
            var id = entry.id;
            index.id[id]                = index.id[id]                || {};
            index.id[id]['']            = index.id[id]['']            || [];
            index.id[id][''].push(entry);
            index.tlh[tlh]              = index.tlh[tlh]              || {};
            index.tlh[tlh]['']          = index.tlh[tlh]['']          || [];
            index.tlh[tlh][''].push(entry);
            index.tlh[tlh].pos          = index.tlh[tlh].pos          || {};
            index.tlh[tlh].pos[pos]     = index.tlh[tlh].pos[pos]     || {};
            index.tlh[tlh].pos[pos][''] = index.tlh[tlh].pos[pos][''] || [];
            index.tlh[tlh].pos[pos][''].push(entry);
            index.pos[pos]              = index.pos[pos]              || {};
            index.pos[pos]['']          = index.pos[pos]['']          || [];
            index.pos[pos][''].push(entry);
            index.pos[pos].tlh          = index.pos[pos].tlh          || {};
            index.pos[pos].tlh[tlh]     = index.pos[pos].tlh[tlh]     || {};
            index.pos[pos].tlh[tlh][''] = index.pos[pos].tlh[tlh][''] || [];
            index.pos[pos].tlh[tlh][''].push(entry);
        }

        function indexify(dict) {
            var index = { pos: {}, tlh: {}, id: {} };
            dict.forEach(function (entry) {
                /*jslint regexp: true */
                var tlh = (entry.tlh.match(/\{(.*?)\}/))[1], // Klingon word
                    pos = posAbbrev[entry.pos];
                /*jslint regexp: false */
                addIndexItem(index, entry, tlh, pos);
            });
            return index;
        }

        // Return list of requested entries. Returns whole dictionary if no
        // query was give, empty list if no match was found. Possible query
        // fields are: <num> (entry number), <tlh> (Klingon word), <pos>
        // (part-of-speech). <tlh> and <pos> may be combined.
        function makeDictionary_query(query) {
            var pos = (query || {}).pos,
                tlh = (query || {}).tlh,
                id  = (query || {}).id,
                num = (query || {}).num,
                result;
            try {
                if (id) { return index.id[id]['']; }
                if (num !== undefined) {
                    result = dict[num < 0 ? dict.length + num : num];
                    return result ? [ result ] : [];
                }
                if (pos) {
                    if (posAbbrev[pos]) { pos = posAbbrev[pos]; }
                    return tlh ?
                            index.pos[pos].tlh[tlh][''] :
                            index.pos[pos][''];
                }
                if (tlh) {
                    return index.tlh[tlh][''];
                }
                return dict;
            } catch (error) {
                return [];
            }
        }
        object.query = makeDictionary_query;

        function makeDictionary_index() {
            return index;
        }
        object.index = makeDictionary_index;

        $.get(url, function (data) {               // fetch dictionary
            dict = parseZDB(data);                 //   parse
            index = indexify(dict);
            if (onLoadCallback) { onLoadCallback(object); }
        });

        return object;
    }


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: makerules */

    var makeRules = (function () {
            // Usage: subrule.addRule(syllables, tag, trailingRules);
            //
            // Adds a rule path for the specified 'syllables', giving it the tag
            // 'tag', and adding the rules in 'trailingRules' to the end of the
            // rule path.
            //
            // If a rule path for that sequence of syllables already exists, an
            // exception will be thrown, except if existing rule path has the same
            // overall tag as specified in the method call. 'Overall tag' means
            // that an existing rule path terminating in e.g. a verb suffix will
            // qualify as a verb (same goes for noun suffixes, numerical elements
            // etc.).
            //
            /*jslint white: true */
            var subrulesPrototype, baserulesPrototype,
                isPos = {
                    'adv' : 'adv',   'advs': 'adv',   'conj': 'conj',  'excl': 'excl',
                    'name': 'name',  'n'   : 'n',     'ns1' : 'n',     'ns2' : 'n',
                    'ns3' : 'n',     'ns4' : 'n',     'ns5' : 'n',     'num' : 'num',
                    'num1': 'num',   'num2': 'num',   'pro' : 'pro',   'ques': 'ques',
                    'v'   : 'v',     'vs1' : 'v',     'vs2' : 'v',     'vs3' : 'v',
                    'vs4' : 'v',     'vs5' : 'v',     'vs6' : 'v',     'vs7' : 'v',
                    'vs8' : 'v',     'vs9' : 'v',     'vs9n': 'n',     'vsr' : 'v',
                    'num2n':'n'
                };
            /*jslint white: false */

            // split a Klingon word into syllables
            function splitSyllable(word) {
                var type = Object.prototype.toString.call(word).slice(8, -1);
                if (type !== "String") {
                    throw new TypeError("Function splitSyllable must be called " +
                        "on string (not " + type.toLowerCase() + ")");
                }
                return word.split(/(?=(?:[bDHjlmnpqQrStvwy\']|ch|gh|ng|tlh)[aeIou])/);
            }

            /*********************************************************************\
            **                                                                   **
            ** Word Parse Subrules                                               **
            **                                                                   **
            \*********************************************************************/
            // Subrules contains a Finite-State Machine, in the form of a rule
            // 'tree' (in quotes since this structure may contain references itself
            // and other cyclic structures). In contrast with the 'baserule'
            // object, no branch may split in two directions simultaneously (each
            // 'rules' attribute contains a reference to a single other subrule,
            // instead of an array of such references).
            //
            // The rule tree can e.g. be traversed to figure out the part-of-speech
            // for a Klingon word (split into syllables). Let's say that you want
            // to know the part-of-speech for the word {Dabachqa'}.
            //
            // First split word syllables: {Da-bach-qa'}. Then traversing the rules
            // recursively, we'll see that:
            //
            //     subrules[Da].tag is 'vp'
            //     subrules[Da].rules[bach].tag is 'v'
            //     subrules[Da].rules[bach].rules[qa'].tag is 'vs3'
            //
            //     subrules = {
            //         "bach": { tag: 'n',  rules: nsRules },
            //         //...
            //         "ghIp": {
            //             rules: {
            //                 "DIj": { tag: 'v', rules: vsRules }
            //             }
            //         },
            //         //...
            //     }
            //
            function makeSubrules() { return Object.create(subrulesPrototype); }
            subrulesPrototype = {
                addRule: function (syllables, tag, trailingRules, x) {
                    var head = syllables[0],           // syllable to process
                        tail = syllables.slice(1),     // remaining syllables
                        oldTag = '';
                    x = x || syllables.join('');
                    if (this[head]) {                  // if this syllable exists
                        if (tail.length === 0) {
                            oldTag = isPos[this[head].tag];
                            if (oldTag !== tag) {
                                throw new RangeError("Rule already exists for " +
                                    "{" + x + "}. Tried to tag as '" + tag + "', " +
                                    "but it's already tagged '" + this[head].tag +
                                    "'.");
                            }
                            return this;
                        }
                    } else {
                        this[head] = {};
                        if (tail.length === 0) {           // last syllable
                            this[head].tag = tag;          //   add part-of-speech tag
                            if (trailingRules) {           //   and trailing rules (if any)
                                this[head].rules = trailingRules;
                            }
                            return this;
                        }
                        this[head].rules = makeSubrules();
                    }
                    this[head].rules.addRule(tail, tag, trailingRules, x);
                    return this;
                },
                addRules: function (affixes, trailingRules) {
                    var that = this;
                    Object.keys(affixes).forEach(function (affix) {
                        that.addRule(splitSyllable(affix), affixes[affix], trailingRules);
                    });
                    return this;
                }
            };

            /*********************************************************************\
            **                                                                   **
            ** Word Parse Baserules (extends 'Word Parse Subrules')              **
            **                                                                   **
            \*********************************************************************/
            function makeBaserules() { return Object.create(baserulesPrototype); }
            baserulesPrototype = Object.create(subrulesPrototype);
            (function (that) { //... }(baserulesPrototype));
                that.addRule = function (syllables, tag, trailingRules) {
                    var head = syllables[0],           // syllable to process
                        tail = syllables.slice(1),     // remaining syllables
                        index = null;
                    if (this[head]) {                  // if syllable rule exists
                        (function () { }());           //   NOOP to make JSLint shut up
                        // FIXME: check if *this particular rule exist* (i.e. if the
                        // set of syllables given already have an acceptable final
                        // state with the same part-of-speech), if it does, just cancel
                        // without adding anything
                    } else {                           // otherwise
                        this[head] = [];               //   create empty rule
                    }
                    if (index === null) {              // create subrule if none found
                        index = this[head].length;
                        this[head].push({});
                    }
                    if (tail.length === 0) {           // last syllable
                        this[head][index].tag = tag;   //   add part-of-speech
                        if (trailingRules) {           //   and suffix rules
                            this[head][index].rules = trailingRules;
                        }
                        return this;
                    }
                    this[head][index].rules = this[head][index].rules || makeSubrules();
                    this[head][index].rules.addRule(tail, tag, trailingRules);
                    return this;
                };
            }(baserulesPrototype));

            // Object Anatomy
            // --------------
            // var rules = {
            //     "bach": [{ tag: 'n',  rules: nsRules }],
            //     "batlh": [
            //         { tag: 'adv' },
            //         { tag: 'n', rules: nsRules }
            //     ],
            //     //...
            //     "ghIp": [{
            //         rules: {
            //             "DIj": [{ tag: 'v', rules: vsRules }]
            //         }
            //     }],
            //     //...
            // }
            //
            // Requirements: makeSubrules(), makeBaserules(), splitSyllable()
            function getRules(dict) {
                /*jslint white: true */
                var vsRules   = makeSubrules(), nsRules = makeSubrules(),
                    numRules  = makeSubrules(), verbRules = makeSubrules(),
                    advsRules = makeSubrules(), baserules = makeBaserules(),
                    posAbbrev = {
                        "adverbial"             : "adv",   "conjunction"       : "conj",
                        "exclamation"           : "excl",  "name"              : "name",
                        "noun"                  : "n",     "noun suffix type 1": "ns1",
                        "noun suffix type 2"    : "ns2",   "noun suffix type 3": "ns3",
                        "noun suffix type 4"    : "ns4",   "noun suffix type 5": "ns5",
                        "numeral"               : "num",   "pronoun"           : "pro",
                        "question word"         : "ques",  "verb"              : "v",
                        "verb prefix"           : "vp",    "verb suffix type 1": "vs1",
                        "verb suffix type 2"    : "vs2",   "verb suffix type 3": "vs3",
                        "verb suffix type 4"    : "vs4",   "verb suffix type 5": "vs5",
                        "verb suffix type 6"    : "vs6",   "verb suffix type 7": "vs7",
                        "verb suffix type 8"    : "vs8",   "verb suffix type 9": "vs9",
                        "verb suffix type rover": "vsr"
                    },
                    verbPrefixes = {
                        "bI" : 'vp',  "bo" : 'vp',  "che": 'vp',  "cho": 'vp',
                        "Da" : 'vp',  "DI" : 'vp',  "Du" : 'vp',  "gho": 'vp',
                        "HI" : 'vp',  "jI" : 'vp',  "ju" : 'vp',  "lI" : 'vp',
                        "lu" : 'vp',  "ma" : 'vp',  "mu" : 'vp',  "nI" : 'vp',
                        "nu" : 'vp',  "pe" : 'vp',  "pI" : 'vp',  "qa" : 'vp',
                        "re" : 'vp',  "Sa" : 'vp',  "Su" : 'vp',  "tI" : 'vp',
                        "tu" : 'vp',  "vI" : 'vp',  "wI" : 'vp',  "yI" : 'vp'
                    },
                    verbSuffixes = { // except {-wI'} and {-ghach}
                        "'egh" : 'vs1',  "chuq" : 'vs1',  "nIS"  : 'vs2',
                        "qang" : 'vs2',  "rup"  : 'vs2',  "beH"  : 'vs2',
                        "vIp"  : 'vs2',  "choH" : 'vs3',  "qa'"  : 'vs3',
                        "moH"  : 'vs4',  "lu'"  : 'vs5',  "laH"  : 'vs5',
                        "chu'" : 'vs6',  "bej"  : 'vs6',  "law'" : 'vs6',
                        "ba'"  : 'vs6',  "pu'"  : 'vs7',  "ta'"  : 'vs7',
                        "taH"  : 'vs7',  "lI'"  : 'vs7',  "neS"  : 'vs8',
                        "DI'"  : 'vs9',  "chugh": 'vs9',  "pa'"  : 'vs9',
                        "vIS"  : 'vs9',  "bogh" : 'vs9',  "meH"  : 'vs9',
                        "mo'"  : 'vs9',  "'a'"  : 'vs9',  "jaj"  : 'vs9',
                        "be'"  : 'vsr',  "Qo'"  : 'vsr',  "Ha'"  : 'vsr',
                        "qu'"  : 'vsr'
                    },
                    nominalizers = {
                        "wI'"  : 'vs9n', "ghach": 'vs9n'
                    },
                    nounSuffixes = {
                        "'a'"  : 'ns1',  "Hom"  : 'ns1',  "'oy"  : 'ns1',
                        "oy"   : 'ns1',  "pu'"  : 'ns2',  "Du'"  : 'ns2',
                        "mey"  : 'ns2',  "qoq"  : 'ns3',  "Hey"  : 'ns3',
                        "na'"  : 'ns3',  "wIj"  : 'ns4',  "wI'"  : 'ns4',
                        "maj"  : 'ns4',  "ma'"  : 'ns4',  "lIj"  : 'ns4',
                        "lI'"  : 'ns4',  "raj"  : 'ns4',  "ra'"  : 'ns4',
                        "Daj"  : 'ns4',  "chaj" : 'ns4',  "vam"  : 'ns4',
                        "vetlh": 'ns4',  "Daq"  : 'ns5',  "vo'"  : 'ns5',
                        "mo'"  : 'ns5',  "vaD"  : 'ns5',  "'e'"  : 'ns5'
                    },
                    numericElements = { // except {-SanID}
                        "wa'"  : 'num',  "cha'" : 'num',  "wej"  : 'num',
                        "loS"  : 'num',  "vagh" : 'num',  "jav"  : 'num',
                        "Soch" : 'num',  "chorgh":'num',  "Hut"  : 'num',
                        "maH"  : 'num1', "vatlh": 'num1', "SaD"  : 'num1',
                        "netlh": 'num1', "bIp"  : 'num1', "'uy'" : 'num1',
                        "DIch" : 'num2', "logh" : 'num2',
                        "leS"  : 'num2n', "Hu'"  : 'num2n',
                        "SanID": 'num1'
                    },
                    adverbialSuffix = {  "Ha'"  : 'advs' },
                    trailingRules = { // no rules for: conj, excl, num, ques
                        'adv' : advsRules, 'name' : nsRules, 'n'  : nsRules,
                        'pro' : vsRules,   'v'    : vsRules, 'vp' : verbRules
                    };
                /*jslint white: false */

                // rulesets for suffixes
                vsRules.addRules(verbSuffixes, vsRules).
                    addRules(nominalizers, nsRules);
                nsRules.addRules(nounSuffixes, nsRules);
                numRules.addRules(numericElements, numRules);
                advsRules.addRules(adverbialSuffix);

                // base ruleset
                baserules.addRules(verbPrefixes, verbRules);
                dict.query().map(function (entry) {            // foreach dictionary entry
                    /*jslint regexp: true */
                    var tlh = (entry.tlh.match(/\{(.*?)\}/))[1], // Klingon word
                        pos = posAbbrev[entry.pos],              // part-of-speech
                        sylls = splitSyllable(tlh);
                    /*jslint regexp: false */
                    if (!tlh.match(/[ ]/)) {
                        if (pos === 'v') {                       // add to 'verbRules'
                            verbRules.addRule(sylls, pos, vsRules);
                        }
                        if (pos === 'pro') {
                            baserules.addRule(sylls, pos, nsRules);
                        }
                        baserules.addRule(sylls, pos, trailingRules[pos]);
                    }

                });
                baserules.addRules(numericElements, numRules);

                // DEBUG
                // Object.keys(vsRules).forEach(function (name) { delete vsRules[name]; });
                // Object.keys(nsRules).forEach(function (name) { delete nsRules[name]; });
                // Object.keys(advsRules).forEach(function (name) { delete advsRules[name]; });
                // console.log('baserules = ' + JSON.stringify(baserules,null, 2));

                // FIXME: Will naked numerical elements like {vatlh} work?
                //
                // // insert all 'numRules' into 'rules'
                // Object.keys(numRules).forEach(function (key) {
                //     rules[key] = (rules[key] || []).concat(numRules[key]);
                // });
                return baserules;
            }

            return function (dict) {
                return getRules(dict);
            };
        }());


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: makeglossary */

    // glossary = makeGlossary(options);
    //
    // FIXME: What should happen when trying to add an entry that does not exist in
    // dictionary? (this can never happen since words that aren't in the dictionary
    // and will never be matched out in the parsing process, but in the future we
    // should support any Klingon phonotax words, like {Qov}, and ungrammaticals
    // like {Hejna'} eventually)

    // Indata for all functions are dictionary entries, however 'glossary' only
    // looks at the 'id:' field. The '.get()' function also return copies of
    // dictionary entries, with the extra fields 'count:' and 'num:' set. ('count:'
    // returns the number of times the word has been added to the glossary, 'num:'
    // the number of the entry in the original dictionary).
    //
    // Structure of internal 'wordCount' (which, together with 'object.length' is
    // the only data structure need to keep track of everything).
    //
    // wordCount = {
    //     ...
    //     "ExS": 5,                // dictionary entry ID + word count in text
    //     ...
    // };
    //
    // About Loading and Saving
    // ========================
    // If if 'name' option was provided at initialization, then the glossary will
    // automatically be saved to localStorage whenever entries are added or
    // deleted. (One may also manually invoke the .load() and .save() methods, but
    // there exist no good reason to do this.)
    //
    // Saved data ('storageEntries') is a reduced version of the internal glossary
    // data structure. Only the 'id:' and 'count:' fields are saved (the 'num:'
    // field is not included).

    // The pseudo-field 'num:' indicates dictionary file entry order (i.e. first
    // entry in file is 'num: 0', second is 'num: 1' etc.). This value calculated
    // when loading the dictionary (it is not stored in the dictionary data file).
    // Since the value changes whenever words are added or deleted in the
    // dictionary, it needs to be fetched from the dictionary when loading a
    // glossary. (The 'num:' field is used for sorting, and to go to the
    // previous/next entry.)
    function makeGlossary(options) {
        var wordCount = {}, object = { length: 0 };
        function each(entries, callback) {
            // FIXME: Input data errors are silently ignored here. (E.g. if an
            // incompatible data structure was loaded from localStorage.) Only if
            // 'entries' argument is an array, and then only for entries containing
            // the 'id:' field, do we actually *do* anything. It seem to me bad
            // practice not to tell the user that something went wrong, but
            // throwing an error fucks up the entire program, so we can't do that.
            if (entries instanceof Array) {
                entries.forEach(function (entry) {
                    if (entry.id) { callback(entry); }
                });
            }
        }

        /*************************************************************************\
        **                                                                       **
        **  Functions Returning Information                                      **
        **                                                                       **
        \*************************************************************************/

        // Return word 'count:' for specified <entry>, or zero if word does not
        // exists or is otherwise unknown.
        function makeGlossary_count(entry) {
            var id = entry && entry.id;
            return id && wordCount[id] ? wordCount[id] : 0;
        }
        object.count = makeGlossary_count;

        // Return list of all glossary entries sorted in dictionary order. Entries
        // are copied from dictionary, with added field 'count:' (see above).
        function byNumField(entry1, entry2) { return entry1.num - entry2.num; }
        function makeGlossary_get() {
            var id, field, newEntry, dictEntry,
                dict = options.dict, newEntries = [];
            for (id in wordCount) {
                if (wordCount.hasOwnProperty(id)) {
                    dictEntry = dict.query({ id: id })[0];
                    // FIXME: What happens if word with that ID no longer exists in
                    // dict? (E.g. because a new dictionary without it has been
                    // loaded)
                    newEntry = {};
                    for (field in dictEntry) {     // shallow copy of dict entry
                        if (dictEntry.hasOwnProperty(field)) {
                            newEntry[field] = dictEntry[field];
                        }
                    }
                    newEntry.count = wordCount[id];// + word count
                    newEntries.push(newEntry);
                }
            }
            return newEntries.sort(byNumField);    // return sorted list
        }
        object.get = makeGlossary_get;

        // Return true if <entry> exists in glossary, false otherwise.
        function makeGlossary_has(entry) {
            return !!wordCount[entry.id];
        }
        object.has = makeGlossary_has;

        /*************************************************************************\
        **                                                                       **
        **  Chainable Functions                                                  **
        **                                                                       **
        \*************************************************************************/

        // Add words to glossary (+ auto save). Don't invoke this repeatedly if you
        // have many words to add, instead build a list of words and invoke .add()
        // once on the entire list.
        //
        // Entries is a list of dictionary-like entries. The only required field is
        // 'id:', but any occurring 'count:' field is also used to increment the
        // count of the word (if no 'count:' is given, defaults to 1).
        //
        // If 'noSave' is truthy, then the newly added words will *not* be auto
        // saved to localStorage. (Used internally when .add() is invoked by the
        // .load() method.)
        function makeGlossary_add(entries, noSave) {
            var dict = options.dict;
            each(entries, function (entry) {
                var dictEntry, id = entry.id, addCount = entry.count || 1;
                if (wordCount[id]) {               // already exists
                    wordCount[id] += addCount;     //   increase counter
                } else {                           // new glossary entry
                    dictEntry = dict.query({ id: id })[0];
                    // FIXME: What to do if dictEntry does not exist?
                    if (dictEntry) {               //   create glossary entry
                        wordCount[id] = addCount;  //     with word count
                        object.length += 1;
                    }
                }
            });
            return noSave ? object : object.save();
        }
        object.add = makeGlossary_add;

        // Clear glossary. Does not auto save.
        function makeGlossary_clear() {
            object.length = 0;
            wordCount = {};
            return object;
        }
        object.clear = makeGlossary_clear;

        // Load glossary from localStorage.
        function makeGlossary_load() {
            var name = options.name;
            if (name) {                            // if there's a storage name
                try {                              // load
                    wordCount = JSON.parse(localStorage.getItem(name));
                    object.length = Object.keys(wordCount).length; // set length
                } catch (error) {                  // ERROR
                    object.clear();                //   erase everything
                }
            }
            return object;
        }
        object.load = makeGlossary_load;

        // Remove <entries> from glossary.
        function makeGlossary_remove(entries) {
            each(entries, function (entry) {
                var id = entry && entry.id;
                if (id && wordCount[id]) {
                    object.length -= 1;
                    delete wordCount[id];
                }
            });
            return object.save();
        }
        object.remove = makeGlossary_remove;

        // Save glossary to localStorage.
        function makeGlossary_save() {
            var name = options.name;
            if (name) {                            // if there's a storage name
                localStorage.setItem(name, JSON.stringify(wordCount));
            }
            return object;
        }
        object.save = makeGlossary_save;

        return object.load();
    }


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: setlang */

    /***************************************************************************** \
    **                                                                           **
    ** Page Language Selector                                                    **
    **                                                                           **
    \*****************************************************************************/

    // This should be used with a <select class=lang> on your page. An onChange
    // event is added to that, which, on selection sets 'data-lang' of the <html>
    // attribute, so that you may use CSS to show/hide various elements on the
    // page.
    // set 'data-lang' attribute of <html> element
    $(function () {
        var oldLang = '', selectorElement = $('select.lang'),
            storageName  = 'language',
            languageName = localStorage.getItem(storageName);
        function setLang(newLang) {
            if (newLang !== oldLang) {
                $(document.body).attr('data-lang', newLang);
                localStorage.setItem(storageName, newLang);
                oldLang = newLang;
            }
        }
        setLang(languageName || 'en');             // default langue = english
        selectorElement.val(languageName);         // update selector
        selectorElement.on('change', function () { setLang(this.value); });
    });


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: makepracticedeck */

    // FIXME: This maker function should probably be rewritten reuse the same
    // prototype, rather than re-instantiate it on every invocation.
    function makePracticeDeck(values) {
        var object, proto;

        // Splice random element from <array>. If <skip> is given, don't take
        // any of the <skip> number of elements at the end of the list. Return
        // undefined if <skip> is larger than the number of elements in
        // <array>, or if <array> is empty.
        function spliceRandom(array, skip) {
            var max = array.length - (skip || 0),
                rnd = Math.floor(Math.random() * max);
            if (max < 1) { return undefined; }
            return array.splice(rnd, 1).pop();
        }

        proto = {
            count: function () {
                return this.main.length + this.loop.length;
            },
            // Reset the deck.
            reset: function (values) {
                this.main = values;
                this.loop = [];
                return this;
            },
            // This will pick a value from the 'loop' part of the deck, if
            // possible. If not, it'll take a new word from the 'main' part,
            // and if even that fails (because there are too few words), then
            // it will pick a word from the 'wait' part of the deck (this means
            // that when the total number of words is lower than 'skipSize' the
            // same word may come up twice).
            //
            // NOTE: When <loop> isn't full, we *always* take from main. This
            // is not very random, maybe we should select a random entry
            // between 0 and <loopSize>, and only if the selected value is
            // larger than <loop.length> - <skipSize> grab a random value from
            // <main>.
            get: function () {
                // take from 'loop' if full (random, excluding 'skipSize' newest)
                if (this.loop.length >= this.loopSize) {
                    return spliceRandom(this.loop, this.skipSize);
                }
                // take from 'main' if non-empty (random)
                if (this.main.length > 0) {
                    return spliceRandom(this.main);
                }
                // try 'loop' again if non-empty
                // 'loop' has more than 'skipSize' elements (random, exclude 'skipSize')
                if (this.loop.length > this.skipSize) {
                    return spliceRandom(this.loop, this.skipSize);
                }
                // 'loop' has more than one element (random, exclude last)
                if (this.loop.length > 1) {
                    return spliceRandom(this.loop, 1);
                }
                // 'loop' has fewer than one element
                return this.loop.pop();
            },
            // Put card back in deck. If <loop> becomes overfull, then a random
            // element in <loop> is put back in <main> (<skipSize> is ignored
            // in this selection, so potentially the item put back can wind up
            // in the <main> deck.)
            put: function (value) {
                this.loop.push(value);
                // if 'loop' is full, move random to 'main'
                if (this.loop.length > this.loopSize) {
                    this.main.push(spliceRandom(this.loop));
                }
            },
            // get/set loop size (use 'null' for default)
            size: function (value) {
                if (arguments.length === 0) { return this.loopSize; }
                this.loopSize = (typeof value === 'number' ? value : 10);
                return this;
            },
            // get/set skip (use 'null' for default)
            skip: function (value) {
                if (arguments.length === 0) { return this.skipSize; }
                this.skipSize = (typeof value === 'number' ? value : 3);
                return this;
            }
        };

        object = Object.create(proto);
        return object.reset(values).size(null).skip(null);
    }


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: flashcards */

    /*
      See: http://eli.thegreenplace.net/2010/01/22/weighted-random-generation-in-python/

      Use the method "Giving up the temporary list".

      def weighted_choice_sub(weights):
          rnd = random.random() * sum(weights)
          for i, w in enumerate(weights):
              rnd -= w
              if rnd < 0:
                  return i

        <button style="background:#da8;color:#540;border: outset #fca;" >Maybe</button>
        <button style="background:#ad8;color:#350;border: outset #cfa;" title=2>Easy</button>
        <button style="background:#8f8;color:#070;border: outset #afa;">Known</button>

      Page controls:

        <div style="color: #666">
          <label title="Determines the number of buttons above.">Loop: <input style="width:1.5em" value=13></label>
          &nbsp;
          Repeats:
          <label>tlh⇒en <input style="width:1em" value=3></label>
          &nbsp;
          <label>en⇒tlh <input style="width:1em" value=3></label>
        </div>

    */

    /*

    # Passed in from outside:
    #
    #    glossary  -- glossary of words to include
    #    known     -- glossary of words to exclude from "Glossary Words"
    #    dict      -- dictionary in which to look up words
    #
    # Internal:
    #    store -- internal state, with bookkeeping for all entries
    #
    #    deck (array of ids) = all words to practice
    #    loop (array of ids) = current tiny little loop thingy to practice
    #    wait (array of ids) = recently asked questions not to insert in program yet
    #
    #    questionEntry (dictionary entry) = currently displayed question
    #
    #    tlhEnCount -- number of questions in tlh -> en direction
    #    enTlhCount -- number of questions in en -> tlh direction
    #

    State of Current Practice Session
    =================================
    This state does not contain any fields from the dictionary entry.

    This is all the state currently in existance.

        store = {
            <ID> = {
                ...
            },
            ...
        };


    Cards Currently Used
    ====================
    An array with entry IDs.

    This is the state used for the current session. It is re-created upon entering
    a new practice session, and initialized using the 'state' object.

        deck = [
            <ID 1>,
            <ID 2>,
            ...
        ];


    Keybindings
    ===========
    Keybindings are only in effect when one of the answer buttons are in focus.
    Having them enabled for the whole document might've been better for the user,
    but then they would have to be unbound/rebound whenever the current tab
    changes.

    */

    function initFlashcards(opts) {
        var questionEntry,
            deck = makePracticeDeck(),
            tlhEnCount = 3,
            enTlhCount = 3,
            dom = {
                buttonElements: $('section.practice button'),
                questionCell: $('section.practice td.question'),
                answerCell:   $('section.practice td.answer'),
                table:        $('section.practice table.glossary'),
                tab:          $('nav.pagetabs [href="#practice"]'),
                showCell:     $('section.practice td.show'),
                replyCell:    $('section.practice td.reply'),
                helpElement:  $('section.practice .help'),
                pointElement: $('section.practice span.point'),
                maxPointElement: $('section.practice .maxpoint'),
                pointMeter:   $('section.practice progress.point'),
                pointMeter2:  $('section.practice progress.b'),
                occurElement: $('section.practice .occur')
            },
            posAbbrev = {
                "adverbial"              : { en: "adv",  sv: "adv" },
                "conjunction"            : { en: "conj", sv: "konj" },
                "exclamation"            : { en: "excl", sv: "interj" },
                "name"                   : { en: "name", sv: "namn" },
                "noun"                   : { en: "n",    sv: "s"   },
                "noun suffix type 1"     : { en: "ns1",  sv: "ss1" },
                "noun suffix type 2"     : { en: "ns2",  sv: "ss2" },
                "noun suffix type 3"     : { en: "ns3",  sv: "ss3" },
                "noun suffix type 4"     : { en: "ns4",  sv: "ss4" },
                "noun suffix type 5"     : { en: "ns5",  sv: "ss5" },
                "numeral"                : { en: "num",  sv: "räkn" },
                "pronoun"                : { en: "pro",  sv: "pro"  },
                "question word"          : { en: "ques", sv: "fråg" },
                "verb"                   : { en: "v",    sv: "v"   },
                "verb prefix"            : { en: "vp",   sv: "vp"  },
                "verb suffix type 1"     : { en: "vs1",  sv: "vs1" },
                "verb suffix type 2"     : { en: "vs2",  sv: "vs2" },
                "verb suffix type 3"     : { en: "vs3",  sv: "vs3" },
                "verb suffix type 4"     : { en: "vs4",  sv: "vs4" },
                "verb suffix type 5"     : { en: "vs5",  sv: "vs5" },
                "verb suffix type 6"     : { en: "vs6",  sv: "vs6" },
                "verb suffix type 7"     : { en: "vs7",  sv: "vs7" },
                "verb suffix type 8"     : { en: "vs8",  sv: "vs8" },
                "verb suffix type 9"     : { en: "vs9",  sv: "vs9" },
                "verb suffix type rover" : { en: "vsr",  sv: "vss" }
            },
            store = makeStore('practice');

        // erase all but the required / know properties of 'opts'
        opts = {
            glossary: opts.glossary,
            known: opts.known,
            dict: opts.dict
        };

        /*************************************************************************\
        **                                                                       **
        **  Functions                                                            **
        **                                                                       **
        \*************************************************************************/

        function prettyApos(string) {
            return string.replace(/\'/g, '’');  // prettify apostrophes
        }
        function stripAngle(string) {
            return string.replace(/[<>«»]/g, '');
        }

        function tlhHTML(quesEntry) {
            /*jslint regexp: true */
            var word = quesEntry.tlh.match(/[^\{]+(?=\})/)[0];
            /*jslint regexp: false */
            return tag('b', prettyApos(word), 'lang=tlh');
        }

        function nonTlhHTML(quesEntry) {
            /*jslint regexp: true */
            var tlhWord  = quesEntry.tlh.match(/[^\{]+(?=\})/)[0],
                homonyms = opts.dict.query({
                    tlh: tlhWord,
                    pos: quesEntry.pos
                });
            /*jslint regexp: false */

            return ['en', 'sv'].map(function (lang) {// for each language
                var string,
                    strings = homonyms.map(function (entry) {// for each homonym
                        var word = prettyApos(stripAngle(entry[lang]));
                        return tag('i', word);
                    });

                if (strings.length > 1) {           // with homonyms: make list
                    string = 0;
                    strings = strings.map(function (value) {
                        string += 1;
                        return string + '. ' + value + tag('br');
                    });
                    string = strings.join('');
                } else {                           // without homonyms: single
                    string = strings[0];
                }
                return tag('span', string, 'lang=' + lang);
            }).join('');

            // return homonyms.map(function (quesEntry) {
            //     return (
            //         tag('span', tag('i', stripAngle(quesEntry.en)), 'lang=en') +
            //         tag('span', tag('i', stripAngle(quesEntry.sv)), 'lang=sv')
            //     );
            // }).join('');
        }

        function questionHTML(quesEntry, lang) {
            return lang === 'tlh' ? tlhHTML(quesEntry) : nonTlhHTML(quesEntry);
        }

        function replyButtonsKey(event) {
            // left/right arrow -- move focus left/right
            // 1 -- Fail
            // 2 -- Got It
            // 3 -- Too Easy
            // 0 -- Known
            var keymap = { 37: 'left', 39: 'right', 48: '0',
                           49: '1',    50: '2',     51: '3' },
                key = keymap[event.which];
            if (key) {
                event.preventDefault();
                if (key === 'left' || key === 'right') { // move focus
                    $('button:focus')[key === 'left' ?  'prev' : 'next']().focus();
                    return;
                }
                if (key === '1') { $('button.fail').trigger('click'); }
                if (key === '2') { $('button.hard').trigger('click'); }
                if (key === '3') { $('button.easy').trigger('click'); }
                if (key === '0') { $('button.known').trigger('click'); }
            }
        }

        function outputQuestion(quesEntry) {
            var id    = quesEntry.id,
                point = store.get(id, 'point') || 0,
                max   = tlhEnCount + enTlhCount,
                pos   = posAbbrev[quesEntry.pos];
            dom.questionCell.html(                // show question
                questionHTML(quesEntry, point < enTlhCount ? 'tlh' : 'en') + ' (' +
                    tag('span', pos.en || quesEntry.pos, 'lang=en') +
                    tag('span', pos.sv || quesEntry.pos, 'lang=sv') + ')'
            );
            dom.answerCell.empty();               // clear answer
            dom.showCell.removeClass('hidden');   // show 'Show Answer'
            dom.replyCell.addClass('hidden');     // hide reply buttons
            // show current point
            // FIXME: should be progress, or number of questions left on this card
            dom.pointElement.html(point);
            dom.maxPointElement.html(max);
            dom.pointMeter.attr('value', point);
            dom.pointMeter.attr('max', max);
            dom.occurElement.html(store.get(id, 'count'));
            $('button.show', dom.showCell).trigger('focus');
        }

        function outputAnswer(quesEntry) {
            var id    = quesEntry.id,
                point = store.get(id, 'point') || 0;
            dom.answerCell.html(                   // show question
                questionHTML(quesEntry, point < enTlhCount ? 'en' : 'tlh')
            );
            dom.showCell.addClass('hidden');       // hide reply buttons
            dom.replyCell.removeClass('hidden');   // show 'Show Answer'
            $('button.hard', dom.replyCell).trigger('focus');
        }

        function outputHelp(bodyText, key) {
            if (!arguments.length) {
                dom.helpElement.addClass('hidden');
                return;
            }
            dom.helpElement.html(
                bodyText + ' ' + (
                    key ? tag('nobr',
                        '(Key: ' + key.split(' ').map(function (key) {
                            return tag('kbd', key);
                        }).join(' or ') + ')') : ''
                )
            );
            dom.helpElement.removeClass('hidden');
        }

        // Debug output thingy. (Uses global 'store'.)
        function dumpTableHTML(wordIDs, dict, attr) {
            var i = 1, tbody = [];
            wordIDs.forEach(function (id) {
                var entry = dict.query({ id: id })[0],
                    count = store.get(id, 'count') || 0,
                    point = store.get(id, 'point') || 0;
                tbody.push(tag('tr',
                    tag('td', i) +
                    tag('td', entry.id) +
                    tag('td', point) +
                    tag('td', count),
                    attr));
                i += 1;
            });
            return tag('tbody', tbody.join(''));
        }

        function outputDumpTable(questionId, deck, dict) {
            var html = tag('table',
                    tag('tr', tag('th', 'Num') + tag('th', 'ID') + tag('th', 'Score') + tag('th', 'In Text')) +
                        dumpTableHTML([questionId], dict, 'class=n title="Currently displayed word"') +
                        dumpTableHTML(deck.loop, dict, 'class=v title="Words being practiced now"') +
                        dumpTableHTML(deck.main, dict, 'class=adv title="Words remaining to practice"')
                    );
            dom.table.html(html);
        }

        // Invoked on switching to the 'Practice' tab.
        function generateNewDeck(glossary, known) {
            var entries = glossary.get();
            // reset all word counters in store
            store.keys().map(function (name) {
                store.set(name, 'count', 0);
            });
            // set store of each incoming glossary word
            return entries.filter(function (entry) {
                return !known.has(entry);      // all non-known entries
            }).map(function (entry) {
                var id = entry.id;
                store.set(id, 'count', entry.count); //   save word count
                return id;                     // keep only 'id' field
            });
        }

        function failButtonClick(quesEntry) {
            var questionId = quesEntry.id;
            store.set(questionId, 'point', 0);
            deck.put(questionId);              // put card back
        }

        function hardButtonClick(quesEntry, addPoint) {
            var questionId = quesEntry.id,
                point      = (store.get(questionId, 'point') || 0) + addPoint;
            store.set(questionId, 'point', point); // set new points
            if (point < enTlhCount + tlhEnCount) {
                deck.put(questionId);          // put card back
            } else {
                opts.known.add([ quesEntry ]); // add to "Known Words"
            }
        }

        function knownButtonClick(quesEntry) {
            opts.known.add([ quesEntry ]);
        }

        function outOfQuestions() {
            dom.questionCell.html(
                tag('span', 'No words left to practice.', 'lang=en') +
                    tag('span', 'Inga ord kvar att träna på.', 'lang=sv')
            );
            dom.answerCell.empty();
            dom.showCell.addClass('hidden');
            dom.replyCell.addClass('hidden');
            outputHelp();
        }

        // Uses global 'opts.dict' + 'deck'.
        function newQuestion(deck, dict) {
            var questionId, quesEntry, remainCount, totalCount;
            if (deck.count() === 0) {          // stop if no more questions
                outOfQuestions();
                return;
            }
            questionId  = deck.get();          // get question
            quesEntry   = dict.query({ id: questionId })[0];
            remainCount = deck.count();        // output question count
            totalCount  = opts.glossary.length;// glossaries in text
            $('section.practice .remaincount').html(remainCount);
            $('section.practice .donecount').html(totalCount - remainCount);
            $('section.practice .totalcount').html(totalCount);
            $('section.practice progress.total').attr('max', totalCount);
            $('section.practice progress.total').attr('value', totalCount - remainCount);
            outputQuestion(quesEntry);
            outputDumpTable(questionId, deck, dict);
            return quesEntry;
        }

        // User selected (or reselected) this tab.
        function onTabClick() {
            deck.reset(generateNewDeck(opts.glossary, opts.known));
            // FIXME: is this appropriate -- how (if at all?) should deck be stored?
            localStorage.setItem('deck',  JSON.stringify(deck));
            questionEntry = newQuestion(deck, opts.dict);
            outputHelp();                          // clear help text for button
        }

        function buttonFocusout() {
            var point = store.get(questionEntry.id, 'point') || 0;
            dom.pointMeter.attr('value', point);   // reset point meter for word
            dom.pointElement.html(point);
            outputHelp();                          // clear help text for button
        }

        /*************************************************************************\
        **                                                                       **
        **  Main                                                                 **
        **                                                                       **
        \*************************************************************************/

        $('button', dom.showCell).on('click', function () {  // "Show Answer"
            outputAnswer(questionEntry);
        });
        $('button.fail', dom.replyCell).on('click', function () {
            failButtonClick(questionEntry);
            questionEntry = newQuestion(deck, opts.dict);
        });
        $('button.hard', dom.replyCell).on('click', function () {
            hardButtonClick(questionEntry, 1);
            questionEntry = newQuestion(deck, opts.dict);
        });
        $('button.easy', dom.replyCell).on('click', function () {
            // FIXME: should add tlhEnCount points if points < tlhEnCount,
            //   otherwise should add enTlhCount points
            hardButtonClick(questionEntry, tlhEnCount);
            questionEntry = newQuestion(deck, opts.dict);
        });
        $('button.known', dom.replyCell).on('click', function () {
            knownButtonClick(questionEntry);
            questionEntry = newQuestion(deck, opts.dict);
        });
        $('button.show', dom.showCell).on('mouseenter focusin', function () {
            outputHelp(
                'Picture the answer in your mind, then press <i><b>Show ' +
                    'Answer</b></i> to see if remember correctly.',
                'space'
            );
        });
        $('button.fail', dom.replyCell).on('mouseenter focusin', function () {
            // var point = store.get(questionEntry.id, 'point') || 0;
            // dom.pointMeter.attr('value', point - 1);
            var point = 0;
            dom.pointMeter.attr('value', point);
            dom.pointElement.html(point);
            outputHelp(
                'Press <i><b>Failed</b></i> if you didn’t get the answer right.',
                '1'
            );
        });
        $('button.hard', dom.replyCell).on('mouseenter focusin', function () {
            var point = (store.get(questionEntry.id, 'point') || 0) + 1;
            dom.pointMeter.attr('value', point);
            dom.pointElement.html(point);
            outputHelp(
                'Press <i><b>Got It</b></i> if you got the answer right. ' +
                    '– This is what you would normally do.',
                '2'
            );
        });
        $('button.easy', dom.replyCell).on('mouseenter focusin', function () {
            var point = store.get(questionEntry.id, 'point') || 0;
            point = (point < tlhEnCount) ? tlhEnCount : (tlhEnCount + enTlhCount);
            dom.pointMeter.attr('value', point);
            dom.pointElement.html(point);
            outputHelp(
                'Press <i><b>Too Easy</b></i> if you know the word <em>really ' +
                    'well,</em> but still don’t want to dismiss it completely.',
                '3'
            );
        });
        $('button.known', dom.replyCell).on('mouseenter focusin', function () {
            var point = tlhEnCount + enTlhCount;
            dom.pointMeter.attr('value', point);
            dom.pointElement.html(point);
            outputHelp(
                'Press <i><b>Known</b></i> if you know the word by heart, and ' +
                    'never want to practice it again. – Only use this for words ' +
                    'that you’ve forgotten to mark as <i>known</i> under the ' +
                    'Glossary tab.',
                '0'
            );
        });

        $('button', dom.replyCell).on('keydown', replyButtonsKey); // key bindings
        $(document.body).on('focusin', function (event) { // non-button is focused
            if (!$(event.target).is(dom.buttonElements)) { buttonFocusout(); }
        });
        dom.buttonElements.on('mouseleave', buttonFocusout);
        dom.tab.on('click', onTabClick);           // "Practice" (page tab)
    }


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: page */

    var statusTimer;
    function tmpStatus(msg) {
        var statusElement = $('.status');
        clearTimeout(statusTimer);
        statusElement.html(msg);
        statusTimer = setTimeout(function () {
            statusElement.html('');
        }, 1500);
    }

    function statusMsg(msg) {
        clearTimeout(statusTimer);
        $('.status').html(msg);
    }

    function logMsg(str) {
        $('#log').append('<br>&gt;' + str);
    }

    function errorMsg(str) {
        $('#errors').append('<li>' + str + '</li>');
    }

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    (function () {
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
                /*jslint regexp: true */
                var tlh = (word.match(/\{(.*?)\}/)     || [0, ''])[1],
                    hyp = (word.match(/^\[(\d+)/)      || [0,  0])[1],
                    sub = (word.match(/\}\s*\[(\d+)/)  || [0,  0])[1],
                    subsub = (word.match(/\.(\d+)\]$/) || [0,  0])[1];
                /*jslint regexp: false */
                // zero pad pre-word, post-word & post-word sub-counter
                if (hyp < 10) { hyp = '0' + hyp; }
                if (sub < 10) { sub = '0' + sub; }
                if (subsub < 10) { subsub = '0' + subsub; }
                return splitCharacter(tlh).map(function (character) {
                    return transl[character] || '';
                }).join('') + '-' + [hyp, sub, subsub].join('-');
            };
        }());

        function analyzeSpace(text) {
            if (text.match(/[.!?]/)) {             // full stop
                return 'sf';                       //   separator, full stop
            }
            if (text.match(/[,;:()]/)) {           // half stop
                return 'sh';                       //   separator, half stop
            }                                      // space
            return 'ss';                           //   separator, space
        }

        // Split text into tokens.
        function tokenizeAndParse(htmlInput, rules) {
            /*jslint regexp: true */
            var result = [],
                tokens = htmlInput.split(
                    /(<[^>]*>|&[^;]{1,10};|[^&<a-z\'\u2018\u2019]+)/i
                );
            /*jslint regexp: false */
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
                    'Part-of-Speech: ' + (obj.getTags().join(', ') || 'N/A') +
                    '\n' + 'Breakdown:\n    ' + (title.join('\n    ') || 'N/A') +
                    // DEBUG
                    // '\n' + JSON.stringify(obj, null, 4).replace(/\"/g, '&quot;') +
                    '">' +
                    '<span>' + obj.getText() + '</span></span>';
            }).join('');
        }

        function glossaryTableHTML(glossary, crossedOutGlossary) {
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
                        en: '<span class=noncanon title="Headword: Not found as headword in canon.">',
                        sv: '<span class=noncanon title="Uppslagsord: Används inte som uppslagsord i kanon.">'
                    },
                    '»': { en: '</span>', sv: '</span>' },
                    '<': {
                        en: '<span class=canon title="Headword: Found as headword in kanon.">',
                        sv: '<span class=noncanon title="Uppslagsord: Används som uppslagsord i kanon.">'
                    },
                    '>': { en: '</span>', sv: '</span>' }
                },
                thead = tag('tr',
                    tag('th', '',                    // count
                        'title="Occurrences of word in text"') +
                    tag('th',                        // Klingon
                        tag('span', 'Klingon',    'lang=en title="Klingon words found in text"') +
                        tag('span', 'Klingonska', 'lang=sv title="Klingonska ord funna i text"')) +
                    tag('th',                        // Word Type
                        tag('span', 'Type', 'lang=en title="Word type / Part-of-speech"') +
                        tag('span', 'Typ',  'lang=sv title="Ordtyp / Ordklass"')) +
                    tag('th', 'English',             // English
                        'lang=en title="English translation"') +
                    tag('th', 'Svenska',             // Swedish
                        'lang=sv title="Svensk översättning"')
                );
            /*jslint white: false */
            if (entries.length === 0) {
                return tag('tbody', tag('tr',
                    tag('td', 'There is nothing to see here (yet).', 'lang=en') +
                    tag('td', 'Det finns inget att visa här (än).', 'lang=sv')));
            }
            tbody = entries.map(function (entry) {
                /*jslint regexp: true, unparam: true */
                var pos = posAbbrev[entry.pos] || 'Huh?',
                    tlh = entry.tlh.replace(/\{(.*)\}/, function (a, b) {
                        return tag('b', b.replace(/[\'‘’]/g, '’'),
                            'lang=tlh');
                    }),
                    en = entry.en.replace(/[«»<>]/g, function (a) { return repl[a].en; }),
                    sv = entry.sv.replace(/[«»]/g,   function (a) { return repl[a].sv; }),
                    count = glossary.count(entry);
                /*jslint regexp: false, unparam: false */
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
                           crossedOutGlossary.has(entry) ? ' known' : '') +
                       '" data-num=' + entry.num);
            });
            return tag('thead', thead) + tag('tbody', tbody.join(''));
        }
        function redrawTable(jQueryObj, glossary, crossedOutGlossary) {
            jQueryObj.empty().html(glossaryTableHTML(glossary, crossedOutGlossary));
            sorttable.makeSortable(jQueryObj.get(0));
        }

        // return function (htmlInput, rules, dict) {
        function addWordsToGlossary(glossary, wordTokens, dict) {
            var words = [];                        // list of words to add
            // go through word tokens, build list of words to add
            wordTokens.forEach(function (word) {
                var hasGottenPos = {};
                word.parts.forEach(function (part) {
                    var pos  = part.root.pos,
                        root = part.root.text;
                    // FIXME: this shouldn't be needed, but 'num1' occuring by
                    // themself (e.g. {maH}) cause this.
                    if (pos === undefined || root === undefined) { return; }

                    // FIXME: do only once for each part-of-speech
                    // (this shouldn't be needed, but words like {maH}
                    // sometimes appear twice with same word part-of-speech)
                    if (!hasGottenPos[pos]) {
                        hasGottenPos[pos] = true;
                        [].push.apply(words, dict.query({ tlh: root, pos: pos }));
                    }
                });
            });
            glossary.clear().add(words);           // add words to glossary
        }

        /*************************************************************************\
        **                                                                       **
        **  On Document Load                                                     **
        **                                                                       **
        \*************************************************************************/
        $(function () {
            var dict, rules, glossary, known,
                outputElement = $('section.glossary table'),
                knownElement  = $('section.known    table'),
                analyzeButtonElement = $('button.analyze'),
                inputText = makeInputText({
                    name: 'inputText',
                    saveDelay: 1000,
                    msgDelay: 1500,
                    inputElement:  $('section.input div.input'),
                    lengthElement: $('section.input .wordcount'),
                    statusElement: $('section.input .state')
                });

            function statsMsg(unknown, total, text) {
                var known = Math.round(((total - unknown) / total) * 1000) / 10;
                return unknown + ' unknown (of ' + total + ') – ' + known +
                    '% of ' + text + ' known';
            }

            function clearButton() {
                inputText.set('');
                analyzeButtonElement.triggerHandler('click');
            }
            function exampleTextButton() {
                inputText.set("ghIq ngotlhwI' yIqel. (maw'be'; Hov leng " +
                    "tIvqu' neH). roD DujHeyDaq yo'HeyDaq ghap ghom. patlh ghaj " +
                    "yaSDaj, 'ej batlh cha'maHlogh Qapchugh lunumlu'. tlhIngan " +
                    "nugh, tIgh je neH qel jeSwI'pu'vam. tlhIngan Hol qelchugh, " +
                    "Holna' 'oHbe'. bachbe'bogh nISwI' HIchHey rur. nISwI' " +
                    "lo'DI' bach 'e' lupIHbe'; Hol lo'DI' Qum 'e' lupIHbe' je. " +
                    "Quj tIvbej ghommeyvam, 'ach tlhIngan Hol Dun tIvbe'bej. " +
                    "Hol lughojmo' pop yajchu' jatlhwI' tlhInganmeyHeywI'Daq " +
                    "ghIpDIjtaHDI' bIHe'So' HInughI'chu'!");
                analyzeButtonElement.triggerHandler('click');
            }
            function analyzeButton() {
                var tokens     = tokenizeAndParse(inputText.text, rules),
                    wordTokens = tokens.filter(function (token) {
                        return (token.parts ? true : false);
                    });
                addWordsToGlossary(glossary, wordTokens, dict);
                inputText.set(
                    highlightedUserInput(tokens),
                    wordTokens.length
                ).save();
                $('nav.pagetabs [href="#input"]').trigger('click'); // refresh this tab
            }
            function glossaryTableClick(event) {
                var elem = $(event.target).closest('tr[data-num]'),
                    num  = elem.data('num');
                if (num !== undefined) {       // do stuff
                    if (elem.hasClass('known')) {// make word unknown
                        known.remove(dict.query({ num: num }));
                        elem.removeClass('known');
                    } else {                   //   make word known
                        known.add(dict.query({ num: num }));
                        elem.addClass('known');
                    }
                    redrawTable(knownElement, known);
                }
            }

            function onLoadDictionary(dict) {
                rules    = makeRules(dict);
                glossary = makeGlossary({ dict: dict, name: 'glossary'   });
                known    = makeGlossary({ dict: dict, name: 'knownWords' });
                tmpStatus('<a href="../dict/dict.zdb">Dictionary</a> loaded.');

                initFlashcards({ glossary: glossary, known: known, dict: dict });

                // on page tab click
                $('nav.pagetabs [href="#input"]').on('click', function () {
                    $('.glosscount').html(glossary.length);
                });
                $('nav.pagetabs [href="#glossary"]').on('click', function () {
                    var total   = glossary.length,
                        unknown = glossary.get().filter(function (entry) {
                            return !known.has(entry);
                        }).length;
                    $('section.glossary .stats').html(statsMsg(unknown, total, 'text'));
                    redrawTable(outputElement, glossary, known);
                });
                $('nav.pagetabs [href="#known"]').on('click', function () {
                    var total   = (dict.query({ num: -1 })[0] || { num: 0 }).num,
                        unknown = total - known.length;
                    $('section.known .stats').html(statsMsg(unknown, total, 'dictionary'));
                    redrawTable(knownElement, known);
                });

                if (glossary.length > 0) {
                    redrawTable(outputElement, glossary, known);
                }
                outputElement.addClass('sortable').on('click', glossaryTableClick);
                knownElement.addClass('sortable');
                analyzeButtonElement.removeAttr('disabled').on('click', analyzeButton);
                $('button.clear').removeAttr('disabled').on('click', clearButton);
                $('button.test').removeAttr('disabled').on('click', exampleTextButton);
                $('input.more').on('click', function () {
                    if ($(this).prop('checked')) {
                        $('.advanced').removeClass('hidden');
                    } else {
                        $('.advanced').addClass('hidden');
                    }
                });
                $('nav.pagetabs .selected').trigger('click');
            }

            dict = makeDictionary('../dict/dict.zdb', onLoadDictionary);
        });

    }());


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: tab-storage */

    (function () {
        var magicNumber   = '# http://klingonska.org' + location.pathname + '\n',
            magicNumberRe = new RegExp('^' + magicNumber.replace(/\//g, '\\/')),
            pageElement = $('[role="main"] > .storage'),
            status = (function () {
                var timer, element = $('span', pageElement);
                function init() { return element.empty(); }
                return {
                    show: function (msg, secs) {
                        clearTimeout(timer);
                        init().removeClass('hidden').html(msg);
                        if (secs) { timer = setTimeout(init, secs * 1000); }
                        return element;
                    },
                    hidden: function (msg) {
                        init().addClass('hidden').html(msg);
                        return element;
                    }
                };
            }());

        // Returns list of all keys in localStorage.
        function localStorageKeys() {
            var i, keys = [];
            for (i = 0; i < localStorage.length; i += 1) {
                keys.push(localStorage.key(i));
            }
            return keys.sort();
        }

        // Redraw the HTML table displaying the localStorage.
        function redrawTable() {
            var tableRows = localStorageKeys().map(function (key) {
                var value = localStorage.getItem(key);
                try {
                    // prettify JSON strings by attempting decode + recode
                    // (present as-is if this fails, e.g. for numbers/strings)
                    value = JSON.stringify(JSON.parse(value), null, 4);
                } catch (error) {}
                return tag('tr',
                    tag('th', tag('pre', key) +
                        tag('button', 'Clear', 'data-key="' + key + '"')) +
                    tag('td', tag('pre', value)));
            });
            // join tableRows into string with HTML table, write that to DOM
            $('.storage table').empty().html(
                tag('thead', tag('tr', tag('th', 'Key') + tag('th', 'Value'))) +
                    tag('tbody', tableRows.join(''))
            );
            // attach event to the 'delete' buttons in the new table
            $('.storage table button').on('click', function () {
                var buttonElement = $(this),
                    key = buttonElement.data('key');
                localStorage.removeItem(key);         // delete from localStorage
                buttonElement.closest('tr').remove(); // remove table row
                status.show('Deleted property ‘' + key + '’.', 3);
            });
        }

        // Return Javascript blob with localStorage JSON encoded.
        // (Suitable for writing to file.)
        function localStorageBlob() {
            var state = {}, string = '';
            localStorageKeys().forEach(function (key) {
                var value = localStorage.getItem(key);
                try {
                    value = JSON.parse(value);
                } catch (error) {}
                state[key] = value;
            });
            string = magicNumber + JSON.stringify(state, null, 2);
            return new Blob([ string ], { type: 'application/octet-stream' });
        }

        // Return 'YYYY-MM-DD_MM-HH-SS' string from current time.
        function dateString() {
            var d = new Date(), x = [
                d.getFullYear(), d.getMonth() + 1, d.getDate(),
                d.getHours(), d.getMinutes(), d.getSeconds()
            ];
            return '0-1-2_3-4-5'.replace(/\d/g, function (i) {
                return x[i] < 9 ? '0' + x[i] : x[i]; // pad with one zero
            });
        }

        // Send a proper click event to specified jQuery element.
        // (jQuery's trigger() does not do this properly.)
        function simulateClick(jqueryElement) {
            var event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, true, window, 1,
                0, 0, 0, 0, false, false, false, false, 0, null);
            jqueryElement.get(0).dispatchEvent(event);
        }

        // Download current localStorage state.
        //
        // To download in background, and to suggest a filename for user, the <a>
        // 'download' attribute is needed -- hence we create a HTML anchor tag
        // (hidden from the user in an invisible div), and then emulate a click on
        // it. The data is generated as a 'blob:' url, which is revoked after 10
        // seconds (plenty of time to download, since its all done locally).
        function downloadStorage() {
            var blobUrl, element, filename = dateString() + '.state.txt';
            // create a blob url pointing to JSON of localStorage data
            blobUrl = window.URL.createObjectURL(localStorageBlob());
            // create (hidden) link to blob
            element = status.hidden('<a href="' + blobUrl + '" ' +
                'download="' + filename + '">' + filename + '</a>');
            // simulate a mouse click on link
            simulateClick($('a', element));
            // revoke the blob after 10 seconds
            setTimeout(function () { window.URL.revokeObjectURL(blobUrl); }, 10000);
        }

        // Upload a state file to replace current localStorage.
        function uploadStorage(event) {
            var reader, file = event.target.files[0];
            if (file.type === 'text/plain') {
                reader = new FileReader();
                reader.onloadend = function (event) {  // onload callback
                    var content = event.target.result;
                    try {
                        if (!content.match(magicNumberRe)) {        // check magic number
                            throw new TypeError('Unknown file format');
                        }
                        content = content.replace(magicNumberRe, ''); // remove magic number
                        content = JSON.parse(content);              // parse JSON
                        $.each(content, function (key, value) {     // store each value
                            localStorage.setItem(key, (
                                typeof value === 'object' ?
                                        JSON.stringify(value) : value
                            ));
                        });
                        redrawTable();
                        status.show('File loaded successfully.', 3);
                    } catch (error) {
                        status.show('Failed to read file: ' + error.message, 10);
                    }
                };
                reader.readAsText(file);           // read file
            }
        }

        // set up event triggers
        $('nav.pagetabs [href="#storage"]').on('click', redrawTable);
        $('button.download', pageElement).on('click', downloadStorage);
        $('button.upload', pageElement).on('click', function () {
            $('.storage input[type="file"]').trigger('click');
        });
        $('input', pageElement).on('change', uploadStorage);
        $('button.clear', pageElement).on('click', function () {
            localStorage.clear();
        });

        $(function () {
            window.URL = window.URL || window.webkitURL;
            var warn = [];
            if (!window.URL) {
                warn.push('<i>blob urls</i> (required for downloading)');
                $('button.download', pageElement).attr('disabled', true).
                    attr('title', 'Missing browser support for this feature.');
            }
            if (!FileReader) {
                warn.push('<i>FileReader</i> (required for uploading)');
                $('button.upload', pageElement).attr('disabled', true).
                    attr('title', 'Missing browser support for this feature.');
            }
            if (warn.length) {
                $('p', pageElement).html('Unfortunately your browser does not ' +
                    'support ' + warn.join(', or ') + '. <b>:’(</b>');
            }
        });
    }());


    /*****************************************************************************\
    *******************************************************************************
    \*****************************************************************************/
    /*file: pagetabs */

    // NOTE
    // ====
    // This should load last, so that it may trigger other tab scripts by
    // simulating a click on its tab. (For this to work the receiving end needs
    // to have initialized and be ready to receive.)
    //
    // Page tabs are defined by the <a> children of a <nav class="pagetabs">
    // (only the immediate children of the <nav> element is searched). Each
    // child element should have 'href="#<id>"' set to the class of the
    // corresponding page. The currently selected tab is marked by adding a
    // 'class=selected' (match against this with CSS to highlight the current
    // tab).
    //
    // Pages are child <section> elements of an element with the attribute
    // 'role=main' set. All pages should have 'class=hidden' set, and CSS
    // should be used to hide these pages based on theis class. This script
    // will remove 'class=hidden' for the currently displayed page.
    //
    // A very minimal page with all the required arguments for using this
    // script may look like this (you'll need some CSS too, of course):
    //
    //     <nav class=pagetabs>
    //       <a href="#one">Tab One</a>
    //       <a href="#two">Tab Two</a>
    //     </nav>
    //     <article role=main>
    //       <section class="one hidden">Page One</section>
    //       <section class="two hidden">Page Two</section>
    //     </article>
    //     <script src="page.js"></script>
    //
    // The currently selected tab is stored as a hashlocation in the url, so
    // that on page (re)load, the url determines which tab to open.
    //
    //     tabs = {
    //         "input": {                  // tab name
    //             tab:  <jQuery object>,  //   jQuery DOM object of tab
    //             page: <jQuery object>   //   jQuery DOM object of tab's page
    //         },
    //         ...
    //     }
    //

    $(function () {
        var docTitle = ' \u2013 ' + document.title,
            currentPage = null,
            tabRowTabs  = $('nav.pagetabs > *'),
            defaultTabName = tabRowTabs.eq(0).attr('href').slice(1), // 1st tab
            tabs = {};
        tabRowTabs.each(function () {        // build 'tabs' object
            var tabElem  = $(this),
                tabName  = tabElem.attr('href').slice(1),
                pageElem = $('[role="main"] > section.' + tabName);
            tabs[tabName] = { tab: tabElem, page: pageElem };
        });

        function change() {
            var newTabName = location.hash.slice(1),
                newPage    = tabs[newTabName];
            // on bad hashlocation -- goto default tab (if browser supports it)
            if (!newPage) {
                if (typeof history.replaceState === "function") {
                    window.history.replaceState(null, null, '#' + defaultTabName);
                }
                newPage = tabs[defaultTabName];
            }
            if (currentPage) {
                currentPage.tab.removeClass('selected');  // deselect old tab
                currentPage.page.addClass('hidden');      // hide old page
            }
            newPage.page.removeClass('hidden');// display new page
            newPage.tab.addClass('selected').trigger('click');  // select new tab
            document.title = newTabName + docTitle;
            currentPage = newPage;             // remember current tab
        }

        $(window).on('hashchange', change);
        $(window).trigger('hashchange');
    });

    /*global window, document */
}(window, document));

// eof
