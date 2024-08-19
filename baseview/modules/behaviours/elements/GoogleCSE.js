export default class GoogleCSE {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        model.setFiltered('cse_id', model.get('fields.cse_id') || this.api.v1.config.get('contentbox_settings.googleCSE.cse_id'));
    }

}
