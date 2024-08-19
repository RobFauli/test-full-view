/**
 * Holds data for mappers. Are passed over from mapper to mapper
 * Each mapper returns an instance of this class
 */
export class ClientData {

    constructor() {
        this.totalCount = 0;  // Total number of results, dependent of source
        this.count = 0;       // Number of results
        this.data = [];       // Transformed data
        this.markups = [];    // List of markup
    }

    setMarkups(content) {
        this.markups = content;
    }

    setData(data) {
        this.data = data;
        this.count = this.data.length;
    }

    setTotalCount(count) {
        this.totalCount = count;
    }

    getData() {
        return this.data;
    }

}
