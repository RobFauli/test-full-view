import { DateTimeHelper } from '../../lib/helpers/datetime/DateTimeHelper.js';

export default class ArticleCalendar {

    constructor(api) {
        this.api = api;
    }

    onViewHelper(model) {
        const site_id = model.get('fields.site_id') || null;
        const articleCount = model.get('fields.articleCount') || 6;
        const dateHander = new DateTimeHelper();
        const startDate = `${ dateHander.formattedUtcDate(new Date(), 'Y-m-d')  }T00:00:00Z`;
        const options = {
            baseUrl: `${ this.api.v1.properties.get('front_api_url')  }/api/v1/article/?`,
            urlParams: {
                orderBy: 'calendar_start_date',
                order: 'asc', // asc, desc
                site_id,
                limit: articleCount,
                htmlText: 1
            },
            urlQueryParam: {
                visibility_status: 'P',
                published: '[*%20NOW]',
                calendar_start_date: `[${  startDate  }%20TO%20*]`
            }
        };
        const urlParams = [];
        for (const key in options.urlParams) {
            if (options.urlParams[key]) {
                urlParams.push(`${ key  }=${  options.urlParams[key] }`);
            }
        }
        const urlQueryParams = [];
        for (const key in options.urlQueryParam) {
            if (options.urlQueryParam[key]) {
                urlQueryParams.push(`${ key  }:${  options.urlQueryParam[key] }`);
            }
        }
        urlParams.push(`query=${  urlQueryParams.join('%20AND%20') }`);
        const parsedUrl = options.baseUrl + urlParams.join('&');
        model.setFiltered('url', parsedUrl);
    }

    onRender(model, view) {
        const externalData = view.get('external');
        const site_id = model.get('fields.site_id') || '';

        const displayImage = model.get('fields.displayImage');
        const displayTitle = model.get('fields.displayTitle') || null;
        const displaySubtitle = model.get('fields.displaySubtitle');

        const imageServer = this.api.v1.properties.get('image_server');
        const imageWidth = 420;
        const aspectRatio = this.api.v1.config.get('contentbox_settings.articleCalendar.imageAspectRatio') || this.api.v1.config.get('image.defaultAspectRatio');
        const imgArgs = [
            `width=${  imageWidth }`,
            `height=${  Math.floor(imageWidth * aspectRatio) }`,
            `format=${ this.api.v1.image.getPreferredImageFormat() }`
        ];

        if (this.api.v1.app.mode.isEditor()) {
            const adminView = {
                displayImage: !!displayImage,
                displayTitle: displayTitle === null ? true : !!displayTitle,
                displaySubtitle: !!displaySubtitle
            };

            // Options for "site_id" (fields.site_id)
            const site_idOptions = [{
                value: '',
                name: 'Any site'
            }];
            this.api.v1.site.getSites().forEach((site) => {
                site_idOptions.push({
                    value: site.id,
                    name: site.display_name,
                    selected: site_id && site.id === parseInt(site_id, 10)
                });
            });

            adminView.site_ids = site_idOptions;
            model.setFiltered('options', adminView);
        }

        if (externalData) {
            // Format data:
            const result = [];
            externalData.result.forEach((article) => {
                const articleData = {
                    url: article.published_url
                };
                if (displayTitle) {
                    articleData.title = article.teaserTitle || article.title;
                }
                if (displaySubtitle) {
                    articleData.subtitle = article.teaserSubtitle || article.subtitle;
                }
                if (displayImage && article.frontCropUrl) {
                    articleData.calendarimage = `${ imageServer }/${ article.frontCropUrl }&${ imgArgs.join('&') }`;
                }
                result.push(articleData);
            });
            model.setFiltered('data', result);
        }
    }

}
