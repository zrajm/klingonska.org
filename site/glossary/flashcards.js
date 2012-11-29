/* file:flashcards */
/*global $, tag */

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

function initFlashcards(options) {
    'use strict';
    var questionEntry, deck,
        dom = {
            questionCell: $('section.practice td.question'),
            answerCell:   $('section.practice td.answer'),
            table:        $('section.practice table.glossary'),
            tab:          $('#tab-row .practice'),
            showCell:     $('section.practice td.show'),
            replyCell:    $('section.practice td.reply')
        };

    /*************************************************************************\
    **                                                                       **
    **  Functions                                                            **
    **                                                                       **
    \*************************************************************************/

    function questionHTML(questionEntry, lang) {
        var tr = { '{': '<b lang=tlh>', '}': '</b' };
        if (lang === 'tlh') {
            return questionEntry.tlh.replace(/[{}]/g, function (a) {
                return tr[a];
            });
        }
        return 'HUH?';
    }

    function answerHTML(questionEntry, lang) {
        if (lang === 'en') {
            return tag('i', questionEntry[lang].replace(/[<>«»]/g, '')) +
                ' (' + questionEntry.pos + ')';
        }
        return 'HUH?';
    }

    function outOfQuestions() {
        dom.questionCell.html('No more words.');
        dom.answerCell.empty();
        dom.showCell.addClass('hidden');
        dom.replyCell.addClass('hidden');
    }

    function outputQuestion(questionEntry) {
        dom.questionCell.html(questionHTML(questionEntry, 'tlh'));
        dom.answerCell.empty();
        dom.showCell.removeClass('hidden');
        dom.replyCell.addClass('hidden');
    }

    function outputAnswer(questionEntry) {
        dom.answerCell.html(answerHTML(questionEntry, 'en'));
        dom.showCell.addClass('hidden');
        dom.replyCell.removeClass('hidden');
    }

    function questionWords() {
        var entries = options.glossary.get();
        return entries.filter(function (entry) {
            return !options.known.has(entry);
        });
    }

    // Debug output thingy.
    function dumpTableHTML(words) {
        var tbody = [];
        words.forEach(function (entry) {
            tbody.push(tag('tr',
                tag('td', entry.count) +
                tag('td', entry.tlh)));
        });
        return tag('tbody', tbody.join(''));
    }

    function againButtonClick(questionEntry) {
        // reset deck number
        deck.push(questionEntry);          // put card back
    }

    function goodButtonClick(questionEntry) {
        // increase deck number
        deck.push(questionEntry);          // put card back
    }

    function easyButtonClick(questionEntry) {
        // increase deck number
        deck.push(questionEntry);          // put card back
    }

    function knownButtonClick(questionEntry) {
        options.known.add([ questionEntry ]);
    }

    function newQuestion() {
        var remainCount = deck.length;
        $('section.practice .remaincount').html(remainCount);

        if (deck.length === 0) {
            outOfQuestions();
            return;
        }
        questionEntry = deck.shift();      // get 1st word from deck

        outputQuestion(questionEntry);

        dom.table.html(dumpTableHTML(deck));
    }

    // User selected (or reselected) this tab.
    function onTabClick() {
        deck = questionWords();                    // generate deck of flashcards
        newQuestion();
    }


    /*************************************************************************\
    **                                                                       **
    **  Main                                                                 **
    **                                                                       **
    \*************************************************************************/

    $('button', dom.showCell).on('click', function () {  // "Show Answer"
        outputAnswer(questionEntry);
    });
    $('button.again', dom.replyCell).on('click', function () {
        againButtonClick(questionEntry);
        newQuestion();
    });
    $('button.good', dom.replyCell).on('click', function () {
        goodButtonClick(questionEntry);
        newQuestion();
    });
    $('button.easy', dom.replyCell).on('click', function () {
        easyButtonClick(questionEntry);
        newQuestion();
    });
    $('button.known', dom.replyCell).on('click', function () {
        knownButtonClick(questionEntry);
        newQuestion();
    });

    dom.tab.on('click', onTabClick);           // "Practice" (page tab)
}

//eof
