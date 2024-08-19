import contentLanguages from '../../lib/helpers/ContentLanguages.js';

// TODO:
// Legg inn mulighet for å angre (undo) på oversettelsen
// Hvis man endrer site + prototype, så endre språk til det som er språk på prototype

export class ArticleTranslate {

    /**
     *  The app ArticleTranslate is used to translate articles in Labrador CMS, either by creating a new article or by updating an existing article.
     * The app is using an integration to OpenAI and their model 'GPT-4-turbo' as default ai settings to translate the content.
     * In the UI the user can select language, site and prototype to store the translated article, and the user may choose to either create a new article or update an existing article.
     *
     * @param {object} api
     * @param {object} params
     * @param {object} aiSettings - Settings for the ai-integration (model, provider, integration, url)
     */

    constructor(api, params, aiSettings = {
        model: 'gpt-4-turbo', provider: 'openAi', integration: 'openAi', apiUrl: null
    }) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.progressLevel = 0;
        this.progressFinish = 0;
        this.aiSettings = aiSettings;   // Settings for the ai-integration (model, provider, integration, url)
        // this.setupPrototypes().then((data) => { this.prototypes = data; });  // Setup prototypes));
        this.prototypes = [];

        this.template = `
        <div class="lab-modal-form lab-grid lab-hidden">
            <div class="lab-formgroup lab-grid lab-grid-gap lab-space-above-none">
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <h2 class="lab-title lab-grid-large-12 lab-grid-gap">Translate article <span class="labicon-magic_wand"></span></h2>
                    <p>Translate content in the article (except markups) by using OpenAI's 'GPT-4-turbo'.</p>
                    <p class="lab-space-below-none"><b>Select language</b></p>
                    <select id="languages">
                        <option value="">Select language:</option>
                        {{ #languages }}
                        <option value="{{ code }}"{{ #selected }} selected{{ /selected }}>{{ name }} ({{ code }})</option>
                        {{ /languages }}
                    </select>
                    <p class="lab-para"><label>Update this article<input type="radio" title="Use page language" id="translate-current" style="float:left;"></label></p>
                    <p class="lab-para"><label>Update another article<input type="radio" checked title="Translate and store to another article" id="translate-another" style="float:left;"></label></p>
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-medium">
                    <h3>Options when translating to another article</h3>
                </div>
                <div class="lab-formgroup-item lab-grid-large-5 lab-space-right-medium">
                    <label for="site_id"><b>Select site</b></label>
                    <select name="site_id" id="site_id">
                        {{#sites}}
                        <option value="{{value}}" {{#selected}}selected{{/selected}}>{{name}}</option>
                        {{/sites}}
                    </select>
                </div>

                <div class="lab-formgroup-item lab-grid-large-5">
                    <label for="prototype_id"><b>Select prototype</b></label>
                    <select name="prototype_id" id="prototype_id">
                        {{#prototypes}}
                        <option value="{{value}}" {{#selected}}selected{{/selected}}>{{name}}</option>
                        {{/prototypes}}
                    </select>
                </div>

                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-large">
                    {{ #labId }}
                    <p class="lab-para"><label>Create translation as a new article</b><input type="radio" title="Create a new version" checked id="create-new-article" style="float:left;"></label></p>

                    <p class="lab-para"><label>Overwrite previous translation, article with id <b>{{ labId }}</b><input type="radio" title="Overwrite newest alternative version" id="overwrite-article" style="float:left;"></label></p>
                    {{ /labId }}
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-space-below-large">
                    <span id="translate_article" type="button" class="lab-btn lab-generate" style="float:left; position:relativ"><b>Create new article</b></span>
                    <a id="link-to-url" "href="/edit/article/id/{{ labId }}" target="_blank">
                        <span id="go-to-translation" type="button" class="lab-btn lab-hidden lab-disabled lab-selected" style="float:right; position:relativ"><b>Wait to go to article</b></span>
                    </a>
                </div>
            </div> 

            <div class="lab-formgroup lab-grid lab-grid-gap translate-process-info lab-bordered lab-space-below-large">
                <h3 id="info-translation-progress">Translation progress:</h3>
                <progress id="progress-meter" value="0" min="0" max="0" style="width:100%"></progress>
                <p id="info-translation" style="padding-below: 100px"></p>

            </div>

            <div class="lab-formgroup lab-grid lab-grid-gap">
                <p class="lab-space-below-none"><b>This function in Labrador CMS is using advanced artificial intelligence developed by OpenAI API.</b></p>
                <p class="lab-space-above-none">Text from the article is not used to train or improve the public data models. Use generated text from these functions as suggestions, and be sure to manually verify them. Labrador CMS shall not be held liable for any use of the generated text.</p>
            </div>
        </div>`;
    }

    createTranslatedCopy(originalArticleId) {
        /**
         * Full workflow of creating a translated copy of an article
         * 1. Setup alternative version of the article
         * 2. Translate the alternative version of the article
         * 3. Import the alternative version of the article to Labrador CMS
         * 4. Update original article
         *
         * @param {string} originalArticleId - The id of the original article
         */
        this.updateProgressBar('max', true);
        this.updateProgressBar('value', true);

        this.language = this.getLanguageName(this.selectedLanguage);
        this.evaluateProgress(true);

        this.setupAlternativeVersion(originalArticleId, this.setupConfig.selectedPrototypeId)
            .then(() => this.translateAlternativeVersion())
            .then(() => this.importAlternativeVersion())
            .then((alternativeArticleId) => {
                this.linkGoTo = this.markup.querySelector('#link-to-url');
                this.linkGoTo.href = `/edit/article/id/${ alternativeArticleId }`;
                this.updateOriginalArticle(originalArticleId, alternativeArticleId);
            })
            .catch((error) => {
                console.log('error: ', error);
            });

        // Alternative setup if we want to copy the article and then translate it (instead of translating the original article and then copy it)

        /*
            const formData = this.buildFormData(node.data);
            fetch('/ajax/node/save-node-and-data', { body: formData, method: 'POST' }).then((response) => {
                console.log('response after save-node-and-data', response);
            }).catch((error) => {
                console.log('error: ', error);
            });
            console.log(node.data.children);
            for (const child of node.data.children) {
                console.log(child);

                if (child.type === 'factbox') {
                    const formDatachild = this.buildFormData(child);
                    fetch('/ajax/node/save-node-and-data', { body: formDatachild, method: 'POST' }).then((response) => {
                        console.log('response after save-node-and-data', response);
                    }).catch((error) => {
                        console.log('error: ', error);
                    });
                }
            }
            // const url = this.makeCopyUrl(originalArticleId, this.setupConfig.selectedPrototypeId);
        */
    }

    importAlternativeVersion() {
        /**
         * Import the alternative version of the article to Labrador CMS
         *
         * Select labId for the alternative article, reuse labId if user has selected to overwrite existing article
         * Start import of article to Labrador CMS with a payload to the import-api
         */
        return new Promise((resolve, reject) => {
            this.selectLabId()
                .then(() => {

                    const payload = {
                        importSettings: {
                            prototypeId: Number(this.setupConfig.selectedPrototypeId),
                            publishDirect: false,
                            replaceExisting: true
                        },
                        data: {
                            type: 'article',
                            labId: this.alternativeArticle.labId,
                            fields: this.alternativeArticle.fields,
                            tags: this.alternativeArticle.tags,
                            children: this.alternativeArticle.children,
                            frontCrop: this.alternativeArticle.frontCrop,
                            structure: this.originalArticleStructure || false

                        }
                    };

                    // Start import of article to Labrador CMS
                    this.api.v1.util.httpClient.request(`/admin/import-article?jsonPost=true&id=${ this.alternativeArticle.labId }`, { body: JSON.stringify(payload), method: 'POST' }).then((resp) => {
                        [this.alternativeArticleId] = Object.values(resp.imported);
                        this.updateProgressBar('value');
                        this.evaluateProgress();
                        resolve(this.alternativeArticleId);

                    }).catch((error) => {
                        console.log('error: ', error);
                        reject(error);
                    });

                });

        });
    }

    selectLabId() {
        /**
         * Select labId for the alternative article
         * If the article already exists, then use the use it's labId
         */
        return new Promise((resolve, reject) => {
            if (this.setupConfig.reuseLabId) {
                this.alternativeArticle.labId = this.setupConfig.labId;
                resolve();
            }

            this.api.v1.util.httpClient.request(`/ajax/article/createFromPrototype?prototypeid=${ this.setupConfig.selectedPrototypeId }&site_id=${ this.setupConfig.selectedSiteId }`).then((resp) => {
                this.alternativeArticle.labId = resp.id;
                resolve();
            });
        });
    }

    // Promise
    setupAlternativeVersion(originalArticleId, prototypeId) {
        /**
         * Setup alternative version of the article
         * Get the original article and store it in this.alternativeArticle
         * Add lab_canonical_id to the alternative article
         *
         * Reuse children in original article
         * The response is the originalArticle with children in this format:
         * orignalArticle = {data: {}, structure: {}}
         *
         * The alternative version should has the same content and structure as the original article, but with a different language
         *
         * @param {string} originalArticleId - The id of the original article
         * @param {string} prototypeId - The id of the prototype to store the alternative version of the article
         *
         * */

        // TODO: Oppdaterer til å hente ut med getJson
        this.updateProgressBar('max');

        return new Promise((resolve, reject) => {
            fetch(`/prototype/get-node-and-data?id=${ originalArticleId }`).then((resp) => {
                resp.json().then((originalArticle) => {
                    // Setup content for translated version of article
                    this.alternativeArticle = {
                        type: originalArticle.data.type || 'article',
                        fields: {

                            title: originalArticle.data.fields.title || '',
                            subtitle: originalArticle.data.fields.subtitle || '',
                            kicker: originalArticle.data.fields.kicker || '',
                            somedescription: originalArticle.data.fields.somedescription || '',
                            sometitle: originalArticle.data.fields.sometitle || '',
                            seodescription: originalArticle.data.fields.seodescription || '',
                            seotitle: originalArticle.data.fields.seotitle || '',
                            bodytext: originalArticle.data.fields.bodytext || '',
                            hasTranslation: '1'

                        },
                        tags: originalArticle.data.tags || {},
                        children: [],
                        frontCrop: originalArticle.data.frontCrop || {}
                    };
                    this.originalArticleStructure = originalArticle.structure;
                    // Add language to article
                    this.alternativeArticle.fields.seolanguage = this.selectedLanguage;

                    // Add ai metadata to articlea
                    this.alternativeArticle.fields.ai_translation_json = this.addAiMetadata({ translated_from_id: originalArticleId, translated_from_lang: this.originalLanguage });

                    // Use labId to handle reusage of existing image
                    if (originalArticle.data.frontCrop) {
                        this.alternativeArticle.frontCrop.pano.labId = originalArticle.data.frontCrop.pano.instance_of || originalArticle.data.frontCrop.pano.id;
                        delete this.alternativeArticle.frontCrop.pano.id;

                        this.alternativeArticle.frontCrop.height.labId = originalArticle.data.frontCrop.pano.instance_of || originalArticle.data.frontCrop.pano.id;
                        delete this.alternativeArticle.frontCrop.height.id;
                    }

                    // Prepare structure for children
                    const structureChildren = this.selectStructureChildrenFromNode(originalArticle);

                    // Prepare data for children
                    const dataChildren = this.selectDataChildrenFromNode(originalArticle);

                    // Combine data with structure for matching children
                    this.mergeStructureAndData(structureChildren, dataChildren);

                    // Defualt set structure to original structureChildren, but data should be added directly to children for the import
                    this.alternativeArticle.fields.structure = structureChildren;

                    // Important to include lab_canonical_id as a reference to source article
                    this.alternativeArticle.fields.lab_canonical_id = originalArticle.data.fields.lab_canonical_id || originalArticle.data.labId || originalArticle.data.id || '';

                    this.alternativeArticle.fields.used_image_ids_json = [];
                    for (const child of this.alternativeArticle.children) {
                        if (child.type === 'image') {
                            this.alternativeArticle.fields.used_image_ids_json.push(child.instance_of);
                        }
                        if (child.children && child.children.length > 0) {
                            for (const gchild of child.children) {
                                if (gchild.type === 'image') {
                                    this.alternativeArticle.fields.used_image_ids_json.push(gchild.instance_of);
                                }
                            }
                        }
                    }
                    resolve();
                }).catch((error) => {
                    console.log('error: ', error);
                    reject(error);
                });
            });
        });

    }

    getStructureWidth(structureChild) {
        /**
         * The child might have a defined width, but it may be defined in different ways depending on source (legacy structure, created in labrador or imported from other system)
         */

        if (structureChild.width && typeof structureChild.width === 'number') {
            return structureChild.width;
        }

        if (structureChild.structureWidth) {
            if (typeof structureChild.structureWidth === 'number') {
                return structureChild.structureWidth;
            }
            if (typeof structureChild.structureWidth === 'object') {
                if (Object.keys(structureChild.structureWidth).length > 0 && structureChild.structureWidth.desktop) {
                    return structureChild.structureWidth.desktop;
                }

            }
        }
        for (const searchKey of ['metadata', 'structureMetadata', 'structureMetadataOriginal']) {
            if (structureChild[searchKey] && structureChild[searchKey].width) {
                if (typeof structureChild[searchKey].width === 'number') {

                    return structureChild[searchKey].width;
                }
                if (typeof structureChild[searchKey].width === 'object') {
                    if (Object.keys(structureChild[searchKey].width).length > 0 && structureChild[searchKey].width.desktop) {
                        return structureChild[searchKey].width.desktop;
                    }
                }
            }

        }
        return 100;
    }

    mergeStructureAndData(structureChildren, dataChildren) {
        /**
         * Merge structure and data for children
         * The structure node includes the structure of the children, like structureHint and metadata
         * The data node includes the fields of the children
         * Merge these to make a node with both structure and data to be used in the import
         *
         * @param {array} structureChildren - The structure children
         * @param {array} dataChildren - The data children
         */
        for (const dataChild of dataChildren) {
            for (const structureChild of structureChildren) {
                if (dataChild.type === 'image' && dataChild.node_id) {
                    this.fetchNodeFromNodeId(dataChild.node_id).then((id) => { dataChild.labId = id; });
                }

                if ((dataChild.id === structureChild.node_id) && dataChild.type === structureChild.type) {
                    dataChild.structureMetadata = structureChild.metadata || {};
                    dataChild.metadata = structureChild.metadata || dataChild.structureMetadata;
                    dataChild.structureHint = structureChild.structureHint;
                    dataChild.structureWidth = this.getStructureWidth(structureChild);
                    if (structureChild.children) {
                        dataChild.children = structureChild.children;
                    }
                    if (dataChild.type === 'image') {
                    // Child must have a labId/instane_of
                    // Child must also have structureInformation, meaning structureHint, structureWidth and structureMetadata (including bodytextIndex if in bodytext)

                        if (dataChild.instance_of) {
                            dataChild.labId = dataChild.instance_of;
                        } else {
                            dataChild.labId = dataChild.id;
                        }
                        delete dataChild.id;

                        if (structureChild.structureHint.toLowerCase() === 'bodytext') {
                            dataChild.structureHint = structureChild.structureHint;

                        } else {
                            dataChild.structureHint = 'articleHeader/0';
                            dataChild.structureWidth = 100;

                        }
                    }
                    if (dataChild.type === 'byline') {
                        dataChild.structureHint = 'articleHeader/articleMeta/0';
                    }
                    dataChild.structureMetadataOriginal = structureChild;

                    if (dataChild.children && dataChild.children.length > 0) {
                        for (const gchild of dataChild.children) {
                            if (gchild.type === 'image') {
                                if (gchild.node_id) {
                                    this.fetchNodeFromNodeId(gchild.node_id).then((id) => { gchild.labId = id; });
                                } else if (gchild.instance_of) {
                                    gchild.labId = gchild.instance_of;
                                } else {
                                    gchild.labId = gchild.id;
                                }

                                delete gchild.id;
                                delete gchild.node_id;
                                gchild.structureWidth = 100;
                                gchild.width = 100;
                            }

                            // Handle special case of slideshow
                            if (gchild.type === 'slideshow') {
                                for (const ggchild of gchild.children) {
                                    if (ggchild.type === 'image') {
                                        if (ggchild.node_id) {
                                            this.fetchNodeFromNodeId(ggchild.node_id).then((id) => { ggchild.labId = id; });
                                        } else if (ggchild.instance_of) {
                                            ggchild.labId = ggchild.instance_of;
                                        } else {
                                            ggchild.labId = ggchild.id;
                                        }

                                        delete ggchild.id;
                                        delete ggchild.node_id;
                                        ggchild.structureWidth = 100;
                                        ggchild.width = 100;
                                    }
                                }
                            }
                        }
                    }
                    this.alternativeArticle.children.push(dataChild);
                }

                if (dataChild.fields) {
                    for (const field of Object.keys(dataChild.fields)) {
                        if (dataChild.fields[field] && typeof dataChild.fields[field] !== 'string') {
                            dataChild.fields[field] = JSON.stringify(dataChild.fields[field]);
                        }

                    }
                }
            }

        }
    }

    selectStructureChildrenFromNode(originalArticle) {
        /**
         * Select structure children from original article node
         * The structure node includes the structure of the children, like structureHint and metadata
         */
        const structureChildren = [];
        for (const structureArea of originalArticle.structure) {
            if (['articleHeader', 'bodytext'].includes(structureArea.type)) {
                if (structureArea.children && structureArea.children.length > 0) {

                    for (const structureChild of structureArea.children) {
                        if (['image', 'slideshow', 'quotebox', 'vimeo', 'youtube', 'factbox', 'byline', 'timeline', 'timelineItem', 'article', 'markup'].includes(structureChild.type)) {
                            structureChild.structureHint = structureArea.type;
                            structureChildren.push(structureChild);

                        } else if (['articleMeta'].includes(structureChild.type)) {
                            if (structureChild.children && structureChild.children.length > 0) {
                                for (const structureChildChild of structureChild.children) {
                                    if (['byline'].includes(structureChildChild.type)) {
                                        structureChildChild.structureHint = structureArea.type;
                                        structureChildren.push(structureChildChild);

                                    }
                                }
                            }

                        }
                    }

                }
            }
        }

        return structureChildren;
    }

    selectDataChildrenFromNode(originalArticle) {
        /**
         * Select data children from node, like fields of the children
         * Get either children as they are in bodytext or select children from articleHeader/articleMeta
         */
        const dataChildren = [];
        for (const dataChild of originalArticle.data.children) {
            if (dataChild.type === 'articleHeader' || dataChild.type === 'articleMeta') {
                if (dataChild.children && dataChild.children.length > 0) {
                    for (const dataChildChild of dataChild.children) {
                        if (['image', 'slideshow', 'quotebox', 'factbox', 'byline', 'timeline', 'timelineItem', 'article', 'markup'].includes(dataChildChild.type)) {
                            dataChildren.push(dataChildChild);

                        }
                    }
                }
            } else {
                dataChildren.push(dataChild);
            }
        }
        return dataChildren;
    }

    // promise
    fetchNodeFromNodeId(node_id) {
        /**
         * Fetch node from node_id
         * A child image in a child of an article does not include id to the actual image node, rather to a node that contains the image data. This function fetches the actual image node id.
         * @param {string} node_id - The id of the node
         */
        return new Promise((resolve, reject) => {
            fetch(`/prototype/get-node-and-data?id=${ node_id }`).then((resp) => {
                resp.json().then((node) => {
                    const id = node.data.instance_of || node.data.labId || node.data.id || '';
                    resolve(id);
                });
            });
        });

    }

    translateAlternativeVersion() {
        /**
         * Translate the alternative version of the article
         * The content of the article is splitted into three: bodytext, other fields and children
         */
        const promises = [];

        // Bodytext
        let articleBodytext = this.selectArticleFieldsFromNode(this.alternativeArticle, ['bodytext']);
        articleBodytext = this.cleanUpHtmlString(articleBodytext);
        const partials = this.splitData(articleBodytext, 'bodytext');

        const translatedBodytext = this.translatePartials(partials, articleBodytext)
            .then((translatedFields) => {
                if (translatedFields) {
                    for (const key of Object.keys(translatedFields)) {
                        this.alternativeArticle.fields[key] = translatedFields[key];
                    }
                }
                /*
                const formData = this.buildFormData(articleNode, translatedFields);
                this.saveNodeAndData(formData);
                */

            });
        promises.push(translatedBodytext);

        // Fields (all, except bodytext)
        const articleFields = this.selectArticleFieldsFromNode(this.alternativeArticle, ['title', 'subtitle', 'kicker', 'somedescription', 'sometitle', 'seodescription', 'seotitle', 'tags']);
        const translatedOtherFields = this.translateContent(articleFields, articleBodytext, true)
            .then((translatedFields) => {
                if (translatedFields) {
                    for (const key of Object.keys(translatedFields)) {
                        this.alternativeArticle.fields[key] = translatedFields[key];
                    }

                }
            });
        promises.push(translatedOtherFields);

        // Content-elements (all fields in children)
        const childrenFields = this.getChildrenFieldsExternally(this.alternativeArticle.children);
        const translatedChildrenFields = this.translateContent(childrenFields, articleBodytext, true)
            .then((translatedData) => {
                // Store translated data in children
                const translatedChildren = {};
                for (const fieldKeys of Object.keys(translatedData)) {
                    const keys = fieldKeys.split('_');
                    const type = keys[0];
                    const id = keys[1];
                    const field = keys[2];
                    if (!translatedChildren[`${ type }_${ id }`]) {
                        translatedChildren[`${ type }_${ id }`] = {};
                        translatedChildren[`${ type }_${ id }`][field] = translatedData[fieldKeys];
                    }
                    translatedChildren[`${ type }_${ id }`][field] = translatedData[fieldKeys];
                }

                // Update children with translated data
                for (const child of this.alternativeArticle.children) {
                    const keyPath = `${ child.type }_${ child.id || child.labId }`;
                    if (translatedChildren[keyPath]) {
                        for (const field of Object.keys(translatedChildren[keyPath])) {
                            child.fields[field] = translatedChildren[keyPath][field];
                        }
                    }
                }

            });
        promises.push(translatedChildrenFields);
        return Promise.all(promises)
            .then(() => {
                console.log('Translation complete, will start import of article');

            });

    }

    updateOriginalArticle(originalArticleId, alternativeArticleId) {
        /**
         * Update original article with field 'lab_alternative_versions'
         * Store type, versionType, id, created (seconds), language for each new version as a json
         * Update version data if it already exists
         *
         * @param {string} originalArticleId - The id of the original article
         * @param {string} alternativeArticleId - The id of the alternative article
         */
        this.api.v1.util.httpClient.get(`/prototype/get-node-and-data?id=${ originalArticleId }`)
            .then((response) => {
                // Update field ai_metadata_json
                const ai_metadata_json = this.addAiMetadata({ translated_to_id: String(alternativeArticleId), translated_to_lang: this.selectedLanguage });
                this.rootModel.set('fields.ai_translation_json', ai_metadata_json);
                this.rootModel.set('fields.seolanguage', this.originalLanguage);
                this.rootModel.set('fields.hasTranslations', '1');
                if (!this.rootModel.get('fields.lab_canonical_id')) {
                    this.rootModel.set('fields.lab_canonical_id', originalArticleId);
                }

                /*
                if (response.data) {
                    const formData = this.buildFormData({ id: originalArticleId, type: 'article' }, updateFields);
                    this.saveNodeAndData(formData);
                } */
            });
    }

    buildFormData(node, data) {
        /**
         * Build formData for saving data in a node
         */
        const formData = new FormData();
        formData.append('json[id]', node.id);
        formData.append('json[type]', node.type);
        formData.append('json[structure]', null);
        formData.append('json[node]', JSON.stringify([{
            id: node.id,
            type: node.type,
            fields: data
        }]));
        return formData;
    }

    saveNodeAndData(formData) {
        /**
         * Save node and data
         *
         * @param {object} formData - The formData to be saved.
         * Expected format of formData is like this:
         * { id: '123', type: 'article', structure: null, node: [{ id: '123', type: 'article', fields: { title: 'Title' } }] }
         */
        fetch('/ajax/node/save-node-and-data', { body: formData, method: 'POST' }).then((response) => {
            console.log('response after sa ve-node-and-data', response);
        }).catch((error) => {
            console.log('error: ', error);
        });
    }

    setupPrototypes() {
        /**
         * Setup prototypes
         */

        // Protoype config
        return new Promise((resolve, reject) => {
            const urlPrototypes = '/ajax/articlePrototype/get-all';
            lab_api.v1.util.httpClient.request(urlPrototypes)
                .then((resp) => {

                    const data = resp.data.map((prototype) => ({
                        value: prototype.id,
                        name: prototype.name,
                        site: prototype.site
                    }));
                    this.prototypes = data;
                    resolve(data);
                });
        });

    }

    setupSites() {
        /**
         * Setup sites
         */

        // Site config
        // console.log(lab_api.v1.site.getSites());

    }

    onAside() {
        /**
         * Aside menu for positioning the translate article function
         */
        return {
            section: 'Advanced',
            label: 'Translate article'
        };
    }

    onPaths() {
        /**
         * Paths for the translate article function
         */
        return {
            'fields.seolanguage': {
                node: 'fields.seolanguage'
            }
        };
    }

    onMarkup() {
        /**
         * Markup for the translate article function
         */
        this.setupConfig = {
            selectedSiteId: Number(lab_api.v1.site.getSite().id),
            reuseLabId: false

        };
        const sites = this.api.v1.user.getSites().map((site) => ({
            value: site.id, name: site.display_name, selected: Number(site.id) === this.setupConfig.selectedSiteId
        }));

        // Language
        const seolanguage = this.rootModel.get('fields.seolanguage');
        const defaultLanguage = lab_api.v1.config.get('contentLanguage');
        this.originalLanguage = seolanguage || defaultLanguage;
        this.selectedLanguage = this.originalLanguage;

        const languages = contentLanguages.map((language) => ({ name: language.name, code: language.code, selected: language.code === this.selectedLanguage }));
        const languageName = this.getLanguageName(this.selectedLanguage);

        // LabId
        let fieldAiMetadata = this.rootModel.get('fields.ai_translation_json');
        if (fieldAiMetadata) {
            if (typeof fieldAiMetadata === 'string') {
                fieldAiMetadata = JSON.parse(fieldAiMetadata);
            }
            this.setupConfig.labId = fieldAiMetadata.translated_to_id;
        }

        // Render the markup template with setup variables
        this.markup = this.api.v1.util.dom.renderTemplate(this.template, {
            languages,
            languageName,
            language: this.selectedLanguage,
            labId: this.setupConfig.labId,
            sites,
            prototypes: this.prototypes

        }, true);

        // Language
        // const languageSpan = this.markup.querySelector('#selectedLang');
        const language = this.markup.querySelector('#languages');

        language.addEventListener('change', (event) => {
            this.selectedLanguage = language.value;
            // languageSpan.textContent = this.getLanguageName(language.value);
        });
        this.selectedLanguage = language.value;
        // languageSpan.textContent = this.getLanguageName(language.value);

        this.progressBar = this.markup.querySelector(`#progress-meter`);
        this.setupMarkupListeners();

        return this.markup;

    }

    updateCurrentArticle(originalArticleId) {
        /**
         * Update current article (meaning the article that the user is currently editing)
         * The content of the article is splitted into three: bodytext, other fields and children
         * The content is translated and stored in the article
         */
        this.updateProgressBar('max', true);
        this.updateProgressBar('value', true);

        this.language = this.getLanguageName(this.selectedLanguage);
        this.evaluateProgress(true);

        // Bodytext
        const articleBodytext = this.getArticleFields(['bodytext']);
        const partials = this.splitData(articleBodytext, 'bodytext');
        this.translateAndUpdatePartials(partials, articleBodytext);

        // Fields (all, except bodytext)
        const articleFields = this.getArticleFields(['title', 'subtitle', 'kicker', 'somedescription', 'sometitle', 'seodescription', 'seotitle', 'tags']);
        this.translateData('fields', articleFields, articleBodytext);

        // Content-elements (all fields in children)
        const childrenFields = this.getChildrenFieldsInternally();
        this.translateData('children', childrenFields, articleBodytext);

        if (!this.rootModel.get('fields.lab_canonical_id')) {
            this.rootModel.set('fields.lab_canonical_id', originalArticleId);
        }

    }

    setupMarkupListeners() {
        /**
         * Setup listeners for the translate article function
         *
         * Either the user can translate the current article or another article, depending on selection in article settings
         */
        const originalArticleId = this.rootModel.get('id');

        const translateAnotherArticle = this.markup.querySelector('#translate-another');
        const translateCurrentArticle = this.markup.querySelector('#translate-current');
        this.overwriteArticle = this.markup.querySelector('#overwrite-article');
        this.createNewArticle = this.markup.querySelector('#create-new-article');

        this.buttonTranslate = this.markup.querySelector('#translate_article');

        // Button to trigger translation (overwrite current article or create new article)
        this.buttonTranslate.addEventListener('click', (event) => {
            if (translateCurrentArticle.checked) {
                this.updateCurrentArticle(originalArticleId);
            } else if (translateAnotherArticle.checked) {
                this.buttonGoTo = this.markup.querySelector('#go-to-translation');
                this.buttonGoTo.classList.remove('lab-hidden');

                this.createTranslatedCopy(originalArticleId);
            }
        });

        // Listender to translate to another article
        translateAnotherArticle.addEventListener('click', (event) => {
            translateCurrentArticle.checked = !translateAnotherArticle.checked;
            if (this.overwriteArticle) {
                this.setupConfig.reuseLabId = this.overwriteArticle.checked;
            }

            if (translateAnotherArticle.checked) {
                /*
                if (this.overwriteArticle) {
                    this.setupConfig.reuseLabId = this.overwriteArticle.checked;
                }
                */
                if (!this.setupConfig.selectedPrototypeId) {

                    this.buttonTranslate.classList.add('lab-disabled');
                } else {
                    this.buttonTranslate.classList.remove('lab-disabled');
                }
                this.buttonTranslate.innerHTML = `<b>${ this.setupConfig.reuseLabId ? `Update article ${ this.setupConfig.labId }` : 'Create new article' }</b>`;
            } else {
                this.buttonTranslate.innerHTML = '<b>Update this article</b>';
            }

        });

        // Listener to update current article
        translateCurrentArticle.addEventListener('click', (event) => {
            translateAnotherArticle.checked = !translateCurrentArticle.checked;
            if (translateAnotherArticle.checked) {
                if (this.overwriteArticle) {
                    this.setupConfig.reuseLabId = this.overwriteArticle.checked;
                }
                /*
                if (this.overwriteArticle && this.overwriteArticle.checked) {
                    this.setupConfig.reuseLabId = this.overwriteArticle.checked;

                } else {

                } */
                this.buttonTranslate.innerHTML = `<b>${ this.setupConfig.reuseLabId ? `Update article ${ this.setupConfig.labId }` : 'Create new article' }</b>`;
            } else {
                this.buttonTranslate.classList.remove('lab-disabled');
                this.buttonTranslate.innerHTML = '<b>Update this article</b>';
            }
        });

        // Listener to overwrite previously translated article
        if (this.overwriteArticle) {
            this.overwriteArticle.addEventListener('click', (event) => {
                this.createNewArticle.checked = !this.overwriteArticle.checked;
                this.setupConfig.reuseLabId = this.overwriteArticle.checked;

                if (translateAnotherArticle.checked) {
                    // this.setupConfig.reuseLabId = this.overwriteArticle.checked;
                    this.buttonTranslate.innerHTML = `<b>${ this.setupConfig.reuseLabId ? `Update article ${ this.setupConfig.labId }` : 'Create new article' }</b>`;
                }
            });
        }

        // Listener to overwrite previously translated article
        if (this.createNewArticle) {
            this.createNewArticle.addEventListener('click', (event) => {
                this.overwriteArticle.checked = !this.createNewArticle.checked;
                this.setupConfig.reuseLabId = this.overwriteArticle.checked;

                if (translateAnotherArticle.checked) {
                    // this.setupConfig.reuseLabId = this.overwriteArticle.checked;
                    this.buttonTranslate.innerHTML = `<b>${ this.setupConfig.reuseLabId ? `Update article ${ this.setupConfig.labId }` : 'Create new article' }</b>`;
                }

            });
        }

        // Default text content for "update"-button
        if (translateAnotherArticle && translateAnotherArticle.checked && this.overwriteArticle) {
            this.setupConfig.reuseLabId = this.overwriteArticle.checked;
            this.buttonTranslate.innerHTML = `<b>${ this.setupConfig.reuseLabId ? `Update article ${ this.setupConfig.labId }` : 'Create new article' }</b>`;
        }

        this.selectionPrototype = this.markup.querySelector('#prototype_id');
        this.selectionSite = this.markup.querySelector('#site_id');
        this.setupConfig.html = `
            <select name="prototype_id" id="prototype_id">
                {{#prototypes}}
                <option value="{{value}}" {{#selected}}selected{{/selected}}>{{name}}</option>
                {{/prototypes}}
            </select>`;

        this.setupPrototypes().then((data) => {
            // initial setup of prototype-list based on selected site

            this.setupConfig.sitePrototypes = this.prototypes.filter((prototype) => Number(prototype.site) === Number(this.setupConfig.selectedSiteId));

            const renderedHtml = this.api.v1.util.dom.renderTemplate(this.setupConfig.html, {
                prototypes: this.setupConfig.sitePrototypes
            }, true);

            this.selectionPrototype.outerHTML = renderedHtml.outerHTML;
            this.attachPrototypeChangeListener();

            // Set initial value for selectedPrototypeId
            this.selectionPrototype = this.markup.querySelector('#prototype_id');
            if (this.selectionPrototype && this.selectionPrototype.value) {
                this.setupConfig.selectedPrototypeId = this.selectionPrototype.value;
            }
        });

        // Update prototype-list when selected site changes
        this.selectionSite.addEventListener('change', (event) => {
            this.selectionPrototype = this.markup.querySelector('#prototype_id');

            this.setupConfig.selectedSiteId = event.target.value;
            this.setupConfig.sitePrototypes = this.prototypes.filter((prototype) => prototype.site === this.setupConfig.selectedSiteId);

            const renderedHtml = this.api.v1.util.dom.renderTemplate(this.setupConfig.html, {
                prototypes: this.setupConfig.sitePrototypes
            }, true);

            this.selectionPrototype.innerHTML = renderedHtml.innerHTML;
            this.attachPrototypeChangeListener();
        });

        this.selectionPrototype.addEventListener('change', (event) => {
            this.setupConfig.selectedPrototypeId = event.target.value;
        });

        this.attachPrototypeChangeListener();

    }

    attachPrototypeChangeListener() {
        const renderedHtml = this.api.v1.util.dom.renderTemplate(this.setupConfig.html, {
            prototypes: this.setupConfig.sitePrototypes
        }, true);

        this.selectionPrototype.innerHTML = renderedHtml.innerHTML;
        // this.selectionPrototype = this.markup.querySelector('#prototype_id');
        this.setupConfig.selectedPrototypeId = this.selectionPrototype.value;

        if (this.selectionPrototype) {
            this.selectionPrototype.addEventListener('change', (event) => {
                this.setupConfig.selectedPrototypeId = event.target.value;
            });
        }

        if (!this.setupConfig.selectedPrototypeId) {

            this.buttonTranslate.classList.add('lab-disabled');
        } else {
            this.buttonTranslate.classList.remove('lab-disabled');
        }
    }

    makeCopyUrl(originalArticleId, prototypeId) {
        return `/ajax/article/copy-to-prototype/?articleId=${ originalArticleId }&prototype=${ prototypeId }&forceCopy=true`;
    }

    splitData(dataString, targetField, splitTarget = '</p>') {
        /**
         * Split the data into smaller parts
         * @param {string} dataString - The data to be splitted
         * @param {string} targetField - The field name to be splitted
         * @param {string} splitTarget - The target to split the data with
         */
        if (!dataString || dataString.length === 0) {
            return {};
        }
        // Setup
        const data = JSON.parse(dataString);

        if (!data[targetField]) {
            return {};
        }
        const dataPartials = data[targetField].split(splitTarget);
        const maxLength = 800;
        let part = '';
        let index = 0;
        const partials = {};

        // Split up bodytext into bodytext-partials
        if (dataPartials) {
            for (let dataPartial of dataPartials) {
                if (dataPartial && dataPartial.length > 0) {
                    dataPartial += splitTarget;
                    part += dataPartial;
                    if (part.length > maxLength) {
                        index += 1;
                        partials[index] = part;
                        part = '';
                    }
                    /*
                    if (part.length < maxLength) {
                        // Build 'part' of bodytext-partial
                        part += dataPartial;
                    } else {
                        // Store bodytext-partial
                        index += 1;
                        partials[index] = part;
                        part = '';
                    } */
                }
            }
        }

        // Include remainder
        if (part && part.length > 0) {
            index += 1;
            partials[index] = part;
            part = '';
        }

        return partials;

    }

    translateAndUpdatePartials(partials, context = null) {
        /**
         * Translate the partials (meaning the bodytext is splitted into smaller parts)
         * After translation, the method starts to internally update the article
         *
         * @param {object} partials - The partials to be translated
         * @param {string} context - The context to translate data with, usually the whole bodytext
         */
        // For each partial: translate and validate
        const promises = [];
        for (const i of Object.keys(partials)) {
            const content = JSON.stringify({ [i]: partials[i] });
            const result = this.translateContent(content, context)
                .then((response) => this.validateJsonString(response));
            promises.push(result);

        }

        // When all partials are provided, then update article field
        Promise.all(promises)
            .then((result) => {
                // Sort the array based on the numerical value of the keys
                result.sort((a, b) => {
                    const keyA = Number(Object.keys(a)[0]);
                    const keyB = Number(Object.keys(b)[0]);
                    return keyA - keyB;
                });

                // Build new bodytext
                let bodytext = '';
                for (let part of result) {
                    part = JSON.parse(part);
                    bodytext += Object.values(part)[0];
                }

                // Update article field with translated bodytext
                const content = JSON.stringify({ bodytext });
                this.updateArticleFields(content);
                this.evaluateProgress();

            });
    }

    // promise
    translatePartials(partials, context = null) {
        /**
         * Translate the partials (meaning the bodytext is splitted into smaller parts)
         * Returns a promise
         *
         * @param {object} partials - The partials to be translated
         * @param {string} context - The context to translate data with, usually the whole bodytext
         */

        return new Promise((resolve, reject) => {
        // For each partial: translate and validate
            const promises = [];
            for (const i of Object.keys(partials)) {
                const content = JSON.stringify({ [i]: partials[i] });
                const result = this.translateContent(content, context, true)
                    .then((response) => this.validateJsonString(response))
                    .catch((error) => {
                        console.log('error: ', error);
                    });

                promises.push(result);

            }
            // When all partials are provided, then update article field
            Promise.all(promises)
                .then((result) => {
                    // Sort the array based on the numerical value of the keys
                    result.sort((a, b) => {
                        const keyA = Number(Object.keys(a)[0]);
                        const keyB = Number(Object.keys(b)[0]);
                        return keyA - keyB;
                    });

                    // Build new bodytext
                    let bodytext = '';
                    for (let part of result) {
                        part = JSON.parse(part);
                        bodytext += Object.values(part)[0];
                    }

                    // Resolve with article translated field 'bodytext'
                    resolve({ bodytext });
                });
        });

    }

    translateContent(content, context = null, validate = false) {
        /**
         * Translate the content
         * @param {string} content - The content to be translated
         * @param {string} context - The context to translate data with
         * @param {boolean} validate - Validate the json string
         */
        // Translate and return respons
        const style = 'Journalistic';
        const tone = 'Journalistic';
        const { language } = this;
        return new Promise((resolve, reject) => {
            if (!content) {
                resolve('{}');
            }
            if (content && content.length <= 2) {
                this.updateProgressBar('max');
                this.updateProgressBar('value');
                this.evaluateProgress();
                resolve('{}');
            }
            this.updateProgressBar('max');
            this.api.v1.ns.get('textAssistant.fetchByGroupName')('article_translate', this.aiSettings, {
                tone, style, language, articleFields: content, context
            }).then((respons) => {
                this.updateProgressBar('value');
                this.evaluateProgress();

                if (validate === true) {
                    const jsonString = this.validateJsonString(respons);
                    const articleFields = JSON.parse(jsonString);
                    resolve(articleFields);
                }
                resolve(respons);
            });
        });
    }

    translateDataExternal(fieldType, articleFields, context = null) {
        /**
         * Translate the data
         * @param {string} fieldType - The type of data to be translated (fields or children)
         * @param {string} articleFields - The fields to be translated
         * @param {string} context - The context to translate data with
         */
        // Input for text assistant
        const style = 'Journalistic';
        const tone = 'Journalistic';
        const { language } = this;
        this.updateProgressBar('max');

        this.api.v1.ns.get('textAssistant.fetchByGroupName')('article_translate', this.aiSettings, {
            tone, style, language, articleFields, context
        }).then((respons) => {

            if (fieldType === 'children') {
                this.updateChildrenFields(respons);
            } else if (fieldType === 'fields') {
                this.updateArticleFields(respons);
            }

            this.updateProgressBar('value');
            this.evaluateProgress();
        });
    }

    translateData(fieldType, articleFields, context = null) {
        /**
         * Translate the data
         * @param {string} fieldType - The type of data to be translated (fields or children)
         * @param {string} articleFields - The fields to be translated
         * @param {string} context - The context to translate data with
         */
        // Input for text assistant
        this.updateProgressBar('max');

        const style = 'Journalistic';
        const tone = 'Journalistic';
        const { language } = this;

        if (Object.keys(JSON.parse(articleFields)).length === 0) {
            this.updateProgressBar('value');
            this.evaluateProgress();
            return;
        }

        this.api.v1.ns.get('textAssistant.fetchByGroupName')('article_translate', this.aiSettings, {
            tone, style, language, articleFields, context
        }).then((respons) => {
            if (fieldType === 'children') {
                this.updateChildrenFields(respons);
            } else if (fieldType === 'fields') {
                this.updateArticleFields(respons);
            }

            this.updateProgressBar('value');
            this.evaluateProgress();
        });

    }

    getChildrenFieldsExternally(children) {
        /**
         * Get the fields of children given in 'childrenTypes'
         */

        // Children types and their fields to be processed
        const childrenTypes = {
            image: ['imageCaption', 'byline'],
            quotebox: ['quote', 'author'],
            factbox: ['title', 'bodytext'],
            byline: ['description', 'description2'],
            timeline: ['title'],
            timelineItem: ['text', 'title'],
            article: ['title', 'subtitle', 'byline', 'kicker']

        };

        // Evaluate the fields of children given in 'childrenTypes'
        const fieldsChildren = {};
        for (const child of children) {
            if (Object.keys(childrenTypes).includes(child.type)) {

                // Store field of child with specific type
                for (const field of childrenTypes[child.type]) {
                    const childField = child.fields[field];

                    if (childField) {
                        const key = `${ child.type }_${ child.id || child.labId }_${ field }`;
                        fieldsChildren[key] = childField;
                    }
                }
            }

        }
        return JSON.stringify(fieldsChildren);
    }

    getChildrenFieldsInternally() {
        /**
         * Get the fields of children given in 'childrenTypes'
         */

        // Children types and their fields to be processed
        const childrenTypes = {
            image: ['imageCaption', 'byline'],
            quotebox: ['quote', 'author'],
            factbox: ['title', 'bodytext'],
            byline: ['description'],
            timeline: ['title'],
            timelineItem: ['text', 'title'],
            article: ['title', 'subtitle', 'byline', 'kicker']
        };

        // Evaluate the fields of children given in 'childrenTypes'
        const fieldsChildren = {};
        for (const childType of Object.keys(childrenTypes)) {
            const children = lab_api.v1.model.query.getChildrenOfType(this.rootModel, childType, true);
            for (const child of children) {
                const childId = child.get('id') || child.get('labId');
                const view = lab_api.v1.view.getView(child);

                // Store field of child with specific type
                for (const field of childrenTypes[childType]) {
                    const childField = view.get(`fields.${ field }`);

                    if (childField) {
                        const key = `${ childType }_${ childId }_${ field }`;
                        fieldsChildren[key] = childField;
                    }

                }

            }
        }
        return JSON.stringify(fieldsChildren);
    }

    getArticleFields(fields) {
        /**
         * Get the fields of the article
         * @param {array} fields - The fields to be processed
         */
        const articleFields = {};
        for (const field of fields) {
            let query;
            if (field === 'tags') {
                query = 'tags';
            } else {
                query = `fields.${ field }`;
            }

            const fieldContent = this.rootModel.get(query);
            if (fieldContent) {
                articleFields[field] = fieldContent;
            }

        }
        return JSON.stringify(articleFields);
    }

    selectArticleFieldsFromNode(node, fields) {
        /**
         * Select the fields of the article node
         * @param {object} node - The article node
         * @param {array} fields - The fields to be processed
         */
        const articleFields = {};
        for (const field of fields) {
            if (node.fields[field]) {
                articleFields[field] = node.fields[field];
            }
        }
        return JSON.stringify(articleFields);
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
        language = (language || '').trim();
        return language;
    }

    updateArticleFields(data) {
        /**
         * Update the fields of the article
         * @param {string} data - The json string from the text assistant
        */
        const jsonString = this.validateJsonString(data);
        const articleFields = JSON.parse(jsonString);
        for (const field of Object.keys(articleFields)) {
            let query;
            if (field === 'tags') {
                query = 'tags';
            } else {
                query = `fields.${ field }`;
            }

            this.rootModel.set(query, articleFields[field]);
        }
    }

    updateProgressBar(attribute, setLevel = false) {
        /**
         * Update the progress meter
         * @param {number} update - The amount to update the progress meter
         */
        let attributeLevel;
        if (attribute === 'value') {
            this.progressLevel += 1;
            attributeLevel = this.progressLevel;
        }
        if (attribute === 'max') {
            this.progressFinish += 1;
            attributeLevel = this.progressFinish;

        }

        if (setLevel === true) {
            attributeLevel = 0;
        }
        const progressMeter = this.markup.querySelector('#progress-meter');
        progressMeter.setAttribute(attribute, attributeLevel);
    }

    updateChildrenFields(data) {
        /**
         * Update the fields of children given in 'childrenTypes'
         * @param {string} data - The json string from the text assistant
         */
        // Expected format: factbox_100156_bodytext
        const jsonString = this.validateJsonString(data);
        const articleFields = JSON.parse(jsonString);
        for (const fieldKeys of Object.keys(articleFields)) {
            const keys = fieldKeys.split('_');
            const type = keys[0];
            const id = keys[1];
            const field = keys[2];

            const children = lab_api.v1.model.query.getChildrenOfType(this.rootModel, type, true);
            for (const child of children) {
                const childId = child.get('id') || child.get('labId');
                const view = lab_api.v1.view.getView(child);
                // bruk view.get() og view.set()
                if (Number(id) === Number(childId)) {
                    const childField = view.get(`fields.${ field }`);
                    if (childField) {
                        view.set(`fields.${ field }`, articleFields[fieldKeys]);
                    }
                }
            }
        }
    }

    updateArticleModelFields(articleModel, fieldPath, data, updateMethod) {
        /**
         * @param {string} id - The article id to be updated
         * @param {string} field - The field to be updated
         * @param {string} data - The updated data
         */

        if (!articleModel) {
            return;
        }

        // Append - anta at det er et array, og at det skal legges til i slutten av arrayet
        if (updateMethod === 'append') {
            let fieldValue = articleModel.get(fieldPath);

            if (fieldValue) {
                fieldValue = JSON.parse(fieldValue);
                if (typeof fieldValue === 'string') {
                    fieldValue = [fieldValue];
                }
            } else {
                fieldValue = [data];
            }

            // Append to data-array
            fieldValue.push(data);
            articleModel.set(fieldPath, JSON.stringify(fieldValue));
        }

        // Replace
        if (updateMethod === 'replace') {
            let fieldValue = JSON.stringify(data);

            if (typeof data !== 'string') {
                fieldValue = JSON.stringify(data);
            }
            articleModel.set(fieldPath, fieldValue);
        }

        /*
        // Delete - use get('fields'), slett felt i objektet og set objektet på nytt('')
        Documentation https://labrador-woldbrand-stage.labdevs.com/support/docs/#js-api/v1/util/object/delete.md
        if (updateMethod === 'delete') {
            delete model.
        }
        */

    }

    validateJsonString(data) {
        /**
         * Validate the json string from the text assistant
         * @param {string} data - The json string from the text assistant
         */
        if (!data) {
            return '';
        }
        let jsonString = data;
        // let jsonString = JSON.stringify(data);
        if (typeof jsonString !== 'string') {
            jsonString = JSON.stringify(data);
        }

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

        if (jsonString) {
            jsonString = jsonString.trim();
        }
        return jsonString;
    }

    addAiMetadata(extraMetadata = {}) {
        /**
         * Add metadata for the ai-integration
         * @param {string} id - The article id to be updated
         * @param {object} extraMetadata - Extra metadata to be added
         */

        const aiMetadata = this.aiSettings;
        aiMetadata.created = Math.floor(new Date().getTime() / 1000);
        aiMetadata.createdByName = this.api.v1.user.getUserName();
        aiMetadata.createdById = this.api.v1.user.getUserId();
        aiMetadata.promptDescription = 'translate';

        for (const key of Object.keys(extraMetadata)) {
            aiMetadata[key] = extraMetadata[key];
        }
        const stringifiedMetadata = JSON.stringify(aiMetadata);
        return stringifiedMetadata;

        // Build and save formdata
        /*
        const node =  {
            id,
            type: 'article'
        };
        const data = { ai_metadata_json: JSON.stringify(aiMetadata) };
        const formData = this.buildFormData(node, data);
        this.saveNodeAndData(formData);
        */

    }

    cleanUpHtmlString(htmlString) {
        /**
         * Clean up the html string
         * @param {string} htmlString - The html string to be cleaned up
         */
        const htmlStringUpdated = htmlString.replaceAll(/\\+/g, '\\')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&apos;/g, '\'');
        return htmlStringUpdated;
    }

    evaluateProgress(beginProcess = false) {
        /**
         * Info text and progress meter for the translation process
         * @param {boolean} beginProcess - If true, the translation process has already begun
         */
        const infoProgressElement = this.markup.querySelector('#info-translation');
        const infoProgressElement2 = this.markup.querySelector('#info-translation-progress');

        // Language
        let { language } = this;
        if (language.includes('-')) {
            language = language.substring(0, this.language.indexOf('-'));
        }
        if (/\(.*?\)/.test(language)) {
            language = language.replaceAll(/\(.*?\)/g, '');
        }
        language = language.trim();

        // Begin
        if (beginProcess === true) {
            // Info text
            const infoGroup = this.markup.querySelector('.translate-process-info');
            if (infoGroup) {
                infoGroup.classList.remove('lab-hidden');
            }

            infoProgressElement.textContent = `Your article is being translated into ${ language }. Expect this operation to take up to two minutes.`;

            // Translate button
            this.buttonTranslate.classList.add('lab-disabled');
            this.buttonTranslate.classList.add('lab-busy', 'lab-busy-top');

        }

        // Finish
        if (this.beginProcess !== true && this.progressLevel === this.progressFinish && this.progressFinish > 3) {
            this.buttonTranslate.classList.remove('lab-busy', 'lab-busy-top');
            if (this.buttonGoTo) {
                this.buttonGoTo.classList.remove('lab-disabled');
                this.buttonGoTo.innerHTML = `<b>Go to translated article</b>`;
            }
            const articleId = this.alternativeArticleId || this.rootModel.get('id');
            infoProgressElement.textContent = `Your article ${ articleId } has successfully been translated into ${ language }`;
            infoProgressElement2.textContent = `Translation finished!`;
        }

    }

}
