/**
 * Click image to zoom
 * (c) Publish Lab AS 2018
 * stian.andersen@publishlab.com
 */

(function(){
    var _container = null;
    var _content = null;
    var _size = {
        max: {
            width: 1740,
            height: 1740
        },
        buffer: 140,
        window: {
            width: window.innerWidth,
            height: window.innerHeight,
        }
    };

    var images = document.querySelectorAll("figure[data-zoomable='1']");    
    if (!images.length) return;

    var registerEvents = function(image) {
        image.addEventListener('click', function(e) {
            zoomImage(image);
        }, false);
    }

    var createContainer = function() {
        _container = document.createElement('div');
        _container.classList.add('imagezoom');
        _content = document.createElement('div');
        _content.classList.add('content');
        _container.appendChild(_content);
        document.body.appendChild(_container);
    }

    var zoomImage = function(sourceImage) {
        if (!_container) createContainer();
        var originalImage = sourceImage.querySelector('img');
        if (!originalImage) return;
        var aspectRatio = originalImage.width / originalImage.height;
        if (!aspectRatio) return;
        _size.window.width = window.innerWidth;
        _size.window.height = window.innerHeight;
        var width = Math.min(_size.max.width, _size.window.width);
        var height = width / aspectRatio;
        var heightDiff = height - (Math.min(_size.max.height, _size.window.height));
        if (heightDiff > 0) {
            height -= heightDiff;
            width -= heightDiff * aspectRatio;
        }
        width = Math.round(width * 1.5);
        height = Math.round(height * 1.5);
        var figure = sourceImage.cloneNode(true);
        var image = figure.querySelector('img');
        var src = image.currentSrc ? image.currentSrc : image.src;
        const sources = figure.querySelectorAll('source');
        const srcValue = src + '&width=' + width + '&height=' + height;
        for (const source of sources) {
            source.setAttribute('srcset', srcValue);
        }
        image.setAttribute('src', srcValue);
        image.removeAttribute('width');
        image.removeAttribute('height');
        figure.classList.add('image-loading');
        const style = image.getAttribute('style') || '';
        image.style.width = `100vw`;
        image.addEventListener('load', (event) => {
            image.setAttribute('style', style);
            figure.classList.remove('image-loading');
        }, false);
        image.addEventListener('click', function(e) {
            endZoom();
        }, false);
        _content.setAttribute('data-isWide', aspectRatio >=1 ? 'true' : 'false');
        while (_content.firstChild) {
            _content.removeChild(_content.firstChild);
        }
        _content.appendChild(figure);
        const closeBtn = document.createElement('span');
        closeBtn.setAttribute('title', 'Close (Escape)');
        closeBtn.classList.add('close-btn', 'fi-x');
        closeBtn.addEventListener('click', function(e) {
            endZoom();
        }, false);
        _content.appendChild(closeBtn);
        displayZoom();
    }

    var keydown = function(e) {
        if (e.key == 'Escape') {
            endZoom();
        }
    }

    var displayZoom = function() {
        _container.classList.add('visible');
        document.addEventListener('keydown', keydown, false);
    }

    var endZoom = function() {
        _container.classList.remove('visible');
        document.removeEventListener('keydown', keydown, false);
    }

    for (var i = 0; i < images.length; i++) {
        registerEvents(images[i]);
    }

})();
