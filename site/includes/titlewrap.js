/* -*- css -*- */

/*jslint browser: true */
//
// This script does wordwrapping of the "Klingonska Akademien" page title in
// the new red/white design of http://klingonska.org/, introduced in June 2012.
// It is run for each page, and should the window become to narrow to fit the
// page title, this script replaces between the words with a line break.
//
// When relying on automatic word wrapping, the element inside which something
// is word wrapped automatically gets a width 100% -- this script is to avoid
// that, since the logo + title is centered on the screen.
//
// This source has been passed through http://jslint.com/
//
// /zrajm, 2012-06-25
//
(function (window, document) {
    "use strict";
    var timer, siteTitleWidth = document.getElementById("logotitle").offsetWidth;
    function siteTitleWordwrap() {
        var windowWidth,
            logoSpaceElement = document.getElementById("logospace");
        logoSpaceElement.innerHTML = "&nbsp;";
        windowWidth = window.innerWidth ||
            document.documentElement.offsetWidth ||
            document.body.offsetWidth;
        // if full width of title is wider than current window,
        // replace space in 'Klingonska Akademien' with linebreak
        if (siteTitleWidth > windowWidth) {
            logoSpaceElement.innerHTML = "<br>";
        }
    }
    window.onresize = function () {
        // invoke wordwrap after small time interval (to reduce number of
        // invokations -- needed since on onresize is triggered at least twice
        // for each window resize)
        window.clearTimeout(timer);
        timer = window.setTimeout(siteTitleWordwrap, 10);
    };
    siteTitleWordwrap();
}(window, document));
//eof
