/*file: setlang */
/*global $, localStorage */
/*jslint browser: true */

/***************************************************************************** \
**                                                                           **
** Page Language Selector                                                    **
**                                                                           **
\*****************************************************************************/

// This should be used with a <select class=lang> on your page. An onChange
// event is added to that, which, on selection sets 'data-lang' of the <html>
// attribute, so that you may use CSS to show/hide various elements on the
// page.
// set 'data-lang' attribute of <html> element
$(function () {
    'use strict';
    var oldLang = '', selectorElement = $('select.lang'),
        storageName  = 'current-language',
        languageName = localStorage.getItem(storageName);
    function setLang(newLang) {
        if (newLang !== oldLang) {
            $(document.body).attr('data-lang', newLang);
            localStorage.setItem(storageName, newLang);
            oldLang = newLang;
        }
    }
    setLang(languageName || 'en');             // default langue = english
    selectorElement.val(languageName);         // update selector
    selectorElement.on('change', function () { setLang(this.value); });
});

//eof
