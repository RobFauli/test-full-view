import { DateTimeHelperInt } from '../../lib/helpers/datetime/DateTimeHelperInt.js';
import Template from './template.js';

export class FieldVersion {

    constructor(api, {
        field = null, model = null, limit = 400, callbacks = {}, selector = ''
    } = {}) {
        this.api = api;
        this.field = field;
        this.model = model;
        this.limit = limit;
        this.callbacks = callbacks;
        this.selector = selector;
        this.dateTimeHelper = new DateTimeHelperInt();

        if (!this.field || !this.model) {
            console.error('[FieldVersion] Params "field" and "model" are required.');
            return;
        }
        this.id = this.model.get('id');
        this.state = {
            busy: false,
            index: 0, // Current revision is 0, higher number is further back in time.
            page: 1,
            data: [],
            hasMore: true,
            openRequest: false
        };
        this.dom = {};
        this.setupUI();
    }

    setupUI() {
        this.api.v1.util.dom.addFile('css', '/view-resources/baseview/modules/apps/fieldversion/fieldversion.css');
        this.api.v1.ui.modal.dialog({
            container: {
                css: 'fieldversions',
                width: 1200
            },
            content: {
                header: 'Preview'
            },
            aside: {
                position: 'left',
                content: Template.aside,
                width: '30%',
                header: 'Field Revisions'
            },
            footer: {
                buttons: [
                    {
                        value: 'Previous',
                        type: 'button',
                        id: 'btn-prev',
                        highlight: false
                    },
                    {
                        value: 'Next',
                        type: 'button',
                        id: 'btn-next',
                        highlight: false
                    },
                    {
                        value: 'Insert',
                        type: 'submit',
                        id: 'btn-insert',
                        highlight: false
                    },
                    {
                        value: 'Cancel',
                        id: 'btn-close',
                        highlight: true
                    }
                ]
            },
            callbacks: {
                didDisplay: (theModal) => {
                    const markup = theModal.getMarkup();
                    markup.querySelector('.lab-modal-content').appendChild(this.api.v1.util.dom.toDom(Template.main));
                    const previous = markup.querySelector('#btn-prev');
                    const next = markup.querySelector('#btn-next');
                    const date = markup.querySelector('.date');
                    const user = markup.querySelector('.user');
                    const insert = markup.querySelector('#btn-insert');
                    const close = markup.querySelector('#btn-close');
                    const revision = markup.querySelector('.revision');
                    const preview = markup.querySelector('.preview');
                    markup.querySelector('.field').innerHTML = this.field;
                    markup.querySelector('.node').innerHTML = this.model.getId();
                    previous.addEventListener('click', () => this.navigateBackward());
                    next.addEventListener('click', () => this.navigateForward());
                    insert.addEventListener('click', () => this.insertVersion());
                    close.addEventListener('click', () => this.end());
                    this.dom = {
                        modal: theModal,
                        markup,
                        preview,
                        nav: {
                            previous,
                            next,
                            insert,
                            close
                        },
                        date,
                        user,
                        revision
                    };
                    this.getVersionData();
                }
            }
        });
    }

    end() {
        this.dom.modal.close();
        this.dom = null;
        this.api.v1.model.redraw(this.model);
        if (this.callbacks.end) {
            this.callbacks.end(this);
        }
    }

    getUrl() {
        const { limit } = this;
        const offset = (this.limit * (this.state.page - 1)) || 0;
        return `/ajax/field-versions/get-list?nodeId=${ this.id }&fieldName=${ this.field }&limit=${ limit }&offset=${ offset }&debug=0&doExplain=0&format=&fromTime&toTime`;
    }

    // Note: If no version-data exist the response will be an empty string.
    getVersionData(callback) {
        if (!this.state.hasMore) {
            this.displayNoHits();
            return;
        }
        this.setBusy(true);
        fetch(this.getUrl()).then((resp) => resp.json()).then((resp) => {
            this.setBusy(false);
            if (!resp || !Array.isArray(resp)) {
                this.state.hasMore = false;
                this.displayNoHits();
                return;
            }

            if (resp.length < this.limit) {
                this.state.hasMore = false;
            }

            let data = [];
            if (resp && Array.isArray(resp) && resp.length > 0) {
                data = this.filterData(resp);
            }
            if (data.length) {
                this.updateVersionData(data);
                if (callback) {
                    callback();
                } else {
                    this.displayIndex(this.state.index);
                }
            } else {
                this.state.page++;
                this.getVersionData(callback);
            }
        }).catch((error) => {
            console.log('error: ', error);
        });
    }

    setBusy(isBusy) {
        this.state.openRequest = isBusy;
        if (isBusy) {
            this.dom.markup.classList.add('lab-busy');
        } else {
            this.dom.markup.classList.remove('lab-busy');
        }
    }

    filterData(data) {
        return data.filter((item) => item.name === this.field);
    }

    navigateBackward(skipRetry = false) {
        if (this.state.openRequest) {
            return;
        }
        const newIndex = this.state.index + 1;
        if (newIndex < this.state.data.length) {
            this.state.index = newIndex;
            this.displayIndex(newIndex);
        } else if (!skipRetry) {
            this.state.page++;
            this.getVersionData(() => {
                this.navigateBackward(true);
            });
        }
    }

    navigateForward() {
        if (this.state.openRequest) {
            return;
        }
        const newIndex = this.state.index - 1;
        if (newIndex >= 0) {
            this.state.index = newIndex;
            this.displayIndex(newIndex);
        }
    }

    displayNoHits() {
        this.dom.date.innerHTML = 'No revison found ...';
        this.dom.user.innerHTML = '--';
        this.dom.revision.innerHTML = '--';
        this.updateNavigation();
    }

    displayIndex(index) {
        this.dom.date.innerHTML = this.formatDate(this.state.data[index].audit_time) + (index === 0 ? ' (current)' : '');
        this.dom.user.innerHTML = this.state.data[index].user_name;
        this.dom.revision.innerHTML = this.state.data[index].revision_id;
        this.updateFieldPreview();
        this.updateNavigation();
    }

    updateFieldPreview() {
        this.dom.preview.innerHTML = this.state.data[this.state.index].value || '<p></p>';
    }

    insertVersion() {
        if (!this.state.data[this.state.index]) {
            console.warn(`[FieldVersion] No version data found for index ${ this.state.index } ...`);
            return;
        }
        this.model.set(`fields.${ this.field }`, this.state.data[this.state.index].value);
        this.end();
        this.api.v1.model.highlight.message(this.model, 'Revision inserted');
    }

    formatDate(dateString) {
        // new Date('2024-02-27 18:35:48.055554+01')
        const date = new Date(dateString);
        const dateFormat = this.api.v1.locale.get('dates.monthdayyear', { noRender: true });
        const timeFormat = this.api.v1.locale.get('dates.hourminute', { noRender: true });
        return `${ this.dateTimeHelper.format(date, dateFormat) } ${ this.dateTimeHelper.format(date, timeFormat) }`;
    }

    updateNavigation() {
        if (this.state.index === 0) {
            this.dom.nav.next.classList.add('lab-disabled');
        } else {
            this.dom.nav.next.classList.remove('lab-disabled');
        }
        if (!this.state.hasMore && this.state.data.length <= this.state.index + 1) {
            this.dom.nav.previous.classList.add('lab-disabled');
        } else {
            this.dom.nav.previous.classList.remove('lab-disabled');
        }
    }

    updateVersionData(data) {
        for (const item of data) {
            this.state.data.push(item);
        }
    }

}
