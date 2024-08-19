import { Group } from './Group.js';
import contentLanguages from '../../lib/helpers/ContentLanguages.js';

import asideTemplate from './aside.js';

export const FACTBOX_TYPES = {
    SUMMARY: 'summary',
    BULLETPOINTS: 'bulletpoints'
};

export class Manager {

    constructor(api, model, config = {}) {
        this.api = api;
        this.rootModel = this.api.v1.model.query.getRootModel();

        this.model = model;
        this.state = {
            uiReady: false,
            cssLoaded: false
        };
        this.settings = {
            minLength: 500
        };
        this.writingStyles = Array.isArray(config.writingStyles) ? config.writingStyles : [];
        this.writingTones = Array.isArray(config.writingTones) ? config.writingTones : [];
        this.modal = null;
        this.menuItem = null;
        this.userSettings = null;
        this.getter = this.getFieldValue.bind(this);
        this.groups = this.setupGroups(Array.isArray(config.content) ? config.content : []);
        this.factboxPrompts = config.factbox.prompts;
        this.paths = this.resolvePaths();
        this.language = 'the same language as the provided article';
        this.autoDetectLanguage = false;
    }

    setupLanguage() {
        if (this.autoDetectLanguage === true) {
            return 'the same language as the provided article';
        }

        let { language } = this;

        // Get site language
        this.languageCode = this.api.v1.config.get('contentLanguage');
        if (this.languageCode) {
            for (const contentLanguage of contentLanguages) {
                if (contentLanguage.code === this.languageCode) {
                    language = contentLanguage.name;
                }
            }
        }

        // Get seo language
        const seolanguageCode = this.rootModel.get('fields.seolanguage');
        if (seolanguageCode) {
            for (const contentLanguage of contentLanguages) {
                if (contentLanguage.code === seolanguageCode) {
                    language = contentLanguage.name;
                }
            }
        }
        return language;
    }

    resolvePaths() {
        const result = {};
        for (const group of this.groups) {
            for (const field of group.fields) {
                result[field.path] = {
                    group,
                    field
                };
            }
        }
        return result;
    }

    // (object) { group, field }
    getGroupObjectByPath(path) {
        return this.paths[path] || {};
    }

    // (Group)
    getGroupByName(name) {
        for (const group of this.groups) {
            if (group.name === name) {
                return group;
            }
        }
        return null;
    }

    // (Promise) Resolves a string with a value for specified path
    fetchByPath(path, { tone, style } = {}, aiSettings = {}) {
        return new Promise((resolve, reject) => {
            const { group, field } = this.getGroupObjectByPath(path);
            if (!group || !field) {
                reject(new Error(`Missing required group/field for path "${ path }".`));
                return;
            }
            this.fetchByGroup(group, [field], { tone, style }, aiSettings, true).then((values) => {
                resolve(values[path]);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    // (Promise) Resolves an object with paths and values
    fetchByName(name, { tone, style } = {}, aiSettings = {}) {
        return new Promise((resolve, reject) => {
            const group = this.getGroupByName(name);
            if (!group) {
                reject(new Error(`Missing required group by name "${ name }".`));
                return;
            }
            this.fetchByGroup(group, group.fields, { tone, style }, aiSettings, true).then((values) => {
                resolve(values);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    fetchByGroupName(name, aiSettings = { model: 'gpt-4-turbo' }, options = {}, retryFetch = false) {
        return new Promise((resolve, reject) => {
            const dataOptions = options;
            const group = this.getGroupByName(name);
            if (!group) {
                reject(new Error(`Missing required group by name "${ name }".`));
                return;
            }

            if (!group) {
                reject(new Error(`Missing required group`));
                return;
            }
            if (!dataOptions.language) {
                dataOptions.language = this.setupLanguage();
            }
            const prompt = `${ this.api.v1.util.dom.renderTemplate(group.prompt, dataOptions) }`;
            this.api.v1.generate.text({
                prompt, service: 'chatCompletions', model: aiSettings.model, paths: group.fields.map((field) => field.path)
            }).then((result) => {
                resolve(result);
            }).catch((error) => {
                console.log('[TextAssistant] Error fetching suggestions: ', error);
                if (retryFetch === true) {
                    console.log('[TextAssistant] Attempting to retry a new fetch');

                    this.fetchByGroupName(name, aiSettings, options, false);
                } else {
                    reject(error);
                }
            });
        });
    }

    fetchByGroup(group, fields, { tone, style } = {}, aiSettings = { model: 'gpt-4-turbo' }, retryFetch = false) {
        return new Promise((resolve, reject) => {
            const bodytext = this.getBodytext();
            if (!bodytext) {
                resolve({});
                return;
            }
            if (!group || !fields.length) {
                reject(new Error(`Missing required group/fields`));
                return;
            }
            if (!fields.filter((field) => field.active).length) {
                resolve({});
                return;
            }

            if (group.active === false) {
                resolve({});
                return;
            }
            const language = this.setupLanguage();

            const prompt = `${ this.api.v1.util.dom.renderTemplate(group.prompt, {
                style, tone, bodytext, language
            }) }`;

            // Example of upcoming usage of 'imageGenerations'
            /*
            this.api.v1.generate.image.imagesGenerations({
                provider: 'openAi', service: 'imagesGenerations', prompt, model: 'gpt-4-turbo', paths: fields.map((field) => field.path)
            }).then((result) => {
                const values = this.update(result, fields);
                resolve(values);
            }).catch((error) => {
                console.log('[TextAssistant] Error fetching suggestions: ', error);
                reject(error);
            });
            */

            this.api.v1.generate.text({
                prompt, service: 'chatCompletions', model: aiSettings.model, paths: fields.map((field) => field.path)
            }).then((result) => {
                const values = this.update(result, fields);
                resolve(values);
            }).catch((error) => {
                console.log('[TextAssistant] Error fetching suggestions: ', error);
                if (retryFetch === true) {
                    console.log('[TextAssistant] Attempting to retry a new fetch');

                    this.fetchByGroup(group, fields, { tone, style }, aiSettings, false);
                } else {
                    reject(error);
                }
                reject(error);
            });

        });
    }

    generateCaption(nodeModel, view, aiSettings = { model: 'gpt-4-turbo' }, retry = false) {

        let imageModel = nodeModel;
        if (nodeModel.getType() !== 'image') {
            imageModel = lab_api.v1.model.query.getChildOfType(nodeModel, 'image');
        }
        if (!imageModel) {
            Sys.logger.warn('Neither current model nor children of model has type "image". A generated caption cannot be stored.');
            return;
        }

        const bodytext = this.getBodytext();
        const url = imageModel.get('filtered.viewport_list.desktop.url') || imageModel.get('filtered.viewport_list.mobile.url') || '';
        const domainUrl = url.substring(0, url.indexOf('?') + 1);
        const imageUrl = `${ domainUrl }width=1000`;
        const imageCaption = imageModel.get('fields.imageCaption');
        const group = this.getGroupByName('image_caption');
        const language = this.setupLanguage();

        const elements = [...view.markup.querySelectorAll(`[data-lab-editable-path='fields.imageCaption']`)];
        for (const element of elements) {
            element.classList.add('lab-busy', 'lab-busy-top');
        }

        const promptString = `${ this.api.v1.util.dom.renderTemplate(group.prompt, {
            bodytext, imageCaption, language, imageUrl
        }) }`;

        // Prompt - Gpt-4-vision-documentation: https://platform.openai.com/docs/guides/vision?lang=curl
        const prompt = [
            {
                type: 'text',
                text: promptString
            },
            {
                type: 'image_url',
                image_url: {
                    url: imageUrl
                }
            }
        ];

        // Request image caption from openAi
        this.api.v1.generate.text({
            prompt, service: 'chatCompletions', model: aiSettings.model, paths: 'imageCaption', role: 'user'
        }).then((result) => {
            let generatedData = this.cleanUpJsonString(result);
            try {
                generatedData = JSON.parse(generatedData);
            } catch (error) {
                console.warn('Error parsing json-string: ', error);
                if (retry === true) {
                    console.log('Attempting to retry fetching');
                    this.generateCaption(nodeModel, view, aiSettings, false);
                }
            }

            // Update caption
            const originalCaption = imageModel.get('fields.imageCaption') || '';
            let newCaption = generatedData.caption;
            if (generatedData.keyword && generatedData.keyword.length > 0) {
                newCaption = `${ generatedData.keyword.toUpperCase().trim() }: ${ generatedData.caption.trim() }`;
            }
            if (newCaption) {
                imageModel.set('fields.imageCaption', newCaption);
            }

            // Update byline
            if (generatedData.byline && generatedData.byline.length > 0 && originalCaption.includes(generatedData.byline)) {
                const byline = imageModel.get('fields.byline');
                if (!byline || byline.length === 0) {
                    imageModel.set('fields.byline', generatedData.byline);
                }
            }
            // Remove class lab-busy
            for (const element of elements) {
                element.classList.remove('lab-busy', 'lab-busy-top');
            }
        }).catch((error) => {
            // Remove class lab-busy
            for (const element of elements) {
                element.classList.remove('lab-busy', 'lab-busy-top');
            }
            console.warn('[TextAssistant] Error fetching suggestions: ', error);
            if (retry === true) {
                console.log('Attempting to retry fetching');
                this.generateCaption(nodeModel, view, aiSettings, false);
            }
        });
    }

    // (Promise)
    uiFetchByGroup(group, fields) {
        return new Promise((resolve, reject) => {
            const tone = this.getUserSetting('writingTone');
            const style = this.getUserSetting('writingStyle');
            if (group.ui.refresh) {
                group.ui.refresh.classList.add('lab-disabled', 'lab-busy');
            }
            this.fetchByGroup(group, fields, { tone, style }).then((values) => {
                if (group.ui.refresh) {
                    group.ui.refresh.classList.remove('lab-disabled', 'lab-busy');
                }
                resolve(values);
            }).catch((error) => {
                if (group.ui.refresh) {
                    group.ui.refresh.classList.remove('lab-disabled', 'lab-busy');
                }
                console.log('error: ', error);
                reject(error);
            });
        });
    }

    // (Promise) Resolves an array of objects containing keys and values of suggestions
    uiFetchAll() {
        return new Promise((resolve, reject) => {
            const promises = this.groups.map((group) => this.uiFetchByGroup(group, group.fields));
            Promise.all(promises).then((results) => {
                resolve(results);
            }).catch((error) => {
                console.log('error: ', error);
                reject(error);
            });
        });
    }

    setupGroups(data) {
        return data.map((group) => new Group(group, this.getter));
    }

    setupUIForGroup(group) {
        for (const field of group.fields) {
            this.setupUIForField(field, group);
        }
        const ui = {
            container: this.api.v1.util.dom.renderTemplate(`<div class="lab-formgroup lab-grid-large-2 lab-grid-small-12 lab-align-right">
                <span data-group="${ group.name }" class="lab-btn lab-generate" title="Generate suggestion for ${ group.label }" style="margin-top:50px; position:relative;">Generate</span>
            </div>`, {}, true),
            refresh: null
        };
        ui.refresh = ui.container.querySelector('[data-group]');
        ui.refresh.addEventListener('click', (event) => {
            this.uiFetchByGroup(group, group.fields);
        });
        group.setKey('ui', ui);
    }

    setupUIForField(field, group) {
        const result = {
            nav: {}
        };
        const active = this.getUserSetting(`${ field.name }.active`) !== false;
        field.setKey('active', active);
        const size = 10 / group.fields.length;
        result.container = this.api.v1.util.dom.renderTemplate(`<div class="lab-formgroup lab-grid-large-${ size } lab-grid-small-12">
            <div class="lab-formgroup-item">
                <div class="lab-grid lab-valign-center" style="float:right; margin-top: -8px;">
                    <div class="lab-grid lab-valign-center">
                        <span class="nav-left lab-btn lab-text lab-xsmall labicon-arrow_left"></span> &nbsp;
                        <span class="nav-index-left">0</span> / <span class="nav-index-right">${ field.archive.length }</span> &nbsp;
                        <span class="nav-right lab-btn lab-text lab-xsmall labicon-arrow_right"></span>
                    </div>
                    <span class="insert-btn lab-btn lab-xsmall" title="Insert ${ field.label } on page">Insert</span>
                </div>
                <label for="completion-element-${ field.path }"><b>${ field.label }</b></label>
                <textarea name="${ field.path }" ${ !active ? 'disabled' : '' }>${ field.value }</textarea>
            </div>
        </div>`, {}, true);

        result.checkbox = this.api.v1.util.dom.renderTemplate(`<p class="lab-para"><label>${ field.label } <input type="checkbox" title="Use field ${ field.name }" name="${ field.path }-active" style="float:left;" ${ active ? 'checked="checked"' : '' }></label></p>`, {}, true);
        result.nav.left = result.container.querySelector('.nav-left');
        result.nav.labelLeft = result.container.querySelector('.nav-index-left');
        result.nav.right = result.container.querySelector('.nav-right');
        result.nav.labelRight = result.container.querySelector('.nav-index-right');
        const insertBtn = result.container.querySelector('.insert-btn');
        result.element = result.container.querySelector('textarea');
        result.checkbox.querySelector('input').addEventListener('change', (event) => {
            field.setKey('active', event.currentTarget.checked);
            if (event.currentTarget.checked) {
                result.element.removeAttribute('disabled');
            } else {
                result.element.setAttribute('disabled', 'disabled');
            }
            this.setUserSetting(`${ field.name }.active`, event.currentTarget.checked);
        });

        // Listeners
        result.element.addEventListener('change', (event) => {
            field.setValue(event.currentTarget.value.trim());
        });
        insertBtn.addEventListener('click', (event) => {
            this.useCurrent(false, [field], false);
        });
        result.nav.left.addEventListener('click', (event) => {
            field.navigate(-1);
        });
        result.nav.right.addEventListener('click', (event) => {
            field.navigate(1);
        });

        field.setKey('ui', result);
        field.setValue(field.value);
    }

    getUserSetting(path) {
        if (this.userSettings === null) {
            const pluginSettings = this.api.v1.user.getField('plugin') || {};
            this.userSettings = pluginSettings.textassistant || {};
        }
        return this.api.v1.util.object.get(path, this.userSettings, true);
    }

    setUserSetting(path, value) {
        this.api.v1.util.object.set(path, value, this.userSettings);
        const current = this.api.v1.user.getField('plugin') || {};
        current.textassistant = this.userSettings;
        this.api.v1.user.setField('plugin', { ...current });
    }

    // (Object)
    update(txt, fields) {
        if (txt) {
            try {
                // May return '{ ... }' or something like 'Json-object: { ... }'
                const jsonString = this.cleanUpJsonString(txt);

                const result = JSON.parse(jsonString);
                const pathResult = {};
                for (const field of fields) {
                    if (result[field.name]) {
                        const value = field.name === 'tags' ? [...result[field.name]] : (result[field.name] || '').trim();
                        field.setValue(value);
                        pathResult[field.path] = value;
                    }
                }
                return pathResult;
            } catch (error) {
                console.warn('Error parsing json-string: ', error);
            }
        }
        return {};
    }

    cleanUpJsonString(data) {
        let jsonString = data.trim();

        if (jsonString.includes('{') && jsonString.indexOf('{') > 0) {
            jsonString = jsonString.substring(jsonString.indexOf('{'));
        }

        if (!jsonString.includes('{')) {
            jsonString = `{${ jsonString }`;
        }

        if (!jsonString.includes('}')) {
            jsonString = `${ jsonString }}`;
        }

        // Test to choose the correct '}'. Ignore '}' with '\' ahead
        if (jsonString.match(/}/g).length > 1) {
            jsonString = jsonString.match(/(.|\n)*?(?<!\\)}/);
        }

        if (jsonString.includes('}') && jsonString.indexOf('}') < jsonString.length) {
            jsonString = jsonString.substring(0, jsonString.indexOf('}') + 1);
        }

        jsonString = jsonString.trim();
        return jsonString;
    }

    /**
     * @returns {string}
     */
    getBodytext() {
        return this.api.v1.util.string.stripTags(this.model.get('fields.bodytext') || '', ' ');
    }

    /**
     * @returns {boolean}
     */
    allowSuggestion() {
        return this.getBodytext().length > this.settings.minLength;
    }

    getFieldValue(field) {
        const value = this.model.get(field);
        if (!value) {
            return '';
        }
        if (typeof value === 'string') {
            return this.api.v1.util.string.stripTags(value);
        }
        return value;
    }

    hasFieldValue(field) {
        const value = this.model.get(field.path);
        if (!value) {
            return false;
        }
        if (field.name === 'tags') {
            return false;
        } // Ignore existing tags
        return true;
    }

    // (bool)
    hasPath(path) {
        for (const group of this.groups) {
            for (const field of group.fields) {
                if (field.path === path) {
                    return true;
                }
            }
        }
        return false;
    }

    useCurrent(checkCurrent, inputFields = [], closeModal = true) {
        const fields = inputFields || [];
        if (!fields.length) {
            for (const group of this.groups) {
                fields.push(...group.fields);
            }
        }
        for (const field of fields) {
            if (field.active && field.value) {
                if (!checkCurrent || (checkCurrent && !this.hasFieldValue(field))) {
                    if (field.name === 'tags') {
                        const tags = (Array.isArray(field.value) ? field.value : field.value.split(',')).map((tag) => tag.trim().toLowerCase());
                        const currentTags = this.model.get(field.path) || [];
                        const newTags = [...currentTags];
                        for (const tag of tags) {
                            if (!newTags.includes(tag)) {
                                newTags.push(tag);
                            }
                        }
                        this.model.set(field.path, newTags);
                    } else {
                        this.model.set(field.path, field.value);
                    }
                }
            }
        }
        if (closeModal && this.modal) {
            this.modal.close();
        }
    }

    listen() {
        // Only start auto-suggest for empty articles.
        if (this.model.get('fields.bodytext')) {
            return;
        }
        const listener = (model, path, value) => {
            if (value.length > this.settings.minLength) {
                this.api.v1.model.bindings.unbind(this.model, 'fields.bodytext', listener);
                this.menuItem = document.querySelector('#labrador-menu .text-completion');
                if (!this.getUserSetting('auto.enabled')) {
                    return;
                }
                this.uiFetchAll().then((results) => {
                    if (!this.modal) {
                        this.useCurrent(true);
                    }
                });
            }
        };
        this.api.v1.model.bindings.bind(this.model, 'fields.bodytext', listener);
    }

    onPaths() {
        return {
            'fields.seolanguage': {
                node: 'fields.seolanguage'
            }
        };
    }

    verifyaiSettingsExist(model) {
        if (!model.get('metadata.ai_settings_item_count')) {
            model.set('metadata.ai_settings_item_count', 2);
            model.set('metadata.ai_settings_word_count', 40);
            model.set('metadata.ai_settings_writing_style', '');
            model.set('metadata.ai_settings_writing_tone', '');
        }
    }

    /**
     * Allow a factbox or other element to generate a summary of current article using a menu-item
     * Will override text of 'path' and 'titlePath' it it already exist.
     *
     * @param model
     * @param view
     * @param menuItem
     * @param params
     * @param {{FACTBOX_TYPES}} summary_type
     */
    generate(model, view, menuItem, params, summary_type, aiSettings = { model: 'gpt-4-turbo' }) {
        this.verifyaiSettingsExist(model);
        const bodytext = this.getBodytext();
        const language = this.setupLanguage();
        const path = params.path || 'fields.bodytext';
        const titlePath = params.titlePath || 'fields.title';

        // TODO: allow configurable default factbox item count
        const itemCount = model.get('metadata.ai_settings_item_count');
        const wordCount = model.get('metadata.ai_settings_word_count');
        const writingStyle = model.get('metadata.ai_settings_writing_style');
        const writingTone = model.get('metadata.ai_settings_writing_tone');

        model.set(titlePath, '');
        model.set(path, '');
        model.set('metadata.ai_class', '');

        const viewContentElement = view.getMarkup().querySelector('.content');
        if (viewContentElement) {
            viewContentElement.classList.add('lab-busy', 'lab-busy-top');
        }

        const writingTonePrompt = (writingTone) ? `Writing Tone: ${ writingTone }.` : '';
        const writingStylePrompt = (writingStyle) ? `Writing Style: ${ writingStyle }.` : '';
        const prompt = this.api.v1.util.dom.renderTemplate(this.factboxPrompts[summary_type], {
            writingTonePrompt,
            writingStylePrompt,
            itemCount,
            wordCount,
            bodytext,
            language
        });

        this.api.v1.generate.text({
            prompt, service: 'chatCompletions', model: aiSettings.model, paths: [path]
        })
            .then((result) => {
                model.set('metadata.ai_class', `ai-factbox-${ summary_type }`);
                viewContentElement.classList.remove('lab-busy', 'lab-busy-top');
                try {
                    // May return '{ ... }' or something like 'Json-object: { ... }'
                    const jsonString = this.cleanUpJsonString(result);

                    const obj = JSON.parse(jsonString);
                    if (obj.title) {
                        model.set(titlePath, obj.title);
                    }
                    if (obj.items && Array.isArray(obj.items)) {
                        let text;
                        switch (summary_type) {
                            case FACTBOX_TYPES.SUMMARY:
                                text = `${ obj.items.map((item) => `<p>${ item }</p>`).join('\n') }`;
                                break;
                            case FACTBOX_TYPES.BULLETPOINTS:
                                text = `<ul>${ obj.items.map((item) => `<li>${ item }</li>`).join('\n') }</ul>`;
                                break;
                            default:
                        }
                        text += `<p class="italic ai-disclaimer" data-lab-italic="italic">${ lab_api.v1.locale.get('ai.factbox_disclaimer') }</p>`;
                        model.set(path, text);
                    }
                } catch (error) {
                    console.log('[TextAssistant] Error parsing json-string for summary: ', error);
                }
            })
            .catch((error) => {
                console.log('[TextAssistant] Error fetching summary: ', error);
                viewContentElement.classList.remove('lab-busy', 'lab-busy-top');
                const errorModal = this.api.v1.ui.modal.dialog({
                    container: {
                        state: {
                            error: true
                        }
                    },
                    content: {
                        title: 'Labrador AI error',
                        description: `An error occurred when trying to retrieve AI-generated text. Do you want to try again?`
                    },
                    eventHandlers: [{
                        selector: '#button-retry',
                        event: 'click',
                        callback: () => {
                            this.generate(model, view, menuItem, params, summary_type);
                            errorModal.close();
                        }
                    }, {
                        selector: '#button-close',
                        event: 'click',
                        callback: () => {
                            errorModal.close();
                        }
                    }],
                    footer: {
                        buttons: [
                            {
                                value: 'Cancel',
                                type: 'button',
                                id: 'button-close',
                                highlight: false
                            },
                            {
                                value: 'Retry',
                                type: 'button',
                                id: 'button-retry',
                                highlight: true
                            }
                        ]
                    }
                });
            });
    }

    getDisclaimer() {
        return `<p class="lab-info"><b>This function in Labrador CMS is using advanced artificial intelligence developed by OpenAI API.</b><br>
        Text from the article is not used to train or improve the public data models. 
        Use generated text from these functions as suggestions, and be sure to manually verify them. 
        Labrador CMS shall not be held liable for any use of the generated text. 
        For now the use of these functions are covered by your Labrador CMS license. We might change this in the future, when we know more about our operational costs.</p>`;
    }

    showAiSettings(model, view, menuItem, params) {
        this.verifyaiSettingsExist(model);

        const itemCount = model.get('metadata.ai_settings_item_count');
        const wordCount = model.get('metadata.ai_settings_word_count');
        const writingStyle = model.get('metadata.ai_settings_writing_style');
        const writingTone = model.get('metadata.ai_settings_writing_tone');

        const placeholders = [];
        const disclaimer = this.getDisclaimer();
        const markup = `
            <div class="lab-formgroup lab-grid-gap lab-grid-large-5 lab-grid-small-12">
                <label for="completion-writingTone">Text tone</label>
                <div class="completion-container-tone">completion-container-tone ...</div>
            </div>
            <div class="lab-formgroup lab-grid-gap lab-grid-large-5 lab-grid-small-12">
                <label for="completion-writingStyle">Text style</label>
                <div class="completion-container-style">completion-container-style ...</div>
            </div>
            <div class="lab-formgroup lab-grid-gap lab-grid-large-5 lab-grid-small-12">
                <label for="completion-word-count">Summary length</label>
                <div class="completion-word-count">completion-word-count ...</div>
            </div>
            <div class="lab-formgroup lab-grid-gap lab-grid-large-5 lab-grid-small-12">
                <label for="completion-number-of-items">Number of items</label>
                <input id="completion-number-of-items" type="number" min="1" max="15" step="1" value="${ itemCount }" style="max-width: 75px;">
            </div>
`;
        placeholders.push(this.getWritingStylePlaceholder(writingStyle, (event) => {
            model.set('metadata.ai_settings_writing_style', event.target.value);
        }));
        placeholders.push(this.getWritingTonePlaceholder(writingTone, (event) => {
            model.set('metadata.ai_settings_writing_tone', event.target.value);
        }));
        placeholders.push({
            element: this.api.v1.ui.element.getSelectElement({
                value: wordCount,
                options: [
                    { value: '20', label: 'Short' },
                    { value: '40', label: 'Medium' },
                    { value: '60', label: 'Long' }
                ],
                attributes: [{
                    name: 'id', value: 'completion-word-count'
                }],
                events: [{
                    name: 'change',
                    callback: (event) => {
                        model.set('metadata.ai_settings_word_count', event.target.value);
                    }
                }]
            }),
            selector: `.completion-word-count`
        });

        this.modal = this.api.v1.ui.modal.dialog({
            container: {
                css: 'baseview-textcompletion',
                width: 800
            },
            content: {
                header: 'Labrador AI - Content generation',
                markup: `<div class="lab-grid">${ markup }${ disclaimer }</div>`
            },
            placeholders,
            eventHandlers: [{
                selector: '#completion-number-of-items',
                event: 'change',
                callback: (modal, event) => {
                    model.set('metadata.ai_settings_item_count', event.target.value);
                }
            }, {
                selector: '#button-generate-bulletpoints',
                event: 'click',
                callback: () => {
                    this.generate(model, view, menuItem, params, 'bulletpoints');
                    this.modal.close();
                }
            }, {
                selector: '#button-generate-summary',
                event: 'click',
                callback: () => {
                    this.generate(model, view, menuItem, params, 'summary');
                    this.modal.close();
                }
            }],
            footer: {
                buttons: [
                    {
                        value: 'Generate bullet points',
                        type: 'button',
                        id: 'button-generate-bulletpoints',
                        class: 'lab-generate'
                    },
                    {
                        value: 'Generate summary',
                        type: 'button',
                        id: 'button-generate-summary',
                        class: 'lab-generate'

                    }
                ]
            }
        });
    }

    getWritingStylePlaceholder(selectedWritingStyle, callback_method) {
        let callback = callback_method;
        if (callback === undefined) {
            callback = (event) => {
                this.setUserSetting('writingStyle', event.target.value);
            };
        }

        return {
            element: this.api.v1.ui.element.getSelectElement({
                value: selectedWritingStyle || this.getUserSetting('writingStyle'),
                options: [{ value: '', label: 'Default style' }, ...this.writingStyles.map((item) => ({
                    value: item,
                    label: item
                }))],
                attributes: [{
                    name: 'id', value: 'completion-writingStyle'
                }],
                events: [{
                    name: 'change',
                    callback
                }]
            }),
            selector: `.completion-container-style`
        };
    }

    getWritingTonePlaceholder(selectedWritingTone, callback_method) {
        let callback = callback_method;
        if (callback === undefined) {
            callback = (event) => {
                this.setUserSetting('writingTone', event.target.value);
            };
        }
        return {
            element: this.api.v1.ui.element.getSelectElement({
                value: selectedWritingTone || this.getUserSetting('writingTone'),
                options: [{ value: '', label: 'Default tone' }, ...this.writingTones.map((item) => ({
                    value: item,
                    label: item
                }))],
                attributes: [{
                    name: 'id', value: 'completion-writingTone'
                }],
                events: [{
                    name: 'change',
                    callback
                }]
            }),
            selector: `.completion-container-tone`
        };
    }

    getLanguageName(languageCode, cleanUp = true) {
        let language = null;

        // Get name of langauge
        for (const lang of contentLanguages) {
            if (lang.code === languageCode) {
                language = lang.name;

            }
        }

        // Clean up language name
        if (language && cleanUp === true) {
            if (language.includes('-')) {
                language = language.substring(0, language.indexOf('-'));
            }
            if (/\(.*?\)/.test(language)) {
                language = language.replaceAll(/\(.*?\)/g, '');
            }
            language = language.trim();
        }
        language = language.trim();
        return language;
    }

    displayUI() {
        if (!this.state.cssLoaded) {
            this.api.v1.util.dom.addFile('css', '/view-resources/baseview/modules/plugins/textassistant/textassistant.css');
            this.state.cssLoaded = true;
        }

        if (!this.state.uiReady) {
            for (const group of this.groups) {
                if (group.showOnPanel === true) {
                    this.setupUIForGroup(group);
                }

            }
            this.state.uiReady = true;
            this.menuItem = document.querySelector('#labrador-menu .text-completion');
        } else {
            // Re-display
            for (const group of this.groups) {
                for (const field of group.fields) {
                    field.updateValue(this.getFieldValue(field.path));
                }
            }
        }

        this.menuItem.classList.remove('lab-selected');

        const asideItems = [];
        const placeholders = [];
        const markup = [`
            <div class="lab-formgroup lab-grid-large-5 lab-grid-small-12">
                <label for="completion-writingTone">Text tone</label>
                <div class="completion-container-tone">completion-container-tone ...</div>
            </div>`, `
            <div class="lab-formgroup lab-grid-large-5 lab-grid-small-12">
                <label for="completion-writingStyle">Text style</label>
                <div class="completion-container-style">completion-container-style ...</div>
            </div>
                
                `

        ];
        for (const group of this.groups) {
            if (group.showOnPanel === true) {
                for (const field of group.fields) {
                    asideItems.push({ placeholder: `completion-checkbox-${ field.name }` });
                    markup.push(`<div class="completion-container-${ field.name }"></div>`);
                    placeholders.push({ element: field.ui.container, selector: `.completion-container-${ field.name }` });
                    placeholders.push({ element: field.ui.checkbox, selector: `.completion-checkbox-${ field.name }` });
                }
                markup.push(`<div class="completion-group-${ group.name }">ccc</div>`);
                placeholders.push({ element: group.ui.container, selector: `.completion-group-${ group.name }` });
            }
        }
        const seolanguage = this.rootModel.get('fields.seolanguage');
        const defaultLanguage = lab_api.v1.config.get('contentLanguage');
        const selectedLanguage = seolanguage || defaultLanguage;

        placeholders.push(this.getWritingStylePlaceholder());
        placeholders.push(this.getWritingTonePlaceholder());

        const languages = contentLanguages.map((language) => ({ name: language.name, code: language.code, selected: language.code === selectedLanguage }));
        const languageName = this.getLanguageName(selectedLanguage);

        const asideMarkup = lab_api.v1.util.dom.renderTemplate(asideTemplate, {
            content: [{
                title: 'Text',
                items: asideItems,
                languages,
                languageName,
                fields: {
                    seolanguage: selectedLanguage

                }
            }]
        });

        const disclaimer = this.getDisclaimer();

        this.modal = this.api.v1.ui.modal.dialog({
            container: {
                css: 'baseview-textcompletion',
                width: 1400
            },
            aside: {
                expandable: true,
                position: 'left',
                header: 'Options',
                content: asideMarkup,
                noPadding: true,
                width: '250px'
            },
            content: {
                header: 'Labrador AI - Content generation',
                markup: `<div class="lab-grid">${ markup.join('') }${ disclaimer }</div>`
            },
            placeholders,
            eventHandlers: [{
                selector: '#button-suggest',
                event: 'click',
                callback: () => {
                    this.uiFetchAll();
                }
            }, {
                selector: '#button-insert',
                event: 'click',
                callback: () => {
                    this.useCurrent();
                }
            }],
            callbacks: {
                didDisplay: (modal) => {
                    // Setup for language selection
                    const btnLangAuto = modal.markup.querySelector('#auto-language');
                    const btnLangPage = modal.markup.querySelector('#page-language');
                    this.autoDetectLanguage = btnLangAuto.checked;

                    btnLangAuto.addEventListener('click', (event) => {
                        btnLangPage.checked = !btnLangAuto.checked;
                        this.autoDetectLanguage = btnLangAuto.checked;

                    });
                    btnLangPage.addEventListener('click', (event) => {
                        btnLangAuto.checked = !btnLangPage.checked;
                        this.autoDetectLanguage = btnLangAuto.checked;
                    });

                    const languageSpan = modal.markup.querySelector('#selectedLang');
                    const language = modal.markup.querySelector('#languages');
                    language.addEventListener('change', (event) => {
                        this.rootModel.set('fields.seolanguage', language.value);
                        languageSpan.textContent = this.getLanguageName(language.value);
                    });

                    // Setup for autosuggestion
                    const autoBtn = modal.markup.querySelector('#suggestion-auto-btn');
                    const autoActive = !!this.getUserSetting('auto.enabled');
                    if (autoActive) {
                        autoBtn.setAttribute('checked', 'checked');
                    }
                    autoBtn.addEventListener('change', (event) => {
                        this.setUserSetting('auto.enabled', autoBtn.checked);
                    });

                }
            },
            footer: {
                buttons: [
                    {
                        value: 'Generate suggestions',
                        type: 'button',
                        id: 'button-suggest',
                        class: 'lab-generate',
                        highlight: false
                    },
                    {
                        value: 'Insert all fields',
                        type: 'button',
                        id: 'button-insert',
                        highlight: true
                    }
                ]
            }
        });
    }

}
