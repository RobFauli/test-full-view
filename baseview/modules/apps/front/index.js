/* eslint-disable camelcase */

export class SettingsFront {

    constructor(api, params = {}) {
        this.api = api;
        this.dom = {
            sections: {},
            selected: null
        };
        this.nodeSetterPaths = new Map();
        this.rootModel = this.api.v1.model.query.getRootModel();
        this.frontSettings = this.api.v1.pages.front.getByNodeId(this.rootModel.getId());
        this.resources = {};

        if (!this.validatePage()) {
            Sys.logger.warn('[SettingsFront] Page-type not validated. Will only run on front-pages.');
            return;
        }

        const additions = this.api.v1.config.get('customMenuData.SettingsFront.additions') || [];
        const removals = this.api.v1.config.get('customMenuData.SettingsFront.removals') || [];
        const customElements = this.api.v1.config.get('customMenuData.SettingsFront.items');
        const apps = [
            'GeneralSettings',
            'GeneralPage',
            'Colors',
            'SeoSettings',
            'AutomationSettings',
            'AdvancedViewports',
            'ConfigOverride',
            'FrontSaveAs',
            'ExportMailmojo'
        ].concat(additions).filter((app) => !removals.includes(app));
        this.apps = {};

        if (customElements && Array.isArray(customElements.formgroups)) {
            apps.push('CustomElements');
        }

        this.getResources(apps, params).then((resources) => {
            this.draw(resources, customElements);
        }).catch((error) => {
            Sys.logger.warn('[SettingsFront] Error loading resources:');
            console.log(error);
        });

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
                header: 'Frontpage Settings',
                markup: `<div>${ appsData.map((app) => `<div data-placeholder="${ app.placeholder.name }"></div>`).join('') }</div>`
            },
            aside: {
                position: 'left',
                expandable: true,
                header: 'Options',
                content: this.getAsideMarkup(appsData),
                noPadding: true,
                width: 210
            },
            callbacks: {
                didDisplay: () => {
                    if (this.dom.selected) { return; }
                    this.setupEvents(modal.getMarkup());
                    if (input.resources.params.source) {
                        this.dom.selected = appsData[0].name;
                        this.displaySource(input.resources.params.source);
                    } else {
                        this.displaySource(appsData[0].name);
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
                Sys.logger.warn(`[SettingsFront] Missing required "aside.section" or "aside.label" for app "${ appData.name }"`);
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
                Sys.logger.warn(`[SettingsFront] No markup returned by app "${ name }".`);
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

    async getResources(appsList, params) {
        const templates = await this.api.v1.util.httpClient.get('/ajax/template/get-aliases?nodeType=front');
        const resources = {
            templates,
            params,
            meta: this.api.v1.pages.front.getData(),
            rootModel: this.rootModel
        };
        return {
            resources,
            apps: await this.importApps(appsList, resources)
        };
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
                Sys.logger.debug(`[SettingsFront] Adding app "${ name }"`);
                resolved[name] = instance;
            } else {
                Sys.logger.debug(`[SettingsFront] Skipping disabled app "${ name }"`);
            }
        });
        return resolved;
    }

    // Only run on front-pages
    validatePage() {
        if (this.rootModel.getType() === 'page_front') {
            return true;
        }
        return false;
    }

    registerItem(source, dom) {
        dom.nav.addEventListener('click', (event) => {
            this.displaySource(source);
        }, false);
        if (dom.selected) {
            this.displaySource(source);
        }
    }

    savePath(path, value) {
        this.rootModel.set(path, value);
    }

    saveMeta(path, value) {
        const data = {};
        data[path] = value;
        this.api.v1.pages.front.update(data);
    }

    displaySource(source) {
        if (this.dom.selected === source) { return; }
        if (!this.dom.sections[source]) {
            Sys.logger.warn(`[SettingsFront] Missing source "${ source }".`);
            return;
        }
        if (this.dom.selected) {
            this.dom.sections[this.dom.selected].nav.classList.remove('lab-selected');
            this.dom.sections[this.dom.selected].element.classList.add('lab-hidden');
            this.dom.selected = null;
        }
        if (!this.dom.sections[source].element) {
            Sys.logger.warn(`[SettingsFront] Missing dom-element for source "${ source }".`);
            return;
        }
        this.dom.sections[source].nav.classList.add('lab-selected');
        this.dom.sections[source].element.classList.remove('lab-hidden');
        this.dom.selected = source;

        if (this.apps[source].onDisplayed) {
            this.apps[source].onDisplayed(this.dom.sections[source].element);
        }

    }

}
