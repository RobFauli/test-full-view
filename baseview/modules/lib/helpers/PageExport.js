/**
 * Make a serialized JSON-object of page.
 * Return an object matching Labrador API: { result: [...] }.
 * Also add "page".
 * Use structure-data for ordering.
 */

export class PageExport {

    constructor(api) {
        this.api = api;
        this.paths = {
            main: ['parent', 'guid', 'type', 'tags'],
            fields: ['feedId', 'byline', 'bylineImage', 'paywall', 'published', 'published_url', 'site_alias', 'site_id', 'subtitle', 'subtitleHTML', 'teaserSubtitle', 'somedescription', 'title', 'teaserTitle', 'titleHTML', 'seolanguage', 'seotitle', 'sometitle', 'kicker', 'teaserKicker', 'showcomments'],
            fieldsAuto: ['section_tag', 'tags'],
            fieldsNative: ['section'],
            fieldMap: {
                subtitle: 'description', subtitleHTML: 'descriptionHTML', somedescription: 'someDescription', teaserSubtitle: 'teaserDescription', seolanguage: 'seolanguage', seotitle: 'seoTitle', sometitle: 'someTitle', published_url: 'url', section_tag: 'section'
            },
            fallback: {
                url: 'url' // JSON-feeds
            }
        };
        this.frontUrl = this.api.v1.site.getSite().domain || this.api.v1.properties.get('customer_front_url');
        this.imageServer = this.api.v1.properties.get('image_server');
    }

    jsonData(rootModel) {
        Sys.logger.debug('[PageExport] Will export page as JSON-data');
        const page = this.api.v1.model.serialize.model(rootModel);
        delete page.guid;
        const result =  rootModel.getType() === 'page_article' ? this.exportArticle() : this.exportFront();
        return {
            page,
            result
        };
    }

    exportArticle() {}

    exportFront() {
        const dropZone = this.api.v1.model.query.getModelByType('dropZone');
        return this.api.v1.model.query.getModelsByType('article', [dropZone]).map((model) => this.serialize(model)).filter((article) => !!article);
    }

    serialize(model) {
        const serialized = this.api.v1.model.serialize.model(model);
        if (!serialized || !serialized.fields) {
            return null;
        }
        const isAuto = !!serialized.fields.origin_data_json;
        const result = {
            images: [],
            width: model.getWidth('desktop'),
            metadata: serialized.metadata,
            isAutomatic: isAuto,
            siteDomain: this.frontUrl
        };
        const fields = isAuto ? serialized.fields.origin_data_json : serialized.fields;
        const fieldKeys = [...this.paths.fields, ...(isAuto ? this.paths.fieldsAuto : this.paths.fieldsNative)];
        for (const key of this.paths.main) {
            result[key] = serialized[key] || '';
        }
        for (const key of fieldKeys) {
            result[this.paths.fieldMap[key] || key] = fields[key] || '';
        }
        // Add 'teaserSubtitle' (replaced with 'teaserDescription')
        result.teaserSubtitle = fields.teaserSubtitle || '';
        if (isAuto) {
            if (!result.byline) {
                const bylineObj = (fields.full_bylines || []).shift();
                result.byline = bylineObj ? `${ bylineObj.firstname } ${ bylineObj.lastname }` : '';
                result.bylineImage = result.bylineImage || (bylineObj || {}).imageUrl;
            }
            if (typeof result.tags === 'string') {
                result.tags = result.tags.split(',').map((tag) => (tag || '').trim());
            }
            result.site_alias = (this.api.v1.site.getSiteById(fields.site_id) || {}).alias;
            result.id = parseInt(fields.id, 10);
        } else {
            result.titleHTML = result.title;
            result.title = this.cleanText(result.title);
            result.descriptionHTML = result.description;
            result.description = this.cleanText(result.description);
            result.kickerHTML = result.kicker;
            result.kicker = this.cleanText(result.kicker);
            result.id = serialized.id;
        }
        result.section_tag = result.section;
        if (result.url && !result.url.startsWith('http')) {
            result.url = this.frontUrl + result.url;
        }
        for (const key of (Object.keys(this.paths.fallback))) {
            if (!result[key]) {
                result[key] = fields[this.paths.fallback[key]] || '';
            }
        }

        // Bylines
        result.full_bylines = (isAuto ? fields.full_bylines : fields.full_bylines_json) || [];
        result.full_bylines = result.full_bylines.map((byline) => ({
            firstname: byline.firstname,
            lastname: byline.lastname,
            imageUrl: this.getImageUrl(byline.imageUrl)
        }));
        if (isAuto && result.byline) {
            result.full_bylines.unshift({
                firstname: result.byline,
                lastname: '',
                imageUrl: this.getImageUrl(result.bylineImage)
            });
        }
        if (!result.byline && result.full_bylines.length) {
            result.byline = `${ result.full_bylines[0].firstname } ${ result.full_bylines[0].lastname }`;
            result.bylineImage = result.full_bylines[0].imageUrl.replace(this.imageServer, '');
        }

        const customFields = lab_api.v1.config.get('customAdapterFields.article') || [];
        if (customFields) {
            for (const key of customFields) {
                if (key) {
                    let fieldValue = serialized.fields[key] || '';
                    if (!fieldValue && serialized.fields.origin_data_json) {
                        fieldValue = serialized.fields.origin_data_json[key] || '';
                    }
                    if (fieldValue) {
                        result[key] = fieldValue;
                    }
                }
            }
        }

        result.paywall = result.paywall === '0' ? false : !!result.paywall;
        const imageModel = this.api.v1.model.query.getChildOfType(model, 'image');
        if (imageModel) {
            const url = imageModel.get('filtered.image');
            if (url) {
                result.images.push({
                    url,
                    jpg: `${ url }&format=jpg`,
                    webp: `${ url }&format=webp`,
                    url_size: url,
                    default: '1',
                    id: imageModel.get('instance_of')
                });
            }
        }
        return result;
    }

    cleanText(markup) {
        return this.api.v1.util.string.sanitizeString(markup).replace(/&amp;/g, '&');
    }

    getImageUrl(url) {
        if (!url) { return ''; }
        if (url.startsWith('http')) { return url; }
        return this.imageServer + url;
    }

}
