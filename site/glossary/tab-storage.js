/*file: tab-storage */
/*global $, localStorage, Blob, FileReader */
/*jslint browser: true */

(function (window) {
    'use strict';
    var magicNumber   = '# http://klingonska.org' + window.location.pathname + '\n',
        magicNumberRe = new RegExp('^' + magicNumber.replace(/\//g, '\\/')),
        pageElement = $('[role="main"] > .storage'),
        status = (function () {
            var timer, element = $('span', pageElement);
            function init() { return element.empty(); }
            return {
                show: function (msg, secs) {
                    clearTimeout(timer);
                    init().removeClass('hidden').html(msg);
                    if (secs) { timer = setTimeout(init, secs * 1000); }
                    return element;
                },
                hidden: function (msg) {
                    init().addClass('hidden').html(msg);
                    return element;
                }
            };
        }());

    // Return a HTML tag.
    //
    // If content is a string (even an empty one) will result in both start and
    // end tags (e.g. `tag('X', '')` = `<X></X>`), if content is null (or
    // undefined) an empty tag is produced (e.g. `tag('X')` = `<X>`).
    function tag(name, content, attr) {
        return '<' + name + (attr ? ' ' + attr : '') + '>' +
            (typeof content === 'string' ? (content + '</' + name + '>') : '');
    }

    // Returns list of all keys in localStorage.
    function localStorageKeys() {
        var i, keys = [];
        for (i = 0; i < localStorage.length; i += 1) {
            keys.push(localStorage.key(i));
        }
        return keys.sort();
    }

    // Redraw the HTML table displaying the localStorage.
    function redrawTable() {
        var tableRows = localStorageKeys().map(function (key) {
            var value = localStorage.getItem(key);
            try {
                // prettify JSON strings by attempting decode + recode
                // (present as-is if this fails, e.g. for numbers/strings)
                value = JSON.stringify(JSON.parse(value), null, 4);
            } catch (error) {}
            return tag('tr',
                tag('th', tag('pre', key) +
                    tag('button', 'Delete', 'data-key="' + key + '"')) +
                tag('td', tag('pre', value)));
        });
        // join tableRows into string with HTML table, write that to DOM
        $('.storage table').empty().html(
            tag('thead', tag('tr', tag('th', 'Key') + tag('th', 'Value'))) +
            tag('tbody', tableRows.join('')));
        // attach event to the 'delete' buttons in the new table
        $('.storage table button').on('click', function () {
            var buttonElement = $(this),
                key = buttonElement.data('key');
            localStorage.removeItem(key);         // delete from localStorage
            buttonElement.closest('tr').remove(); // remove table row
            status.show('Deleted property ‘' + key + '’.', 3);
        });
    }

    // Return Javascript blob with localStorage JSON encoded.
    // (Suitable for writing to file.)
    function localStorageBlob() {
        var state = {}, string = '';
        localStorageKeys().forEach(function (key) {
            var value = localStorage.getItem(key);
            try {
                value = JSON.parse(value);
            } catch (error) {}
            state[key] = value;
        });
        string = magicNumber + JSON.stringify(state, null, 2);
        return new Blob([ string ], { type: 'application/octet-stream' });
    }

    // Return 'YYYY-MM-DD_MM-HH-SS' string from current time.
    function dateString() {
        var d = new Date(), x = [
            d.getFullYear(), d.getMonth() + 1, d.getDate(),
            d.getHours(), d.getMinutes(), d.getSeconds()
        ];
        return '0-1-2_3-4-5'.replace(/\d/g, function (i) {
            return x[i] < 9 ? '0' + x[i] : x[i]; // pad with one zero
        });
    }

    // Send a proper click event to specified jQuery element.
    // (jQuery's trigger() does not do this properly.)
    function simulateClick(jqueryElement) {
        var event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, true, window, 1,
            0, 0, 0, 0, false, false, false, false, 0, null);
        jqueryElement.get(0).dispatchEvent(event);
    }

    // Download current localStorage state.
    //
    // To download in background, and to suggest a filename for user, the <a>
    // 'download' attribute is needed -- hence we create a HTML anchor tag
    // (hidden from the user in an invisible div), and then emulate a click on
    // it. The data is generated as a 'blob:' url, which is revoked after 10
    // seconds (plenty of time to download, since its all done locally).
    function downloadStorage() {
        var blobUrl, element, filename = dateString() + '.state.txt';
        // create a blob url pointing to JSON of localStorage data
        blobUrl = window.URL.createObjectURL(localStorageBlob());
        // create (hidden) link to blob
        element = status.hidden('<a href="' + blobUrl + '" ' +
            'download="' + filename + '">' + filename + '</a>');
        // simulate a mouse click on link
        simulateClick($('a', element));
        // revoke the blob after 10 seconds
        setTimeout(function () { window.URL.revokeObjectURL(blobUrl); }, 10000);
    }

    // Upload a state file to replace current localStorage.
    function uploadStorage(event) {
        var reader, file = event.target.files[0];
        if (file.type === 'text/plain') {
            reader = new FileReader();
            reader.onloadend = function (event) {  // onload callback
                var content = event.target.result;
                try {
                    if (!content.match(magicNumberRe)) {        // check magic number
                        throw new TypeError('Unknown file format');
                    }
                    content = content.replace(magicNumberRe, ''); // remove magic number
                    content = JSON.parse(content);              // parse JSON
                    $.each(content, function (key, value) {     // store each value
                        localStorage.setItem(key, (
                            typeof value === 'object' ?
                                    JSON.stringify(value) : value
                        ));
                    });
                    redrawTable();
                    status.show('File loaded successfully.', 3);
                } catch (error) {
                    status.show('Failed to read file: ' + error.message, 10);
                }
            };
            reader.readAsText(file);           // read file
        }
    }

    // set up event triggers
    $('nav.pagetabs .storage').on('click', redrawTable);
    $('button.download', pageElement).on('click', downloadStorage);
    $('button.upload', pageElement).on('click', function () {
        $('.storage input[type="file"]').trigger('click');
    });
    $('input', pageElement).on('change', uploadStorage);
    $('button.clear', pageElement).on('click', function () {
        localStorage.clear();
    });

    $(function () {
        window.URL = window.URL || window.webkitURL;
        var warn = [];
        if (!window.URL) {
            warn.push('<i>blob urls</i> (required for downloading)');
            $('button.download', pageElement).attr('disabled', true).
                attr('title', 'Missing browser support for this feature.');
        }
        if (!FileReader) {
            warn.push('<i>FileReader</i> (required for uploading)');
            $('button.upload', pageElement).attr('disabled', true).
                attr('title', 'Missing browser support for this feature.');
        }
        if (warn.length) {
            $('p', pageElement).html('Unfortunately your browser does not ' +
                'support ' + warn.join(', or ') + '. <b>:’(</b>');
        }
    });
}(window));

//eof
