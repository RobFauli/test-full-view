export default class {

    constructor(api) {
        this.api = api;
    }

    onCreated(uiInterface, options) {
        uiInterface.setProperty('query', {
            start: 0,
            limit: 24,
            q: ''
        });
    }

    onHeader(uiInterface, params) {
        const form = this.api.v1.util.dom.renderView('collections/articleTeasers/header', {}, true);
        const query = uiInterface.getProperty('query');
        const formHandler = (event) => {
            const formData = this.api.v1.util.dom.serializeForm(form);
            query.q = formData.text || '';
            this.resetPager(uiInterface);
            uiInterface.getData();
        };
        for (const formEl of [...form.querySelectorAll('input, select')]) {
            formEl.addEventListener('change', formHandler, false);
        }
        const addBtn = form.querySelector('[name="add"]');
        if (this.api.v1.user.hasPermission('edit_article')) {
            addBtn.addEventListener('click', (event) => {
                this.editTeaser(uiInterface);
            }, false);
        } else {
            addBtn.setAttribute('disabled', 'disabled');
        }
        form.addEventListener('submit', (event) => {
            event.preventDefault();
        }, false);

        return form;
    }

    onFooter(uiInterface, params) {
        const form = this.api.v1.util.dom.renderView('collections/articlesLatest/footer', {}, true);
        uiInterface.setDomElement('prevPageElement', form.querySelector('.lab-footer-prev'));
        uiInterface.getDomElement('prevPageElement').addEventListener('click', (event) => {
            this.navigate(uiInterface, false);
        }, false);
        uiInterface.setDomElement('nextPageElement', form.querySelector('.lab-footer-next'));
        uiInterface.getDomElement('nextPageElement').addEventListener('click', (event) => {
            this.navigate(uiInterface, true);
        }, false);
        form.querySelector('.lab-footer-reload').addEventListener('click', (event) => {
            uiInterface.getData(true);
        }, false);
        uiInterface.setDomElement('pageCounterElement', form.querySelector('.lab-footer-counter'));
        return form;
    }

    onGetUrl(uiInterface) {
        const query = uiInterface.getProperty('query');
        const args = [
            `q=${ query.q }`,
            `start=${ query.start }`,
            `limit=${ query.limit }`
        ];
        return `/ajax/article/get-teasers?${ args.join('&') }`;
    }

    onMapData(uiInterface, serverData) {
        const labData = [];
        const ignoreUnpublished = uiInterface.getProperty('ignoreUnpublished');

        // Create an empty article:
        labData.push(this.articleData({
            filtered: {
                title: 'Empty teaser'
            }
        }));

        for (const data of serverData.data) {
            const article = this.articleData(data);
            if (!ignoreUnpublished || article.fields.published_url) {
                labData.push(article);
            }
        }

        this.updatePageNumber(uiInterface);
        return labData;
    }

    onRendered(uiInterface, contentList) {
        if (!this.api.v1.user.hasPermission('edit_article')) { return; }
        for (const item of contentList) {
            const id = item.model.get('instance_of');
            if (id) {
                this.addEditLink(uiInterface, id, item.element);
            }
        }
    }

    onItemProperties(uiInterface) {
        return {
            title: {
                path: 'filtered.title',
                content: null
            },
            description: {
                path: 'filtered.subtitle',
                content: null
            }
        };
    }

    addEditLink(uiInterface, id, element) {
        const el = document.createElement('div');
        el.setAttribute('title', 'Edit Teaser');
        el.classList.add('notes-info', 'labicon-startEdit');
        el.addEventListener('click', (event) => {
            this.editTeaser(uiInterface, id);
        }, false);
        element.querySelector('.lab-inner').prepend(el);
    }

    // If id: Update. If no id: Create
    editTeaser(uiInterface, id) {
        this.api.v1.apps.start('TeaserEditor', {
            id,
            endcallback: (createdId) => {
                uiInterface.getData(true);
            }
        });
    }

    navigate(uiInterface, forward) {
        const query = uiInterface.getProperty('query');
        if (forward) {
            query.start += query.limit;
        } else {
            query.start -= query.limit;
            if (query.start < 0) {
                query.start = 0;
            }
        }
        uiInterface.getData();
    }

    updatePageNumber(uiInterface) {
        const pageNumber = this.getPageNumber(uiInterface);
        const el = uiInterface.getDomElement('pageCounterElement');
        el.innerHTML = pageNumber;
        if (pageNumber < 2) {
            uiInterface.getDomElement('prevPageElement').setAttribute('disabled', 'disabled');
        } else {
            uiInterface.getDomElement('prevPageElement').removeAttribute('disabled');
        }
    }

    getPageNumber(uiInterface) {
        const query = uiInterface.getProperty('query');
        return Math.ceil(query.start / query.limit) + 1;
    }

    // (object) Create data for an article-element
    articleData(inputData) {
        const childrenData = [];
        const children = inputData.children || [];
        const filtered = inputData.filtered || {};
        if (children.length && children[0].type === 'image') {
            childrenData.push({
                type: 'image',
                contentdata: {
                    instance_of: children[0].instance_of,
                    fields: this.api.v1.view.helpers.image.getImageProperties({ crop: { pano: children[0].fields } })
                },
                children: []
            });
        }
        const fields = inputData.fields || {};
        const title = fields.title || '';
        const subtitle = fields.subtitle || '';
        return {
            type: 'article',
            contentdata: {
                instance_of: inputData.id ? parseInt(inputData.id, 10) : null,
                fields: {
                    title,
                    subtitle,
                    published_url: fields.published_url
                }
            },
            filtered: {
                title: filtered.title || (title || '[No title]'),
                subtitle: filtered.subtitle || (subtitle || '[No subtitle]')
            },
            children: childrenData
        };
    }

    resetPager(uiInterface) {
        const query = uiInterface.getProperty('query');
        query.start = 0;
    }

}
