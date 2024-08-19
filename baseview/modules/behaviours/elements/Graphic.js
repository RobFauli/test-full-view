import { LazyloadHelper } from '../../lib/helpers/LazyloadHelper.js';

export default class Image {

    // Common instance for all image-elements on page
    constructor(api) {
        this.api = api;
        this.lazyloadHelper = new LazyloadHelper(api);
    }

    // (void) Element is about to be rendered.
    onRender(model, view) {
        model.setFiltered('lazyloadImages', this.lazyloadHelper.check(model, view));
    }

}
