

// PaywallPreview.js
// Used by admin-tool to preview a paywall

export default class PaywallPreview {

    constructor(configObjectEditor) {
        this.importResources();
        this.tool = configObjectEditor;
        this.template = null;
        this.dataTimeout = null;
        this.container = null;
        this.iframe = null;
        this.title = null;
        this.current = {
            data: null,
            site: null
        };
    }

    importResources() {
        fetch('/view-resources/view/content/bodytext/template/paywall_teaser.template.mustache').then((response) => {
            return response.text();
        }).then((template) => {
            this.setTemplate(template);
        }).catch((err) => {
            console.warn('PaywallPreview: Failed reading paywall-template:', err);
        });
    }

    // Method called by ConfigObjectEditor.
    // Return a method to use as a listener for data-modifications.
    getListener() {
        return this.dataModified.bind(this);
    }

    // May be called frequently. Use a timeout.
    dataModified(data, modifiedPaths, site) {
        this.current.data = data;
        this.current.site = site;
        if (!this.template) {
            return;
        }
        this.queueModifiedData(data, site);
    }

    queueModifiedData(data, site) {
        clearTimeout(this.dataTimeout);
        this.dataTimeout = setTimeout(() => {
            this.handleModifiedData(data, site);
        }, 100);
    }

    handleModifiedData(data, site) {
        if (data.teaser.offers) {
            for (const offer of data.teaser.offers) {
                // The key 'providerUrl' is added in admin. Use it to generate url.
                if (offer.providerUrl) {
                    // Note: Hard code '${front_api_url}'. Will be resolved by ConfigReader.
                    offer.url = '${front_api_url}/paywall/order?providerUrl=' + encodeURIComponent(offer.providerUrl);
                } else {
                    offer.url = '';
                }
            }
        }
        const gui = this.getGui(site);
        gui.title.innerHTML = `Pawyall-preview for site <strong>${ site || 'all sites' }</strong>`;
        gui.body.innerHTML = Mustache.render(this.getTemplate(data.bodytext.lineCount), { getConfig: { paywall: { teaser: data.teaser } } });
        if (!data.teaser.offers || !data.teaser.offers.length) {
            const innerElement = gui.body.querySelector('.paywallTeaser .inner');
            if (innerElement) {
                innerElement.innerHTML = '<h2>No offers defined ...</h2>';
            }
        }
        for (const anchor of [...gui.body.querySelectorAll('a')]) {
            anchor.setAttribute('target', '_blank');
        }
    }

    setTemplate(template) {
        this.template = template;
        if (this.current.data) {
            this.handleModifiedData(this.current.data, this.current.site);
        }
    }

    getTemplate(lineCount) {
        if (!this.template) {
            return null;
        }
        return `
        <div class="bodytext teaserContent large-12 medium-12 small-12" style="font-family: helvetica; font-size: 16px;">
            ${ this.dummytextGenerator(lineCount) }
            ${ this.template }
        </div>
        `
    }

    dummytextGenerator(lineCount) {
        let counter = 0;
        let lines = [];
        while (counter < lineCount) {
            counter++;
            lines.push(`<p>Line #${ counter } Lorem ipsum dolor sit amet, consectetur adipiscing elit. In semper malesuada dui sed lobortis. Praesent id vehicula nisl. Ut eget iaculis lorem. Duis vitae vehicula ex. Suspendisse et consequat lectus, sit amet consectetur metus. Mauris sollicitudin lorem in libero lobortis, sed vehicula tortor imperdiet.</p>`);
        }
        return lines.join("\n");
    }

    getGui(site) {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.classList.add('lab-paywallpreview');
            this.tool.gui.container.appendChild(this.container);
        }

        if (!this.title) {
            this.title = document.createElement('h4');
            this.container.appendChild(this.title);
        }

        if (!this.iframe) {
            this.iframe = document.createElement('iframe');
            this.container.appendChild(this.iframe);
        }

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
        </head>
        <body>
        </body>
        </html>`);
        this.iframe.contentWindow.document.close();

        return {
            frame: this.iframe,
            title: this.title,
            body: this.iframe.contentWindow.document.body
        }
    }

}
