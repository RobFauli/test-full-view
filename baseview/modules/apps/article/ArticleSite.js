export class ArticleSite {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid">
                <h2 class="lab-title lab-grid-large-12 lab-space-below-large">Site for this article</h2>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <label for="site_id">Select site</label>
                    <select name="site_id" id="site_id">
                        {{#sites}}
                        <option value="{{value}}" {{#selected}}selected{{/selected}}>{{name}}</option>
                        {{/sites}}
                    </select>
                </div>
            </div>
        </div>`;
    }

    onAside() {
        return {
            section: 'Advanced',
            label: 'Site'
        };
    }

    onPaths() {
        return {
            site_id: { node: 'site_id', validator: 'notEmpty', suggestReload: true }
        };
    }

    onMarkup() {
        const siteId = lab_api.v1.site.getSite().id;
        const sites = this.api.v1.user.getSites().map((site) => ({ value: site.id, name: site.display_name, selected: site.id === siteId }));
        const markup = this.api.v1.util.dom.renderTemplate(this.template, { sites }, true);
        return markup;
    }

}
