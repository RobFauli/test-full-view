/**
 * Use-cases:
 * - Vise et gui for alle felt, få forslag for alt
 * - Finne forslag for alt i bakgrunnen, oppdatere knapp i Labrador-menyen som viser at nå har vi noe
 * - Forslag for ett felt i artikkel-settings
 * - Forslag for ett felt via tekst-verktøy
 */

import { FACTBOX_TYPES, Manager } from './Manager.js';

export default {
    name: 'TextAssistant',
    description: 'Labrador assistive AI tools',
    version: '1.2.0',
    predicate: (api) => api.v1.model.root.getType() === 'page_article' && api.v1.config.get('plugins.textassistant.enable'),
    entry: class {

        onReady(api) {
            this.api = api;
            this.manager = new Manager(api, this.api.v1.model.query.getRootModel(), this.api.v1.config.get('plugins.textassistant'));

            this.api.v1.ns.set('textAssistant', {
                generateCaption: (model, view, item, params) => {
                    // console.log(model, view, item, params);
                    this.manager.generateCaption(model, view, { model: 'gpt-4-turbo' }, true);
                },

                fetchByGroupName: (name, aiSettings, options) => this.manager.fetchByGroupName(name, aiSettings, options, true),

                // await lab_api.v1.ns.get('textAssistant.fetchByPath')('fields.title', { tone: 'Sarcastic' })
                fetchByPath: (path, options, aiSettings) => this.manager.fetchByPath(path, options, aiSettings),

                // await lab_api.v1.ns.get('textAssistant.fetchByPath')('fields.title', { tone: 'Sarcastic' })
                fetchByName: (path, options) => this.manager.fetchByName(path, options),

                // (void) Set up a listener for the bodytext. Create suggestions automatically
                listen: () => {
                    this.manager.listen();
                },

                // (bool) Check if suggestions can be made
                allow: () => this.manager.allowSuggestion(),

                summary: (model, view, menuItem, params) => {
                    this.manager.generate(model, view, menuItem, params, FACTBOX_TYPES.SUMMARY, { model: 'gpt-4-turbo' });
                },

                bulletpoints: (model, view, menuItem, params) => {
                    this.manager.generate(model, view, menuItem, params, FACTBOX_TYPES.BULLETPOINTS, { model: 'gpt-4-turbo' });
                },

                // (void) Allow Labrador text-tools to insert suggestion for current element
                textToolSuggestion: (model, view, menuItem, params) => {
                    const { tool } = menuItem.getMenu();
                    if (tool) {
                        const { key } = tool.settings;
                        if (this.manager.hasPath(key)) {
                            tool.end();
                            let elements = [];
                            const toggle = (on) => {
                                for (const element of elements) {
                                    if (on) {
                                        element.classList.add('lab-busy', 'lab-busy-top');
                                    } else {
                                        element.classList.remove('lab-busy', 'lab-busy-top');
                                    }
                                }
                            };
                            setTimeout(() => {
                                elements = [...view.getMarkup().querySelectorAll(`[data-lab-editable-path='${ key }']`)];
                                toggle(true);
                            }, 100);
                            this.manager
                                .fetchByPath([key], true)
                                .then((result) => {
                                    if (result) {
                                        view.set(key, result);
                                    } else {
                                        console.log(`Error: Required path ${ key } did not return.`);
                                    }
                                    toggle(false);
                                })
                                .catch((error) => {
                                    console.log('error: ', error);
                                    toggle(false);
                                });
                        }
                    }
                },

                // (void) Display UI for all fields
                displayUI: () => {
                    this.manager.displayUI();
                },

                showAiSettings: (model, view, menuItem, params) => {
                    this.manager.showAiSettings(model, view, menuItem, params);
                }
            });
        }

    }
};
