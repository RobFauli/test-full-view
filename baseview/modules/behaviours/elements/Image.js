import { LazyloadHelper } from '../../lib/helpers/LazyloadHelper.js';

export default class Image {

    // Common instance for all image-elements on page
    constructor(api) {
        this.api = api;
        this.lazyloadHelper = new LazyloadHelper(api);
        if (this.api.v1.app.mode.isEditor()) {
            this.cropIds = [];
            this.rootModel = this.api.v1.model.query.getRootModel();
            this.frontcropBinding = this.frontCropChanged.bind(this);
            this.api.v1.model.bindings.bind(this.rootModel, 'frontCrop', this.frontcropBinding);
            this.frontcropBinding(this.rootModel, 'frontCrop', this.rootModel.get('frontCrop'));

            // Preview image-filters:
            this.api.v1.ns.set('imageFilter.preview', this.prepareVisualFilters);
        }
        this.isFragmentMode = this.api.v1.app.mode.isFragmentMode();
    }

    // View-helper is about to run, it may use filtered data.
    // Method-order: 1) onViewHelper, 2) ViewHelper, 3) onRender
    onViewHelper(model, view) {
        if (model.parent) {
            this.prepareForSlideshow(model, view);
            const viewport = view.getViewport();
            const parentView = this.api.v1.view.getView(model.parent, viewport);
            if (parentView.get('metadata.hasFullWidth')) {
                const width = viewport === 'mobile' ? 600 : 1800;
                model.setFiltered(`width.${ viewport }`, width);
            } else {
                model.setFiltered(`width.${ viewport }`, null);
            }
            model.setFiltered('allowFullwidth', model.parent.getType() !== 'image');
        }
    }

    // (void) Element is about to be rendered.
    // All data and parent/child-relationships are ready.
    onRender(model, view) {
        this.setVisualFilters(model, view);
        model.setFiltered('lazyloadImages', this.lazyloadHelper.check(model, view));
        this.setCaptionOptions(model.getParent(), model, view);

        // Aligned images must set a pixel width in the template. Check if image is aligned
        // Note: In Lab3 the key 'floatNone' is used to unset alignment.
        const float = view.get('fields.float');
        model.setFiltered('hasFloat', !!float && float !== 'floatNone');
    }

    // (void) Element has been rendered
    onRendered(model, view) {

        if (!this.api.v1.app.mode.isEditor() || !this.cropIds.length) {
            return;
        }
        const id = parseInt(model.get('instance_of'), 10);
        if (!this.cropIds.includes(id)) {
            return;
        }
        this.markFrontCrop(view, id);
    }

    setVisualFilters(model, view) {
        model.setFiltered('filters', this.prepareVisualFilters(model, view));
    }

    prepareVisualFilters(model, view, returnObject = false) {
        const filters = [];
        const blur = model.get('metadata.filter_blur_active') ? model.get('metadata.filter_blur_value') || 0 : null;
        const sepia = model.get('metadata.filter_sepia_active') ? model.get('metadata.filter_sepia_value') || 0 : null;
        const saturate = model.get('metadata.filter_saturate_active') ? model.get('metadata.filter_saturate_value') || 1 : null;
        const brightness = model.get('metadata.filter_brightness_active') ? model.get('metadata.filter_brightness_value') || 1 : null;
        const contrast = model.get('metadata.filter_contrast_active') ? model.get('metadata.filter_contrast_value') || 1 : null;
        if (blur !== null) { filters.push(`blur(${ blur }px)`); }                    // blur(4px), 0 is no change
        if (sepia !== null) { filters.push(`sepia(${ sepia })`); }                   // sepia(0.8), 0 is no change
        if (saturate !== null) { filters.push(`saturate(${ saturate })`); }          // saturate(2), 1 is no change
        if (brightness !== null) { filters.push(`brightness(${ brightness })`); }    // brightness(3), 1 is no change
        if (contrast !== null) { filters.push(`contrast(${ contrast })`); }          // contrast(1.5), 1 is no change
        if (returnObject) {
            return {
                filter: filters.join(' ')
            };
        }
        return filters.length ? `filter: ${ filters.join(' ') };` : null;
    }

    // (void) Add a label to the markup of the image-element
    markFrontCrop(view, id) {
        const el = document.createElement('span');
        el.classList.add('labicon-imgFrontCrop', 'is-frontcrop');
        el.setAttribute('title', 'Image used as front crop. Click to edit');
        el.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.api.v1.apps.start('ArticleSettings');
        }, false);
        view.getMarkup().appendChild(el);
    }

    frontCropChanged(model, path, cropData) {
        // Remove frontcrop-label from images using the old crop-ids:
        let models = this.getImages(this.cropIds);
        this.cropIds = [];
        this.updateImages(models);

        if (!cropData) { return; }
        if (cropData.pano && cropData.pano.instance_of) {
            this.cropIds.push(cropData.pano.instance_of);
        }
        if (cropData.height && cropData.height.instance_of && !this.cropIds.includes(cropData.height.instance_of)) {
            this.cropIds.push(cropData.height.instance_of);
        }
        // Add frontcrop-label to images using the new crop-ids:
        models = this.getImages(this.cropIds);
        this.updateImages(models);
    }

    // (array) Get images using a front-crop
    getImages(ids) {
        const models = [];
        for (const id of ids) {
            models.push(...this.api.v1.model.query.getModelsByKeyAndValue('instance_of', id));
        }
        return models;
    }

    // (void) Trigger a redraw of models to remove/add the frontcrop-label
    updateImages(models) {
        for (const model of models) {
            this.api.v1.model.addToRedrawQueue(model);
        }
    }

    setCaptionOptions(parent, model, view) {
        const parentView = parent ? this.api.v1.view.getView(parent, view.getViewport()) : null;
        const hasPath = (parentModel, childModel, path) => {
            if (parentModel) {
                const value = parentModel.get(path);
                if (!value && value !== null) { // If parent has value false, 0 etc.: hide
                    return false;
                }
                if (value) { return true; }
            }
            return !!childModel.get(path);
        };
        let display = hasPath(parentView, view, 'fields.displayCaption');
        let displayDefault = display || (view.get('fields.displayCaption') === null && !view.get('metadata.hidecaption'));
        if (this.api.v1.app.mode.isFront() && (!model.get('fields.imageCaption') && !model.get('fields.byline'))) {
            display = false;
            displayDefault = false;
        }
        const expandable = hasPath(parentView, view, `fields.expandableCaption`);
        const truncate = hasPath(parentView, view, `fields.truncateCaption`);
        let title = model.get('fields.imageCaption');
        if (model.parent && (!view.getProperty('image.useCaptionForTitle') || !title)) {
            title = model.parent.get('fields.title') || '';
        }
        const captionOptions = {
            title,
            display,
            displayDefault,
            truncate,
            expandable: expandable || truncate
        };
        model.setFiltered('captionOptions', captionOptions);
    }

    prepareForSlideshow(model, view) {
        if (!model.parent || model.parent.getType() !== 'slideshow') {
            return;
        }
        if (view.get('fields.whRatio')) {
            model.setFiltered('whRatio', null);
            return;
        }

        const originalWidth = model.get('fields.originalWidth');
        const originalHeight = model.get('fields.originalHeight');
        if (originalHeight && originalWidth) {
            const whRatio = originalHeight / originalWidth;
            model.setFiltered('whRatio', whRatio);
        }
    }

}
