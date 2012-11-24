/*file: makeglossary */
/*global localStorage */

// glossary = makeGlossary([ entries ]);
//
// FIXME: What should happen when trying to add an entry that does not exist in
// dictionary? (this can never happen since words that aren't in the dictionary
// and will never be matched out in the parsing process, but in the future we
// should support any Klingon phonotax words, like {Qov}, and ungrammaticals
// like {Hejna'} eventually)

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
        return noSave ? object : object.save();
    }
    object.add = makeGlossary_add;

    // Clear glossary. Does not auto save.
    function makeGlossary_clear() {
        counter = {};
        glossary = {};
        return object;
    }
    object.clear = makeGlossary_clear;

    // Load glossary from localStorage.
    function makeGlossary_load() {
        var storageEntries = [], name = options.name;
        if (name) {                            // if there's a storage name
            storageEntries = JSON.parse(localStorage.getItem(name));
            object.clear().add(storageEntries, true);
        }
        return object;
    }
    object.load = makeGlossary_load;

    // Remove <entries> from glossary.
    function makeGlossary_remove(entries) {
        each(entries, function (entry) {
            delete glossary[entry.num];
            delete counter[entry.num];
        });
        return object.save();
    }
    object.remove = makeGlossary_remove;

    // Save glossary to localStorage.
    function makeGlossary_save() {
        var storageEntries = [], name = options.name;
        if (name) {                            // if there's a storage name
            storageEntries = object.get().map(function (entry) {
                entry.count = object.count(entry);
                return entry;
            });
            localStorage.setItem(name, JSON.stringify(storageEntries));
        }
        return object;
    }
    object.save = makeGlossary_save;

    return object.load();
}

//eof
