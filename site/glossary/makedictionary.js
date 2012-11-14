/*global $ */
/*jslint regexp: true */

/*************************************************************************\
**                                                                       **
** Dictionary Loader                                                     **
**                                                                       **
\*************************************************************************/

// Invocation
// ----------
// Load the dictionary using:
//
//     dict = makeDictionary('../dict/dict.zdb', function () {
//         alert('Dictionary loaded');
//     });
//
// Query
// -----
// Find stuff in the dictionary using `dict.query()`.
//
// Object Anatomy
// --------------
// The plain dictionary list can be obtained with 'dict.query()' (without
// arguments), if your, for some reason, want to iterate over the entire
// dictionary.
//
// dict = [
//     {
//         num :  1
//         tlh : "{bach} [1]",
//         pos : "verb",
//         sv  : "«skjuta»",
//         en  : "<shoot>",
//         def : "TKD",
//         ref : "TKW p.148",
//         com : [...]
//         tag : "fighting; KLCP1",
//         file: "1992-01-01-tkd.txt",
//     }, {
//         num:  : 2,
//         tlh : "{bach} [2]",
//         pos : "noun",
//         sv  : "«skott»",   // «...» retained
//         en  : "<shot>",    // «...» / <...> retained
//         def : "TKD",
//         cat : "fighting",
//         data: "KLCP-1",
//         file: "1992-01-01-tkd.txt",
//     },
//     ...
// ];
//

// Loads data from ZDB file format from URL, parses it (and stuff), and returns
// a dictionary object. Dictionary can then be queried with '.query()'.
//
// Dictionary data can be loaded from: http://klingonska.org/dict/dict.zdb
//
function makeDictionary(url, onLoadCallback) {
    'use strict';
    /*jslint white: true */
    var obj = {},
        dict = [],
        index = {},
        posAbbrev = {
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

    if (!url) { throw new Error('No dictionary URL specified'); } // required options url

    // Usage: dict = parseZDB(data);
    //
    // Chew up ZDB database, spit out one giant list, with each element being
    // one dictionary entry object, looking like this (the 'num' field is added
    // while reading the dictionary, and is not part of the original data).
    //
    //     {
    //         num:  : 2,
    //         tlh : "{bach} [2]",
    //         pos : "noun",
    //         sv  : "«skott»",   // «...» retained
    //         en  : "<shot>",    // «...» / <...> retained
    //         def : "TKD",
    //         cat : "fighting",
    //         data: "KLCP-1",
    //         file: "1992-01-01-tkd.txt",
    //     }
    //
    function parseZDB(data) {
        var count = -1;
        // dictionary data preprocessing (strip header + footer etc.)
        data = data.replace(/^[\s\S]*\n=== start-of-word-list ===\n+/, ''); // head
        data = data.replace(/\n+=== end-of-word-list ===\n[\s\S]*$/, '');   // foot
        data = data.replace(/\n\t/g, ' ');         // unwrap long lines
        return data.split(/\n{2,}/).map(function (chunk) {
            var entry = { num: (count += 1) }, citeCount = 1;
            chunk.split(/\n/).forEach(function (line) {
                var match = line.match(/^(\w*):\s+([^]*)/),
                    field = match[1],
                    value = match[2];
                if (field === 'cite') {
                    field = field + '-' + citeCount;
                    citeCount += 1;
                }
                entry[field] = value;
            });
            return entry;
        });
    }

    function addIndexItem(index, entry, tlh, pos) {
        index.tlh[tlh]              = index.tlh[tlh]              || {};
        index.tlh[tlh]['']          = index.tlh[tlh]['']          || [];
        index.tlh[tlh][''].push(entry);
        index.tlh[tlh].pos          = index.tlh[tlh].pos          || {};
        index.tlh[tlh].pos[pos]     = index.tlh[tlh].pos[pos]     || {};
        index.tlh[tlh].pos[pos][''] = index.tlh[tlh].pos[pos][''] || [];
        index.tlh[tlh].pos[pos][''].push(entry);
        index.pos[pos]              = index.pos[pos]              || {};
        index.pos[pos]['']          = index.pos[pos]['']          || [];
        index.pos[pos][''].push(entry);
        index.pos[pos].tlh          = index.pos[pos].tlh          || {};
        index.pos[pos].tlh[tlh]     = index.pos[pos].tlh[tlh]     || {};
        index.pos[pos].tlh[tlh][''] = index.pos[pos].tlh[tlh][''] || [];
        index.pos[pos].tlh[tlh][''].push(entry);
    }

    function indexify(dict) {
        var index = { pos: {}, tlh: {} };
        dict.forEach(function (entry) {
            var tlh = (entry.tlh.match(/\{(.*?)\}/))[1], // Klingon word
                pos = posAbbrev[entry.pos];
            addIndexItem(index, entry, tlh, pos);
        });
        return index;
    }

    obj = {
        // Return list of requested entries. Returns whole dictionary if no
        // query was give, empty list if no match was found. Possible query
        // fields are: <num> (entry number), <tlh> (Klingon word), <pos>
        // (part-of-speech). <tlh> and <pos> may be combined.
        query: function (query) {
            var pos = (query || {}).pos,
                tlh = (query || {}).tlh,
                num = (query || {}).num, result;
            try {
                if (num !== undefined) {
                    result = dict[num < 0 ? dict.length + num : num];
                    return result ? [ result ] : [];
                }
                if (pos && tlh) { return index.pos[pos].tlh[tlh]['']; }
                if (pos) { return index.pos[pos]['']; }
                if (tlh) { return index.tlh[tlh]['']; }
                return dict;
            } catch (error) {
                return [];
            }
        },
        index: function () { return index; }
    };

    $.get(url, function (data) {               // fetch dictionary
        dict = parseZDB(data);                 //   parse
        index = indexify(dict);
        if (onLoadCallback) { onLoadCallback(obj); }
    });

    return obj;
}

//eof
