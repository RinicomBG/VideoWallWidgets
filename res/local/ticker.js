'use strict';

/* Simple ticker that moves through the text within an element (flattens anything inside!)
 * marking one character with <mark></mark> each call.
 * sample invocation:
 * const tick = function() {
 *   ticker_tick('element-id');
 *   setTimeout(tick, 1000);
 * };
 * tick();
 */

function ticker_tick(element) {
	let currentIndex = parseInt(element.getAttribute('data-highlight-index')) || 0;
	const text = element.innerHTML.replace(/<[^>]+(>|$)/g, '');
	let newHtml = '';
	for (let i = 0; i < text.length; i++) {
		if (i === currentIndex) {
			newHtml += '<mark>' + text[i] + '</mark>';
		} else {
			newHtml += text[i];
		}
	}
	element.innerHTML = newHtml;
	currentIndex = (currentIndex + 1) % text.length;
	element.setAttribute('data-highlight-index', currentIndex);
}

