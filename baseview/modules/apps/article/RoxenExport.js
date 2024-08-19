import { DateTimeHelper } from '../../lib/helpers/datetime/DateTimeHelper.js';

export class RoxenExport {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = this.api.v1.user.hasPermission('export_roxen');
        this.dateTimeHelper = new DateTimeHelper(this.api.v1.config.get('lang') || undefined);
        this.dom = {
            exportDate: null,
            message: null
        };
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-space-above-none">
                <h2 class="lab-title lab-grid-large-12 lab-space-below-medium lab-space-above-none">Export article to Roxen</h2>
                <p class="lab-para lab-grid-large-12">Last exported: <strong data-name="export-date">--</strong></p>
            </div>
            <div class="lab-formgroup lab-grid lab-space-above-none">
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="lab-roxen-publication">Select publication</label>
                    <select name="lab-roxen-publication-select" id="lab-roxen-publication-select" disabled></select>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="publishedDate">Select print edition</label>
                    <input type="date" id="publishedDate" name="fields.published" value="">
                </div>
            </div>
            <div class="lab-formgroup lab-grid lab-space-above-none lab-align-right">
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <input type="button" value="Export article">
                </div>
            </div>
            <div class="lab-formgroup lab-grid lab-space-above-none">
                <p class="lab-para lab-grid-large-12" id="messageArea"></p>
            </div>
        </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'Export',
            label: 'Roxen'
        };
    }

    onPaths() {}

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                name: this.rootModel.get('fields.name'),
                hostpath: this.rootModel.get('fields.hostpath'),
                lab_canonical: this.rootModel.get('fields.lab_canonical'),
                defaultsection: this.rootModel.get('fields.defaultsection')
            }
        }, true);
        const select = markup.querySelector('#lab-roxen-publication-select');
        const publication = this.rootModel.get('fields.print_publication');
        const url = `/ajax/integration-services/proxy/export/roxen/?action=list&site=${ this.api.v1.site.getSite().alias }`;
        this.api.v1.util.httpClient.get(url).then((payload) => {
            if (payload.error) { return; }
            if (Array.isArray(payload)) {
                for (const item of payload) {
                    select.appendChild(this.api.v1.util.dom.renderTemplate(`<option value="${ item.prefix }" ${ item.prefix === publication ? ' selected="selected"' : '' }>${ item.title }</option>`, {}, true));
                }
                select.removeAttribute('disabled');
            }
        }).catch((error) => {
            // Integration do not return anything if Roxen is not set up in config. Ignore.
        });
        this.dom.exportDate = markup.querySelector('[data-name=export-date]');
        this.dom.messageArea = markup.querySelector('#messageArea');
        this.updateExportDate();
        this.setupSubmit(markup);
        return markup;
    }

    setupSubmit(markup) {

        const btn = markup.querySelector('input[type=button]');

        btn.addEventListener('click', (event) => {
            const editionDate = markup.querySelector('#publishedDate').value;
            this.displayMessage('');
            if (editionDate !== '') {

                markup.classList.add('lab-busy');
                btn.setAttribute('disabled', 'disabled');

                this.api.v1.util.httpClient.get(`/prototype/get-node-and-data?id=${ this.rootModel.getId() }`, { resetCache: true }).then((d) => {
                    const data = { ...d };
                    const site = this.api.v1.site.getSite();
                    const publication = `lab-${ site.id }`;
                    const publicationFromSelect = markup.querySelector('#lab-roxen-publication-select').value;
                    data.data.fields.print_publication = (publicationFromSelect || publication);
                    data.data.fields.print_edition_date = editionDate;
                    const export_url = `/ajax/integration-services/proxy/export/roxen?imageBaseUrl=${ this.api.v1.properties.get('image_server') }&site=${ site.alias }`;

                    this.api.v1.util.httpClient.request(
                        export_url,
                        {
                            body: JSON.stringify(data),
                            method: 'POST'
                        }
                    ).then((resp) => {
                        if (resp && resp.object_id) {
                            this.rootModel.set('fields.print_exported', Math.floor(Date.now() / 1000));
                            this.rootModel.set('fields.print_publication', (publicationFromSelect || publication));
                            this.rootModel.set('fields.print_edition_date', editionDate);
                            this.rootModel.set('fields.print_id', resp.object_id);
                            this.displayMessage('The article was successfully exported to Roxen');
                            this.updateExportDate();
                        } else {
                            this.displayMessage('There was a problem sending the article');
                            console.log(resp);
                        }
                        markup.classList.remove('lab-busy');
                        btn.removeAttribute('disabled');
                    }).catch((e) => {
                        this.displayMessage('The export to Roxen failed. Try again. If you continue to see this message contact support@publishlab.com');
                        console.error('Error: ', e, e.status);
                        markup.classList.remove('lab-busy');
                        btn.removeAttribute('disabled');
                    });
                });
            }
        });
    }

    displayMessage(msg) {
        this.dom.messageArea.innerHTML = msg;
    }

    updateExportDate() {
        const lastExport = this.rootModel.get('fields.print_exported');
        let formattedDate = 'Never';
        if (lastExport) {
            formattedDate = this.dateTimeHelper.timestampToNiceDate(lastExport);
        }
        this.dom.exportDate.innerHTML = formattedDate;
    }

}
