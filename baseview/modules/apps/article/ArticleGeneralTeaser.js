export class ArticleGeneralTeaser {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.setter = params.setter;
        this.enabled = true;
        this.dom = {
            crops: null,
            teasers: {
                kicker: null,
                title: null,
                subtitle: null
            },
            tagHandlerContainer: null,
            tagHandler: null,
            sectionElement: null,
            focusTagInput: false
        };
        this.models = {
            pano: null,
            height: null
        };
        const ar = this.api.v1.config.get('image.defaultAspectRatio') || 0.5;
        this.cropContainer = {
            panow: 270,
            panoh: Math.round(ar * 270),
            heightw: 130,
            heighth: 210
        };
        if (this.cropContainer.panoh > 150) {
            this.cropContainer.panoh = 150;
            this.cropContainer.panow = Math.round(150 / ar);
        }

        this.api.v1.util.dom.addFile('css', '/view-resources/baseview/view/css/apps/generalTags.css');
        this.bindingsHandler = this.onMarkup.bind(this);

        this.template = `<div class="lab-modal-form lab-grid lab-hidden">

            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-below-large lab-space-above-none">Front Crop & Teaser</h2>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap" style="min-height: 220px;">
                    <div data-placeholder="lab-frontcrops">
                        <!-- Children replaced -->
                    </div>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-align-right">
                    <input type="button" id="btn-remove-crops" value="Remove image">
                    <label>
                        <span class="lab-btn">Upload image</span>
                        <input type="file" id="btn-upload-image" value="Upload image" class="lab-hidden">
                    </label>
                    <input type="button" id="btn-change-crops" value="Change image">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-above-large">
                    <label for="teaser-kicker">Kicker used on front pages</label>
                    <input type="text" name="fields.teaserKicker" id="teaser-kicker" value="{{{ fields.teaserKicker }}}" placeholder="Teaser Kicker ...">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label>Title used on front pages</label>
                    <span class="lab-link" id="copy-title-btn" style="float: right;">Copy title</span>
                    <p class="lab-input-text" id="teaser-title" data-input-type-text data-input-key="fields.teaserTitle" placeholder="Teaser Title ...">{{{ fields.teaserTitle }}}</p>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label>Subtitle used on front pages</label>
                    <span class="lab-link" id="copy-subtitle-btn" style="float: right;">Copy subtitle</span>
                    <p class="lab-input-text" id="teaser-subtitle" data-input-type-text data-input-key="fields.teaserSubtitle" placeholder="Teaser Subtitle ...">{{{ fields.teaserSubtitle }}}</p>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <p class="lab-info">Front-page versions are used when the article is added to a page as a teaser.</p>
                </div>
            </div> 

            <div class="lab-formgroup lab-grid lab-space-below-small">
                <h2 class="lab-title lab-grid-large-12">Tags <span class="lab-btn lab-xsmall lab-generate lab-busy-top" id="suggest-btn-tags" style="float:right; position:relative; font-size: 1rem;">Generate new tags</span></h2>
                <div class="lab-grid lab-grid-large-12" data-handler="tagHandler"></div>
            </div>

            <div class="lab-formgroup lab-grid lab-space-below-large">
                <div class="lab-formgroup-item lab-grid-large-12">
                    <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-above-none">Section</h2>
                    <select name="primaryTags.section" id="sections">
                        <option value="">Select Section</option>
                        {{ #sections }}
                        <option value="{{ name }}"{{ #selected }} selected{{ /selected }}>{{ name }}</option>
                        {{ /sections }}
                    </select>
                    <p id="section-label">{{ #section }}Selected section: <strong>{{ section }}</strong>{{ /section }}{{ ^section }}No section selected{{ /section }}</p>
                </div>
            </div>

            <div class="lab-formgroup lab-grid lab-space-below-large">
                <br><br><br><br>
                <!-- space to allow tag-suggestions ... -->
            </div>
 
        </div>`;

        this.CropEditorModule = null;
        import(/* webpackIgnore: true */ '/lib-js/modules/editor/Tools/image/Editor.js')
            .then((module) => {
                this.CropEditorModule = module.Editor;
            });

        this.UploaderModule = null;
        this.uploader = null;
        import(/* webpackIgnore: true */ '/lib-js/modules/editor/utils/ImageUploader.js')
            .then((module) => {
                this.UploaderModule = module.ImageUploader;
            });
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'General',
            label: 'Front teaser + tags'
        };
    }

    onPaths() {
        return {
            'fields.teaserKicker': {
                node: 'fields.teaserKicker',
                transformer: (value, pathInfo) => {
                    const v = value.trim();
                    const rootValue = this.rootModel.get('fields.kicker');
                    return v === rootValue ? null : v;
                }
            },
            'fields.teaserSubtitle': {
                node: 'fields.teaserSubtitle',
                transformer: (value, pathInfo) => {
                    const v = value.trim();
                    // If plain text: Compare to root-model. If not: Use.
                    const el = document.createElement('div');
                    el.innerHTML = v;
                    if (el.childElementCount > 0) {
                        return v;
                    }
                    return v === this.rootModel.get('fields.subtitle') ? null : v;
                }
            },
            'fields.teaserTitle': {
                node: 'fields.teaserTitle',
                transformer: (value, pathInfo) => {
                    const v = value.trim();
                    // If plain text: Compare to root-model. If not: Use.
                    const el = document.createElement('div');
                    el.innerHTML = v;
                    if (el.childElementCount > 0) {
                        return v;
                    }
                    return v === this.rootModel.get('fields.title') ? null : v;
                }
            }
        };
    }

    onMarkup() {
        const section = (this.rootModel.get('primaryTags.section') || '').toLowerCase();
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                teaserKicker: this.api.v1.util.string.stripTags(this.rootModel.get('fields.teaserKicker') || this.rootModel.get('fields.kicker')),
                teaserSubtitle: this.rootModel.get('fields.teaserSubtitle') || this.api.v1.util.string.stripTags(this.rootModel.get('fields.subtitle') || 'Click to add teaserSubtitle'),
                teaserTitle: this.rootModel.get('fields.teaserTitle') || this.api.v1.util.string.stripTags(this.rootModel.get('fields.title') || 'Click to add teaserTitle')
            },
            sections: (this.api.v1.config.get('tags.section') || []).map((name) => ({ name: name.toLowerCase(), selected: name.toLowerCase() === section })),
            section,
            tags: this.rootModel.get('tags')
        }, true);
        this.dom.crops = markup.querySelector('[data-placeholder="lab-frontcrops"]');

        this.api.v1.article.frontcrop.get().then((data) => {
            this.setFrontCrops(data, markup);
        });

        const method = lab_api.v1.ns.get('textAssistant.fetchByName');
        const btnTags = markup.querySelector('#suggest-btn-tags');
        if (method) {
            btnTags.addEventListener('click', (event) => {
                btnTags.classList.add('lab-busy');
                method('tags').then((result) => {
                    if (result.tags) {
                        if (result && Array.isArray(result.tags)) {
                            this.api.v1.util.tags.set(result.tags);
                        } else {
                            console.log('Error: No array returned ...');
                        }
                    }
                    btnTags.classList.remove('lab-busy');
                }).catch((error) => {
                    btnTags.classList.remove('lab-busy');
                    console.log('error: ', error);
                });
            }, false);
        } else {
            btnTags.classList.add('lab-disabled');
        }

        const btnChange = markup.querySelector('#btn-change-crops');
        btnChange.addEventListener('click', (event) => {
            this.changeCrops();
        }, false);

        const btnRemove = markup.querySelector('#btn-remove-crops');
        btnRemove.addEventListener('click', (event) => {
            this.removeCrops();
        }, false);

        const btnUpload = markup.querySelector('#btn-upload-image');
        btnUpload.addEventListener('change', (event) => {
            this.uploadFiles(event.target.files);
        }, false);

        this.dom.teasers.kicker = markup.querySelector('#teaser-kicker');
        this.dom.teasers.kicker.addEventListener('input', (event) => {
            const v = this.dom.teasers.kicker.value.trim();
            const rootValue = this.rootModel.get('fields.kicker');
            if (rootValue === v) {
                this.dom.teasers.kicker.classList.add('lab-disabled');
            } else {
                this.dom.teasers.kicker.classList.remove('lab-disabled');
            }
        }, false);
        this.dom.teasers.kicker.dispatchEvent(new Event('input'));

        this.dom.teasers.title = markup.querySelector('#teaser-title');
        this.dom.teasers.subtitle = markup.querySelector('#teaser-subtitle');
        this.updateDisabledState('title', !!this.rootModel.get('fields.teaserTitle'));
        this.updateDisabledState('subtitle', !!this.rootModel.get('fields.teaserSubtitle'));

        const btnCopyTitle = markup.querySelector('#copy-title-btn');
        btnCopyTitle.addEventListener('click', (event) => {
            this.dom.teasers.title.innerHTML = this.rootModel.get('fields.title') || 'Click to add teaserTitle';
            this.updateDisabledState('title', true);
            this.setter('fields.teaserTitle', this.dom.teasers.title.innerHTML);
        }, false);
        const btnCopySubtitle = markup.querySelector('#copy-subtitle-btn');
        btnCopySubtitle.addEventListener('click', (event) => {
            this.dom.teasers.subtitle.innerHTML = this.rootModel.get('fields.subtitle') || 'Click to add teaserSubtitle';
            this.updateDisabledState('subtitle', true);
            this.setter('fields.teaserSubtitle', this.dom.teasers.subtitle.innerHTML);
        }, false);

        const tagHandlerContainer = markup.querySelector('[data-handler="tagHandler"]');
        const sectionElement = markup.querySelector('[name="primaryTags.section"]');
        const sectionLabel = markup.querySelector('#section-label');

        if (this.dom.tagHandlerContainer) { this.dom.tagHandlerContainer.replaceWith(tagHandlerContainer); }
        if (this.dom.sectionElement) { this.dom.sectionElement.replaceWith(sectionElement); }
        if (this.dom.sectionLabel) { this.dom.sectionLabel.replaceWith(sectionLabel); }

        this.dom.tagHandlerContainer = tagHandlerContainer;
        this.dom.sectionElement = sectionElement;
        this.dom.sectionLabel = sectionLabel;

        this.setupSections();
        this.setupTags();

        this.api.v1.apps.start('TextEdit').then((textTool) => {
            this.setupRichTextEditing(textTool, markup);
        }).catch((error) => {
            console.log(`Error loading TextEdit-app: ${ error }`);
        });

        return markup;
    }

    updateDisabledState(field, forceClean = false) {
        if (!this.dom.teasers[field]) { return; }
        if (!forceClean && this.rootModel.get(`fields.${ field }`) === this.dom.teasers[field].innerHTML) {
            this.dom.teasers[field].classList.add('lab-disabled');
        } else {
            this.dom.teasers[field].classList.remove('lab-disabled');
        }
    }

    onDisplayed(element) {
        this.addBindings();
    }

    onHidden(element) {
        this.removeBindings();
    }

    addBindings() {
        this.api.v1.model.bindings.bind(this.rootModel, 'tags', this.bindingsHandler);
        this.api.v1.model.bindings.bind(this.rootModel, 'primaryTags.section', this.bindingsHandler);
    }

    removeBindings() {
        this.api.v1.model.bindings.unbind(this.rootModel, 'tags', this.bindingsHandler);
        this.api.v1.model.bindings.unbind(this.rootModel, 'primaryTags.section', this.bindingsHandler);
    }

    setupRichTextEditing(textTool, markup) {
        for (const element of markup.querySelectorAll('.lab-input-text')) {
            if (element && element instanceof HTMLElement) {
                const key = element.getAttribute('data-input-key') || 'no-key';
                this.setupRichTextEditingForElement(textTool, markup, element, key);
            }
        }
    }

    setupRichTextEditingForElement(textTool, markup, element, key) {
        const contentdata = {};
        lab_api.v1.util.object.set(key, this.rootModel.get(key), contentdata);
        textTool.register({
            element,
            simulatedData: {
                type: 'article',
                path: '',
                contentdata
            },
            toolSettings: {
                key,
                inlineOnly: true,
                displayCharCount: false,
                displaySelectionLength: false,
                displayWordCount: false,
                selectTextOnStart: false,
                placeholder: `Click to add ${ key.replace('fields.', '') }`,
                attributes: {
                    text_size: {
                        active: false
                    }
                }
            },
            callbacks: {
                ended: (theKey, theValue) => {
                    this.setter(theKey, theValue);

                    // Page-node needs 'fields.allowRichTextTeasers' for Labrador API to return rich text ...
                    this.rootModel.set('fields.allowRichTextTeasers', '1');
                    this.updateDisabledState(theKey.replace('fields.teaser', '').toLowerCase());
                },
                started: (tool, theKey) => {
                    this.updateDisabledState(theKey.replace('fields.teaser', '').toLowerCase(), true);
                }
            },
            menuSettings: {
                container: markup,
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

    async setupTags() {
        if (this.dom.tagHandler) {
            this.dom.tagHandlerContainer.appendChild(this.dom.tagHandler);
            return;
        }

        // Add UI to to add and remove tags from current article
        const tagHandler = await this.api.v1.util.tags.ui({
            callbacks: {

                // (Promise) User has selected a tag. Add it to current article
                add: (tag) => {
                    const inputEl = this.dom.tagHandler.querySelector('input');
                    if (inputEl) {
                        setTimeout(() => { inputEl.focus(); }, 100);
                    }
                    return this.api.v1.util.tags.add(tag);
                },

                // (Promise) User has deleted a tag. Remove it from current article
                remove: (tag) => {
                    const inputEl = this.dom.tagHandler.querySelector('input');
                    if (inputEl) {
                        setTimeout(() => { inputEl.focus(); }, 100);
                    }
                    return this.api.v1.util.tags.remove(tag);
                }
            },

            // If true, the tag-handler will return an object with the dom-element and a method to update the list of tags the UI will display
            returnObject: true,

            // Custom css classes
            // css: {
            //     container: 'container-css',
            //     search: 'search-css',
            //     suggestions: 'suggestions-css'
            // },

            // List of current tags
            tags: this.rootModel.get('tags'),

            // A value of true will display number of times this tag has been used ...
            detailedSearch: true,

            // Placeholder for the input field to search tags
            placeholder: 'Add tag ...'
        });
        this.dom.tagHandler = tagHandler.element;
        this.api.v1.model.bindings.bind(this.rootModel, 'tags', (target, path, value) => {
            tagHandler.updateTags(value);
        });
        this.dom.tagHandlerContainer.appendChild(this.dom.tagHandler);
    }

    setupSections() {
        this.dom.sectionElement.addEventListener('change', (event) => {
            if (!this.dom.sectionElement.value) { return; }
            const currentSection = (this.rootModel.get('primaryTags.section') || '').toLowerCase();
            this.rootModel.set('primaryTags.section', this.dom.sectionElement.value);
            if (currentSection && this.dom.sectionElement.value !== currentSection) {
                this.api.v1.util.tags.remove(currentSection);
            }
            this.api.v1.util.tags.add(this.dom.sectionElement.value);
        }, false);
    }

    uploadFiles(filelist) {
        this.dom.crops.classList.add('lab-busy');
        if (!this.uploader) {
            this.uploader = new this.UploaderModule({
                callbacks: {
                    uploadStart: (item) => {},
                    uploadProgress: (item) => {},
                    uploadFinished: (item) => { this.setFrontCropFromModel(null, item.result.file.success[0].id); },
                    uploadFailed: (item) => { this.dom.crops.classList.remove('lab-busy'); console.log('uploadFailed: ', item); },
                    uploadFinishedAll: (item) => {}
                }
            });
        }
        if (!this.hasValidFile(filelist)) {
            this.dom.crops.classList.remove('lab-busy');
            Sys.logger.warn('[uploadFiles] No valid image-file found. Upload cancelled.');
            return;
        }
        this.uploader.upload({ files: filelist });
    }

    hasValidFile(filelist) {
        if (!this.uploader) { return false; }
        for (const file of [...filelist]) {
            if (this.uploader.validateFile(file)) { return true; }
        }
        return false;
    }

    removeCrops() {
        this.dom.crops.classList.add('lab-busy');
        this.api.v1.article.frontcrop.clear();
        this.api.v1.model.delete(this.models.pano);
        this.api.v1.model.delete(this.models.height);
        this.models.pano = null;
        this.models.height = null;
        this.setFrontCrops(null);
    }

    changeCrops() {
        this.api.v1.collection.display({
            name: 'MediaImagesThisPage',
            modal: true,
            skipCache: true,
            options: {
                label: 'Images from this page',
                clickHandler: (model, element) => {
                    this.setFrontCropFromModel(model);
                },
                navigation: [
                    {
                        label: 'Display All images',
                        name: 'MediaImages',
                        modal: true,
                        skipCache: true,
                        options: {
                            label: 'All images',
                            archiveActive: false,
                            clickHandler: (model, element) => {
                                this.setFrontCropFromModel(model);
                            },
                            navigation: [
                                {
                                    label: 'Display This page',
                                    name: 'MediaImagesThisPage',
                                    modal: true,
                                    skipCache: true
                                }
                            ]
                        }
                    }
                ]
            }
        });
    }

    async setFrontCropFromModel(model, instance_of) {
        this.dom.crops.classList.add('lab-busy');
        const panoData = this.api.v1.util.object.merge(this.defaultCropData(), {
            contentdata: {
                instance_of: instance_of || model.get('instance_of'),
                fields: {
                    metadata_key: 'fcp'
                }
            }
        });
        const heightData = this.api.v1.util.object.merge(this.defaultCropData(), {
            contentdata: {
                instance_of: instance_of || model.get('instance_of'),
                fields: {
                    metadata_key: 'fch'
                }
            },
            type: 'image'
        });
        if (!model) {
            this.setFrontCropFromData(panoData, heightData);
            return;
        }

        this.validateCropModel(model).then((id) => {
            panoData.contentdata.instance_of = id;
            heightData.contentdata.instance_of = id;
            this.setFrontCropFromData(panoData, heightData);
        });
    }

    // (Promise)
    // If the image is external it will need to be downloaded by Labrador.
    // The media-collection should set nessesary data on the model for Labrador to fetch the external image.
    validateCropModel(model) {
        return new Promise((resolve, reject) => {
            if (model.get('instance_of')) {
                resolve(model.get('instance_of'));
            } else {
                this.api.v1.app.create(model).then((m) => {
                    resolve(model.get('instance_of'));
                }).catch((error) => {
                    reject(new Error('Cannot create instance_of-id.'));
                });
            }
        });
    }

    async setFrontCropFromData(pano, height) {
        await this.api.v1.article.frontcrop.set({
            pano,
            height
        });
        const panoData = { ...pano };
        const heightData = { ...height };

        this.models.pano = null;
        this.models.height = null;

        this.setFrontCrops({
            pano: panoData,
            height: heightData
        });
    }

    defaultCropData() {
        return {
            type: 'image',
            contentdata: {
                fields: {
                    croph: 100,
                    cropw: 100,
                    x: 0,
                    y: 0
                }
            }
        };
    }

    setFrontCrops(data, markup) {
        const cropData = data || {};
        const panoData = cropData.pano || this.defaultCropData();
        const heightData = cropData.height || this.defaultCropData();
        panoData.contentdata.fields.metadata_key = 'fcp';
        heightData.contentdata.fields.metadata_key = 'fch';

        if (!this.models.pano) {
            this.models.pano = this.getCropModel(panoData.contentdata.id, 'fcp');
        }
        if (!this.models.height) {
            this.models.height = this.getCropModel(heightData.contentdata.id, 'fch');
        }

        if (!this.models.pano && panoData.contentdata.instance_of) {
            this.models.pano = this.api.v1.model.create.view(panoData, { parentModel: this.rootModel });
        }
        if (!this.models.height && heightData.contentdata.instance_of) {
            this.models.height = this.api.v1.model.create.view(heightData, { parentModel: this.rootModel });
        }

        this.updateCropElements(!!panoData.contentdata.instance_of && !!heightData.contentdata.instance_of);
    }

    getCropModel(id, type) {
        let model = null;
        if (id) {
            model = this.api.v1.model.query.getModelById(id);
        }
        if (model) {
            return model;
        }
        const models = this.api.v1.model.query.getModelsByType('image').filter((m) => m.get('fields.metadata_key') === type);
        return models[0] || null;
    }

    updateCropElements(hasData) {
        this.dom.crops.innerHTML = '';
        this.dom.crops.appendChild(this.createCropElements(hasData));
        this.dom.crops.classList.remove('lab-busy');
    }

    createCropElements(hasData) {
        if (!hasData) {
            return this.api.v1.util.dom.renderTemplate(`<div class="lab-grid lab-valign-center">
                <div class="crop-pano lab-grid-large-7 lab-grid lab-align-center">
                    <div class="lab-empty-placeholder lab-color-light lab-bordered" style="width: ${ this.cropContainer.panow }px; height: ${ this.cropContainer.panoh }px; padding-top: 10px;">
                        <div class="lab-inner">
                            <div class="lab-icon-large labicon-images"></div>
                        </div>
                    </div>
                </div>
                <div class="crop-height lab-grid-large-5 lab-grid lab-align-center">
                    <div class="lab-empty-placeholder lab-color-light lab-bordered" style="width: ${ this.cropContainer.heightw }px; height: ${ this.cropContainer.heighth }px; padding-top: 50px;">
                        <div class="lab-inner">
                            <div class="lab-icon-large labicon-images"></div>
                        </div>
                    </div>
                </div>
            </div>`, {}, true);
        }
        const imageServer = this.api.v1.properties.get('image_server');
        const pano = {
            cropw: this.models.pano.get('fields.cropw') || 100,
            croph: this.models.pano.get('fields.croph') || 100,
            x: this.models.pano.get('fields.x') || 0,
            y: this.models.pano.get('fields.y') || 0
        };
        const height = {
            cropw: this.models.height.get('fields.cropw') || 100,
            croph: this.models.height.get('fields.croph') || 100,
            x: this.models.height.get('fields.x') || 0,
            y: this.models.height.get('fields.y') || 0
        };
        const el = this.api.v1.util.dom.renderTemplate(`<div class="lab-grid lab-valign-center">
            <div class="crop-pano lab-grid-large-7 lab-grid lab-align-center">
                <span style="display:inline-block;"><img src="${ imageServer }/${ this.models.pano.get('instance_of') }.webp?imageId=${ this.models.pano.get('instance_of') }&width=${ this.cropContainer.panow }&height=${ this.cropContainer.panoh }&${ Object.keys(pano).map((key) => `${ key }=${ pano[key] }`).join('&') }"></span>
            </div>
            <div class="crop-height lab-grid-large-5 lab-align-center lab-grid">
                <span style="display:inline-block;"><img src="${ imageServer }/${ this.models.height.get('instance_of') }.webp?imageId=${ this.models.height.get('instance_of') }&width=${ this.cropContainer.heightw }&height=${ this.cropContainer.heighth }&${ Object.keys(height).map((key) => `${ key }=${ height[key] }`).join('&') }"></span>
            </div>
        </div>`, {}, true);
        const panoImage = el.querySelector('.crop-pano img');
        panoImage.addEventListener('click', (event) => { this.editCrop(panoImage, true); }, false);
        const heightImage = el.querySelector('.crop-height img');
        heightImage.addEventListener('click', (event) => { this.editCrop(heightImage, false); }, false);
        return el;
    }

    editCrop(element, isPano) {
        const model = isPano ? this.models.pano : this.models.height;
        const offset = this.api.v1.viewport.getOffset();
        const crop = {
            x: model.get('fields.x') || 0,
            y: model.get('fields.y') || 0,
            cropw: model.get('fields.cropw') || 100,
            croph: model.get('fields.croph') || 100
        };
        const keyEventsIds = [];
        const endCallback = (theEditor) => {
            while (keyEventsIds.length > 0) {
                this.api.v1.util.keyEventHandler.remove(keyEventsIds.pop());
            }

            if (theEditor) {
                const serializedCrop = theEditor.end();
                model.set('fields.x', serializedCrop.x);
                model.set('fields.y', serializedCrop.y);
                model.set('fields.cropw', serializedCrop.cropw);
                model.set('fields.croph', serializedCrop.croph);
            }
            this.updateCropElements(true);
        };
        const editor = new this.CropEditorModule({
            modal: false,
            container: {
                width: isPano ? 270 : 130,
                height: isPano ? 129 : 210,
                element: element.parentElement,
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

}
