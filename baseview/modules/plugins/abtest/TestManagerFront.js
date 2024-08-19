import { TestManagerBase } from './TestManagerBase.js';
import { AbTest } from './AbTest.js';

export class TestManagerFront extends TestManagerBase {

    setupUI() {
        super.setupUI();
        this.displayCurrent();
    }

    /**
     * Get the original model to create variants from
     * @returns {LabModel}
     */
    getOriginalModel() {
        return this.model;
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
        el.setAttribute('title', 'This article has an active AB-test');
        el.addEventListener('click', () => {
            this.setup({ displayTestData: true });
            this.displayVariant(0);
            this.api.v1.ns.set('abManager', this);
        });

        this.checkRunningAbTestState(model, el);

        return el;
    }

}
