export default class UserFeedback {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const emails = this.api.v1.config.get('contact.email') || {};
        const email = model.get('fields.email') || emails.tips || '';
        const url = model.get('fields.url') || '';
        model.setFiltered('email', email);
        model.setFiltered('url', url);
    }

}
