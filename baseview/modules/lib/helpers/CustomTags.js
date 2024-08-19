export class CustomTags {

    /*
    Transform list of tags to something templates may print.
    Config may be set in admin-tool 'customtags'
    Supported tags: meta, script, link
    Supported placements: head_top, head_bottom, body_top, body_bottom
    Input: [ { tag, placement, attributes, pageType, value }, ... ]
    Note: 'value' is only used by 'script'
    Output:
    {
        script: {
            head_top: ['<tag_1>', '<tag_2>'],
            head_bottom: [],
            body_top: [],
            body_bottom: []
        },
        meta: { ... },
        link: { ... }
    }
    */
    static prepareForTemplate(tags, pageType, isEditMode) {
        const result = {
            meta: {
                head_top: [],
                head_bottom: []
            },
            script: {
                head_top: [],
                head_bottom: [],
                body_top: [],
                body_bottom: []
            },
            link: {
                head_top: [],
                head_bottom: []
            }
        };
        const filtered = tags.filter((tag) => (!tag.pageType || tag.pageType === pageType) && !(tag.skipEditor && isEditMode));
        for (const tag of Object.keys(result)) {
            for (const placement of Object.keys(result[tag])) {
                result.meta[placement] = filtered.filter((item) => item.tag === 'meta').filter((item) => item.placement === placement).map((item) => this.createCustomTag(item));
                result.script[placement] = filtered.filter((item) => item.tag === 'script').filter((item) => item.placement === placement).map((item) => this.createCustomTag(item));
                result.link[placement] = filtered.filter((item) => item.tag === 'link').filter((item) => item.placement === placement).map((item) => this.createCustomTag(item));
            }
        }
        return result;
    }

    static createCustomTag(item) {
        switch (item.tag) {
            case 'link':
                return this.createLinkTag(item);
            case 'script':
                return this.createScriptTag(item);
            default:
                return this.createMetaTag(item);
        }
    }

    static fetchDynamicAttribute(value) {
        return lab_api.v1.view.render({ model: lab_api.v1.model.query.getRootModel(), template: value }) || null;
    }

    static parseAttributes(attributes) {
        const attrs = attributes.filter((attr) => !!attr.key).map((attr) => (attr.value ? `${ attr.key }="${ attr.value.match(/\{\{.*\}\}/g) ? this.fetchDynamicAttribute(attr.value) : attr.value }"` : attr.key));
        return attrs.join(' ');
    }

    static parseVariables(value) {
        return value.replace(/\{\{\{?.*?\}\}\}?/g, this.fetchDynamicAttribute);
    }

    // <link rel="shortcut icon" type="image/png" sizes="256x256" href="/images/favicon_256x256.png">
    static createLinkTag(item) {
        return `<link ${ this.parseAttributes(item.attributes) }>`;
    }

    // <script type="text/javascript" src="/js/cms/LabUtils/Form.js?v=2"></script>
    static createScriptTag(item) {
        return `<script ${ this.parseAttributes(item.attributes) }>${ item.value ? this.parseVariables(item.value) : '' }</script>`;
    }

    // <meta charset="UTF-8">
    static createMetaTag(item) {
        return `<meta ${ this.parseAttributes(item.attributes) }>`;
    }

}
