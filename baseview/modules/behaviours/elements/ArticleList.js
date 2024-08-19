export default class ArticleList {

    constructor(api) {
        this.api = api;
        this.isEditor = this.api.v1.app.mode.isEditor();
    }

    onRender(model, view) {
        const grids = view.getAbsoluteGridWidths();
        const columnsDesktop = model.get('fields.columnsDesktop') || this.getFallbackColumns(grids.desktop || 12);
        const columnsMobile = model.get('fields.columnsMobile') || 1;
        model.setFiltered('columns', {
            desktop: columnsDesktop,
            mobile: columnsMobile
        });

        if (!this.isEditor) { return; }
        const layout = model.get('fields.layout');
        const layoutOptions = [
            {
                value: 'default',
                label: 'Horizontal',
                selected: layout === 'default'
            },
            {
                value: 'vertical',
                label: 'Vertical',
                selected: layout === 'vertical'
            }
        ];
        const imageLayout = model.get('fields.imageLayout');
        const imageLayoutOptions = [
            {
                value: 'full',
                label: '100% width',
                selected: imageLayout === 'full'
            },
            {
                value: 'left',
                label: 'Align Left',
                selected: imageLayout === 'left'
            },
            {
                value: 'right',
                label: 'Align Right',
                selected: imageLayout === 'right'
            }
        ];
        model.setFiltered('layoutOptions', layoutOptions);
        model.setFiltered('imageLayoutOptions', imageLayoutOptions);
    }

    getFallbackColumns(grid) {
        if (grid >= 10) return 4;
        if (grid >= 7) return 3;
        if (grid >= 5) return 2;
        return 1;
    }

}
