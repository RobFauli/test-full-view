export class RequiredVieworts {

    constructor(api, viewports, main, selected, model, path, permission) {
        this.api = api;
        this.viewports = viewports;
        this.main = main;
        this.selected = selected;
        this.model = model;
        this.path = path;
        this.hasPermission = permission ? this.api.v1.user.hasPermission(permission) : true;
    }

    getMarkup() {
        const container = document.createElement('div');
        container.classList.add('requiredVieworts', 'lab-grid-large-12', 'lab-grid-gap');
        const template = `<div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-inline">
            <label for="requiredVieworts-{{ viewport }}">{{ viewport }}</label>
            <input type="checkbox" id="requiredVieworts-{{ viewport }}" value="1"{{ #selected }} checked{{ /selected }}{{ #disabled }} disabled{{ /disabled }}>
        </div>`;
        for (const viewport of this.viewports) {
            container.appendChild(this.createElement(viewport, template));
        }
        return container;
    }

    createElement(viewport, template) {
        if (!this.selected.includes(viewport) && viewport === this.main) {
            this.selected.push(viewport);
        }
        const el = this.api.v1.util.dom.renderTemplate(template, {
            viewport,
            selected: this.selected.includes(viewport),
            disabled: viewport === this.main || !this.hasPermission
        }, true);
        const checkbox = el.querySelector('input');
        checkbox.addEventListener('change', (event) => {
            if (checkbox.checked) {
                this.addViewport(viewport);
            } else {
                this.removeViewport(viewport);
            }
        }, false);
        return el;
    }

    addViewport(viewport) {
        if (!this.selected.includes(viewport)) {
            this.selected.push(viewport);
            this.displayViewports([...this.selected]);
        }
        this.save();
    }

    removeViewport(viewport) {
        this.selected = this.selected.filter((vp) => vp !== viewport);
        this.save();
    }

    displayViewports(viewports) {
        const current = this.api.v1.viewport.getActive();
        if (this.api.v1.util.valueTransformer.conditionalArrayCompare(current, viewports) && this.api.v1.util.valueTransformer.conditionalArrayCompare(viewports, current)) {
            return;
        }
        this.api.v1.viewport.display(viewports);
    }

    save() {
        this.model.set(this.path, [...this.selected]);
    }

}
