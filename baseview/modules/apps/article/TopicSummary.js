import contentLanguages from '../../lib/helpers/ContentLanguages.js';

export class TopicSummary {

    /**
     * The app 'Topic Summary' lets a user generate a factbox from a selection of articles.
     * The user may adjust the prompt and visual output by selecting options.
     * The app uses the Labrador api to fetch articles and update the factbox.
     *
     * @param {object} api - The Labrador api
     * @param {object} model - The Labrador model
     * @param {object} view - The Labrador view
     * @param {object} aiSettings - Settings for the ai-integration (model, provider, integration)
     * @param {object} options - Options for the ai prompt
    */

    constructor(api, model, view, aiSettings = { model: 'gpt-4-turbo', provider: 'openAi', integration: 'openAi' }, options = { factboxType: 'overview' }) {
        this.api = api;
        this.rootModel = this.api.v1.model.query.getRootModel();
        this.factboxModel = model;
        this.factboxViews = this.api.v1.view.getViews(this.factboxModel);
        this.enabled = true;            // Enable app
        this.respons = null;            // Respons from ai service

        this.articleIds = [];           // List of ids for all selected article
        this.currentlySelected = [];    // List of ids for currently selected articles
        this.articleSelection = {};     // Data for selected articles

        this.aiSettings = aiSettings;   // Settings for the ai-integration (model, provider, integration)
        this.options = options;         // Options for the ai prompt

        this.template = `
        <div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-above-medium">

                    <h2 class="lab-title lab-grid-large-12 lab-grid-gap">Generate topic summary <span class="labicon-magic_wand"></span></h2>
                    <p>Generate a topic summary with a <b><span id="selectedType">{{ factboxType }}</span></b> style <span id="focalpointText"></span>in <b><span id="selectedLang">{{ languageName }}</span></b> from a selection of articles.
                    </p>
                    <p class="lab-hidden">The text will be generated with model '<b>{{ aiSettings.model }}</b>' from <b>{{ aiSettings.provider }}</b> using an integration to <b>{{ aiSettings.integration }}</b>.</p>
                    
                </div>
                <div>
                    <span id="get-article-list" type="button" class="lab-btn" style="float:left; position:relative">Select articles</span>
                </div>
            </div>

            <div class="lab-formgroup lab-hidden lab-grid lab-grid-gap lab-space-above-none">
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-above-medium">

                    <h3>Select articles by id</h3>
                    <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-below-small">
                        <input type="text" placeholder="100090, 100102" id="articleids"></input>
                    </div>
                    <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-below-small">
                        <div>
                            <span id="get-articles-textarea" type="button" class="lab-btn" style="float:left; position:relative">Fetch articles by ids
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lab-formgroup lab-grid-large-12 lab-grid-gap">                    
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-above-medium">
                    <h3>Selected articles:</h3>
                    <ul id="article-selection">
                        <p><em>No articles selected</em></p>
                    </ul>
                </div>
            </div>
            <div class="lab-formgroup lab-grid-large-12 lab-grid-gap lab-space-below-small">                    
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap">
                    <p id="generated-text"></p>
                </div>
            </div>
        </div>`;

        this.asideTemplate = `
        <div>
            <div class="lab-aside-settings">
                <div>
                    <h4 class="lab-title">Factbox type</h4>
                    <select id="factboxType">
                        <option value="overview">Topic overview</option>
                        <option value="development">Context development</option>
                        <option value="brief">Brief summary</option>
                    </select>
                    <p class="lab-info"><span id="factbox-description">Generate a broad overview and focus on the most important aspects of the topic</span></p>
                </div>
            </div>
            <div class="lab-aside-settings">
        
                <div>
                    <h4 class="lab-title">Language</h4>    
                    <select id="languages">
                        <option value="">Select language:</option>
                        {{ #languages }}
                        <option value="{{ code }}"{{ #selected }} selected{{ /selected }}>{{ name }} ({{ code }})</option>
                        {{ /languages }}
                    </select>
                </div>
            </div>
            <div class="lab-aside-settings">
                <div>
                    <h4 class="lab-title">Visual styling</h4>
                    <p class="lab-para lab-hidden"><label>Add source references<input type="checkbox" title="Include a link to article sources" id="use-references" style="float:left;"></label></p>
                    <p class="lab-para"><label>Bullet points<input type="checkbox" title="Add a bulletpoint for each paragraph" id="use-bulletpoints" style="float:left;"></label></p>
                    <p class="lab-para lab-hidden"><label>Bold names<input type="checkbox" title="Add bold styling on names" id="use-bold-names" style="float:left;"></label></p>
                    <p class="lab-para lab-hidden"><label>Bold keywords<input type="checkbox" title="Add bold styling on keywords" id="use-bold-keywords" style="float:left;"></label></p>
                    <p class="lab-para lab-hidden"><label>Add subheader(s)<input type="checkbox" title="Include suitable subheader(s)" id="use-subheader" style="float:left;"></label></p>
                </div>
            </div>
            <div class="lab-aside-settings">
            <div>
                <h4 class="lab-title">Focal point</h4>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-below-small">
                    <input type="text" placeholder="Optional" id="focalpoint"></input>
                </div>
                <p class="lab-info">Write a name, an incident or a place that you want to emphasize in the summary. The AI will try to include this in the summary.</p>
            </div>
        </div>
        </div>`;

        this.display();
    }

    onPaths() {
        /**
         * Paths to listen for changes
         */
        return {
            'fields.seolanguage': {
                node: 'fields.seolanguage'
            }
        };
    }

    getAsideMarkup() {
        /**
         * Aside modal markup
         * The aside modal is used to select options for the prompt
         */
        const seolanguage = this.rootModel.get('fields.seolanguage');
        const defaultLanguage = lab_api.v1.config.get('contentLanguage');

        this.selectedLanguage = seolanguage || defaultLanguage;

        const languages = contentLanguages.map((language) => ({ name: language.name, code: language.code, selected: language.code === this.selectedLanguage }));
        const languageName = this.getLanguageName(this.selectedLanguage);

        this.asideMarkup = lab_api.v1.util.dom.renderTemplate(this.asideTemplate, {
            title: 'Select language',
            languages,
            languageName,
            language: this.selectedLanguage
        });
        return this.asideMarkup;
    }

    getMarkup() {
        /**
         * Main modal markup
         */
        this.markup = this.api.v1.util.dom.renderTemplate(this.template, {
            aiSettings: this.aiSettings
        }, true);

        return this.markup;
    }

    display() {
        // Set up markups
        this.asideMarkup = this.getAsideMarkup();
        this.markup = this.getMarkup();

        // Evaluate history
        let history = this.factboxModel.get('fields.ai_metadata_json');
        if (history && history.length > 0) {
            history = JSON.parse(history);
            if (history.selectionSourceIds) {
                this.articleIds = history.selectionSourceIds;
                this.updateArticleList(this.articleIds)
                    .then(() => {
                        this.updateModalMarkup();
                    });
            }
        }

        // Main modal
        this.modal = this.api.v1.ui.modal.dialog({
            container: {
                width: 1400,
                minHeight: 800

            },
            aside: {
                expandable: true,
                position: 'left',
                header: 'Options',
                content: this.asideMarkup,
                noPadding: true,
                width: '400px'
            },
            content: {
                header: 'Generate topic summary',
                markup: this.markup.innerHTML
            },
            footer: {
                informalText: '<strong>This function in Labrador CMS is using advanced artificial intelligence developed by OpenAI API.</strong><br>Text from the article is not used to train or improve the public data models. Use generated text from these functions as suggestions, and be sure to manually verify them. Labrador CMS shall not be held liable for any use of the generated text.',
                buttons: [
                    {
                        type: 'button',
                        id: 'generate-insert',
                        value: 'Generate',
                        class: 'lab-generate lab-disabled',
                        highlight: false
                    }
                ]
            },
            eventHandlers: [{
                selector: '#get-article-list',
                event: 'click',
                callback: () => {
                    this.selectFromArticleCollection();

                }
            },
            {
                selector: '#generate-insert',
                event: 'click',
                callback: () => {
                    this.updateFactboxViews({ addClasses: ['lab-busy', 'lab-busy-top'] });

                    this.options.articles = JSON.stringify(this.articleSelection);
                    this.options.language = this.getLanguageName(this.selectedLanguage);
                    this.api.v1.ns.get('textAssistant.fetchByGroupName')('topic_summary', this.aiSettings, this.options).then((respons) => {
                        const r = this.cleanUpJsonString(respons);
                        this.respons = JSON.parse(r);
                        this.updateFactboxModel();
                        this.updateFactboxViews({ removeClasses: ['lab-busy', 'lab-busy-top'] });

                    });
                    this.modal.close();

                }
            }],
            callbacks: {
                didDisplay: (modal) => {
                    /**
                     * Callbacks to handle user input from options define values in the prompt
                     */

                    this.buttonsGenerate = this.modal.markup.querySelectorAll('.lab-generate');

                    // Language
                    const languageSpan = modal.markup.querySelector('#selectedLang');
                    const language = modal.markup.querySelector('#languages');

                    language.addEventListener('change', (event) => {
                        this.selectedLanguage = language.value;
                        languageSpan.textContent = this.getLanguageName(language.value);
                    });
                    this.selectedLanguage = language.value;
                    languageSpan.textContent = this.getLanguageName(language.value);

                    // Factbox type
                    const typeSpan = modal.markup.querySelector('#selectedType');
                    const factboxType = modal.markup.querySelector('#factboxType');
                    const factboxDescription = modal.markup.querySelector('#factbox-description');

                    factboxType.addEventListener('change', (event) => {
                        typeSpan.textContent = factboxType.value;
                        this.options.factboxType = { [factboxType.value]: true };

                        // Update content description
                        if (factboxType.value === 'overview') {
                            factboxDescription.textContent = 'Generate a broad overview and focus on the most important aspects of the topic';
                        } else if (factboxType.value === 'development') {
                            factboxDescription.textContent = 'Generate summary that outlines the changes and focus on the development of the topic';
                        } else if (factboxType.value === 'brief') {
                            factboxDescription.textContent = 'Generate a brief summary of the topic';
                        } else {
                            factboxDescription.textContent = '';
                        }

                    });

                    typeSpan.textContent = factboxType.value;
                    this.options.factboxType = { [factboxType.value]: true };

                    /**
                     * Style options
                     */

                    // Use bulletpoints
                    const optionBulletpoints = modal.markup.querySelector('#use-bulletpoints');
                    optionBulletpoints.addEventListener('click', (event) => {
                        this.options.bulletpoints = optionBulletpoints.checked;
                    });

                    /*
                    // Reference - link to urls
                    const optionReferences = modal.markup.querySelector('#use-references');
                    optionReferences.addEventListener('click', (event) => {
                        this.options.references = optionReferences.checked;
                    });

                    // Bold names
                    const optionBoldNames = modal.markup.querySelector('#use-bold-names');
                    optionBoldNames.addEventListener('click', (event) => {
                        this.options.boldNames = optionBoldNames.checked;
                    });

                    // Bold keywords
                    const optionBoldKeywords = modal.markup.querySelector('#use-bold-keywords');
                    optionBoldKeywords.addEventListener('click', (event) => {
                        this.options.boldKeywords = optionBoldKeywords.checked;
                    });

                    // Add subheader
                    const optionSubheader = modal.markup.querySelector('#use-subheader');
                    optionSubheader.addEventListener('click', (event) => {
                        this.options.subheader = optionSubheader.checked;
                    });
                    */

                    // Focal point
                    const focalpointText = modal.markup.querySelector('#focalpointText');
                    const optionFocalpoint = modal.markup.querySelector('#focalpoint');
                    optionFocalpoint.addEventListener('change', (event) => {
                        if (optionFocalpoint.value.length > 0) {
                            this.options.focalpoint = optionFocalpoint.value;
                            focalpointText.innerHTML = `that emphasizes on <b>${ optionFocalpoint.value }</b> `;
                        } else {
                            this.options.focalpoint = null;
                            focalpointText.innerHTML = '';
                        }
                    });

                    console.log(this.factboxModel);

                },
                end: () => {
                }

            }
        });
    }

    updateFactboxViews(updateActions = null) {
        /**
         * Update all views from factbox model
         * @param {object} updateActions - Actions to update views with
         */

        this.factboxViews = this.api.v1.view.getViews(this.factboxModel);
        if (this.factboxViews && updateActions !== null) {
            // Remove classes for each view
            if (updateActions.removeClasses) {
                for (const elementClass of updateActions.removeClasses) {
                    for (const factboxView of this.factboxViews) {
                        factboxView.markup.classList.remove(elementClass);
                    }
                }
            }

            // Add classes for each view
            if (updateActions.addClasses) {
                for (const elementClass of updateActions.addClasses) {
                    for (const factboxView of this.factboxViews) {
                        factboxView.markup.classList.add(elementClass);
                    }
                }
            }
        }
    }

    updateModalMarkup() {
        /**
         * Update UI in main modal with a list of selected articles
         * Disable generate-buttons when list of selected articles is empty
         * Make a list of clickable article references with styling
         * Add event listeners to remove articles from list of selected articles
         * */

        const elementSelection = this.modal.markup.querySelector('#article-selection');
        const selectionIds = Object.keys(this.articleSelection);

        if (selectionIds && selectionIds.length === 0) {
            // Update UI when zero articles are selected
            elementSelection.innerHTML = '<p><em>No articles selected</em></p>'; // Clear existing content
            for (const button of this.buttonsGenerate) {
                button.classList.add('lab-disabled');
            }
        } else if (selectionIds && selectionIds.length >= 1) {
            // Update UI when there is a selection of articles
            elementSelection.innerHTML = ''; // Clear existing content
            for (const button of this.buttonsGenerate) {
                button.classList.remove('lab-disabled');
            }

            // Update list of articles
            for (const id of selectionIds) {
                const listItem = document.createElement('li');
                listItem.textContent = `${ id }: ${ this.articleSelection[id].title }`;
                elementSelection.appendChild(listItem);
            }

            // Add styling to list of articles
            const articleElements = this.modal.markup.querySelectorAll('#article-selection > li');
            articleElements.forEach((originalArticleElement) => {
                const articleElement = originalArticleElement.cloneNode(true);

                // To indicate it's clickable
                const marker = document.createElement('span');
                marker.textContent = 'X';
                marker.style.position = 'absolute';
                marker.style.left = '-20px';
                marker.style.top = '0';
                marker.style.display = 'none'; // Initially hidden
                marker.style.color = '#ff0000';
                marker.style.fontWeight = 'bold';
                marker.style.cursor = 'pointer';

                articleElement.appendChild(marker);
                articleElement.style.position = 'relative'; // Ensure articleElement is positioned

                // Remove selected article when clicked
                articleElement.addEventListener('click', (event) => {
                    const text = originalArticleElement.textContent.split(':');
                    if (text && text.length > 0) {
                        const id = text[0].trim();
                        this.removeFromArticleList(id);
                        this.updateArticlesListAndCheckEmpty();
                    }
                });

                // Indicate that selected article can be removed when hovering
                articleElement.addEventListener('mouseenter', (event) => {
                    const eventTarget = event.target;
                    marker.style.display = 'inline';
                    eventTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.4)'; // Semi-transparent red
                    eventTarget.style.cursor = 'pointer';
                    articleElement.style.listStyleType = 'none';

                });

                // Remove styling if mouse leaves
                articleElement.addEventListener('mouseleave', (event) => {
                    const eventTarget = event.target;
                    marker.style.display = 'none';
                    eventTarget.style.backgroundColor = '';
                    articleElement.style.listStyleType = 'disc';

                });
                originalArticleElement.parentNode.replaceChild(articleElement, originalArticleElement);

            });
        }

    }

    updateArticlesListAndCheckEmpty() {
        this.updateArticleList(this.articleIds).then(() => {
            this.updateModalMarkup();
            // Check and update for empty state
            if (this.modal.markup.querySelectorAll('#article-selection > li').length === 0) {
                const elementSelection = this.modal.markup.querySelector('#article-selection');
                elementSelection.innerHTML = '<p><em>No articles selected</em></p>';
            }
        });
    }

    selectFromArticleCollection() {
        /**
         * Collection modal to select articles. Uses collection 'ArticlesLatest' as UI
         */
        return new Promise((resolve, reject) => {
            lab_api.v1.collection.display(
                {
                    /**
                     * Collection modal to select articles. Uses collection 'ArticlesLatest' as UI
                     */
                    name: 'ArticlesLatest',
                    modal: true,
                    isSilent: false,
                    skipCache: true,
                    options:
                    {
                        label: 'Select articles for topic summary',
                        width: 1400,
                        minHeight: 800,
                        isSilent: true,
                        type: 'topicSummary',
                        externalContentUpdater: true,
                        updateContents: {
                            footer: true,
                            markExisting: true
                        },
                        click: (uiInterface, model, element, event) => {
                            /**
                             * Callback when an article is clicked
                             * @param {object} uiInterface - The Labrador uiInterface
                             * @param {object} model - The Labrador model
                             * @param {object} element - The html element
                             * @param {object} event - The event
                             */
                            let id = model.data.contentdata.instance_of;
                            id = String(id);

                            if (!this.articleIds.includes(id)) {
                                this.articleIds.push(id);
                                this.currentlySelected.push(id);
                            } else {
                                this.articleIds = this.articleIds.filter((value) => value !== id);
                                this.currentlySelected = this.currentlySelected.filter((value) => value !== id);

                                this.updateArticleList();
                            }

                        },
                        updateContent: (htmlElement, params) => {
                            /**
                             * Update content in modal when it is displayed
                             * @param {object} htmlElement - The html element to update
                             * @param {object} params - Parameters to update the html element
                             */
                            if (params && params.type === 'footer') {
                                const form = htmlElement;
                                const elements = form.querySelectorAll('li'); // Select the first li in the list
                                for (const element of elements) {
                                    element.classList.remove('lab-grid-large-3');
                                    element.classList.add('lab-grid-large-2');
                                }

                                const listItem = document.createElement('li');
                                listItem.className = 'lab-grid-large-4 lab-btn lab-small';
                                listItem.style.cssText = 'display: flex; justify-content: center; align-items: center;';
                                listItem.innerHTML = '<b>Finished</b>';
                                // ADD EVENT LISTENER THAT CLOSES THE MODAL

                                listItem.addEventListener('click', (event) => {
                                    this.api.v1.ui.modal.close();
                                });

                                form.appendChild(listItem); // If there are no list items, just append it
                            } else if (params && params.type === 'markExisting') {
                                const id = String(params.id);
                                const item = htmlElement;

                                if ((!this.articleIds || !(this.articleIds.length > 0)) && (!this.currentlySelected || !(this.currentlySelected.length > 0))) {
                                    // Remove selected (not in article lists)
                                    if (item.element.classList.contains('lab-generate')) {
                                        item.element.classList.remove('lab-generate');
                                    }
                                    if (item.element.classList.contains('lab-selected')) {
                                        item.element.classList.remove('lab-selected');
                                    }
                                    return item;
                                }

                                // Remove lab-highlight-item (green color for article teasers on page)
                                if (item.element.classList.contains('lab-highlight-item')) {
                                    item.element.classList.remove('lab-highlight-item');
                                }

                                // Add lab-generate (purple color for new pick)
                                if (this.articleIds.includes(id)) {
                                    if (!item.element.classList.contains('lab-generate')) {
                                        item.element.classList.add('lab-generate');
                                    }
                                } else if (item.element.classList.contains('lab-generate')) {
                                    item.element.classList.remove('lab-generate');
                                }

                                // Remove lab-selected (already picked)
                                if (!this.currentlySelected || !(this.currentlySelected.length > 0)) {
                                    if (item.element.classList.contains('lab-selected')) {
                                        item.element.classList.remove('lab-selected');
                                    }

                                // Add lab-selected and lab-generate (give purple color for new pick)
                                } else if (this.currentlySelected.includes(id)) {
                                    if (!item.element.classList.contains('lab-selected')) {
                                        item.element.classList.add('lab-selected');
                                    }
                                    if (!item.element.classList.contains('lab-generate')) {
                                        item.element.classList.add('lab-generate');
                                    }
                                } else if (!this.currentlySelected.includes(id)) {
                                    if (item.element.classList.contains('lab-selected')) {
                                        item.element.classList.remove('lab-selected');
                                    }
                                }

                                return item;
                            }
                            return htmlElement;
                        },
                        end: (uiInterface) => {
                            /**
                             * Callback when modal is closed
                             * @param {object} uiInterface - The Labrador uiInterface
                             */
                            this.updateArticleList(this.articleIds).then(() => {
                                // Clean up so that the colors does not remain in other 'ArticlesLatest'-collections

                                // Remove lab-generate and lab-selected for clean up
                                for (const item of uiInterface.getContentList()) {
                                    item.element.classList.remove('lab-generate');
                                    item.element.classList.remove('lab-selected');
                                }

                                this.currentlySelected = [];
                                this.updateModalMarkup();
                                resolve();

                            });
                        }
                    }
                }
            );
        });
    }

    updateArticleList(ids = []) {
        /**
         * Update list of article ids
         * Fetch article nodes by article ids
         * Update article selection from article nodes
         */
        return new Promise((resolve, reject) => {
            if (!ids) {
                reject();
            }
            // Update this.articleList with new ids
            this.evaluateIds(ids);

            // Fetch article nodes, and then update article selection with
            this.fetchArticlesByIds()
                .then((articleNodes) => {
                    if (articleNodes) {
                        this.updateArticleSelection(articleNodes)
                            .then(() => {
                                resolve();
                            });

                    } else {
                        resolve();
                    }

                });
        });
    }

    removeFromArticleList(id) {
        /**
         * Remove article id from list of article ids
         */
        if (!this.articleList) {
            this.articleList = [];
        }
        this.articleIds = this.articleIds.filter((value) => value !== id);

    }

    evaluateIds(ids) {
        /**
         * Evaluate ids and add to list of article ids
         */
        if (ids && ids.length > 0) {
            for (let id of ids) {
                id = String(id);
                id = id.trim();

                if (!this.articleIds.includes(id) && id.length > 0) {
                    this.articleIds.push(id);
                }
            }
        }
    }

    fetchArticlesByIds(fields = ['title', 'bodytext']) {
        /**
         * Use the labrador api to fetch articles by list of ids
         */
        return new Promise((resolve, reject) => {

            let url = '/api/v1/article/?query=';

            if (this.articleIds && this.articleIds.length > 0) {
                for (const [index, element] of this.articleIds.entries()) {
                    if (index === 0) {
                        url += `id:${ element }`;
                    } else {
                        url += `%20OR%20id:${ element }`;
                    }
                }
                // Fetch
                fetch(url)
                    .then((response) => {
                        if (!response.ok) {
                            resolve([]);
                            // throw Error(response.statusText);
                        }
                        return response.json();
                    })
                    .then((resp) => {
                        resolve(resp.result);

                    })
                    .catch((error) => {
                        reject(error);
                    });
            } else {
                resolve([]);
            }
        });

    }

    updateArticleSelection(articleNodes = [], fields = ['title', 'bodytext', 'published_url', 'published']) {
        /**
         * Update article selection with given fields for the
         * The article selection is included in the prompt for reference to the ai service
         * @param {array} articleNodes - List of article nodes
         * @param {array} fields - List of fields to include in article selection
         */
        return new Promise((resolve, reject) => {
            this.articleSelection = {};
            for (const articleNode of articleNodes) {
                const { id } = articleNode;
                if (id) {
                    this.articleSelection[id] = {};
                    for (const field of fields) {
                        if (articleNode[field]) {
                            this.articleSelection[id][field] = articleNode[field];
                        }
                    }
                }
            }

            resolve();
        });

    }

    createFactbox(articles) {
        /** *
         * Create a new factbox. Not yet in use
         */
        const model = lab_api.v1.model.create.internal({
            type: 'factbox',
            contentdata: {
                fields: {
                    title: {
                        value: this.respons.title
                    },
                    bodytext: {
                        value: this.respons.bodytext
                    }
                }
            },
            metadata: {
                background_color: {
                    vp: {
                        desktop: 'bg-primary-light'
                    }
                }
            },
            width: 100
        });
        lab_api.v1.model.addChild(lab_api.v1.model.query.getModelByType('bodytext'), model);
    }

    updateFactboxModel() {
        /**
         * Update the factbox model that initialised the modal with the respons from the ai service
         */
        return new Promise((resolve, reject) => {
            // Tests ahead of updating factbox model
            if (!this.factboxModel) {
                reject(new Error('No node-model defined'));
            }
            if (!this.respons) {
                this.updateFactboxViews({ removeClasses: ['lab-busy', 'lab-busy-top'] });
                reject(new Error('No respons returned'));
            }

            if (this.respons) {
                const disclaimerText = `<p class="italic ai-disclaimer" data-lab-italic="italic">${ this.api.v1.locale.get('ai.factbox_disclaimer') }</p>`;

                // Update given fields in factbox-model
                for (const path of ['bodytext', 'title']) {
                    try {
                        let fieldText = this.respons[path];
                        if (fieldText) {
                            if (path === 'bodytext') {
                                fieldText += disclaimerText;
                            }
                            this.factboxModel.set(`fields.${ path }`, fieldText);
                        }

                    } catch (error) {
                        this.updateFactboxViews({ removeClasses: ['lab-busy', 'lab-busy-top'] });
                        reject(new Error(`Failed to set field ${ path } into current factbox-model`));
                    }
                }

                // Build ai metadata
                try {
                    const aiMetadata = this.aiSettings;
                    aiMetadata.timestamp = new Date().getTime();
                    aiMetadata.createdByName = this.api.v1.user.getUserName();
                    aiMetadata.createdById = this.api.v1.user.getUserId();
                    aiMetadata.selectionSourceIds = this.articleIds;
                    this.factboxModel.set('fields.ai_metadata_json', JSON.stringify(aiMetadata));
                } catch (error) {
                    reject(new Error(`Failed to build aiMetadata into current factbox-model`));
                }
            }
            resolve();
        });

    }

    cleanUpJsonString(data) {
        /**
         * Clean up json string to handle returning output that includes more than the expected json
         */
        let jsonString = data.trim();

        if (jsonString.includes('{') && jsonString.indexOf('{') > 0) {
            jsonString = jsonString.substring(jsonString.indexOf('{'));
        }

        if (!jsonString.includes('{')) {
            jsonString = `{${  jsonString }`;
        }

        if (!jsonString.includes('}')) {
            jsonString = `${  jsonString }}`;
        }

        // Test to choose the correct '}'. Ignore '}' with '\' ahead
        if (jsonString.match(/}/g).length > 1) {
            jsonString = jsonString.match(/(.|\n)*?(?<!\\)}/);
        }

        if (jsonString.includes('}') && jsonString.indexOf('}') < jsonString.length) {
            jsonString = jsonString.substring(0, jsonString.indexOf('}') + 1);
        }

        jsonString = jsonString.trim();
        return jsonString;
    }

    getLanguageName(languageCode, cleanUp = true) {
        /**
         * Get language name from language code
         */
        let language = null;

        // Get name of langauge
        for (const lang of contentLanguages) {
            if (lang.code === languageCode) {
                language = lang.name;

            }
        }

        // Clean up language name
        if (language && cleanUp === true) {
            if (language.includes('-')) {
                language = language.substring(0, language.indexOf('-'));
            }
            if (/\(.*?\)/.test(language)) {
                language = language.replaceAll(/\(.*?\)/g, '');
            }
            language = language.trim();
        }
        language = language.trim();
        return language;
    }

}
