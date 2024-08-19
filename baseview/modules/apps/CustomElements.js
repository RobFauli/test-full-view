export class CustomElements {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true; // Sub-views may override and set to false to disable
        this.elementsConfig = {};
    }

    setElementsConfig(config) {
        this.elementsConfig.aside = config.aside || {};
        this.elementsConfig.paths = config.paths || {};
        this.elementsConfig.formgroups = config.formgroups || [];
    }

    onAside() {
        return this.elementsConfig.aside;
    }

    onPaths() {
        return this.elementsConfig.paths;
    }

    onMarkup() {
        const container = document.createElement('div');
        container.classList.add('lab-modal-form', 'lab-grid', 'lab-hidden');
        for (const element of this.elementsConfig.formgroups) {
            container.appendChild(lab_api.v1.util.dom.renderEditor('elements/form/formgroup', element, true));
        }
        // Input-elements are defined in config. Update value from data:
        for (const path of Object.keys(this.elementsConfig.paths)) {
            const pathInfo = this.elementsConfig.paths[path];
            const nodePath = pathInfo.node;
            const el = container.querySelector(`[name="${ nodePath }"]`);
            if (nodePath && el) {
                const value = this.rootModel.get(nodePath);
                if (pathInfo.boolean) {
                    if (value) {
                        el.checked = true;
                    }
                } else {
                    el.value = value;
                }
            }
        }
        return container;
    }

}
