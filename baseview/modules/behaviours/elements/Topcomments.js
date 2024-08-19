import { DateTimeHelper } from '../../lib/helpers/datetime/DateTimeHelper.js';

export default class Topcomments {

    constructor(api) {
        this.api = api;
        this.domain = this.api.v1.site.getSite().domain || this.api.v1.properties.get('customer_front_url');
    }

    onViewHelper(model, view) {
        // Get 'domain' for Kilkaya. Used in external url.
        model.setFiltered('domain', model.get('fields.domain') || this.domain.replace('https://', ''));
    }

    onRender(model, view) {
        const externalData = view.get('external');

        // This element uses external data. External data-boxes are run twice in Labrador. On second run we have external data:
        if (!externalData) return;

        const dateHandler = new DateTimeHelper(lab_api.v1.config.get('lang'));
        const dateTemplate = this.api.v1.config.get('contentbox_settings.topcomments.dateTemplate');
        const imgSize = {
            width: 63,
            height: 63
        };
        const imageServer = lab_api.v1.properties.get('image_server');
        const mostRead = [];
        const data = lab_api.v1.util.object.clone(externalData, true);
        for (const item of data.mostRead || []) {
            const publishedDate = new Date(item.fields.published);
            if (item.fields.image) {
                item.fields.image = item.fields.image.replace('http://', 'https://');
                item.resizedImage = `${ item.fields.image  }&width=${ imgSize.width }&height=${ imgSize.height }`;
            }
            item.fields.readableDate = dateHandler.utcFormat(publishedDate, dateTemplate);
            mostRead.push(item);
        }
        model.setFiltered('mostRead', mostRead);

        const latest = [];
        for (const item of data.latest || []) {
            const publishedDate = new Date(item.published);
            item.readableDate = dateHandler.utcFormat(publishedDate, dateTemplate);
            if (item.extId) {
                item.disqusId = item.extId.replace('khrono-', 'node/');
            } else {
                item.disqusId = item.id;
            }
            if (item.frontCropUrl) {
                item.resizedImage = `${ imageServer  }/${  item.frontCropUrl  }&width=${  imgSize.width  }&height=${  imgSize.height }`;
            }
            latest.push(item);
        }
        model.setFiltered('latest', latest);

        // Selected tab:
        let selectedTab = model.get('fields.selectedTab') || 'latest';
        if (lab_api.v1.viewport.getName() === 'mobile' && model.get('fields.hideResultOnMobile')) {
            selectedTab = '';
        }
        const selectedTabs = {};
        ['mostRead', 'topComments', 'latest'].forEach((tab) => {
            selectedTabs[tab] = tab === selectedTab;
        });
        model.setFiltered('selectedTabs', selectedTabs);
        model.setFiltered('isDebug', this.api.v1.util.request.hasQueryParam('debug'));

    }

}
