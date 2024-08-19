export class EsiHelper {

    constructor(api) {
        this.api = api;
    }

    register(model, sitename) {

        if (this.api.v1.app.mode.isFragmentMode()) {
            Sys.logger.debug('[EsiHelper] Labrador is is fragment-mode. Will not register ESI. Skipping.');
            return;
        }
        if (!model) {
            Sys.logger.debug('[EsiHelper] Missing model, cannot process. Skipping.');
            return;
        }

        // Include a footer from another page (fragment-api)
        // Example-url: http://api-www-default.localhost/fragment/structure/?pageId=104907&path=/dropzone&structureType=row&start=0&count=1
        // This config can be set using an admin-tool
        const footerInclude = this.api.v1.config.get('footer.include');
        if (footerInclude && footerInclude.pageId) {
            const footerUrl = this.getEsiUrl(footerInclude);
            if (footerUrl) {
                if (footerInclude.render === 'client') {
                    model.setFiltered('renderFooter.url', footerUrl);
                } else {
                    this.insertEsi(model, footerUrl, 'esi_footer');
                }
            } else {
                Sys.logger.warning('[EsiHelper] Cannot prepare url for footer-fragment. Missing url.');
            }
        }

        /*
        // Add to Config-object for site:
        "header": {
            "include": {
                "path": "/dropzone",
                "count": 1,
                "start": 0,
                "pageId": 121919,
                "structureType": "topcomments"
            }
        }
        Draw in client: ("render" = "client")
        "header": {
            "include": {
                "path": "/dropzone",
                "count": 1,
                "start": "0",
                "pageId": 103486,
                "structureType": "row",
                "render": "client"
            },
            "includes": [{
                "path": "/dropzone",
                "count": 1,
                "start": "4",
                "pageId": 103486,
                "structureType": "row",
                "render": "client"
            }]
        }
        */

        const headerInclude = this.api.v1.config.get('header.include');
        const headerIncludes = this.api.v1.config.get('header.includes') || [];
        const headerIncludeUrls = [];
        if (headerInclude && headerInclude.pageId) {
            const clientRenderUrl = this.insertHeader(headerInclude, model);
            if (clientRenderUrl) {
                headerIncludeUrls.push(clientRenderUrl);
            }
        }
        for (const include of headerIncludes) {
            if (include && include.pageId) {
                const clientRenderUrl = this.insertHeader(include, model);
                if (clientRenderUrl) {
                    headerIncludeUrls.push(clientRenderUrl);
                }
            }
        }
        model.setFiltered('renderHeader.urls', headerIncludeUrls.map((url) => `'${ url }'`).join(', '));
    }

    getEsiUrl(config) {
        if (!config.pageId) { return null; }
        const attributes = ['pageId', 'path', 'structureType', 'start', 'count'];
        const urlArguments = [];
        attributes.forEach((attr) => {
            if (config[attr] !== undefined && config[attr] !== '' && config[attr] !== null) {
                urlArguments.push(`${ attr }=${ config[attr] }`);
            }
        });
        // Require all attributes to be present:
        if (urlArguments.length === attributes.length) {
            let front_api_url = this.api.v1.properties.get('front_api_url');
            if (this.api.v1.app.mode.isEditor()) {
                if (document.location.protocol === 'https:') {
                    // Enforce same protocol:
                    front_api_url = front_api_url.replace('http:', 'https:');
                }
            }
            return `${ front_api_url }/fragment/structure/?${ urlArguments.join('&') }`;
        }
        return null;
    }

    insertEsi(model, url, selector) {
        Sys.logger.debug(`[EsiHelper] Will insert fragment for selector: "${ selector }", url: "${ url }".`);
        this.api.v1.model.insert.atPath({
            path: model.getPath(),
            data: {
                type: 'esi',
                selector,
                contentdata: {
                    fields: {
                        url,
                        identifier: selector
                    }
                },
                state: {
                    isNonPersistent: true
                }
            },
            options: {
                frontpage: true,
                articlepage: true
            }
        });
        if (this.api.v1.app.mode.isEditor()) {
            // In editor a placeholder is by now inserted.
            // Fetch markup from url and replace placeholder:
            this.fetchEditorEsi(url, `${ selector }`);
        }
    }

    insertHeader(headerInclude, model) {
        const headerUrl = this.getEsiUrl(headerInclude);
        if (headerUrl) {
            if (headerInclude.render === 'client') {
                Sys.logger.debug(`[EsiHelper] Found url for header-fragment to render in client: "${  headerUrl  }".`);
                return headerUrl;
            }
            this.insertEsi(model, headerUrl, 'esi_header');
        } else {
            Sys.logger.warning('[EsiHelper] Cannot prepare url for header-fragment. Missing url.');
        }
        return null;
    }

    fetchEditorEsi(url, selector) {
        this.api.v1.view.on('domRendered', (elements, viewport) => {
            const model = this.api.v1.model.query.getModelBySelector(selector);
            if (!model) {
                return;
            }
            Sys.logger.debug(`EsiHelper.fetchEditorEsi: Will fetch esi-substitute for editor. Selector: ${ selector }, url: ${ url }`);
            this.api.v1.util.httpClient.get(url, { credentials: 'omit', type: 'text' })
                .then((html) => {
                    const view = lab_api.v1.view.getView(model, viewport);
                    const tmpl = document.createElement('template');
                    tmpl.innerHTML = html;
                    Sys.logger.debug(`EsiHelper.fetchEditorEsi: Esi-substitute fetched. Selector: ${ selector }, element-count: ${ tmpl.content.children.length }`);
                    if (!view.markup) {
                        Sys.logger.warn(`EsiHelper.fetchEditorEsi: Element markup not found. Cannot insert dom-element(s). Selector: ${ selector }`);
                        return;
                    }
                    for (const element of [...tmpl.content.children]) {
                        view.markup.parentElement.insertBefore(element, view.markup);
                    }
                    view.markup.remove();
                }).catch((err) => {
                    Sys.logger.warning(`EsiHelper.fetchEditorEsi: Esi-substitute could not be fetched. Selector: ${ selector }, error: ${ err }`);
                });
        });
    }

}
