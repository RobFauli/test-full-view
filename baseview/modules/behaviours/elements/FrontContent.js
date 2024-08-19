export default class FrontContent {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const getTagsArray = (m, fallbackArray) => {
            const tags_string = m.get('fields.tags_string') || '';
            const result = tags_string.split(',').map((tag) => tag.trim()).filter((tag) => !!tag);
            if (result.length) {
                return result;
            }
            return fallbackArray.map((richTag) => richTag.tag);
        };

        const getTagsArrayDescription = (tags, descriptions) => {
            const tagDescriptions = {};
            for (const richTag of descriptions) { // { "tag": "ytre-sogn", "description": "Nyheter Ytre Sogn" }
                tagDescriptions[richTag.tag] = richTag.description;
            }
            return tags.map((tag) => ({ tag, description: tagDescriptions[tag] || tag }));
        };

        const config = this.api.v1.config.get('contentbox_settings.frontContent') || {};
        const integrationUrl = this.api.v1.properties.get('integration_url');
        const feeds = Object.values(this.api.v1.config.get('feeds') || {}).filter((feed) => !!feed.labrador_json).map((feed) => ({
            identifier: feed.display_name,
            name: feed.display_name,
            type: feed.url.includes('lab_viewport=json') ? 'DachserJson' : 'LabradorApi',
            url: feed.url.replace('{{int}}', integrationUrl)
        }));
        const sourcesConfig = (config.sources || []).concat(feeds);
        const source = model.get('fields.source'); // identifier
        const sourceObject = { ...(sourcesConfig.filter((item) => item.identifier === source).shift() || {}) };
        const organizer = model.get('fields.organizer');
        const isEditor = this.api.v1.app.mode.isEditor();
        const overrideUrlOption = model.get('fields.overrideUrlByTagsCookie', true);
        const overrideUrlByTagsCookie = overrideUrlOption === undefined ? !!config.overrideUrlByTagsCookie : !!overrideUrlOption;
        const tagsArray = getTagsArray(model, (config.tagsArray || [])); // Prio: 1) field-value, 2) config, 3) Empty array.
        const tagsArrayRich = getTagsArrayDescription(tagsArray, (config.tagsArray || []));
        const articleCountField = model.get('fields.articleCount') || 24;
        const layoutOptions = {
            columnCount: parseFloat(model.get('fields.layout_columnCount') || 3),
            rowCount: parseFloat(model.get('fields.layout_rowCount') || 10),
            maxRowSize: parseFloat(model.get('fields.layout_maxRowSize') || 3),
            minRowSize: parseFloat(model.get('fields.layout_minRowSize') || 1),
            imageAspectRatio: parseFloat(model.get('fields.layout_imageAspectRatio') || 0.45),
            gridsize: parseFloat(model.get('fields.layout_gridsize') || 12),
            hide_items: []
        };
        if (model.get('fields.hide_title')) { layoutOptions.hide_items.push('title'); }
        if (model.get('fields.hide_subtitle')) { layoutOptions.hide_items.push('subtitle'); }
        if (model.get('fields.hide_image')) { layoutOptions.hide_items.push('image'); }
        if (model.get('fields.hide_kicker')) { layoutOptions.hide_items.push('kicker'); }
        const articleFilterList = [];
        if (model.get('fields.filterExisting')) {
            articleFilterList.push({
                path: 'contentdata.id',
                values: this.api.v1.model.query.getModelsByType('article').filter((article) => !!article.get('instance_of')).map((article) => String(article.get('instance_of')))
            });
        }
        const organizersRequiringArticleCount = ['RandomRows'];
        let articleCount = articleCountField;
        if (!organizersRequiringArticleCount.includes(organizer)) {
            articleCount = layoutOptions.columnCount * layoutOptions.rowCount || articleCountField;
        }

        model.setFiltered('source', sourceObject);
        model.setFiltered('articleCount', articleCount);
        model.setFiltered('articleFilterList', JSON.stringify(articleFilterList));
        model.setFiltered('isDebug', this.api.v1.util.request.hasQueryParam('debug'));
        model.setFiltered('isEditor', isEditor);
        model.setFiltered('isConfigured', articleCount && organizer && sourceObject.identifier && sourceObject.url && sourceObject.type);
        model.setFiltered('viewport', this.api.v1.viewport.getName());
        model.setFiltered('imageServer', this.api.v1.properties.get('image_server'));
        model.setFiltered('layout', JSON.stringify(layoutOptions));
        model.setFiltered('coockieOptions', {
            allow: overrideUrlByTagsCookie,
            coockieName: config.coockieName || 'dachserFrontContentTags',
            tagsArray: tagsArrayRich,
            tagsArrayString: JSON.stringify(tagsArrayRich)
        });
        model.setFiltered('tagOptions', {
            allow: !!model.get('fields.tags_allow') && sourceObject.type === 'LabradorApi',
            tags: tagsArray,
            tags_string: tagsArray.join(', '),
            tagsString: JSON.stringify(tagsArray)
        });
        const styleKeyVal = [];
        if (model.get('fields.size_active')) {
            if (model.get('fields.size_title')) { styleKeyVal.push({ path: 'contentdata.fields.title.attributes.text_size.value', value: parseInt(model.get('fields.size_title'), 10) }); }
            if (model.get('fields.size_subtitle')) { styleKeyVal.push({ path: 'contentdata.fields.subtitle.attributes.text_size.value', value: parseInt(model.get('fields.size_subtitle'), 10) }); }
            if (model.get('fields.size_kicker')) { styleKeyVal.push({ path: 'contentdata.fields.kicker.attributes.text_size.value', value: parseInt(model.get('fields.size_kicker'), 10) }); }
        }
        model.setFiltered('styleString', JSON.stringify(styleKeyVal));
        // model.setFiltered('styleString', JSON.stringify({
        //     size_active: !!model.get('fields.size_active'),
        //     size_subtitle: parseInt(model.get('fields.size_subtitle'), 10) || null,
        //     size_title: parseInt(model.get('fields.size_title'), 10) || null,
        //     size_kicker: parseInt(model.get('fields.size_kicker'), 10) || null
        // }));

        // Editor:
        if (!isEditor) {
            return;
        }

        // Use proxy to fetch url in editor:
        if (sourceObject.url && sourceObject.type !== 'LPStream') {
            sourceObject.url = `${ this.api.v1.properties.get('proxy') }?query=${ encodeURIComponent(sourceObject.url) }`;
            model.setFiltered('source', sourceObject);
        }
        model.setFiltered('sourcesConfig', sourcesConfig);
    }

}
