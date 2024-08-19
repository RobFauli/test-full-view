export class ArticleCommercialSettings {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.dom = {};
        this.helpers = params.helpers;
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">

            <div class="lab-formgroup lab-grid">
                <h2 class="lab-title lab-grid-large-12">Commercial features</h2>
                <div class="lab-formgroup-item lab-grid-large-12 lab-inline">
                    <label for="paywall">Paywall - Require subscription</label>
                    <input type="checkbox" name="fields.paywall" id="paywall" value="1" {{ #fields.paywall }}checked{{ /fields.paywall }}>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-inline">
                    <label for="hideAds">Hide ads</label>
                    <input type="checkbox" name="fields.hideAds" id="hideAds" value="1" {{ #fields.hideAds }}checked{{ /fields.hideAds }}>
                </div>
            </div>
        </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'General',
            label: 'Commercial settings'
        };
    }

    onPaths() {
        return {
            'fields.paywall': { node: 'fields.paywall', boolean: true },
            'fields.hideAds': { node: 'fields.hideAds', boolean: true, suggestReload: true }
        };
    }

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                paywall: this.helpers.toBoolean(this.rootModel.get('fields.paywall')),
                hideAds: this.helpers.toBoolean(this.rootModel.get('fields.hideAds'))
            }
        }, true);
        return markup;
    }

}
