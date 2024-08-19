

// FooterPreview.js
// Used by admin-tool to preview a url

import { EsiHelper } from '../../modules/lib/helpers/dynamic/EsiHelper.js';
import { StyleHelper } from '../../modules/lib/helpers/StyleHelper.js';

export default class FooterPreview {

    constructor(configObjectEditor) {
        this.tool = configObjectEditor;
        this.dataTimeout = null;
        this.container = null;
        this.iframe = null;
        this.title = null;
        this.esiHelper = new EsiHelper(lab_api);
    }

    // Method called by ConfigObjectEditor.
    // Return a method to use as a listener for data-modifications.
    getListener() {
        return this.dataModified.bind(this);
    }

    // May be called frequently. Use a timeout.
    dataModified(data, modifiedPaths, site) {
        this.queueModifiedData(data, site);
    }

    queueModifiedData(data, site) {
        clearTimeout(this.dataTimeout);
        this.dataTimeout = setTimeout(() => {
            this.handleModifiedData(data, site);
        }, 300);
    }

    handleModifiedData(data, site) {
        // Use same method as on front for getting the include-url:
        const url = this.esiHelper.getEsiUrl(data);
        const gui = this.getGui(site);
        gui.title.innerHTML = url || 'No url ...';
        if (!url) { return; }
        gui.title.classList.add('lab-busy');
        fetch(url, { mode: 'cors' })
            .then((response) => {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response.text();
            }).then((html) => {
                gui.footer.innerHTML = html;
                gui.title.classList.remove('lab-busy');
                gui.title.innerHTML += `<br><a href="${ this.getFrontpageUrl(data) }" target="_blank">Edit frontpage</a>`
            }).catch((err) => {
                console.warn(err);
                gui.title.classList.add('lab-error');
            });
    }

    getFrontpageUrl(data) {
        return `/edit/front/id/${ data.pageId }`;
    }

    getGui(site) {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.classList.add('lab-footerpreview');
            this.tool.gui.container.appendChild(this.container);
        }

        if (this.iframe) {
            this.iframe.remove();
        }

        if (this.title) {
            this.title.remove();
        }

        const cssBuild = StyleHelper.getInlineCSS(lab_api, site).map((item) => `<style data-key="${ item.key }">${ item.value }</style>`).join('\n');

        this.title = document.createElement('h4');
        this.container.appendChild(this.title);
        this.iframe = document.createElement('iframe');
        this.container.appendChild(this.iframe);
        this.iframe.contentWindow.document.open();
        this.iframe.contentWindow.document.write(`<html lang="no">
        <head>
            <title>Footer preview</title>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="stylesheet" href="/view-resources/view/css/grid.css">
            <link rel="stylesheet" href="/view-resources/view/css/main.css">
            <link rel="stylesheet" href="/view-resources/view/css/colors.css">
            <link rel="stylesheet" href="/view-resources/view/css/foundation-icons/foundation-icons.css">
            ${ site ? '<link rel="stylesheet" href="/view-resources/view/css/site/' + site + '.css">' : '' }
            ${ cssBuild }
        </head>
        <body>
        <footer class="page"></footer>
        </body>
        </html>`);
        this.iframe.contentWindow.document.close();

        return {
            frame: this.iframe,
            title: this.title,
            body: this.iframe.contentWindow.document.body,
            footer: this.iframe.contentWindow.document.body.querySelector('footer')
        }
    }


}
