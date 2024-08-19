import { DateTimeHelper } from './datetime/DateTimeHelper.js';

export class AdsHelper {

    static getAdnuntiusSettings(api, model, view, adEnv, site) {

        // Find adUnits placed on current page in admin
        const adnuntiusBiddingEnabled = (api.v1.config.get('contentbox_settings.adnuntiusAd.bidding') || {}).enabled || false;

        function parseFormat(format, item) {
            let config = '';
            if (adnuntiusBiddingEnabled && format.prebidConfig) {
                config = JSON.parse(format.prebidConfig);
                if (Array.isArray(config)) [config] = config;
                config = JSON.stringify(config);
            }

            return {
                ...format,
                prebidConfig: config,
                metadata: item.metadata || []
            };
        }

        const units = api.v1.config.get('contentbox_settings.adnuntiusAd.formats') || [];
        const content = api.v1.config.getView(`insertDynamic.${ api.v1.model.root.getType().replace('page_', '') }.${ view.getViewport() }`, site.alias) || [];
        const manualContent = api.v1.model.query.getChildrenOfType(model, 'adnuntiusAd', true, true);

        const visibleUnits = [];
        for (const item of content) {
            const [format] = units.filter((unit) => item.content_data.fields.format === unit.format);
            if (format) {
                visibleUnits.push(parseFormat(format, item));
            }
        }
        for (const childModel of manualContent) {
            const [format] = units.filter((unit) => childModel.get('fields.format') === unit.format);
            if (format) {
                visibleUnits.push(parseFormat(format, childModel));
            }
        }

        const dateHander = new DateTimeHelper();
        const newsletterTargeting = dateHander.utcFormat(new Date(), '&tag=week_{{ W }}_{{ YYYY }}');

        return {
            enabled: units.length > 0,
            lazyload: api.v1.config.get('contentbox_settings.adnuntiusAd.lazyload') || false,
            adUnits: visibleUnits,
            spacingTop: api.v1.config.get('contentbox_settings.adnuntiusAd.spacingTop') || 120,
            bidding: {
                enabled: adnuntiusBiddingEnabled
            },
            hideOnTabletWidth: adEnv.hideOnTabletWidth || 1316,
            refreshdelay: api.v1.config.get('contentbox_settings.adnuntiusAd.refreshdelay') || 5,
            refreshcount: api.v1.config.get('contentbox_settings.adnuntiusAd.refreshcount') || 1,
            connectLoading: api.v1.config.get('contentbox_settings.adnuntiusAd.connectLoading') || false,
            contkitEnabled: api.v1.config.get('contentbox_settings.adnuntiusAd.contkitEnabled') || false,
            newsletter: {
                targeting: newsletterTargeting
            }
        };
    }

    static getGoogleSettings(api, model, view, adEnv, site) {
        function parseFormat(format, item) {
            const { sizes = [] } = format;
            return {
                ...format,
                sizesString: `[${  sizes.map((size) => `[${ size.width },${ size.height }]`).join(', ') }]`,
                metadata: item.metadata || []
            };
        }

        const units = api.v1.config.get('contentbox_settings.googleAd.formats') || [];
        const anchor = api.v1.config.get('contentbox_settings.googleAd.anchor') || { enabled: false, code: '', type: 'TOP_ANCHOR' };
        const content = api.v1.config.getView(`insertDynamic.${ api.v1.model.root.getType().replace('page_', '') }.${ view.getViewport() }`, site.alias) || [];
        const manualContent = api.v1.model.query.getChildrenOfType(model, 'googleAd', true, true);

        const visibleUnits = [];
        for (const item of content) {
            const [format] = units.filter((unit) => item.content_data.fields.format === unit.format);
            if (format) {
                visibleUnits.push(parseFormat(format, item));
            }
        }
        for (const childModel of manualContent) {
            const [format] = units.filter((unit) => childModel.get('fields.format') === unit.format);
            if (format) {
                visibleUnits.push(parseFormat(format, childModel));
            }
        }

        return {
            enabled: units.length > 0,
            lazyload: adEnv.lazyload || false,
            spacingTop: api.v1.config.get('contentbox_settings.googleAd.spacingTop') || 120,
            adUnits: visibleUnits,
            anchor,
            dfpid: adEnv.dfpid || false,
            debugmode: adEnv.debugmode || false,
            bidding: adEnv.bidding,
            hideOnTabletWidth: adEnv.hideOnTabletWidth || 1316
        };
    }

}
