// requires jQuery
(function () {
    var undo = [];
    // remove table row from within which it was triggered
    function zapTableRow(event) {
        var targetElement = $(event.currentTarget).closest('tr');
        event.stopPropagation();
        undo.push(targetElement);
        targetElement.css('display', 'none');
    }
    function unzapTableRow() {
        var targetElement = undo.pop()
            event.stopPropagation();
        if (targetElement) {
            targetElement.css('display', 'table-row');
        }
    }
    $('table .zap').click(zapTableRow);
    $('table .unzap').click(unzapTableRow);
}());

//eof
