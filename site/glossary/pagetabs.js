/*file: pagetabs */
/*global $, localStorage */
/*jslint devel: true, unparam: true */

// NOTE
// ====
// This should load last, so that it may trigger other tab scripts by
// simulating a click on its tab. (For this to work the receiving end needs to
// have initialized and be ready to receive.)


// Page tabs are defined by the children elements of an element with the
// 'id=tab-row' attribute set. (Not all descendant are search, just one level
// deep.) Each child element should have 'class' set to the class of the
// corresponding page. The currently selected tab is marked by adding a
// 'class=selected' (match this with CSS to highlight the current tab for the
// end user).
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
//       <nav>
//         <ul id=tab-row>
//           <li class=one>Tab One</li>
//           <li class=two>Tab Two</li>
//         </ul>
//       </nav>
//       <section class="one hidden">Page One</section>
//       <section class="two hidden">Page Two</section>
//     </article>
//     <script src="pagetabs.js"></script>
//
// The currently selected tab is stored in localStorage, so that on page
// reload, the same tab remains open.
//

$(function () {
    'use strict';
    var storageName = 'current-tab-name',
        currentTabName = localStorage.getItem(storageName), // stored tab name
        currentTabElement = null,
        pagetabs = {
            selected: '',
            tabs: {},
            change: function (newTabName) {
                var oldPage = this.tabs[this.selected],
                    newPage = this.tabs[newTabName];
                if (!newPage) {
                    // this should never happen
                    alert("Tab '" + newTabName + "' does not exist.");
                    return false;
                }
                if (pagetabs.selected) {
                    oldPage.tabElement.removeClass('selected');
                    oldPage.pageElement.addClass('hidden');
                }
                this.selected = newTabName;
                localStorage.setItem(storageName, newTabName);
                newPage.tabElement.addClass('selected');
                newPage.pageElement.removeClass('hidden');
            }
        };

    // get tabs from #tab-row, build data structure
    $('#tab-row > *').each(function (index, element) {
        element = $(element);  // DOM -> jQuery element
        var name = element.attr('class');
        if (name) {
            if (name === currentTabName || !currentTabElement) {
                currentTabElement = element;
            }
            pagetabs.tabs[name] = {
                tabElement:  element,
                pageElement: $('[role="main"] > .' + name)
            };
            element.on('click', function () { pagetabs.change(name); });
        }
    });

    // trigger update of everything under that tab
    currentTabElement.trigger('click');
});

// eof
