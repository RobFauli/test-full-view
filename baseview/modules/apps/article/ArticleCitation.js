export class ArticleCitation {

    constructor(api, menuItem, aiOptions = { model: 'gpt-4-turbo' }) {

        this.api = api;
        this.rootModel = this.api.v1.model.query.getRootModel();
        this.menuItem = menuItem;
        this.bodytext = this.setupBodytext();

        this.enabled = false;
        this.modal = null;
        this.aiOptions = aiOptions;

        this.template = `
            <div class="lab-modal-form lab-grid">
                <div id="input-area" class="lab-formgroup lab-grid">
                    <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                        <label for="citation_original_text" class="lab-title"><b>Copy of original text</b></label>
                        <textarea data-sugegstion-name="original_text" name="fields.original_text" id="citation_original_text" placeholder="Original content that you wish to generate a citation article from">{{ fields.original_text }}</textarea>
                    </div>
                    <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-small">
                        <label for="citation_original_source"><b>Name of source</b></label>
                        <input type="text" data-sugegstion-name="original_source" name="fields.original_source" id="citation_original_source" placeholder="Like 'The Guardian' or 'BBC'">{{ fields.original_source }}</input>
                    </div>
                    <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-small">
                        <label for="citation_original_url"><b>Source url</b></label>
                        <input style="float:right; position:relative width:auto" type="text" data-sugegstion-name="original_url" name="fields.original_url" id="citation_original_url" placeholder="https://www.bbc.com/news/12345">{{ fields.original_url }}</input>
                        <div>{{{ buttons.generate_content }}}</div>

                    </div>
                    <p id="info_input" class="lab-hidden"><strong><em>You must provide data in all input fields</em></strong></p>
                </div>

                <div id="generated_text_area" class="lab-hidden">
                    <h3>Generated text</h3>
                    <textarea id="citation_generated_text" rows="8" style="height:auto;"></textarea>

                    {{{ buttons.reject_content }}} {{{ buttons.retry }}} {{{ buttons.overwrite_content }}} {{{ buttons.insert_content }}}
                </div>
            </div>
        `;
        this.display();
        this.generatedContent = '';
        this.temporaryContent = '<span class="temporaryGeneratedString"> </span>';
        this.contentRemove = '';
        this.contentUpdate = '';

    }

    setupBodytext() {
        this.menuItem.menu.tool.insertMarkup('<span class="temporaryGeneratedString"> </span>');
        return this.rootModel.get('fields.bodytext');

    }

    getMarkup() {
        const buttons = {
            generate_content: `<span type="button" class="lab-btn lab-generate" id="suggest-btn-generate_content" style="float:right; position:relative">Generate citation article</span>`,
            reject_content: `<span type="button" class="lab-btn" id="suggest-btn-reject-content" style="float:left; position:relative">Cancel</span>`,
            retry: `<span type="button" class="lab-btn" id="suggest-btn-retry" style="float:left; position:relative">Retry</span>`,
            overwrite_content: `<span type="button" class="lab-btn lab-hidden" id="suggest-btn-overwrite-content" style="float:right; position:relative">Overwrite bodytext</span>`,
            insert_content: `<span type="button" class="lab-btn" id="suggest-btn-insert-content" style="float:right; position:relative">Insert content</span>`
        };

        const citation_generated_text = `<p id="citation_generated_text" class="lab-hidden"></p>`;

        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            buttons,
            citation_generated_text,
            fields: {
                bodytext: this.rootModel.get('fields.bodytext'),
                generatedContent: this.rootModel.get('fields.generatedContent'),
                original_text: this.rootModel.get('fields.original_text')

            }
        }, true);

        this.markup = markup;
        return markup;

    }

    display() {

        const markup = this.getMarkup();
        this.api.v1.ui.modal.dialog({
            content: {
                header: 'Generate citation article',
                markup: markup.innerHTML
            },
            footer: {
                informalText: '<strong>This function in Labrador CMS is using advanced artificial intelligence developed by OpenAI API.</strong><br>Text from the article is not used to train or improve the public data models. Use generated text from these functions as suggestions, and be sure to manually verify them. Labrador CMS shall not be held liable for any use of the generated text. For now the use of these functions are covered by your Labrador CMS license. We might change this in the future, when we know more about our operational costs.',
                buttons: [{
                    type: 'submit',
                    value: 'OK',
                    class: 'lab-hidden',
                    highlight: true
                }]
            },
            callbacks: {
                didDisplay: (modal) => {
                    const modalMarkup = modal.getMarkup();

                    // Initialise content generation
                    const btnGenerate = modalMarkup.querySelector(`#suggest-btn-generate_content`);
                    const info_input = modalMarkup.querySelector('#info_input');
                    const generatedText = modalMarkup.querySelector(`#citation_generated_text`);
                    const inputArea = modalMarkup.querySelector(`#input-area`);
                    const generatedArea = modalMarkup.querySelector('#generated_text_area');

                    // Button - generate data
                    btnGenerate.addEventListener('click', (event) => {

                        // Input fields
                        const original_content = modalMarkup.querySelector('#citation_original_text').value;
                        const original_source = modalMarkup.querySelector('#citation_original_source').value;
                        const original_url = modalMarkup.querySelector('#citation_original_url').value;

                        // Input for text assistant
                        const style = 'Journalistic';
                        const tone = 'Journalistic';

                        if (original_content && original_source && original_url) {
                            // Start fetch from textAssistant
                            if (original_content.length < 400) {
                                info_input.classList.remove('lab-hidden');
                                info_input.textContent = 'The copied text must be at least 400 characters long.';
                                Sys.logger.error('Error: The original article content must have at least 400 characters');

                            } else {
                                // State change - good input
                                modal.setBusyState(true);
                                info_input.classList.add('lab-hidden');
                                btnGenerate.classList.add('lab-disabled');

                                // Generate citation article
                                this.api.v1.ns.get('textAssistant.fetchByGroupName')('article_citation', this.aiOptions, {
                                    tone, style, original_content, original_source, original_url
                                }).then((respons) => {
                                    // Hide input area
                                    inputArea.classList.add('lab-hidden');

                                    // Clean up respons
                                    let result = { article: '' };
                                    if (!respons.startsWith('{')) {
                                        result = { article: respons };
                                    } else {
                                        result = JSON.parse(respons);
                                    }

                                    // Show generated text
                                    generatedText.textContent = result.article;
                                    generatedArea.classList.remove('lab-hidden');

                                    modal.setBusyState(false);

                                });
                            }
                        } else {
                            // State change - show bad input
                            info_input.textContent = 'You need to add data to all fields and the article content must be at least 400 characters long.';
                            info_input.classList.remove('lab-hidden');

                            Sys.logger.error('Error: There is not enough input data to generate an citation article from');
                        }

                    });

                    // Overwrite bodytext
                    const btnOverwrite = modalMarkup.querySelector(`#suggest-btn-overwrite-content`);
                    if (this.bodytext && this.bodytext.length > 0 && this.bodytext !== this.temporaryContent) {
                        btnOverwrite.classList.remove('lab-hidden');
                    }
                    btnOverwrite.addEventListener('click', (event) => {
                        this.contentUpdate = generatedText.textContent;
                        this.contentRemove = this.bodytext;
                        modal.close();
                    });

                    // Insert into bodytext
                    const btnInsert = modalMarkup.querySelector(`#suggest-btn-insert-content`);
                    btnInsert.addEventListener('click', (event) => {
                        this.contentUpdate = generatedText.textContent;
                        this.contentRemove = this.temporaryContent;
                        modal.close();
                    });

                    // Retry
                    const btnRety = modalMarkup.querySelector(`#suggest-btn-retry`);
                    btnRety.addEventListener('click', (event) => {
                        btnGenerate.classList.remove('lab-disabled');
                        inputArea.classList.remove('lab-hidden');
                        generatedArea.classList.add('lab-hidden');
                    });

                    // Reject
                    const btnReject = modalMarkup.querySelector(`#suggest-btn-reject-content`);
                    btnReject.addEventListener('click', (event) => {
                        this.contentUpdate = '';
                        this.contentRemove = this.temporaryContent;
                        modal.close();
                    });
                },

                end: () => {
                    // Handle insert
                    if (this.bodytext && (this.bodytext !== this.contentRemove)) {
                        this.bodytext = this.rootModel.get('fields.bodytext');
                        this.contentUpdate = this.bodytext.replace(this.contentRemove, this.contentUpdate);

                    }
                    // Clean up
                    this.contentUpdate = this.contentUpdate.replaceAll(this.temporaryContent, '');

                    // Update bodytext
                    this.rootModel.set('fields.bodytext', this.contentUpdate);

                }
            }

        });
    }
    /*
    getMarkup() {
        return this.modal;
    }
    */

}
