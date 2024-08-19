import properties from './properties.js';
import { PublishUpdater } from './PublishUpdater.js';
import { TestManagerArticle } from './TestManagerArticle.js';
import { TestManagerFront } from './TestManagerFront.js';
import { AbTest } from './AbTest.js';

export default {
    name: 'AB Test',
    description: 'Handle variants of article teasers',
    version: '1.0.1',
    predicate: (api) => api.v1.config.get('plugins.abtest.enable'),
    entry: class {

        onReady(api) {
            this.api = api;
            this.needs_rerender = [];
            const rootModel = api.v1.model.query.getRootModel();
            // For articles: Add a button to the drawer. When clicked: Start TestManagerArticle.
            if (rootModel.getType() === 'page_article') {
                let currentManager = null;
                const navContainer = document.querySelector('.lab-collection-drawer ul');
                const btn = document.createElement('li');
                btn.setAttribute('data-collection', 'no-collection');
                btn.innerHTML = `
                    <div class="lab-lbl"><span class="labicon-ab_version" style="margin-top: -2px; display: block;"></span></div>
                    <div class="lab-desc">AB-Test</div>
                `;
                btn.addEventListener('click', (event) => {
                    if (currentManager) {
                        currentManager.hideCurrent();
                        currentManager.end();
                        return;
                    }
                    const manager = new TestManagerArticle(api, rootModel, () => {
                        currentManager = null;
                    });
                    manager.setup();
                    manager.displayVariant(0);
                    currentManager = manager;
                });
                navContainer.appendChild(btn);
            } else {
                let publishUpdater;
                api.v1.view.on('ready', async() => {
                    this.checkFrontRunningAbTests(api);
                });
                api.v1.app.on('published', (params) => {
                    for (const model of this.needs_rerender) {
                        const instanceOfId = model.get('instance_of') || model.get('id');
                        Sys.logger.debug(`[AbTest] Updating width for model variants: ${ instanceOfId }`);
                        const manager = new TestManagerFront(api, model);
                        manager.getCollection(instanceOfId)
                            .then((collection) => {
                                for (const variant of collection.getVariants()) {
                                    variant.data.width = model.getRaw('width');
                                }
                                this.api.v1.abtest.collection.save(collection).then((resp) => {
                                    this.api.v1.abtest.collection.publish(collection);
                                });
                                this.checkFrontRunningAbTests(api);
                            }).catch((error) => {});
                    }
                });
                api.v1.app.on('willPublish', () => {
                    if (!publishUpdater) {
                        publishUpdater = new PublishUpdater(api, api.v1.model.query.getRootModel());
                    }
                    publishUpdater.willPublish();
                });
            }
        }

        /**
         * @param model
         * @param {HTMLElement} el
         * @return {Promise<unknown>}
         */
        checkRunningAbTestState(model, el) {
            return new Promise((resolve, reject) => {
                const manager = new TestManagerFront(this.api, model);
                manager.getCollection(manager.instanceOfId)
                    .then((collection) => this.api.v1.abtest.test.get(collection.test_id))
                    .then((test_data) => {
                        const test = new AbTest();
                        test.updateTestData(test_data.result);
                        if (test.isRunning()) {
                            el.classList.add('is_active');
                            el.setAttribute('title', 'This article is currently running an AB-test');
                        } else if (test.isFinished()) {
                            el.classList.add('is_completed');
                            el.setAttribute('title', 'The AB-test for this article is completed');
                        }

                        resolve();
                    })
                    .catch(reject);
            });
        }

        getCustomIcon(model, view) {
            const el = document.createElement('span');
            el.classList.add('labicon-ab_version', 'ab_test_running_indicator', 'indicator-top-right');
            el.setAttribute('title', 'This article has an associated AB-test');
            el.addEventListener('click', () => {
                if (this.api.v1.ns.get('abManager')) {
                    this.api.v1.ns.get('abManager').end();
                }
                const manager = new TestManagerFront(this.api, model);
                manager.setup({ displayTestData: true });
                manager.displayVariant(0);
                this.api.v1.ns.set('abManager', manager);
            });

            this.checkRunningAbTestState(model, el);

            return el;
        }

        getCollectionIds(ids) {
            return new Promise((resolve, reject) => {
                fetch(`/api/v1/ab_collection?content=full&query=(${ ids.map((id) => `referenceId:${ id }`).join(' OR ') })`)
                    .then((response) => response.json())
                    .then((json) => {
                        const only_test_results = json.result.filter((result) => typeof result.ab_collection.field.test_id === 'string');
                        const ab_article_ids = only_test_results.map((result) => parseInt(result.ab_collection.field.referenceId, 10));
                        resolve(ab_article_ids);
                    })
                    .catch(reject);
            });
        }

        async checkFrontRunningAbTests(api) {
            try {
                const model = api.v1.model.query.getRootModel();
                const models = api.v1.model.query.getModelsByType('article', [model]).filter((m) => !m.isNonPersistent() && (m.get('instance_of') || m.get('id')));
                const collection_ids = await this.getCollectionIds(models.map((m) => m.get('instance_of') || m.get('id')));
                Sys.logger.debug('[AbTest] Checking for running tests');
                for (const child of models) {
                    const instance_id = child.get('instance_of') || child.get('id');
                    // const collection_ids = child.get('fields.abtestCollectionIds_json');
                    if (collection_ids.includes(instance_id)) {
                        Sys.logger.debug(`[AbTest] Found running test for instance_id: ${ instance_id }`);
                        if (!this.needs_rerender.includes(child)) {
                            this.needs_rerender.push(child);
                            Sys.logger.debug(`[AbTest] Adding ${ instance_id } to re-render list`);
                        }
                        for (const viewport of api.v1.viewport.getActive()) {
                            const view = api.v1.view.getView(child, viewport);
                            if (!view.getExtraElement('abElement')) {
                                const el = view.setExtraElement('abElement', this.getCustomIcon(child, view));
                                Sys.logger.debug('ADDING BINDINGS');
                                this.api.v1.model.bindings.bind(child, 'width', (model, path, value) => {
                                });
                                view.getMarkup().appendChild(el);
                            }
                        }
                    }
                }
            } catch (error) {
                Sys.logger.debug(`[AbTest] Error checking running tests: ${ error.message }`);
            }
        }

    },
    elements: properties
};
