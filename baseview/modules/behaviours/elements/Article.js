import { LayoutHelper } from '../../lib/helpers/LayoutHelper.js';
import { AutodataHelper } from '../../lib/helpers/AutodataHelper.js';

export default class Article {

    constructor(api) {
        this.api = api;
        this.imageServer = this.api.v1.properties.get('image_server');
        this.domain = this.api.v1.site.getSite().domain || this.api.v1.properties.get('customer_front_url');
    }

    onReady(model, view) {
        // Define correct spot to print title, subtitle and kicker.
        // Use in template to include partials.
        // Run in onReady to make data avilable to children (image etc.)
        model.setFiltered('layout', LayoutHelper.textElements(view, this.api.v1.app.mode.isEditor()));

        let link = model.get('fields.published_url') || '';
        const regex = /^https?/;
        if (!regex.test(link) && link) link = this.domain + link;
        model.setFiltered('published_url', link);
        model.setFiltered('published_url_rss', link.replace(/&/g, '&amp;'));
    }

    onRender(model, view) {
        const articleId = model.get('instance_of') || model.get('fields.origin_data_json.id');
        const pubDate = model.get('fields.published') || model.get('fields.origin_data_json.published');
        const title =  model.get('fields.origin_data_json.teaserTitle') || view.get('fields.title') || '';
        const subtitle = model.get('fields.origin_data_json.teaserSubtitle') || view.get('fields.subtitle') || '';
        const publishedSitemap = model.get('fields.origin_data_json.published') || model.get('fields.published');
        const kicker = model.get('fields.origin_data_json.teaserKicker') || model.get('fields.origin_data_json.kicker') || view.get('fields.kicker');
        const siteId = model.get('fields.site_id') || model.get('fields.origin_data_json.site_id');

        model.setFiltered('published', pubDate); // Only used by rss-template
        model.setFiltered('title', title);
        model.setFiltered('kicker', kicker);
        model.setFiltered('subtitle', subtitle);
        model.setFiltered('articleId', articleId);
        model.setFiltered('section', model.get('fields.origin_data_json.section_tag') || model.get('fields.section') || '');
        model.setFiltered('base_url', this.domain);
        model.setFiltered('published_sitemap', publishedSitemap);
        model.setFiltered('canonical_url', `${ this.getSiteDomain(siteId) }/a/${ articleId }`);
        model.setFiltered('tags', model.get('tags') || []);

        const timestampOutOfDateDays = new Date().getTime() - (2 * 24 * 60 * 60 * 1000);
        model.setFiltered('articleOutOfDate_sitemap', timestampOutOfDateDays > Math.floor(new Date(publishedSitemap).getTime()));

        if (!this.api.v1.config.get('showHiddenTagsOnFront')) {
            const tagsToIgnore = (this.api.v1.config.get('tagsToHide') || '').split(',').map((tag) => tag.trim()) || [];
            const filteredTags = (model.get('tags') || []).filter((tag) => !tagsToIgnore.includes(tag));
            model.setFiltered('tags', filteredTags);
        }

        // Site:
        if (siteId) {
            const site = this.api.v1.site.getSiteById(siteId);
            if (site) {
                model.setFiltered('site_alias', site.alias);
            }
        }

        // Byline-display:
        const displayByline = model.get('fields.origin_data_json.showbylineonfp') || view.get('fields.displayByline') || false;
        if (displayByline) {
            const bylineName = view.get('fields.byline') || model.get('fields.origin_data_json.byline');
            const bylineImage = view.get('fields.bylineImage') || model.get('fields.origin_data_json.bylineImage');
            const bylineArray = model.get('fields.origin_data_json.full_bylines') || model.get('fields.full_bylines_json') || [];
            const bylines = bylineArray.map((byline) => ({
                firstname: byline.firstname,
                lastname: byline.lastname,
                imageUrl: byline.imageUrl ? this.getImageUrl(`${ byline.imageUrl }&width=30&height=30`) : ''
            }));
            // For old article teasers without full bylines:
            if (!bylines.length && (bylineName || bylineImage)) {
                bylines.push({
                    firstname: bylineName,
                    lastname: '',
                    imageUrl: bylineImage ? this.getImageUrl(`${ bylineImage }&width=30&height=30`) : ''
                });
            }
            model.setFiltered('bylines', bylines);
            if (bylineImage) {
                model.setFiltered('bylineImage', `${ bylineImage }&width=30&height=30`);
            }
        }
        model.setFiltered('displayByline', displayByline);

        // Paywall
        let paywall = model.get('fields.origin_data_json.paywall') || model.get('fields.paywall') || false;
        if (paywall === 1 || paywall === '1' || paywall === true) {
            paywall = true;
        } else {
            paywall = null;
        }
        if (paywall) {
            const paywallLabel = {
                ...{
                    text: { content: 'Pluss' },
                    icon: { content: 'fi-plus' },
                    display: true,
                    displayInNewsletter: true
                },
                ...this.api.v1.config.get('paywall.label')
            };
            if (paywallLabel.display) {
                paywallLabel.layout = {
                    noImage: true,
                    float: null
                };
                const imageChild = this.api.v1.model.query.getChildOfType(model, 'image') || this.api.v1.model.query.getChildOfType(model, 'graphic');
                if (imageChild) {
                    const imageView = this.api.v1.view.getView(imageChild, view.getViewport());
                    paywallLabel.layout.float = imageView.get('fields.float') || null;
                    paywallLabel.layout.noImage = !!view.get('metadata.hideimage');
                }
                model.setFiltered('paywallLabel', paywallLabel);
            }
        } else {
            model.setFiltered('paywallLabel', null);
        }
        model.setFiltered('paywall', paywall);

        // Section placement
        const sectionPlacement = model.get('metadata.sectionPlacement') || 'floating';
        model.setFiltered('sectionPlacement.floating', sectionPlacement === 'floating');
        model.setFiltered('sectionPlacement.underImage', sectionPlacement === 'underImage');
        model.setFiltered('sectionPlacement.underText', sectionPlacement === 'underText');

        // Mailmojo
        model.setFiltered('articleWidth', view.getPixelWidth());

        // Autodata
        model.setFiltered('autodata_css', AutodataHelper.parseCss(model));
        model.setFiltered('autodata_content_css', AutodataHelper.parseCss(model, 'filtered.autodata_content'));
        model.setFiltered('autodata_attributes', AutodataHelper.parseAttributes(model));
        model.setFiltered('autodata_custom', AutodataHelper.parseCustomData(model));
    }

    // New article teaser created in editor
    onId(model) {
        const published = model.get('fields.published');
        if (published) {
            const date = new Date(published).getTime();
            if (date > new Date().getTime()) {
                let row = this.api.v1.model.query.getParentOfType(model, 'row');
                if (!row) { return; }
                const parentRow = this.api.v1.model.query.getParentOfType(row, 'row');
                if (parentRow) {
                    row = parentRow;
                }
                const rowPublishDate = row.get('metadata.visibleAfterDate') || new Date(published).toISOString();
                if (new Date(rowPublishDate).getTime() <= date) {
                    row.set('metadata.visibleAfterDate', new Date(published).toISOString());
                    this.api.v1.model.highlight.message(row, `Publish-date updated for row`);
                }
            }
        }
    }

    getSiteDomain(siteId) {
        if (!siteId) { return ''; }
        const site = this.api.v1.site.getSiteById(siteId);
        if (!site) { return ''; }
        return site.domain;
    }

    getImageUrl(url) {
        if (!url) { return ''; }
        if (url.startsWith('http')) { return url; }
        return this.imageServer + url;
    }

}
