import Front from './Front.js';
import { Namespace } from './lib/editor/Namespace.js';
import { StyleHelper } from './lib/helpers/StyleHelper.js';
import { ResourceHelper } from './lib/helpers/ResourceHelper.js';
import { EsiHelper } from './lib/helpers/dynamic/EsiHelper.js';
import { DynamicDataHelper } from './lib/helpers/dynamic/DynamicDataHelper.js';

export default class extends Front {

    onReady(api) {
        super.onReady(api);
        Namespace.expose();
        this.loadSiteStyles();
        this.imageUploadProcessor = null;
        this.registerImageUploads();
        this.dynamicData = null;
        this.wpm = this.api.v1.config.get('displayReadTime.wpm') || 250;
    }

    onAcceptContent() {
        this.addDefaultByline();

        const esiHelper = new EsiHelper(this.api);
        esiHelper.register(this.api.v1.model.query.getRootModel(), this.api.v1.site.getSite().alias);

        // Check if custom spacing is supported on this page
        const rootModel = this.api.v1.model.query.getRootModel();
        this.useSpacing = !!rootModel.get('fields.style_spacing');
        this.api.v1.model.bindings.bind(rootModel, 'fields.style_spacing', (model, path, value) => {
            this.useSpacing = !!value;
        });

        if (this.api.v1.model.getPageType() === 'article') {
            const bodytextModel = this.api.v1.model.query.getModelByType('bodytext');
            if (bodytextModel) {
                this.dynamicData = new DynamicDataHelper(this.api);
                this.updateBodytextAds(bodytextModel);
                this.api.v1.model.bindings.bind(this.api.v1.model.query.getRootModel(), 'fields.bodytext', (model) => {
                    if (this.api.v1.model.canRedraw(bodytextModel)) {
                        this.updateBodytextAds(bodytextModel);
                    }
                    this.updateReadTime(bodytextModel);
                });
            }
        }
    }

    updateBodytextAds(model) {
        // Remove non-persistent elements from model
        const children = [...model.getChildren()];
        for (const child of children) {
            if (child.isNonPersistent()) {
                this.api.v1.model.delete(child, true, true);
            }
        }
        // Insert ads
        for (const view of this.api.v1.view.getViews(model)) {
            this.dynamicData.insert(view.getViewport(), 'bodytext[0]');
        }
    }

    updateReadTime(model) {
        const bodytext = this.api.v1.bodytext.getText(model);
        const readTime = this.api.v1.text.getReadTime(bodytext, this.wpm);
        model.set('fields.readTime', readTime);
    }

    loadSiteStyles() {
        const siteAlias = this.api.v1.properties.get('site.alias');
        const siteStylesheetList = ResourceHelper.getSiteStylesWithFallback(siteAlias);

        if (siteStylesheetList.length) {
            siteStylesheetList.forEach((path) => {
                this.api.v1.util.dom.addFile('css', path);
            });
        }

        // Add inline css to main window:
        const cssBuild = StyleHelper.getInlineCSS(this.api);
        cssBuild.forEach((style) => {
            const styleEl = window.parent.document.createElement('style');
            styleEl.type = 'text/css';
            styleEl.appendChild(document.createTextNode(style.value));
            Sys.logger.debug(`ViewSupport: Insert inline css in main window for key: ${ style.key }`);
            window.parent.document.head.appendChild(styleEl);
        });
    }

    registerImageUploads() {
        const skipInfoPanel = this.api.v1.config.get('image.skipImageInfoAfterUpload');
        // Documentation: /support/docs/#js-api/v1/image/on.md
        this.api.v1.image.on('imagesUploaded', (items) => {
            if (!items.length) { return; }
            if (!skipInfoPanel) {
                if (!this.imageUploadProcessor) {
                    import('./lib/editor/ImageUploadProcessor.js')
                        .then((module) => {
                            this.imageUploadProcessor = new module.ImageUploadProcessor(this.api);
                            this.imageUploadProcessor.imagesUploaded(items);
                            this.api.v1.file.hideImageUpload();
                        }).catch((error) => {
                            Sys.logger.warn(error);
                        });
                    return;
                }
                this.imageUploadProcessor.imagesUploaded(items);
                this.api.v1.file.hideImageUpload();
            }
        });
    }

    addDefaultByline() {
        const rootModel = this.api.v1.model.query.getRootModel();

        // Only apply to article-pages:
        if (rootModel.getType() !== 'page_article') { return; }

        // Check if this is a prototype:
        if (rootModel.get('fields.subtype') === 'prototype') { return; }

        // Check if a byline already exist:
        if (this.api.v1.model.query.getModelByType('byline')) { return; }

        // Check if a default byline is set on user:
        const defaultBylineId = this.api.v1.user.getField('defaultByline');
        if (!defaultBylineId) { return; }

        // Only add byline if article is created by current user:
        if (this.api.v1.user.getUserId().toString() !== rootModel.get('fields.created_by')) { return; }

        // Only add byline if article is new:
        const maxAge = 60; // One minute
        if ((parseInt(rootModel.get('fields.created'), 10)) + maxAge < (new Date().getTime() / 1000)) { return; }

        this.api.v1.util.httpClient.get(`/ajax/node/get-node?id=${ defaultBylineId }`).then((resp) => {
            if (!resp.data) {
                console.log(`[addDefaultByline] No byline found for id ${ defaultBylineId }.`);
                return;
            }
            const children = [];
            if (resp.data.children && resp.data.children.length) {
                children.push({
                    type: 'image',
                    contentdata: {
                        type: 'image',
                        instance_of: resp.data.children[0].instance_of,
                        fields: resp.data.children[0].fields
                    }
                });
            }
            Sys.logger.debug(`Will insert user-byline`);
            this.api.v1.model.insert.atPath({
                path: 'page_article/articleHeader/articleMeta',
                data: {
                    type: 'byline',
                    contentdata: {
                        type: 'byline',
                        instance_of: resp.data.id,
                        fields: resp.data.fields
                    },
                    children
                }
            });

        }).catch((error) => {
            console.log('[addDefaultByline] Failed to fetch and insert default byline for user: ', error);
        });

    }

}
