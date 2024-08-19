export default class {

    constructor(api) {
        this.api = api;
        this.filetypes = ['svg', 'gif', 'png'];
        this.imageServer = this.api.v1.properties.get('image_server');
        this.siteId = this.api.v1.site.getSite().id;
    }

    onProperties(uiInterface) {
        return {
            autoItemSizing: true,
            displayAsGrid: true,
            isMedia: true
        };
    }

    onItemProperties(uiInterface) {
        return {
            title: {
                path: 'fields.name',
                content: null
            },
            description: {
                path: 'fields.fileType',
                content: null
            },
            imageUrl: {
                path: 'fields.url'
            }
        };
    }

    onCreated(uiInterface, options) {
        uiInterface.setProperty('query', {
            type: '',
            text: ''
        });
        uiInterface.setProperty('filesUploadedHandler', (files) => {
            if (files.length) {
                uiInterface.getData(true);
            }
        });
        lab_api.v1.file.on('filesUploaded', uiInterface.getProperty('filesUploadedHandler'));
    }

    onHeader(uiInterface, options) {
        const form = this.api.v1.util.dom.renderView('collections/graphics/header', {
            types: [{
                value: '',
                key: 'All types'
            }, {
                value: 'svg',
                key: 'SVG'
            }, {
                value: 'png',
                key: 'PNG'
            }, {
                value: 'gif',
                key: 'GIF'
            }]
        }, true);
        const query = uiInterface.getProperty('query');
        const formHandler = (event) => {
            event.preventDefault();
            const formData = this.api.v1.util.dom.serializeForm(form);
            query.type = formData.type;
            query.text = formData.text;
            uiInterface.getData();
        };
        form.addEventListener('submit', formHandler, false);
        for (const formEl of [...form.querySelectorAll('input, select')]) {
            formEl.addEventListener('change', formHandler, false);
        }
        form.querySelector('.size-container').appendChild(this.api.v1.ui.element.getSizeElements({
            name: 'graphics_list_preferred_size',
            btnSize: 'lab-small',
            css: 'lab-grid lab-grid-gap lab-autogrid lab-btn-group lab-grid-large-4',
            callback: (preferredSize) => {
                uiInterface.requestSize(preferredSize);
            }
        }));
        const preferredSize = this.api.v1.eventmonitor.reader.getUiSelection('graphics_list_preferred_size');
        if (preferredSize) {
            uiInterface.requestSize(preferredSize);
        }
        const toggleEl = form.querySelector('a');
        const expandableEl = form.querySelector('.expanded');
        if (toggleEl && expandableEl) {
            toggleEl.addEventListener('click', (event) => {
                event.preventDefault();
                expandableEl.classList.toggle('lab-hidden');
            }, false);
        }
        return form;
    }

    onFooter(uiInterface, options) {
        const form = this.api.v1.util.dom.renderView('collections/graphics/footer', {}, true);
        form.querySelector('.lab-footer-upload').addEventListener('click', (event) => {
            this.api.v1.file.displayFileUpload();
        }, false);
        form.querySelector('.lab-footer-reload').addEventListener('click', (event) => {
            uiInterface.getData(true);
        }, false);
        return form;
    }

    onGetUrl(uiInterface, options) {
        const query = uiInterface.getProperty('query');
        return `/ajax/file-upload/list-files-by-type?type=${ query.type || this.filetypes.join(',') }&text=${ query.text }&siteId=${ this.siteId }`;
    }

    onMapData(uiInterface, data) {
        const results = [];
        for (const id of Object.keys(data).reverse()) {
            const url = data[id].url || false;
            if (url) {
                results.push({
                    type: 'graphic',
                    contentdata: {
                        instance_of: id,
                        fields: {
                            url,
                            name: data[id].name,
                            uploadtime: data[id].uploadtime,
                            fileType: url.split('.').pop()
                        }
                    }
                });
            }
        }
        return results;
    }

}
