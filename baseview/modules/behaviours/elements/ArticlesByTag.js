import { DateTimeHelper } from '../../lib/helpers/datetime/DateTimeHelper.js';

export default class ArticlesByTag {

    constructor(api) {
        this.api = api;
        this.rootModel = this.api.v1.model.query.getRootModel();
        this.isEditor = this.api.v1.app.mode.isEditor();
        this.boundIds = {};
        this.config = this.api.v1.config.get('contentbox_settings.articlesByTag') || {
            niceDates: true,
            dateFormat: '{{ HH }}:{{ mm }} - {{ DD }}.{{ MM }}.{{ YYYY }}'
        };
        this.preferredImageFormat = lab_api.v1.image.getPreferredImageFormat();
    }

    onViewHelper(model, view) {
        // Default options:
        const displayOptions = {
            image: false,
            title: true,
            subtitle: true,
            published: false
        };
        const editDisplayOptions = [];
        const selectedDisplayOptions = model.get('fields.displayOptions_json') || {};
        for (const key of Object.keys(displayOptions)) {
            if (selectedDisplayOptions[key] !== undefined) {
                displayOptions[key] = !!selectedDisplayOptions[key];
            }
        }
        const query_json = model.get('fields.query_json') || {};
        const site_id = query_json.site_id === undefined ? this.api.v1.site.getSite().id : query_json.site_id;
        const imageWidth = 200;
        const aspectRatio = lab_api.v1.config.get('contentbox_settings.articlesByTag.imageAspectRatio') || lab_api.v1.config.get('image.defaultAspectRatio');
        const imgArgs = [
            `width=${ imageWidth }`,
            `height=${ Math.floor(imageWidth * aspectRatio) }`
        ];
        if (this.preferredImageFormat && this.preferredImageFormat !== 'jpg') {
            imgArgs.push(`format=${ this.preferredImageFormat }`);
        }

        model.setFiltered('site_id', site_id);
        model.setFiltered('displayOptions', displayOptions);            // For template
        model.setFiltered('imageServer', this.api.v1.properties.get('image_server'));
        model.setFiltered('imgArgs', imgArgs.join('&'));
        model.setFiltered('orderBy', 'published');

        // Generate correct url depending on tagPagePath value
        model.setFiltered('tagPagePath', lab_api.v1.config.get('tagPagePath') || '/tag/');
        model.setFiltered('limit', query_json.limit || 10);

        const setQuery = (m, tags, mode) => {
            const sanitizedTags = [];

            if (Array.isArray(tags)) {
                tags.forEach((tag) => {
                    let theTag = tag;
                    theTag = theTag.replace(/([\(\)\s+])/g, '\\$1');
                    theTag = theTag.toLowerCase();
                    sanitizedTags.push(theTag);
                });
            }

            const id = this.rootModel.get('id');
            let queryString;
            if (m.get('fields.useApiQuery') && m.get('fields.apiQuery')) {

                const query = m.get('fields.apiQuery')
                    .replace(/\b(AND|OR|NOT)\b/g, '__$1__')
                    .toLowerCase()
                    .replace(/__and__/g, 'AND')
                    .replace(/__or__/g, 'OR')
                    .replace(/__not__/g, 'NOT');

                queryString = query.length ? `(${ query }) AND published:[* NOW] AND NOT id:${ id }` : `published:[* NOW] AND NOT id:${ id }`;
                queryString = queryString.replace(/""+/g, '"');
            } else {
                queryString = sanitizedTags.length ? `(tag:"${ sanitizedTags.join('" OR tag:"') }") AND published:[* NOW] AND NOT id:${ id }` : `published:[* NOW] AND NOT id:${ id }`;
                queryString = queryString.replace(/""+/g, '"');
            }

            if (mode === 'edit') {
                m.set('fields.query', queryString, { save: false });
                m.setFiltered('query', encodeURIComponent(queryString));
                m.set('fields.selectedTags_json', tags, { save: false });
            }

            if (mode === 'published') {
                m.setFiltered('query', encodeURIComponent(queryString));
                m.set('fields.selectedTags_json', tags, { save: false });
            }
        };
        if (!this.isEditor) {
            model.setFiltered('lazyloadImages', lab_api.v1.config.get('imageLoading.lazy') || false);

            const section = this.rootModel.get('primaryTags.section');
            let tags = [];
            tags = (this.rootModel.get('tags') || []).filter((tag) => tag !== section);

            if (model.get('fields.usePageTags')) {
                setQuery(model, tags, 'published');
            } else if (model.get('fields.useApiQuery') && model.get('fields.apiQuery')) {
                setQuery(model, '', 'published');
            } else {
                model.setFiltered('query', encodeURIComponent(model.get('fields.query')));
            }
        }

        if (this.isEditor) {
            for (const key of Object.keys(displayOptions)) {
                editDisplayOptions.push({
                    name: key,
                    value: displayOptions[key]
                });
            }

            // Options for "site_id" (fields.query_json.site_id)
            const siteOptions = [{
                value: '',
                name: 'Any site'
            }];
            this.api.v1.site.getSites().forEach((site) => {
                siteOptions.push({
                    value: site.id,
                    name: site.display_name,
                    // eslint-disable-next-line eqeqeq
                    selected: site.id == site_id
                });
            });
            model.setFiltered('siteOptions', siteOptions);
            model.setFiltered('editDisplayOptions', editDisplayOptions);

            const updateTags = () => {
                if (model.get('fields.useApiQuery')) {
                    setQuery(model, '', 'edit');
                } else {
                    let tags = [];
                    if (model.get('fields.usePageTags')) {
                        // Get tags without section-tag.
                        const section = this.rootModel.get('primaryTags.section');
                        tags = (this.rootModel.get('tags') || []).filter((tag) => tag !== section);
                    } else {
                        const tagsString = model.get('fields.tagsString') || '';
                        const rawTags = tagsString.split(',');
                        rawTags.forEach((tag) => {
                            const theTag = tag.trim();
                            if (theTag) tags.push(theTag);
                        });
                    }
                    setQuery(model, tags, 'edit');
                }
            };

            // Unset fields.usePageTags when editing tags-field:
            const updateTagsString = () => {
                model.set('fields.usePageTags', false);
                updateTags();
            };

            const guid = model.getGuid();
            if (!this.boundIds[guid]) {
                this.boundIds[guid] = true;
                this.api.v1.model.bindings.bind(this.rootModel, 'tags', updateTags);
                this.api.v1.model.bindings.bind(model, 'fields.usePageTags', updateTags);
                this.api.v1.model.bindings.bind(model, 'fields.usePageTags', updateTags);
                this.api.v1.model.bindings.bind(model, 'fields.tagsString', updateTagsString);
            }

            updateTags();
        }
    }

    onRender(model, view) {
        const lang = this.api.v1.config.get('lang') || 'no';
        const dateHelper = new DateTimeHelper(lang);
        const external = view.get('external');
        const templateData = [];

        if (external && external.result) {
            external.result.forEach((a) => {
                if (a.type === 'article') {
                    const dateString = a.published || null;
                    const publishedDate = new Date(dateString);

                    templateData.push({
                        title: a.title,
                        subtitle: a.subtitle,
                        published_url: a.published_url,
                        frontCropUrl: a.frontCropUrl,
                        published: dateString,
                        formatted: dateString && this.config.niceDates ? dateHelper.timestampToNiceDate(dateHelper.toTimestamp(publishedDate)) : dateHelper.format(publishedDate, this.config.dateFormat)
                    });
                }
            });
        }
        model.setFiltered('templateData', templateData);
    }

    onSettingsPanel(model, view, settings) {
        return {
            onDisplay: (params) => {
                const toggleEl = params.markup.querySelector('.advancedToggle');
                const expandableEl = params.markup.querySelector('.advanced');
                if (toggleEl && expandableEl) {
                    toggleEl.addEventListener('click', (event) => {
                        const isHidden = expandableEl.classList.contains('lab-hidden');
                        expandableEl.classList.toggle('lab-hidden');
                        if (isHidden) {
                            toggleEl.classList.remove('labicon-pluss_slim');
                            toggleEl.classList.add('labicon-minus_slim');
                        } else {
                            toggleEl.classList.remove('labicon-minus_slim');
                            toggleEl.classList.add('labicon-pluss_slim');
                        }
                    }, false);
                }
            }
        };
    }

}
