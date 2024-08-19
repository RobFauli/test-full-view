import contentLanguages from '../../lib/helpers/ContentLanguages.js';

export class SeoSettings {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.languageElement = null;
        this.languageLabel = null;
        this.enabled = true;
        this.isFrontPage = this.rootModel.getType() === 'page_front';
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-above-none">Search Engine Optimization</h2>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="seo-seotitle">SEO title</label>{{{ buttons.seo_content }}}
                    <textarea data-sugegstion-name="seo_content" name="fields.seotitle" id="seo-seotitle" placeholder="Search engine title ...">{{ fields.seotitle }}</textarea>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="seo-seodescription">SEO description</label>
                    <textarea data-sugegstion-name="seo_content" name="fields.seodescription" id="seo-seodescription" placeholder="Search engine description ...">{{ fields.seodescription }}</textarea>
                </div>

                <div class="lab-formgroup-item lab-grid-large-12 lab-inline lab-grid-gap">
                    <label for="norobots">Hide from Google</label>
                    <input type="checkbox" value="1" name="fields.norobots" id="norobots" {{ #fields.norobots }}checked{{ /fields.norobots }}>
                </div>

                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-above-medium">
                    <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-above-none">Page language</h2>
                    <p>This will <strong>only</strong> apply to the current page.</p>
                    <select name="fields.seolanguage" id="languages">
                        <option value="">Select language</option>
                        {{ #languages }}
                        <option value="{{ code }}"{{ #selected }} selected{{ /selected }}>{{ name }} - {{ code }}</option>
                        {{ /languages }}
                    </select>
                    <p id="language-label">{{ #fields.seolanguage }}Selected language: <strong>{{ fields.seolanguage }}</strong>{{ /fields.seolanguage }}{{ ^fields.seolanguage }}No language selected{{ /fields.seolanguage }}</p>
                    <p>The default language for the site is: <strong>{{ defaultLanguage }}</strong></p>
                </div>
            </div>

            <div class="lab-formgroup lab-grid lab-grid-gap">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap">Social Media</h2>

                ${ this.isFrontPage ? `
                <img id="some-image" style="display:{{# fields.someimage }}block{{/ fields.someimage }}{{^ fields.someimage}}none{{/ fields.someimage}}; width: 100%; max-height: 250px; object-fit: contain; background-color: #e7e7e7;" src="{{{images_url}}}/{{fields.someimage}}.webp?width=600&height=315" />

                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <input type="button" value="Select image" id="some-select-image" />
                    <input type="button" value="Remove image" id="some-remove-image" />
                </div>` : '' }

                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="seo-sometitle">SoMe title</label>{{{ buttons.some_content }}}
                    <textarea data-sugegstion-name="some_content" name="fields.sometitle" id="seo-sometitle" placeholder="SoMe title ...">{{ fields.sometitle }}</textarea>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="seo-somedescription">SoMe description</label>
                    <textarea data-sugegstion-name="some_content" name="fields.somedescription" id="seo-somedescription" placeholder="SoMe description ...">{{ fields.somedescription }}</textarea>
                </div>
            </div>

        </div>`;
        this.dom = {
            someimage: null
        };
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'SEO',
            label: 'SEO-settings'
        };
    }

    onPaths() {
        return {
            'fields.seotitle': {
                node: 'fields.seotitle'
            },
            'fields.seodescription': {
                node: 'fields.seodescription'
            },
            'fields.norobots': {
                node: 'fields.norobots', boolean: true
            },
            'fields.sometitle': {
                node: 'fields.sometitle'
            },
            'fields.somedescription': {
                node: 'fields.somedescription'
            },
            'fields.seolanguage': {
                node: 'fields.seolanguage'
            }
        };
    }

    onMarkup() {
        const seolanguage = this.rootModel.get('fields.seolanguage');
        const defaultLanguage = lab_api.v1.config.get('contentLanguage');
        const selectedLanguage = seolanguage || defaultLanguage;
        const languages = contentLanguages.map((language) => ({ name: language.name, code: language.code, selected: language.code === selectedLanguage }));

        if (this.rootModel.getType() === 'page_front') {
            const frontMarkup = this.api.v1.util.dom.renderTemplate(this.template, {
                fields: {
                    seotitle: this.rootModel.get('fields.seotitle'),
                    seodescription: this.rootModel.get('fields.seodescription'),
                    norobots: this.rootModel.get('fields.norobots'),
                    someimage: this.rootModel.get('fields.someimage'),
                    sometitle: this.rootModel.get('fields.sometitle'),
                    somedescription: this.rootModel.get('fields.somedescription'),
                    seolanguage: seolanguage || defaultLanguage
                },
                images_url: this.api.v1.properties.get('image_server'),
                languages,
                defaultLanguage
            }, true);

            const someImage = frontMarkup.querySelector('#some-image');
            this.dom.someimage = someImage;

            const someSelectImage = frontMarkup.querySelector('#some-select-image');
            const someRemoveImage = frontMarkup.querySelector('#some-remove-image');

            someSelectImage.addEventListener('click', async(event) => {
                this.changeImage();
            }, false);

            someRemoveImage.addEventListener('click', (event) => {
                this.removeImage();
            }, false);

            return frontMarkup;
        }

        const buttons = {
            seo_content: `<span class="lab-btn lab-xsmall lab-generate lab-link lab-busy-top" id="suggest-btn-seo_content" style="float:right; position:relative;">Generate new SEO-texts</span>`,
            some_content: `<span class="lab-btn lab-xsmall lab-generate lab-link lab-busy-top" id="suggest-btn-some_content" style="float:right; position:relative;">Generate new SoMe-texts</span>`
        };

        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            buttons,
            languages,
            defaultLanguage,
            fields: {
                seotitle: this.rootModel.get('fields.seotitle'),
                seodescription: this.rootModel.get('fields.seodescription'),
                norobots: this.rootModel.get('fields.norobots'),
                someimage: this.rootModel.get('fields.someimage'),
                sometitle: this.rootModel.get('fields.sometitle'),
                somedescription: this.rootModel.get('fields.somedescription'),
                seolanguage: this.rootModel.get('fields.seolanguage') || defaultLanguage
            }
        }, true);

        const allowFunction = this.api.v1.ns.get('textAssistant.allow');
        if (!allowFunction || !allowFunction()) {
            for (const el of [...markup.querySelectorAll(`.textsuggestion-btn`)]) {
                el.classList.add('lab-disabled');
            }
        }

        for (const name of Object.keys(buttons)) {
            const btn = markup.querySelector(`#suggest-btn-${ name }`);
            btn.addEventListener('click', (event) => {
                const inputEls = [...markup.querySelectorAll(`[data-sugegstion-name="${ name }"]`)];
                this.toggleSuggestUI(false, btn, inputEls);
                lab_api.v1.ns.get('textAssistant.fetchByName')(name).then((result) => {
                    if (result) {
                        this.setSuggestionValue(result, inputEls);
                    }
                    this.toggleSuggestUI(true, btn, inputEls);
                }).catch((error) => {
                    this.toggleSuggestUI(true, btn, inputEls);
                    console.error(error);
                });
            });
        }

        const languageElement = markup.querySelector('#languages');
        const languageLabel = markup.querySelector('#language-label');

        // Not sure why to do this? Will this update the element with the new selected data?
        if (this.languageElement) { this.languageElement.replaceWith(languageElement); }
        if (this.languageLabel) { this.languageLabel.replaceWith(languageLabel); }

        this.languageElement = languageElement;
        this.languageLabel = languageLabel;

        this.setupLanguages();

        return markup;
    }

    setupLanguages() {
        this.languageElement.addEventListener('change', (event) => {
            if (!this.languageElement.value) { return; }
            this.languageLabel.innerHTML = `Selected language: <strong>${ this.languageElement.value }</strong>`;
            this.rootModel.set('fields.seolanguage', this.languageElement.value);
        }, false);
    }

    toggleSuggestUI(on, btn, elements) {
        if (on) {
            btn.classList.remove('lab-busy');
            for (const inputEl of elements) {
                inputEl.removeAttribute('disabled');
            }
        } else {
            btn.classList.add('lab-busy');
            for (const inputEl of elements) {
                inputEl.setAttribute('disabled', 'disabled');
            }
        }
    }

    setSuggestionValue(values, elements) {
        for (const inputEl of elements) {
            inputEl.value = values[inputEl.getAttribute('name')];
            const e = new Event('change');
            inputEl.dispatchEvent(e);
        }
    }

    changeImage() {
        this.api.v1.collection.display({
            name: 'MediaImages',
            modal: true,
            skipCache: true,
            options: {
                label: 'All Images',
                archiveActive: true,
                clickHandler: (model, element) => {
                    this.setImage(model);
                }
            }
        });
    }

    setImage(model) {
        const instanceId = model.get('instance_of');
        if (instanceId != null) {
            this.rootModel.set('fields.someimage', instanceId);
            this.dom.someimage.src = `${ this.api.v1.properties.get('image_server') }/${ instanceId }.webp?width=600&height=315`; // Note: Width and Height are currently hardcoded. This should be changed to a more dynamic solution on demand. (Currently following the default image size for SoMe images.)
            this.dom.someimage.style.display = 'block';
        } else {
            // eslint-disable-next-line no-console
            console.warn('[SeoSettings] No image instance id found during front image selection.');
        }
    }

    removeImage() {
        this.rootModel.set('fields.someimage', null);
        this.dom.someimage.style.display = 'none';
        this.dom.someimage.src = ``;
    }

}
