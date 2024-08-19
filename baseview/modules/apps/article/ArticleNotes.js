export class ArticleNotes {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">

            <div class="lab-formgroup lab-grid">
                <h2 class="lab-title lab-grid-large-12">Article Notes</h2>
                <div class="lab-formgroup-item lab-grid-large-12">
                    <label for="article_notes">Notes for this article. Only visible in the editor</label>
                    <textarea id="article_notes" name="fields.articleNotes" style="height: 480px;" placeholder="Info for editors, front-desk or other journalists ...">{{{ fields.articleNotes }}}</textarea>
                </div>
            </div>            

        </div>`;
    }

    onAside() {
        return {
            section: 'General',
            label: 'Notes'
        };
    }

    onPaths() {
        return {
            'fields.articleNotes': { node: 'fields.articleNotes' }
        };
    }

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                articleNotes: this.rootModel.get('fields.articleNotes')
            }
        }, true);
        return markup;
    }

}
