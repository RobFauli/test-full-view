export const utils = {

    // (void) Set article and image sizes.
    // Modify data in place.
    decorateRow: (row, options) => {
        const widths = utils.distributePercent(100, row.length, options.grid_size);
        for (const article of row) {
            article.width = widths.shift();
        }
    },

    // (array) Add articles to columns in rows.
    groupRowsAndColums: (data, options) => {
        const rows = [];
        let currentRow = [];
        for (const article of data) {
            if (currentRow.length >= options.columnCount) {
                rows.push(currentRow);
                if (rows.length >= options.rowCount) {
                    return rows;
                }
                currentRow = [];
            }
            currentRow.push(article);
        }
        rows.push(currentRow);
        return rows;
    },

    // (int) Convert a percent-value to a grid-value
    // Example for 12-grid system: 50 -> 6
    percentToGrid: (percentValue, totalGridSize = 12) => Math.round((percentValue / 100) * totalGridSize),

    // (float) Convert a grid-value to a percent value.
    // Example for 12-grid system: 6 -> 50
    gridToPercent: (gridValue, totalGridSize = 12) => utils.floatPrecision((gridValue / totalGridSize) * 100),

    // (float) Precision: 2 decimals. Always use this method to set grid-widths to keep format consistent.
    // Examples: 33.333333 -> 33.33, 50 -> 50
    floatPrecision: (size) => parseFloat(parseFloat(size).toFixed(2)),

    // (array) How to space for example 5 items in 100% in a 12-grid system?
    // 100/5 = 20, this will result in 5 items using grid-2 ... 2 short ...
    distributePercent: (size, count, totalGridSize = 12) => {
        const grids = utils.distributeGrid(utils.percentToGrid(size, totalGridSize), count);
        return grids.map((g) => utils.gridToPercent(g, totalGridSize));
    },

    // (array)
    distributeGrid: (gridSize, requestedCount) => {
        let count = requestedCount;
        if (count > gridSize) {
            count = gridSize;
            Sys.logger.warn(`grid.distributeGrid: Requested count ${ requestedCount } is larger than gridSize ${ gridSize }. Will use count ${ count }.`);
        }
        const oneGrid = gridSize / count;
        if (Number.isInteger(oneGrid)) {
            return Array(count).fill(oneGrid);
        }
        let used = 0;
        let up = true;
        let result = [];
        for (let i = 0; i < count; i++) {
            const fullGridValue = up ? Math.ceil(oneGrid) : Math.floor(oneGrid);
            result.push(fullGridValue);
            used += fullGridValue;
            up = !up;
        }
        let diff = used - gridSize;
        if (used !== gridSize) {
            const newResult = [];
            while (diff > 0 && result.length) {
                let n = result.shift();
                if (n > 1) {
                    n--;
                    diff -= 1;
                }
                newResult.push(n);
            }
            result = result.concat(newResult);
        }
        if (result.length !== count) {
            Sys.logger.warn(`Utility-method grid.distributeGrid will return a faulty array. Excpected a count of ${ count }, got ${ result.length } ...`);
        }
        return result;
    }

};
