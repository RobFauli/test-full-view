export default class CustomTagsPreview {

    constructor() {
        this.dataTimeout = null;
        this.elements = [];
    }

    // Method called by ConfigObjectEditor.
    // Return a method to use as a listener for data-modifications.
    getListener() {
        return this.dataModified.bind(this);
    }

    // May be called frequently. Use a timeout.
    // Also need a timeout to let ConfigObjectEditor update GUI
    dataModified(data, modifiedPaths, site) {
        clearTimeout(this.dataTimeout);
        this.dataTimeout = setTimeout(() => {
            this.handleModifiedData(data, modifiedPaths, site);
        }, 200);
    }

    handleModifiedData(data, modifiedPaths, site) {
        while (this.elements.length) {
            this.elements.pop().remove();
        }
        for (const item of data) {
            const index = data.indexOf(item);
            const container = document.querySelector(`.lab-item-container[data-path="[${ index }]"]`);
            if (container) {
                const element = this.createCustomTagPreview(item);
                this.elements.push(element);
                container.appendChild(element);
            }
        }
    }

    createCustomTagPreview(item) {
        const el = document.createElement('p');
        el.classList.add('metadata-preview');
        // Use same method as ViewSupport to create the tag:
        el.innerText = ViewSupport.CustomTags.createCustomTag(item);
        return el;
    }

}
