export default class Tagboard {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const config = this.api.v1.config.get('contentbox_settings.tagboard') || {};
        const isEditor = this.api.v1.app.mode.isEditor();
        const getTagGroups = (tagGroupsConf = {}) => {
            const result = [];
            const tagStringToArray = (tags = '') => tags.split(',').map((t) => t.trim().toLowerCase()).filter((t) => !!t);
            for (let index = 1; index <= 3; index++) {
                if (tagGroupsConf[`tagGroup${ index }_tags`]) {
                    result.push({
                        label: tagGroupsConf[`tagGroup${ index }_label`],
                        tags: tagStringToArray(tagGroupsConf[`tagGroup${ index }_tags`])
                    });
                }
            }
            return result;
        };
        // Tags for end-user to select:
        const tagGroupsObject = {
            tagGroup1_label: model.get('fields.tagGroup1_label') || '',
            tagGroup1_tags: model.get('fields.tagGroup1_tags') || '',
            tagGroup2_label: model.get('fields.tagGroup2_label') || '',
            tagGroup2_tags: model.get('fields.tagGroup2_tags') || '',
            tagGroup3_label: model.get('fields.tagGroup3_label') || '',
            tagGroup3_tags: model.get('fields.tagGroup3_tags') || ''
        };
        const tagGroups = getTagGroups(tagGroupsObject);
        if (!tagGroups.length || !Array.isArray(tagGroups)) {
            Sys.logger.warning('tagboard: Missing required config "contentbox_settings.tagboard.tagGroups" (array). End user will not be able to filter results.');
        }
        let tagsGroupsDefaultVisible = model.get('fields.tagsGroupsDefaultVisible');
        if (tagsGroupsDefaultVisible === null) {
            tagsGroupsDefaultVisible = this.api.v1.config.get('contentbox_settings.tagboard.tagsOptions.tagsGroupsDefaultVisible');
        }

        const tagArrayGroups = tagGroups.map((group) => group.tags);
        const tagsArray = [].concat(...tagArrayGroups);

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

        const articleCountField = model.get('fields.articleCount') || 24;
        const organizersRequiringArticleCount = ['RandomRows'];
        let articleCount = articleCountField;
        if (!organizersRequiringArticleCount.includes(organizer)) {
            articleCount = layoutOptions.columnCount * layoutOptions.rowCount || articleCountField;
        }

        const articleFilterList = [];
        if (model.get('fields.filterExisting')) {
            articleFilterList.push({
                path: 'contentdata.id',
                values: this.api.v1.model.query.getModelsByType('article').filter((article) => !!article.get('instance_of')).map((article) => String(article.get('instance_of')))
            });
        }
        model.setFiltered('articleCount', articleCount);
        model.setFiltered('articleFilterList', JSON.stringify(articleFilterList));
        model.setFiltered('tagArrayGroups', JSON.stringify(tagArrayGroups));
        model.setFiltered('tagGroups', tagGroups); // Tags for end user to select
        model.setFiltered('tagGroupsObject', tagGroupsObject); // Tags for end user to select
        model.setFiltered('tagsGroupsDefaultVisible', tagsGroupsDefaultVisible);
        model.setFiltered('layout', JSON.stringify(layoutOptions));
        model.setFiltered('isConfigured', organizer && sourceObject.identifier && sourceObject.url && sourceObject.type);
        model.setFiltered('source', sourceObject);
        model.setFiltered('isDebug', true);
        model.setFiltered('siteId', model.get('fields.siteId') || '');
        model.setFiltered('viewport', this.api.v1.properties.get('device'));
        model.setFiltered('imageServer', this.api.v1.properties.get('image_server'));
        model.setFiltered('tagOptions', {
            allow: true,
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
        model.setFiltered('imageWidth', model.get('fields.imageWidth') || 100);

        if (!isEditor) {
            return;
        }

        model.setFiltered('sourcesConfig', sourcesConfig);
    }

}
