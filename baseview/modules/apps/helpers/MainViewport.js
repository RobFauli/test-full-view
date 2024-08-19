export class MainViewport {

    constructor(api, viewports, selected, model, path, permission) {
        this.api = api;
        this.viewports = viewports;
        this.selected = selected;
        this.originalSelected = selected;
        this.model = model;
        this.path = path;
        this.hasPermission = permission ? this.api.v1.user.hasPermission(permission) : true;
    }

    getMarkup() {
        const container = document.createElement('div');
        container.classList.add('mainViewport', 'lab-grid-large-12', 'lab-grid-gap');
        const template = `<div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-inline">
            <label for="mainViewport-{{ viewport }}">{{ viewport }}</label>
            <input type="radio" id="mainViewport-{{ viewport }}" name="mainViewport" value="{{ viewport }}"{{ #selected }} checked{{ /selected }}{{ #disabled }} disabled{{ /disabled }}>
        </div>`;
        for (const viewport of this.viewports) {
            container.appendChild(this.createElement(viewport, template));
        }
        return container;
    }

    createElement(viewport, template) {
        const el = this.api.v1.util.dom.renderTemplate(template, {
            viewport,
            selected: this.selected === viewport,
            disabled: viewport === this.main || !this.hasPermission
        }, true);
        const checkbox = el.querySelector('input');
        checkbox.addEventListener('change', (event) => {
            if (this.selected === checkbox.value) { return; }
            this.selected = checkbox.value;
            this.save();
        }, false);
        return el;
    }

    save() {
        this.model.set(this.path, this.selected);
        if (this.selected === this.originalSelected) { return; }
        const modal = this.api.v1.ui.modal.dialog({
            container: {
                state: {
                    warning: true
                }
            },
            content: {
                title: 'Main viewport changed',
                description: `Main viewport is set to "${ this.selected }".<br>Reload page for change to take effect.`
            },
            footer: {
                informalText: 'Chang will take effect next time you load the editor.',
                buttons: [
                    {
                        type: 'button',
                        id: 'cancel_button',
                        value: 'Continue',
                        highlight: false
                    },
                    {
                        type: 'submit',
                        value: 'Reload',
                        highlight: true
                    }
                ]
            },
            eventHandlers: [{
                selector: '#cancel_button',
                event: 'click',
                callback: () => {
                    modal.close();
                }
            }],
            callbacks: {
                submit: (event) => {
                    modal.close(true);
                    this.api.v1.app.reload();
                }
            }
        });
    }

}
