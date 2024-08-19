/**
 * Slack Notifier plugin for Labrador CMS
 */

import properties from './properties.js';
import { Notifier } from './Notifier.js';
import config from './config.js';

export default {
    name: 'Slack Notifier',
    description: 'Send a message to a Slack when a page is published or send a message manually.',
    version: '1.0.0',
    isEnabled: true,
    elements: {
        row: {
            // Add properties for rows adding a button for manually sending a message to Slack
            properties
        }
    },
    entry: class {

        onReady(api) {

            if (!config.slack_webhook_url) {
                console.warn('Slack webhook URL is not defined, no message will be sent.');
                api.v1.plugins.disable('slack_notifier');
                return;
            }

            this.api = api;

            // Add the CSS file for the Slack Notifier plugin
            this.api.v1.util.dom.addFile('css', '/view-resources/custom-starter-view/modules/plugins/slack_notifier/slack_notifier.css');

            // Listen to publish-events from Labrador and post a message to Slack
            this.api.v1.app.on('published', (params) => {
                Notifier.notify(`Page ${ params.id } is published\nFront: ${ params.url }\nEditor: ${ lab_api.v1.properties.get('customer_cms_url') }/edit/${ params.type }/id/${ params.id }`);
            });
        }

    }

};
