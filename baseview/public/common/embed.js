
/*
Example of embed-code
<div class="labrador-cms-embed" data-lab-content="full" data-lab-id="120796" data-lab-site="jo--www-default.localhost"><script async defer src="http://jo--www-default.localhost/embed.js"></script></div>
<div class="labrador-cms-embed" data-lab-content="teaser" data-lab-id="120796" data-lab-site="jo--www-default.localhost"><script async defer src="http://jo--www-default.localhost/embed.js"></script></div>

Front-page with path:
<div class="labrador-cms-embed" data-lab-name="jo-3" data-lab-path="dropZone[0]/row[1]" data-lab-site="jo--www-default.localhost"><script async defer src="http://jo--www-default.localhost/embed.js"></script></div>

*/

(function(){

    // Articles: data-lab-site, data-lab-id
    // Front:    data-lab-site, data-lab-name, data-lab-path or data-lab-guid
    var getUrl = function(element, protocol) {

        // Note: Several instances of this script may be embedden on a page. Make sure each element is only handled once.
        if (element.getAttribute('data-lab-embedded')) {
            return null;
        }
        element.setAttribute('data-lab-embedded', 1);
        var input = {
            site: element.getAttribute('data-lab-site'),
            id:   element.getAttribute('data-lab-id'),
            path: element.getAttribute('data-lab-path'),
            guid: element.getAttribute('data-lab-guid'),
            name: element.getAttribute('data-lab-name'),
            content: element.getAttribute('data-lab-content') || 'teaser' // 'teaser', 'full'
        };

        if (!input.site) { return null; }
        if (!input.id && ((!input.path && !input.guid) || !input.name)) { return null; }

        input.domain = protocol + '//' + input.site;
        input.url = input.domain + (input.id ? '/a/' + input.id + '?lab_viewport=embed&lab_content=' + input.content : '/' + input.name + '?lab_viewport=embed&' + (input.guid ? 'lab_guid=' + input.guid : 'lab_path=' + input.path));
        
        return input;
    };

    // Return [chars] char random hex.
    var unique = function(chars) {
        var multiplier = "0x" + (Math.pow(10, chars-1));
        return Math.floor((1 + Math.random()) * multiplier).toString(16);
    };

    var embed = function(element) {
        var input = getUrl(element, location.protocol);
        if (!input) {
            // Missing data in input-element or already processed (if multiple instances of this script)
            return;
        }
        var loader = document.createElement('div');
        loader.innerHTML = 'Loading content from Labrador CMS ...';
        loader.setAttribute('style', 'margin: 2em; color: gray; text-align: center; font-family: Helvetica; font-size: 16px;');
        element.appendChild(loader);
        var frame = document.createElement('iframe');
        var frameId = unique(12);
        frame.setAttribute('id', frameId);
        frame.setAttribute('src', input.url);
        frame.setAttribute('style', 'width:100%; height:300px; border:0; max-height:100vh;');
        frame.addEventListener('load', function(event) {
            loader.remove();
            // Ask the loaded document for its height. Answer handled in method receiveMessage.
            frame.contentWindow.postMessage({ request: 'labCmsGetPageHeight', frameId: frameId }, '*');
        }, false);
        element.appendChild(frame);
    };

    // A MessageEvent is posted from a document of an iframe.
    // Validate and get document-height:
    function receiveMessage(event) {
        // Require data:
        if (!event.data || !event.data.request|| !event.data.result || event.data.frameId === undefined) {
            return;
        }
        // var frame = window.lab_embed_frames[event.data.index];
        var frameId = event.data.frameId;
        if (frameId) {
            var frame = document.getElementById(frameId);
            if (frame) {
                frame.style.height = event.data.result + 'px';
            }
        }
    }

    // Listen for MessageEvent (postMessage)
    window.addEventListener("message", receiveMessage, false);

    // Get all embed-instances:
    var elements = document.querySelectorAll('div.labrador-cms-embed');
    [].forEach.call(elements, function(element) {
        embed(element);
    });

})();
