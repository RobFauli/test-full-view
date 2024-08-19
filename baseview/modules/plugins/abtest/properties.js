export default {
    article: {
        properties: {
            contentMenus: {
                default: {
                    items: {
                        settings: {
                            items: {
                                abtests: {
                                    group: 's2',
                                    icon: 'labicon-ab_version',
                                    text: 'Edit A/B-test',
                                    callback: (menuItem, event) => {
                                        if (lab_api.v1.model.query.getRootModel().getType() === 'page_front') {
                                            // Front page
                                            import('./TestManagerFront.js').then((module) => {
                                                if (lab_api.v1.ns.get('abManager')) {
                                                    lab_api.v1.ns.get('abManager').end();
                                                }
                                                const manager = new module.TestManagerFront(lab_api, menuItem.getModel());
                                                manager.setup({ displayTestData: true });
                                                manager.displayVariant(0);
                                                lab_api.v1.ns.set('abManager', manager);
                                            }).catch((error) => {
                                                console.error('Error fetching TestManagerFront: ', error);
                                            });
                                        }
                                    },
                                    bindings: [
                                        {
                                            path: 'state.isNonPersistent',
                                            attribute: 'disabled',
                                            valueTransformer: 'toBoolean'
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
