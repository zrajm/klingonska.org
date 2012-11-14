var makeRules = (function () {
        'use strict';
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
        /*jslint white: true */

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

        return function (dict) {
            return getRules(dict);
        };
}());
//eof
