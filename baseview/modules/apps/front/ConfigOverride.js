export class ConfigOverride {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = this.api.v1.user.hasPermission('admin_frontpages'); // Sub-views may override and set to false to disable
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-below-large lab-space-above-none">Config override</h2>
                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                    <label for="lab_override_config_edit">Config for current page - Editor</label>
                    <textarea name="fields.lab_override_config_edit" id="lab_override_config_edit" placeholder="valid json only, use with caution" style="height:180px;">{{ fields.lab_override_config_edit }}</textarea>
                </div>
                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                    <label for="lab_override_config_presentation">Config for current page - Front</label>
                    <textarea name="fields.lab_override_config_presentation" id="lab_override_config_presentation" placeholder="valid json only, use with caution" style="height:180px;">{{ fields.lab_override_config_presentation }}</textarea>
                </div>
            </div>
        </div>
        `;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'Advanced',
            label: 'Config-override'
        };
    }

    onPaths() {
        return {
            'fields.lab_override_config_edit': {
                node: 'fields.lab_override_config_edit',
                validator: 'isJsonStringOrEmpty'
            },
            'fields.lab_override_config_presentation': {
                node: 'fields.lab_override_config_presentation',
                validator: 'isJsonStringOrEmpty'
            }
        };
    }

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                lab_override_config_edit: this.rootModel.get('fields.lab_override_config_edit'),
                lab_override_config_presentation: this.rootModel.get('fields.lab_override_config_presentation')
            }
        }, true);
        return markup;
    }

}
