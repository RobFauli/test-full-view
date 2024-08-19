export class AptomaExport {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = this.api.v1.user.hasPermission('export_aptoma') && this.api.v1.config.get('aptoma.enabled');
        this.printArticleTypes = this.api.v1.config.get('aptoma.printArticleTypes') || [];
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-space-above-none">
                <h2 class="lab-title lab-grid-large-12 lab-space-below-medium lab-space-above-none">Export article to Aptoma</h2>
            </div>
            <div class="lab-formgroup lab-grid lab-space-above-none">
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="lab_printArticleTypeId">Select article type</label>
                    <select name="fields.lab_printArticleTypeId" id="lab_printArticleTypeId">
                        <option value="">Select article type</option>
                        {{ #printArticleTypes }}
                            <option value="{{ value }}"{{ #selected }} selected{{ /selected }}>{{ name }}</option>
                        {{ /printArticleTypes }}
                    </select>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="lab_printEditionDateFormatted">Select print edition</label>
                    <input type="date" id="lab_printEditionDateFormatted" name="fields.lab_printEditionDateFormatted" value="{{ fields.lab_printEditionDateFormatted }}">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="lab_printPage">Select print page</label>
                    <input type="number" id="lab_printPage" name="fields.lab_printPage" value="{{ fields.lab_printPage }}">
                </div>
            </div>
        </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'Export',
            label: 'Aptoma'
        };
    }

    onPaths() {
        return {
            'fields.lab_printEditionDateFormatted': {
                node: 'fields.lab_printEditionDateFormatted',
                callback: (element) => {
                    this.rootModel.set('fields.lab_printEditionDate', element.valueAsNumber);
                }
            },
            'fields.lab_printArticleTypeId': {
                node: 'fields.lab_printArticleTypeId',
                callback: (element) => {
                    if (element.value) {
                        this.rootModel.set('fields.lab_printArticleType', this.printArticleTypes.find((item) => item.id === parseInt(element.value, 10)).type);
                    } else {
                        this.rootModel.set('fields.lab_printArticleType', null);
                    }
                }
            },
            'fields.lab_printPage': { node: 'fields.lab_printPage' }
        };
    }

    onMarkup() {
        const currentPrintArticleType = parseInt(this.rootModel.get('fields.lab_printArticleTypeId'), 10);
        const printArticleTypes = (this.printArticleTypes || []).map((item) => ({ name: item.type, value: item.id, selected: item.id === currentPrintArticleType }));
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            printArticleTypes,
            fields: {
                lab_printArticleTypeId: this.rootModel.get('fields.lab_printArticleTypeId'),
                lab_printArticleType: this.rootModel.get('fields.lab_printArticleType'),
                lab_printEditionDate: this.rootModel.get('fields.lab_printEditionDate'),
                lab_printEditionDateFormatted: this.rootModel.get('fields.lab_printEditionDateFormatted'),
                lab_printPage: this.rootModel.get('fields.lab_printPage')
            }
        }, true);
        return markup;
    }

}
