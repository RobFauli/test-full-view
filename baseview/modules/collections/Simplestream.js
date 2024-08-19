export default class {

    constructor(api) {
        this.api = api;
    }

    onCreated(uiInterface, view) {
        uiInterface.setProperty('videolist', lab_api.v1.config.get('contentbox_settings.simplestream.videolist') || []);
        uiInterface.setProperty('query', {
            proxy: '/ajax/integration-services/proxy/feed/simplestream',
            site: lab_api.v1.properties.get('site').alias,
            search: ''
        });
    }

    onHeader(uiInterface, params) {
        const form = this.api.v1.util.dom.renderView('collections/simplestream/header', {}, true);
        const searchBar = form.querySelector('.search-bar');
        const query = uiInterface.getProperty('query');
        searchBar.addEventListener('change', (event) => {
            query.search = searchBar.value;
            uiInterface.getData(true);
        }, false);
        form.addEventListener('submit', (event) => {
            event.stopPropagation();
            event.preventDefault();
        });
        return form;
    }

    onGetUrl(uiInterface) {
        const query = uiInterface.getProperty('query');
        if (query.search) {
            return `${ query.proxy }?site=${ query.site }&action=search&query=${ query.search }`;
        }
        return `${ query.proxy }?site=${ query.site }&action=list`;
    }

    onMapData(uiInterface, data) {
        if (!data.videos.length) { return []; }
        const result = [];
        const videolist = uiInterface.getProperty('videolist');
        const videos = [...videolist, ...data.videos];
        videos.forEach((item) => {
            result.push(this.mapItem(item));
        });
        return result;
    }

    mapItem(item) {
        let videoType;
        switch (item.type) {
            case 'REPLAY':
                videoType = 'replay';
                break;
            case 'live':
                videoType = 'live';
                break;
            default:
                videoType = 'vod';
        }
        return {
            type: 'simplestream',
            contentdata: {
                fields: {
                    videoId: item.id,
                    videoType,
                    idString: item.idString || 'GB001',
                    uvid: item.id || '',
                    categories: item.categories,
                    duration: item.duration,
                    image: item.image,
                    logo: item.logo,
                    logo_position: item.logo_position,
                    title: item.title
                }
            },
            filtered: {
                image: item.image ? `${ item.image }width=200` : '/images/placeholders/video_48.png'
            }
        };
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
                path: 'filtered.image'
            }
        };
    }

}
