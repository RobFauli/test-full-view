import { DateTimeHelper } from '../lib/helpers/datetime/DateTimeHelper.js';

export default class {

    constructor(api) {
        this.api = api;
        // Site-config may specify paths to include in new article-teasers
        this.customFields = lab_api.v1.config.get('customAdapterFields.article') || [];
        this.dateTimeHelper = new DateTimeHelper(this.api.v1.config.get('lang') || undefined);
        this.updateInterval = 30000; // Milliseconds, 10000 = 10 seconds
    }

    onProperties() {
        return {
            autoRefresh: 60
        };
    }

    onCreated(uiInterface, options) {
        const siteId = this.api.v1.eventmonitor.reader.getUiSelection('articles_latest_site_id');
        if (options.externalContentUpdater === true && options.updateContents) {
            this.updateContents = options.updateContents;
        }
        uiInterface.setProperty('query', {
            start: 0,
            limit: 24,
            orderBy: 'published',
            api: {
                section: this.api.v1.eventmonitor.reader.getUiSelection(siteId ? `section_site_${ siteId }` : 'section'),
                id: null,
                tag: null,
                fromDate: null,
                toDate: null,
                text: null,
                onlyMine: this.api.v1.eventmonitor.reader.getUiSelection('article_list_only_mine') || false,
                onlyPaywall: this.api.v1.eventmonitor.reader.getUiSelection('article_list_only_paywall') || false
            },
            site_id: siteId
        });

        if (options.click) {
            uiInterface.setProperty('itemClickCallback', options.click);
        }
        if (options.end) {
            uiInterface.setProperty('endCallback', options.end);
        }
        if (options.display) {
            uiInterface.setProperty('displayCallback', options.display);
        }

        if (options.updateContent) {
            uiInterface.setProperty('updateContentCallback', options.updateContent);
        }

        if (options.ignoreUnpublished) {
            // Do not draw articles without published url.
            uiInterface.setProperty('ignoreUnpublished', true);
        }
        this.api.v1.app.on('pageVisibilityChange', ({ isVisible }) => {
            if (isVisible) {
                if (uiInterface.getProperty('collectionIsVisible')) {
                    this.startUpdateInterval(uiInterface);
                }
            } else {
                this.endUpdateInterval(uiInterface);
            }
        });
    }

    onHeader(uiInterface, params) {
        const form = this.api.v1.util.dom.renderView('collections/articlesLatest/header', {}, true);
        const query = uiInterface.getProperty('query');

        const formHandler = (event) => {
            const formData = this.api.v1.util.dom.serializeForm(form);
            query.api.id = (formData.id || '').trim();
            query.api.section = (formData.section || '').trim().toLowerCase();
            query.api.tag = (formData.tag || '').trim();
            query.api.fromDate = (formData.fromDate ? new Date(formData.fromDate.trim()) : '');
            query.api.toDate = (formData.toDate ? new Date(formData.toDate.trim()) : '');
            query.api.text = (formData.text || '').trim();
            query.api.onlyMine = !!formData.article_list_only_mine;
            query.api.onlyPaywall = !!formData.article_list_only_paywall;
            query.site_id = (formData.articles_latest_site_id || '').trim();
            this.resetPager(uiInterface);
            uiInterface.getData();
        };

        const updateSections = (siteId) => {
            // Create a select-element containig available sections.
            // The preferred section for user will be selected and stored when changed.
            const container = form.querySelector('.section-container');
            container.innerHTML = '';
            const selectEl = this.api.v1.ui.element.getSectionSelector({
                attributes: [{
                    name: 'name',
                    value: 'section'
                }],
                siteId: siteId ? parseInt(siteId, 10) : null,
                label: 'All sections',
                events: [{
                    name: 'change',
                    callback: formHandler
                }]
            });
            container.appendChild(selectEl);
            query.api.section = selectEl.value;
        };

        // Create a select-element containig available sites.
        // The preferred site for user will be selected and stored when changed.
        const siteSelectEl = this.api.v1.ui.element.getSiteSelector({
            attributes: [{
                name: 'name',
                value: 'articles_latest_site_id'
            }],
            value: query.site_id,
            events: [{
                name: 'change',
                callback: (event) => {
                    updateSections(event.target.value);
                }
            }],
            label: 'All sites'
        });

        query.site_id = siteSelectEl.value ? parseInt(siteSelectEl.value, 10) : '';
        form.querySelector('.site-container').appendChild(siteSelectEl);

        updateSections(query.site_id);

        // Create a checkbox to toggle displaying articles from current user only.
        // The preferred state for user will be selected and stored when changed.
        form.querySelector('.article_list_only_mine-container').appendChild(this.api.v1.ui.element.getCheckboxElement({
            name: 'article_list_only_mine',
            label: 'Only mine'
        }));

        // Create a checkbox to toggle displaying articles from only paywall.
        // The preferred state for user will be selected and stored when changed.
        form.querySelector('.article_list_only_paywall-container').appendChild(this.api.v1.ui.element.getCheckboxElement({
            name: 'article_list_only_paywall',
            label: 'Only paywall'
        }));

        for (const formEl of [...form.querySelectorAll('input, select')]) {
            formEl.addEventListener('input', formHandler, false);
        }
        form.addEventListener('submit', (event) => {
            event.preventDefault();
        }, false);
        const toggleEl = form.querySelector('a');
        const expandableEl = form.querySelector('.expanded');
        if (toggleEl && expandableEl) {
            toggleEl.addEventListener('click', (event) => {
                event.preventDefault();
                expandableEl.classList.toggle('lab-hidden');
            }, false);
        }

        form.querySelector('.size-container').appendChild(this.api.v1.ui.element.getSizeElements({
            name: 'article_list_preferred_size',
            btnSize: 'lab-small',
            css: 'lab-grid lab-autogrid lab-btn-group',
            sizes: ['small', 'medium', 'large'],
            callback: (preferredSize) => {
                uiInterface.setProperty('size', preferredSize);
                uiInterface.requestSize(preferredSize);
            }
        }));

        const preferredSize = this.api.v1.eventmonitor.reader.getUiSelection('article_list_preferred_size');
        if (preferredSize) {
            uiInterface.setProperty('size', preferredSize);
            uiInterface.requestSize(preferredSize);
        }

        return form;
    }

    onFooter(uiInterface, options) {
        /**
         * Show a footer with buttons to navigate between pages.
         * Optional callback to 'updateContentCallback' can be used to update the footer.
         * @param {Object} uiInterface - The interface object used to update the UI.
         * @param {Object} options - Options for the footer.
         */
        const form = this.api.v1.util.dom.renderView('collections/articlesLatest/footer', {}, true);

        uiInterface.setDomElement('previewPageElement', form.querySelector('.lab-footer-prev'));
        uiInterface.getDomElement('previewPageElement').addEventListener('click', (event) => {
            this.navigate(uiInterface, false);
        }, false);

        uiInterface.setDomElement('nextPageElement', form.querySelector('.lab-footer-next'));
        uiInterface.getDomElement('nextPageElement').addEventListener('click', (event) => {
            this.navigate(uiInterface, true);
        }, false);

        form.querySelector('.lab-footer-reload').addEventListener('click', (event) => {
            uiInterface.getData(true);
        }, false);
        uiInterface.setDomElement('pageCounterElement', form.querySelector('.lab-footer-counter'));

        if (this.updateContents && this.updateContents.footer && this.updateContents.footer === true) {
            const updateContentCallback = uiInterface.getProperty('updateContentCallback');
            return updateContentCallback(form, { type: 'footer' });
        }

        return form;
    }

    onGetUrl(uiInterface) {
        const query = uiInterface.getProperty('query');
        const args = [
            `query=${ this.buildApiQueryString(uiInterface) }`,
            `orderBy=${ query.orderBy }`,
            `start=${ query.start }`,
            `site_id=${ query.site_id }`,
            `limit=${ query.limit }`,
            `htmlText=1`
        ];
        return `/api/v1/article/?${ args.join('&') }`;
    }

    onMapData(uiInterface, data, options) {
        const labData = [];
        const serverData = data && data.result && Array.isArray(data.result) ? data : [];
        const notes = {};
        const ignoreUnpublished = uiInterface.getProperty('ignoreUnpublished');

        // Create an empty article:
        if (!ignoreUnpublished) {
            labData.push(this.articleData({
                filtered: {
                    title: 'Empty article'
                }
            }));
        }

        for (const item of serverData.result) {
            const article = this.articleData(item);
            if (!ignoreUnpublished || article.fields.published_url) {
                labData.push(article);
            }
            const note = item.hasNotes.trim();
            if (note) {
                notes[item.id] = note;
            }
        }

        uiInterface.setProperty('notes', notes);
        this.updatePageNumber(uiInterface);

        return labData;
    }

    onItemProperties(uiInterface) {
        return {
            title: {
                path: 'filtered.title',
                content: null
            },
            description: {
                path: 'filtered.subtitle',
                content: null
            }
        };
    }

    onRendered(uiInterface, contentList) {
        const notes = uiInterface.getProperty('notes');
        uiInterface.setProperty('contentList', contentList);
        this.markExisting(uiInterface);
        if (uiInterface.getProperty('size') === 'large') {
            this.displayPublishDates(uiInterface, contentList);
        }
        if (!Object.keys(notes).length) { return; }
        for (const item of contentList) {
            const id = item.model.get('instance_of');
            if (notes[id]) {
                this.addNote(item, notes[id]);
            }
        }
    }

    onChildAdded(uiInterface, model, element) {

        const itemClickCallback = uiInterface.getProperty('itemClickCallback');
        if (itemClickCallback) {
            element.addEventListener('click', (event) => {
                itemClickCallback(uiInterface, model, element, event);
                this.markExisting(uiInterface);

            }, false);
        }
    }

    onDisplayed(uiInterface, options) {
        this.startUpdateInterval(uiInterface);
        uiInterface.setProperty('collectionIsVisible', true);
        this.api.v1.model.on('childAdded', this.getArticleListener(uiInterface));
        this.api.v1.model.on('childRemoved', this.getArticleListener(uiInterface));

        this.markExisting(uiInterface);

    }

    onHidden(uiInterface) {
        this.endUpdateInterval(uiInterface);
        uiInterface.setProperty('collectionIsVisible', false);
        this.api.v1.model.off('childAdded', this.getArticleListener(uiInterface));
        this.api.v1.model.off('childRemoved', this.getArticleListener(uiInterface));
        const endCallback = uiInterface.getProperty('endCallback');
        if (endCallback) {
            endCallback(uiInterface);
        }
    }

    navigate(uiInterface, forward) {
        this.endUpdateInterval(uiInterface);
        const query = uiInterface.getProperty('query');
        if (forward) {
            query.start += query.limit;
        } else {
            query.start -= query.limit;
            if (query.start < 0) {
                query.start = 0;
            }
        }
        uiInterface.getData();
    }

    updatePageNumber(uiInterface) {
        const pageNumber = this.getPageNumber(uiInterface);
        const el = uiInterface.getDomElement('pageCounterElement');
        el.innerHTML = pageNumber;
        if (pageNumber < 2) {
            uiInterface.getDomElement('previewPageElement').setAttribute('disabled', 'disabled');
        } else {
            uiInterface.getDomElement('previewPageElement').removeAttribute('disabled');
        }
    }

    getPageNumber(uiInterface) {
        const query = uiInterface.getProperty('query');
        return Math.ceil(query.start / query.limit) + 1;
    }

    // (string) Build "query" for Labrador API v1.
    buildApiQueryString(uiInterface) {
        const query = uiInterface.getProperty('query');
        const params = [];
        if (query.api.id) {
            const idArray = query.api.id.split(/[\s,]+/).map((id) => this.trimInputText(id)).filter((id) => id);
            if (idArray.length) {
                params.push(`(id:(${ idArray.join(' OR ') }))`);
            }
        }
        if (query.api.section) params.push(`(section:("${ query.api.section }"))`);
        if (query.api.tag) params.push(`(tag:("${ this.trimInputText(query.api.tag) }"))`);
        if (query.api.text) {
            params.push(`${ this.trimInputText(query.api.text) }*`);
        }
        if (query.api.onlyMine) {
            params.push('(has_published:me%20OR%20created_by:me)');
        }
        if (query.api.onlyPaywall) {
            params.push('(paywall:1)');
        }
        params.push('visibility_status:P');

        const from = query.api.fromDate ? query.api.fromDate.toISOString() : '*';
        const to = query.api.toDate ? query.api.toDate.toISOString() : 'NOW';
        params.push(`published:[${ from } ${ to }]`);

        const result = params.join(' AND ');
        return result;
    }

    trimInputText(txt = '') {
        return txt.trim().replace(/"/g, '');
    }

    // (object) Create data for an article-element
    articleData(inputData) {
        const childrenData = [];
        const filtered = inputData.filtered || {};
        if (inputData.image) {
            childrenData.push({
                type: 'image',
                contentdata: {
                    instance_of: inputData.image,
                    fields: this.api.v1.view.helpers.image.getImageProperties(inputData)
                },
                children: []
            });
        }

        const bylines = (inputData.full_bylines || []).map((byline) => ({
            firstname: byline.firstname,
            lastname: byline.lastname,
            imageUrl: byline.imageUrl
        }));

        const title = inputData.teaserTitle || inputData.title || '';
        const subtitle = inputData.teaserSubtitle || inputData.subtitle || '';
        const kicker = inputData.teaserKicker || inputData.kicker || '';
        const articleData = {
            type: inputData.type ? inputData.type : 'article',
            contentdata: {
                instance_of: inputData.id ? parseInt(inputData.id, 10) : null,
                tags: inputData.tags ? inputData.tags.split(', ') : [],
                fields: {
                    full_bylines_json: bylines,
                    title,
                    subtitle,
                    kicker,
                    published_url: inputData.published_url,
                    published: inputData.published,
                    showcomments: inputData.showcomments,
                    paywall: inputData.paywall,
                    displayByline: inputData.showbylineonfp,
                    section: inputData.section_tag,
                    hideAds: inputData.hideAds,
                    site_id: inputData.site_id || null,
                    site_alias: (this.api.v1.site.getSiteById(inputData.site_id) || {}).alias
                }
            },
            filtered: {
                title: filtered.title || (title || '[No title]'),
                subtitle: filtered.subtitle || (subtitle || '[No subtitle]')
            },
            children: childrenData
        };
        for (const field of this.customFields) {
            if (inputData[field] !== undefined) {
                Sys.logger.debug(`Collection: Will add custom field "${ field }".`);
                articleData.contentdata.fields[field] = inputData[field];
            }
        }
        return articleData;
    }

    resetPager(uiInterface) {
        const query = uiInterface.getProperty('query');
        query.start = 0;
    }

    addNote(item, note) {
        const el = document.createElement('div');
        el.setAttribute('title', 'Display notes');
        el.classList.add('notes-info', 'labicon-notes');
        el.addEventListener('click', (event) => {
            this.displayNote(item, note);
        }, false);
        item.element.querySelector('.lab-inner').prepend(el);
    }

    displayNote(item, note) {
        const lines = note.split('\n').filter((line) => !!line).map((line) => `<p class="lab-para">${ line }</p>`);
        this.api.v1.ui.modal.dialog({
            content: {
                title: `Notes for "${ item.model.get('fields.title') }"`,
                markup: lines.join('')
            }
        });
    }

    getArticleListener(uiInterface) {
        if (!uiInterface.getProperty('articleListener')) {
            const listener = (params) => {
                if (params.childModel.getType() === 'article') {
                    this.markExisting(uiInterface);
                }
            };
            uiInterface.setProperty('articleListener', listener);
        }
        return uiInterface.getProperty('articleListener');
    }

    markExisting(uiInterface) {

        const existing = this.api.v1.model.query.getModelsByType('article');
        const contentList = uiInterface.getProperty('contentList') || [];
        for (let item of contentList) {
            const id = item.model.get('instance_of');
            if (id) {
                if (this.hasId(id, existing)) {
                    item.element.classList.add('lab-highlight-item');
                    item.element.setAttribute('title', 'Article used on current page');
                } else {
                    item.element.classList.remove('lab-highlight-item');
                    item.element.setAttribute('title', '');
                }

                if (this.updateContents && this.updateContents.markExisting) {
                    const updateContentCallback = uiInterface.getProperty('updateContentCallback');
                    const params = {
                        type: 'markExisting',
                        id
                    };
                    item = updateContentCallback(item, params);
                }
            }
        }
    }

    hasId(id, list) {
        for (const model of list) {
            if (id === model.get('instance_of')) {
                return true;
            }
        }
        return false;
    }

    displayPublishDates(uiInterface, contentList) {
        for (const item of contentList) {
            const dateString = item.model.get('fields.published');
            if (dateString) {
                const el = document.createElement('p');
                el.classList.add('article-publish-date', 'lab-offstage-description', 'labicon-time');
                el.innerHTML = this.formatDate(dateString);
                const id = item.model.get('instance_of');
                if (id) {
                    el.innerHTML += ` <a href="/edit/article/id/${ id }" target="_blank" class="lab-btn lab-small">Edit</a>`;
                }
                item.element.querySelector('.lab-inner').appendChild(el);
            }
        }
    }

    formatDate(isoDateString) {
        if (!isoDateString) {
            return '';
        }
        const date = new Date(isoDateString);
        return this.dateTimeHelper.format(date, `${ this.dateTimeHelper.str('monthdayyear') } ${ this.dateTimeHelper.str('hourminute') }`);
    }

    /**
     * Starts an interval to update the UI with new data.
     * @param {Object} uiInterface - The interface object used to update the UI.
     */
    startUpdateInterval(uiInterface) {
        uiInterface.setProperty('updateIntervalId', window.setInterval(() => {
            uiInterface.getData(true, { isSilent: true });
        }, this.updateInterval));
    }

    /**
     * Stops the update interval for the UI interface.
     * @param {Object} uiInterface - The UI interface object.
     */
    endUpdateInterval(uiInterface) {
        window.clearInterval(uiInterface.getProperty('updateIntervalId'));
    }

}
