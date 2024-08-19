export default class Twitter {

    constructor(api) {
        this.api = api;
    }

    // Todo: Dette elementet funker nok ikke så bra for kunder utenfor Norge ...
    onRender(model, view) {
        const versions = {
            tips: {
                cssClass: 'tips_version',
                title: 'Tips og innlegg',
                text: 'Vi synes det er viktig med dine meninger',
                buttons: {
                    tips: 'Tips oss',
                    debate: 'Send innlegg'
                }
            },
            debate: {
                cssClass: 'debate_version',
                title: 'Har du noe på hjertet?',
                text: 'Send oss et debattinnlegg, en kronikk eller en meningsytring. Alle innlegg signeres med fullt navn og tittel.',
                buttons: {
                    tips: null,
                    debate: 'Send innlegg'
                }
            }
        };
        const emails = this.api.v1.config.get('contact.email') || {};
        const persistent = {
            tips: model.get('fields.email_tips'),
            debate: model.get('fields.email_debate'),
            version: model.get('fields.version')
        };
        if (persistent.tips) { emails.tips = persistent.tips; }
        if (persistent.debate) { emails.debate = persistent.debate; }
        model.setFiltered('content', persistent.version === 'tips' ? versions.tips : versions.debate);
        model.setFiltered('version_is_tips', persistent.version === 'tips');
        model.setFiltered('emails', emails);

    }

}
