/*jslint browser: true, regexp: true, todo: true */
/*global $ */
/*

 * Glossary table freqency count should be dependant on PoS.
 * Totals word count for glossary table.
 * paghlogh / Hochlogh / paghDIch / HochDIch
 * Number lines in glossary table?
 * Create FSM from dictionary.
   * should prolly not use numbers from dictionary (since those are defined in
     program itself)
   * avoid duplicated words from dictionary (e.g. bachwI' is both in dict and
     can be derived from rules)

 * parseZDB() should not be in the global scope
 * result of {maH} looks bad

TEST CASES
==========
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

// Usage: parseZDB(data, func);
//
// Chew through a ZDB database, calling 'func' for each entry. 'func' will be
// passed entry object looking like this:
//
//     {
//         "tlh" : "{bach} [2]",
//         "pos" : "noun",
//         "sv"  : "skott",   // any «...» and <...> stripped
//         "en"  : "shot",    // any «...» and <...> stripped
//         "def" : "TKD",
//         "cat" : "fighting",
//         "data": "KLCP-1",
//         "file": "1992-01-01-tkd.txt",
//     }
//
function parseZDB(data, func) {
    'use strict';
    // dictionary data preprocessing (strip header + footer etc.)
    data = data.replace(/^[\s\S]*\n=== start-of-word-list ===\n+/, ''); // head
    data = data.replace(/\n+=== end-of-word-list ===\n[\s\S]*$/, '');   // foot
    data = data.replace(/[«»<>]+/g, '');       // remove translation tags
    data = data.replace(/\n\t/g, ' ');         // unwrap long lines
    data.split(/\n{2,}/).forEach(              // foreach entry
        function (entry) {
            var obj = {};                      //   init entry object
            entry.split(/\n/).forEach(         //     for each field
                function (field) {             //       insert key/value
                    var keyval = field.split(/:\s+/, 2);
                    obj[keyval[0]] = keyval[1];
                }
            );
            func(obj);                         //    invoke callback w/ object
        }
    );
}


/*****************************************************************************\
**                                                                           **
** ECMAScript 5 Compatibility Functions for Older Browsers                   **
**                                                                           **
\*****************************************************************************/
(function () {
    'use strict';
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

(function (document) {
    'use strict';
    /*jslint white: true */
    var dict, subrulesPrototype, baserulesPrototype,
        taggedStringPrototype, wordPrototype, clearTimer,
        inputElement, outputElement, tlhSortkey,
        isRoot = {
            'adv'  : true,  'conj' : true,  'excl' : true,  'n'    : true,
            'name' : true,  'num'  : true,  'pro'  : true,  'ques' : true,
            'v'    : true,
            // empty pos = non-final syllable of multi syllable word
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


    /*************************************************************************\
    **                                                                       **
    ** Word Parse Subrules                                                   **
    **                                                                       **
    \*************************************************************************/
    // Subrules contains a Finite-State Machine, in the form of a rule 'tree'
    // (in quotes since this structure may contain references itself and other
    // cyclic structures). In contrast with the 'baserule' object, no branch
    // may split in two directions simultaneously (each 'rules' attribute
    // contains a reference to a single other subrule, instead of an array of
    // such references).
    //
    // The rule tree can e.g. be traversed to figure out the part-of-speech for
    // a Klingon word (split into syllables). Let's say that you want to know
    // the part-of-speech for the word {Dabachqa'}.
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
    function makeSubrules() {
        return Object.create(subrulesPrototype);
    }
    subrulesPrototype = {
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

    /*************************************************************************\
    **                                                                       **
    ** Word Parse Base Rules (extends 'Word Parse Subrules')                 **
    **                                                                       **
    \*************************************************************************/
    function makeBaserules() {
        return Object.create(baserulesPrototype);
    }
    baserulesPrototype = Object.create(subrulesPrototype);
    (function (that) { //... }(baserulesPrototype));
        that.addRule = function (syllables, tag, trailingRules) {
            var head = syllables[0],           // syllable to process
                tail = syllables.slice(1),     // remaining syllables
                index = null;
            if (this[head]) {                  // if syllable rule exists
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
    function getRules(data) {
        /*jslint white: true */
        var vsRules  = makeSubrules(), nsRules = makeSubrules(),
            numRules = makeSubrules(), verbRules = makeSubrules(),
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
        parseZDB(data, function (entry) {
            var tlh = (entry.tlh.match(/\{(.*?)\}/))[1], // Klingon word
                pos = posAbbrev[entry.pos],              // part-of-speech
                sylls = splitSyllable(tlh);
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



    /*************************************************************************\
    **                                                                       **
    ** Dictionary Loader                                                     **
    **                                                                       **
    \*************************************************************************/
    // Object Anatomy
    // --------------
    // dict = {
    //     "bach": {
    //         pos: "v n",
    //         "v": {
    //                "tlh": "{bach} [1]",
    //                "pos": "verb",
    //                "en": "shoot",
    //                ...
    //         },
    //         "n": {
    //                "tlh": "{bach} [2]",
    //                "pos": "noun",
    //                "en": "shot",
    //                ...
    //         },
    //     },
    //     ...
    // }
    //
    // Usage: loadDictionary(data, dict);
    //
    // Loads 'data', dictionary data in ZDB format, and loads it into the
    // specified 'dict' object.
    //
    // Dictionary data can be loaded from: http://klingonska.org/dict/dict.zdb
    // FIXME: Convert to singleton module pattern
    dict = {};
    function loadDictionary(data, dict) {
        /*jslint white: true */
        var posAbbrev = {
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

        parseZDB(data, function (entry) {
            var tlh = (entry.tlh.match(/\{(.*?)\}/))[1], // Klingon word
                pos = posAbbrev[entry.pos];              // part-of-speech

            // add entry to dictionary
            if (!dict[tlh]) {                  // create empty entry for word
                dict[tlh] = { "tags": [] };
            }
            if (dict[tlh].tags.indexOf(pos) === -1) {
                dict[tlh].tags.push(pos);      //   add part-of-speech
            }
            dict[tlh][pos] = entry;            //   insert actual entry
        });
    }

    /*************************************************************************\
    **                                                                       **
    ** TaggedString Maker                                                    **
    **                                                                       **
    \*************************************************************************/
    // Object Anatomy
    // --------------
    // taggedString = {
    //     text: "Da",            // text
    //     tags: [ "vp", "v" ],   // part-of-speech
    // }
    //
    // 'text' may contain any string (default: ""). 'tags' may contain any number
    // of (being true, or unset). Tags are get/set using array arguments, but
    // only non-existing tags are added (meaning that all tags occur only once).
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
    //
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
    function makeTaggedString(text, tags) {
        var f = Object.create(taggedStringPrototype);
        return f.setText(text  || "", tags || []);
    }

    /*************************************************************************\
    **                                                                       **
    ** Word Maker                                                            **
    **                                                                       **
    \*************************************************************************/
    // Object Anatomy
    // --------------
    // word = {
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
    // word.setText() -- analyzes and sets the 'syllables' part of the object.
    //
    // word.setTags() is inherited from taggedString.
    //
    wordPrototype = Object.create(taggedStringPrototype);
    (function (that) { //... }(wordPrototype));
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
            var syllables = splitSyllable(word),
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
        that.setText = function (text, rules) {
            var that = this;
            if (text === this.text) { return this; } // skip if unchanged
            this.text  = text;
            this.parts = analyzeWord(text, rules);
            this.setTags(this.parts.map(function (part) {
                return isPos[part.parts[part.parts.length - 1].pos];
            }));
            this.roots = {};
            this.parts.forEach(function (part) {
                that.roots[part.root.text] = [part.root.pos];
            });
            return this;
        };
    }(wordPrototype));
    function makeWord(text, rules) {
        var f = Object.create(wordPrototype);
        return f.setText(text  || "", rules || {});
    }

    /*************************************************************************\
    **                                                                       **
    ** Main Program Functions                                                **
    **                                                                       **
    \*************************************************************************/
    function tmpOutput(msg) {
        clearTimeout(clearTimer);
        outputElement.html(msg);
        clearTimer = setInterval(function () {
            outputElement.html('');
        }, 1500);
    }

    function output(msg) {
        clearTimeout(clearTimer);
        outputElement.html(msg);
    }

    function analyzeSpace(text) {
        if (text.match(/[.!?]/)) {             // full stop
            return 'sf';                       //   separator, full stop
        }
        if (text.match(/[,;:()]/)) {           // half stop
            return 'sh';                       //   separator, half stop
        }                                      // space
        return 'ss';                           //   separator, space
    }

    tlhSortkey = (function () {
        /*jslint white: true */
        var transl = {
            "a"  : "a",   "b" : "b",   "ch": "c",   "D" : "d",   "e" : "e",
            "gh" : "f",   "H" : "g",   "I" : "h",   "j" : "i",   "l" : "j",
            "m"  : "k",   "n" : "l",   "ng": "m",   "o" : "n",   "p" : "o",
            "q"  : "p",   "Q" : "q",   "r" : "r",   "S" : "s",   "t" : "t",
            "tlh": "u",   "u" : "v",   "v" : "w",   "w" : "x",   "y" : "y",
            "'"  : "z"
        };
        /*jslint white: false */
        // split a Klingon word into characters (doesn't cope with puncuation)
        function splitCharacter(word) {
            return word.split(/(?=[abDeHIjmnopqQrStuvwy\']|[cg]h|ng|tlh|l(?!h))/);
        }
        return function (word) {
            return splitCharacter(word).map(function (character) {
                return transl[character] || '';
            }).join('');
        };
    }());

    // sorting function, use `array.sort(byKlingon)` to sort in Klingon
    // alphabetical order
    function byKlingon(a, b) {
        var x = tlhSortkey(a), y = tlhSortkey(b);
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
    }

    function tokenizeAndParse(text, rules) {
        var tokens = text.split(/([^a-z\']+)/i); // split text into tokens
        return tokens.map(function (token) {   // process tokens (= word or inter-word space)
            if (token.match(/^[a-z\']/i)) {    // word
                return makeWord(token, rules);
            }                                  // punctuation
            return makeTaggedString(token, [ analyzeSpace(token) ]);
        });
    }

    function analyze(text, rules, lang) {
        var glossary = {},
            tokens   = tokenizeAndParse(text, rules),
            words    = tokens.filter(function (token) {
                return (token.parts ? true : false);
            }),
            html;

        $('#textcount').html(words.length); // output word count


        // CONTINUE HERE

        // glossary = {
        //     "bach": {
        //         text: "bach",
        //         tags: [ "n", "v" ],
        //         count: 2
        //     },
        // }
        //
        // go through processed tokens, generate glossary
        words.forEach(function (word) {
            word.parts.forEach(function (part) {
                var root = part.root,
                    tag  = root.pos,
                    text = root.text;
                if (glossary[text]) {          //   already existing word
                    glossary[text].addTag([tag]);
                    glossary[text].count += 1;
                } else {                       //   new word
                    glossary[text] = makeTaggedString(text, [tag]);
                    glossary[text].count = 1;
                }
            });
        });
        //alert(JSON.stringify(glossary, null, 2));

        // go through processed tokens, generate HTML output
        html = tokens.map(function (obj) {
            var title;
            if (!obj.parts) {              // space and/or punctuation
                return '<span title="' + obj.pos + '"><span>' + obj.text + '</span></span>';
            }                                  // a word
            title = obj.parts.map(function (part) {
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

        inputElement.html(html);
        // output glossary
        output('<table class="sortable">' +
            '<thead><tr><th><th>Klingon<th>Pos<th>' +
            '<span class=unzap title="Undo word remove.">↶</span>English</thead>' +
            '<tbody>' +
            Object.keys(glossary).sort(byKlingon).map(function (key) {
                var obj = glossary[key], text = obj.text,
                    tags = obj.tags, count = obj.count;
                return tags.map(function (tag) {
                    var prettyText = text.replace(/\'/g, '&rsquo;');
                    return '<tr class=' + tag + '>' +
                        '<td align=center>' + count + '</td>' +
                        '<td sorttable_customkey="' + tlhSortkey(text) + '">' +
                        '<b lang=tlh>' + prettyText + '</b></td>' +
                        '<td align=center>' + tag + '</td>' +
                        '<td><span class=zap title="Remove this word.">×</span>' +
                        (dict[text] ? dict[text][tag][lang] : 'N/A') +
                        '</td>' +
                        '</tr>';
                }).join('');
            }).join('') +
            '</tbody>' +
            '</table>' +
            '<script src="../includes/sorttable.js"></script>' +
            '<script src="zaptablerow.js"></script>');
    }

    /*************************************************************************\
    **                                                                       **
    ** On Page Ready                                                         **
    **                                                                       **
    \*************************************************************************/
    $(document).ready(function () {
        var rules;
        outputElement = $('#output');
        inputElement  = $('#input');
        inputElement.focus();
        function doAnalyze(lang) {
            var text = inputElement.text().        // get input text
                replace(/[\u2018\u2019]/g, "'");   // de-unicode apostrophes
            analyze(text, rules, lang);
        }
        $('button[lang|=en]').click(function () { doAnalyze('en'); });
        $('button[lang|=sv]').click(function () { doAnalyze('sv'); });
        $.get('../dict/dict.zdb', function (data) {  // load dictionary
            rules = getRules(data);
            loadDictionary(data, dict);
            tmpOutput('<a href="../dict/dict.zdb">Dictionary</a> loaded.');
            //output('<pre>' + JSON.stringify(dict, null, 4) + '</pre>');
        });
    });


}(document)); // passed in for minifying purposes


/*****************************************************************************\
**                                                                           **
** Page Language Selector                                                    **
**                                                                           **
\*****************************************************************************/

// This should be used with a <select class=lang> on your page. An onChange
// event is added to that, which, on selection sets 'data-lang' of the <html>
// attribute, so that you may use CSS to show/hide various elements on the
// page.
(function (document) {
    'use strict';
    // set 'data-lang' attribute of <html> element
    $(document).ready(function () {
        function setLang(lang) {
            $(document.body).attr('data-lang', lang);
        }
        setLang('en');  // default langue = english
        // call language change whenever user changes <select class=lang>
        $('select.lang').change(function () { setLang(this.value); });
    });
}(document));

//eof
