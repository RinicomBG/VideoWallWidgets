$(window).resize(function() {
	if(this.resizeTO) {
		clearTimeout(this.resizeTO);
	}
	this.resizeTO = setTimeout(function() {
		$(this).trigger('resizeEnd');
	}, 500);
});

// Example usage:
// $(window).bind('resizeEnd', function() {
//    do something, window hasn't changed size in 500ms
// });

