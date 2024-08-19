import { DateTimeHelper } from '../../lib/helpers/datetime/DateTimeHelper.js';

export default class Comments {

    constructor(api) {
        this.api = api;
        this.dateTimeHelper = new DateTimeHelper(this.api.v1.config.get('lang'));
        this.sources = {
            disqus_most_popular: {
                source: 'disqus',
                url: `${ lab_api.v1.properties.get('integration_url') }/feed/disqus/?site=${ lab_api.v1.properties.get('site.alias') }&action=popular`,
                name: 'Most commented articles',
                description: ''
            },
            hyvor_most_popular: {
                source: 'hyvor',
                url: `${ lab_api.v1.properties.get('integration_url') }/feed/hyvor/?site=${ lab_api.v1.properties.get('site.alias') }&action=popular`,
                name: 'Most commented articles',
                description: ''
            },
            hyvor_recent: {
                source: 'hyvor',
                url: `${ lab_api.v1.properties.get('integration_url') }/feed/hyvor/?site=${ lab_api.v1.properties.get('site.alias') }&action=recent`,
                name: 'Recent comments',
                description: ''
            }
        };
    }

    getSourceConfig(model, view) {
        /*
        // Example of config
        {
            "contentbox_settings": {
                "comments": {
                    "sources": [
                        {
                            "type": "disqus_most_popular",
                            "name": "Mest kommentert",
                            "description": "bla bla"
                        }
                    ]
                }
            }
        }

        Data that may be defined on the element:
        - fields.source         'disqus_recent_comments', 'disqus_most_popular' (default)
        - fields.limit          '10' (default [1-10])
        - fields.title          The title. Default defined in default config below.
        - fields.description    The description. Default defined in default config below.
        */

        const commentsProviderObj = lab_api.v1.config.get('comments_provider') || {};
        const commentsProvider = Object.keys(commentsProviderObj).shift();

        let defaultSource;
        switch (commentsProvider) {
            case 'hyvor':
                defaultSource = 'hyvor_most_popular';
                break;
            default:
                defaultSource = 'disqus_most_popular';
        }

        const selectedSource = model.get('fields.source') || defaultSource;
        const title = model.get('fields.title');
        const description = model.get('fields.description');
        const limit = Math.min(parseInt(model.get('fields.limit') || '5', 10), 30);

        // (array) Get sources from config. Require value of "type"-attribute of each source to be present in sources defined above.
        const config = (lab_api.v1.config.get('contentbox_settings.comments.sources') || []).filter((item) => this.sources[item.type] !== undefined && this.sources[item.type].source === commentsProvider);
        const isEditMode = lab_api.v1.app.mode.isEditor();

        if (!config.length) {
            Sys.logger.warning(`comments: Missing required config "contentbox_settings.comments.sources". Options (type): ${ Object.keys(this.sources).join(', ') }`);
            if (isEditMode) {
                model.setFiltered('error', 'Missing required source(s).');
            }
            return null;
        }

        // Shallow merge default source-config and config from view:
        const sourceConfig = { ...this.sources[selectedSource], ...config.filter((source) => source.type === selectedSource).pop() };
        sourceConfig.url += `&limit=${ limit }`;

        if (title) {
            sourceConfig.name = title;
        }
        if (description) {
            sourceConfig.description = description;
        }

        return sourceConfig;
    }

    onViewHelper(model, view) {
        const sourceConfig = this.getSourceConfig(model, view);
        if (!sourceConfig) { return; }
        model.setFiltered('url', (sourceConfig.url));
    }

    onRender(model, view) {
        const sourceConfig = this.getSourceConfig(model, view);
        if (!sourceConfig) { return; }
        const isEditMode = lab_api.v1.app.mode.isEditor();
        const commentsProviderObj = lab_api.v1.config.get('comments_provider') || {};
        const commentsProvider = Object.keys(commentsProviderObj).shift();
        const defaultSource = commentsProvider === 'hyvor' ? 'hyvor_most_popular' : 'disqus_most_popular';
        const selectedSource = model.get('fields.source') || defaultSource;
        const maxCharLength = model.get('fields.maxCharLength');
        const limit = Math.min(parseInt(model.get('fields.limit') || '5', 10), 30);
        const external = view.get('external');
        const hasError = external && typeof external === 'string'; // External data is an object. An error from integration-services is a string.

        if (hasError) {
            model.setFiltered('error', 'Error fetching data');
            Sys.logger.warn(`Comments: Error fetching data from url: ${ sourceConfig.url }`);
        } else {
            // Unset previously set error in editor.
            model.setFiltered('error', null);
        }

        const concatenateString = (input) => {
            const str = input || '';
            if (!maxCharLength) {
                return str;
            }
            return `${ str.substring(0, maxCharLength) } ${ str.length > maxCharLength ? '...' : '' }`;
        };

        if (external && !hasError) {
            let data = external;
            if (sourceConfig.type === 'disqus_most_popular') {
                data = external.response.map((item) => ({
                    link: item.link,
                    title: concatenateString(item.title)
                }));
            }
            if (sourceConfig.type === 'hyvor_most_popular') {
                data = external.data.map((item) => ({
                    link: item.url,
                    title: concatenateString(item.title)
                }));
            }
            if (sourceConfig.type === 'hyvor_recent') {
                const itemsConfig = sourceConfig.items || {};
                const dateConfig = itemsConfig.date || {};
                data = external.data.map((item) => {
                    if (!item.page || !item.page.url) {
                        return {};
                    }
                    return {
                        link: `${ item.page.url }?ht-comment-id=${ item.id }`,
                        title: (itemsConfig.titlePrefix || '') + concatenateString(item.page.title),
                        user: item.user ? item.user.name : '',
                        date: this.dateTimeHelper.format(new Date(item.created_at * 1000), dateConfig.template || '')
                    };
                });
            }
            model.setFiltered('data', data);
        }

        // Let template include partial by source ({{ #is_disqus_most_popular}} [template for disqus_most_popular ...] {{ /is_disqus_most_popular}})
        for (const name of Object.keys(this.sources)) {
            model.setFiltered(`is_${ name }`, name === selectedSource);
        }

        model.setFiltered('url', (sourceConfig.url));
        model.setFiltered('source', sourceConfig);

        // Editor
        if (!isEditMode) {
            return;
        }

        const config = (lab_api.v1.config.get('contentbox_settings.comments.sources') || []).filter((item) => this.sources[item.type] !== undefined && this.sources[item.type].source === commentsProvider);
        const sourceList = config.map((source) => ({ name: source.type, selected: source.type === selectedSource }));
        model.setFiltered('sourceList', sourceList);
        model.setFiltered('limit', limit);

    }

}
