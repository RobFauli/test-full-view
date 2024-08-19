export class ViewData {

    constructor({
        type = null,
        contentdata = null,
        content_data = null,
        cssSettings = {},
        children = [],
        metadata = {}
    } = {}) {
        this.type = type;
        this.contentdata = contentdata || content_data;
        this.children = children;
        this.metadata = { ...metadata };
        this.state = {};

        const css = [];
        if (this.metadata.css) css.push(this.metadata.css);
        for (const key of Object.keys(cssSettings)) {
            if (cssSettings[key]) css.push(key);
        }

        this.metadata.css = css.join(' ');
    }

}
