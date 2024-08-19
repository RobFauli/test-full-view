// Edit a teaser:
// api.v1.apps.start('TeaserEditor', { id: 123456, endcallback: (id) => {...} })
// Create a teaser:
// api.v1.apps.start('TeaserEditor', { endcallback: (id) => {...} })

export class TeaserEditor {

    constructor(api, { id = null, endcallback = null } = {}) {
        this.api = api;
        this.data = {
            id: null,
            fields: {},
            children: []
        };
        this.endcallback = endcallback || null;
        this.registered = false;
        this.saveInProgress = false;
        this.modal = null;
        if (id && typeof id === 'number') {
            fetch(`/ajax/node/get-node?id=${ id }`).then((resp) => resp.json()).then((resp) => {
                this.data = resp.data;
                if (!this.data.children) {
                    this.data.children = [];
                }
                this.display();
            }).catch((error) => {
                console.log('error fetching teasers: ', error);
            });
        } else {
            this.display();
        }
    }

    display() {
        this.modal = this.api.v1.ui.modal.dialog({
            defaultButtons: false,
            container: {
                width: 900
            },
            content: {
                header: 'Teaser editor',
                markup: this.getMarkup(this.data)
            },
            aside: {
                position: 'left',
                expandable: false,
                header: 'Image',
                content: this.getAsideMarkup(this.data),
                noPadding: true,
                width: 270
            },
            callbacks: {
                didDisplay: (modal) => {
                    if (!this.registered) {
                        this.registerEvents(modal.getMarkup());
                        this.registered = true;
                    }
                },
                submit: (formElements) => {
                    this.save(formElements);
                },
                end: () => {
                    if (this.endcallback && !this.saveInProgress) {
                        this.endcallback(this.data.id);
                    }
                }
            },
            eventHandlers: [{
                selector: '#cancel-btn',
                event: 'click',
                callback: (theModal, event) => {
                    theModal.close();
                }
            }],
            keyValidation: [{
                key: 'title',
                validator: 'notEmpty'
            }, {
                key: 'subtitle',
                validator: 'notEmpty'
            }, {
                key: 'published_url',
                validator: 'lab_api.v1.util.valueTransformer.isUrl'
            }],
            footer: {
                buttons: [
                    {
                        value: 'Cancel',
                        highlight: false,
                        id: 'cancel-btn'
                    },
                    {
                        value: this.data.id ? 'Update teaser' : 'Create teaser',
                        type: 'submit',
                        highlight: true
                    }
                ]
            }
        });
    }

    registerEvents(markup) {
        const imgEl = markup.querySelector('.lab-aside-settings img');
        if (imgEl) {
            imgEl.addEventListener('click', (event) => {
                this.editImage(imgEl);
            }, false);
        }
        const changeImgBtn = markup.querySelector('#btn-change-image');
        if (changeImgBtn) {
            changeImgBtn.addEventListener('click', (event) => {
                this.changeImage(markup);
            }, false);
        }
        const removeImgBtn = markup.querySelector('#btn-remove-image');
        if (removeImgBtn) {
            removeImgBtn.addEventListener('click', (event) => {
                this.deleteCurrentImage();
            }, false);
        }
    }

    changeImage(markup) {
        const imgEl = markup.querySelector('.lab-aside-settings img');
        if (imgEl) {
            imgEl.parentElement.classList.add('lab-busy');
        }
        this.api.v1.collection.display({
            name: 'MediaImages',
            modal: true,
            skipCache: true,
            options: {
                clickHandler: (model, element) => {
                    const serialized = this.api.v1.model.serialize.model(model);
                    if (this.data.id) {
                        this.deleteCurrentImage(serialized);
                    } else {
                        this.data.children = [{
                            id: null,
                            type: 'image',
                            instance_of: serialized.instance_of,
                            apiResult: serialized.apiResult,
                            fields: serialized.fields
                        }];
                        this.updateImage();
                    }
                }
            }
        });
    }

    editImage(element) {
        import(/* webpackIgnore: true */ '/lib-js/modules/editor/Tools/image/Editor.js')
            .then((module) => {
                const offset = this.api.v1.viewport.getOffset();
                const image = this.data.children[0];
                const crop = image.fields;
                const editor = new module.Editor({
                    modal: false,
                    container: {
                        width: 300,
                        height: 200,
                        element: element.parentElement,
                        cssList: ['lab-modal-overlay']
                    },
                    offset: {
                        y: window.scrollY - offset.top
                    },
                    imageElement: {
                        element
                    },
                    crop,
                    tools: {
                        resize: {
                            active: false
                        }
                    },
                    imageUrl: `${ this.api.v1.properties.get('image_server') }/?imageId=${ image.instance_of }`
                }, {
                    end: () => {
                        const serializedCrop = editor.end();
                        image.fields = { ...image.fields, ...serializedCrop };
                        element.setAttribute('src', this.getImageurl(image));
                    }
                });
            });
    }

    save(formElements) {
        for (const key of Object.keys(formElements)) {
            this.data.fields[key] = formElements[key].trim();
        }
        if (this.data.id) {
            this.saveTeaser();
        } else {
            this.createTeaser();
        }
    }

    saveTeaser(newId) {
        this.saveInProgress = true;
        const formData = new FormData();
        const payload = [{ type: 'teaser', id: this.data.id, fields: this.data.fields }];
        if (this.data.children && this.data.children.length) {
            const image = this.data.children[0];
            payload.push({
                parent: this.data.id,
                type: 'image',
                id: image.id,
                instance_of: image.instance_of,
                fields: image.fields
            });
        }
        formData.append('json[id]', this.data.id);
        formData.append('json[type]', 'teaser');
        formData.append('json[structure]', null);
        formData.append('json[node]', JSON.stringify(payload));
        this.api.v1.util.httpClient.request('/ajax/node/save-node-and-data', { body: formData, method: 'POST' }).then((resp) => {
            this.saveInProgress = false;
            if (this.endcallback) {
                this.endcallback(newId);
            }
        }).catch((error) => {
            this.saveInProgress = false;
            console.log('error: ', error);
        });
    }

    deleteCurrentImage(newImage) {
        if (!this.data.id) { return; }
        if (!this.data.children || !this.data.children.length || !this.data.children[0].id) {
            if (newImage) {
                this.setCurrentImage(newImage);
            }
            return;
        }
        const formData = new FormData();
        const image = this.data.children[0];
        const payload = [{
            parent: this.data.id,
            type: 'image',
            id: image.id,
            instance_of: image.instance_of
        }];
        formData.append('json[id]', this.data.id);
        formData.append('json[type]', 'teaser');
        formData.append('json[structure]', null);
        formData.append('json[node]', JSON.stringify(payload));
        this.api.v1.util.httpClient.request('/ajax/node/delete-node-and-data', { body: formData, method: 'POST' }).then((resp) => {
            this.data.children = [];
            if (newImage) {
                this.setCurrentImage(newImage);
            } else {
                this.updateImage();
            }
        }).catch((error) => {
            console.log('error: ', error);
        });
    }

    setCurrentImage(serialized, callback) {
        this.data.children = [{
            id: null,
            type: 'image',
            instance_of: serialized.instance_of,
            apiResult: serialized.apiResult,
            fields: serialized.fields
        }];
        const formData = new FormData();
        const image = this.data.children[0];
        const payload = [{
            parent: this.data.id,
            type: 'image',
            fields: image.fields,
            instance_of: image.instance_of,
            tmpId: 'e6aff7c6-fbd9-4fb0-921f-e5766cc02771'
        }];
        if (this.data.id) {
            formData.append('json[id]', this.data.id);
        }
        formData.append('json[nodeData]', JSON.stringify(payload));
        this.api.v1.util.httpClient.request('/ajax/node/create', { body: formData, method: 'POST' }).then((resp) => {
            image.id = resp.lookup['e6aff7c6-fbd9-4fb0-921f-e5766cc02771'].id;
            image.instance_of = resp.lookup['e6aff7c6-fbd9-4fb0-921f-e5766cc02771'].instance_of;
            this.updateImage();
            if (callback) {
                callback();
            }
        }).catch((error) => {
            console.log('Error creating image: ', error);
        });
    }

    createTeaser() {
        const formData = new FormData();
        const payload = [{
            type: 'teaser',
            fields: this.data.fields,
            tmpId: 'e6aff7c6-fbd9-4fb0-921f-e5766cc02773'
        }];
        formData.append('json[nodeData]', JSON.stringify(payload));
        this.api.v1.util.httpClient.request('/ajax/node/create', { body: formData, method: 'POST' }).then((resp) => {
            this.data.id = resp.lookup['e6aff7c6-fbd9-4fb0-921f-e5766cc02773'].id;
            const image = this.data.children[0];
            if (image && !image.id) {
                this.setCurrentImage(image, () => {
                    this.saveTeaser(this.data.id);
                });
            } else {
                this.saveTeaser(this.data.id);
            }
        }).catch((error) => {
            console.log('Error creating teaser: ', error);
        });
    }

    getMarkup(data) {
        return this.api.v1.util.dom.renderView('apps/teasereditor/editor', {
            id: data.id,
            fields: data.fields || {}
        }, false);
    }

    getAsideMarkup(data, toDom = false) {
        const child = data.children && data.children.length ? data.children[0] : null;
        return this.api.v1.util.dom.renderView('apps/teasereditor/aside', child ? { url: this.getImageurl(child) } : {}, toDom);
    }

    updateImage() {
        const markup = this.modal.getMarkup();
        const aside = markup.querySelector('.lab-aside-settings');
        const newAside = this.getAsideMarkup(this.data, true);
        this.registerEvents(newAside);
        aside.parentNode.replaceChild(newAside, aside);
    }

    getImageurl(data) {
        return `${ this.api.v1.properties.get('image_server') }/${ data.instance_of }.webp?imageId=${ data.instance_of }&x=${ data.fields.x }&y=${ data.fields.y }&cropw=${ data.fields.cropw }&croph=${ data.fields.croph }&width=412&height=300`;
    }

}
