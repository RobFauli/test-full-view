import { ExpandableOptions } from '../../lib/helpers/ExpandableOptions.js';

export default class Factbox {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        model.setFiltered('options', ExpandableOptions.run({
            configPath: 'contentbox_settings.factbox'
        }));

        // Set a flag if no title and bodytext exist
        model.setFiltered('noContent', (lab_api.v1.app.mode.isFront() && !model.get('fields.title') && !model.get('fields.bodytext')));
    }

}
