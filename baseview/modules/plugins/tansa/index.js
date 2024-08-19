export default {
    name: 'Tansa',
    description: 'Proofreading from Tansa',
    version: '1.0.1',
    predicate: (api) => api.v1.model.root.getType() === 'page_article' && api.v1.config.get('tansa.active'),
    entry: class {

        onReady(api) {
            api.v1.util.dom.addFile('css', '/view-resources/baseview/modules/plugins/tansa/tansa-main.css');

            // Add Tansa-attribute to iframe:
            document.querySelector('iframe[data-lab-viewport="desktop"]').setAttribute('tansa-proofing', 'true');

            let tansaInstance = null;

            const btn = api.v1.util.dom.renderTemplate('<li class="lab-item lab-btn labicon-tansa" title="Tansa"></li>', {}, true);
            document.querySelector('#labrador-menu ul li.lab-menulist ul').appendChild(btn);
            btn.addEventListener('click', (event) => {
                const config = lab_api.v1.config.get('tansa');
                if (!config.licenseKey || !config.baseUrl) {
                    Sys.logger.warn('[Tansa] Required config "licenseKey" or "baseUrl" missing. Tansa will not run.');
                    lab_api.v1.ui.modal.dialog({
                        container: { state: { warning: true } },
                        content: {
                            title: 'Tansa not configured',
                            description: 'Required config "licenseKey" or "baseUrl" missing. Tansa will not run.<br>Set up Tansa in the <a href="/settings/cp?page=tansa" target="_blank">admin-page</a>.'
                        },
                        footer: {
                            buttons: [
                                {
                                    type: 'submit',
                                    value: 'OK',
                                    highlight: true
                                }
                            ]
                        }
                    });
                    return;
                }

                const elements = api.v1.util.defaults.object(config.elements, {
                    kicker: true, title: true, subtitle: true, bodytext: true
                });
                const targets = [];
                if (elements.kicker) {
                    targets.push({
                        model: api.v1.model.query.getModelByType('articleHeader'),
                        selector: '.kicker',
                        value: '',
                        path: 'fields.kicker'
                    });
                }
                if (elements.title) {
                    targets.push({
                        model: api.v1.model.query.getModelByType('articleHeader'),
                        selector: '.headline',
                        value: '',
                        path: 'fields.title'
                    });
                }
                if (elements.subtitle) {
                    targets.push({
                        model: api.v1.model.query.getModelByType('articleHeader'),
                        selector: '.subtitle',
                        value: '',
                        path: 'fields.subtitle'
                    });
                }
                if (elements.bodytext) {
                    targets.push({
                        model: api.v1.model.query.getModelByType('bodytext'),
                        selector: null,
                        value: '',
                        path: 'fields.bodyetxt'
                    });
                }

                const addedConfig = {
                    ...config,
                    clientExtenstionJs: 'tansa4ClientExtensionSimple.js',
                    userId: lab_api.v1.user.getUserEmail(),
                    parentAppId: 'ed527f00-6109-11ed-b10c-5974977ab271',
                    parentAppVersion: '',
                    requireProofingAttribute: 'true'
                };

                if (tansaInstance) {
                    const rect = btn.getBoundingClientRect();
                    tansaInstance.load(targets, addedConfig, rect);
                    return;
                }

                import('./tansa.js').then((module) => {
                    const rect = btn.getBoundingClientRect();
                    tansaInstance = module.tansa;
                    module.tansa.load(targets, addedConfig, rect);
                }).catch((error) => {
                    Sys.logger.warn(`Error loading Tansa-functionality: ${ error }`);
                });
            }, false);
        }

    }
};
