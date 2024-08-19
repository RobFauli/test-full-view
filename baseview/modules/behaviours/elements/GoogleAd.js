export default class GoogleAd {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const rootModel = this.api.v1.model.query.getRootModel();
        const formatConfig = this.api.v1.config.get('contentbox_settings.googleAd.formats') || [];
        const key = model.get('fields.format');

        const getFormat = (name, formatList) => {
            for (let index = 0; index < formatList.length; index++) {
                if (formatList[index].format === name) {
                    return { ...formatList[index] };
                }
            }
            return {};
        };

        const adEnv = this.api.v1.config.get('adEnvironment') || {};
        const googleAds = {
            bidding: adEnv.bidding,
            hideOnTabletWidth: adEnv.hideOnTabletWidth || 1316
        };
        model.setFiltered('googleAds', googleAds);

        const format = getFormat(key, formatConfig);
        format.key = model.get('metadata.key') || 'row';

        // Livewrapped special case
        if (googleAds.bidding && googleAds.bidding.enabled && googleAds.bidding.provider && googleAds.bidding.provider.name) {
            if (googleAds.bidding.provider.name === 'livewrapped') {
                const guidGenerator = () => {
                    const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                    return (`${ S4() + S4() }-${ S4() }-${ S4() }-${ S4() }-${ S4() }${ S4() }${ S4() }`);
                };
                if (format.code && format.code.endsWith('-1')) {
                    format.code += `_${  guidGenerator() }`;
                }
            }
        }

        if (format.code === 'mpu_top') {
            format.isMpuTop = true;
        }

        model.setFiltered('adData', format);
        model.setFiltered('isDebug', this.api.v1.util.request.hasQueryParam('debug') || model.get('metadata.isDebug'));

        const fallbackLabel = this.api.v1.config.get('contentbox_settings.googleAd.label') || 'Annonse';
        const label = model.get('fields.label') || fallbackLabel;
        model.setFiltered('label', label);

        if (!this.api.v1.app.mode.isEditor()) {
            const hideOnTablet = (model.parent && model.parent.get('metadata.hideOnTablet') === true && this.api.v1.properties.get('xUaDevice') === 'tablet');
            model.setFiltered('hideOnTablet', hideOnTablet);
        }

        if (this.api.v1.app.mode.isEditor()) {
            const pageType = rootModel.get('type').replace('page_', '');
            const filteredKeys = [];
            formatConfig.forEach((item) => {
                if (item.selectable && item.selectable.indexOf(pageType) > -1) {
                    filteredKeys.push(item);
                } else if (item.selectableOn && item.selectableOn[pageType] === true) {
                    filteredKeys.push(item);
                }
            });
            model.setFiltered('formatConfigKeys', filteredKeys);
        }

        const isSticky = (model.get('metadata.css') || '').includes('sticky'); // Check if css string contains sticky keyword.
        if (isSticky) {
            const spacingTop = this.api.v1.config.get('contentbox_settings.googleAd.spacingTop') || 120;
            const spacingTopStyle = `top: ${ spacingTop }px;`;
            model.setFiltered('spacingTop', spacingTopStyle);
        }
    }

}
