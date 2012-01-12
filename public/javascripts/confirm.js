/*
 * Usage: add data-confirm="selector" to your form, where your
 *  modal dialog is found by $("selector"). If a child with class
 *  "confirm" is clicked, the form will be submitted. If a child
 *  with class "cancel" is clicked, the form will close.
 */

$(function() {
    $('form[data-confirm]').submit(function(event) {
        var form = $(event.srcElement);
        var selector = form.data('confirm');

        if (typeof selector == "undefined") {
            return true;
        }
        
        var dialog = $(selector);

        dialog.modal({
            backdrop: true,
            show: true
        });

        $('.confirm', dialog).click(function() {
            console.log('woop');
            form.submit();
            console.log('doop');
        });
        $('.cancel', dialog).click(function() {
            dialog.modal('hide');
        });

        return false; // prevent form submission till confirm
    });
});