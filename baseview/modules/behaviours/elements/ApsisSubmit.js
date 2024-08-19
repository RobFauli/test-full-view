export default class ApsisSubmit {

    constructor(api) {
        this.api = api;
    }

    onRender(model) {
        const config = this.api.v1.config.get('contentbox_settings.apsis_submit');
        if (config) {
            model.setFiltered('apsis', config);
        }
    }

}
