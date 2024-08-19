import { PageAPI } from '../../lib/api/PageAPI.js';
import { PageData } from '../../lib/PageData.js';
import { AutodataHelper } from '../../lib/helpers/AutodataHelper.js';

export default class Article {

    constructor(api) {
        this.api = api;
        this.pageData = new PageData(this.api, new PageAPI(this.api));
    }

    onReady(model, view) {
        this.pageData.set(model, view);

        // Autodata
        model.setFiltered('autodata_css', AutodataHelper.parseCss(model));
        model.setFiltered('autodata_attributes', AutodataHelper.parseAttributes(model));
        model.setFiltered('autodata_custom', AutodataHelper.parseCustomData(model));
    }

}
