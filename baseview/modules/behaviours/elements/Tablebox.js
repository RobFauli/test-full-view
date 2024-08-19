import { TableFormatter } from '../../lib/helpers/TableFormatter.js';

export default class Tablebox {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const data = model.get('fields.tabledata');
        const header = model.get('fields.tableheader');
        const headerSort = model.get('fields.tableheadersort');
        if ((typeof data === 'undefined' || data === null || data.length === 0) && this.api.v1.app.mode.isEditor()) {
            model.setFiltered('missingData', 'Missing Data');
            return;
        }
        const table = TableFormatter.tsvStringToTable(data);
        const processedTable = TableFormatter.tableToTemplateBody(table); // Get table object
        model.setFiltered('missingData', false);
        model.setFiltered('tabledata', TableFormatter.tableToTSVString(table)); // Set edit-field
        model.setFiltered('header', header ? TableFormatter.templateTableBodyToHeader(processedTable, headerSort) : null);
        model.setFiltered('table', processedTable);
    }

}
