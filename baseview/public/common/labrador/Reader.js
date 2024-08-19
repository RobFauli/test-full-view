/**
 * Fetch data and transform to internal format.
 * Pagination etc. must be handled by consumer.
 * Requests are cached.
 */

export class Reader {

    constructor({ url, mappers = [] } = {}) {
        this.url = url;
        this.mappers = mappers;
        this.modifiedUrl = this.url;
        this.cache = new Map(); // Key: url, value: Instance of ClientData
    }

    // (Promise)
    read() {
        return new Promise((resolve, reject) => {
            if (this.cache.has(this.modifiedUrl)) {
                resolve(this.mapData(this.cache.get(this.modifiedUrl)));
                return;
            }
            fetch(this.modifiedUrl)
                .then((response) => response.json())
                .then((data) => {
                    this.cache.set(this.modifiedUrl, data);
                    const result = this.mapData(data);
                    resolve(result);
                }).catch((error) => {
                    console.log(`[Reader] Failed to fetch/transform data. Please check input params. Error:`);
                    console.error(error);
                });
        });
    }

    // (ClientData)
    mapData(data) {
        let result = data;
        for (const mapper of this.mappers) {
            result = mapper.map(result);
        }
        return result;
    }

    // (void)
    updateUrl(url) {
        this.modifiedUrl = url;
    }

    // (promise)
    reload(clearCache = false) {
        if (clearCache) {
            this.cache.delete(this.modifiedUrl);
        }
        return this.read();
    }

    // nextPage() {
    //     // ...
    // }

    // previousPage() {
    //     // ...
    // }

}
