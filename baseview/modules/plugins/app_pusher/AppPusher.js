export default class {

    constructor() {
        this.api = null;
        this.url = 'https://firebase.automagi.com/publish-story';
        this.onPublish = this.publish.bind(this);
        this.keyEvent = null;
    }

    onReady(api) {
        this.api = api;
        this.start();
    }

    onEnabled() {
        this.start();
    }

    onDisabled() {
        this.stop();
    }

    start() {
        if (this.api) {
            if (this.api.v1.config.get('plugins.appPusher.appName')) {
                this.keyEvent = this.api.v1.util.keyEventHandler.add({
                    key: 'i',
                    callback: this.onPublish,
                    controlkeys: ['labCtrlKey'],
                    overrideDisable: false
                });

                const shouldAutoPush = this.api.v1.config.get('plugins.appPusher.autoPush');
                if (shouldAutoPush === true) {
                    this.api.v1.app.on('published', this.onPublish);
                }
            } else {
                Sys.logger.warn('[AppPusher]: No app name is specified in config.');
            }
        }
    }

    stop() {
        if (this.api) {
            this.api.v1.app.off('published', this.onPublish);
            this.api.v1.util.keyEventHandler.remove(this.keyEvent);
        }
    }

    getPageData() {
        const root = this.api.v1.model.query.getRootModel();
        const site = this.api.v1.site.getSite();
        return {
            type: root.get('type'),
            id: root.get('id'),
            tags: root.get('tags'),
            section: root.get('primaryTags.section'),
            title: root.get('fields.title'),
            url: (this.api.v1.site.getSite().domain || this.api.v1.properties.get('customer_front_url')) + root.get('fields.published_url'),
            url_edit: `${ this.api.v1.properties.get('customer_cms_url') }/edit/${  root.get('type') }/id/${  root.get('id') }`,
            status: root.get('status'),
            visibility_status: root.get('fields.visibility_status'),
            publishhidden: root.get('fields.publishhidden'),
            site: {
                id: site.id,
                alias: site.alias
            }
        };
    }

    getUserData() {
        return {
            id: this.api.v1.user.getUserId(),
            name: this.api.v1.user.getUserName(),
            email: this.api.v1.user.getUserEmail()
        };
    }

    publish() {
        const pageData = this.getPageData();
        const userData = this.getUserData();

        const data = {
            app_name: this.api.v1.config.get('plugins.appPusher.appName'),
            email: userData.email,
            story_id: pageData.id,
            title: pageData.title
        };

        const body = new FormData();
        for (const key of Object.keys(data)) {
            body.append(key, data[key]);
        }

        if (pageData.visibility_status === 'P' && pageData.publishhidden !== '1') {
            Sys.logger.debug('[AppPusher]: Sending push message...');
            this.api.v1.util.httpClient.request(this.url, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                body
            }).then(() => {
                // Display success snackbar.
                Sys.logger.debug('[AppPusher]: Successfully sent push message.');
            }).catch(() => {
                // Display error snackbar.
                Sys.logger.error('[AppPusher]: Failed to send push message.');
            });
        } else {
            Sys.logger.warn('[AppPusher]: Page not published visibly, failed to send push message.');
            // Display warning snackbar.
        }
    }

}