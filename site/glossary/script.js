/*jslint browser: true, regexp: true, todo: true */
/*global $ */
/*

  TODO

  * Color marking should be according to the part-of-speech of the *whole*
    word, while extracted glossary should be the root word (e.g. {ngotlhwI'}
    should be color marked as a noun, but included in the glossary should be
    {ngotlh} "be fanatical").
  * get -wI'- and -ghach- verbs right
  * Explanatory words under input field should be clickable (and enable/disable
    highlight of their respective categories)
  * user should be able to select interpretations by clicking on words in input
    field (to clear up ambiguous words)

  * hover over word in table should highlight word in input field
  * hover over word in cheat-sheet should highlight word in input field

  * remove lines from glossary table (with undo)

  MEBBE LATER
  * add affixes to glossary

 */

(function (document) {
    'use strict';
    var dict, taggedStringPrototype, wordPrototype, clearTimer,
        inputElement, outputElement, tlhSortkey;

    /*************************************************************************\
    **                                                                       **
    ** Dictionary Loader                                                     **
    **                                                                       **
    \*************************************************************************/
    // Object Anatomy
    // --------------
    // {
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
            "adverbial" : "adv",           "conjunction" : "conj",
            "exclamation" : "excl",        "name" : "name",
            "noun" : "n",                  "noun suffix type 1" : "ns1",
            "noun suffix type 2" : "ns2",  "noun suffix type 3" : "ns3",
            "noun suffix type 4" : "ns4",  "noun suffix type 5" : "ns5",
            "numeral" : "num",             "pronoun" : "pro",
            "question word" : "ques",      "verb" : "v",
            "verb prefix" : "vp",          "verb suffix type 1" : "vs1",
            "verb suffix type 2" : "vs2",  "verb suffix type 3" : "vs3",
            "verb suffix type 4" : "vs4",  "verb suffix type 5" : "vs5",
            "verb suffix type 6" : "vs6",  "verb suffix type 7" : "vs7",
            "verb suffix type 8" : "vs8",  "verb suffix type 9" : "vs9",
            "verb suffix type rover" : "vsr"
        };
        /*jslint white: false */
        // dictionary data preprocessing (strip header + footer etc.)
        data = data.replace(/^[\s\S]*\n=== start-of-word-list ===\n+/, ''); // head
        data = data.replace(/\n+=== end-of-word-list ===\n[\s\S]*$/, '');   // foot
        data = data.replace(/[«»<>]+/g, '');     // remove translation tags
        data = data.replace(/\n\t/g, ' ');       // unwrap long lines
        data.split(/\n{2,}/).forEach(function (chunk) {
            var entry = {}, tlh, pos;          // create dictionary entry
            chunk.split(/\n/).map(function (line) {
                var keyval = line.split(/:\s+/, 2);
                entry[keyval[0]] = keyval[1];
            });

            // extract info from entry
            tlh = (entry.tlh.match(/\{(.*?)\}/))[1]; // Klingon word
            pos = posAbbrev[entry.pos];              // part-of-speech

            // add entry to dictionary
            if (!dict[tlh]) {                  // create empty entry for word
                dict[tlh] = { "tags": [] };
            }
            if (dict[tlh].tags.indexOf(pos) === -1) {
                dict[tlh].tags.push(pos);           //   add part-of-speech
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
    //     text: "pIqaD",
    //     tags: [ "v", "n" ],
    //     syllables: [
    //         {
    //             text: "pI",            // actual syllable
    //             tags: [ "vp" ]         // part-of-speech
    //         }, {
    //             text: "qaD",           // actual syllable
    //             tags: [ "v" ]          // part-of-speech
    //         }
    //     ],
    //     roots: {
    //         "pIqaD": [ "n" ],
    //         "qaD":   [ "v" ]
    //     }
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
    (function (that) {
        /*jslint white: true */
        var suffixTable = {
            "'a'"  : ['ns1', 'vs9'], "'e'"  : ['ns5'],        "'egh" : ['vs1'],
            "'uy'" : ['num1'],       "DI'"  : ['vs9'],        "DIch" : ['num2'],
            "Daj"  : ['ns4'],        "Daq"  : ['ns5'],        "Du'"  : ['ns2'],
            "Ha'"  : ['vsr'],        "Hey"  : ['ns3'],        "Hom"  : ['ns1'],
            "Qo'"  : ['vsr'],        "SaD"  : ['num1'],       "SanID": ['num1'],
            "bIp"  : ['num1'],       "ba'"  : ['vs6'],        "be'"  : ['vsr'],
            "beH"  : ['vs2'],        "bej"  : ['vs6'],        "bogh" : ['vs9'],
            "chaj" : ['ns4'],        "choH" : ['vs3'],        "chu'" : ['vs6'],
            "chugh": ['vs9'],        "chuq" : ['vs1'],        "ghach": ['vs9'],
            "jaj"  : ['vs9'],        "lI'"  : ['ns4', 'vs7'], "lIj"  : ['ns4'],
            "laH"  : ['vs5'],        "law'" : ['vs6'],        "logh" : ['num2'],
            "lu'"  : ['vs5'],        "ma'"  : ['ns4'],        "maH"  : ['num1'],
            "maj"  : ['ns4'],        "meH"  : ['vs9'],        "mey"  : ['ns2'],
            "mo'"  : ['ns5', 'vs9'], "moH"  : ['vs4'],        "nIS"  : ['vs2'],
            "na'"  : ['ns3'],        "neS"  : ['vs8'],        "netlh": ['num1'],
            "oy"   : ['ns1'],        "pa'"  : ['vs9'],        "pu'"  : ['ns2', 'vs7'],
            "qa'"  : ['vs3'],        "qang" : ['vs2'],        "qoq"  : ['ns3'],
            "qu'"  : ['vsr'],        "ra'"  : ['ns4'],        "raj"  : ['ns4'],
            "rup"  : ['vs2'],        "ta'"  : ['vs7'],        "taH"  : ['vs7'],
            "vIS"  : ['vs9'],        "vIp"  : ['vs2'],        "vaD"  : ['ns5'],
            "vam"  : ['ns4'],        "vatlh": ['num1'],       "vetlh": ['ns4'],
            "vo'"  : ['ns5'],        "wI'"  : ['ns4', 'vs9'], "wIj"  : ['ns4']
        }, prefixTable = {
            "bI" : ['vp'],  "bo" : ['vp'],  "che": ['vp'],  "cho": ['vp'],
            "Da" : ['vp'],  "DI" : ['vp'],  "Du" : ['vp'],  "gho": ['vp'],
            "HI" : ['vp'],  "jI" : ['vp'],  "ju" : ['vp'],  "lI" : ['vp'],
            "lu" : ['vp'],  "ma" : ['vp'],  "mu" : ['vp'],  "nI" : ['vp'],
            "nu" : ['vp'],  "pe" : ['vp'],  "pI" : ['vp'],  "qa" : ['vp'],
            "re" : ['vp'],  "Sa" : ['vp'],  "Su" : ['vp'],  "tI" : ['vp'],
            "tu" : ['vp'],  "vI" : ['vp'],  "wI" : ['vp'],  "yI" : ['vp']
        };
        /*jslint white: false */

        // split a Klingon word into syllables
        function splitSyllable(word) {
            return word.split(/(?=(?:[bDHjlmnpqQrStvwy\']|ch|gh|ng|tlh)[aeIou])/);
        }

        // insert part-of-speech tags into words that turn out to be nouns
        function analyzeNoun(wordObject) {
            var isNouny = false, count = 0, root = "", pos = [];
            isNouny = wordObject.syllables.every(function (syllable) {
                count += 1;
                if (count === 1) {
                    root = syllable.getText();
                    pos = syllable.getTags(['n', 'name', 'pro']);
                    return pos.length;
                }
                return syllable.hasTag(['ns1', 'ns2', 'ns3', 'ns4', 'ns5']);
            });
            if (isNouny) {
                wordObject.addTag(pos);
                wordObject.addRoot(root, pos);
            }
        }
        // insert part-of-speech tags into words that turn out to be verbs
        // FIXME: cope with -wI'- and -ghach- verbs
        function analyzeVerb(wordObject) {
            var isVerby = false, count = 0, root = "", pos = [];
            isVerby = wordObject.syllables.every(function (syllable) {
                count += 1;
                if (count === 1) {
                    if (syllable.hasTag(['vp'])) { count -= 1; return true; }
                    root = syllable.getText();
                    pos = syllable.getTags(['v', 'pro']);
                    return pos.length;
                }
                return syllable.hasTag(['vs1', 'vs2', 'vs3', 'vs4', 'vs5',
                    'vs6', 'vs7', 'vs8', 'vs9', 'vsr']);
            });
            if (isVerby) {
                wordObject.addTag(pos);
                wordObject.addRoot(root, pos);
            }
        }
        // insert part-of-speech tags into words that turn out to be numbers
        function analyzeNumber(wordObject) {
            var isNumbery = false, count = 0, root = "", pos = [];
            isNumbery = wordObject.syllables.every(function (syllable) {
                count += 1;
                if (count === 1) {
                    root = syllable.getText();
                    pos = syllable.getTags(['num', 'num1', 'num2']);
                }
                return syllable.hasTag(['num', 'num1', 'num2']);
            });
            if (isNumbery) {
                wordObject.addTag(pos);
                wordObject.addRoot(root, pos);
            }
        }
        // insert part-of-speech tags into words that turn out to be {chuvmey}
        function analyzeTheRest(wordObject) {
            var syllables = wordObject.syllables, root = "", pos = [];
            if (syllables.length === 1) {
                root = syllables[0].getText();
                pos = syllables[0].getTags(['adv', 'conj', 'excl', 'ques']);
                if (pos.length > 0) {
                    wordObject.addTag(pos);
                    wordObject.addRoot(root, pos);
                }
            }
        }
        that.addRoot = function (word, pos) {
            var tagProp;
            if (Object.prototype.toString.call(pos) !== '[object Array]') {
                throw new TypeError("Argument must be array");
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
        that.setText = function (text) {
            var word = this, count = 1;
            if (text === word.text) { return word; } // skip if unchanged
            word.text = text;
            word.roots = {};
            word.setTags([]);
            word.syllables = splitSyllable(text).map(function (text) {
                var part = makeTaggedString(text, []);
                if (count === 1) {                 // possible prefix
                    part.addTag(prefixTable[text] || []);
                }
                if (count <= 2) {                  // possible root
                    part.addTag(dict[text] ? dict[text].tags : []);
                }
                if (count > 1) {                   // possible suffix
                    part.addTag(suffixTable[text] || []);
                }
                count += 1;
                return part;
            });
            analyzeNoun(word);
            analyzeVerb(word);
            analyzeNumber(word);
            analyzeTheRest(word);
            return word;
        };
    }(wordPrototype));
    function makeWord(text, tags) {
        var f = Object.create(wordPrototype);
        return f.setText(text  || "", tags || []);
    }

    /*************************************************************************\
    **                                                                       **
    ** Main Program Functions                                                **
    **                                                                       **
    \*************************************************************************/
    // var inputElement = $('#input');
    // function getInput() {
    //     return $('#input').text();
    // }

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

    function analyze(lang) {
        var glossary = {}, tokens, html,
            // read input & convert unicode apostrophes to ascii
            text     = inputElement.text().replace(/[\u2018\u2019]/g, "'"),
            splitted = text.split(/([^a-z\']+)/i);  // split into tokens

        // process tokens (= word or inter-word space)
        tokens = splitted.map(function (text) {
            if (text.match(/^[^a-z\']/i)) {     // punctuation
                return makeTaggedString(text, [ analyzeSpace(text) ]);
            }
            return makeWord(text);             // word
        });

        // glossary = {
        //     "bach": {
        //         text: "bach",
        //         tags: [ "n", "v" ],
        //         count: 2
        //     },
        // }
        //
        // go through processed tokens, generate glossary
        tokens.forEach(function (wordObject) {
            var tags;
            if (wordObject.roots) {               // for each word
                Object.keys(wordObject.roots).forEach(function (root) {
                    tags = wordObject.roots[root];
                    if (glossary[root]) {          //   already existing word
                        glossary[root].addTag(tags);
                        glossary[root].count += 1;
                    } else {                       //   new word
                        glossary[root] = makeTaggedString(root, tags);
                        glossary[root].count = 1;
                    }
                });
            }
        });

        // go through processed tokens, generate HTML output
        html = tokens.map(function (obj) {
            if (!obj.syllables) {              // space and/or punctuation
                var text = obj.getText(), tags = obj.getTags().join(' ');
                return '<span title="' + tags + '">' + text + '</span>';
            }                                  // a word
            return '<span class="' + obj.getTags().join(' ') + '">' +
                obj.syllables.map(function (obj) {
                    var text = obj.getText(), tags = obj.getTags().join(' ');
                    return '<span title="' + tags + '">' + text + '</span>';
                }).join('') +
                '</span>';
        }).join('');

        inputElement.html(html);
        // output glossary
        output('<table class=sortable>' +
            '  <thead><tr><th><th>Klingon<th>Pos<th>English</thead>' +
            '  <tbody>' +
            Object.keys(glossary).sort(byKlingon).map(function (key) {
                var obj = glossary[key], text = obj.text,
                    tags = obj.tags, count = obj.count;
                return tags.map(function (tag) {
                    var prettyText = text.replace(/\'/g, '&rsquo;');
                    return '    <tr class=' + tag + '>' +
                        '      <td align=center>' + count + '</td>' +
                        '      <td sorttable_customkey="' + tlhSortkey(text) + '">' +
                            '<b lang=tlh>' + prettyText + '</b></td>' +
                        '      <td align=center>' + tag + '</td>' +
                        '      <td>' + dict[text][tag][lang] + '</td>' +
                        '    </tr>';
                }).join('');
            }).join('') +
            '  </tbody>' +
            '</table>' +
            '<script src="../includes/sorttable.js"></script>');
    }
    function analyze_en() { analyze('en'); }
    function analyze_sv() { analyze('sv'); }

    /*************************************************************************\
    **                                                                       **
    ** On Page Ready                                                         **
    **                                                                       **
    \*************************************************************************/
    $(document).ready(function () {
        outputElement = $('#output');
        inputElement = $('#input');
        $('button[lang|=en]').click(analyze_en);   // connect 'Analyze' button to function
        $('button[lang|=sv]').click(analyze_sv);   // connect 'Analyze' button to function
        $('#input').focus();          // focus input area

        // load dictionary data
        $.get('../dict/dict.zdb', function (data) {
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
    function setLang(lang) {
        $(document.documentElement).attr('data-lang', lang);
    }
    $(document).ready(function () {
        setLang('en');  // default langue = english
        // call language change whenever user changes <select class=lang>
        $('select.lang').change(function () { setLang(this.value); });
    });
}(document));

//eof
