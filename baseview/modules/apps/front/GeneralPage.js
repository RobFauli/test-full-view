export class GeneralPage {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true; // Sub-views may override and set to false to disable
        // if (!this.api.v1.user.hasPermission('admin_something')) {
        //     this.enabled = false;
        // }
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-below-large lab-space-above-none">Page settings</h2>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="general-page-name">Front page title</label>
                    <input type="text" name="fields.name" id="general-page-name" value="{{ fields.name }}" placeholder="Name for this front-page ...">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="general-page-hostpath">Host path</label>
                    <input type="text" name="fields.hostpath" id="general-page-hostpath" value="{{ fields.hostpath }}" placeholder="Url-path for this front-page. Example: 'news' or 'sport' ...">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="general-page-lab_canonical">Canonical url</label>
                    <input type="text" name="fields.lab_canonical" id="general-page-lab_canonical" value="{{{ fields.lab_canonical }}}" placeholder="Permanent url for this front-page ...">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="lab_redirect_url">Redirect url</label>
                    <input type="text" value="{{ fields.lab_redirect_url}}" name="fields.lab_redirect_url" id="lab_redirect_url" placeholder="301 redirect, use with caution ...">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="general-page-defaultsection">Default section</label>
                    <input type="text" name="fields.defaultsection" id="general-page-defaultsection" value="{{ fields.defaultsection }}" placeholder="Default section-name for this front-page ...">
                </div>
            </div>
        </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'General',
            label: 'Page'
        };
    }

    onPaths() {
        return {
            'fields.name': {
                node: 'fields.name',
                meta: 'name',
                validator: 'notEmpty'
            },
            'fields.hostpath': {
                node: 'fields.hostpath',
                meta: 'hostpath',
                validator: 'notEmpty'
            },
            'fields.lab_canonical': {
                node: 'fields.lab_canonical'
            },
            'fields.lab_redirect_url': {
                node: 'fields.lab_redirect_url'
            },
            'fields.defaultsection': {
                node: 'fields.defaultsection',
                meta: 'defaultsection'
            }
        };
    }

    onMarkup() {
        return this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                name: this.rootModel.get('fields.name'),
                hostpath: this.rootModel.get('fields.hostpath'),
                lab_canonical: this.rootModel.get('fields.lab_canonical'),
                lab_redirect_url: this.rootModel.get('fields.lab_redirect_url'),
                defaultsection: this.rootModel.get('fields.defaultsection')
            }
        }, true);
    }

}
