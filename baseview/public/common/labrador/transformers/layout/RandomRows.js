import { utils } from '../utils.js';

export class RandomRows {

    constructor(options) {
        const layout = options.layout || {};
        this.options = {
            maxPixelWidth: layout.maxPixelWidth || 1000,
            imageAspectRatio: layout.imageAspectRatio || 0.6, // height / width
            maxRowSize: layout.maxRowSize || 4,
            minRowSize: layout.minRowSize || 1,
            selector: layout.selector || '',
            grid_size: layout.grid_size || 12
        };
    }

    // (ClientData) Add all supplied articles to rows.
    // Input is an array of articles
    // Use randow numer of columns for each row:
    // Range: [this.options.minRowSize - this.options.maxRowSize]
    map(clientData) {
        const data = clientData.getData();
        const result = [];
        if (!data.length) {
            return clientData;
        }
        const rows = [];
        let currentRow = [];
        let count = this.getRandomInt(this.options.minRowSize, this.options.maxRowSize);

        for (const article of data) {
            if (currentRow.length >= count) {
                rows.push(currentRow);
                currentRow = [];
                const lastCount = count;
                count = this.getRandomInt(this.options.minRowSize, this.options.maxRowSize);
                if (count === lastCount) {
                    // Try to avoid two following rows with same column-count
                    count = this.getRandomInt(this.options.minRowSize, this.options.maxRowSize);
                }
            }
            currentRow.push(article);
        }
        rows.push(currentRow);

        for (const articles of rows) {
            // Set width of each article/image in row:
            utils.decorateRow(articles, this.options);
            result.push({
                type: 'row',
                selector: this.options.selector || '',
                children: articles
            });
        }
        clientData.setData(result);
        return clientData;
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

}
