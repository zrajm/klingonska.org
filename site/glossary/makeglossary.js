// glossary = makeGlossary([ entries ]);
//
// glossary.add(entries);     // chainable
// glossary.remove(entries);  // chainable
// glossary.get(entries);
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
        if (!entries) { return; }
        if (!(entries instanceof Array)) {
            throw new TypeError('argument must be array');
        }
        entries.forEach(function (entry) {
            if (entry.num === undefined) {
                throw new TypeError('dictionary entry is missing "num" ' +
                    'property\n' + JSON.stringify(entry, null, 4));
            }
            callback(entry);
        });
    }
    object = {
        // non-chainable functions in alphabetical order
        count: function (entry) { return counter[entry.num] || 0; },
        get: function () { // return glossary (sorted in dictionary order)
            return Object.keys(glossary).sort(numeric).map(function (num) {
                return glossary[num];
            });
        },
        has: function (num) { return !!glossary[num]; },
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
        clear: function (entries) {
            counter = {};
            glossary = {};
            return object;
        },
        load: function (name) {
            return object.clear().add(JSON.parse(localStorage.getItem(name)));
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
