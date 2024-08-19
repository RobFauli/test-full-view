export const Namespace = {

    // Create a globally available object for use by the view in the editor
    expose: () => {
        // Generate a citation article from a copy of text and source
        lab_api.v1.ns.set('contextualmenu.callbacks.generateTopicSummary', (model, view, menuItem, params) => {
            lab_api.v1.apps.start('TopicSummary', model, view);
        });

        // Generate a citation article from a copy of text and source
        lab_api.v1.ns.set('contextualmenu.callbacks.generateCitationArticle', (model, view, menuItem, params) => {
            lab_api.v1.apps.start('ArticleCitation', menuItem);
        });

        // Edit caption, byline and alt-text for original image. Useful for menu-items related to caption-editing of image-crops.
        lab_api.v1.ns.set('contextualmenu.callbacks.editOriginalImageCaption', (model, view, menuItem, params) => {
            if (menuItem && menuItem.tool) {
                menuItem.tool.end();
            }
            lab_api.v1.apps.start('CaptionEditor', { id: model.get('instance_of') });
        });

        // For text-editors: Display a list of articles.
        // Let user click an article to insert an a-tag at selection.
        lab_api.v1.ns.set('contextualmenu.callbacks.insertArticleLink', (model, view, menuItem, params) => {

            // Clicking on some element that did not capture the event inside the menu will trigger
            // the blur-event of the bodytext. Disable and enable again in the callback.
            menuItem.menu.tool.disableEndEvent();

            if (!params.menu || !params.menu.name) {
                Sys.logger.warning('insertArticleLink: Missing required param "params.menu.name".');
                return;
            }
            lab_api.v1.collection.display({
                name: params.menu.name,
                modal: true,
                options: {
                    click: (uiInterface, targetModel, element, event) => {
                        let url = targetModel.get('fields.published_url');
                        if (url) {
                            if (!url.startsWith('http')) {
                                const site = lab_api.v1.site.getSiteById(targetModel.get('fields.site_id'));
                                if (site) {
                                    url = site.domain + url;
                                }
                            }

                            // If text is selected: Use this for the link, if not: insert article title
                            const selectedText = menuItem.menu.tool.domHelper.getSelectionHtml().trim();
                            const title = targetModel.get('fields.title');
                            if (selectedText) {
                                menuItem.menu.tool.domHelper.removeSelectedContent();
                            }
                            menuItem.menu.tool.insertMarkup(` <a href="${ url }">${ selectedText || title }</a> `);
                        }
                        lab_api.v1.collection.toggle({ name: uiInterface.getName(), modal: true });
                    },
                    end: (uiInterface) => {
                        if (menuItem.menu.tool.element) {
                            menuItem.menu.tool.element.focus();
                        }
                        menuItem.menu.tool.enableEndEvent();
                    }
                }
            });
        });

        // For text-editors. Let user create a quote-box from selection
        lab_api.v1.ns.set('contextualmenu.callbacks.insertQuote', (model, view, menuItem, params) => {

            // Get selected text. Will expand to contents of dom-element.
            const element = menuItem.menu.tool.domHelper.getEditableElementFromSelection(true, undefined, '.lab-bodytext-line');
            if (!element) { return; }
            const text = element.innerText;
            if (!text) { return; }

            // Get view-helper for bodytext
            const viewHelper = lab_api.v1.view.getHelper('bodytext', view.getViewport());

            // Get bodytext-element
            const selector = viewHelper.getLineClassSelector();
            const bodytextElement = lab_api.v1.util.dom.getParentByClass(element, menuItem.tool.getElement(), selector);
            if (!bodytextElement) { return; }

            // Get index for bodytext-element
            const getIndex = (elmnts, target, classSelector) => {
                let index = 0;
                for (const el of elmnts) {
                    if (el.classList.contains(classSelector)) {
                        if (el === target) {
                            return index;
                        }
                        index++;
                    }
                }
                return null;
            };
            const index = getIndex(menuItem.tool.getElement().children, bodytextElement, selector);
            if (index === null) { return; }

            // Create element and insert
            const quoteModel = lab_api.v1.model.create.view({
                type: 'quotebox',
                contentdata: {
                    fields: {
                        quote: text
                    }
                },
                metadata: {
                    float: {
                        desktop: 'floatRight'
                    },
                    bodyTextIndex: index
                },
                width: 33.33
            });
            lab_api.v1.model.addChild(model, quoteModel, index);
            menuItem.menu.tool.end();
        });

        lab_api.v1.ns.set('contextualmenu.callbacks.displayKicker', (model, view, menuItem, params) => {
            if (view.get('metadata.kickerBelowImage') || view.get('metadata.floatingKicker')) {
                view.set('metadata.showKicker', true);
            }
        });

        lab_api.v1.ns.set('contextualmenu.callbacks.rowFullwidth', (model, view, menuItem, params) => {
            if (menuItem.getConfig('key') === 'metadata.fullWidthContent') {
                view.set('metadata.isSection', false);
            } else {
                view.set('metadata.fullWidthContent', false);
            }
            if (view.get('metadata.fullWidthContent') || view.get('metadata.isSection')) {
                view.set('metadata.fullWidthRow', true);
            } else {
                view.set('metadata.fullWidthRow', false);
            }
        });

        // Set as "callback" for an invisible menu-item on article-boxes.
        // Toggle metadata to display kicker, title and subtitle floating above the image.
        lab_api.v1.ns.set('contextualmenu.callbacks.toggleTextOnImage', (model, view, menuItem, params) => {
            const attributes = ['metadata.floatingTitle', 'metadata.floatingSubtitle', 'metadata.floatingKicker'];
            let hasAttribute = false;
            attributes.forEach((attr) => {
                if (view.get(attr)) hasAttribute = true;
            });
            attributes.forEach((attr) => {
                view.set(attr, !hasAttribute);
            });
        });

        // Set as "valueTransformer" in bindings for menu-items. Use "valueTransformerOptions" to specify key/value pairs to validate on.
        lab_api.v1.ns.set('contextualmenu.valueTransformer.keyVal', (value, keyValuePairs, model, view) => {
            if (!keyValuePairs) {
                Sys.logger.debug('[keyVal] Missing required param "keyValuePairs" (object)');
                return false;
            }
            for (const key of Object.keys(keyValuePairs)) {
                if (view.get(key) !== keyValuePairs[key]) {
                    return false;
                }
            }
            return true;
        });

        // Add click-handler for elements inside bodytext to prevent editor from starting.
        // This will happen when clicking somewhere inside the element but outside an editable dom-element.
        // Method can be added to property 'redrawCallbacks' of elements inside bodytext
        lab_api.v1.ns.set('eventhandlers.stopPropagation', (model, view) => {
            view.getMarkup().addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
            }, false);
        });

        // Add image to child.
        // If params.addImageChildType is defined, add image to first child of type
        lab_api.v1.ns.set('contextualmenu.callbacks.addImage', (model, view, menuItem, params) => {
            lab_api.v1.collection.display({
                name: 'MediaImages',
                modal: true,
                skipCache: true,
                options: {
                    clickHandler: (mediaModel, element) => {
                        if (!params.addImageChildType) {
                            lab_api.v1.model.replaceChildren(model, [mediaModel]);
                            return;
                        }
                        const child = lab_api.v1.model.query.getChildrenOfType(model, params.addImageChildType);
                        if (child.length) {
                            lab_api.v1.model.replaceChildren(child[0], [mediaModel]);
                        }
                    }
                }
            });
        });

        // Remove first child on path
        lab_api.v1.ns.set('contextualmenu.callbacks.removeChildByPath', (model, view, menuItem, params) => {
            if (!params.removeChildPath) {
                Sys.logger.warning('removeChildByPath: Missing required param "params.removeChildPath".');
                return;
            }
            const childModel = lab_api.v1.model.query.getModelByPath(params.removeChildPath, true, false, [model]);
            if (childModel) {
                lab_api.v1.model.delete(childModel);
            }
        });

        // Toggle element holding background image / video / other media element
        lab_api.v1.ns.set('contextualmenu.callbacks.toggleMediaContainer', (model) => {
            let mediaContainer = lab_api.v1.model.query.getChildOfType(model, 'mediaContainer');
            if (mediaContainer) {
                lab_api.v1.model.delete(mediaContainer);
                return;
            }
            mediaContainer = lab_api.v1.model.create.view({
                type: 'mediaContainer'
            });
            lab_api.v1.model.addChild(model, mediaContainer);
        });
        lab_api.v1.ns.set('contextualmenu.callbacks.toggleEditMediaContainer', (model) => {
            const state = !model.get('state.editMediaContainer');
            model.set('state.editMediaContainer', state);
            for (const view of lab_api.v1.view.getViews(model)) {
                if (state) {
                    view.getMarkup().classList.add('edit-media-container');
                } else {
                    view.getMarkup().classList.remove('edit-media-container');
                }
            }
            if (state) {
                const fn = () => {
                    lab_api.v1.ns.get('contextualmenu.callbacks.toggleEditMediaContainer')(model);
                    lab_api.v1.tool.off('ended', fn);
                };
                lab_api.v1.tool.on('ended', fn);
            }
        });

        // Display images from article of the button
        lab_api.v1.ns.set('contextualmenu.callbacks.displayArticleImages', (model, view) => {
            lab_api.v1.collection.display({
                name: 'MediaImages', modal: false, skipCache: true, options: { articleId: model.get('instance_of') }
            });
        });

        // Automatically create suggestions for new articles
        if (lab_api.v1.model.root.getType() === 'page_article') {
            lab_api.v1.view.on('ready', () => {
                const listener = lab_api.v1.ns.get('textAssistant.listen');
                if (listener) {
                    listener();
                }
            });
        }

        // Display an app for displaying and inserting a previous version of a field
        lab_api.v1.ns.set('contextualmenu.callbacks.openFieldVersions', (model, view, menuItem, params) => {
            lab_api.v1.apps.start('FieldVersion', {
                model,
                field: 'bodytext',
                selector: '.main > .bodytext',
                callbacks: {
                    end: (app) => {
                        model.set('state.openBaseviewFieldVersions', false);
                    }
                }
            });
        });

        // Trigger app for setting custom background color from image
        // menuItem.getModel(), menuItem.getView(), menuItem, menuItem.config.params
        lab_api.v1.ns.set('contextualmenu.callbacks.getImageColors', (model, view, menuItem, menuParams, callback) => {
            const image = lab_api.v1.model.query.getChildOfType(model, 'image');
            if (!image) {
                return;
            }
            const imageView = lab_api.v1.view.getView(image, view.getViewport());
            const domImage = imageView.getMarkup().querySelector('img');
            if (!domImage) {
                return;
            }
            lab_api.v1.apps.start('ImageColors', {
                image: domImage,
                targetModel: lab_api.v1.model.query.getRootModel(),
                path: 'fields.pageBackgroundColorStyle',
                pathDark: 'fields.pageBackgroundColorStyleDark',
                resetPath: 'fields.pageBackgroundColor',
                callback
            });
        });

    }
};
