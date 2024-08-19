export class GeneralSettings {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.meta = params.meta;
        this.templates = params.templates;
        this.enabled = true; // Sub-views may override and set to false to disable
        this.template = `<div class="lab-modal-form lab-grid">
        <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
            <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-below-large lab-space-above-none">General settings</h2>
            <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                <label for="general-settings-site_id">Site-name for this front page</label>
                <div data-placeholder="site-selector">
                    <!-- Element replaced by modal -->
                </div>
            </div>
            <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                <label for="general-settings-template">Template</label>
                <div data-placeholder="template-selector">
                    <!-- Element replaced by modal -->
                </div>
            </div>
            <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-inline">
                <label for="general-settings-favourite">Show in "Front pages"-menu</label>
                <input type="checkbox" name="fields.favourite" id="general-settings-favourite" value="1"{{ #fields.favourite }} checked{{ /fields.favourite }}>
            </div>
            <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-inline">
                <label for="general-settings-hideAds">Hide ads from this page</label>
                <input type="checkbox" name="fields.hideAds" id="general-settings-hideAds" value="1"{{ #fields.hideAds }} checked{{ /fields.hideAds }}>
            </div>
            <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap lab-inline">
                <label for="style_spacing">Enable custom space editing</label>
                <input type="checkbox" value="1" name="fields.style_spacing" id="style_spacing" {{ #fields.style_spacing }}checked{{ /fields.style_spacing }}>
            </div>
            <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                <label>Url</label>
                <p><a href="{{{ meta.frontpageurl }}}" target="_blank">{{{ meta.frontpageurl }}}</a></p>
            </div>
        </div>
    </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'General',
            label: 'Settings'
        };
    }

    onPaths() {
        return {
            'fields.site_id': {
                meta: 'site_id',
                validator: 'notEmpty'
            },
            template: {
                meta: 'template',
                validator: 'notEmpty'
            },
            'fields.favourite': {
                node: 'fields.favourite',
                meta: 'favourite',
                boolean: true
            },
            'fields.hideAds': {
                node: 'fields.hideAds',
                boolean: true
            },
            'fields.style_spacing': {
                node: 'fields.style_spacing',
                boolean: true
            }
        };
    }

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                favourite: this.rootModel.get('fields.favourite') === 'true' || this.rootModel.get('fields.favourite') === true,
                hideAds: this.rootModel.get('fields.hideAds') === '1' || this.rootModel.get('fields.hideAds') === true,
                style_spacing: this.rootModel.get('fields.style_spacing')
            },
            meta: {
                frontpageurl: this.api.v1.pages.front.getData().frontpageurl
            }
        }, true);

        const sitePlaceholder = markup.querySelector('[data-placeholder="site-selector"]');
        sitePlaceholder.parentNode.replaceChild(this.api.v1.ui.element.getSiteSelector({
            value: parseInt(this.rootModel.get('fields.site_id') || 0, 10),
            attributes: [{
                name: 'name', value: 'fields.site_id'
            }, {
                name: 'id', value: 'general-settings-site_id'
            }],
            events: [{
                name: 'change',
                callback: (event) => {
                    this.requestReload();
                }
            }]
        }), sitePlaceholder);

        const templatePlaceholder = markup.querySelector('[data-placeholder="template-selector"]');
        templatePlaceholder.parentNode.replaceChild(this.api.v1.ui.element.getSelectElement({
            value: this.meta.template,
            options: this.templates.data.map((item) => ({ value: item.alias })),
            attributes: [{
                name: 'name', value: 'template'
            }, {
                name: 'id', value: 'general-settings-template'
            }],
            events: [{
                name: 'change',
                callback: (event) => {
                    this.requestReload();
                }
            }]
        }), templatePlaceholder);
        return markup;
    }

    requestReload() {
        this.api.v1.ui.modal.dialog({
            content: {
                title: 'Reload page',
                description: 'The template or site for this front page has changed. Reload to continue editing with updated data.'
            },
            footer: {
                buttons: [
                    {
                        value: 'Continue without reloading',
                        id: 'continueBtn',
                        highlight: false
                    },
                    {
                        value: 'Reload',
                        type: 'submit',
                        highlight: true
                    }
                ]
            },
            callbacks: {
                submit: (formValues, theModal) => {
                    theModal.close(true);
                    this.api.v1.app.reload();
                }
            },
            eventHandlers: [{
                selector: '#continueBtn',
                event: 'click',
                callback: (modal, event) => {
                    modal.close();
                }
            }]
        });
    }

}
