// Usage:
// model.setFiltered('movableStyle', Movable.createStyle(model, 'metadata.contentPosition', ['desktop', 'mobile']));

export class Movable {

    static mediaQueries = {
        desktop: '(min-width:1024px)',
        mobile: '(max-width: 1023px)'
    };

    static createStyle(model, path, viewports, mediaQueries = this.mediaQueries) {
        const items = [];
        for (const viewport of viewports) {
            const vpData = mediaQueries[viewport] ? model.get(path, viewport) : null; // { x, y, selector }
            if (vpData) {
                items.push(`@media ${ mediaQueries[viewport] } { ${ vpData.selector } { transform: translate(${ vpData.x }px, ${ vpData.y }px); } }`);
            }
        }
        return `<style>${ items.join('\n') }</style>`;
    }

}
