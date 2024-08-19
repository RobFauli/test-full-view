import { Insertable } from './Insertable.js';
import { Placement } from './Placement.js';
import { ViewData } from './ViewData.js';

export class DynamicDataHelper {

    constructor(api) {
        this.api = api;
        this.page = this.api.v1.model.query.getRootModel();
        this.pageType = this.api.v1.model.root.getType().replace('page_', '');
        this.viewports = this.api.v1.viewport.getActive();
        this.isEditor = this.api.v1.app.mode.isEditor();
        this.cache = new Map();
    }

    /**
     * Inserts available data on a viewport.
     *
     * @param {string} viewport Name of the viewport you wish to insert data to.
     */
    insert(viewport, pathFilter = null) {
        const contentPath = `insertDynamic.${ this.pageType }.${ viewport }`;
        const placementsPath = `placements.${ this.pageType }.${ viewport }`;

        if (!this.cache.has(contentPath)) {
            const content = this.isEditor ? (this.api.v1.config.get(contentPath) || []).filter((item) => (!item.dynamicDataSettings || !item.dynamicDataSettings.hideInEditMode)) : this.api.v1.config.get(contentPath) || [];
            this.cache.set(contentPath, content.map((item) => item));
        }

        if (!this.cache.has(placementsPath)) {
            const placements = this.api.v1.config.get(placementsPath) || [];
            this.cache.set(placementsPath, placements.map((placement) => new Placement(placement)));
        }

        const insertables = this.parse(
            this.cache.get(contentPath),
            this.cache.get(placementsPath),
            viewport,
            pathFilter
        );

        for (const insertable of insertables) {
            if (insertable.selector) {
                this.api.v1.model.insert.bySelector({
                    selector: insertable.selector,
                    data: insertable.data,
                    options: insertable.options
                });
            } else if (insertable.path) {
                this.api.v1.model.insert.atPath({
                    path: insertable.path,
                    data: insertable.data,
                    options: insertable.options
                });
            }
        }
    }

    parse(content = [], placements = [], viewport = 'desktop', pathFilter = null) {
        const insertables = [];

        // Iterate through all ad-content
        for (const item of content) {
            const [placement] = placements.filter(({ key }) => key === item.placement.key);
            if (placement) {
                if (this.acceptPath(placement.path, pathFilter)) {
                    // Create the insertable by checking if the placement is allowed on the current viewport.
                    const insertable = this.create(item, placement, content, viewport);
                    if (insertable !== null) {
                        insertable.data.metadata.viewportBlacklist = this.viewports.filter((current) => current !== viewport);
                        insertables.unshift(insertable);
                    }
                } else {
                    Sys.logger.debug(`[DynamicDataHelper]: Path "${ placement.path }" not allowed. Filter: "${ pathFilter }", key: "${ item.placement.key }"`);
                }
            } else {
                Sys.logger.debug(`[DynamicDataHelper]: No placement found with key "${ item.placement.key }"`);
            }
        }

        return insertables;
    }

    create(item, placement, allItems, viewport = 'desktop') {
        if (this.filter(item)) {
            const data = this.assemble(item, placement);
            if (placement.path && placement.selector) {
                const placeholder = this.api.v1.model.query.getModelBySelector(placement.selector);
                if (!placeholder) {
                    this.api.v1.model.insert.atPath({
                        path: placement.path,
                        data: {
                            type: 'placeholder',
                            selector: placement.selector,
                            metadata: {
                                ...(placement.metadata || {}),
                                key: placement.key
                            },
                            state: {
                                isNonPersistent: true
                            }
                        },
                        options: {
                            index: 0,
                            useExisting: true,
                            prepend: true,
                            silent: true
                        }
                    });
                }
            }

            const options = {
                ...item.options,
                prepend: true,
                silent: true
            };
            let { path } = placement;
            let index = item.placement.index || 0;
            let model = null;
            if (placement.selector) {
                model = this.api.v1.model.query.getModelBySelector(placement.selector);
            } else if (placement.path) {
                // Get the non-ad models that should be rendered out.
                const models = this.getModelsByPath(placement.path, viewport);
                if (models.length) {
                    if (placement.options.useBodyTextIndex || placement.options.useBodyTextHeadingIndex || placement.options.lastBodyTextHeading) {
                        model = models.find((m) => m.getType() === 'bodytext');
                    } else {
                        // If the ad is to be inserted, get the model at the same index as the ad.
                        model = placement.options.shouldInsert ? models[0].children[index] : models[index];
                    }
                }
            }

            // If we don't have a model here, it's because there was none at the index of the ad.
            if (model || !placement.options.skipIfOutOfBounds) {
                if (model) {
                    index = this.api.v1.model.query.getIndex(model);

                    let parent = model.getParent();
                    // Mobile edge-cases.
                    if (viewport === 'mobile') {
                        if (index > 0 && index < parent.children.length) {
                            let current = parent.children[index];
                            while (current) {
                                const width = model.get('width', viewport, true);
                                if (width === undefined || width === 100) break;
                                current = parent.children[++index];
                            }
                        }

                        if (parent.get('metadata.hasRowTitle') && (index === 0 || index >= parent.children.length)) {
                            model = parent
                            parent = model.getParent()
                            index = this.api.v1.model.query.getIndex(model);
                            path = parent.getPositionedPath();
                        }
                    }

                    if (placement.options.useIndex) {
                        if (index < parent.children.length) {
                            // If the previous model is set to not render, we need to set the index to +1 so it will render after the next model.
                            if (parent.children[index - 1] && parent.children[index - 1].getNoRenderState()) {
                                // Check if the next ad content has the same index as current index + 1,
                                // That means they have ads two rows in a row, so we can discard the one that was
                                // supposed to be rendered after the row that is hidden
                                if (allItems[index + 1] && allItems[index + 1].placement.index === index + 1) {
                                    return null;
                                }

                                options.index = index + 1;
                            } else {
                                options.index = index;
                            }
                        }
                    }

                    if (!placement.options.shouldInsert) {
                        path = parent.getPositionedPath();
                    }
                } else {
                    options.prepend = false;
                }

                return new Insertable({
                    data,
                    options,
                    selector: placement.selector,
                    path
                });
            }
        }

        return null;
    }

    assemble(item, placement) {
        let data = new ViewData(item);

        if (!placement.selector) {
            data.metadata = {
                ...data.metadata,
                ...placement.metadata,
                css: placement.metadata.css ? `${ data.metadata.css } ${ placement.metadata.css }` : data.metadata.css || ''
            };
        }

        if (placement.options.wrap) {
            data = new ViewData({
                type: placement.options.wrap.type,
                metadata: placement.options.wrap.metadata,
                children: [data]
            });
        }

        if (placement.options.skipIfOutOfBounds) {
            data.metadata.skipIfOutOfBounds = true;
        }

        if (placement.options.useBodyTextIndex) {
            data.metadata.bodyTextIndex = item.placement.index || 0;
        } else if (placement.options.useBodyTextHeadingIndex) {
            data.metadata.bodyTextHeadingIndex = item.placement.index || 0;
        }

        if (placement.options.lastBodyTextHeading) {
            data.metadata.lastBodyTextHeading = true;
        }

        data.state.isNonPersistent = true;

        return data;
    }

    acceptPath(path, pathFilter) {
        if (!path || !pathFilter) {
            return true;
        }
        return path === pathFilter;
    }

    // Note (Birk):
    // This is not a very scalable solution, but will have to do for now.
    // In the future, I recommend we move this filter to each "item" which is to be received by the DynamicDataHelper instance.
    // This way the helper will stay independent, and not care about specific implementations.
    filter(item) {
        const shouldHideAds = this.page.get('fields.hideAds');
        if (item.type === 'googleAd' || item.type === 'adnuntiusAd') {
            return shouldHideAds !== '1' && shouldHideAds !== true;
        }
        return true;
    }

    // (Array) Get a list of models at supplied path. Validate that models are not hidden in viewport.
    getModelsByPath(path, viewport) {
        const key = `getByPath-${ path }`;
        if (!this.cache.has(key)) {
            this.cache.set(key, (this.api.v1.model.query.getModelsByPath(path) || []).filter((m) => !m.get('metadata.hideViewport', viewport) && !m.isNonPersistent()));
        }
        return this.cache.get(key);
    }

}
