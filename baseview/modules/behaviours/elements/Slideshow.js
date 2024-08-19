export default class Slideshow {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        // Set aspect ratio of images in the slideshow.
        // Prio: 1: data, 2: element-property, 3: config, 4: Hard-coded value
        const customAspectRatio = view.get('fields.aspectRatio') || view.getProperty('image.defaultAspectRatio') || this.api.v1.config.get('image.defaultAspectRatio') || 0.5;
        model.setFiltered('aspectRatio', customAspectRatio * 100);
    }

}
