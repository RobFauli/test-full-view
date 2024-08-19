export class Spacing {

    static mediaQueries = {
        desktop: '(min-width:1024px)',
        mobile: '(max-width: 1023px)'
    };

    static createStyle({
        model, view, viewports, styleCollection = 'content_inline_spacing', mediaQueries = this.mediaQueries, returnArray = false
    }) {
        const items = [];
        const selector = `[data-element-guid="${ model.getGuid() }"] .content`;
        for (const viewport of viewports) {
            if (mediaQueries[viewport]) {
                const vpStyle = lab_api.v1.style.getStyles(model, view, styleCollection, viewport);
                if (vpStyle) {
                    items.push(`@media ${ mediaQueries[viewport] } { ${ selector } { ${ vpStyle } } }`);
                }
            }
        }
        return returnArray ? items : `<style>${ items.join('\n') }</style>`;
    }

}
