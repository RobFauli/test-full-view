import { AutodataHelper } from '../../lib/helpers/AutodataHelper.js';
import { DateTimeHelper } from '../../lib/helpers/datetime/DateTimeHelper.js';

export default class ArticleScroller {

    constructor(api) {
        this.api = api;
        this.config = this.api.v1.config.get('contentbox_settings.articlescroller') || {
            sources: {
                all: {
                    // eslint-disable-next-line no-template-curly-in-string
                    src: '${front_api_url}/api/v1/article/?orderBy=published&query=visibility_status:P%20AND%20published:[*%20NOW]%20AND%20showonfp:1&site_id={{ data.site_id }}&limit={{ data.articleCount }}',
                    data_type: 'labrador',
                    is_default: true
                }
            },
            imageAspectRatio: 0.5,
            visibleArticleCount: 4,
            visibleArticleCountMobile: 1
        };
        this.preferredImageFormat = lab_api.v1.image.getPreferredImageFormat();
        this.isEditor = this.api.v1.app.mode.isEditor();
        this.sourceList = this.getSourceList();
        this.domain = this.api.v1.site.getSite().domain || this.api.v1.properties.get('customer_front_url');
    }

    onViewHelper(model) {
        const source = model.get('fields.source') || this.getDefaultSource(this.sourceList);
        const siteId = model.get('fields.site_id');
        const articleCount = model.get('fields.articleCount') || 10;

        if (this.sourceList[source] && this.sourceList[source].src) {
            let siteIdFromAlias = null;
            if (this.sourceList[source].defaultsiteAlias) {
                const site = this.api.v1.site.getSite(this.sourceList[source].defaultsiteAlias);
                if (site) {
                    siteIdFromAlias = site.id;
                }
            }

            const dateLimitFrom = model.get('fields.dateLimitFrom'); // "today". Can add more options if needed: "tomorrow", "next_week" etc.
            const dateLimitTo = model.get('fields.dateLimitTo'); // "today". Can add more options if needed: "tomorrow", "next_week" etc.
            const dateHander = new DateTimeHelper();
            const todayString = dateHander.formattedUtcDate(new Date(), 'Y-m-d');
            let dateQuery = '';
            if (dateLimitFrom === 'today') {
                dateQuery = `calendar_start_date:[${  todayString  }T00:00:00Z%20TO%20*]%20AND%20`;
            }
            if (dateLimitTo === 'today') {
                dateQuery += `calendar_end_date:[*%20TO%20${  todayString  }T23:59:59Z]%20AND%20`;
            }

            const data = {
                site_id: siteId || siteIdFromAlias,
                front_api_url: this.api.v1.properties.get('front_api_url'),
                articleCount,
                dateQuery
            };

            // Todo: Do not use Mustache directly to render. Use Labrador API.
            const url = Mustache.render(this.sourceList[source].src, { data });
            model.setFiltered('url', url);
        } else {
            Sys.logger.warning(`ArticleScroller: Missing config for source "${ source }". Cannot fetch data. Check config.`);
        }
    }

    onRender(model, view) {
        const source = model.get('fields.source') || this.getDefaultSource(this.sourceList);
        const paywallLabel = {
            text: { content: 'Pluss' },
            icon: { content: 'fi-plus' },
            display: true,
            ...this.api.v1.config.get('paywall.label')
        };

        if (paywallLabel.display) {
            model.setFiltered('paywallLabel', paywallLabel);
        }

        let visibleArticleCount = model.get('fields.visibleArticleCount') || this.api.v1.config.get('contentbox_settings.articlescroller.visibleArticleCount') || 4;
        const visibleArticleCountMobile = model.get('fields.visibleArticleCountMobile') || this.api.v1.config.get('contentbox_settings.articlescroller.visibleArticleCountMobile') || 2;
        const maxVisibleArticleCount = visibleArticleCount;
        const maxVisibleArticleCountMobile = visibleArticleCountMobile;
        const restrictHeight = this.config.restrictHeight || false;
        const hideImages = !!model.get('fields.hideImages');
        const showAuthor = !!model.get('fields.showAuthor');
        const hideNavigation = !!model.get('fields.hideNavigation');
        const transitionDuration = model.get('fields.transitionDuration') || 4000; // Milliseconds between each animation
        const transitionStepPercent = model.get('fields.transitionStep') || 15; // Percent. CSS-transition. 100 result in a steady movement, any lower will scroll and stop for each iteration.
        const transitionStepDuration = (((transitionDuration / 1000) / 100) * transitionStepPercent).toFixed(2);

        if (view.viewport === 'mobile') {
            visibleArticleCount = visibleArticleCountMobile;
        }

        let pixelDensityFactor = this.api.v1.view.getPixelDensityFactor();
        if (view.get('metadata.hasFullWidth')) {
            pixelDensityFactor += 0.2;
        }
        const imageSize = {};
        imageSize.aspectRatio = model.get('fields.aspectRatio') || this.api.v1.config.get('contentbox_settings.articlescroller.imageAspectRatio') || this.api.v1.config.get('image.defaultAspectRatio');
        imageSize.width = Math.ceil(this.api.v1.viewport.getWidth(view.viewport) / visibleArticleCount);
        imageSize.height = Math.floor(imageSize.width * imageSize.aspectRatio);

        const external = view.get('external');
        const articleCount = model.get('fields.articleCount') || 10;
        const mappers = this.config.externalMappers || {};
        const sourceObj = this.sourceList[source] || {};

        let data = this.mapExternalData(external, sourceObj.data_type, {
            aspectRatio: imageSize.aspectRatio,
            imageServer: this.api.v1.properties.get('image_server'),
            width: Math.floor(imageSize.width * pixelDensityFactor),
            height: Math.floor(imageSize.height * pixelDensityFactor),
            baseUrl: sourceObj.baseUrl || '',
            hideImages,
            showAuthor
        }, mappers);
        if (Array.isArray(data) && data.length > 0) data = data.slice(0, articleCount);
        if (visibleArticleCount > data.length) visibleArticleCount = data.length;
        if (visibleArticleCount < 1) visibleArticleCount = 1;

        model.setFiltered('useNavigation', !hideNavigation && data.length > visibleArticleCount);
        model.setFiltered('visibleArticleCount', visibleArticleCount);
        model.setFiltered('maxVisibleArticleCount', maxVisibleArticleCount);
        model.setFiltered('maxVisibleArticleCountMobile', maxVisibleArticleCountMobile);
        model.setFiltered('restrictHeight', restrictHeight);
        model.setFiltered('hideImages', hideImages);
        model.setFiltered('showAuthor', showAuthor);
        model.setFiltered('transitionDuration', transitionDuration);
        model.setFiltered('transitionStep', transitionStepDuration);
        model.setFiltered('data', data);
        model.setFiltered('width', imageSize.width);
        model.setFiltered('height', imageSize.height);
        model.setFiltered('labels', this.config.labels || {
            buttonLeft: 'Rull til venstre',
            buttonRight: 'Rull til høyre'
        });

        if (this.isEditor) {
            model.setFiltered('transitionDurationSeconds', transitionDuration / 1000);
        }
        if (!this.isEditor) {
            model.setFiltered('lazyloadImages', this.api.v1.config.get('imageLoading.lazy') || false);
        } else if (sourceObj.src) {
            const adminView = {};

            // Options for "source" (fields.source)
            const sourceOptions = [];
            for (const sourceName of Object.keys(this.sourceList)) {
                sourceOptions.push({
                    value: sourceName,
                    selected: sourceName === source
                });
            }
            adminView.sources = sourceOptions;

            // Options for "site_id" (fields.site_id)
            const site_idOptions = [{
                value: '',
                name: 'Any site'
            }];
            const selectedSiteId = parseInt(model.get('fields.site_id') || this.getSiteIdFromAlias(source), 10);
            this.api.v1.site.getSites().forEach((site) => {
                site_idOptions.push({
                    value: site.id,
                    name: site.display_name,
                    selected: site.id === selectedSiteId
                });
            });
            adminView.site_ids = site_idOptions;

            const dateLimitFrom = model.get('fields.dateLimitFrom'); // "today". Can add more options if needed: "tomorrow", "next_week" etc.
            const dateLimitTo = model.get('fields.dateLimitTo'); // "today". Can add more options if needed: "tomorrow", "next_week" etc.
            // Options for fields.dateLimitFrom / fields.dateLimitTo
            adminView.dateLimit = {
                from: [{
                    value: 'today',
                    name: 'Today',
                    selected: dateLimitFrom === 'today'
                }],
                to: [{
                    value: 'today',
                    name: 'Today',
                    selected: dateLimitTo === 'today'
                }]
            };

            // Options for layout align (fields.layoutAlign)
            const layoutAlign = model.get('fields.layoutAlign'); // "left", "centered", "right"
            adminView.layout = {
                align: [{
                    value: 'left',
                    name: 'Align Left',
                    selected: layoutAlign === 'left'
                }, {
                    value: 'centered',
                    name: 'Align centered',
                    selected: layoutAlign === 'centered'
                }, {
                    value: 'right',
                    name: 'Align right',
                    selected: layoutAlign === 'right'
                }]
            };


            // Add custom layout if present.
            const additionalLayout = this.api.v1.config.get('contentbox_settings.articlescroller.layout') || false;
            if (additionalLayout) {
                additionalLayout.forEach(item => {
                    if (item && typeof item.value !== 'undefined') {
                        item.selected = item.value === layoutAlign;
                        if (item.value === layoutAlign) {
                            item.selected = true;
                        } else {
                            item.selected = false;
                        }
                    }
                    adminView.layout.align.push(item);
                });
            }

            adminView.aspectRatio = imageSize.aspectRatio;

            model.setFiltered('options', adminView);
        }
    }

    getSourceList() {
        const result = {};
        for (const name of Object.keys(this.config.sources || {})) {
            result[name] = this.config.sources[name];
        }
        const feeds = this.api.v1.config.get('feeds') || {};
        for (const name of Object.keys(feeds)) {
            if (feeds[name].format === 'json' && feeds[name].labrador_json) {
                let urlObj;
                try {
                    urlObj = new URL(feeds[name].url);
                } catch (e) {
                    urlObj = null;
                }

                const domain = urlObj
                    ? urlObj.origin
                    : this.domain;

                result[name] = {
                    src: feeds[name].url,
                    data_type: 'labrador_json',
                    is_default: false,
                    baseUrl: domain
                };
            }
        }
        return result;
    }

    getDefaultSource(config) {
        for (const key of Object.keys(config)) {
            if (config[key].is_default) return key;
        }
        const [first = null] = Object.keys(config) || [];
        return first;
    }

    getSiteIdFromAlias(source) {
        if (this.sourceList[source].defaultsiteAlias) {
            const site = this.api.v1.site.getSite(this.sourceList[source].defaultsiteAlias);
            if (site) {
                return site.id;
            }
        }
        return null;
    }

    mapExternalData(data, data_type, settings, extraMappers) {
        switch (data_type) {
            case 'ntb':
                return this.mapNtb(data, settings);
            case 'advokatjobb':
                return this.mapAdvokatjobb(data, settings);
            case 'labrador_json':
                return this.mapLabradorJson(data, settings);
            case 'labrador_compliant':
                return this.mapLabradorCompliant(data, settings);
            default: // "labrador"
                try {
                    if (Object.keys(extraMappers).includes(data_type)) {
                        const element = extraMappers[data_type].split('.');
                        let functionReference = window;
                        for (let i = 0; i < element.length; i += 1) {
                            functionReference = functionReference[element[i]];
                        }
                        let result = null;
                        if (functionReference) {
                            result = functionReference(data, settings);
                            if (result) {
                                return result;
                            }
                        }
                    }
                } catch (e) {
                    Sys.logger.warning('Faulty extraMapper function.');
                }
                return this.mapLabrador(data, settings);
        }
    }

    mapNtb(data, settings) {
        const result = [];
        if (!data.releases) return result;
        data.releases.forEach((article) => {
            let imageUrl = false;
            let iconImageUrl = null;
            if (!settings.hideImages && article.images.length) {
                imageUrl = article.images[0].thumbnail_16_9 || false;
            }
            if (article.logos.length) {
                iconImageUrl = article.logos[0].thumbnail_original || false;
            }
            if (!settings.hideImages && !imageUrl && article.logos.length) {
                imageUrl = article.logos[0].thumbnail_16_9 || false;
            }
            const thisArticle = {
                url: `https://www.ntbinfo.no${  article.url }`,
                title: article.title,
                subtitle: article.leadtext,
                image: imageUrl,
                iconImage: iconImageUrl
            };
            result.push(thisArticle);
        });
        return result;
    }

    mapAdvokatjobb(data, settings) {
        const result = [];
        if (!data.Jobs) return result;
        data.Jobs.forEach((article) => {
            let img = false;
            let description = '';
            if (article.Company) {
                if (!settings.hideImages && article.Company.Logo) {
                    img = settings.baseUrl + article.Company.Logo;
                }
                if (article.Company.Name) {
                    description = `${ article.Company.Name  } - `;
                }
            }
            const thisArticle = {
                url: settings.baseUrl + article.Url,
                title: description + article.Title,
                subtitle: `${ article.Location  } - ${  article.DueDate }`,
                image: img,
                iconImage: null
            };
            result.push(thisArticle);
        });
        return result;
    }

    mapLabradorJson(data, settings) {
        const result = [];
        if (!data || !data.result) return result;
        const imgArgs = [
            `width=${  settings.width }`,
            `height=${  settings.height }`
        ];
        data.result.forEach((article) => {
            const autodata = AutodataHelper.parseCustomDataFromFeed(article, 'contentbox_settings.articlescroller');
            let url = '';
            if (article.url) {
                if (article.url.indexOf('http') === 0 || article.url.indexOf('//') === 0) {
                    url = article.url;
                } else {
                    url = settings.baseUrl + article.url;
                }
            }
            const thisArticle = {
                url,
                title: article.teaserTitle ? article.teaserTitle : article.title,
                kicker: article.kicker || article.teaserKicker || '',
                subtitle: article.teaserSubtitle ? article.teaserSubtitle : article.description,
                image: !settings.hideImages && article.images && article.images.length ? (`${ article.images[0].url  }&${  imgArgs.join('&') }`) : false,
                autodata: autodata || '',
                section: article.section || '',
                paywall: !!article.paywall,
                author: article.byline || ''
            };
            result.push(thisArticle);
        });
        return result;
    }

    mapLabrador(data, settings) {
        const result = [];
        if (!data || !data.result) return result;
        const imgArgs = [
            `width=${  settings.width }`,
            `height=${  settings.height }`
        ];
        if (this.preferredImageFormat && this.preferredImageFormat !== 'jpg') {
            imgArgs.push(`format=${ this.preferredImageFormat }`);
        }
        data.result.forEach((article) => {
            const autodata = AutodataHelper.parseCustomDataFromFeed(article, 'contentbox_settings.articlescroller');
            const thisArticle = {
                url: article.siteDomain + article.published_url,
                title: article.title,
                kicker: article.kicker || article.teaserKicker || '',
                subtitle: article.subtitle,
                image: !settings.hideImages && article.frontCropUrl ? (`${ settings.imageServer  }/${  article.frontCropUrl  }&${  imgArgs.join('&') }`) : false,
                autodata: autodata || '',
                section: article.section || '',
                paywall: !!article.paywall,
                author: article.byline || ''
            };
            result.push(thisArticle);
        });
        return result;
    }

    mapLabradorCompliant(data, settings) {
        const result = [];
        if (!data || !data.result) return result;
        const imgArgs = [
            `width=${  settings.width }`,
            `height=${  settings.height }`
        ];

        data.result.forEach((article) => {
            let imageUrl = false;
            if (!settings.hideImages && article.images && Array.isArray(article.images) && article.images.length > 0) {
                imageUrl = `${ settings.imageServer  }/?imageUrl=${  article.images[0].url  }&${  imgArgs.join('&') }`;
            }
            const thisArticle = {
                url: article.url,
                title: article.title,
                kicker: article.kicker || '',
                subtitle: article.subtitle,
                section: article.section || '',
                image: imageUrl,
                paywall: !!article.paywall,
                author: article.byline || ''
            };
            result.push(thisArticle);
        });
        return result;
    }

}
