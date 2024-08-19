export class AutodataHelper {

    // Collect data defined in 'filtered.autodata' (cssObject, cssString, cssArray) and use to generate css class-names.
    static parseCss(model, path = 'filtered.autodata') {

        /*
        Example of data-structure this method supports:
        {
            filtered: {
                autodata: {
                    cssObject: {
                        key1: "value_1",
                        key2: "value_2"
                    },
                    cssString: "value_3 value_4",
                    cssArray: ["value_5", "value_6"]
                }
            }
        }

        Result: "value_1 value_2 value_3 value_4 value_5 value_6"
        */

        const autodata = model.get(path);
        if (!autodata || typeof autodata !== 'object') {
            return undefined;
        }
        const cssString = [
            Object.values(autodata.cssObject || {}).join(' '),
            autodata.cssString || '',
            (autodata.cssArray || []).join(' ')
        ].join(' ').trim();
        return cssString;
    }

    // (object) Collect data defined in 'filtered.autodata.attributesObject' and use to generate key/value pairs for dom-attributes.
    static parseAttributes(model) {

        /*
        Example of data-structure this method supports:
        {
            filtered: {
                autodata: {
                    attributesObject: {
                        "data-key1": "value_1",
                        "data-key2": "value_2"
                    }
                }
            }
        }

        Result: [
            { key: 'data-key1', value: 'value_1' },
            { key: 'data-key2', value: 'value_2' }
        ]

        Template: (assume result is available at filtered.items)
        <article {{ #filtered.items }} {{ key }}="{{ value }}"{{ /filtered.items }}>...</article>

        Parsed markup:
        <article data-key1="value_1" data-key2="value_2">...</article>
        */

        const autodata = model.get('filtered.autodata.attributesObject');
        if (!autodata || typeof autodata !== 'object') {
            return undefined;
        }
        const result = Object.keys(autodata).map((key) => ({ key, value: autodata[key] }));
        return result;
    }

    // (object) Collect data defined in 'filtered.autodata.custom' and use to generate arrays of key/value pairs.
    static parseCustomData(model) {
        /*
        Example of data-structure this method supports:
        {
            filtered: {
                autodata: {
                    custom: {
                        key1: {
                            subkey1: "value_1",
                            subkey2: "value_2"
                        },
                        key2: {
                            subkey1: "value_3",
                            subkey2: "value_4"
                        }

                    }
                }
            }
        }

        Result: {
            key1: [
                {
                    key: "subkey1",
                    value: "value_1"
                },
                {
                    key: "subkey2",
                    value: "value_2"
                }
            ],
            key2: [
                {
                    key: "subkey1",
                    value: "value_3"
                },
                {
                    key: "subkey2",
                    value: "value_4"
                }
            ]
        }

        Template-example: (assume result is available at filtered.items)
        <ul class="something">
        {{ #filtered.items.key1 }}
            <li class="{{ key }}">{{ value }}</li>
        {{ /filtered.items.key1 }}
        </ul>
        <ul class="something-else">
        {{ #filtered.items.key2 }}
            <li class="{{ key }}">{{ value }}</li>
        {{ /filtered.items.key2 }}
        </ul>

        Parsed markup:
        <ul class="something">
            <li class="subkey1">value_1</li>
            <li class="subkey2">value_2</li>
        </ul>
        <ul class="something-else">
            <li class="subkey1">value_3</li>
            <li class="subkey2">value_4</li>
        </ul>
        */

        const autodata = model.get('filtered.autodata.custom');
        if (!autodata || typeof autodata !== 'object') {
            return undefined;
        }
        const result = {};
        for (const key of Object.keys(autodata)) {
            result[key] = Object.keys(autodata[key]).map((itemKey) => ({ key: itemKey, value: autodata[key][itemKey] }));
        }
        return result;
    }

    // Use data from feed and config for defined path to map autodata fields
    // TODO: Support other types of autodata than labels
    static parseCustomDataFromFeed(data, path) {
        /*
        Example of data-structure this method supports:
        "contentbox_settings": {
            "articlescroller": {
                "autodata": {
                    "mapping": {
                        "labels": [
                            {
                                "field": "fieldInFeed",
                                "key": "autodataKey"
                            }
                        ]
                    }
                }
            }
        }

        Result: {
            labels: [
                {
                    key: "subkey1",
                    value: "value_1"
                },
                {
                    key: "subkey2",
                    value: "value_2"
                }
            ]
        }

        Template-example: (depends on contentbox template. Assume result is available at autodata.labels)
        {{ #autodata.labels }}
            <div class="labels">
                <div class="label" data-label-key="{{ key }}" data-label-value="{{ value }}"><span class="label-value">{{ value }}</span></div>
            </div>
        {{ /autodata.labels }}

         Example parsed markup (depends on contentbox template):
         <div class="labels">
            <div class="label" data-label-key="subkey1" data-label-value="value_1"><span class="label-value">value_1</span></div>
        </div>
        */

        const autodata = lab_api.v1.config.get(`${ path  }.autodata.mapping`) || {};
        if (!autodata || typeof autodata !== 'object') {
            return undefined;
        }
        const result = {
            labels: []
        };
        if (autodata.labels) {
            for (const key of Object.keys(autodata.labels)) {
                if (data[autodata.labels[key]]) {
                    result.labels.push({ key, value: data[autodata.labels[key]] });
                }
            }
        }
        return result;
    }

}
