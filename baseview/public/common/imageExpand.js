
(function(){
    // Toggle expanded-state of image-captions
    const elements = document.querySelectorAll('[data-expandable]');
    const handler = event => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.toggle('expanded');
    }
    for (const element of elements) {
        element.addEventListener('click', handler, false);
    }
})();
