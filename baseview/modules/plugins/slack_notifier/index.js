/**
 * Slack Notifier plugin for Labrador CMS
 * ©️ Labrador CMS AS
 */

import { Notifier } from './Notifier.js';

export default {
    name: 'Slack Notifier',
    description: 'Send a message to a Slack when a page is published',
    version: '1.0.0',
    predicate: (api) => api.v1.config.get('plugins.slack_notifier.enable'),
    entry: class {

        onReady(api) {
            this.api = api;
            this.notifier = new Notifier(api, api.v1.config.get('plugins.slack_notifier.options'));
        }

    }

};
