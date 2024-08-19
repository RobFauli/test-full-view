var ViewSupport = ViewSupport || {};

ViewSupport.CustomTags = {

    adminHandler: (container, add) => {
        const acceptedTags = ['script', 'meta', 'link'];
        // DOMParser will NOT be used to inject any HTML, only to parse the string.
        // It's important to avoid injecting the result of DOMParser in any way, in fear of XSS.
        const parser = new DOMParser();
        const tags = [];

        const buttonEl = document.createElement('button');
        buttonEl.innerText = 'Add';
        const noticeEl = document.createElement('p');
        noticeEl.style.fontStyle = 'italic';
        noticeEl.style.color = '#666666';
        noticeEl.innerText = 'WARNING: Make sure to check if the snippet is correctly added to the list.';
        const inputEl = document.createElement('textarea');
        inputEl.textContent = '';
        inputEl.setAttribute('placeholder', 'Paste snippets in here to automatically add...');
        inputEl.style.width = '100%';
        buttonEl.addEventListener('click', () => {
            if (inputEl.value.trim() !== '') {
                const doc = parser.parseFromString(inputEl.value, 'text/html');
                const elements = doc.head.children;

                for (const element of elements) {
                    // Extract Tag.
                    const tag = element.tagName.toLowerCase();

                    const attributes = [];
                    // Extract Attributes.
                    for (const attribute of element.attributes) {
                        attributes.push({
                            key: attribute.name,
                            value: attribute.value
                        });
                    }

                    // Extract body.
                    const body = element.innerHTML;

                    if (acceptedTags.includes(tag)) {
                        tags.push({
                            tag,
                            placement: 'head_top',
                            skipEditor: true,
                            attributes,
                            value: body
                        });
                    }
                }

                add(tags);
            }
        }, false);

        container.prepend(buttonEl);
        container.prepend(inputEl);
        container.prepend(noticeEl);
    },

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
    prepareForTemplate: (tags, pageType, isEditMode) => {
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
                result.meta[placement] = filtered.filter((item) => item.tag === 'meta').filter((item) => item.placement === placement).map((item) => ViewSupport.CustomTags.createCustomTag(item));
                result.script[placement] = filtered.filter((item) => item.tag === 'script').filter((item) => item.placement === placement).map((item) => ViewSupport.CustomTags.createCustomTag(item));
                result.link[placement] = filtered.filter((item) => item.tag === 'link').filter((item) => item.placement === placement).map((item) => ViewSupport.CustomTags.createCustomTag(item));
            }
        }
        return result;
    },

    createCustomTag: (item) => {
        switch (item.tag) {
            case 'link':
                return ViewSupport.CustomTags.createLinkTag(item);
            case 'script':
                return ViewSupport.CustomTags.createScriptTag(item);
            default:
                return ViewSupport.CustomTags.createMetaTag(item);
        }
    },

    parseAttributes: (attributes) => {
        const attrs = attributes.filter((attr) => !!attr.key).map((attr) => (attr.value ? `${ attr.key }="${ attr.value }"` : attr.key));
        return attrs.join(' ');
    },

    // <link rel="shortcut icon" type="image/png" sizes="256x256" href="/images/favicon_256x256.png">
    createLinkTag: (item) => `<link ${ ViewSupport.CustomTags.parseAttributes(item.attributes) }>`,

    // <script type="text/javascript" src="/js/cms/LabUtils/Form.js?v=2"></script>
    createScriptTag: (item) => `<script ${ ViewSupport.CustomTags.parseAttributes(item.attributes) }>${ item.value || '' }</script>`,

    // <meta charset="UTF-8">
    createMetaTag: (item) => `<meta ${ ViewSupport.CustomTags.parseAttributes(item.attributes) }>`

};
