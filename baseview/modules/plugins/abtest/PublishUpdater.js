export class PublishUpdater {

    constructor(api, model) {
        this.api = api;
        this.model = model;
    }

    // (void)
    async willPublish() {

        // 1) Find all persistent articles with an instance_of-id
        const models = this.getModels(this.model);

        // 2) Find all collections using any of this id's
        // Todo: Only use collections with active tests ...
        const collectionIds = await this.getCollections(models.map((m) => m.get('instance_of') || m.get('id')));

        // 3) Get current stored id's
        const current = this.model.get('fields.abtestCollectionIds_json') || [];

        // 4) Check if modified, if so: Store new list on model and re-publish
        if (this.hasDiff(current, collectionIds)) {
            this.model.set('fields.abtestCollectionIds_json', collectionIds);
            this.model.set('fields.lab_override_config_presentation', this.getPreloadConfig(collectionIds));
            setTimeout(() => {
                this.api.v1.app.publish();
            }, 1000);
        }
    }

    // (array)
    getModels(model) {
        return this.api.v1.model.query.getModelsByType('article', [this.model]).filter((m) => !m.isNonPersistent() && (m.get('instance_of') || m.get('id')));
    }

    // (array)
    // Todo: Only use collections with active tests ...
    async getCollections(idList) {
        const ids = await this.api.v1.abtest.collection.listMultiple(idList);
        return ids ? ids.result : [];
    }

    // (boolean)
    hasDiff(array1, array2) {
        if (array1.length !== array2.length) {
            return true;
        }
        for (const id of array1) {
            if (!array2.includes(id)) { return true; }
        }
        for (const id of array2) {
            if (!array1.includes(id)) { return true; }
        }
        return false;
    }

    // (string)
    getPreloadConfig(idList) {
        if (!idList.length) {
            return '';
        }
        return JSON.stringify({
            preloadObject: {
                abtests: {
                    mode: 'presentation',
                    type: 'json',
                    url: `{{api}}/api/v1/ab_collection?query=id:(${ encodeURIComponent(idList.join(' OR ')) })&content=full`,
                    path: 'ab_collections'
                }
            }
        });
    }

}
