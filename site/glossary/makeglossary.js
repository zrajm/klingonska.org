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

    /*************************************************************************\
    **                                                                       **
    **  Functions Returning Information                                      **
    **                                                                       **
    \*************************************************************************/

    // Return word count for specified <entry>.
    function makeGlossary_count(entry) {
        return counter[entry.num] || 0;
    }
    object.count = makeGlossary_count;

    // Return list of glossary entries sorted in dictionary order.
    function numeric(a, b) { return a - b; }
    function makeGlossary_get() {
        return Object.keys(glossary).sort(numeric).map(function (num) {
            return glossary[num];
        });
    }
    object.get = makeGlossary_get;

    // Return true if <entry> exists in glossary, false otherwise.
    function makeGlossary_has(entry) {
        return !!glossary[entry.num];
    }
    object.has = makeGlossary_has;

    // Return number of entries in glossary.
    function makeGlossary_length() {
        return Object.keys(glossary).length;
    }
    object.length = makeGlossary_length;


    /*************************************************************************\
    **                                                                       **
    **  Chainable Functions                                                  **
    **                                                                       **
    \*************************************************************************/

    // Add words to glossary.
    function makeGlossary_add(entries) {
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
    }
    object.add = makeGlossary_add;

    // Clear glossary.
    function makeGlossary_clear() {
        counter = {};
        glossary = {};
        return object;
    }
    object.clear = makeGlossary_clear;

    // Load glossary from localStorage.
    function makeGlossary_load(name) {
        var storageEntries = JSON.parse(localStorage.getItem(name));
        return object.clear().add(storageEntries);
    }
    object.load = makeGlossary_load;

    // Remove <entries> from glossary.
    function makeGlossary_remove(entries) {
        each(entries, function (entry) {
            delete glossary[entry.num];
            delete counter[entry.num];
        });
        return object;
    }
    object.remove = makeGlossary_remove;

    // Save glossary to localStorage.
    function makeGlossary_save(name) {
        var state = object.get().map(function (entry) {
            entry.count = object.count(entry);
            return entry;
        });
        localStorage.setItem(name, JSON.stringify(state));
        return object;
    }
    object.save = makeGlossary_save;

    if (entries) { object.add(entries); }
    return object;
}

//eof
