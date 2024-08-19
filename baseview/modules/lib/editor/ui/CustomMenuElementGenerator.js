/**
 * CustomMenuElementGenerator
 * Create input-elements using domUtils.renderEditor
 * with the template 'elements/form/formgroup'.
 *
 * Can be used programmatically to create elements based on site-config.
 */

/*
// Example-config to pass as params.config in method add:
[
    {
        "hasGrid": true,
        "elements": [
            {
                "label": "Some label ...",
                "inline": true,
                "attributes": [
                    {
                        "name": "type",
                        "value": "number"
                    },
                    {
                        "name": "name",
                        "value": "fields.my_field"
                    },
                    {
                        "name": "placeholder",
                        "value": "Some description ..."
                    },
                    {
                        "name": "min",
                        "value": 0
                    },
                    {
                        "name": "max",
                        "value": 100
                    }
                ]
            }
        ]
    }
]
*/

export class CustomMenuElementGenerator {

    constructor(api) {
        this.api = api;
    }

    add(params = {}) {
        if (!params.config || !params.model || !params.container) {
            Sys.logger.warn('CustomMenuElementGenerator: Missing params. Required: "config", "model" and "container".');
            return;
        }
        const config = this.validateCustomElementData(params.config, params.model);
        if (!config.length) {
            Sys.logger.warn('CustomMenuElementGenerator: Cannot create custom menu-element(s). Input-data ("config") do not validate.');
            return;
        }
        for (const item of config) {
            const element = this.api.v1.util.dom.renderEditor(
                'elements/form/formgroup',
                item,
                true
            );
            if (!element) {
                Sys.logger.warn('CustomMenuElementGenerator: Cannot create custom menu-element(s). Check input-data.');
                return;
            }
            params.container.appendChild(element);
        }
    }

    // (array)
    validateCustomElementData(data, model) {
        if (!Array.isArray(data)) {
            return [];
        }
        return data.map((item) => this.validateCustomElementItem(item, data.indexOf(item), model)).filter((item) => item !== null);
    }

    // (object or null)
    validateCustomElementItem(inputItem, index, model) {
        // const item = Object.assign({}, inputItem);
        const item = this.api.v1.util.object.clone(inputItem, true);
        if (typeof item !== 'object') {
            return null;
        }
        if (!item.elements || !Array.isArray(item.elements)) {
            return null;
        }

        const validatedElements = [];

        for (const element of item.elements) {
            const id = `custom-element-${ index }-${ item.elements.indexOf(element) }`;
            element.id = id;

            // Remove 'value' and 'id'-attributes
            element.attributes = (element.attributes || []).filter((attr) => attr.name !== 'id' && attr.name !== 'value');

            // Name-attribute is required.
            const nameList = element.attributes.filter((attr) => attr.name === 'name');
            if (nameList.length > 0) {
                // Get value-attribute from node:
                const type = element.attributes.filter((itm) => itm.name === 'type');
                if (type && (type[0].value === 'checkbox' || type[0].value === 'radio')) {
                    element.checked = !!model.get(nameList[0].value) || false;
                } else {
                    element.attributes.push({
                        name: 'value',
                        value: model.get(nameList[0].value)
                    });
                }
                element.attributes.push({
                    name: 'id',
                    value: id
                });
                validatedElements.push(element);
            }
        }

        if (!validatedElements.length) {
            return null;
        }

        item.elements = validatedElements;
        return item;
    }

}
