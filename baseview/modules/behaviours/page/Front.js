import { PageAPI } from '../../lib/api/PageAPI.js';
import { PageData } from '../../lib/PageData.js';

export default class Front {

    constructor(api) {
        this.api = api;
        this.pageData = new PageData(this.api, new PageAPI(this.api));
    }

    onReady(model, view) {
        this.pageData.set(model, view);
    }

}
