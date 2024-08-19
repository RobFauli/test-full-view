import { DynamicDataHelper } from './lib/helpers/dynamic/DynamicDataHelper.js';
import { FragmentHelper } from './lib/helpers/FragmentHelper.js';
import { PageExport } from './lib/helpers/PageExport.js';
import { EsiHelper } from './lib/helpers/dynamic/EsiHelper.js';
import { Spacing } from './lib/helpers/Spacing.js';

export default class {

    constructor() {
        this.name = 'Baseview';
        this.api = null;
        this.pageAPI = null;
        this.useSpacing = false;
    }

    onReady(api) {
        this.api = api;
        // this.pageAPI = new PageAPI(this.api);

        // Display JSON Viewport data.
        // Return an array with a serialized version of the root-model in a format equal to backend API-format
        if (this.api.v1.viewport.getName() === 'json') {
            if (this.api.v1.config.get('viewports.json.renderer') === 'PageExport.jsonData') {
                const pageExporter = new PageExport(this.api);
                lab_api.v1.view.on('rendered', (markups, viewport) => [JSON.stringify(pageExporter.jsonData(lab_api.v1.model.query.getRootModel()), null, 4)]);
            }
        }

        const fragmentHelper = new FragmentHelper(this.api, this.api.v1.util.request);
        fragmentHelper.listen();
    }

    onAcceptContent() {
        const rootModel = this.api.v1.model.query.getRootModel();

        // Check if custom spacing is supported on this page
        this.useSpacing = !!(rootModel && rootModel.get('fields.style_spacing'));

        if (this.api.v1.app.mode.getSimulatedMode() === 'editor') {
            Sys.logger.debug('[Front] Labrador is running in simulated editor-mode. Skipping DynamicDataHelper and EsiHelper.');
            return;
        }
        const dynamicData = new DynamicDataHelper(this.api);
        dynamicData.insert(this.api.v1.viewport.getName());

        const esiHelper = new EsiHelper(this.api);
        esiHelper.register(rootModel, lab_api.v1.site.getSite().alias);
    }

    onRender(model, view) {
        if (this.useSpacing) {
            model.setFiltered('styleSheets', Spacing.createStyle({
                model,
                view,
                viewports: ['desktop', 'mobile'],
                returnArray: false
            }));
        }
    }

}
