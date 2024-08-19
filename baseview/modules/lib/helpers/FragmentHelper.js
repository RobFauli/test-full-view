// Baseview fragment-api
// Return a subset of page-data to the drawing engine
// Supports 'path' and 'guid'
// Url: ?lab_path=dropZone[0]/row[2]&lab_selector=lab-dz-1
// Url: ?lab_guid=cdbcdd28-52c3-4c33-c54a-cb54e0480d6f&lab_selector=lab-dz-1
// For embedded content: ?lab_viewport=embed&lab_path=dropZone[0]/row[2]/article[0]

export class FragmentHelper {

    constructor(api) {
        this.api = api;
        this.request = this.api.v1.util.request;
    }

    listen() {
        const options = {
            selector: this.request.getQueryParam('lab_selector') || 'contentFromPath',
            path: this.request.getQueryParam('lab_path'),
            guid: this.request.getQueryParam('lab_guid')
        };

        // Debug:
        // options.path = 'dropZone[0]/row[1]';
        // options.path = 'dropZone/row[1]/*[1]';
        // options.path = 'article[2]/image';
        // options.path = 'image[3]';
        // options.path = 'dropZone[0]/row';
        // options.guid = '634afc87-1b4d-4005-b413-d09905caf072';

        if (options.guid || options.path) {
            // If listener returns an array it will replace models to render.
            // Return undefined to let drawing engine ignore listener.
            this.api.v1.model.on('insert', (models) => {
                const model = options.guid ? this.getModelByGuid(options.guid, models) : this.getModelByPath(options.path, models);
                if (model) {
                    Sys.logger.debug(`[FragmentHelper] Element found. Path: ${ model.getPositionedPath() }, GUID: ${ model.getGuid() }.`);
                    model.setSelector(options.selector);
                    if (lab_api.v1.viewport.getName() === 'embed') {
                        return this.appendToRoot(models, model);
                    }
                    return [model];
                }
                return undefined;
            });
        }
    }

    // (LabModel / null)
    getModelByGuid(guid) {
        Sys.logger.debug(`[FragmentHelper] Will filter elements by guid: "${ guid }".`);
        return this.api.v1.model.query.getModelByGuid(guid);
    }

    // (LabModel / null)
    getModelByPath(path, models) {
        Sys.logger.debug(`[FragmentHelper] Will filter elements by path: "${ path }".`);
        const pathInfo = this.api.v1.util.string.parsePath(path);
        if (!pathInfo[0]) { return null; }
        const sources = this.api.v1.model.query.getModelsByType(pathInfo[0].base, models);
        return this.api.v1.model.query.getModelByPath(path, true, false, sources);
    }

    // (array)
    // The 'embed'-viewport draws fragments as children of the page-element.
    // Replace children of the root-model with 'models' and return new array.
    appendToRoot(models, model) {
        const rootModel = models[0];
        rootModel.children = [model];
        return [rootModel];
    }

}
