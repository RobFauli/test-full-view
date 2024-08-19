export default class {

    constructor(api) {
        this.api = api;
    }

    onCreated(uiInterface, options) {
        const channelConfig = lab_api.v1.config.get('media.jwplayer.channel') || {};
        uiInterface.setProperty('channelConfig', channelConfig);
        uiInterface.setProperty('query', {
            search: '',
            limit: 30,
            currentToken: null,
            nextPageToken: null,
            prevPageToken: null,
            page: 1
        });
    }

    onHeader(uiInterface, params) {
        const form = this.api.v1.util.dom.renderView('collections/jwplayer/header', {
            channelConfig: uiInterface.getProperty('channelConfig')
        }, true);
        const query = uiInterface.getProperty('query');

        const searchBar = form.querySelector('.search-bar');

        const update = () => {
            if (searchBar) {
                query.search = searchBar.value || '';
            }

            uiInterface.getData(true);
        };

        searchBar.addEventListener('change', update.bind(this));

        form.addEventListener('submit', (event) => {
            event.stopPropagation();
            event.preventDefault();
        });

        return form;
    }

    onFooter(uiInterface, params) {
        const form = this.api.v1.util.dom.renderView('collections/jwplayer/footer', {}, true);

        uiInterface.setDomElement('previewPageElement', form.querySelector('.lab-footer-prev'));
        uiInterface.getDomElement('previewPageElement').addEventListener('click', (event) => {
            this.navigate(uiInterface, false);
        }, false);

        uiInterface.setDomElement('nextPageElement', form.querySelector('.lab-footer-next'));
        uiInterface.getDomElement('nextPageElement').addEventListener('click', (event) => {
            this.navigate(uiInterface, true);
        }, false);

        form.querySelector('.lab-footer-reload').addEventListener('click', (event) => {
            uiInterface.getData(true);
        }, false);
        uiInterface.setDomElement('pageCounterElement', form.querySelector('.lab-footer-counter'));
        return form;
    }

    onGetUrl(uiInterface) {
        const query = uiInterface.getProperty('query');
        const siteAlias = lab_api.v1.site.getSite().alias;
        const args = [
            `num=${ query.limit }`,
            `site=${ siteAlias }`
        ];
        if (query.search) {
            args.push(`q=${ query.search }`);
        }
        if (query.currentToken) {
            args.push(`token=${ query.currentToken }`);
        }
        return `/ajax/integration/get-collection?_service=jwplayer&${ args.join('&') }`;
    }

    onMapData(uiInterface, data) {
        const query = uiInterface.getProperty('query');
        query.nextPageToken = null;
        query.prevPageToken = null;
        query.currentToken = null;

        if (!data.results.length) { return []; }

        if (typeof (data.pagination) !== 'undefined') {
            if (data.pagination.nextPage) { query.nextPageToken = data.pagination.nextPage; }
            if (data.pagination.prevPage) { query.prevPageToken = data.pagination.prevPage; }
        }

        const results = [];

        data.results.forEach((item) => {
            results.push({
                type: 'jwplayer',
                contentdata: {
                    fields: {
                        vid: item.id.videoId ? item.id.videoId : item.id,
                        preview: item.preview,
                        title: item.title,
                        description: item.extra_metadata_json.metadata.description
                    }
                }
            });
        });
        uiInterface.getDomElement('pageCounterElement').innerHTML = query.page;
        return results;
    }

    onProperties(uiInterface) {
        return {
            autoItemSizing: true,  // Adjust grid-styling for items ('.lab-item') based on menu width.
            displayAsGrid: true,    // Set to true for images etc.
            isMedia: true           // Set to true for images etc.
        };
    }

    onItemProperties(uiInterface) {
        return {
            title: {
                path: null,
                content: null
            },
            description: {
                path: 'fields.title',
                content: null
            },
            imageUrl: {
                path: 'fields.preview'
            }
        };
    }

    // Todo: Fix pagination ...
    navigate(uiInterface, forward) {
        const query = uiInterface.getProperty('query');
        const active = forward ? 'nextPageToken' : 'prevPageToken';
        if (!query[active]) {
            return;
        }
        if (forward) {
            query.page++;
        } else {
            query.page--;
        }
        query.currentToken = query[active];
        uiInterface.setProperty('query', query);
        uiInterface.getData();
    }

}
