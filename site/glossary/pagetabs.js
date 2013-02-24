/*file: pagetabs */
/*global $, localStorage */

// NOTE
// ====
// This should load last, so that it may trigger other tab scripts by
// simulating a click on its tab. (For this to work the receiving end needs to
// have initialized and be ready to receive.)
//
// Page tabs are defined by the children elements of a <nav class="pagetabs">
// (only the immediate children of the <nav> element is searched). Each child
// element should have 'class' set to the class of the corresponding page. The
// currently selected tab is marked by adding a 'class=selected' (match this
// with CSS to highlight the current tab for the end user).
//
// Pages are any children elements of an element with the attribute 'role=main'
// set. Pages should be hidden initially, they will be displayed/hidden as
// needed by this script. All pages, except the currently shown will get
// 'class=hidden' (match this with CSS to set 'display:none' on all but the
// current page).
//
// A very minimal page with all the required arguments for using this script
// may look like this (you'll have to CSS it too, of course):
//
//     <article role=main>
//       <nav class=pagetabs>
//         <span class=one>Tab One</span>
//         <span class=two>Tab Two</span>
//       </nav>
//       <section class="one hidden">Page One</section>
//       <section class="two hidden">Page Two</section>
//     </article>
//     <script src="pagetabs.js"></script>
//
// The currently selected tab is stored in localStorage, so that on page
// reload, the same tab remains open.
//
//     tabs = {
//         "input": {                  // tab name
//             tab: <jQuery object>,   //   jQuery/DOM object of tab
//             page: <jQuery object>   //   jQuery/DOM object of tab's page
//         },
//         ...
//     }
//
$(function () {
    'use strict';
    var storageName = 'tab',
        tabRowTabs  = $('nav.pagetabs > *'),
        currentTab  = localStorage.getItem(storageName), // stored tab name
        defaultTab  = null,                       // fallback
        tabs        = {};
    function change(newTabName) {
        var oldPage = tabs[currentTab],
            newPage = tabs[newTabName] || tabs[defaultTab];
        if (oldPage) {
            oldPage.tab.removeClass('selected');  // deselect old tab
            oldPage.page.addClass('hidden');      // hide old page
        }
        newPage.tab.addClass('selected');         // select new tab
        newPage.page.removeClass('hidden');       // display new page
        currentTab = newTabName;                  // remember current tab
        localStorage.setItem(storageName, newTabName); // save current tab
    }
    // build 'tabs' object
    tabRowTabs.each(function () {
        var tabObject  = $(this),
            tabName    = tabObject.attr('class'),
            pageObject = $('[role="main"] > section.' + tabName);
        tabs[tabName] = { tab: tabObject, page: pageObject };
        tabObject.on('click', function () { change(tabName); });
    });
    defaultTab = tabRowTabs.eq(0).attr('class'); // use 1st tab
    tabs[currentTab || defaultTab].tab.trigger('click');
});

// eof
