import { ResourceHelper } from '../helpers/ResourceHelper.js';

export class PageAPI {

    constructor(api) {
        this.api = api;
        this.pageType = this.api.v1.model.root.getType();
    }

    get media() {
        return {
            // (object) { current, sm }
            getLogo: (viewport = this.api.v1.viewport.getName()) => {
                const logo = this.api.v1.config.get('logo') || {};
                const activeLogo = logo.uploadedFileUrl ? {
                    src: logo.uploadedFileUrl, href: logo.default.href, type: 'img', size: { width: logo.logoWidth }, title: logo.default.title, isCustom: true
                } : logo[viewport] || logo.default || null;
                if (activeLogo) {
                    if (activeLogo.type === 'img') {
                        activeLogo.is_img = true;
                    } else if (activeLogo.type === 'svg') {
                        activeLogo.is_svg = true;
                    }
                }

                const logo_sm = logo.uploadedFileUrl ? { src: logo.uploadedFileUrl, href: logo.default.href, size: { width: logo.logoWidth }, title: logo.default.title, isCustom: true } : logo.standalone || logo.mailmojo || null;

                return {
                    current: activeLogo,
                    sm: logo_sm
                };
            }
        };
    }

    get menus() {
        return {
            get: ({ section, defaultSection } = {}, identifier) => {
                const results = {};
                const menus = Object.values(this.api.v1.config.get('menus') || {});
                if (menus.length < 1) return null;

                const validateItems = (items) => {
                    items.forEach((item) => {
                        item.selected = (item.section === section || item.section === defaultSection);
                        if (!('target' in item)) item.target = '_self';
                        if (!('selector' in item)) item.selector = '';
                        if (!('children' in item)) item.children = [];
                        if (item.children.length > 0) {
                            item.hasChildren = true;
                            validateItems(item.children);
                        }
                    });
                };

                menus.forEach((menu) => {
                    validateItems(menu.menuItems);
                    const name = menu.type || menu.menuName;
                    results[name] = {
                        items: menu.menuItems,
                        type: menu.type,
                        selector: menu.selector || ''
                    };
                });

                return identifier ? results[identifier] : results;
            }
        };
    }

    get misc() {
        return {

        };
    }

    get resources() {
        const scripts = {
            required: [],
            getProgressReader() {
                scripts.required.push({
                    url: '/view-resources/public/common/ReadProgress.js',
                    requireDom: false
                });
                return {
                    active: true,
                    minElementCount: lab_api.v1.config.get('displayReadProgress.minElementCount') || 25
                };
            },
            getSiteFiles(model, view, alias, pageType, isEditor) {
                const siteScripts = ResourceHelper.getSiteScriptsWithFallback(alias, pageType, isEditor);
                const commonScripts = ResourceHelper.getCommonScripts(pageType, isEditor);

                scripts.required.push(...siteScripts, ...commonScripts);

                return {
                    js: ResourceHelper.getSiteFilesForContentboxes(model, view, 'js', scripts.required.map((script) => script.url)),
                    css: ResourceHelper.getSiteFilesForContentboxes(model, view, 'css')
                };
            },
            // (array)
            getModules(model, view, alias, pageType, isEditor) {
                return ResourceHelper.getCommonScripts(pageType, isEditor, true);
            }
        };

        const analytics = {
            get: () => {
                const kilkaya = (lab_api.v1.config.get('analytics.kilkaya') || []).map((item) => {
                    const itm = { ...item };
                    if (itm.id && typeof itm.id === 'string' && itm.id.trim().endsWith('.js')) {
                        itm.url = itm.id;
                    }
                    return itm;
                });

                // Support old data in object format
                let adnuntiusConnect = this.api.v1.config.get('analytics.adnuntiusConnect');
                if (adnuntiusConnect && (typeof adnuntiusConnect === 'object' && !Array.isArray(adnuntiusConnect)) && Object.keys(adnuntiusConnect).length) {
                    adnuntiusConnect = new Array(adnuntiusConnect);
                }

                const items = {
                    google: this.api.v1.config.get('analytics.google.tracking_id'),
                    google_gtm: this.api.v1.config.get('analytics.google.gtm'),
                    comscore: this.api.v1.config.get('analytics.comscore.comscore_id'),
                    adnuntiusConnect,
                    adnuntiusConnectCMP: this.api.v1.config.get('analytics.adnuntiusConnectCMP'),
                    kilkaya,
                    kilkayaSettings: this.api.v1.config.get('analytics.kilkayaSettings'),
                    io: this.api.v1.config.get('analytics.io.tracking_id')
                };

                const dataLayer = analytics.getDataLayer();
                if (dataLayer.dataLayer) items.dataLayer = dataLayer.dataLayer;
                if (dataLayer.usesJWTCookieData) items.usesJWTCookieData = dataLayer.usesJWTCookieData;

                return items;
            },
            getDataLayer: () => {
                const dataLayer = this.api.v1.config.get('analytics.google.dataLayer');
                let usesJWTCookieData = false;

                if (dataLayer && Array.isArray(dataLayer) && dataLayer.length) {
                    dataLayer.forEach((item) => {
                        let value = null;

                        // eslint-disable-next-line default-case
                        switch (item.source) {
                            case 'config':
                                value = this.api.v1.properties.get(item.value);
                                break;
                            case 'jwtcookie':
                                item.isJWTCookie = true;
                                value = item.value;
                                usesJWTCookieData = true;
                                break;
                            case this.pageType.replace('page_', ''):
                                value = this.api.v1.model.query.getRootModel().get(item.value);
                                break;
                        }

                        item.value = (value === null ? '' : value.toString());
                    });

                    const lastIndex = dataLayer.map((item) => item.value.length > 0).lastIndexOf(true);
                    if (dataLayer[lastIndex]) {
                        dataLayer[lastIndex].last = true;
                    }
                }

                return {
                    dataLayer,
                    usesJWTCookieData
                };
            }
        };

        return {
            scripts,
            analytics
        };
    }

    get settings() {
        return {
            get: (params = {}) => {
                const socialDisplay = this.api.v1.config.get(`page_settings.${ params.pageType }.social.display`) || {};

                const socialDisplayBodytextBefore = this.api.v1.model.query.getRootModel().get('fields.show_social_bodytext_before');
                const socialDisplayBodytextAfter = this.api.v1.model.query.getRootModel().get('fields.show_social_bodytext_after');
                const socialDisplayHeader = this.api.v1.model.query.getRootModel().get('fields.show_social_header');

                if (socialDisplayBodytextBefore !== null) {
                    socialDisplay.bodytext_before = !!socialDisplayBodytextBefore;
                }

                if (socialDisplayBodytextAfter !== null) {
                    socialDisplay.bodytext_after = !!socialDisplayBodytextAfter;
                }

                if (socialDisplayHeader !== null) {
                    socialDisplay.header = !!socialDisplayHeader;
                }

                const socialItemsConfig = this.api.v1.config.get(`page_settings.${ params.pageType }.social.items`) || {};
                const showTagsSetting = this.api.v1.config.get(`page_settings.${ params.pageType }.showTags`);
                const socialItems = Object.keys(socialItemsConfig).filter((key) => !!socialItemsConfig[key].display).map((key) => ({
                    name: key,
                    icon: socialItemsConfig[key].icon || '',
                    url: params.socialLinks[key] || '',
                    shareText: socialItemsConfig[key].shareText || '',
                    isButton: socialItemsConfig[key].isButton || false
                }));
                return {
                    page_type: params.pageType,
                    social: {
                        display: {
                            bodytext_before: socialItems.length > 0 && !!socialDisplay.bodytext_before,
                            bodytext_after: socialItems.length > 0 && !!socialDisplay.bodytext_after,
                            header: socialItems.length > 0 && !!socialDisplay.header
                        },
                        items: socialItems
                    },
                    showTags: showTagsSetting !== false
                };
            }
        };
    }

}
