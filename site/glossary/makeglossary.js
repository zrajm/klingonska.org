/*file: makeglossary */
/*global localStorage */

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
    'use strict';
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

//eof
