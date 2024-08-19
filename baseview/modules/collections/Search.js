/**
 * Search for existing elements of any type.
 * Default implementation will use elements factbox, slideshow, parallax, quotebox and markup.
 * You can add or remove element-types using config.
 */

/*
// Remove `markup`-element:
{
    "collections": {
        "search": {
            "types": {
                "markup": null
            }
        }
    }
}

// Add `quotebox`:
{
    "collections": {
        "search": {
            "types": {
                "quotebox": {
                    "name": "Quote",
                    "description": "{{{ fields.quote }}}"
                }
            }
        }
    }
}
// Note: The values for `name` and `description` may use standard Mustache variables, like `{{{ fields.title }}}`, referencing model-data from each element.
// These are used to display text for the user in the collection in the editor.

// Set default search for `slideshow`
{
    "collections": {
        "search": {
            "types": {
                "slideshow": {
                    "selected": true
                }
            }
        }
    }
}

*/

export default class {

    constructor(api) {
        this.api = api;
        this.pageId = this.api.v1.model.query.getRootModel().get('id');
    }

    onCreated(uiInterface, options) {
        const config = this.api.v1.util.defaults.object(this.api.v1.config.get('collections.search.types'), {
            factbox: {
                selected: true
            },
            slideshow: {},
            parallax: {},
            markup: {},
            quotebox: {},
            timeline: {}
        });
        let selectedElement = 'factbox';
        for (const name of Object.keys(config)) {
            if (config[name] && config[name].selected) {
                selectedElement = name;
            }
        }
        uiInterface.setProperty('config', config);
        uiInterface.setProperty('query', {
            type: selectedElement,
            string: ''
        });
    }

    onHeader(uiInterface, params) {
        const config = uiInterface.getProperty('config');
        const items = Object.keys(config).filter((name) => !!config[name]).map((name) => ({ elementType: name, ...config[name] }));
        const form = this.api.v1.util.dom.renderView('collections/search/header', { items }, true);
        const query = uiInterface.getProperty('query');
        const formHandler = (event) => {
            event.preventDefault();
            const formData = this.api.v1.util.dom.serializeForm(form);
            query.type = formData.type;
            query.string = (formData.query || '').trim();
            uiInterface.getData();
        };
        form.addEventListener('submit', formHandler, false);
        for (const formEl of [...form.querySelectorAll('input, select')]) {
            formEl.addEventListener('change', formHandler, false);
        }
        return form;
    }

    onGetData(uiInterface, options) {
        const query = uiInterface.getProperty('query');
        return query.type ? undefined : [];
    }

    // Note: No metadata returned from query.
    // Background colors, positions of images in factboxes etc. are omitted.
    onGetUrl(uiInterface, options) {
        const query = uiInterface.getProperty('query');
        return `/ajax/node/get-children-by-query?type=${ query.type }&query=${ query.string }&start=0&limit=20&lockId=${ this.pageId }`;
    }

    mapItems(uiInterface, items, checkConfig = true) {
        const config = uiInterface.getProperty('config');
        const result = [];
        for (const item of items) {
            if (!checkConfig || config[item.type]) {
                const itm = {
                    type: item.type,
                    contentdata: {
                        type: item.type,
                        fields: item.fields,
                        instance_of: item.instance_of
                    },
                    filtered: this.getItemDescription(item, config[item.type]),
                    children: this.mapItems(uiInterface, item.children || [], false)
                };
                if (item.instance_of) {
                    itm.contentdata.apiResult = {
                        id: item.instance_of
                    };
                }
                result.push(itm);
            }
        }
        return result;
    }

    onMapData(uiInterface, data, options) {
        const result = data && data.result ? this.mapItems(uiInterface, data.result) : [];
        return result;
    }

    getItemDescription(item, config = {}) {
        if (config.name || config.description) {
            return {
                name: this.api.v1.util.dom.renderTemplate(config.name, item),
                description: this.api.v1.util.string.stripTags(this.api.v1.util.dom.renderTemplate(config.description, item))
            };
        }
        let name = '';
        let description = '';
        switch (item.type) {
            case 'factbox':
                return {
                    name: `${ lab_api.v1.util.object.get('fields.title', item) || '[No title]' }`,
                    description: (lab_api.v1.util.object.get('fields.bodytext', item) || '[No bodytext]')
                };
            case 'markup':
                return {
                    name: `Markup from page #${ item.page_id }`,
                    description: lab_api.v1.util.string.stripTags(lab_api.v1.util.object.get('fields.markup', item) || lab_api.v1.util.object.get('fields.viewports_json.desktop.fields.markup', item) || '', ' ') || '[No markup]'
                };
            case 'slideshow':
                return {
                    name: '',
                    description: ''
                };
            case 'quotebox':
                return {
                    name: 'Quote',
                    description: lab_api.v1.util.string.stripTags(lab_api.v1.util.object.get('fields.quote', item)) || '[No quote]'
                };
            case 'parallax':
                for (const child of item.children) {
                    if (!name && child.type === 'text_title') {
                        name = child.fields.title;
                    }
                    if (!name && child.type === 'text_subtitle') {
                        name = child.fields.subtitle;
                    }
                    if (!description && child.type === 'text_multiline') {
                        description = child.fields.bodytext;
                    }
                }
                return {
                    name: name || '[No titles]',
                    description: description || '[No multiline text]'
                };
            case 'timeline':
                return {
                    name: `${ lab_api.v1.util.object.get('fields.title', item) || '[No title]' }`,
                    description: [...(item.children || [])].slice(0, 3).reverse().filter((itm) => !!itm.fields.title).map((itm) => lab_api.v1.util.string.stripTags(itm.fields.title || '')).join(' -- ') || '[No items]'
                };
            default:
                return {
                    name: `${ item.type }`,
                    description: ''
                };
        }
    }

    onItemProperties(uiInterface) {
        const query = uiInterface.getProperty('query');
        const useImagePlaceholder = query.type !== 'markup';
        return {
            title: {
                path: 'filtered.name',
                content: null
            },
            description: {
                path: 'filtered.description',
                content: null
            },
            definition: {
                useImagePlaceholder,
                children: [{
                    type: 'image',
                    limit: query.type === 'slideshow' ? 8 : 1
                }]
            }
        };
    }

}
