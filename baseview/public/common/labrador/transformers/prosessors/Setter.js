import { datatype } from '../datatype.js';
// Set data specified in options on every article.
export class Setter {

    constructor(options) {
        this.options = {
            data: options.data || [] // Array of objects: [{ path: 'metadata.background_color', value: 'red' }, ...]
        };
    }

    // (array) Set data specified in options on every article.
    // Input: array of articles
    // Output: array of articles
    map(clientData) {
        if (!this.options.data.length) {
            return clientData;
        }
        const data = clientData.getData();
        for (const article of data) {
            for (const opts of this.options.data) {
                if (opts.path && opts.value !== undefined) {
                    datatype.object.set(opts.path, opts.value, article);
                }
            }
        }
        clientData.setData(data);
        return clientData;
    }

}
