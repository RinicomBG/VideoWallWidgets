'use strict';

function ticker_tick(element) {
    // Retrieve or initialize the current index
    let currentIndex = parseInt(element.getAttribute('data-highlight-index')) || 0;
    
    // Get the text content of the span
    const text = element.innerHTML.replace(/<[^>]+(>|$)/g, '');
	// const text = element.textContent;
    
    // Reset the inner HTML to remove the current highlight (if any)
    //element.innerHTML = '';
	let newHtml = '';
    
    // Loop through each character and wrap the highlighted one in a <mark> tag
    for (let i = 0; i < text.length; i++) {
        if (i === currentIndex) {
            // Highlight the current character
            newHtml += '<mark>' + text[i] + '</mark>';
        } else {
            // Keep other characters unhighlighted
            newHtml += text[i];
        }
    }
    
	// update the element html
	element.innerHTML = newHtml;

    // Update the index for the next call
    currentIndex = (currentIndex + 1) % text.length;
    element.setAttribute('data-highlight-index', currentIndex);
}

