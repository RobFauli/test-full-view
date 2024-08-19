export default class Scrollbox {

    constructor(api) {
        this.api = api;
    }

    // Update data for added article-teaser.
    // Replaces Lab 3 CMS-feature for config 'dataForAddedChild': 'contentbox_settings.scrollbox.dataForAddedChild'
    onChildAdded(model, child) {
        if (child.getType() !== 'article') {
            return;
        }
        // {
        //     "metadata": {
        //         "floatingTitle": true,
        //         ...
        //     },
        //     "contentdata": {
        //         "fields.displayByline": false
        //     },
        //     "children": {
        //         "image": {
        //             "contentdata": {
        //                 "fields.whRatio": {
        //                     "value": "1.2",
        //                     "vp": {
        //                         "mobile": "0.8"
        //                     }
        //                 },
        //                 "fields.bbRatio": "0.4"
        //             }
        //         }
        //     }
        // }
        const setValues = (m, obj, fieldPrefix) => {
            if (!obj) { return; }
            for (const key of Object.keys(obj)) {
                if (!key.includes('viewports_json')) { // Lab3-config may include paths like 'fields.viewports_json.mobile.fields.whRatio'
                    if (obj[key] && typeof obj[key] === 'object') {
                        m.setRaw((fieldPrefix || '') + key, obj[key]);
                    } else {
                        m.set((fieldPrefix || '') + key, obj[key]);
                    }
                }
            }
        };
        setValues(child, this.api.v1.config.get('contentbox_settings.scrollbox.dataForAddedChild.article.metadata'), 'metadata.');
        setValues(child, this.api.v1.config.get('contentbox_settings.scrollbox.dataForAddedChild.article.contentdata'));
        if (child.children.length && child.children[0].getType() === 'image') {
            const image = child.children[0];
            setValues(image, this.api.v1.config.get('contentbox_settings.scrollbox.dataForAddedChild.article.children.image.contentdata'));
        }
    }

}
