// import { Search } from '../labrador/source/Search.js';

import { FrontContentRenderer } from '../labrador/source/FrontContentRenderer.js';

export class Tagboard {

    constructor(settings) {
        this.settings = settings;
        this.baseUrl = settings.apiUrl; // http://api.example.com/article?query=test&limit=2&start=2&site_id=2
        this.FrontContentRenderer = new FrontContentRenderer({
            url: this.getUrl(),
            app: {
                device: this.settings.viewport,
                image_server: this.settings.imageServer
            },
            settings: this.settings
        });

        const taglistToggle = document.querySelector(`#tagboard_${ this.settings.id } .taglistToggle`);
        const formElement = document.querySelector(`#tagboard_${ this.settings.id } .taglist`);
        if (taglistToggle && formElement) {
            const toggleIcon = taglistToggle.querySelector('.dac-icon-hamburger');
            taglistToggle.addEventListener('click', (event) => {
                toggleIcon.classList.toggle('dac-open');
                formElement.classList.toggle('dac-hidden');
            }, false);
        }

        this.selectedTags = [];
        this.tagGroups = [];
        this.contentTags = [];
        const groupElements = [...document.querySelectorAll(`#tagboard_${ this.settings.id } form.taglist .group`)];
        for (const groupEl of groupElements) {
            const index = groupElements.indexOf(groupEl);
            const tagElements = groupEl.querySelectorAll('li input');
            const list = {};
            for (const element of tagElements) {
                list[element.value] = {
                    count: 0, maxCount: 0, element, counter: element.nextElementSibling, groupIndex: index
                };
                element.addEventListener('change', (event) => {
                    this.toggleTag(event.target.value, event.target.checked, index);
                }, false);
            }
            this.tagGroups.push(list);
            this.selectedTags.push([]);
        }
        this.fetchData();
    }

    getUrl() {
        return `${ this.addTagsToUrl(this.settings.url, this.settings.tagOptions.tags, this.settings.tagOptions.groups) }&fields=*,-bodytext,-ai_*,-bodytextHTML&limit=${ this.settings.articleCount }${ this.settings.siteId ? `&site_id=${ this.settings.siteId }` : '' }`;
    }

    addTagsToUrl(url, tags = [], tagGroups = []) {
        // Tags with space: Encapsulate in quotes in url.
        const prepareTags = (list) => list.map((tag) => {
            let modifiedTag = tag.trim();
            if (modifiedTag.indexOf(' ') > -1) {
                modifiedTag = `"${ modifiedTag }"`;
            }
            return `tag:${ modifiedTag }`;
        });
        // const tagsQueries = tags.map((tag) => `tag:${ tag }`);
        const space = ' ';
        let tagQueriesString = '';
        if (tagGroups.length) {
            tagQueriesString = encodeURIComponent(
                `${ space }AND${ space }${
                    tagGroups.map((tagGroup) => `(${ prepareTags(tagGroup).join(`${ space }OR${ space }`) })`)
                        .join(`${ space }AND${ space }`) }`
            );
        } else {
            tagQueriesString = encodeURIComponent(`${ space }AND${ space }(${ prepareTags(tags).join(`${ space  }OR${  space }`) })`);
        }
        return url + tagQueriesString;
    }

    fetchData() {
        this.FrontContentRenderer.read().then((result) => {
            this.insertArticles(result);
            this.readTagCount();
        });
    }

    insertArticles(result) {
        const container = document.querySelector(this.settings.selector);
        while (container.firstChild) {
            container.firstChild.remove();
        }
        const fragment = new DocumentFragment();
        for (const item of result.markups) {
            const div = document.createElement('div');
            div.innerHTML = item;
            fragment.appendChild(div.firstChild);
        }
        container.appendChild(fragment);
    }

    readTagCount(engine) {
        if (this.contentTags.length) {
            for (const group of this.tagGroups) {
                for (const key of Object.keys(group)) {
                    group[key].count = 0;
                    group[key].maxCount = 0;
                }
            }
            this.contentTags = [];
        }
        for (const model of this.FrontContentRenderer.renderer.api.v1.model.query.getModelsAsArray().filter((m) => m.getType() === 'article')) {
            const tags = model.get('tags') || [];
            this.contentTags.push(tags);
            for (const tag of tags) {
                this.bumpTagNumber(tag, true);
            }
        }
        this.updateTagNumberElements();
    }

    filterTagCount(index) {
        for (const list of this.tagGroups) {
            if (this.tagGroups.indexOf(list) !== index) {
                const requiredTags = this.selectedTags[index];
                // Require at least one of requiredTags:
                for (const tag of Object.keys(list)) {
                    list[tag].count = this.getTagCount(tag, requiredTags);
                }
            }
        }
        this.updateTagNumberElements();
    }

    getTagCount(tag, list) {
        const result = this.contentTags.filter((tags) => {
            if (!tags.includes(tag)) {
                return false;
            }
            if (!list.length) {
                return true;
            }
            for (const t of list) {
                if (tags.includes(t)) {
                    return true;
                }
            }
            return false;
        });
        return result.length;
    }

    bumpTagNumber(tagName, original = false) {
        for (const list of this.tagGroups) {
            if (list[tagName] !== undefined) {
                list[tagName].count++;
                if (original) {
                    list[tagName].maxCount++;
                }
            }
        }
    }

    updateTagNumberElements() {
        for (const list of this.tagGroups) {
            for (const tag of Object.keys(list)) {
                list[tag].counter.innerHTML = list[tag].count;
                list[tag].element.disabled = list[tag].count === 0;
                if (list[tag].count === 0) {
                    list[tag].element.parentElement.classList.add('disabled');
                } else {
                    list[tag].element.parentElement.classList.remove('disabled');
                }
            }
        }
    }

    toggleTag(tag, isOn, index) {
        this.selectedTags[index] = this.selectedTags[index].filter((t) => t !== tag);
        if (isOn) {
            this.selectedTags[index].push(tag);
        }
        this.FrontContentRenderer.filter(this.selectedTags);
        this.fetchData();
    }

}
