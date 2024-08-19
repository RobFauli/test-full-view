export default class Newsletter_submit {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const config = this.api.v1.config.get('contentbox_settings.newsletter_submit') || {};
        const fieldAction = model.get('fields.newsletterDataAction');
        const fieldTitle = model.get('fields.newsletterDataTitle');
        const fieldDescription = model.get('fields.newsletterDataDescription');
        const obj = {
            provider: config.provider ? config.provider : 'mailmojo',
            title: fieldTitle || (config.title ? config.title : 'Meld deg på nyhetsbrev'),
            description: fieldDescription || config.description,
            action: fieldAction || config.action,
            elements: config.elements ? config.elements : [
                {
                    type: 'hidden',
                    name: 'tagsadditional',
                    value: 'påmelding fra nettside',
                    class: '',
                    placeholder: ''
                },
                {
                    type: 'email',
                    name: 'email',
                    value: '',
                    class: '',
                    placeholder: 'Din e-postadresse'
                },
                {
                    type: 'submit',
                    name: 'submit',
                    value: 'Abonnér på nyhetsbrevet',
                    class: 'bg-secondary',
                    placeholder: ''
                }
            ]
        };
        model.setFiltered('newsletter_data', obj.action ? obj : null);
    }

}
