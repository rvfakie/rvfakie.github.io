var codeQuery = [
	'{', '}', '[', ']', '$', '#', '.', '?', '/', '|', '&', 'var', 'let', '!', '!=', '=', '0', 'i', 'prototype',
	'Object', 'value', 'x', 'indexOf', '(', ')', '()', '{}', '[]', 'i++', '+', '-', '%', '&&', ':', '||', '', 
	'getBounds', 'undefined', 'null', 'Infinity', 'NaN', 'script', '<', '>', '>=', '<=', 'if', 'else', 'switch',
	'function', 'argument', 'callback', 'data', '$scope', 'return', 'false', 'true'
];
var maxLength = 6;
var iterator = 0;
$(document).ready(function() {
	setTimeout(function() {

		$('.code').html('');
		var intervalCode = setInterval(function() {
			if (iterator === maxLength) {
				clearInterval(intervalCode);
				iterator = 0;
			}
			$('.code').html($('.code').html() + codeQuery[getRandomInt(0, codeQuery.length - 1)] + ' ');
			iterator++;
		}, 200)
		

		setInterval(function () {
			$('.code').html('');
			var intervalCode = setInterval(function() {
				if (iterator === maxLength) {
					clearInterval(intervalCode);
					iterator = 0;
				}
				$('.code').html($('.code').html() + codeQuery[getRandomInt(0, codeQuery.length - 1)] + ' ');
				iterator++;
			}, 200)
		}, 5000);

	}, 2000);
});

getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};