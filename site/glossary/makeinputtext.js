/*file: makeinputtext */
/*global clearTimeout, setTimeout, localStorage */

// This keeps track of a text input field, and store whatever is written there
// in a text string. It autosaves changes to localStorage (so that you will
// never lose data).
//
// makeInputText({ opt: value ... });
//
// Options are:
//   o 'name' -- Name to use for localStorage.
//   o 'saveDelay' -- How long (in milliseconds) to wait until saving after
//     user have stopped typing. Text is always saved immediately if textarea
//     loses focus. While user is typing 'statusElement' will receive class
//     'typing' (when typing stops this class will be removed again).
//   o 'msgDelay' -- Time (in milliseconds) to give the status element the
//     class 'saved', after typing has stopped.
//   o 'inputElement' -- HTML element which content will be used as input.
//   o 'lengthElement' -- HTML element to which updates of the 'length'
//     property will be written.
//   o 'statusElement' -- HTML element which will receive 'typing' and 'saved'
//     classes when user is typing, or text has been saved.
//
// Methods are:
//
//   o '.save()' -- Saved the current object to localStorage.
//   o '.load()' -- Loads object from localStorage (losing current values).
//   o '.set(TEXT[, LENGTH])' -- Set object. TEXT may be any HTML string (not
//     just plain text). The LENGTH value is only stored (never recalculated by
//     makeInputText() itself), any number may be stored here (and will be
//     loaded/saved together with TEXT).
//   o '.redraw()' -- You should never need to call this explicitly, but it
//     redraws the HTML elements with the current TEXT and LENGTH values.
//
// Properties are
//
//   o '.text' -- The text.
//   o '.length' -- The length.
//
//     These values should not be set directly, but with the '.set()' method.
//     If you set them directly you bypass the redrawing of the corresponding
//     HTML elements.
//
function makeInputText(options) {
    'use strict';
    var object = {}, typingTimer,
        events = 'input DOMNodeInserted DOMNodeRemoved DOMCharacterDataModified';

    // Refresh internal value with current value from HTML element.
    function readInput() {
        object.text = options.inputElement.html();
        if (typingTimer) {
            clearTimeout(typingTimer);
        } else {
            options.statusElement.addClass('typing');
        }
        typingTimer = setTimeout(object.save, options.saveDelay);
    }

    // Redraw HTML element with current value.
    function makeInputText_redraw() {
        options.inputElement.off(events);
        options.inputElement.html(object.text);
        options.lengthElement.html(object.length);
        options.inputElement.on(events, readInput);
        return object;
    }
    object.redraw = makeInputText_redraw;

    // Read input text values (return empty values if reading failed).
    function makeInputText_load() {
        var stored;
        try {
            stored = JSON.parse(localStorage.getItem(options.name));
            if (Object.keys(stored).length === 2 &&
                    typeof stored.text   === 'string' &&
                    typeof stored.length === 'number') {
                object.length = stored.length;
                object.text   = stored.text;
            }
        } catch (error) {
            object.length = 0;
            object.text   = '';
        }
        return object.redraw();
    }
    object.load = makeInputText_load;

    function makeInputText_save() {
        if (options.name) {
            localStorage.setItem(options.name, JSON.stringify({
                length: object.length,
                text:   object.text
            }));
        }
        if (typingTimer) {
            typingTimer = undefined;
            options.statusElement.removeClass('typing');
        }
        options.statusElement.addClass('saved');
        setTimeout(function () {
            options.statusElement.removeClass('saved');
        }, options.msgDelay);
        return object;
    }
    object.save = makeInputText_save;

    function makeInputText_set(text, length) {
        if (typeof length === 'number') { object.length = length; }
        if (typeof text   === 'string') { object.text   = text; }
        return object.redraw();
    }
    object.set = makeInputText_set;

    // save immediately on blur
    options.inputElement.on('focusout', function () {
        if (typingTimer) { object.save(); }
    });

    return object.load();
}

//eof
