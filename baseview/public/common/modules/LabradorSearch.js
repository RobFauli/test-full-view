import { Search } from '../labrador/source/Search.js';

export class LabradorSearch {

    constructor(settings) {
        this.settings = settings;
        this.dom = {
            container: settings.container,
            spinner: settings.spinner,
            nav: settings.nav,
            filters: settings.filters,
            nextEl: null,
            advanced: {
                button: settings.advanced.button.element,
                container: settings.advanced.container,
                toggleAllSites: settings.advanced.sites.toggleAll
            }
        };
        this.sites = JSON.parse(this.settings.advanced.sites.allowed || '[]');
        this.sitesById = {};
        this.baseUrl = settings.apiUrl; // http://api.example.com/article?query=test&limit=2&start=2&site_id=2
        const getParams = new URLSearchParams(window.location.search);
        this.isDebug = getParams.get('debug') === '1';
        this.requestedSites = this.readSiteIDs(getParams.get('sites') || '');
        this.nohitsLabel = settings.nohitsLabel;

        // Arguments for the API-query. Prio:
        // 1) Url
        // 2) Input-settings
        // 3) Defaults
        // query: Support argument 'query' or 'q'

        this.urlParams = {
            limit: getParams.get('limit') || settings.articleCount || 20,
            start: parseInt(getParams.get('start'), 10) || 0,
            query: getParams.get('query') || getParams.get('q'),
            altText: 1
        };

        if (settings.orderBy) {
            this.urlParams.orderBy = settings.orderBy;
        }

        // Internal settings
        this.searchSettings = {
            count: 0, // Number of articles in last draw.
            totalCount: 0,
            canPage: true
        };

        this.setup();

        this.searchHandler = new Search({
            config: this.settings.config,
            url: this.getUrl(),
            app: {
                // device: 'mobile',
                device: this.settings.viewport,
                image_server: this.settings.imageServer
            },
            searchMapper: {
                bodytextLength: this.settings.bodytextLength,
                fallbackImage: this.settings.fallbackImage,
                sites: this.sites
            }
        });
    }

    setup() {
        const form = this.dom.container.querySelector('form');
        if (this.settings.isEditor) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
            }, false);
        }
        const inputEl = this.dom.container.querySelector('input[name="query"]');
        inputEl.value = this.getUrlParam('query');
        this.dom.nextEl = this.dom.container.querySelector('[data-nav="next"]');
        this.updatePager();
        this.dom.nextEl.addEventListener('click', (event) => {
            event.preventDefault();
            if (this.searchSettings.canPage) {
                this.nextPage();
            }
        }, false);

        if (this.settings.advanced.display) {
            let activeSites = [];

            if (this.sites.length === this.requestedSites.length || !this.requestedSites.length) {
                this.dom.advanced.toggleAllSites.checked = true;
            }

            this.sites.forEach((site) => {
                if (this.requestedSites.length > 0) {
                    if (this.requestedSites.includes(site.id)) {
                        activeSites.push(site);
                    }
                } else {
                    activeSites.push(site);
                }
            });

            this.settings.advanced.sites.checkboxes.forEach((checkbox) => {
                const siteID = parseInt(checkbox.value, 10);
                for (const site of activeSites) {
                    if (site.id === siteID) {
                        checkbox.checked = true;
                        break;
                    }
                }

                checkbox.addEventListener('change', (event) => {
                    const isChecked = event.target.checked;

                    if (isChecked) {
                        let checkSite = null;

                        for (const site of this.sites) {
                            if (site.id === siteID) {
                                let doesExist = false;
                                for (const activeSite of activeSites) {
                                    if (activeSite.id == siteID) {
                                        doesExist = true;
                                        break;
                                    }
                                }

                                if (!doesExist) {
                                    checkSite = site;
                                }
                                break;
                            }
                        }

                        if (checkSite !== null) {
                            activeSites.push(checkSite);
                        }

                        if (this.sites.length === activeSites.length) {
                            this.dom.advanced.toggleAllSites.checked = true;
                        }
                    } else {
                        if (activeSites.length === 1) {
                            event.target.checked = true;
                        } else {
                            let index = -1;

                            for (let i = 0; i < activeSites.length; i++) {
                                if (siteID === activeSites[i].id) {
                                    index = i;
                                    break;
                                }
                            }

                            if (index > -1) {
                                activeSites.splice(index, 1);
                            }
                        }

                        this.dom.advanced.toggleAllSites.checked = false;
                    }

                    this.settings.advanced.sites.input.value = this.writeSiteIDs(activeSites.length > 0 ? activeSites : this.sites);
                });
            });

            this.settings.advanced.sites.input.value = this.writeSiteIDs(activeSites);
            this.setUrlParam('query', this.generateQuery(activeSites));

            this.dom.advanced.button.addEventListener('click', (event) => {
                event.preventDefault();
                if (this.dom.advanced.container.classList.contains('expanded')) {
                    this.dom.advanced.button.innerText = this.settings.advanced.button.openText || 'Show Advanced';
                    this.dom.advanced.container.classList.remove('expanded');
                } else {
                    this.dom.advanced.button.innerText = this.settings.advanced.button.closeText || 'Hide Advanced';
                    this.dom.advanced.container.classList.add('expanded');
                }
            });

            this.dom.advanced.toggleAllSites.addEventListener('click', (event) => {
                this.settings.advanced.sites.checkboxes.forEach((checkbox) => {
                    const isChecked = event.target.checked;
                    activeSites = [];
                    for (const site of this.sites) {
                        checkbox.checked = isChecked;
                        if (isChecked) {
                            activeSites.push(site);
                        }
                    }

                    this.settings.advanced.sites.input.value = this.writeSiteIDs(activeSites.length > 0 ? activeSites : this.sites);
                });
            });
        } else {
            this.setUrlParam('query', this.generateQuery(this.sites));
        }

        window.addEventListener('load', (event) => {
            if (this.getUrlParam('query')) {
                this.fetchData();
                this.dom.nav.classList.remove('dac-hidden');
            }
        });
    }

    fetchData() {
        this.dom.spinner.classList.remove('dac-hidden');
        this.searchHandler.read().then((result) => {
            this.insertArticles(result);
        });
    }

    insertArticles(result) {
        const container = document.querySelector(this.settings.selector);
        const fragment = new DocumentFragment();
        for (const item of result.markups) {
            const div = document.createElement('div');
            div.innerHTML = item;
            fragment.appendChild(div.firstChild);
        }
        container.appendChild(fragment);
        this.searchSettings.count = result.count;
        this.searchSettings.totalCount = this.getUrlParam('start') + result.count;
        if (result.totalCount <= this.searchSettings.totalCount) {
            this.disablePager();
        }
        this.dom.spinner.classList.add('dac-hidden');
        this.updatePager();
        if (result.count === 0) {
            this.displayNohits();
        }
    }

    readSiteIDs(string = '') {
        return string
            .split(',')
            .filter((id) => id !== '')
            .map((id) => parseInt(id, 10)) || [];
    }

    writeSiteIDs(sites) {
        const output = [];

        sites.forEach((site) => {
            output.push(site.id);
        });

        return output.join(',');
    }

    generateQuery(sites) {
        let query = this.getUrlParam('query');
        if (query) {
            const specialCharacters = ['-', '\\\\&&', '\\\\||', '!', '(', ')', '"', '~', '*', '\?', ':', '+'];
            const regex = new RegExp(`[${  specialCharacters.join('')  }]`, 'g');
            query = query.replace(regex, ' ').trim();
            if (query) {
                return `${ query.replace(regex, ' ') } AND lab_site_id:(${ sites.map((site) => site.id).join(' OR ') })`;
            }
        }
        return undefined;
    }

    updatePager() {
        if (!this.searchSettings.canPage) {
            return;
        }
        this.dom.nextEl.classList.remove('disabled');
        const start = this.getUrlParam('start');
        if (this.settings.isEditor) {
            this.dom.nextEl.setAttribute('href', '#');
        } else {
            this.dom.nextEl.setAttribute('href', this.getUrlParams({ start: start + this.searchSettings.count }));
        }
    }

    getUrlParam(key) {
        return this.urlParams[key];
    }

    setUrlParam(key, value) {
        this.urlParams[key] = value;
    }

    getUrl() {
        const args = Object.keys(this.urlParams).map((key) => `${ key }=${ this.urlParams[key] }`).join('&');
        return `${ this.baseUrl }?${ args }`;
    }

    getUrlParams(override = {}) {
        const args = Object.keys(this.urlParams).map((key) => `${ key }=${ override[key] !== undefined ? override[key] : this.urlParams[key] }`).join('&');
        return `?${ args }`;
    }

    nextPage() {
        this.setUrlParam('start', this.getUrlParam('start') + this.searchSettings.count);
        this.searchHandler.updateUrl(this.getUrl());
        this.fetchData();
    }

    disablePager() {
        this.searchSettings.canPage = false;
        this.dom.nextEl.classList.add('disabled');
    }

    displayNohits() {
        const el = document.createElement('div');
        el.innerHTML = this.nohitsLabel;
        el.classList.add('nohitsLabel');
        this.dom.container.querySelector('.labclient-content').appendChild(el);
    }

}
