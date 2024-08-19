export default class Twitter {

    constructor(api) {
        this.api = api;
    }

    onViewHelper(model, view) {
        const lang = model.get('fields.lang') || lab_api.v1.config.get('lang') || 'no';
        model.setFiltered('lang', lang);
    }

}
