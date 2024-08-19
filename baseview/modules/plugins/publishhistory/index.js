import properties from './properties.js';

export default {
    name: 'PublishHistory',
    description: 'Display time and user for each publish-action for current article teaser',
    version: '1.0.0',
    isEnabled: true,
    elements: {
        article: {
            properties
        }
    }
};
