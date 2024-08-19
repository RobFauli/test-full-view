/*
Input: Articles from Kilkaya Streams (personalized content)
Output: (Array) List of articles, internal format

Data-format:
[{
    "url": "www.kk.no/underholdning/80465481",
    "score": 100,
    "streamitem": "item_0",
    "title": "Nettet koker av Amunds drikkeflaske",
    "image": "https://labrador-www.kk.no/images/80435897.jpg?imageId=80435897&panow=100.18957345972&panoh=30.420168067227&panox=0.18957345971564&panoy=10.053277310924&heightw=47.113402061856&heighth=68.219178082192&heightx=43.120257731959&heighty=0&width=1200&height=630",
    "desc": "",
    "tags": "",
    "section": "underholdning",
    "paid": false
}, ...]
*/
export class KilkayaStreams {

    constructor(options) {
        this.options = {
            ignore: options.ignore || [] // Parts of article to ignore (['image', 'subtitle'])
        };
    }

    map(data) {
        return (data || []).map((article) => this.transformArticle(article));
    }

    allowFragment(name) {
        return !this.options.ignore.includes(name);
    }

    transformArticle(article) {
        const result = {
            type: 'article',
            contentdata: {
                fields: {
                    title: { value: this.allowFragment('title') ? article.title : null },
                    subtitle: { value: this.allowFragment('subtitle') ? article.desc : null },
                    published_url: { value: this.ensureUrlProtocol(article.url) },
                    paywall: { value: article.paid ? '1' : '' }
                },
                primaryTags: {
                    section: article.section
                }
            },
            metadata: {},
            children: []
        };
        if (article.image && this.allowFragment('image')) {
            result.children.push(this.transformImage(this.ensureUrlProtocol(article.image)));
        }
        return result;
    }

    ensureUrlProtocol(url = '', protocol = 'https') {
        if (url.startsWith('//')) {
            return url;
        }
        const newUrl = url.replace('http://', '').replace('https://', '');
        return `${ protocol }://${ newUrl }`;
    }

    transformImage(url) {
        return {
            type: 'image',
            contentdata: {
                fields: {
                    imageurl: { value: url ? encodeURIComponent(url) : '' }
                }
            },
            metadata: {}
        };
    }

}
