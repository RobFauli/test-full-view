import { DateTimeHelperInt } from '../../lib/helpers/datetime/DateTimeHelperInt.js';

export default class Toplist {

    constructor(api) {
        this.api = api;
    }

    onViewHelper(model, view) {

        // Get node-data used to set external url:
        let domain = model.get('fields.domain') || this.api.v1.properties.get('site.domain');
        domain = domain.replace(/^https?:\/\//, ''); // Remove protocol
        const limit = model.get('fields.limit') || 5;
        model.setFiltered('domain', domain);
        model.setFiltered('limit', limit);
    }

    onRender(model, view) {
        const externalData = view.get('external');
        const displayImages = !!model.get('fields.displayImages');
        const displayDate = !model.get('fields.hideDate');
        const limit = model.get('fields.limit') || 5;
        const domain = model.get('filtered.domain');

        const getPlaceholderData = (count) => {
            const result = [];
            for (let i = 0; i < count; i++) {
                result.push({
                    fields: {
                        cssClass: 'dac-placeholder-text',
                        type: 'article'
                    }
                });
            }
            return { data: result };
        };

        const getImageUrl = (url) => {
            if (!url) { return null; }
            return (`${ url.replace(/^https?:\/\//, '//') }${ url.includes('?') ? '&' : '?' }width=100&height=70`);
        };

        const result = [];
        const source = externalData && typeof (externalData) === 'object' ? externalData : getPlaceholderData(limit); // Use placeholder-data in edit-mode.
        const dateHelper = new DateTimeHelperInt();

        source.data.forEach((article) => {
            if (article.fields.type === 'article') {
                // Get date. Prio: modified-date.
                const dateString = article.fields.published || null;
                result.push({
                    title: article.fields.title || '[no title]',
                    url: article.fields.srcUrl,
                    section: article.fields.section || '',
                    pageviews: article.fields.pageviews,
                    published: dateString,
                    niceDate: displayDate && dateString ? dateHelper.timestampToNiceDate(
                        dateHelper.toTimestamp(
                            new Date(dateString)
                        )
                    ) : '',
                    cssClass: article.fields.cssClass || null,
                    imageUrl: displayImages ? getImageUrl(article.fields.image) : null
                });
            }
        });
        model.setFiltered('result', result);

        /**
         * Admin-view
         */
        if (!this.api.v1.app.mode.isEditor()) return;
        const adminView = {
            domains: [],
            layout: []
        };
        this.api.v1.site.getSites().forEach((site) => {
            if (!site.domain) return;
            const currentDomain = site.domain.replace(/^https?:\/\//, '');
            const current = {
                name: site.display_name,
                value: currentDomain,
                selected: currentDomain === domain
            };
            adminView.domains.push(current);
        });
        for (const direction of ['horizontal', 'vertical']) {
            adminView.layout.push({
                name: direction,
                value: direction,
                selected: direction === view.get('fields.layout')
            });
        }
        model.setFiltered('adminView', adminView);
    }

}
