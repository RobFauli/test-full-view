export class ArticleStyling {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.dom = {};
        this.embeddable = this.api.v1.config.get('embeddable.active');
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">

            <div class="lab-formgroup lab-grid">
                <h2 class="lab-title lab-grid-large-12 lab-space-below-large">Article Style</h2>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-large">
                    <label for="article_style">Select style for this article</label>
                    <select name="fields.articleStyle" id="article_style">
                        <option value="">Default style</option>
                        {{ #articleStyles }}
                        <option value="{{ value }}"{{ #selected }} selected{{ /selected }}>{{ name }}</option>
                        {{ /articleStyles }}
                    </select>
                </div>

                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-large">
                    <label for="bodytext_width">Select width for this articles bodytext</label>
                    <select name="fields.bodytextWidth" id="bodytext_width">
                        <option value="">Default style</option>
                        {{ #bodytextWidths }}
                            <option value="{{ value }}"{{ #selected }} selected{{ /selected }}>{{ name }}</option>
                        {{ /bodytextWidths }}
                    </select>
                </div>

                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-large">
                    <label for="bodytext_alignment">Select alignment for this articles bodytext</label>
                    <select name="fields.bodytextAlignment" id="bodytext_alignment">
                        <option value="">Default style</option>
                        {{ #bodytextAlignments }}
                            <option value="{{ value }}"{{ #selected }} selected{{ /selected }}>{{ name }}</option>
                        {{ /bodytextAlignments }}
                    </select>
                </div>

                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-large">
                    <label for="header_width">Select width of header elements</label>
                    <select name="fields.articleHeaderWidthSetup" id="header_width">
                        <option value="">Default style</option>
                        {{ #headerWidths }}
                            <option value="{{ value }}"{{ #selected }} selected{{ /selected }}>{{ name }}</option>
                        {{ /headerWidths }}
                    </select>
                </div>

                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="hidePublishedDate">Hide published date</label>
                    <input type="checkbox" value="1" name="fields.hidePublishedDate" id="hidePublishedDate" {{ #fields.hidePublishedDate }}checked{{ /fields.hidePublishedDate }}>
                </div>

                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="showcomments">Show comments</label>
                    <input type="checkbox" value="1" name="fields.showcomments" id="showcomments" {{ #fields.showcomments }}checked{{ /fields.showcomments }}>
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="showbylineonfp">Show byline on front</label>
                    <input type="checkbox" value="1" name="fields.showbylineonfp" id="showbylineonfp" {{ #fields.showbylineonfp }}checked{{ /fields.showbylineonfp }}>
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="style_slidein">Slide-in effect</label>
                    <input type="checkbox" value="1" name="fields.style_slidein" id="style_slidein" {{ #fields.style_slidein }}checked{{ /fields.style_slidein }}>
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="style_spacing">Enable custom space editing</label>
                    <input type="checkbox" value="1" name="fields.style_spacing" id="style_spacing" {{ #fields.style_spacing }}checked{{ /fields.style_spacing }}>
                </div>
                {{ #displayReadProgressOption }}
                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="displayReadProgress">
                    Display read progress
                    {{ #displayReadProgressOptionWarning }}
                        (article is too short)
                    {{ /displayReadProgressOptionWarning }}
                    </label>
                    <input type="checkbox" value="1" name="fields.displayReadProgress" id="displayReadProgress" {{ #fields.displayReadProgress }}checked{{ /fields.displayReadProgress }} {{ #displayReadProgressOptionWarning }}disabled{{ /displayReadProgressOptionWarning }}>
                </div>
                {{ /displayReadProgressOption }}
                {{ #displayReadTimeOption }}
                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="displayReadTime">Display read-time</label>
                    <input type="checkbox" value="1" name="fields.displayReadTime" id="displayReadTime" {{ #fields.displayReadTime }}checked{{ /fields.displayReadTime }}>
                </div>
                {{ /displayReadTimeOption }}
                <h3 class="lab-title lab-grid-large-12 lab-space-above-large">Display Social Media Icons</h3>
                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="show_social_bodytext_before">Bodytext before</label>
                    <input type="checkbox" value="1" name="fields.show_social_bodytext_before" id="show_social_bodytext_before" {{ #fields.show_social_bodytext_before }}checked{{ /fields.show_social_bodytext_before }}>
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="show_social_bodytext_after">Bodytext after</label>
                    <input type="checkbox" value="1" name="fields.show_social_bodytext_after" id="show_social_bodytext_after" {{ #fields.show_social_bodytext_after }}checked{{ /fields.show_social_bodytext_after }}>
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="show_social_header">Header</label>
                    <input type="checkbox" value="1" name="fields.show_social_header" id="show_social_header" {{ #fields.show_social_header }}checked{{ /fields.show_social_header }}>
                </div>
                ${ this.embeddable ? `
                <h3 class="lab-title lab-grid-large-12 lab-space-above-large">Embed options</h3>
                <div class="lab-formgroup-item lab-grid-large-6 lab-inline">
                    <label for="displayEmbedButton">Display embed button</label>
                    <input type="checkbox" value="1" name="fields.displayEmbedButton" id="displayEmbedButton" {{ #fields.displayEmbedButton }}checked{{ /fields.displayEmbedButton }}>
                </div>
                ` : '' }
            </div>
        </div>`;
    }

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'General',
            label: 'Article styling'
        };
    }

    onPaths() {
        return {
            'fields.articleStyle': {
                node: 'fields.articleStyle',
                callback: (element) => {
                    // Update selector on body-element for all viewports in the editor
                    // to allow preview without a reload.
                    // Assumes value of 'fields.articleStyle' is set on the body-element in template(s).
                    const docs = lab_api.v1.viewport.getContexts();
                    const current = this.rootModel.get('fields.articleStyle');
                    for (const doc of docs) {
                        if (current) { doc.body.classList.remove(current); }
                        if (element.value) { doc.body.classList.add(element.value); }
                    }
                }
            },
            'fields.bodytextWidth': {
                node: 'fields.bodytextWidth',
                callback: (element) => {
                    // Update selector on body-element for all viewports in the editor
                    // to allow preview without a reload.
                    // Assumes value of 'fields.articleStyle' is set on the body-element in template(s).
                    const docs = lab_api.v1.viewport.getContexts();
                    const current = this.rootModel.get('fields.bodytextWidth');
                    for (const doc of docs) {
                        if (current) {
                            doc.body.classList.remove('custom-bodytext-width');
                            doc.querySelector(':root').style.setProperty('--bodytext-width', 'var(--bodytext-width-default)');
                        }
                        if (element.value) {
                            doc.body.classList.add('custom-bodytext-width');
                            doc.querySelector(':root').style.setProperty('--bodytext-width', `var(${ element.value })`);
                        }
                    }
                }
            },
            'fields.bodytextAlignment': {
                node: 'fields.bodytextAlignment',
                callback: (element) => {
                    // Update selector on body-element for all viewports in the editor
                    // to allow preview without a reload.
                    // Assumes value of 'fields.bodytextAlignment' is set on the body-element in template(s).
                    const docs = lab_api.v1.viewport.getContexts();
                    const current = this.rootModel.get('fields.bodytextAlignment');
                    for (const doc of docs) {
                        if (current) {
                            doc.body.classList.remove('custom-bodytext-alignment');
                            doc.querySelector(':root').style.setProperty('--bodytext-alignment', 'var(--bodytext-alignment-default)');
                        }
                        if (element.value) {
                            doc.body.classList.add('custom-bodytext-alignment');
                            doc.querySelector(':root').style.setProperty('--bodytext-alignment', `var(${ element.value })`);
                        }
                    }
                }
            },
            'fields.articleHeaderWidthSetup': {
                node: 'fields.articleHeaderWidthSetup',
                callback: (element) => {
                    const docs = lab_api.v1.viewport.getContexts();
                    const current = this.rootModel.get('fields.articleHeaderWidthSetup');
                    for (const doc of docs) {
                        if (current) {
                            doc.body.classList.remove('articleHeader-bodytext-width', 'articleHeader-image-bodytext-width', 'articleHeader-meta-bodytext-width');
                            this.rootModel.set('fields.articleHeaderBodytextWidth', false);
                            this.rootModel.set('fields.articleHeaderImageBodytextWidth', false);
                            this.rootModel.set('fields.articleMetaBodytextWidth', false);
                        }
                        switch (element.value) {
                            case 'everything':
                                doc.body.classList.add('articleHeader-bodytext-width', 'articleHeader-image-bodytext-width', 'articleHeader-meta-bodytext-width');
                                this.rootModel.set('fields.articleHeaderBodytextWidth', true);
                                this.rootModel.set('fields.articleHeaderImageBodytextWidth', true);
                                this.rootModel.set('fields.articleMetaBodytextWidth', true);
                                break;
                            case 'everything-except-image':
                                doc.body.classList.add('articleHeader-bodytext-width', 'articleHeader-meta-bodytext-width');
                                this.rootModel.set('fields.articleHeaderBodytextWidth', true);
                                this.rootModel.set('fields.articleMetaBodytextWidth', true);
                                break;
                            case 'everything-except-meta':
                                doc.body.classList.add('articleHeader-bodytext-width', 'articleHeader-image-bodytext-width');
                                this.rootModel.set('fields.articleHeaderBodytextWidth', true);
                                this.rootModel.set('fields.articleHeaderImageBodytextWidth', true);
                                break;
                            case 'only-image':
                                doc.body.classList.add('articleHeader-image-bodytext-width');
                                this.rootModel.set('fields.articleHeaderImageBodytextWidth', true);
                                break;
                            case 'only-meta':
                                doc.body.classList.add('articleHeader-meta-bodytext-width');
                                this.rootModel.set('fields.articleMetaBodytextWidth', true);
                                break;
                            case 'only-text':
                                doc.body.classList.add('articleHeader-bodytext-width');
                                this.rootModel.set('fields.articleHeaderBodytextWidth', true);
                                break;
                            default:
                                doc.body.classList.remove('articleHeader-bodytext-width', 'articleHeader-image-bodytext-width', 'articleHeader-meta-bodytext-width');
                                this.rootModel.set('fields.articleHeaderBodytextWidth', false);
                                this.rootModel.set('fields.articleHeaderImageBodytextWidth', false);
                                this.rootModel.set('fields.articleMetaBodytextWidth', false);
                                break;
                        }
                    }
                }
            },
            'fields.articleHeaderBodytextWidth': { node: 'fields.articleHeaderBodytextWidth', boolean: true },
            'fields.articleHeaderImageBodytextWidth': { node: 'fields.articleHeaderImageBodytextWidth', boolean: true },
            'fields.articleMetaBodytextWidth': { node: 'fields.articleMetaBodytextWidth', boolean: true },
            'fields.style_slidein': { node: 'fields.style_slidein', boolean: true },
            'fields.style_spacing': { node: 'fields.style_spacing', boolean: true, suggestReload: true },
            'fields.hidePublishedDate': { node: 'fields.hidePublishedDate', boolean: true },
            'fields.showcomments': { node: 'fields.showcomments', boolean: true },
            'fields.showbylineonfp': { node: 'fields.showbylineonfp', boolean: true },
            'fields.displayReadProgress': { node: 'fields.displayReadProgress', boolean: true },
            'fields.displayReadTime': { node: 'fields.displayReadTime', boolean: true },
            'fields.show_social_bodytext_after': { node: 'fields.show_social_bodytext_after', boolean: true },
            'fields.show_social_bodytext_before': { node: 'fields.show_social_bodytext_before', boolean: true },
            'fields.show_social_header': { node: 'fields.show_social_header', boolean: true },
            'fields.displayEmbedButton': { node: 'fields.displayEmbedButton', boolean: true, suggestReload: true }
        };
    }

    showReadProgressColumnsWarning() {
        const targetSelectors = ['.articleHeader', '.bodytext'];
        let elements = [];
        const docs = this.api.v1.viewport.getContexts();
        for (const doc of docs) {
            for (const target of (targetSelectors || [])) {
                const targetElement = doc.querySelector(target);
                if (targetElement) {
                    elements = elements.concat(Array.from(targetElement.children).filter((el) => !el.classList.contains('column')));
                }
            }
            // Only need to run this for one viewport
            break;
        }
        if (!elements.length) {
            Sys.logger.debug('[ReadProgress] Article has no length, show warning');
            return true;
        }
        const minElementCount = parseInt(this.api.v1.config.get('displayReadProgress.minElementCount') || 25, 10);
        if (elements.length < minElementCount) {
            Sys.logger.debug(`[ReadProgress] Article length (${  elements.length  }) is less than minimum ${  minElementCount  }, show warning`);
            return true;
        }

        return false;
    }

    onMarkup() {
        const socialDisplay = this.api.v1.config.get(`page_settings.article.social.display`) || {};

        const socialDisplayBodytextBefore = this.rootModel.get('fields.show_social_bodytext_before');
        const socialDisplayBodytextAfter = this.rootModel.get('fields.show_social_bodytext_after');
        const socialDisplayHeader = this.rootModel.get('fields.show_social_header');

        const currentArticleStyle = this.rootModel.get('fields.articleStyle');
        const articleStyles = (this.api.v1.config.get('articleStyles') || []).map((item) => ({ name: item.name, value: item.value, selected: item.value === currentArticleStyle }));
        const currentBodytextWidth = this.rootModel.get('fields.bodytextWidth');
        const bodytextWidths = (this.api.v1.config.get('bodytextWidths.desktop') || []).map((item) => ({ name: item.name, value: item.value, selected: item.value === currentBodytextWidth }));
        const currentBodytextAlignment = this.rootModel.get('fields.bodytextAlignment');
        const bodytextAlignments = (this.api.v1.config.get('bodytextAlignments') || []).map((item) => ({ name: item.name, value: item.value, selected: item.value === currentBodytextAlignment }));
        const currentHeaderWidths = this.rootModel.get('fields.articleHeaderWidthSetup');
        const headerWidths = (this.api.v1.config.get('headerWidths') || []).map((item) => ({ name: item.name, value: item.value, selected: item.value === currentHeaderWidths }));
        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            articleStyles,
            bodytextWidths,
            bodytextAlignments,
            headerWidths,
            fields: {
                showcomments: this.rootModel.get('fields.showcomments'),
                showbylineonfp: this.rootModel.get('fields.showbylineonfp'),
                articleStyle: this.rootModel.get('fields.articleStyle'),
                bodytextWidth: this.rootModel.get('fields.bodytextWidth'),
                bodytextAlignment: this.rootModel.get('fields.bodytextAlignment'),
                headerWidths: this.rootModel.get('fields.articleHeaderWidthSetup'),
                style_slidein: this.rootModel.get('fields.style_slidein'),
                style_spacing: this.rootModel.get('fields.style_spacing'),
                hidePublishedDate: this.rootModel.get('fields.hidePublishedDate'),
                displayReadProgress: this.rootModel.get('fields.displayReadProgress'),
                displayReadTime: this.rootModel.get('fields.displayReadTime'),
                show_social_bodytext_after: socialDisplayBodytextAfter === null ? socialDisplay.bodytext_after : !!socialDisplayBodytextAfter,
                show_social_bodytext_before: socialDisplayBodytextBefore === null ?  socialDisplay.bodytext_before : !!socialDisplayBodytextBefore,
                show_social_header: socialDisplayHeader === null ? socialDisplay.header : !!socialDisplayHeader,
                displayEmbedButton: !!this.rootModel.get('fields.displayEmbedButton')
            },
            displayReadProgressOption: !!this.api.v1.config.get('displayReadProgress.active'),
            displayReadProgressOptionWarning: this.showReadProgressColumnsWarning(),
            displayReadTimeOption: !!this.api.v1.config.get('displayReadTime.active')
        }, true);

        return markup;
    }

}
