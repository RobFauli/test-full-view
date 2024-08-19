
(function(){
    // Display or hide embed-element:
    var btn = document.querySelector('.dac-embed-this input');
    var popup = document.querySelector('.dac-embed-this .dac-embed-this-popup');
    if (!btn || !popup) { return; }
    var textarea = popup.querySelector('textarea');
    if (!textarea) { return; }
    var typeRadioTeaser = popup.querySelector('input[value="teaser"]');
    var typeRadioFull = popup.querySelector('input[value="full"]');
    if (typeRadioTeaser && typeRadioFull) {
        typeRadioTeaser.addEventListener('click', function(event) { popup.classList.remove('dac-type-full'); }, false);    
        typeRadioFull.addEventListener('click', function(event) { popup.classList.add('dac-type-full'); }, false);    
    }
    var closeBtn = popup.querySelector('a');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(event) { popup.classList.toggle('dac-open'); event.preventDefault(); }, false);
    }
    btn.addEventListener('click', function(event) { popup.classList.toggle('dac-open'); }, false);
    // textarea.addEventListener('focus', function(event) { this.select(); }, false);
})();
