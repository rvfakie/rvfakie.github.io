// global Header onscroll
var outta = false;

$(document).ready(function () {

	$(window).on('scroll', function() {
		if ( $(window).scrollTop() - ($('.image-wrap').height() - 40) >= $('.image-wrap').offset().top ) {
			$('.header').addClass('fixed');
			setTimeout(function() {
				outta = true;
			}, 500)
		} else {
			$('.header').removeClass('fixed');
			headUp();
			setTimeout(function() {
				outta = false;
			}, 500)
		}
	})
	
	$('.mobile-car-info-menu').on('click', function(e) {
		e.preventDefault();
		$('.car-info-menu').toggleClass('shown');
	})
	
	// Mobile button click + body.animate
	$('.mobile-action').on('click', function(e) {
		e.preventDefault();
		if (!($('.header').hasClass('fixed')) && ($('.mobile-btn').hasClass('expanded'))) {
			$('body').animate({ scrollTop: $($(this).attr('href')).offset().top - 40 }, 250);
		}
	})
	
	// Section scrolling action class
	$('.scrollTo').on('click', function(e) {
		
	})

	$('.mobile-menu-fadeOut').on('click', function() {
		easeMobile();
	})
	
})

var itemBlock = '.item-block',
	descBlock = '.description',
	descWrap = '.desc-wrap';
	
$(window).on('resize', function() {
	itemsToggleMargin()
});

// Menu on scrollTop unexpand function
function headUp() {
	if (outta == true) {
		$('.mobile-btn').removeClass('expanded');
		$('.mobile-menu, .header, .content, .mobile-menu-fadeOut, .mobile-car-info-menu').removeClass('mobile-menu-expanded');
		$('body').removeClass('mobile-menu-expanded');
		$('.car-info-menu').removeClass('shown');
	}
}

function prevent(e) {
	e.preventDefault();
}

function closeMobileCarInfoMenu(elem) {
	$(elem).parents('.shown').removeClass('shown');
}

function goToAction(item) {
	var target = item.attr('data-href');
	if ($('.header').hasClass('fixed')) {
		$('html, body').animate({
			scrollTop: $('#'+ target).offset().top - $('.header').innerHeight()
		}, 350);
	} else {
		$('html, body').animate({
			scrollTop: $('#'+ target).offset().top - 40
		}, 350);
	}
}

function stickMenu() {
	if ($(window).scrollTop() > ($(descBlock).offset().top + $(descBlock).height() - $('.car-info-menu').innerHeight() - $('.header').innerHeight() )) {
		
		$('.car-info-menu').removeClass('fixed').addClass('bottom').css('bottom', $('.item-block').height() + 60 + 'px');

	} else if ($(window).scrollTop() < ($('.img-wrap').offset().top + $('.img-wrap').innerHeight() - $('.header').innerHeight())) {
		$('.car-info-menu').removeClass('fixed').removeClass('bottom').css('bottom', 'auto');
	} else {
		$('.car-info-menu').addClass('fixed').removeClass('bottom').css('bottom', 'auto');
	}
}

function colorMenu() {
	if ($(window).scrollTop() >= $('.desc-wrap th').offset().top - $('.header').innerHeight()) {
		$('.car-info-menu a.car_th_1').addClass('active');
	}
}

function stylizeFilterSelect() {
	setTimeout(function(){
		$('.fk-picker').ikSelect('detach');
		$('.fk-picker').ikSelect({
		    autoWidth: false,
		    equalWidths: true
	    });
	    $('.ik_select_dropdown').css('width', $('.ik_select_link').css('width'))
	},5)
}

function stylizeModelSelect() {
	setTimeout(function(){
		$('.fk-model').ikSelect('detach');
		$('.fk-model').ikSelect({
		    autoWidth: false,
		    equalWidths: true
	    });
	    $('.ik_select_dropdown').css('width', $('.fk-model').prevAll('.ik_select_link').css('width'))
	},10)
}

function toggleFilters() {
	$('.filter-caption i').toggleClass('active');
	$('.inputs-wrapper').toggleClass('active');
	$('.car-info-menu').toggleClass('no-filter');
}

function openCarInfo(elem) {
	$('.car-info-menu').addClass('active');
	if (!($('.rims')).length) {
		$('.mobile-car-info-menu').addClass('active');
	}
	$('.item-block .item-wrapper.active').removeClass('active');
	$(elem).children('.item-wrapper').addClass('active');
	$(itemBlock).addClass('expanded')
	$(descBlock).addClass('expanded')
	$(descWrap).addClass('expanded');
	$('.remove-after').remove();
	if ($(window).scrollTop() > $(descBlock).offset().top) {
		$('body').animate({ scrollTop: $('.filter-block').offset().top + $('.filter-block').outerHeight() - $('.header').height() }, 1);
	}	
	itemsToggleMargin()
}

function closeCarInfo() {
	$('.car-info-menu, .mobile-car-info-menu').removeClass('active');
	$('.item-block .item-wrapper.active').removeClass('active');
	$(itemBlock).removeClass('expanded');
	$(descBlock).removeClass('expanded');
	$(descWrap).removeClass('expanded');
	itemsToggleMargin()
}

function itemsToggleMargin() {
	setTimeout(function() {
		if ($(descBlock).hasClass('expanded')) {
			var pad = $(descBlock).innerHeight() + 60;
			$(itemBlock).css('transform', 'translate3d(0,'+ pad +'px,0)');
			$(itemBlock).css('-webkit-transform', 'translate3d(0,'+ pad +'px,0)');
			$(itemBlock).parents('.container').css('padding-bottom', pad)
		} else {
			$(itemBlock).css('transform', 'translate3d(0,0,0)');
			$(itemBlock).css('-webkit-transform', 'translate3d(0,0,0)');
			$(itemBlock).parents('.container').css('padding-bottom', '0')
		}
	}, 30)
}

function easeMobile() {
	$('.mobile-btn').toggleClass('expanded');
	$('.mobile-menu, .header, .content, .mobile-menu-fadeOut, .mobile-car-info-menu').toggleClass('mobile-menu-expanded');
	$('body').toggleClass('mobile-menu-expanded');
}





