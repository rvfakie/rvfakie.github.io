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