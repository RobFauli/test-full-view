import callback from './callback.js';

export default {
    contentMenus: {
        default: {
            items: {
                settings: {
                    items: {
                        originalArticle: {
                            text: 'Original article',
                            icon: 'labicon-article',
                            displayCondition: 'hasParentOfTypes',
                            params: {
                                modelTypes: ['row', 'bodytext']
                            },
                            items: {
                                publishhistory: {
                                    icon: 'labicon-time',
                                    title: 'Display Publish History',
                                    text: 'Publish History',
                                    callback,
                                    bindings: [
                                        {
                                            path: 'instance_of',
                                            attribute: 'disabled',
                                            valueTransformer: 'isNumeric',
                                            valueTransformerOptions: {
                                                negateBoolean: true
                                            }
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
