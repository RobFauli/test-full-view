export default class {

    constructor(api) {
        this.api = api;
        this.siteId = this.api.v1.site.getSite().id;
        this.pageId = this.api.v1.model.query.getRootModel().get('id');
    }

    onCreated(uiInterface, options) {
        // uiInterface.setProperty('defaultByline', parseInt(lab_api.v1.user.getField('defaultByline'), 10));
        uiInterface.setProperty('query', {
            firstname: '',
            lastname: '',
            bylineId: ''
        });
        uiInterface.setProperty('permissions', {
            mine: this.api.v1.user.hasPermission('byline_edit_mine'),
            all: this.api.v1.user.hasPermission('byline_edit_all')
        });
    }

    getDefaultBylineId() {
        return parseInt(lab_api.v1.user.getField('defaultByline'), 10);
    }

    getFavouriteBylineIds() {
        return lab_api.v1.user.getField('favouriteBylineIds') || [];
    }

    onHeader(uiInterface, params) {
        const form = this.api.v1.util.dom.renderView('collections/bylines/header', {}, true);
        const query = uiInterface.getProperty('query');
        const formHandler = (event, skipValidation = false) => {
            const formData = this.api.v1.util.dom.serializeForm(form);
            if (!skipValidation && ((formData.firstname || '').trim() + (formData.lastname || '').trim()).length <= 2) {
                return;
            }
            query.firstname = (formData.firstname || '').trim();
            query.lastname = (formData.lastname || '').trim();
            query.bylineId = '';
            uiInterface.getData();
        };
        for (const formEl of [...form.querySelectorAll('input')]) {
            formEl.addEventListener('input', formHandler, false);
            formEl.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    formHandler(event, true);
                }
            }, false);
        }
        form.querySelector('button').addEventListener('click', (event) => {
            this.editByline(uiInterface);
        }, false);
        return form;
    }

    // If no search is defined:
    // Display default byline + recently used bylines
    onGetUrl(uiInterface, options) {
        const defaultBylineId = this.getDefaultBylineId();
        const query = uiInterface.getProperty('query');
        if (!query.firstname && !query.lastname && !query.bylineId) {
            const ids = [...this.getFavouriteBylineIds().filter((id) => id !== defaultBylineId)];
            if (defaultBylineId) {
                ids.unshift(defaultBylineId);
            }
            return `/ajax/byline/get-by-ids?ids=${ ids }`;
        }
        return `/ajax/byline/search?page=${ this.pageId }&firstname=${ query.firstname }&lastname=${ query.lastname }&defaultBylineId=${ defaultBylineId || '' }&bylineId=${ query.bylineId }`;
    }

    onMapData(uiInterface, data, options) {
        const result = data.data.map((item) => {
            const bylineData = {
                type: item.type ? item.type : 'byline',
                contentdata: {
                    instance_of: item.id ? item.id : null,
                    fields: item.fields
                },
                filtered: {
                    name: `${ item.fields.firstname } ${ item.fields.lastname }`,
                    description: item.fields.description
                }
            };
            if (item.children) {
                bylineData.children = item.children.filter((child) => child.type === 'image').map((child) => ({
                    type: child.type,
                    contentdata: {
                        instance_of: child.instance_of || null,
                        fields: child.fields
                    }
                }));
            }
            return bylineData;
        });

        const defaultByline = this.getDefaultBylineId();
        result.sort((a, b) => a.filtered.name.localeCompare(b.filtered.name));
        if (defaultByline) {
            const defaultItem = result.filter((item) => item.contentdata.instance_of === defaultByline).pop();
            if (defaultItem) {
                result.splice(result.indexOf(defaultItem), 1);
                result.unshift(defaultItem);
            }
        }
        result.unshift({
            type: 'byline',
            contentdata: {
                fields: {}
            },
            filtered: {
                name: 'Unnamed Byline ...',
                description: 'Unnamed Description ...'
            }
        });
        return result;
    }

    onItemProperties(uiInterface) {
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
                useImagePlaceholder: true
            }
        };
    }

    onRendered(uiInterface, contentList) {
        uiInterface.setProperty('contentList', contentList);
        const permissions = uiInterface.getProperty('permissions');
        const defaultByline = this.getDefaultBylineId();

        // Add edit-button. Todo: Check permissions
        for (const item of contentList) {
            const id = item.model.get('instance_of');
            if (id) {
                if (permissions.all || (id === defaultByline && permissions.mine)) {
                    this.addEditLink(uiInterface, id, item.element);
                }
            }
        }

        // Highlight bylines used on current page:
        this.markExisting(uiInterface);
    }

    onDisplayed(uiInterface, options) {
        this.api.v1.model.on('childAdded', this.getBylineListener(uiInterface));
        this.api.v1.model.on('childRemoved', this.getBylineListener(uiInterface));
        this.markExisting(uiInterface);
    }

    onHidden(uiInterface) {
        this.api.v1.model.off('childAdded', this.getBylineListener(uiInterface));
        this.api.v1.model.off('childRemoved', this.getBylineListener(uiInterface));
    }

    editByline(uiInterface, id = null) {
        this.api.v1.apps.start('BylineEditor', {
            id,
            endcallback: (createdId) => {
                if (createdId) {
                    const query = uiInterface.getProperty('query');
                    query.bylineId = createdId || '';
                    uiInterface.setProperty('query', query);
                }
                uiInterface.getData(true);
            }
        });
    }

    addEditLink(uiInterface, id, element) {
        const el = document.createElement('div');
        el.setAttribute('title', 'Edit byline');
        el.classList.add('notes-info', 'labicon-startEdit');
        el.addEventListener('click', (event) => {
            this.editByline(uiInterface, id);
        }, false);
        element.querySelector('.lab-inner').prepend(el);
    }

    getBylineListener(uiInterface) {
        if (!uiInterface.getProperty('bylineListener')) {
            const listener = (params) => {
                if (params.childModel.getType() === 'byline') {
                    this.markExisting(uiInterface);
                }
            };
            uiInterface.setProperty('bylineListener', listener);
        }
        return uiInterface.getProperty('bylineListener');
    }

    markExisting(uiInterface) {
        const existing = this.api.v1.model.query.getModelsByType('byline').map((model) => model.get('instance_of'));
        const contentList = uiInterface.getProperty('contentList') || [];
        for (const item of contentList) {
            const id = item.model.get('instance_of');
            if (id) {
                if (existing.includes(id)) {
                    item.element.classList.add('lab-highlight-item');
                    item.element.setAttribute('title', 'Byline used on current page');
                } else {
                    item.element.classList.remove('lab-highlight-item');
                    item.element.setAttribute('title', '');
                }
            }
        }
    }

}
