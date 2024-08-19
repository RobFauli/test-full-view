import { RequiredVieworts } from '../helpers/RequiredVieworts.js';
import { MainViewport } from '../helpers/MainViewport.js';

export class AdvancedViewports {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = this.api.v1.user.hasPermission('admin_user'); // Sub-views may override and set to false to disable
        this.requiredViewortsHelper = new RequiredVieworts(
            this.api,
            this.api.v1.viewport.getEditable(),
            this.api.v1.viewport.getMain(),
            [...(this.rootModel.get('fields.lab_required_viewports_json') || [])],
            this.rootModel,
            'fields.lab_required_viewports_json',
            'admin_user'
        );
        this.mainViewortsHelper = new MainViewport(
            this.api,
            this.api.v1.viewport.getEditable(),
            this.rootModel.get('fields.lab_main_viewport') || this.api.v1.viewport.getMain(),
            this.rootModel,
            'fields.lab_main_viewport',
            'admin_user'
        );

        // requiredVieworts: this.api.v1.apps.start('RequiredVieworts', this.api.v1.viewport.getEditable(), this.api.v1.viewport.getMain(), [...(this.rootModel.get('fields.lab_required_viewports_json') || [])], this.rootModel, 'fields.lab_required_viewports_json', 'admin_user'),
        // mainViewport: this.api.v1.apps.start('MainViewport', this.api.v1.viewport.getEditable(), this.rootModel.get('fields.lab_main_viewport') || this.api.v1.viewport.getMain(), this.rootModel, 'fields.lab_main_viewport', 'admin_user'),

        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none lab-bordered">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-below-medium lab-space-above-none">Require viewport(s)</h2>
                <p class="lab-grid-large-12 lab-grid-gap">Users normally selects viewports to edit themselves (hotkey <span class="lab-label-hotkey">V</span>). This option lets editors require selected viewports to always display for current page.</p>
                <div data-placeholder="viewports-required">
                    <!-- Element replaced by modal -->
                </div>
            </div>
            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-below-medium lab-space-above-none">Set main viewport</h2>
                <p class="lab-grid-large-12 lab-grid-gap">The viewport defined as "main" is used for fallback-data and should be set to the viewport with the richest data-set.</p>
                <div data-placeholder="viewports-main">
                    <!-- Element replaced by modal -->
                </div>
            </div>
        </div>`;

        // {
        //     selector: '[data-placeholder="viewports-required"]',
        //     element: resources.modules.requiredVieworts.getMarkup()
        // }
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'Advanced',
            label: 'Viewports'
        };
    }

    onPaths() {}

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                name: this.rootModel.get('fields.name'),
                hostpath: this.rootModel.get('fields.hostpath'),
                lab_canonical: this.rootModel.get('fields.lab_canonical'),
                defaultsection: this.rootModel.get('fields.defaultsection')
            }
        }, true);
        const viewportsPlaceholder = markup.querySelector('[data-placeholder="viewports-required"]');
        viewportsPlaceholder.parentNode.replaceChild(this.requiredViewortsHelper.getMarkup(), viewportsPlaceholder);
        const mainViewportsPlaceholder = markup.querySelector('[data-placeholder="viewports-main"]');
        mainViewportsPlaceholder.parentNode.replaceChild(this.mainViewortsHelper.getMarkup(), mainViewportsPlaceholder);
        return markup;
    }

}
