export class ArticleAdvancedSettings {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">

            <div class="lab-formgroup lab-grid lab-bordered">
                <h2 class="lab-title lab-grid-large-12 lab-space-below-large">Advanced settings</h2>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="lab_canonical">Canonical url</label>
                    <input type="text" value="{{ fields.lab_canonical}}" name="fields.lab_canonical" id="lab_canonical" placeholder="Preferred URL ...">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="lab_redirect_url">Redirect url</label>
                    <input type="text" value="{{ fields.lab_redirect_url}}" name="fields.lab_redirect_url" id="lab_redirect_url" placeholder="301 redirect, use with caution ...">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-inline">
                    <label for="showonfp">Show on front</label>
                    <input type="checkbox" value="1" name="fields.showonfp" id="showonfp" {{ #fields.showonfp }}checked{{ /fields.showonfp }}>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-inline">
                    <label for="hideFromToplist">Hide from toplist</label>
                    <input type="checkbox" value="1" name="fields.hideFromToplist" id="hideFromToplist" {{ #fields.hideFromToplist }}checked{{ /fields.hideFromToplist }}>
                </div>
            </div>

            <div class="lab-formgroup lab-grid">
                <h2 class="lab-title lab-grid-large-12 lab-space-below-medium lab-space-above-none">Original urls</h2>
                {{ ^displayOriginalUrl }}
                <p>Enable permission <em>admin_batchoperations</em> to edit original url's.</p>
                {{ /displayOriginalUrl }}
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="original_url">Original url #1</label>
                    <input type="text" value="{{ fields.original_url}}" name="fields.original_url" id="original_url" placeholder="Original url for this article ..."{{ ^displayOriginalUrl }} disabled{{ /displayOriginalUrl }}>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="original_url_2">Original url #2</label>
                    <input type="text" value="{{ fields.original_url_2}}" name="fields.original_url_2" id="original_url_2" placeholder="Original url for this article ..."{{ ^displayOriginalUrl }} disabled{{ /displayOriginalUrl }}>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="original_url_3">Original url #3</label>
                    <input type="text" value="{{ fields.original_url_3}}" name="fields.original_url_3" id="original_url_3" placeholder="Original url for this article ..."{{ ^displayOriginalUrl }} disabled{{ /displayOriginalUrl }}>
                </div>

        </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'Advanced',
            label: 'Settings'
        };
    }

    onPaths() {
        return {
            'fields.showonfp': { node: 'fields.showonfp', boolean: true },
            'fields.hideFromToplist': { node: 'fields.hideFromToplist', boolean: true },
            'fields.lab_canonical': { node: 'fields.lab_canonical' },
            'fields.lab_redirect_url': { node: 'fields.lab_redirect_url', validator: 'isUrlOrEmpty' },
            'fields.original_url': { node: 'fields.original_url', validator: 'noWhiteSpace' },
            'fields.original_url_2': { node: 'fields.original_url_2', validator: 'noWhiteSpace' },
            'fields.original_url_3': { node: 'fields.original_url_3', validator: 'noWhiteSpace' }
        };
    }

    onMarkup() {
        const showonfp = this.rootModel.get('fields.showonfp');
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            fields: {
                showonfp: showonfp === null ? true : !!showonfp,
                hideFromToplist: this.rootModel.get('fields.hideFromToplist'),
                lab_canonical: this.rootModel.get('fields.lab_canonical'),
                lab_redirect_url: this.rootModel.get('fields.lab_redirect_url'),
                original_url: this.rootModel.get('fields.original_url'),
                original_url_2: this.rootModel.get('fields.original_url_2'),
                original_url_3: this.rootModel.get('fields.original_url_3')
            },
            displayOriginalUrl: this.api.v1.user.hasPermission('admin_batchoperations')
        }, true);
        return markup;
    }

}
