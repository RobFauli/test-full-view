export class AutomationSettings {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.meta = params.meta;
        this.frontSettings = this.api.v1.pages.front.getByNodeId(this.rootModel.getId());
        this.enabled = true;
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap lab-space-below-large lab-space-above-none">Automatic content</h2>

                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-3 lab-grid-gap lab-inline">
                    <label for="id-meta.automatic">Enabled</label>
                    <input id="id-meta.automatic" type="checkbox" name="automatic" value="1"{{ #meta.automatic }} checked{{ /meta.automatic }}>
                </div>

                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-9 lab-grid-gap lab-inline">
                    <label for="id-meta.termMode">Use terms, not tags</label>
                    <input id="id-meta.termMode" type="checkbox" name="termMode" value="1"{{ #meta.termMode }} checked{{ /meta.termMode }}>
                </div>

                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                    <label for="automation-layout">Layout from page</label>
                    <div data-placeholder="automation-layout">
                        <!-- Element replaced by modal -->
                    </div>
                </div>
                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap lab-bordered">
                    <label for="automation-automatic_site_id">Content from site</label>
                    <div data-placeholder="automation-automatic_site_id">
                        <!-- Element replaced by modal -->
                    </div>
                </div>

                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <label for="automation-tags">Include tags</label>
                    <input type="text" name="tags" id="automation-tags" value="{{ meta.tags }}" placeholder="Comma-separated list of tags ...">
                </div>
                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap lab-inline">
                    <label for="automation-automatic_and">Require all tags (AND)</label>
                    <input type="checkbox" name="automatic_and" id="automation-automatic_and" value="1"{{ #meta.automatic_and }} checked{{ /meta.automatic_and }}>
                </div>
                <div class="lab-formgroup-item lab-space-below-medium lab-grid-large-12 lab-grid-gap">
                    <label for="automation-exclude">Exclude tags</label>
                    <input type="text" name="exclude" id="automation-exclude" value="{{ meta.exclude }}" placeholder="Comma-separated list of tags ...">
                </div>
            </div>
        </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'Automation',
            label: 'Automatic content'
        };
    }

    onPaths() {
        return {
            automatic: {
                node: 'fields.automatic',
                meta: 'automatic',
                boolean: true
            },
            termMode: {
                node: 'fields.termMode',
                meta: 'termMode',
                boolean: true
            },
            layout: {
                meta: 'layout',
                validator: 'notEmpty'
            },
            automatic_site_id: {
                meta: 'automatic_site_id'
            },
            tags: {
                meta: 'tags'
            },
            exclude: {
                meta: 'exclude'
            },
            automatic_and: {
                meta: 'automatic_and',
                boolean: true
            }
        };
    }

    onMarkup() {
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            meta: this.meta
        }, true);
        const layoutPlaceholder = markup.querySelector('[data-placeholder="automation-layout"]');
        layoutPlaceholder.parentNode.replaceChild(this.api.v1.ui.element.getPageSelector({
            siteId: null,
            value: parseInt(this.meta.layout, 10),
            pages: this.api.v1.pages.front.getAll().map((page) => ({
                frontname: page.frontid === this.frontSettings.frontid ? (`${ page.frontname } (this page)`) : page.frontname,
                nodeid: page.frontid,
                site_id: page.site_id
            })),
            attributes: [{
                name: 'name', value: 'layout'
            }, {
                name: 'id', value: 'automation-layout'
            }]
        }), layoutPlaceholder);
        const sitePlaceholder = markup.querySelector('[data-placeholder="automation-automatic_site_id"]');
        sitePlaceholder.parentNode.replaceChild(this.api.v1.ui.element.getSiteSelector({
            label: 'All sites',
            value: parseInt(this.meta.automatic_site_id, 10) || '',
            attributes: [{
                name: 'name', value: 'automatic_site_id'
            }, {
                name: 'id', value: 'automation-automatic_site_id'
            }]
        }), sitePlaceholder);
        // Fix for automatic_and. The boolean value is storead as string in meta.
        if (this.meta.automatic_and === 'false') {
            const automatic_and_el = markup.querySelector('#automation-automatic_and');
            automatic_and_el.removeAttribute('checked');
        }
        return markup;
    }

}
