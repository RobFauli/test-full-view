export class Insertable {

    constructor({
        path = null,
        selector = null,
        data = {},
        options = {}
    } = {}) {
        this.path = path;
        this.selector = selector;
        this.data = data;
        this.options = {
            persistentTarget: true,
            intermediate: {
                useExisting: true
            },
            ...options
        };
    }

}
