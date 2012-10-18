
$(function () {
    var that = this;
    var tabs = {
        selected: 'add',
        tabs: {
            add: {
                tabElement:  $('nav.tabs .add'),
                pageElement: $('section.add'),
                onShow: function () { },
                onHide: function () { },
            },
            test: {
                tabElement:  $('nav.tabs .test'),
                pageElement: $('section.test'),
                onShow: function () { },
                onHide: function () { },
            },
            extract: {
                tabElement:  $('nav.tabs .extract'),
                pageElement: $('section.extract'),
                onShow: function () { },
                onHide: function () { },
            },
            known: {
                tabElement:  $('nav.tabs .known'),
                pageElement: $('section.known'),
                onShow: function () { },
                onHide: function () { },
            }
        },
        change: function (newTab) {
            var oldPage = this.tabs[this.selected], newPage;
            oldPage.onHide();
            oldPage.tabElement.removeClass('selected');
            oldPage.pageElement.addClass('hidden');
            this.selected = newTab;
            newPage = this.tabs[newTab];
            newPage.tabElement.addClass('selected');
            newPage.pageElement.removeClass('hidden');
            newPage.onShow();
        },
    };

    Object.keys(tabs.tabs).map(function (name) {
        value = tabs.tabs[name];
        value.tabElement.on('click', function () { tabs.change(name) });
    });
});

// eof
