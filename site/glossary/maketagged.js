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
        'use strict';
        /*jslint white: true */
        var taggedStringPrototype, taggedWordPrototype,
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

//eof
