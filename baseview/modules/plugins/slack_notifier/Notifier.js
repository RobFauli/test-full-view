/**
 * Notifier.js
 * Send a message via a Slack webhook
 * Input is an array of objects defining cases where a notification is to be sendt
 * [{
 *     page_type: (string) - The type of page to notify about (all, front, article, notice)
 *     event: (string) - The event to notify about (currently only publish (default))
 *     type: (string) - The type of notification (all (default), tags, section, hostpath)
 *     value: (array) - The value to match against (e.g. ['news'])
 *     webhook: (string) - The Slack webhook URL
 * }]
 */

export class Notifier {

    constructor(api, options) {
        this.api = api;
        this.defaults = {
            type: ['all', 'tags', 'section', 'hostpath'],
            page_type: ['all', 'front', 'article', 'notice'],
            event: ['publish', 'error']
        };
        this.events = {
            publish: this.setupEvent('publish', options),
            error: this.setupEvent('error', options)
        };
        this.listen();
    }

    listen() {
        if (this.events.publish.length) {
            this.api.v1.app.on('published', (params) => {
                this.notifyPublish(params);
            });
        }
        if (this.events.error.length) {
            this.api.v1.app.on('error', (error) => {
                try { this.notifyError(error, true); } catch { /* empty */ }
            });
            this.api.v1.app.on('viewError', (error) => {
                try { this.notifyError(error, false); } catch { /* empty */ }
            });
        }
    }

    notifyPublish(params) {
        const model = this.api.v1.model.query.getModelById(params.id);
        for (const item of this.events.publish) {
            if (this.validateEvent(model, item, params)) {
                const published = params.published ? new Date(params.published * 1000).toLocaleString() : '';
                let modified = params.modified ? new Date(params.modified * 1000).toLocaleString() : '';
                if (!modified && published) {
                    modified = published;
                }
                this.notify({
                    notifyType: 'publish',
                    title: params.type === 'front' ? model.get('fields.name') : model.get('fields.title'),
                    url_front: params.url,
                    url_editor: `${ this.api.v1.properties.get('customer_cms_url') }/edit/${ params.type }/id/${ params.id }`,
                    url_cms: this.api.v1.properties.get('customer_cms_url'),
                    id: params.id,
                    type: params.type,
                    hidden: !!params.hidden,
                    modified,
                    published,
                    published_ahead: params.published_ahead,
                    user: this.api.v1.user.getUserName()
                }, item.webhook);
            }
        }
    }

    notifyError(error, isCmsError) {
        const model = this.api.v1.model.query.getRootModel();
        for (const item of this.events.error) {
            if (this.validateEvent(model, item, item)) {
                this.notify({
                    notifyType: 'error',
                    type: 'all',
                    isCmsError,
                    isViewError: !isCmsError,
                    url_editor: `${ this.api.v1.properties.get('customer_cms_url') }/edit/${ model.get('type').replace('page_', '') }/id/${ model.getId() }`,
                    url_cms: this.api.v1.properties.get('customer_cms_url'),
                    url_monitor: `${ this.api.v1.properties.get('customer_cms_url') }/support/monitor/`,
                    user: this.api.v1.user.getUserName(),
                    message: error.toString(),
                    stackTrace: error.stack
                }, item.webhook);
            }
        }
    }

    validateEvent(model, item, params) {
        if (!model || (params.type !== item.page_type && item.page_type !== 'all')) {
            return false;
        }
        if (item.type === 'all') {
            return true;
        }
        return this.validateValue(model, item.type, item.value);
    }

    validateValue(model, type, value) {
        switch (type) {
            case 'tags':
                return this.validateTags(model, value);
            case 'section':
                return this.validateSection(model, value);
            case 'hostpath':
                return this.validateHostPath(model, value);
            default:
                return false;
        }
    }

    validateTags(model, value) {
        const tags = model.get('tags');
        for (const tag of tags) {
            if (value.includes(tag)) {
                return true;
            }
        }
        return false;
    }

    validateSection(model, value) {
        return value.includes(model.get('primaryTags.section'));
    }

    validateHostPath(model, value) {
        return value.includes(model.get('fields.hostpath'));
    }

    setupEvent(event, options) {
        const result = [];
        if (!Array.isArray(options)) {
            return result;
        }
        for (const item of options) {
            if (item.event === event) {
                const validated = this.validateItem(item);
                if (validated) {
                    result.push(validated);
                }
            }
        }
        return result;
    }

    validateItem(item) {
        if (!item.webhook || !item.page_type) {
            return null;
        }
        if (!this.defaults.page_type.includes(item.page_type)) {
            console.warn(`[Slack Notifier] Invalid page type "${ item.page_type }". Item will not be used. Options: `, this.defaults.page_type);
            return null;
        }
        if (!this.defaults.event.includes(item.event)) {
            console.warn(`[Slack Notifier] Invalid event "${ item.event }". Item will not be used. Options: `, this.defaults.event);
            return null;
        }
        return {
            page_type: item.page_type,
            event: item.event,
            type: this.defaults.type.includes(item.type) ? item.type : 'all',
            value: Array.isArray(item.value) ? item.value : [],
            webhook: item.webhook
        };
    }

    /**
     * Send a message to a Slack webhook
     * @param {object} data - Data available to template
     * @param {string} url - The Slack webhook URL
     * @returns {Promise|null} - A promise that resolves when the message is sent
     */
    notify(data, url) {
        const key = `slack_notifier.${ data.notifyType }.${ data.type }`;
        let content = this.api.v1.locale.get(key, { data });
        if (content === key) {
            if (data.notifyType === 'publish') {
                content = `*Page ${ data.id } is published*\nType: ${ data.type }\nPublish date: ${ data.published }\nUser: ${ data.user }\nFront url: ${ data.url_front }\nEditor url: ${ data.url_editor }`;
            } else if (data.notifyType === 'error') {
                content = `*${ data.isCmsError ? 'CMS error' : 'View error' }*\nMessage: ${ data.message }\nStack trace: ${ data.stackTrace }\nUser: ${ data.user }\nEditor url: ${ data.url_editor }`;
            } else {
                console.warn('No content for notify:', data);
                return null;
            }
        }

        const payload = {
            blocks: [{
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: content
                }
            }, {
                type: 'divider'
            }, {
                type: 'context',
                elements: [
                    {
                        type: 'image',
                        image_url: 'https://www.labradorcms.com/view-resources/baseview/public/common/icons/labrador_logo.png',
                        alt_text: 'Labrador CMS logo'
                    },
                    {
                        type: 'mrkdwn',
                        text: 'Powered by <https://labradorcms.com|Labrador CMS>'
                    }
                ]
            }]
        };

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: 'POST',
                body: JSON.stringify(payload)
            }).then((res) => {
                if (!res.ok) {
                    throw new Error(`Server error ${ res.status }`);
                }
                resolve(res.text());
            }).catch((error) => {
                reject(error);
            });
        });
    }

}
