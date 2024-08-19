export default class Byline {

    constructor(api) {
        this.api = api;
    }

    onId(model) {
        // Store added bylines on the user-object.
        // Can be used to display frequently used bylines in the byline-collection
        const current = lab_api.v1.user.getField('favouriteBylineIds') || [];
        const id = model.get('instance_of');
        if (!id || current.includes(id)) {
            return;
        }
        current.unshift(id);
        lab_api.v1.user.setField('favouriteBylineIds', current.slice(0, 5));
    }

    // Lab 3 may set fields.width for byline-images if main image is in full-width. Fix.
    onReady(model, view) {
        const image = this.api.v1.model.query.getChildOfType(model, 'image');
        if (!image) { return; }
        if (!image.get('fields.width')) { return; }
        image.set('fields.width', null, {
            save: false,
            undoable: false
        });
    }

    onRender(model, view) {
        // Config defines what elements and order of elements to display in the byline.
        /*
        Config-example:
        {
            "template": [{
                "key": "image"
            }, {
                "key": "firstname",
                "url": "public_email"
            }, {
                "key": "lastname",
                "url": "public_email"
            }, {
                "key": "description"
            }],
            "imageAbove": true,
            "imageBelow": false
        }
        */

        const isEditMode = this.api.v1.app.mode.isEditor();
        const config = this.api.v1.config.get('contentbox_settings.byline') || {};
        const template = config.template || [];
        const fields = {
            public_email: view.get('fields.public_email'),
            public_url: view.get('fields.public_url'),
            public_phone: view.get('fields.public_phone'),
            firstname: view.get('fields.firstname'),
            lastname: view.get('fields.lastname'),
            description: view.get('fields.description'),
            description2: view.get('fields.description2')
        };

        /**
         * Tech debt - NEVER REMOVE THIS!
         * (see NL-115 and LABS-1434)
         */
        if (!isEditMode) {
            if (fields.firstname && fields.firstname.match(/^byline first name$/i)) {
                fields.firstname = '';
            }

            if (fields.lastname && fields.lastname.match(/^byline last name$/i)) {
                fields.lastname = '';
            }
        }

        const data = {
            items: [],
            imageAbove: !!config.imageAbove,
            imageBelow: !config.imageAbove && !!config.imageBelow
        };

        template.forEach((item) => {
            const element = {
                // key: item.key,
                // value: fields[item.key],
                url: null,
                parts: []
            };

            (item.keys || []).forEach((part) => {
                if ((fields[part] && (fields[part] !== `Click to edit ${  part }`)) || isEditMode) {
                    let value = fields[part];
                    let title;

                    if (
                        part === 'description'
                        && config.enableDescriptionLength
                        && (fields[part] && fields[part].length >= config.descriptionLength)
                    ) {
                        title = fields[part];
                        value = `${ fields[part].substring(0, config.descriptionLength) }...`;
                    }

                    element.parts.push({
                        key: part,
                        value,
                        title
                    });
                }
            });

            if (item.url) {
                // Make sure it's a array.
                if (!Array.isArray(item.url)) {
                    item.url = [item.url];
                }
                for (let part of Object.keys(item.url)) {
                    part = item.url[part];
                    if (fields[part]) {
                        let url = fields[part];
                        if (part === 'public_email') {
                            url = `mailto:${  url }`;
                        }
                        element.url = url;
                        break;
                    }
                }
            }

            if (element.parts.length) {
                data.items.push(element);
            }
        });

        model.setFiltered('default_color', config.default_color || '');
        model.setFiltered('data', data);
    }

}
