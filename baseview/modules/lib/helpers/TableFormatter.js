export class TableFormatter {

    static tsvStringToTable(data) {
        return data.split('\n').map(
            (row) => row.split('\t').map(
                (cell) => cell.trim()
            )
        );
    }

    static tableToTSVString(table) {
        if (!table) return null;
        return table.map(
            (row) => row.join('\t')
        ).join('\n');
    }

    static getMaxRowLength(table) {
        const cellCountList = table.map((row) => row.filter((cell) => cell.indexOf('|*') === -1).length);
        return Math.max.apply(null, cellCountList);
    }

    static newCell(e) { const t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : ''; return e ? { style: e, content: t } : { content: t }; }

    static newRow(e, t) { return e ? { style: e, row: t } : { row: t }; }

    static tableToTemplateBody(table) {
        const maxRowLength = TableFormatter.getMaxRowLength(table);
        return table
            .filter((row) => row.join('').trim() !== '') // Dont process empty lines
            .map((row) => {
                let processedRow = row.map((cell) => {
                    if (cell.indexOf('|') > -1) {
                        const cellData = cell.split('|');
                        // var [cellStyle, cellContent] = cell.split('|');
                        return TableFormatter.newCell(cellData[0], cellData[1]);
                    }
                    return TableFormatter.newCell(null, cell);
                });

                const rowStyle = processedRow[processedRow.length - 1].content === '*' ? processedRow[processedRow.length - 1].style : null; // If this row has a style, get it.
                if (rowStyle) {
                    processedRow = processedRow.slice(0, processedRow.length - 1);
                }

                while (processedRow.length < maxRowLength) { // Add empty cells to avoid holes in the table
                    processedRow.push(TableFormatter.newCell());
                }

                return TableFormatter.newRow(rowStyle, processedRow);
            });
    }

    static templateTableBodyToHeader(processedTable, sort) {
        if (!processedTable) {
            return null;
        }
        const processedHeader = processedTable.shift();
        if (sort) {
            for (let colNum = 0; colNum < processedHeader.row.length; colNum++) {
                const numbersInColumn = processedTable.map((row) => row[colNum]).filter((content) => /^[0-9, ]+$/.test(content)).length; // Count number of numbers in column
                const datesInColumn = processedTable.map((row) => row[colNum]).filter((content) => Date.parse(content)).length; // Count number of dates in column
                const colLength = processedTable.length;
                processedHeader.row[colNum].sortBy = numbersInColumn === colLength ? 'number' : datesInColumn === colLength ? 'date' : 'string';
            }
        }
        return processedHeader;
    }

}
