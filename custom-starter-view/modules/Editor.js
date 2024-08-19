
export default class {
    onReady(api) {
        this.api = api;
        api.v1.app.on('published', this.onPublished);
    }

    onPublished(params) {
        // Published with parameters available    
    }
}
