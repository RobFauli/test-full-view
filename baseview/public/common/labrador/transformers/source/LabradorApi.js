/*
Input: Article from Labrador Search API
Output: (Array) List of articles, internal format
*/

export class LabradorApi {

    constructor(options) {
        this.options = {
            imageServer: options.imageServer || '',
            ignore: options.ignore || [], // Parts of article to ignore (['image', 'subtitle'])
            extraFields: Array.isArray(options.extraFields) ? options.extraFields : []
        };
    }

    // Input: Object from API.
    // Output: Array of articles.
    map(data) {
        return (data.result || []).map((article) => this.transformArticle(article));
    }

    transformArticle(item) {
        const result = {
            type: item.type,
            contentdata: {
                id: item.id,
                fields: {
                    title: { value: item.titleHTML || item.title || null },
                    teaserTitle: { value: item.teaserTitle || null },
                    subtitle: { value: item.subtitleHTML || item.subtitle || null },
                    teaserSubtitle: { value: item.teaserSubtitle || null },
                    kicker: { value: item.teaserKicker || item.kicker || null },
                    teaserKicker: { value: item.teaserKicker || null },
                    published_url: { value: item.siteDomain + item.published_url },
                    byline: { value: item.byline_names },
                    bylineImage: { value: item.full_bylines && item.full_bylines[0] ? item.full_bylines[0].imageUrl : '' },
                    seotitle: { value: item.seotitle },
                    seodescription: { value: item.seodescription },
                    paywall: { value: item.paywall },
                    bodytext: { value: item.bodytext },
                    site_id: { value: item.site_id },
                    published: { value: item.published },
                    modified: { value: item.modified },
                    created: { value: item.created }
                },
                primaryTags: {
                    section: item.section_tag
                },
                tags: (item.tags || '').split(', ')
            },
            metadata: {},
            width: 100,
            widthVp: {},
            children: []
        };
        for (const field of this.options.extraFields) {
            if (item[field] !== undefined && result.contentdata.fields[field] === undefined) {
                result.contentdata.fields[field] = {
                    value: item[field]
                };
            }
        }
        if (item.frontCropUrl) {
            result.children.push(this.transformImage(item));
        }
        return result;
    }

    transformImage(item) {
        const fields = {
            caption: { value: item.imageCaption }
        };
        if (item.frontCropUrl) {
            // "?imageId=128902&panoh=21.25&panow=29.56&panox=27.75&panoy=35.62&heighth=100&heightw=100&heightx=0&heighty=0"
            const parts = item.frontCropUrl.split('?');
            if (parts.length === 2) {
                const ignored = ['imageId'];
                const items = parts[1].split('&');
                for (const imgParts of items) {
                    const [key, value] = imgParts.split('=');
                    if (key && !ignored.includes(key)) {
                        fields[key] = { value };
                    }
                }
                // Transform params in front crop url to standard params used in the rest of Labrador:
                const transform = {
                    panox: 'x', panoy: 'y', panow: 'cropw', panoh: 'croph'
                };
                for (const [key, value] of Object.entries(transform)) {
                    if (fields[key] !== undefined) {
                        fields[value] = fields[key];
                        delete fields[key];
                    }
                }
            }
        }
        return {
            type: 'image',
            contentdata: {
                instance_of: item.image,
                fields
            },
            metadata: {}
        };
    }

}
