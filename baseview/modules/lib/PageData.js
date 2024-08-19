import { ResourceHelper } from './helpers/ResourceHelper.js';
import { StyleHelper } from './helpers/StyleHelper.js';
// import { DateTimeHelper } from './helpers/datetime/DateTimeHelper.js';
import { AdsHelper } from './helpers/AdsHelper.js';
import { SEOHelper } from './helpers/SEOHelper.js';
import { CustomTags } from './helpers/CustomTags.js';

export class PageData {

    constructor(api, pageApi) {
        this.api = api;
        this.page = pageApi;
    }

    set(model, view) {
        const data = this.export(model, view);
        for (const key of Object.keys(data)) {
            model.setFiltered(key, data[key]);
        }
    }

    export(model, view) {
        const exports = {};

        const NOW = new Date();
        const PAGE_TYPE = view.get('type').replace('page_', '');
        const PAGE_ID = view.get('id');
        const CUSTOMER_FRONT_URL = this.api.v1.site.getSite().domain || this.api.v1.properties.get('customer_front_url');
        const URL = CUSTOMER_FRONT_URL + view.get('fields.published_url');
        const URL_ENCODED = encodeURIComponent(URL);
        const IMAGE_SERVER = this.api.v1.properties.get('image_server');
        const IS_EDITOR = this.api.v1.app.mode.isEditor();
        const CANONICAL = this.getCanonicalUrl(model, PAGE_TYPE, PAGE_ID, CUSTOMER_FRONT_URL);
        const TAGPAGE_PATH = this.api.v1.config.get('tagPagePath') || '/tag/';
        const IS_TAGPAGE = (PAGE_TYPE === 'front' && (URL.endsWith(TAGPAGE_PATH.slice(0, -1)) || URL.indexOf(TAGPAGE_PATH) > -1));
        const IS_TAGPAGE_WITH_FRONTPAGE = (IS_TAGPAGE && !URL.endsWith(TAGPAGE_PATH.slice(0, -1)));

        // Metadata.
        exports.customer_front_url = CUSTOMER_FRONT_URL;
        exports.isEditMode = IS_EDITOR;
        exports.url = URL;
        exports.urlEncoded = URL_ENCODED;
        exports.specificUrl = CANONICAL;
        exports.image_server = IMAGE_SERVER;
        exports.pageType = PAGE_TYPE;
        exports.is_article = PAGE_TYPE === 'article';
        exports.is_front = PAGE_TYPE === 'front';
        exports.section = view.get('primaryTags.section') || view.get('fields.defaultsection');
        exports.device = this.api.v1.viewport.getName();
        exports.cmsVersion = this.api.v1.properties.get('app.version');
        exports.front_api_url = this.api.v1.properties.get('front_api_url');
        exports.xUaDevice = this.api.v1.properties.get('xUaDevice');
        exports.favicons = this.api.v1.config.get('favicons');
        exports.faviconList = this.api.v1.config.get('faviconList');
        exports.skipDefaultFont = this.api.v1.config.get('skipDefaultFont');
        exports.isDebug = this.api.v1.util.request.hasQueryParam('debug');
        exports.staticUrl = this.getStaticUrl(model, PAGE_TYPE, PAGE_ID, CUSTOMER_FRONT_URL);
        exports.customMetatags = this.getCustomMetatags();
        exports.customTags = CustomTags.prepareForTemplate(this.api.v1.config.get('customTags') || [], PAGE_TYPE, IS_EDITOR);
        exports.footerSettings = this.api.v1.config.get('page_settings.footer');
        exports.rssDescriptionPrefix = this.api.v1.config.get('viewports.rss.descriptionPrefix');
        exports.is_tagpage = IS_TAGPAGE;
        exports.contentLanguage = lab_api.v1.config.get('contentLanguage');

        // Media.
        const logo = this.page.media.getLogo();
        exports.logo = logo.current;
        exports.logo_sm = logo.sm;

        // Note: Is this still used?
        exports.misc = this.api.v1.config.get('misc');

        // Google Translate
        const translate = {
            active: false,
            lang: this.api.v1.config.get('google_translate')
        };
        if (translate.lang && Array.isArray(translate.lang) && translate.lang.length) {
            translate.active = true;
        }
        exports.google_translate = translate;

        // Social
        exports.social = {
            facebook: `https://www.facebook.com/sharer.php?u=${  URL_ENCODED }`,
            twitter: `https://twitter.com/intent/tweet?url=${  URL_ENCODED }`,
            // google: 'https://plus.google.com/share?url=' + urlEncoded,
            mail: `mailto:?subject=${  encodeURIComponent(this.api.v1.util.string.stripTags(view.get('fields.title')))  }&body=${  encodeURIComponent(this.api.v1.util.string.stripTags(view.get('fields.subtitle')))  }%0D${  URL_ENCODED }`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${ URL_ENCODED }`,
            threads: `https://threads.net/intent/post?text=${ URL_ENCODED }`,
            copyLink: `navigator.clipboard.writeText("${ URL }");`,
            glimta: `https://glimta.com/unlock?link=${ URL_ENCODED }`,
            talandeWebb: `ReachDeck.panel.toggleBar();`
        };

        // Set article tags and byline as comma separated string
        if (PAGE_TYPE === 'article') {
            const ignoredTags = this.api.v1.config.get('page_settings.article.ignoredTags') || [];
            const ignoredTagPrefix = this.api.v1.config.get('page_settings.article.ignoredTagPrefix') || [];
            const tags = (model.get('tags') || []).filter((tag) => !ignoredTags.includes(tag)).filter((tag) => {
                for (const prefix of ignoredTagPrefix) {
                    if (tag.startsWith(prefix)) {
                        return false;
                    }
                }
                return true;
            });

            exports.tagsString = tags.toString();
            let tagsStringCommaSeparated = '';
            tags.forEach((tag, index) => {
                tagsStringCommaSeparated += `"${ tag.replace('"', '\'') }"`;
                if (index < tags.length - 1) tagsStringCommaSeparated += ', ';
            });
            exports.tagsStringCommaSeparated = tagsStringCommaSeparated;

            const bylines = this.api.v1.model.query.getChildrenOfType(model, 'byline', true);
            if (bylines) {
                const bylinesStringCommaSeparated = bylines
                    .map((byline) => `"${ byline.get('fields.firstname') } ${ byline.get('fields.lastname') }"`)
                    .join(', ');
                exports.bylinesStringCommaSeparated = bylinesStringCommaSeparated;
            }
        }

        // Set article published time
        if (PAGE_TYPE === 'article') {
            if (model.get('fields.published')) {
                exports.published = new Date(parseInt(model.get('fields.published'), 10) * 1000).toISOString();
                exports.publishedTimestamp = model.get('fields.published');
            }
        }

        // Site.
        exports.site = this.api.v1.site.getSite();
        exports.siteJSON = JSON.stringify(exports.site);
        exports['site.domain_no_protocol'] = exports.site.domain.split('://').pop();
        exports.siteAlias = exports.site.alias;
        exports.fullUrl = exports.site.domain;
        exports[`site_is_${ exports.siteAlias }`] = true;

        const resourcesHandler = this.page.resources;

        if (!IS_EDITOR && exports.is_article && this.api.v1.config.get('displayReadProgress.active') && view.get('fields.displayReadProgress')) {
            exports.readProgress = resourcesHandler.scripts.getProgressReader();
        }

        exports.siteStylesheetList = ResourceHelper.getSiteStylesWithFallback(exports.siteAlias);
        Sys.logger.debug(`ViewSupport: Will include ${ exports.siteStylesheetList.length } configured stylesheet(s): "${ exports.siteStylesheetList.join(', ') }".`);

        exports.siteFiles = resourcesHandler.scripts.getSiteFiles(model, view, exports.siteAlias, PAGE_TYPE, IS_EDITOR);
        exports.modules = resourcesHandler.scripts.getModules(model, view, exports.siteAlias, PAGE_TYPE, IS_EDITOR);

        if (!IS_EDITOR) {
            exports.analytics = resourcesHandler.analytics.get();
            exports.widgets = {
                strossle: this.api.v1.config.get('widgets.strossle.strossle_id')
            };
            exports.consent = {
                cookieconsent: this.api.v1.config.get('consent.cookieconsent.show'),
                cookieconsent_culture: this.api.v1.config.get('consent.cookieconsent.culture') || 'NB'
            };

            if (this.api.v1.config.get('cookieConsent.enabled')) {
                resourcesHandler.scripts.required.push({
                    url: '/view-resources/public/common/cookieConsent.js',
                    requireDom: false
                });
            }

            if (this.api.v1.viewport.getName() === 'desktop' && view.get('fields.style_slidein')) {
                exports.style_slidein = true;
                resourcesHandler.scripts.required.push({
                    url: '/view-resources/public/common/SlideIn/SlideIn.js',
                    requireDom: false
                });
            }

            const adEnv = this.api.v1.config.get('adEnvironment') || {};
            const hideAds = view.get('fields.hideAds') === '1';
            if (!hideAds && adEnv && adEnv.name === 'adnuntius') {
                try {
                    exports.adnuntius = AdsHelper.getAdnuntiusSettings(this.api, model, view, adEnv, exports.site);
                } catch (error) {
                    Sys.logger.warn(`[PageData] Failed to prepare Adnuntius ads: ${ error.toString() }`);
                }
            }
            if (!hideAds && adEnv && adEnv.name === 'google') {
                try {
                    exports.googleAds = AdsHelper.getGoogleSettings(this.api, model, view, adEnv, exports.site);
                } catch (error) {
                    Sys.logger.warn(`[PageData] Failed to prepare Google ads: ${ error.toString() }`);
                }
            }

        }

        if (this.api.v1.util.request.hasQueryParam('fontpreview')) {
            exports.fontpreview = this.api.v1.util.request.getQueryParam('fontpreview');
            exports.analytics = null;
        }

        exports.page_settings = this.page.settings.get({
            pageType: PAGE_TYPE,
            socialLinks: exports.social
        });

        // Comments
        if (PAGE_TYPE === 'article') {
            const configForComments = this.api.v1.config.get('comments_provider.hideCommentsIfPaywall') || false;
            const paywallState = this.api.v1.properties.get('paywall') || {};
            const paywallMode = lab_api.v1.app.mode.isFront() && paywallState.active && !paywallState.hasAccess;
            const hideComments = paywallMode && configForComments;
            const DISPLAY = IS_EDITOR === false && hideComments === false;

            if (view.get('fields.showcomments') && !hideComments) {
                if (this.api.v1.config.get('comments_provider.facebook')) {
                    const facebookAppId = this.api.v1.config.get('comments_provider.facebook.app_id');
                    if (facebookAppId) {
                        exports.facebook = {
                            display: DISPLAY,
                            displayPlaceholder: IS_EDITOR,
                            appId: facebookAppId,
                            pageId: PAGE_ID,
                            url: exports.fullUrl + (PAGE_TYPE === 'article' ? `/a/${  PAGE_ID }` : '')
                        };
                        exports.displayComments = true;
                    }
                }

                if (this.api.v1.config.get('comments_provider.disqus')) {
                    const enableComments = this.api.v1.config.get('comments_provider.disqus.enable');
                    const disqusScript = this.api.v1.config.get('comments_provider.disqus.script');
                    if (enableComments) {
                        exports.disqus = {
                            display: DISPLAY,
                            displayPlaceholder: IS_EDITOR,
                            canonical: CANONICAL,
                            pageId: PAGE_ID,
                            script: disqusScript
                        };
                        exports.displayComments = true;
                    }
                }

                const commentoConfig = this.api.v1.config.get('comments_provider.commento');
                if (commentoConfig) {
                    if (commentoConfig.enable) {
                        exports.commento = {
                            display: DISPLAY,
                            displayPlaceholder: IS_EDITOR,
                            canonical: CANONICAL,
                            usePageId: commentoConfig.usePageId,
                            pageId: PAGE_ID,
                            script: commentoConfig.script,
                            cssOverride: commentoConfig.cssOverride,
                            descriptionText: commentoConfig.descriptionText
                        };
                        exports.displayComments = true;
                    }
                }

                const hyvor = lab_api.v1.config.get('comments_provider.hyvor');
                if (hyvor) {
                    if (hyvor.websiteId) {
                        const publishedTimestamp = model.get('fields.published') || 0;
                        exports.hyvor = {
                            display: DISPLAY,
                            displayPlaceholder: IS_EDITOR,
                            websiteId: hyvor.websiteId,
                            pageId: (publishedTimestamp > 1646908200 ? PAGE_ID : false)
                        };
                        if (hyvor.hidePageIdBeforeDate && publishedTimestamp < hyvor.hidePageIdBeforeDate) {
                            exports.hyvor.pageId = '';
                        }
                        exports.displayComments = true;
                    }
                }

                // Ifrågasätt
                const ifragasatt = lab_api.v1.config.get('comments_provider.ifragasatt');
                if (ifragasatt) {
                    exports.ifragasatt = {
                        display: DISPLAY,
                        displayPlaceholder: IS_EDITOR,
                        customerId: ifragasatt.customer_id,
                        articleId: `article${  PAGE_ID }`
                    };

                    exports.displayComments = true;
                }
            }
        }

        // const dateHandler = new DateTimeHelper(lab_api.v1.config.get('lang'));
        // exports.currentDateNo = dateHandler.format(NOW, '{{dd}}. {{MMMM}} {{YYYY}}');

        exports.menus = this.page.menus.get({
            defaultSection: view.get('fields.defaultsection'),
            section: view.get('primaryTags.section')
        });

        exports.style_definitions = StyleHelper.getStyleDefinitions(this.api);
        exports.css_build = StyleHelper.getInlineCSS(this.api);
        exports.contact = this.api.v1.config.get('contact');

        const norobots = !!view.get('fields.norobots'); // Can be true, false, "", "1"
        const hideFromFp = view.get('fields.hidefromfp_time');
        const nowInSeconds = Math.round(NOW.getTime() / 1000);
        exports.norobots = norobots || (hideFromFp && hideFromFp <= nowInSeconds) || false;

        if (PAGE_TYPE === 'article') {
            // Is this an embeddable article?
            if (this.api.v1.config.get('embeddable.active')) {
                resourcesHandler.scripts.required.push({
                    url: '/view-resources/public/common/embedThis.js',
                    requireDom: true
                });
                const sitelink = this.api.v1.config.get('embeddable.sitelink') || {};
                exports.embeddable = {
                    active: true,
                    display: !!view.get('fields.displayEmbedButton'),
                    isFullContent: this.api.v1.util.request.getQueryString().indexOf('lab_content=full') > -1,
                    sitelink: {
                        prefix: sitelink.prefix,
                        postfix: sitelink.postfix
                    }
                };
            }
        }

        // Handle required scripts.
        Sys.logger.debug(`ViewSupport: Will include ${ resourcesHandler.scripts.required.length } configured script(s): "${ resourcesHandler.scripts.required.map((item) => item.url).join(', ') }".`);
        resourcesHandler.scripts.required.forEach((script) => {
            if (!script.placeholderKey && script.requireDom) {
                script.placeholderKey = 'requireDom';
            }
            // Template friendly format
            if (script.placeholderKey) {
                const { placeholderKey } = script;
                script.placeholderKey = {};
                script.placeholderKey[placeholderKey] = true;
            }
        });
        exports.siteScriptList = resourcesHandler.scripts.required;

        exports.paywall = this.getPaywallInfo(model, IS_EDITOR);

        const seoHelper = new SEOHelper({
            pageType: PAGE_TYPE,
            canonical: CANONICAL,
            isTagpage: IS_TAGPAGE,
            isTagpageWithFrontpage: IS_TAGPAGE_WITH_FRONTPAGE,
            tagpagePath: TAGPAGE_PATH
        });

        // Set JSON-LD json string.
        const site_jsonld = seoHelper.generateSiteData(model);
        const jsonld = seoHelper.getStructuredData(model);

        exports.jsonld = JSON.stringify([site_jsonld, jsonld]);

        // Set SEO Data (title and description).
        const seoData = seoHelper.getSEOData(model);
        exports.seotitle = seoData.title;
        exports.seodescription = seoData.description;
        exports.seolanguage = seoData.language;

        // Set SoMe data with fallback
        if (PAGE_TYPE === 'article') {
            // SoMe title
            const sometitle = model.get('fields.sometitle') || model.get('fields.teaserTitle') || model.get('fields.title');
            if (sometitle) {
                exports.sometitle = this.api.v1.util.string.stripTags(sometitle);
            }

            // SoMe description
            const somedescription = model.get('fields.somedescription') || model.get('fields.teaserSubtitle') || model.get('fields.subtitle');
            if (somedescription && somedescription.length > 0) {
                exports.somedescription = this.api.v1.util.string.stripTags(somedescription);
            } else {
                let somedescriptionBodytext = model.get('fields.bodytext') || '';
                somedescriptionBodytext = this.api.v1.util.string.stripTags(somedescriptionBodytext);
                exports.somedescription = `${ somedescriptionBodytext.substring(0, 100) } ...`;
            }
        } else if (PAGE_TYPE === 'front') {
            const someimage = model.get('fields.someimage');
            if (someimage != null && someimage !== '') {
                exports.someimage = `${ IMAGE_SERVER }/${ someimage }.webp?width=1200&height=630`;
            }
            exports.sometitle = model.get('fields.sometitle') || model.get('fields.name');
            exports.somedescription = model.get('fields.somedescription') || '';
        }

        exports.simplestreamEnabled = lab_api.v1.config.get('contentbox_settings.simplestream') || false;

        // Mailmojo
        if (exports.device === 'mailmojo') {
            this.setDefaultMailmojoData(model, view);
        }

        // Age disclaimer
        if (PAGE_TYPE === 'article') {
            const ageWarningsConf = lab_api.v1.config.get('page_settings.article.ageWarnings');
            if (Array.isArray(ageWarningsConf)) {
                const publishedTimestamp = model.get('fields.published');
                if (publishedTimestamp) {
                    const ageItem = this.getAgeWarningItem(publishedTimestamp, ageWarningsConf);
                    if (ageItem) {
                        model.setFiltered('ageWarning', ageItem);
                    }
                }
            }
        }

        // Feature flags
        exports.featureFlags = {
            responsive_mobile_fonts: !lab_api.v1.util.featureFlags.enabled('Disable responsive mobile fonts', PAGE_TYPE) // Default enabled
        };

        return exports;
    }

    getAgeWarningItem(timestamp, config) {
        // Validate input and sort by property "years". Largest numbers first.
        const items = Object.values(config)
            .filter((item) => !!item.years && !!item.label)
            .sort((a, b) => b.years - a.years);
        const articleDate = new Date(timestamp * 1000);
        const diffMs = Date.now() - articleDate;
        const ageDate = new Date(diffMs); // miliseconds from epoch
        const diffYears = Math.abs(ageDate.getUTCFullYear() - 1970);
        for (const item of items) {
            if (diffYears >= item.years) {
                return item;
            }
        }
        return null;
    }

    setDefaultMailmojoData(model, view) {
        const language = lab_api.v1.config.get('lang') || 'no';
        model.setFiltered('lang', language);
    }

    getCanonicalUrl(model, pageType, pageId, frontUrl) {
        const canonical = model.get('fields.lab_canonical');
        if (canonical) {
            return canonical;
        }
        if (pageType === 'front') {
            const hostpath = model.get('fields.hostpath');
            if (hostpath) {
                return `${ frontUrl }/${ hostpath === 'index' ? '' : hostpath }`;
            }
        }
        return `${ frontUrl + model.get('fields.published_url') }`;
    }

    getStaticUrl(model, pageType, pageId, frontUrl) {
        if (pageType === 'front') {
            const redirectedUrl = lab_api.v1.util.request.getHeader('X-Labrador-404-Referer');
            if (redirectedUrl) {
                return `${ frontUrl }${ redirectedUrl }`;
            }

            const hostpath = model.get('fields.hostpath');
            if (hostpath) {
                return `${ frontUrl }/${ hostpath === 'index' ? '' : hostpath }`;
            }
            return `${ frontUrl + model.get('fields.published_url') }`;
        }
        return (`${ lab_api.v1.properties.get('site').domain }/a/${ pageId }`);
    }

    // (array) Supports two formats
    // customMetatags [{ key1: 'val1', key2: 'val2' }]
    // customMetatagsKeyVal: [[ { key: 'key3', value: 'val3' }, { key: 'key4', value: 'val4' }]]
    // Return value for the above examples:
    // [[ { key: 'key1', value: 'val1' }, { key: 'key2', value: 'val2' } ], [ { key: 'key3', value: 'val3' }, { key: 'key4', value: 'val4' } ]]
    // Result in template: <meta key1="val1" key2="val2" > <meta key3="val3" key4="val4" >
    // Config customMetatagsKeyVal can be set in admin-tool.
    getCustomMetatags() {
        const metatags = lab_api.v1.config.get('customMetatags') || [];
        const metatagsKeyVal = lab_api.v1.config.get('customMetatagsKeyVal') || [];
        const result = [];
        for (const pairs of metatags) {
            const keyVals = Object.keys(pairs).map((key) => ({ key, value: pairs[key] }));
            result.push(keyVals);
        }
        for (const tag of metatagsKeyVal) {
            if (tag.length) {
                result.push(tag);
            }
        }
        return result;
    }

    getPaywallInfo(model, isEditor) {
        const settings = lab_api.v1.properties.get('paywall');
        const enabled = !isEditor && model.get('fields.paywall') === '1';
        return {
            enabled,
            settings,
            hasAccess: enabled && settings.active ? settings.hasAccess : true,
            hidePaywallOffers: this.api.v1.util.request.getQueryParam('lab_opts') === 'paywall_loginonly',
            requiredProducts: JSON.stringify(this.api.v1.properties.get('app.paywall.requiredProducts') || [])
        };
    }

}
