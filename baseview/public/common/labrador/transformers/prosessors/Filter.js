import { datatype } from '../datatype.js';

// Remove articles that contain defined key/value pair(s).
export class Filter {

    constructor(options) {
        this.options = {
            data: options.data || [] // Array of objects: [{ path: 'id', values: [123, 456] }, { path: 'fields.title', values: ['ignore me', 'and me'] }, ...]
        };
    }

    // (ClientData) Remove articles that match a specified value
    // Input: array of articles
    // Output: array of articles
    map(clientData) {
        const data = clientData.getData();
        if (!Array.isArray(data) || !this.options.data.length) {
            return clientData;
        }
        clientData.setData(data.filter((article) => {
            for (const opts of this.options.data) {
                if (Array.isArray(opts.values)) {
                    if (opts.values.includes(datatype.object.get(opts.path, article))) {
                        return false;
                    }
                }
            }
            return true;
        }));
        return clientData;
    }

}
