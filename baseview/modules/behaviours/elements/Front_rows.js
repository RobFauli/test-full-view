export default class FrontRows {

    constructor(api) {
        this.api = api;
    }

    onSettingsPanel() {
        function getPageselector(siteId, pageId) {
            const currentPageId = lab_api.v1.model.query.getRootModel().getId();
            return lab_api.v1.ui.element.getPageSelector({
                value: pageId ? parseInt(pageId, 10) : null,
                siteId: siteId ? parseInt(siteId, 10) : 0,
                attributes: [{ name: 'name', value: 'pageId' }, { name: 'id', value: 'frontrows_pageId' }],
                pages: lab_api.v1.pages.front.getAll().filter((page) => page.nodeid !== currentPageId)
            });
        }
        return {
            onDisplay: ({
                model, view, config, markup
            }) => {
                const data = model.get('fields.fragment_json') || {}; // pageId, siteId, start, count
                const containers = {
                    siteselector: markup.querySelector('[data-element="siteselector"]'),
                    pageselector: markup.querySelector('[data-element="pageselector"]')
                };
                const siteselector = lab_api.v1.ui.element.getSiteSelector({ value: data.siteId ? parseInt(data.siteId, 10) : null, attributes: [{ name: 'name', value: 'siteId' }, { name: 'id', value: 'frontrows_siteId' }] });
                let pageselector = getPageselector(data.siteId || siteselector.value, data.pageId);
                containers.siteselector.appendChild(siteselector);
                containers.pageselector.appendChild(pageselector);
                siteselector.addEventListener('change', (event) => {
                    pageselector.remove();
                    pageselector = getPageselector(siteselector.value);
                    containers.pageselector.appendChild(pageselector);
                }, false);
            },
            onSubmit: ({
                model, view, settings, markup, formValues
            }) => {
                model.resetExternalResource();
                model.set('fields.fragment_json', formValues);
            }
        };
    }

}
