export default class Parallax {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const totalGridSize = this.api.v1.config.get('grid.total_grid_spans');
        const layers = [];
        let requireJs = false;

        model.getChildren().forEach((child, index) => {
            const animations = [];
            const supportedAnimations = ['scale', 'rotate', 'opacity', 'blur', 'sepia', 'brightness']; // , 'position.x'
            const staticAttributes = [];
            const supportedStaticAttributes = ['perspective'];
            const childView = this.api.v1.view.getView(child, view.getViewport());
            const data = childView.get('metadata.parallax') || {};
            supportedAnimations.forEach((animationName) => {
                const settings = data[animationName] || {};
                if (settings.active) {
                    requireJs = true;
                    animations.push(JSON.stringify({
                        name: animationName.replace('.', '_'),
                        startValue: settings.startValue || 0,
                        endValue: settings.endValue || 100,
                        startScrollPosition: settings.startScrollPosition || 0,
                        endScrollPosition: settings.endScrollPosition || 100
                    }));
                }
            });
            supportedStaticAttributes.forEach((attributeName) => {
                const settings = data[attributeName] || {};
                if (settings.active) {
                    requireJs = true;
                    staticAttributes.push(JSON.stringify({
                        name: attributeName,
                        value: settings.value || 0
                    }));
                }
            });

            const css = [
                this.api.v1.style.getStyle(child, childView, 'background_color'),
                this.api.v1.style.getStyle(child, childView, 'background_opacity')
            ];

            layers.push({
                index,
                type: child.getType(),
                sticky: !!data.sticky,
                fullwidth: !!data.fullwidth,
                height: data.height || '100',
                spaceBelow: data.spaceBelow || '0',
                position: data.position,
                horizontalAlign: data.horizontalAlign,
                verticalAlign: data.verticalAlign || 'top',
                verticalPosition: data.verticalPosition || 'auto',
                css: css.join(' '),
                grid: {
                    desktop: this.api.v1.grid.percentToGrid(childView.get('width', false, 'desktop'), totalGridSize),
                    mobile: this.api.v1.grid.percentToGrid(childView.get('width', false, 'mobile'), totalGridSize)
                },
                selector: `[data-parallax-layer="${ index }"]`,
                hasAnimations: animations.length > 0 || staticAttributes.length > 0,
                animations,
                staticAttributes
            });
        });

        model.setFiltered('layers', layers);
        model.setFiltered('elementCount', model.children.length);
        model.setFiltered('requireJs', requireJs);
        model.setFiltered('isDebug', this.api.v1.util.request.hasQueryParam('debug'));

        if (!this.api.v1.app.mode.isEditor()) {
            return;
        }
        model.setFiltered('displayNoContent', layers.length === 0);
        model.setFiltered('useReflow', true);

        // Display a list of supported elements:
        const supportedContentTypes = Object.keys(view.getProperty('droppable.drop.sourceType') || {});
        model.setFiltered('supportedContentTypes', supportedContentTypes);
    }

}
