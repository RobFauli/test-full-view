export class Placement {

    constructor({
        key = null,
        path = null,
        selector = null,
        placeholder = null,
        metadata = {},
        options: {
            shouldInsert = true,
            wrap = null,
            skipIfOutOfBounds = false,
            useIndex = false,
            useBodyTextIndex = false,
            useBodyTextHeadingIndex = false,
            lastBodyTextHeading = false
        } = {}
    } = {}) {
        this.key = key;
        this.path = path;
        this.selector = selector;
        this.placeholder = placeholder;
        this.metadata = metadata;
        this.options = {
            shouldInsert,
            wrap,
            skipIfOutOfBounds,
            useIndex,
            useBodyTextIndex,
            useBodyTextHeadingIndex,
            lastBodyTextHeading
        };
    }

}
