var showAction = function(text) {
    if (!$('.action-window-wrapper').hasClass('shown')) {

        $('.action-window-wrapper').addClass('shown');

        $('.action-text').html('');
        $('.action-text').html(text);
        
        setTimeout(function() {
            $('.action-window-wrapper').removeClass('shown');
        }, 2000)
        
    }
};

var showNamesInput = function(marker) {

    $('.names-window input').val('');
    $('.names-save-button, .names-wrap, .names-wrap i').off('click');

    $('.names-window, .names-wrap').addClass('shown');

    $('.names-window input').val(marker.text);

    $('.names-window input').focus();


    $('.names-save-button').on('click', function() {
        marker.text = $('.names-window input').val();
        hideNamesInput(marker);
    });

    $('.names-wrap, .names-wrap i').on('click', function() {
        hideNamesInput(marker);
    });


};

var hideNamesInput = function(marker) {
    $('.names-window, .names-wrap').removeClass('shown');
    marker.setOptions({animation: null});
};