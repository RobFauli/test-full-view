export class FrontSaveAs {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-below-large lab-space-above-none">Save as</h2>
                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                    <label for="advanced-saveas-name">Front page title</label>
                    <input type="text" name="saveas-name" id="advanced-saveas-name" value="" placeholder="Name for new page ...">
                </div>
                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                    <label for="advanced-saveas-hostpath">Host path</label>
                    <input type="text" name="saveas-hostpath" id="advanced-saveas-hostpath" value="" placeholder="Host path ...">
                </div>
                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap lab-align-right">
                    <input type="button" id="advanced-saveas-button" value="Save copy">
                </div>
                <div id="advanced-saveas-info" class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap lab-align-center" style="padding: 1rem; color: gray;"></div>
            </div>  
        </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'Advanced',
            label: 'Save a copy'
        };
    }

    onPaths() {}

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {}, true);
        this.registerFront({
            id: this.rootModel.getId(),
            nameElement: markup.querySelector('#advanced-saveas-name'),
            hostpathElement: markup.querySelector('#advanced-saveas-hostpath'),
            button: markup.querySelector('#advanced-saveas-button'),
            infoElement: markup.querySelector('#advanced-saveas-info')
        });
        return markup;
    }

    registerFront({
        id, nameElement, hostpathElement, button, infoElement
    }) {
        nameElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.frontSubmitHandler(id, nameElement, hostpathElement, infoElement);
            }
        }, false);
        hostpathElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.frontSubmitHandler(id, nameElement, hostpathElement, infoElement);
            }
        }, false);
        button.addEventListener('click', (event) => {
            this.frontSubmitHandler(id, nameElement, hostpathElement, infoElement);
        }, false);
    }

    frontSubmitHandler(id, nameElement, hostpathElement, infoElement) {
        if (!nameElement.value.trim()) {
            nameElement.parentElement.classList.add('lab-validation-error');
            return;
        }
        nameElement.parentElement.classList.remove('lab-validation-error');
        if (!hostpathElement.value.trim()) {
            hostpathElement.parentElement.classList.add('lab-validation-error');
            return;
        }
        hostpathElement.parentElement.classList.remove('lab-validation-error');

        infoElement.classList.add('lab-busy');
        infoElement.innerHTML = 'Validating and saving new front-page ...';

        this.api.v1.pages.front.duplicate(id, nameElement.value.trim(), hostpathElement.value.trim()).then((resp) => {
            infoElement.classList.remove('lab-busy');
            infoElement.innerHTML = `Front-page is duplicated. Edit the new page at<br><a href="${ resp.url }" target="_blank">${ resp.url }</a>`;
        }).catch((error) => {
            infoElement.classList.remove('lab-busy');
            infoElement.innerHTML = error;
        });
        // this.copyFront(id, nameElement.value.trim(), hostpathElement.value.trim(), infoElement);
    }

}
