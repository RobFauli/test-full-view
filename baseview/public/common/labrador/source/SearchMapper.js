/**
 * Modify data for each article in the search result
 * Set styling and content
 */
export class SearchMapper {

    constructor(settings) {
        this.bodytextLength = settings.bodytextLength || 0;
        this.fallbackImage = settings.fallbackImage; // Define in admin: /settings/cp?page=fallback_image
        this.sites = settings.sites;
        this.sitesById = {};
    }

    // (ClientData)
    map(clientData) {
        clientData.setData(
            clientData.getData().map((itm) => {
                const item = { ...itm };
                if (item.children && item.children[0]) {
                    const image = item.children[0];
                    image.contentdata.fields.float = { vp: { desktop: 'floatLeft' } };
                    image.contentdata.fields.width = { vp: { desktop: 160, mobile: 200 } };
                    image.contentdata.fields.whRatio = { vp: { desktop: 0.65 } };
                } else if (this.fallbackImage) {
                    item.children.push({
                        type: 'image',
                        contentdata: {
                            fields: {
                                imageurl: { value: `${ this.fallbackImage }` },
                                float: { vp: { desktop: 'floatLeft' } },
                                width: { vp: { desktop: 160, mobile: 200 } },
                                whRatio: { vp: { desktop: 0.65 } }
                            }
                        },
                        metadata: {
                            style_preset: { value: 'fallbackImage' }
                        }
                    });
                }
                item.contentdata.fields.subtitle.value = this.trimBodytext(item.contentdata.fields.subtitle.value, item);
                item.contentdata.fields.subtitle.value += `<span class="info"><span class="sitealias label">${ this.siteIdToDisplayName(item.contentdata.fields.site_id.value) }</span> <span class="date fi-clock"> ${ this.dateToAge(item.contentdata.fields.published.value) }</span> <span class="section_tag fi-price-tag"> ${ item.contentdata.primaryTags.section }</span></span>`;
                return item;
            })
        );
        return clientData;
    }

    trimBodytext(value, item) {
        if (value) {
            return value;
        }
        const txt = item.contentdata.fields.bodytext.value || '';
        const maxLength = this.bodytextLength;
        if (maxLength === 0) {
            return '';
        }
        if (txt.length > maxLength) {
            return `${ txt.substring(0, maxLength)  } ...`;
        }
        return txt;
    }

    siteIdToDisplayName(siteId) {
        const id = parseInt(siteId, 10);
        if (this.sitesById[siteId] === undefined) {
            this.sitesById[siteId] = (this.sites.filter((site) => site.id === id).pop() || {}).displayName;
        }
        return this.sitesById[siteId];
    }

    dateToAge(isoDateString) {
        if (!isoDateString) {
            return '';
        }
        const d = new Date(isoDateString);
        return `${ d.toLocaleDateString() } - ${ d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }`;
    }

}
