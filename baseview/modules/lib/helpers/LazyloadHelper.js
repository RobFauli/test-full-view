export class LazyloadHelper {

    constructor(api) {
        this.api = api;
        this.isEditor = this.api.v1.app.mode.isEditor();
        this.isFragmentMode = this.api.v1.app.mode.isFragmentMode();
        this.lazyloadImages = !this.isEditor && !!this.api.v1.config.get('imageLoading.lazy');
    }

    // (bool) Check if image should be lazyloaded.
    check(model, view) {
        if (!this.lazyloadImages || view.getProperty('image.noLazy')) {
            return false;
        }
        const row = lab_api.v1.model.query.getParentOfType(model, 'row');
        if (row && !this.isFragmentMode && row.getModelIndex() < 5) {
            return false;
        }
        return true;
    }

}
