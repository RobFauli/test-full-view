/* eslint no-param-reassign: ["error", { "props": false }] */
import { ClientConfig } from '../../lib/helpers/ClientConfig.js';

export default class LabradorSearch {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const siteList = lab_api.v1.properties.get('sites');
        const sites = [];
        const allowedSites = model.get('fields.allowedSites_json') || {};
        const allowedSitesList = [];

        siteList.forEach((site) => {
            const siteData = {
                alias: site.alias,
                id: site.id,
                displayName: site.display_name,
                selected: false
            };

            sites.push(siteData);

            if (allowedSites[site.alias] === `${ site.id }`) {
                siteData.selected = true;
                allowedSitesList.push(siteData);
            }
        });

        if (allowedSitesList.length === 0) {
            const currentSite = lab_api.v1.properties.get('site');
            sites.forEach((site) => {
                if (site.id === currentSite.id) {
                    site.selected = true;
                    allowedSitesList.push(site);
                }
            });
        }

        const orderBy = view.get('fields.orderBy') || 'published';
        const orderByOptions = [
            {
                value: 'published',
                label: 'Published'
            },
            {
                value: 'score',
                label: 'Score'
            }
        ];
        orderByOptions.forEach((item) => {
            if (orderBy && orderBy === item.value) {
                item.selected = true;
            }
        });

        model.setFiltered('sites', sites);
        model.setFiltered('allowedSites', allowedSitesList);
        model.setFiltered('allowedSitesString', JSON.stringify(allowedSitesList || []));
        model.setFiltered('orderByOptions', orderByOptions);
        model.setFiltered('clientConfig', JSON.stringify(ClientConfig.buildConfig(this.api)));
    }

}
