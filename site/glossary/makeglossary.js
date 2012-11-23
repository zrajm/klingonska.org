/*file: makeglossary */
/*global localStorage */

// glossary = makeGlossary([ entries ]);
//
// FIXME: What should happen when trying to add an entry that does not exist in
// dictionary? (this can never happen since words that aren't in the dictionary
// and will never be matched out in the parsing process, but in the future we
// should support any Klingon phonotax words, like {Qov}, and ungrammaticals
// like {Hejna'} eventually)

function makeGlossary(entries) {
    'use strict';
    var glossary = {}, counter = {}, object = {};
    function numeric(a, b) { return a - b; }
    function each(entries, callback) {
        // FIXME: Input data errors are silently ignored here. (E.g. if an
        // incompatible data structure was loaded from localStorage.) Only if
        // 'entries' argument is an array, and then only for entries containing
        // the 'num:' field, do we actually *do* anything. It seem to me bad
        // practice not to tell the user that something went wrong, but
        // throwing an error fucks up the entire program, so we can't do that
        // either.
        if (entries instanceof Array) {
            entries.forEach(function (entry) {
                if (entry.num !== undefined) { callback(entry); }
            });
        }
    }
    object = {
        // non-chainable functions in alphabetical order
        count: function (entry) { return counter[entry.num] || 0; },
        get: function () { // return glossary (sorted in dictionary order)
            return Object.keys(glossary).sort(numeric).map(function (num) {
                return glossary[num];
            });
        },
        has: function (entry) { return !!glossary[entry.num]; },
        length: function () { return Object.keys(glossary).length; },
        // chainable functions in alphabetical order
        add: function (entries) {
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
            return object;
        },
        clear: function () {
            counter = {};
            glossary = {};
            return object;
        },
        load: function (name) {
            var storageEntries = JSON.parse(localStorage.getItem(name));
            return object.clear().add(storageEntries);
        },
        remove: function (entries) { // chainable
            each(entries, function (entry) {
                delete glossary[entry.num];
                delete counter[entry.num];
            });
            return object;
        },
        save: function (name) {
            var state = object.get().map(function (entry) {
                entry.count = object.count(entry);
                return entry;
            });
            localStorage.setItem(name, JSON.stringify(state));
            return object;
        }
    };
    if (entries) { object.add(entries); }
    return object;
}

//eof
