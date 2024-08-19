import { LayoutHelper } from '../../lib/helpers/LayoutHelper.js';

export default class ArticleHeader {

    constructor(api) {
        this.api = api;
    }

    onInserted(model) {
        if (model.get('metadata.hidecaption')) {
            model.set('fields.displayCaption', false, { save: false });
            model.set('metadata.hidecaption', null, { save: false });
        }
    }

    onRender(model, view) {
        const layout = LayoutHelper.textElements(view, this.api.v1.app.mode.isEditor());
        model.setFiltered('layout', layout);
        model.setFiltered('hasFloatingText', layout.floating.length > 0);
        if (this.api.v1.app.mode.isFront()) {
            // Lab 3 could store styled kicker with text-content of the placeholder.
            // <span class="font-weight-bold" data-lab-font_weight_desktop="font-weight-bold">Click to add kicker</span>
            const kicker = model.get('fields.kicker');
            model.setFiltered('hideKicker', !kicker || kicker.includes('Click to add kicker'));
        }
    }

    async onChildAdded(model, childModel) {
        // Use image for front crop if:
        // - Child is an image
        // - Front-crop do not exist
        if (childModel.getType() !== 'image') {
            return;
        }
        this.api.v1.article.frontcrop.get().then((cropData) => {
            if (cropData) { return; }
            const instanceOfId = childModel.get('instance_of');
            if (instanceOfId) {
                this.setFrontCrop(instanceOfId);
            } else {
                // If image is being downloaded, wait for it to finish and then set the front crop.
                this.api.v1.model.bindings.bind(childModel, 'instance_of', (image, path, value) => {
                    this.setFrontCrop(value);
                });
            }
        }).catch((err) => {
            Sys.logger.warn(`[ArticleHeader] Failed to get front-crop: "${ err.toString() }"`);
        });
    }

    setFrontCrop(instanceOfId) {
        const data = {
            type: 'image',
            contentdata: {
                instance_of: instanceOfId,
                fields: {
                    croph: 100,
                    cropw: 100,
                    x: 0,
                    y: 0
                }
            }
        };
        this.api.v1.article.frontcrop.set({ pano: data, height: data }).then(() => {
            Sys.logger.debug('[ArticleHeader] Front-crop successfully set.');
        }).catch((err) => {
            Sys.logger.warn(`[ArticleHeader] Failed to set front-crop: "${ err.toString() }"`);
        });
    }

}
