/*

  TODO
  * get -wI'- and -ghach- verbs right
  * Explanatory words under input field should be clickable
    (and enable/disable highlight of their respective categories)
  * user should be able to select interpretations by clicking on words in input
    field (to clear up ambiguous words)

  * hover over word in table should highlight word in input field
  * hover over word in cheat-sheet should highlight word in input field

  * remove lines from glossary table (with undo)

  MEBBE LATER
  * add affixes to glossary

 */

//(function (document, window) {

    // var inputElement = $('#input');
    // function getInput() {
    //     return $('#input').text();
    // }

    var clearTimer;
    var outputElement = $('#output');
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
        if (text.match(/[.!?]/)) {              // full stop
            return 'sf'                        //   separator, full stop
        } else if (text.match(/[,;:()]/)) {     // half stop
            return 'sh'                        //   separator, half stop
        } else {                               // space
            return 'ss'                        //   separator, space
        }
    }

    var inputElement = $('#input');
    function analyze_en() { analyze('en'); }
    function analyze_sv() { analyze('sv'); }
    function analyze(lang) {
        var glossary = {}, tokens, html,
            // read input & convert unicode apostrophes to ascii
            text     = inputElement.text().replace(/[\u2018\u2019]/g, "'"),
            splitted = text.split(/([^a-z\']+)/i);  // split into tokens

        // process tokens (= word or inter-word space)
        tokens = splitted.map(function (text) {
            if (text.match(/^[^a-z\']/i)) {     // punctuation
                return makeTaggedString(text, [ analyzeSpace(text) ]);
            } else {                           // word
                return makeWord(text);
            }
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
            if (!obj.syllables) {                  // space and/or punctuation
                var text = obj.getText(), tags = obj.getTags().join(' ');
                return '<span title="' + tags + '">' + text + '</span>';
            } else {                           // a word
                return '<span class="' + obj.getTags().join(' ') + '">' +
                    obj.syllables.map(function (obj) {
                        var text = obj.getText(), tags = obj.getTags().join(' ');
                        return '<span title="' + tags + '">' + text + '</span>';
                    }).join('') +
                    '</span>';
            }
        }).join('');

        inputElement.html(html);
        // output glossary
        output('' +
            '<table class="sortable">' +
            '  <thead><tr><th><th>Klingon<th>Pos<th>English</thead>' +
            '  <tbody>' +
            Object.keys(glossary).sort().map(function (key) {
                var obj = glossary[key], text = obj.text,
                    tags = obj.tags, count = obj.count;
                return tags.map(function(tag) {
                return '' +
                    '    <tr>' +
                    '      <td align=center>' + count + '</td>' +
                    '      <td><b>' + text.replace(/\'/g, '&rsquo;') + '</b></td>' +
                    '      <td align=center>' + tag + '</td>' +
                    '      <td>' + dict[text][tag][lang] + '</td>' +
                    '    </tr>';
                    }).join('');
            }).join('') +
            '  </tbody>' +
            '</table>' +
            '<script src="../includes/sorttable.js"></script>');
    }

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
    var dict = {}; // bach: v : { ... }
    function loadDictionary(data, dict) {
        var posAbbrev = {
            "adverbial" : "adv",               "conjunction" : "conj",
            "exclamation" : "excl",            "name" : "name",
            "noun" : "n",                      "noun suffix type 1" : "ns1",
            "noun suffix type 2" : "ns2",      "noun suffix type 3" : "ns3",
            "noun suffix type 4" : "ns4",      "noun suffix type 5" : "ns5",
            "numeral" : "num",                 "pronoun" : "pro",
            "question word" : "ques",          "verb" : "v",
            "verb prefix" : "vp",              "verb suffix type 1" : "vs1",
            "verb suffix type 2" : "vs2",      "verb suffix type 3" : "vs3",
            "verb suffix type 4" : "vs4",      "verb suffix type 5" : "vs5",
            "verb suffix type 6" : "vs6",      "verb suffix type 7" : "vs7",
            "verb suffix type 8" : "vs8",      "verb suffix type 9" : "vs9",
            "verb suffix type rover" : "vsr",
        };
        // dictionary data preprocessing (strip header + footer etc.)
        data = data.replace(/^[^]*\n=== start-of-word-list ===\n+/, ''); // head
        data = data.replace(/\n+=== end-of-word-list ===\n[^]*$/, '');   // foot
        data = data.replace(/[«»<>]+/g, '');     // remove translation tags
        data = data.replace(/\n\t/g, ' ');       // unwrap long lines
        data.split(/\n{2,}/).forEach(function (chunk) {
            var entry = {};                    // create dictionary entry
            chunk.split(/\n/).map(function (line) {
                var keyval = line.split(/:\s+/, 2);
                entry[keyval[0]] = keyval[1];
            });

            // extract info from entry
            var tlh = ( entry.tlh.match(/\{(.*?)\}/) )[1];  // Klingon word
            var pos = posAbbrev[entry.pos];                 // part-of-speech

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
    var taggedStringPrototype = {};
    (function (that) {
        that.getText = function () { return this.text };
        that.setText = function (text, tags) {
            if (text === this.text) { return this }
            this.text = text;
            this.setTags(tags || []);
            return this;
        };
        that.addTag = function (tags) {
            if (Object.prototype.toString.call(tags) !== '[object Array]') {
                throw new TypeError("Argument must be array");
            }
            var tagProp = this.tags;
            tags.forEach(function (text) {
                if (tagProp.indexOf(text) === -1) { tagProp.push(text) }
            });
            return this;
        };
        that.getTags = function (tags) {
            var that = this;
            if (tags === undefined) { return that.tags }
            if (Object.prototype.toString.call(tags) !== '[object Array]') {
                throw new TypeError("Argument must be array");
            }
            return tags.filter(function (tag) {
                return (that.tags.indexOf(tag) >= 0);
            });
        };
        that.hasTag = function (tags) {
            if (Object.prototype.toString.call(tags) !== '[object Array]') {
                throw new TypeError("Argument must be array");
            }
            var that = this;
            return tags.some(function (tag) {
                return (that.tags.indexOf(tag) >= 0);
            });
        };
        that.setTags = function (tags) {
            this.tags = [];
            return this.addTag(tags);
        };
    }(taggedStringPrototype));
    function makeTaggedString (text, tags) {
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
    var wordPrototype = Object.create(taggedStringPrototype);
    (function (that) {
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
            "vo'"  : ['ns5'],        "wI'"  : ['ns4', 'vs9'], "wIj"  : ['ns4'],
        };
        var prefixTable = {
            "bI" : ['vp'],  "bo" : ['vp'],  "che": ['vp'],  "cho": ['vp'],
            "Da" : ['vp'],  "DI" : ['vp'],  "Du" : ['vp'],  "gho": ['vp'],
            "HI" : ['vp'],  "jI" : ['vp'],  "ju" : ['vp'],  "lI" : ['vp'],
            "lu" : ['vp'],  "ma" : ['vp'],  "mu" : ['vp'],  "nI" : ['vp'],
            "nu" : ['vp'],  "pe" : ['vp'],  "pI" : ['vp'],  "qa" : ['vp'],
            "re" : ['vp'],  "Sa" : ['vp'],  "Su" : ['vp'],  "tI" : ['vp'],
            "tu" : ['vp'],  "vI" : ['vp'],  "wI" : ['vp'],  "yI" : ['vp'],
        };
        // split a Klingon word into syllables
        function splitSyllable (word) {
            return word.split(/(?=(?:[bDHjlmnpqQrStvwy\']|ch|gh|ng|tlh)[aeIou])/);
        }

        // insert part-of-speech tags into words that turn out to be nouns
        function analyzeNoun (wordObject) {
            var isNouny = false, count = 0, root = "", pos = [];
            isNouny = wordObject.syllables.every(function (syllable) {
                count += 1;
                if (count === 1) {
                    root = syllable.getText();
                    pos = syllable.getTags(['n', 'name', 'pro']);
                    return pos.length;
                } else {
                    return syllable.hasTag(['ns1', 'ns2', 'ns3', 'ns4', 'ns5']);
                }
            });
            if (isNouny) {
                wordObject.addTag(pos);
                wordObject.addRoot(root, pos);
            }
        }
        // insert part-of-speech tags into words that turn out to be verbs
        // FIXME: cope with -wI'- and -ghach- verbs
        function analyzeVerb (wordObject) {
            var isVerby = false, count = 0, root = "", pos = [];
            isVerby = wordObject.syllables.every(function (syllable) {
                count += 1;
                if (count === 1) {
                    if ( syllable.hasTag(['vp']) ) { count -= 1; return true; }
                    root = syllable.getText();
                    pos = syllable.getTags(['v', 'pro']);
                    return pos.length;
                } else {
                    return syllable.hasTag(['vs1', 'vs2', 'vs3', 'vs4', 'vs5',
                        'vs6', 'vs7', 'vs8', 'vs9', 'vsr']);
                }
            });
            if (isVerby) {
                wordObject.addTag(pos);
                wordObject.addRoot(root, pos);
            }
        }
        // insert part-of-speech tags into words that turn out to be numbers
        function analyzeNumber (wordObject) {
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
        function analyzeTheRest (wordObject) {
            var syllables = wordObject.syllables;
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
            if (!this.roots) { this.roots = {} }
            if (!this.roots[word]) {            // set (if unset)
                this.roots[word] = pos;
            } else {                           // add to existing values
                tagProp = this.roots[word];
                pos.forEach(function (pos) {
                    if (tagProp.indexOf(pos) === -1) { tagProp.push(pos) }
                });
            }
        }

        that.setText = function (text) {
            var word = this, count = 1;
            if (text === word.text) { return word } // skip if unchanged
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
    function makeWord (text, tags) {
        var f = Object.create(wordPrototype);
        return f.setText(text  || "", tags || []);
    }

    /*************************************************************************\
    **                                                                       **
    ** On Page Ready                                                         **
    **                                                                       **
    \*************************************************************************/
    $(document).ready(function () {
        var prevInput;
        $('#en').click(analyze_en);   // connect 'Analyze' button to function
        $('#sv').click(analyze_sv);   // connect 'Analyze' button to function
        $('#input').focus();          // focus input area

        // load dictionary data
        $.get('../dict/dict.zdb', function (data) {
            loadDictionary(data, dict);
            tmpOutput('<a href="../dict/dict.zdb">Dictionary</a> loaded.');
            //output('<pre>' + JSON.stringify(dict, null, 4) + '</pre>');
        });
    });


//}(document, window)); // passed in for minifying purposes

//eof
