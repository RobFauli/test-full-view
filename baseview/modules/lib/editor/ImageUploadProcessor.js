// Let user add caption, alt-text etc. on uploaded images.
// Todo: When supported: Add button to publish image to front-servers
// Captions can be edited by the app CaptionEditor:
// this.api.v1.apps.start('CaptionEditor', { id: 123456 });

export class ImageUploadProcessor {

    constructor(api, callbacks = {}) {
        this.api = api;
        this.callbacks = {
            modified: callbacks.modified || null
        };
        this.lastEditId = null;
        this.template = `<div class="lab-fileuploader" data-lab-content="1">
            <div class="lab-formgroup">
                <ul class="lab-grid lab-list lab-space-above-large">
                    {{ #items }}
                    <li class="lab-grid-large-4 item-no-{{ id }}">
                        <img src="{{ imageServer }}/?imageId={{ id }}&width={{ width }}" class="lab-space-above-small" style="max-height: 180px; max-width: 180px; margin: 0 auto; display: block;">
                    </li>
                    <li class="lab-grid-large-8 lab-space-below-medium">
                        <p class="lab-para"><strong>Filename: </strong>{{ fileName }}</p>
                        <p class="lab-para"><strong>ID: </strong>{{ id }}</p>
                        <p class="lab-para"><strong>Caption: </strong><span data-caption-{{ id }}>{{{ caption }}}{{ ^caption }}<span class="lab-label">No caption</span>{{ /caption }}</span></p>
                        <p class="lab-para"><strong>Byline: </strong><span data-byline-{{ id }}>{{{ byline }}}{{ ^byline }}<span class="lab-label">No byline</span>{{ /byline }}</span></p>
                        <p class="lab-align-right"><input type="button" value="Edit" data-id="{{ id }}"></p>
                    </li>
                    {{ /items }}
                </ul>
            </div>
        </div>`;
        this.imageServer = this.api.v1.properties.get('image_server');
    }

    imagesUploaded(items) {
        let isDisplayed = false;
        this.modal = this.api.v1.ui.modal.dialog({
            content: {
                header: 'Uploaded images',
                markup: this.getMarkup(items)
            },
            footer: {
                buttons: [
                    {
                        value: 'Media Library',
                        type: 'button',
                        id: 'media-library'
                    },
                    {
                        value: 'OK',
                        type: 'submit',
                        highlight: true
                    }
                ]
            },
            callbacks: {
                didDisplay: (modal) => {
                    if (this.lastEditId) {
                        const item = modal.getMarkup().querySelector(`.item-no-${ this.lastEditId }`);
                        if (item && typeof item.scrollIntoViewIfNeeded === 'function') {
                            item.scrollIntoViewIfNeeded();
                        }
                        this.lastEditId = null;
                    }
                    if (isDisplayed) { return; }
                    for (const btn of modal.getMarkup().querySelectorAll('ul input')) {
                        btn.addEventListener('click', (event) => {
                            this.editImage(event.target.getAttribute('data-id'));
                        }, false);
                    }
                    const link = modal.getMarkup().querySelector('#media-library');
                    link.addEventListener('click', (event) => {
                        modal.close();
                        this.api.v1.collection.display({ name: 'MediaImages', options: { reload: true } });
                    }, false);
                    isDisplayed = true;
                }
            }
        });
    }

    editImage(id) {
        // Start caption-editor and also update UI in modal with result.
        this.api.v1.apps.start('CaptionEditor', {
            id,
            callback: (fields) => {
                this.lastEditId = id;
                for (const key of Object.keys(fields)) {
                    const el = this.modal.markup.querySelector(`span[data-${ key }-${ id }]`);
                    if (el) { el.innerHTML = fields[key]; }
                }
                this.updateCollection('MediaImages', { id, fields });
            }
        });
    }

    // Update caption/byline in collection
    updateCollection(name, data) {
        const uiInterface = lab_api.v1.collection.get(name);
        if (uiInterface) {
            const contentList = uiInterface.getContentList();
            for (const item of contentList) {
                // eslint-disable-next-line eqeqeq
                if (item.model.get('instance_of') == data.id) {
                    for (const field of Object.keys(data.fields)) {
                        const key = field === 'caption' ? 'imageCaption' : field;
                        item.model.set(`fields.${ key }`, data.fields[field], {
                            notify: false, registerModified: false, save: false, undoable: false
                        });
                    }
                }
            }
        }
    }

    getMarkup(items) {
        return this.api.v1.util.dom.renderTemplate(this.template, {
            items,
            imageServer: this.imageServer,
            width: 180
        });
    }

}
