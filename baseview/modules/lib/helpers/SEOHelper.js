export class SEOHelper {

    constructor({
        pageType = '',
        canonical = '',
        isTagpage = false,
        isTagpageWithFrontpage = false,
        tagpagePath = '/tag/'
    } = {}) {
        this.settings = {
            pageType,
            canonical,
            isTagpage,
            isTagpageWithFrontpage,
            tagpagePath
        };
        this.cache = {
            seoData: null
        };
    }

    /**
     * Generates and returns JSON-LD data based on configurations and page type.
     *
     * @param {LabModel} model The data model of the current node.
     * @returns Structured JSON-LD data.
     */
    getStructuredData(model) {
        if (model.get('fields.jsonld_json')) {
            return model.get('fields.custom_jsonld');
        }
        if (this.settings.pageType === 'front') {
            return this.generateFrontData(model);
        }
        if (this.settings.pageType === 'article') {
            return this.generateArticleData(model);
        }
        return null;
    }

    generateSiteData(model) {
        return {
            '@context': 'http://schema.org',
            '@type': 'WebSite',
            name: lab_api.v1.properties.get('site.display_name'),
            url: lab_api.v1.properties.get('site.domain') || ''
            /*
            sameAs: [
                'https://facebook.com/mypage',
                'https://instagram.com/site',
                'https://twitter.com/name'
            ],
            potentialAction: {
            '@type': 'SearchAction',
            'target': 'http://example.com/pages/search_results?q={search_term}',
            'query-input': 'required name=search_term'
            }
            */
        };
    }

    generateFrontData(model) {
        const seoData = this.getSEOData(model);
        return {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: seoData.title,
            description: seoData.description
        };
    }

    generateArticleData(model) {
        const seoData = this.getSEOData(model);
        const output = {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: seoData.title,
            description: seoData.description,
            availableLanguage: [
                {
                    '@type': 'Language',
                    alternateName: seoData.language
                }
            ],
            author: lab_api.v1.model.query.getChildrenOfType(model, 'byline', true).map((byline) => {
                let firstname = byline.get('fields.firstname');
                if (firstname === 'Byline first name') { firstname = ''; }
                let lastname = byline.get('fields.lastname');
                if (lastname === 'Byline last name') { lastname = ''; }
                const result = {
                    '@type': 'Person',
                    name: `${ firstname } ${ lastname }`
                };

                const public_url = byline.get('fields.public_url');
                if (public_url) {
                    result.url = public_url;
                }

                const image = (byline.children || []).filter((child) => child.type === 'image')[0];
                if (image) {
                    result.image = {
                        '@type': 'ImageObject',
                        url: `${ image.get('fields.imageurl') }&width=250`
                    };
                }

                const public_email = byline.get('fields.public_email');
                if (public_email) {
                    result.email = public_email;
                }

                return result;
            }),
            publisher: {
                '@type': 'Organization',
                name: lab_api.v1.properties.get('site.display_name'),
                logo: {
                    '@type': 'ImageObject',
                    url: lab_api.v1.config.get('logo.default.src')
                }
            }
        };

        if (model.get('fields.published')) {
            output.datePublished = new Date(parseInt(model.get('fields.published'), 10) * 1000).toISOString();
        }

        if (model.get('fields.modified')) {
            output.dateModified = new Date(parseInt(model.get('fields.modified'), 10) * 1000).toISOString();
        }

        if (model.get('fields.paywall') === '1') {
            output.isAccessibleForFree = true;
            output.hasPart = {
                '@type': 'WebPageElement',
                isAccessibleForFree: false,
                cssSelector: '.teaserContent'
            };
        }

        return output;
    }

    /**
     * Returns SEO data such as Title and Description for a frontpage or article.
     * Method may be called several times, uses cache.
     *
     * @param {model} model The data model of the current node.
     * @returns {Object} SEO title and description of the current page.
     */
    getSEOData(model) {
        if (this.cache.seoData) { return this.cache.seoData; }
        let language;
        let title;
        let description;
        if (this.settings.pageType === 'article') {
            title = model.get('fields.seotitle') || model.get('fields.title') || '';
            description = model.get('fields.seodescription') || model.get('fields.subtitle') || '';
            language = model.get('fields.seolanguage') || lab_api.v1.config.get('contentLanguage');
        } else {
            if (this.settings.isTagpage && !this.settings.isTagpageWithFrontpage) {

                // Todo: Backend should deliver an array of tags.
                const tagPath = this.settings.tagpagePath.replace(/\//g, '');
                const tagsString = this.settings.canonical.split(this.settings.tagpagePath)[1] || '';
                const tags = tagsString.split('/').filter((item) => !!item);

                // Data for mustache-template
                const data = {
                    tag: tags[tags.length - 1],
                    tags,
                    tagPath
                };

                // Get the template from locale and render with tagPath and tag from data
                title = lab_api.v1.locale.get('tags.title_text', {
                    data
                });

            } else {
                title = model.get('fields.seotitle') || model.get('fields.name') || '';
            }
            description = model.get('fields.seodescription') || '';
        }

        this.cache.seoData = {
            title: title.charAt(0).toUpperCase() + title.slice(1),
            description,
            language
        };
        return this.cache.seoData;
    }

}
