export class ArticleSettings {

    constructor(api, params = {}) {
        this.api = api;
        this.dom = {
            sections: {},
            selected: null
        };
        this.nodeSetterPaths = new Map();
        this.rootModel = this.api.v1.model.query.getRootModel();

        if (!this.validatePage()) {
            Sys.logger.warn('[ArticleSettings] Page-type not validated. Will only run on article-pages.');
            return;
        }

        const additions = this.api.v1.config.get('customMenuData.ArticleSettings.additions') || [];
        const removals = this.api.v1.config.get('customMenuData.ArticleSettings.removals') || [];
        const customElements = this.api.v1.config.get('customMenuData.ArticleSettings.items');
        const apps = [
            'ArticleGeneralTeaser',
            'SeoSettings',
            'ArticleDates',
            'ArticleStyling',
            'ArticleCommercialSettings',
            'ArticleNotes',
            'ArticleTranslate',
            'Colors',
            'ArticleAdvancedSettings',
            'ArticleSite',
            'ArticleApproval',
            'AdvancedViewports',
            'ConfigOverride',
            'RoxenExport',
            'AptomaExport'
        ].concat(additions).filter((app) => !removals.includes(app));
        this.apps = {};

        if (customElements && Array.isArray(customElements.formgroups)) {
            apps.push('CustomElements');
        }

        this.getResources(apps, params).then((resources) => {
            this.draw(resources, customElements);
        }).catch((error) => {
            Sys.logger.warn('[ArticleSettings] Error loading resources:');
            console.log(error);
        });
    }

    async getResources(appsList, params) {
        const templates = await this.api.v1.util.httpClient.get('/ajax/template/get-aliases?nodeType=front');
        const resources = {
            templates,
            params,
            setter: this.pathSetter.bind(this),
            rootModel: this.rootModel,
            helpers: {
                // Boolean node-data may be stored as number-strings. true -> "1", false -> "0"
                // Transform the string "0" to boolean false etc.
                toBoolean: (value) => {
                    if (!value || value === '0' || value === 'false') {
                        return false; // 0, '0', 'false', false, null, undefined, ...
                    }
                    return true;
                }
            }
        };
        return {
            resources,
            apps: await this.importApps(appsList, resources)
        };
    }

    pathSetter(key, value) {
        if (this.nodeSetterPaths.has(key)) {
            const pathInfo = this.nodeSetterPaths.get(key);
            let validatedValue = value;
            if (pathInfo.validator && this.api.v1.util.valueTransformer[pathInfo.validator]) {
                if (!this.api.v1.util.valueTransformer[pathInfo.validator](value, pathInfo.validatorParams)) {
                    return;
                }
            }
            if (typeof pathInfo.transformer === 'function') {
                validatedValue = pathInfo.transformer(value, pathInfo);
            }
            this.savePath(pathInfo.node, validatedValue, pathInfo.suggestReload);
        }
    }

    async importApps(apps, resources) {
        const promises = {};
        for (const app of apps) {
            promises[app] = this.api.v1.apps.start(app, resources);
        }
        const resolved = {};
        const modules = await Promise.all(Object.values(promises));
        modules.forEach((instance, index) => {
            const name = Object.keys(promises)[index];
            if (instance.enabled) {
                Sys.logger.debug(`[ArticleSettings] Adding app "${ name }"`);
                resolved[name] = instance;
            } else {
                Sys.logger.debug(`[ArticleSettings] Skipping disabled app "${ name }"`);
            }
        });
        return resolved;
    }

    // Only run on article-pages
    validatePage() {
        if (this.rootModel.getType() === 'page_article') {
            return true;
        }
        return false;
    }

    draw(input, customElements) {
        if (customElements && Array.isArray(customElements.formgroups) && input.apps.CustomElements) {
            input.apps.CustomElements.setElementsConfig(customElements);
        }
        const appsData = this.runApps(input.apps);
        const placeholders = appsData.map((app) => app.placeholder);
        const modal = this.api.v1.ui.modal.dialog({
            defaultButtons: false,
            container: {
                width: 800
            },
            content: {
                header: 'Article Settings',
                markup: `<div>${ appsData.map((app) => `<div data-placeholder="${ app.placeholder.name }"></div>`).join('') }</div>`
            },
            aside: {
                position: 'left',
                expandable: true,
                header: 'Options',
                content: this.getAsideMarkup(appsData),
                // template: 'apps/ArticleSettings/aside',
                noPadding: true,
                width: 210
            },
            callbacks: {
                didDisplay: () => {
                    // this.addCustomElements(modal.getMarkup());
                    // this.handleSaveAs(modal.getMarkup());
                    if (this.dom.selected) { return; }
                    this.setupEvents(modal.getMarkup());
                    if (input.resources.params.source) {
                        this.dom.selected = appsData[0].name;
                        this.displaySource(input.resources.params.source);
                    } else {
                        this.displaySource(appsData[0].name);
                    }
                },
                end: () => {
                    if (!this.dom.selected || !this.apps[this.dom.selected]) {
                        return;
                    }
                    if (this.apps[this.dom.selected].onHidden) {
                        this.apps[this.dom.selected].onHidden(this.dom.sections[this.dom.selected].element);
                    }
                }
            },
            placeholders
        });
    }

    getAsideMarkup(appsData) {
        const items = [];
        const sections = {};
        for (const appData of appsData) {
            if (appData.aside.section && appData.aside.label) {
                if (!sections[appData.aside.section]) {
                    sections[appData.aside.section] = { label: appData.aside.section, items: [] };
                }
                sections[appData.aside.section].items.push({
                    label: appData.aside.label,
                    target: appData.name
                });
            } else {
                Sys.logger.warn(`[ArticleSettings] Missing required "aside.section" or "aside.label" for app "${ appData.name }"`);
            }
        }
        for (const name of Object.keys(sections)) {
            items.push(`<div class="lab-aside-settings">
                <h4 class="lab-title">${ sections[name].label }</h4>
                ${ sections[name].items.map((item) => `<p class="lab-para lab-link" data-nav-target="${ item.target }">${ item.label }</p>`).join('') }
            </div>`);
        }
        return items.join('');
    }

    displaySource(source) {
        if (this.dom.selected === source) { return; }
        if (!this.dom.sections[source]) {
            Sys.logger.warn(`[ArticleSettings] Missing source "${ source }".`);
            return;
        }
        if (this.dom.selected) {
            this.dom.sections[this.dom.selected].nav.classList.remove('lab-selected');
            this.dom.sections[this.dom.selected].element.classList.add('lab-hidden');
            if (this.apps[this.dom.selected].onHidden) {
                this.apps[this.dom.selected].onHidden(this.dom.sections[this.dom.selected].element);
            }
            this.dom.selected = null;
        }
        if (!this.dom.sections[source].element) {
            Sys.logger.warn(`[ArticleSettings] Missing dom-element for source "${ source }".`);
            return;
        }
        this.dom.sections[source].nav.classList.add('lab-selected');
        this.dom.sections[source].element.classList.remove('lab-hidden');
        this.dom.selected = source;

        if (this.apps[source].onDisplayed) {
            this.apps[source].onDisplayed(this.dom.sections[source].element);
        }

    }

    setupEvents(markup) {
        for (const el of markup.querySelectorAll('.lab-aside-settings [data-nav-target]')) {
            const source = el.getAttribute('data-nav-target');
            if (source) {
                this.dom.sections[source] = {
                    selected: el.classList.contains('lab-selected'),
                    name: source,
                    nav: el,
                    element: markup.querySelector(`.lab-modal-content [data-source="${ source }"]`)
                };
                this.registerItem(source, this.dom.sections[source]);
            }
        }
    }

    registerItem(source, dom) {
        dom.nav.addEventListener('click', (event) => {
            this.displaySource(source);
        }, false);
        if (dom.selected) {
            this.displaySource(source);
        }
    }

    runApps(apps) {
        const result = [];
        for (const name of Object.keys(apps)) {
            const app = apps[name];
            const markup = app.onMarkup();
            if (markup) {
                this.apps[name] = app;
                markup.setAttribute('data-source', name);
                const aside = app.onAside() || {};
                if (aside.item) {
                    aside.identifier = name;
                }
                const paths = app.onPaths() || {};
                const item = {
                    placeholder: {
                        element: markup,
                        selector: `[data-placeholder="${ name }"]`,
                        name
                    },
                    paths,
                    aside,
                    name
                };
                this.registerAutoSave(markup, paths);
                result.push(item);
            } else {
                Sys.logger.warn(`[ArticleSettings] No markup returned by app "${ name }".`);
            }
        }
        return result;
    }

    registerAutoSave(markup, paths) {
        for (const path of Object.keys(paths)) {
            if (paths[path].node) {
                this.nodeSetterPaths.set(paths[path].node, paths[path]);
            }
            const els = markup.querySelectorAll(`[name="${ path }"]`);
            if (els.length) {
                for (const el of els) {
                    this.registerInputItem(el, paths[path]);
                }
            }
        }
    }

    registerInputItem(element, pathInfo) {
        element.addEventListener('change', (event) => {
            let value = pathInfo.boolean ? element.checked : element.value;
            if (pathInfo.validator && this.api.v1.util.valueTransformer[pathInfo.validator]) {
                if (!this.api.v1.util.valueTransformer[pathInfo.validator](value, pathInfo.validatorParams)) {
                    element.parentElement.classList.add('lab-validation-error');
                    return;
                }
                element.parentElement.classList.remove('lab-validation-error');
            }
            if (typeof pathInfo.transformer === 'function') {
                value = pathInfo.transformer(value, pathInfo);
            }
            if (pathInfo.callback && typeof pathInfo.callback === 'function') {
                pathInfo.callback(element, pathInfo);
            }
            if (pathInfo.node) {
                this.savePath(pathInfo.node, value, pathInfo.suggestReload);
            }
            if (pathInfo.meta) {
                this.saveMeta(pathInfo.meta, value);
            }
        }, false);
    }

    savePath(path, value, suggestReload) {
        const modified = this.rootModel.set(path, value);
        if (modified && suggestReload) {
            this.displayReloadOptions();
        }
    }

    saveMeta(path, value) {
        console.log('Todo: saveMeta: ', path, value);
        // const data = {};
        // data[path] = value;
        // this.api.v1.pages.front.update(data);
    }

    displayReloadOptions() {
        this.api.v1.ui.modal.dialog({
            content: {
                title: 'Page updated',
                description: 'Reload editor for changes to take effect'
            },
            footer: {
                buttons: [
                    {
                        value: 'Keep editing',
                        highlight: false,
                        id: 'keep-editing'
                    },
                    {
                        value: 'Reload',
                        type: 'submit',
                        highlight: true
                    }
                ]
            },
            eventHandlers: [{
                selector: '#keep-editing',
                event: 'click',
                callback: (modal, event) => {
                    modal.close();
                }
            }],
            callbacks: {
                submit: () => {
                    this.api.v1.ui.modal.close(true);
                    this.api.v1.app.reload();
                }
            }
        });
    }

}
