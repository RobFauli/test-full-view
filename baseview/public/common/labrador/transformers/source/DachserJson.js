/*
Input from Dachser JSON feed.
(https://example.com?lab_viewport=json)
Data-format:
{
    result: [
        {
            "type": "article",
            "id": 101611,
            "instance_of": 101547,
            "parent": 101610,
            "status": "A",
            "tags": [
                "nyheter"
            ],
            "byline": "Stian Andersen",
            "bylineImage": "/?imageId=100196&cropw=35.175879396985&whRatio=1&x=50&bbRatio=0.13232514177694&croph=52.238805970149",
            "displayByline": "",
            "hideAds": "",
            "kicker": "",
            "lab_site_id": "1",
            "paywall": "",
            "published": "2020-09-20T21:41:41+02:00",
            "url": "/m24/101547",
            "section": "nyheter",
            "showcomments": "",
            "site_alias": "medier24_event",
            "site_id": "14",
            "description": "subtitle Artikkel fra feed-forside #1",
            "title": "Artikkel fra feed-forside #1",
            "images": [
                {
                    "url": "http://image-www-default.localhost?imageId=100240&x=0&y=0&cropw=100&croph=85.774647887324&heightw=100&heighth=85.774647887324&heightx=0&heighty=0",
                    "url_size": "http://image-www-default.localhost/100240.jpg?imageId=100240&x=0&y=0&cropw=100&croph=85.774647887324&width=353&height=159",
                    "default": "1"
                }
            ]
        },
        ...
    ]
}
*/

export class DachserJson {

    constructor(options) {
        this.options = {
            ignore: options.ignore || [] // Parts of article to ignore (['image', 'subtitle'])
        };
    }

    // Input: Object from API.
    // Output: Array of articles.
    map(data) {
        return (data.result || []).map((article) => this.transformArticle(article));
    }

    allowFragment(name) {
        return !this.options.ignore.includes(name);
    }

    transformArticle(article) {
        const result = {
            type: 'article',
            contentdata: {
                id: article.id,
                fields: {
                    title: this.allowFragment('title') ? { value: article.title } : null,
                    subtitle: this.allowFragment('subtitle') ? { value: article.description } : null,
                    kicker: this.allowFragment('kicker') ? { value: article.kicker } : null,
                    published_url: { value: article.url }
                },
                tags: Array.isArray(article.tags) ? article.tags : []
            },
            metadata: article.metadata || {},
            width: article.width || 100,
            widthVp: article.widthVp || {},
            children: []
        };
        if (article.images && article.images.length && this.allowFragment('image')) {
            result.children.push(this.transformImage(article.images[0]));
        }
        return result;
    }

    transformImage(data) {
        return {
            type: 'image',
            contentdata: {
                fields: {},
                instance_of: data.id,
                metadata: {}
            }
        };
    }

}
