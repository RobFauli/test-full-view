import { utils } from '../utils.js';

export class RowsAndColumns {

    constructor(options) {
        const layout = options.layout || {};
        this.options = {
            columnCount: layout.columnCount || 3,
            rowCount: layout.rowCount || 4,
            grid_size: layout.grid_size || 12,
            maxPixelWidth: layout.maxPixelWidth || 1000,
            imageAspectRatio: layout.imageAspectRatio || 0.6, // height / width
            selector: layout.selector || ''
        };
    }

    // (ClientData)
    map(clientData) {
        const decoratedRows = [];
        const rows = utils.groupRowsAndColums(clientData.getData(), this.options);
        for (const articles of rows) {
            utils.decorateRow(articles, this.options);
            decoratedRows.push({
                type: 'row',
                selector: this.options.selector || '',
                children: articles
            });
        }
        clientData.setData(decoratedRows);
        return clientData;
    }

}
