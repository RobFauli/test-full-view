export default class AdnuntiusAd {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const formatConfig = this.api.v1.config.get('contentbox_settings.adnuntiusAd.formats') || [];
        const key = model.get('fields.format');

        const format = formatConfig.filter((config) => config.format === key)[0] || {};
        model.setFiltered('adData', format);
        model.setFiltered('isDebug', this.api.v1.util.request.hasQueryParam('debug') ||  model.get('metadata.isDebug'));

        if (!this.api.v1.app.mode.isEditor()) {
            const hideOnTablet = (model.parent && model.parent.get('metadata.hideOnTablet') === true && this.api.v1.config.get('xUaDevice') === 'tablet');
            model.setFiltered('hideOnTablet', hideOnTablet);
        }

        if (this.api.v1.app.mode.isEditor()) {
            const pageType = this.api.v1.model.root.getType().replace('page_', '');
            const filteredKeys = [];
            formatConfig.forEach((item) => {
                if ((item.selectable && item.selectable.indexOf(pageType) > -1) || (item.selectableOn && item.selectableOn[pageType] === true)) {
                    if (item.format === key) {
                        const mutableItem = { ...item };
                        mutableItem.selected = true;
                        filteredKeys.push(mutableItem);
                    } else {
                        filteredKeys.push(item);
                    }
                }
            });
            model.setFiltered('formatConfigKeys', filteredKeys);
        }

        // Set label with fallback to config.
        const fallbackLabel = this.api.v1.config.get('contentbox_settings.adnuntiusAd.label') || 'Annonse';
        const label = model.get('fields.label') || fallbackLabel;
        model.setFiltered('label', label);

        const isSticky = (model.get('metadata.css') || '').includes('sticky'); // Check if css string contains sticky keyword.
        if (isSticky) {
            const spacingTop = this.api.v1.config.get('contentbox_settings.adnuntiusAd.spacingTop') || 120;
            const spacingTopStyle = `top: ${ spacingTop }px;`;
            model.setFiltered('spacingTop', spacingTopStyle);
        }
    }

}
