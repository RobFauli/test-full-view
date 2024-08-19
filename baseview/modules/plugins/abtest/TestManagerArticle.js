// import templates from './templates.js';
import { TestManagerBase } from './TestManagerBase.js';

export class TestManagerArticle extends TestManagerBase {

    constructor(api, model, endCallback) {
        super(api, model);
        this.endCallback = endCallback;
        this.instanceOfId = this.model.getId();
        this.ui.sizes = {
            logo: 3,
            variantsContainer: 9,
            variants: 4,
            selectedVariant: 8
        };
        this.ui.displayArticleData = true;
        this.usePartialData = true;
        this.api.v1.apps.start('TextEdit').then((textTool) => {
            this.textEditor = textTool;
        }).catch((error) => {
            console.error(`Error loading TextEdit-app: ${ error }`);
        });
        this.CropEditorModule = this.api.v1.tool.classes.get('ImageEdit').getEditor();
    }

    setupEditables(model, skipEditor = false) {
        const editables = {};
        if (this.ui.editablesContainer) {
            editables.image = this.setupEditableImage(model, skipEditor);
            editables.kicker = this.setupEditable(model, 'fields.kicker', skipEditor);
            editables.title = this.setupEditable(model, 'fields.title', skipEditor);
            editables.subtitle = this.setupEditable(model, 'fields.subtitle', skipEditor);
        }
        return editables;
    }

    setupEditableImage(model, skipEditor) {
        const image = this.api.v1.model.query.getChildOfType(model, 'image');
        return this.createImageElements(image, model);
    }

    async setupImagePlaceholder(model) {
        const image = await this.getModelImageData();
        if (image) {
            const element = this.createImageElements(lab_api.v1.model.create.view(image), model, true);
            this.ui.editablesContainerImage.appendChild(element);
        }
    }

    updateImage(model) {
        this.ui.editablesContainerImage.innerHTML = '';
        const el = this.createImageElements(model, model ? model.getParent() : undefined);
        this.ui.editablesContainerImage.appendChild(el);
        if (this.preparedVariants.get(this.currentVariant)) {
            this.preparedVariants.get(this.currentVariant).editables.image = el;
        }
    }

    removeImage(model) {
        lab_api.v1.model.delete(model);
        this.updateImage();
    }

    async showDefaultFields() {
        let image = await this.getModelImageData();
        if (image !== null && !image.data) {
            image = this.api.v1.model.create.view(image);
        }
        this.updateImage(image);
    }

    changeImage(currentImage, parent) {
        this.api.v1.collection.display({
            name: 'MediaImages',
            modal: true,
            skipCache: true,
            options: {
                label: 'Images',
                clickHandler: (model, element) => {
                    this.setImage(model, currentImage, parent);
                }
            }
        });
    }

    setImage(model, currentImage, parent) {
        if (currentImage) {
            this.removeImage(currentImage);
        }
        this.api.v1.model.setNonPersistentState(model, true);
        parent.addChild(model);
        this.updateImage(model);
    }

    createImageElements(image, parent, placeholder = false) {
        const buttons = this.api.v1.util.dom.renderTemplate(`<div class="abtest-image-btns">
            <input type="button" class="btn-remove-image" value="Remove" ${ (!image || placeholder) ? 'disabled' : '' }>
            <input type="button" class="btn-change-image" value="Change" ${ !this.currentVariant ? 'disabled' : '' }>
        </div>`, {}, true);
        buttons.querySelector('.btn-remove-image').addEventListener('click', (event) => {
            this.removeImage(image);
        });
        buttons.querySelector('.btn-change-image').addEventListener('click', (event) => {
            this.changeImage(image, parent);
        });

        if (!image) {
            const el = this.api.v1.util.dom.renderTemplate(`
                <div class="abtest-image-el">
                    <div class="lab-empty-placeholder lab-color-light lab-bordered">
                        <div class="lab-inner">
                            <div class="lab-icon-large labicon-images"></div>
                        </div>
                    </div>
                </div>
            `, {}, true);
            el.appendChild(buttons);
            return el;
        }
        const imageServer = this.api.v1.properties.get('image_server');
        const view = this.api.v1.view.getView(image);
        const cropdata = {
            cropw: view.get('fields.cropw') || 100,
            croph: view.get('fields.croph') || 100,
            x: view.get('fields.x') || 0,
            y: view.get('fields.y') || 0
        };
        const size = {
            w: 270,
            h: 122
        };
        const el = this.api.v1.util.dom.renderTemplate(`
            <div class="abtest-image-el">
                <figure><img src="${ imageServer }/${ image.get('instance_of') }.webp?imageId=${ image.get('instance_of') }&width=${ size.w }&height=${ size.h }&${ Object.keys(cropdata).map((key) => `${ key }=${ cropdata[key] }`).join('&') }"></figure>
            </div>
        `, {}, true);
        el.appendChild(buttons);
        const imageElement = el.querySelector('.abtest-image-el img');
        imageElement.addEventListener('click', (event) => { this.editCrop(imageElement, image); }, false);
        return el;
    }

    editCrop(element, model) {
        const offset = this.api.v1.viewport.getOffset();
        const view = this.api.v1.view.getView(model);
        const crop = {
            x: view.get('fields.x') || 0,
            y: view.get('fields.y') || 0,
            cropw: view.get('fields.cropw') || 100,
            croph: view.get('fields.croph') || 100
        };
        const keyEventsIds = [];
        const endCallback = (theEditor) => {
            while (keyEventsIds.length > 0) {
                this.api.v1.util.keyEventHandler.remove(keyEventsIds.pop());
            }
            if (theEditor) {
                const serializedCrop = theEditor.end();
                view.set('fields.x', serializedCrop.x);
                view.set('fields.y', serializedCrop.y);
                view.set('fields.cropw', serializedCrop.cropw);
                view.set('fields.croph', serializedCrop.croph);
            }
            this.updateImage(model);
        };
        const editor = new this.CropEditorModule({
            modal: false,
            container: {
                width: 300,
                height: 200,
                element,
                cssList: ['lab-modal-overlay']
            },
            offset: {
                y: window.scrollY - offset.top
            },
            imageElement: {
                element
            },
            crop,
            tools: {
                resize: {
                    active: false
                }
            },
            imageUrl: `${ this.api.v1.properties.get('image_server') }/?imageId=${ model.get('instance_of') }`
        }, {
            end: () => {
                endCallback(editor);
            }
        });
        keyEventsIds.push(this.api.v1.util.keyEventHandler.add({
            key: 'Escape',
            callback: (event) => {
                editor.end();
                endCallback();
            },
            stopPropagation: true,
            preventDefault: true,
            overrideDisable: true
        }));
        keyEventsIds.push(this.api.v1.util.keyEventHandler.add({
            key: 'S',
            controlkeys: ['labCtrlKey'],
            callback: (event) => {
                endCallback(editor);
            },
            stopPropagation: true,
            preventDefault: true,
            overrideDisable: true
        }));

    }

    setupEditable(model, path, skipEditor) {
        const el = document.createElement('h2');
        const fieldName = path.replace('fields.', '');
        el.innerHTML = model.get(path) || `Click to add ${ fieldName }`;
        el.classList.add('lab-title', `abtest-text-${ fieldName }`);
        if (skipEditor) {
            el.classList.add('lab-defaultTextValue');
        } else {
            el.setAttribute('title', `Click to edit ${ fieldName }`);
            this.setupRichTextEditingForElement(model, el, path);
        }
        return el;
    }

    setupRichTextEditingForElement(model, element, key) {
        const contentdata = {};
        lab_api.v1.util.object.set(key, model.get(key), contentdata);
        this.textEditor.register({
            element,
            simulatedData: {
                type: 'article',
                path: '',
                contentdata
            },
            toolSettings: {
                key,
                inlineOnly: true,
                displayCharCount: true,
                displaySelectionLength: false,
                displayWordCount: true,
                selectTextOnStart: true,
                placeholder: `Click to add ${ key.replace('fields.', '') }`,
                attributes: {
                    text_size: {
                        active: false
                    }
                }
            },
            callbacks: {
                ended: (theKey, theValue) => {
                    model.set(theKey, theValue.trim());
                },
                started: (tool, theKey) => {}
            },
            menuSettings: {
                container: this.ui.editablesContainerText,
                style: {
                    'margin-top': '-10px'
                },
                items: {
                    textColor: {
                        group: 'g1',
                        inheritPath: 'menu/buttons/textColor.json'
                    },
                    textBackgroundColor: {
                        group: 'g1',
                        inheritPath: 'menu/buttons/textBackgroundColor.json'
                    },
                    bold: {
                        group: 'g2',
                        icon: 'labicon-text_bold',
                        callback: 'toggleAttribute',
                        key: 'font_weight',
                        attributes: {
                            class: 'font-weight-bold'
                        },
                        value: false,
                        onValue: 'font-weight-bold',
                        offValue: false,
                        bindToSelection: 'font_weight',
                        title: 'Font weight - Bold',
                        hotkeys: [{
                            key: 'B',
                            controlkeys: ['labCtrlKey'],
                            preventDefault: true,
                            overrideDisable: true
                        }]
                    },
                    italic: {
                        group: 'g2',
                        icon: 'labicon-text_italic',
                        callback: 'toggleAttribute',
                        key: 'italic',
                        attributes: {
                            class: 'italic'
                        },
                        value: false,
                        onValue: 'italic',
                        offValue: false,
                        bindToSelection: 'italic',
                        title: 'Italic',
                        hotkeys: [{
                            key: 'i',
                            controlkeys: ['labCtrlKey'],
                            preventDefault: true,
                            overrideDisable: true
                        }]
                    },
                    reset: {
                        group: 'g4',
                        icon: 'labicon-reset_style',
                        callback: 'reset',
                        title: 'Remove textformatting in selection for viewport'
                    }
                }
            }
        });
    }

    bindWidth() {}

    setWidth() {}

    removeFromEditor(model) {}

    resetRemoveFromEditor(model) {}

    addToController(model) {
        this.model.addChild(model);
    }

    end() {
        super.end();
        this.endCallback();
    }

}
