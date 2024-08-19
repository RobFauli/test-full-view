window.Dac = window.Dac || {};
window.Dac.ArticleLists = class {

    constructor(params) {
        this.sources = params.sources;
        this.container = params.container;
        this.settings = params.settings;
        this.elements = {
            nav: {},
            tabs: {}
        };
        this.setupNav();
        const selectedSource = this.sources.filter((source) => !!source.selected).pop() || this.sources[0];

        if (selectedSource) {
            this.displaySource(selectedSource);
        }
    }

    setupNav() {
        for (const source of this.sources) {
            const el = this.container.querySelector(`nav li[data-name="${ source.name }"]`);
            const tab = this.container.querySelector(`ul[data-name="${ source.name }"]`);
            if (el) {
                this.elements.nav[source.name] = el;
                this.elements.tabs[source.name] = tab;
                if (source.noImage) {
                    tab.classList.add('noimage');
                }
                el.addEventListener('click', (event) => {
                    this.displaySource(source);
                }, false);
            }
        }
    }

    updateDom(source) {
        for (const name of Object.keys(this.elements.nav)) {
            if (name === source.name) {
                this.elements.nav[name].classList.add('selected');
            } else {
                this.elements.nav[name].classList.remove('selected');
            }
        }
        for (const name of Object.keys(this.elements.tabs)) {
            if (name === source.name) {
                this.elements.tabs[name].classList.remove('dac-hidden');
            } else {
                this.elements.tabs[name].classList.add('dac-hidden');
            }
        }
    }

    displaySource(source) {
        this.updateDom(source);
        this.fetchSource(source, (data) => {
            this.drawSource(this.filterData(data, source), source, this.elements.tabs[source.name]);
        }, (error) => {
            console.warn(`[ArticleLists] Failed to draw source: "${ source.name }". Error: ${ error }.`);
        });
    }

    drawSource(data, source, element) {
        element.innerHTML = '';
        if (!data.length) {
            element.classList.add('error');
        }
        if (!source.order.includes('image')) {
            this.elements.tabs[source.name].classList.add('noimage');
        }
        let markup = '';
        for (const item of data) {
            markup += this.drawItem(item, source);
        }
        element.innerHTML = markup;
    }

    drawItem(item, source) {
        const target = source.target ? ` target="${ source.target }"` : '';
        const elements = {
            image: item.image ? `<figure><img src="${ item.image }"></figure>` : '',
            kicker: item.kicker ? `<div class="kicker">${ item.kicker }</div>` : '',
            title: item.title ? `<h4>${ item.title }</h4>` : '',
            subtitle: item.subtitle ? `<p class="subtitle">${ item.subtitle }</p>` : ''
        }
        return `<li><a href="${ item.url }"${ target }>${ source.order.map((element) => elements[element] || '').join('') }</a></li>`
    }

    filterData(data, source) {
        if (!data) {
            console.warn(`[ArticleLists] No data reseived for source: "${ source.name }". No articles displayed.`);
            return [];
        }
        if (source.editorValueTransformer && typeof (data[source.editorValueTransformer.input] === 'string')) {
            try {
                data[source.editorValueTransformer.output] = JSON.parse(data[source.editorValueTransformer.input])[source.editorValueTransformer.output];
            } catch (error) {
                console.warn(`[ArticleLists]: Cannot parse json-string for source "${ source.name }".`, error);
            }
        }
        switch (source.name) {
            case 'most_read':
                return this.filterMostRead(data, source);
            case 'most_commented': 
                return this.filterMostCommented(data, source);
            case 'latest': 
                return this.filterLatest(data, source);
            default:
                console.warn(`[ArticleLists] Unsupported source: "${ source.name }". No articles displayed.`);
                return [];
        }
    }

    // Kilkaya
    filterMostRead(data, source) {
        return data.data.map((item) => ({
            title: item.fields.title,
            subtitle: item.fields.description,
            url: item.fields.srcUrl,
            image: item.fields.image
        }));        
    }

    // Disqus
    filterMostCommented(data, source) {
        return data.response.map((item) => ({
            title: item.title,
            url: item.link
        }));        
    }

    // Labrador API
    filterLatest(data, source) {
        return data.result.map((item) => ({
            title: item.teaserTitle || item.title,
            subtitle: item.teaserSubtitle || item.subtitle,
            kicker: item.kicker,
            url: item.published_url,
            image: item.image ? `${ this.settings.image_server }?imageId=${ item.image }&width=411&height=300`: null
        }));        
    }

    fetchSource(source, okCallback, errCallback) {
        fetch(source.url)
            .then(response => response.json())
            .then(data => okCallback(data))
            .catch((err) => errCallback(err))
    }

};
