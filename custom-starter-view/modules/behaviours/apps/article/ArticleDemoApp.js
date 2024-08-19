export class ArticleDemoApp {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">

            <div class="lab-formgroup lab-grid lab-bordered">
                <h2 class="lab-title lab-grid-large-12 lab-space-below-large">Article Demo App</h2>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="demoTextField">Demo text field</label>
                    <input type="text" value="{{ fields.demoTextField}}" name="fields.demoTextField" id="demoTextField" placeholder="Placeholder for article demo app...">
                </div>
            </div>

        </div>`;
    }

    onAside() {
        return {
            section: 'Advanced',
            label: 'Demo App'
        };
    }

    onPaths() {
        return {
            'fields.demoTextField': { node: 'fields.demoTextField', validator: 'notEmpty' }
        };
    }

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                demoTextField: this.rootModel.get('fields.demoTextField')
            }
        }, true);
        return markup;
    }

}
