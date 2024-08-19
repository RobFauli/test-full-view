/**
 * Modify data for each article in the search result
 * Set styling and content
 * Input is an array of articles
 * Output is an array of rows
 */
export class FrontContentMapper {

    constructor(settings) {
        this.layout = settings.layout || {};
        this.hide_items = this.layout.hide_items || [];
        this.alignImage = settings.alignImage ? `float${ settings.alignImage.charAt(0).toUpperCase() + settings.alignImage.slice(1) }` : '';
        this.fallbackImage = settings.fallbackImage; // Define in admin: /settings/cp?page=fallback_image
        this.imageWidth = settings.imageWidth;
    }

    // (ClientData)
    map(clientData) {
        clientData.setData(
            clientData.getData().map((itm) => {
                const item = { ...itm };
                if (item.children && item.children[0]) {
                    const image = item.children[0];
                    image.contentdata.fields.float = { vp: { desktop: this.alignImage } };
                    image.contentdata.fields.whRatio = { vp: { desktop: this.layout.imageAspectRatio || 0.5 } };
                    image.width = { vp: { desktop: this.imageWidth, mobile: 100 } };
                } else if (this.fallbackImage) {
                    item.children.push({
                        type: 'image',
                        contentdata: {
                            fields: {
                                imageurl: { value: `${ this.fallbackImage }` },
                                float: { vp: { desktop: this.alignImage } },
                                whRatio: { vp: { desktop: this.layout.imageAspectRatio || 0.5 } }
                            }
                        },
                        width: { vp: { desktop: this.imageWidth, mobile: 100 } },
                        metadata: {
                            style_preset: { value: 'fallbackImage' }
                        }
                    });
                }
                for (const part of this.hide_items) {
                    switch (part) {
                        case 'title':
                            item.metadata.hideTitle = { value: true };
                            break;
                        case 'subtitle':
                            item.metadata.hidesubtitle = { value: true };
                            break;
                        case 'image':
                            item.metadata.hideimage = { value: true };
                            break;
                        default:
                            break;
                    }
                }
                if (!this.hide_items.includes('kicker')) {
                    item.metadata.showKicker = { value: true };
                }
                return item;
            })

// 0
// : 
// "title"
// 1
// : 
// "subtitle"
// 2
// : 
// "image"
// 3
// : 
// "kicker"
        );
        return clientData;
    }

}
