/* -*- css -*- */

/*jslint browser: true */
/*global $ */
(function () {
    'use strict';
    var content = $('[role="main"]'),
        contentBorder = parseInt(content.css('padding-left'), 10) +
                        parseInt(content.css('border-left'),  10),
        timeoutId;

    // function which center all HTML elements with class="center" that are
    // wider than the parent element (inside role="main")
    function centerBigTables() {
        var contentWidth = content.width(),
            maxMargin    = content.offset().left + contentBorder;
        $('.center', content).each(function (i, table) {
            var tableWidth, margin;
            table = $(table);
            tableWidth = table.outerWidth();
            if (tableWidth > contentWidth) {
                margin = (tableWidth - contentWidth) / 2;
                if (margin > maxMargin) { margin = maxMargin; }

                table.css('margin-left', '-' + margin + 'px');
            }
        });
    }
    // run stuff
    $(centerBigTables);             // on document load
    $(window).resize(function () {  // on window resize
        clearTimeout(timeoutId);
        timeoutId = setTimeout(centerBigTables, 50);
    });
}());
