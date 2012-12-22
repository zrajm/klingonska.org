/* file:flashcards */
/*global $, tag, localStorage, makeStore */

/*
  See: http://eli.thegreenplace.net/2010/01/22/weighted-random-generation-in-python/

  Use the method "Giving up the temporary list".

  def weighted_choice_sub(weights):
      rnd = random.random() * sum(weights)
      for i, w in enumerate(weights):
          rnd -= w
          if rnd < 0:
              return i

    <button style="background:#da8;color:#540;border: outset #fca;" >Maybe</button>
    <button style="background:#ad8;color:#350;border: outset #cfa;" title=2>Easy</button>
    <button style="background:#8f8;color:#070;border: outset #afa;">Known</button>

  Page controls:

    <div style="color: #666">
      <label title="Determines the number of buttons above.">Loop: <input style="width:1.5em" value=13></label>
      &nbsp;
      Repeats:
      <label>tlh⇒en <input style="width:1em" value=3></label>
      &nbsp;
      <label>en⇒tlh <input style="width:1em" value=3></label>
    </div>

*/

/*

# Passed in from outside:
#
#    glossary  -- glossary of words to include
#    known     -- glossary of words to exclude from "Glossary Words"
#    dict      -- dictionary in which to look up words
#
# Internal:
#    store -- internal state, with bookkeeping for all entries
#
#    deck (array of ids) = all words to practice
#    loop (array of ids) = current tiny little loop thingy to practice
#    wait (array of ids) = recently asked questions not to insert in program yet
#
#    questionEntry (dictionary entry) = currently displayed question
#
#    tlhEnCount -- number of questions in tlh -> en direction
#    enTlhCount -- number of questions in en -> tlh direction
#

State of Current Practice Session
=================================
This state does not contain any fields from the dictionary entry.

This is all the state currently in existance.

    store = {
        <ID> = {
            ...
        },
        ...
    };


Cards Currently Used
====================
An array with entry IDs.

This is the state used for the current session. It is re-created upon entering
a new practice session, and initialized using the 'state' object.

    deck = [
        <ID 1>,
        <ID 2>,
        ...
    ];

*/

function initFlashcards(opts) {
    'use strict';
    var questionEntry,
        deck = [],
        tlhEnCount = 3,
        enTlhCount = 3,
        dom = {
            questionCell: $('section.practice td.question'),
            answerCell:   $('section.practice td.answer'),
            table:        $('section.practice table.glossary'),
            tab:          $('#tab-row .practice'),
            showCell:     $('section.practice td.show'),
            replyCell:    $('section.practice td.reply'),
            helpElement:  $('section.practice .help'),
            pointElement: $('section.practice span.point'),
            maxPointElement: $('section.practice .maxpoint'),
            pointMeter:   $('section.practice progress.point'),
            pointMeter2:  $('section.practice progress.b'),
            occurElement: $('section.practice .occur')
        },
        posAbbrev = {
            "adverbial"              : { en: "adv",  sv: "adv" },
            "conjunction"            : { en: "conj", sv: "konj" },
            "exclamation"            : { en: "excl", sv: "interj" },
            "name"                   : { en: "name", sv: "namn" },
            "noun"                   : { en: "n",    sv: "s"   },
            "noun suffix type 1"     : { en: "ns1",  sv: "ss1" },
            "noun suffix type 2"     : { en: "ns2",  sv: "ss2" },
            "noun suffix type 3"     : { en: "ns3",  sv: "ss3" },
            "noun suffix type 4"     : { en: "ns4",  sv: "ss4" },
            "noun suffix type 5"     : { en: "ns5",  sv: "ss5" },
            "numeral"                : { en: "num",  sv: "räkn" },
            "pronoun"                : { en: "pro",  sv: "pro"  },
            "question word"          : { en: "ques", sv: "fråg" },
            "verb"                   : { en: "v",    sv: "v"   },
            "verb prefix"            : { en: "vp",   sv: "vp"  },
            "verb suffix type 1"     : { en: "vs1",  sv: "vs1" },
            "verb suffix type 2"     : { en: "vs2",  sv: "vs2" },
            "verb suffix type 3"     : { en: "vs3",  sv: "vs3" },
            "verb suffix type 4"     : { en: "vs4",  sv: "vs4" },
            "verb suffix type 5"     : { en: "vs5",  sv: "vs5" },
            "verb suffix type 6"     : { en: "vs6",  sv: "vs6" },
            "verb suffix type 7"     : { en: "vs7",  sv: "vs7" },
            "verb suffix type 8"     : { en: "vs8",  sv: "vs8" },
            "verb suffix type 9"     : { en: "vs9",  sv: "vs9" },
            "verb suffix type rover" : { en: "vsr",  sv: "vss" }
        },
        store = makeStore('practice');

    // erase all but the required / know properties of 'opts'
    opts = {
        glossary: opts.glossary,
        known: opts.known,
        dict: opts.dict
    };

    /*************************************************************************\
    **                                                                       **
    **  Functions                                                            **
    **                                                                       **
    \*************************************************************************/

    function prettyApos(string) {
        return string.replace(/\'/g, '’');  // prettify apostrophes
    }
    function stripAngle(string) {
        return string.replace(/[<>«»]/g, '');
    }

    function tlhHTML(quesEntry) {
        var word = quesEntry.tlh.match(/[^\{]+(?=\})/)[0];
        return tag('b', prettyApos(word), 'lang=tlh');
    }

    function nonTlhHTML(quesEntry) {
        var tlhWord  = quesEntry.tlh.match(/[^\{]+(?=\})/)[0],
            homonyms = opts.dict.query({
                tlh: tlhWord, pos: quesEntry.pos
            });

        return ['en', 'sv'].map(function (lang) {// for each language
            var string,
                strings = homonyms.map(function (entry) {// for each homonym
                    var word = prettyApos(stripAngle(entry[lang]));
                    return tag('i', word);
                });

            if (strings.length > 1) {           // with homonyms: make list
                string = 0;
                strings = strings.map(function (value) {
                    string += 1;
                    return string + '. ' + value + tag('br');
                });
                string = strings.join('');
            } else {                           // without homonyms: single
                string = strings[0];
            }
            return tag('span', string, 'lang=' + lang);
        }).join('');

        return homonyms.map(function (quesEntry) {
            return (
                tag('span', tag('i', stripAngle(quesEntry.en)), 'lang=en') +
                tag('span', tag('i', stripAngle(quesEntry.sv)), 'lang=sv')
            );
        }).join('');
    }

    function questionHTML(quesEntry, lang) {
        return lang === 'tlh' ? tlhHTML(quesEntry) : nonTlhHTML(quesEntry);
    }

    function outOfQuestions() {
        dom.questionCell.html('No more words.');
        dom.answerCell.empty();
        dom.showCell.addClass('hidden');
        dom.replyCell.addClass('hidden');
    }

    function outputQuestion(quesEntry) {
        var id    = quesEntry.id,
            point = store.get(id, 'point') || 0,
            max   = tlhEnCount + enTlhCount,
            pos   = posAbbrev[quesEntry.pos];
        // show question
        dom.questionCell.html(
            questionHTML(quesEntry, point < enTlhCount ? 'tlh' : 'en') + ' (' +
                tag('span', pos.en || quesEntry.pos, 'lang=en') +
                tag('span', pos.sv || quesEntry.pos, 'lang=sv') + ')'
        );
        dom.answerCell.empty();               // clear answer
        dom.showCell.removeClass('hidden');   // show 'Show Answer'
        dom.replyCell.addClass('hidden');     // hide reply buttons
        // show current point
        // FIXME: should be progress, or number of questions left on this card
        dom.pointElement.html(point);
        dom.maxPointElement.html(max);
        dom.pointMeter.attr('value', point);
        dom.pointMeter.attr('max', max);
        dom.occurElement.html(store.get(id, 'count'));
        $('button.show', dom.showCell).trigger('focus');
    }

    function outputAnswer(quesEntry) {
        var id    = quesEntry.id,
            point = store.get(id, 'point') || 0;
        dom.answerCell.html(questionHTML(
            quesEntry,
            point < enTlhCount ? 'en' : 'tlh'
        ));
        dom.showCell.addClass('hidden');
        dom.replyCell.removeClass('hidden');
        $('button.hard', dom.replyCell).trigger('focus');
    }

    function outputHelp(buttonName, bodyText, key) {
        if (buttonName === undefined) {
            //dom.helpElement.empty();
            dom.helpElement.addClass('hidden');
            return;
        }
        dom.helpElement.html(
            //tag('b', buttonName + ':') + ' ' +
                bodyText + ' ' +
                tag('nobr',
                    '(Key: ' + key.split(' ').map(function (bleh) {
                        return tag('kbd', bleh);
                    }).join(' or ') + ')')
        );
        dom.helpElement.removeClass('hidden');
    }

    // Debug output thingy. (Uses global 'store'.)
    function dumpTableHTML(wordIDs, dict) {
        var tbody = [];
        wordIDs.forEach(function (id) {
            var entry = dict.query({ id: id })[0],
                count = store.get(id, 'count') || 0,
                point = store.get(id, 'point') || 0;
            tbody.push(tag('tr',
                tag('td', count + ' (' + point + ')') +
                tag('td', entry.tlh)));
        });
        return tag('tbody', tbody.join(''));
    }

    function outputDumpTable(deck, dict) {
        dom.table.html(dumpTableHTML(deck, dict));
    }

    // Invoked on switching to the 'Practice' tab.
    function generateNewDeck(glossary, known) {
        var entries = glossary.get();
        // reset all word counters in store
        store.keys().map(function (name) {
            store.set(name, 'count', 0);
        });
        // set store of each incoming glossary word
        return entries.filter(function (entry) {
            return !known.has(entry);          // all non-known entries
        }).map(function (entry) {
            var id = entry.id;
            store.set(id, 'count', entry.count);   //   save word count
            return id;                         // keep only 'id' field
        });
    }

    function failButtonClick(quesEntry) {
        var questionId = quesEntry.id;
        store.set(questionId, 'point', 0);
        deck.push(questionId);                 // put card back
    }

    function hardButtonClick(quesEntry, addPoint) {
        var questionId = quesEntry.id,
            point      = (store.get(questionId, 'point') || 0) + addPoint;
        store.set(questionId, 'point', point); // set new points

        console.log('point: ' + point + ' (required: ' + (enTlhCount + tlhEnCount) + ')');

        if (point < enTlhCount + tlhEnCount) {
            deck.push(questionId);             // put card back
        } else {
            console.log('done practicing ' + quesEntry.tlh);
            opts.known.add([ quesEntry ]);     // add to "Known Words"
        }
    }

    function knownButtonClick(quesEntry) {
        opts.known.add([ quesEntry ]);
    }

    // Uses global 'opts.dict' + 'deck'.
    function newQuestion(deck, dict) {
        var questionId, quesEntry, remainCount;
        if (deck.length === 0) {               // stop if no more questions
            outOfQuestions();
            return;
        }
        questionId  = deck.shift();          // get question
        quesEntry   = dict.query({ id: questionId })[0];
        remainCount = deck.length;           // output question count
        totalCount  = opts.glossary.length;  // glossaries in text
        $('section.practice .remaincount').html(remainCount);
        $('section.practice .donecount').html(totalCount - remainCount);
        $('section.practice .totalcount').html(totalCount);
        $('section.practice progress.total').attr('max', totalCount);
        $('section.practice progress.total').attr('value', totalCount - remainCount);
        outputQuestion(quesEntry);
        outputDumpTable(deck, dict);
        return quesEntry;
    }

    // User selected (or reselected) this tab.
    function onTabClick() {
        deck = generateNewDeck(opts.glossary, opts.known);
        localStorage.setItem('deck',  JSON.stringify(deck));
        questionEntry = newQuestion(deck, opts.dict);
    }


    /*************************************************************************\
    **                                                                       **
    **  Main                                                                 **
    **                                                                       **
    \*************************************************************************/

    $('button', dom.showCell).on('click', function () {  // "Show Answer"
        outputAnswer(questionEntry);
    });
    $('button.fail', dom.replyCell).on('click', function () {
        failButtonClick(questionEntry);
        questionEntry = newQuestion(deck, opts.dict);
    });
    $('button.hard', dom.replyCell).on('click', function () {
        hardButtonClick(questionEntry, 1);
        questionEntry = newQuestion(deck, opts.dict);
    });
    $('button.easy', dom.replyCell).on('click', function () {
        // FIXME: should add tlhEnCount points if points < tlhEnCount,
        //   otherwise should add enTlhCount points
        hardButtonClick(questionEntry, tlhEnCount);
        questionEntry = newQuestion(deck, opts.dict);
    });
    $('button.known', dom.replyCell).on('click', function () {
        knownButtonClick(questionEntry);
        questionEntry = newQuestion(deck, opts.dict);
    });

    $('button.show', dom.showCell).on('mouseenter', function () {
        outputHelp('Show Answer',
            'Picture the answer in your mind, then press <i><b>Show ' +
                'Answer</b></i> to see if you are right.',
            'space ↲');
    });
    $('button.fail', dom.replyCell).on('mouseenter', function () {
        // var point = store.get(questionEntry.id, 'point') || 0;
        // dom.pointMeter.attr('value', point - 1);
        var point = 0;
        dom.pointMeter.attr('value', point);
        dom.pointElement.html(point);
        outputHelp('Failed',
            'Press <i><b>Failed</b></i> if you didn’t get the answer right.',
            '0 Esc');
    });
    $('button.hard', dom.replyCell).on('mouseenter', function () {
        var point = (store.get(questionEntry.id, 'point') || 0) + 1;
        dom.pointMeter.attr('value', point);
        dom.pointElement.html(point);
        outputHelp('Got It',
            'Press <i><b>Got It</b></i> if you got the answer right. ' +
                '– This is what you would normally do.',
            '1 ↲');
    });
    $('button.easy', dom.replyCell).on('mouseenter', function () {
        var point = store.get(questionEntry.id, 'point') || 0;
        point = (point < tlhEnCount) ? tlhEnCount : (tlhEnCount + enTlhCount)
        dom.pointMeter.attr('value', point);
        dom.pointElement.html(point);
        outputHelp('Too Easy',
            'Press <i><b>Too Easy</b></i> if you know the word <em>really well,</em> ' +
                'but still don’t want to dismiss it completely.',
            '3');
    });
    $('button.known', dom.replyCell).on('mouseenter', function () {
        var point = tlhEnCount + enTlhCount;
        dom.pointMeter.attr('value', point);
        dom.pointElement.html(point);
        outputHelp('Known',
            'Press <i><b>Known</b></i> if you know the word by heart, and ' +
                'never want to practice it again.',
            '4');
    });
    $('button', dom.replyCell).on('mouseleave', function () {
        var point = store.get(questionEntry.id, 'point') || 0;
        dom.pointMeter.attr('value', point);
        dom.pointElement.html(point);
        outputHelp();
    });
    $('button', dom.showCell).on('mouseleave', function () {
        outputHelp();
    });
    dom.tab.on('click', onTabClick);           // "Practice" (page tab)
}

//eof
