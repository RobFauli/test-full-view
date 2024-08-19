import { Paywall } from '../../lib/helpers/Paywall.js';

export default class Bodytext {

    constructor(api) {
        this.api = api;
        this.isFront = this.api.v1.app.mode.isFront();
        this.internal = this.api.v1.properties.get('paywall') || {};
        const config = this.api.v1.config.get('paywall') || {};
        this.provider = config.provider || 'internal';
        // View can disable displaying buildt-in paywall in config: { paywall: { displaySalesPosters: false, ... } }
        // Useful for providers rendering the salesposters client-side
        this.displaySalesPosters = config.displaySalesPosters !== false;
    }

    onRender(model, view) {
        const paywall = {
            displaySalesPosters: this.displaySalesPosters,
            isInternal: this.provider === 'internal' && this.internal.active,
            active: this.isFront && (this.provider === 'internal' ? this.internal.active : !!model.get('fields.paywall')),
            access: this.provider === 'internal' && this.internal.active ? this.internal.hasAccess : false,
            provider: this.provider,
            intro: this.provider !== 'internal' ? Paywall.filterBodytext(model, view) : undefined,
            bodytext: this.provider !== 'internal' ? model.get('filtered.bodytext') : undefined
        };
        if (paywall.active && !paywall.access) {
            if (this.provider === 'internal') {
                model.setFiltered('bodytext', Paywall.filterBodytext(model, view));
            } else {
                model.setFiltered('bodytext', '');
            }
        }
        model.setFiltered('paywall', paywall);
    }

    onRendered(model, view) {
        // Editor: Add an empty paragraph at the end of the bodytext if there is none.
        if (!this.isFront) {
            const markup = view.getMarkup();
            if (markup.children.length && markup.children[markup.children.length - 1].tagName !== 'P') {
                const p = document.createElement('p');
                markup.appendChild(p);
            }
            this.markCustomIndex(model.getPersistentChildren());
        }
    }

    // Baseview is configured to allow custom placement per viewport in bodytext.
    // If user has moved an element to a new placement in a secondary viewport, mark it with an icon.
    // A click on the icon will reset the position.
    markCustomIndex(children) {
        for (const child of children) {
            const raw = child.getRaw('metadata.bodyTextIndex') || {};
            if (Object.values(raw.vp || {}).filter((value) => Number.isInteger(value)).length > 1) {
                this.markCustomIndexForModel(child);
            }
        }
    }

    markCustomIndexForModel(model) {
        for (const viewport of this.api.v1.viewport.getActive()) {
            const view = this.api.v1.view.getView(model, viewport);
            if (!view.getExtraElement('customIndexElement')) {
                const el = view.setExtraElement('customIndexElement', this.getCustomIndexElement(model, view));
                view.getMarkup().appendChild(el);
            }
        }
    }

    getCustomIndexElement(model, view) {
        const el = document.createElement('span');
        const callback = (event) => {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            this.removeCustomIndexElement(model);
            if (model.getParent()) {
                this.api.v1.model.addToRedrawQueue(model.getParent());
            }
            model.set('metadata.bodyTextIndex', undefined, { viewport: 'mobile' });
            this.api.v1.viewport.align(model, view);
        };
        el.addEventListener('click', callback, false);
        el.classList.add('labicon-line_index', 'is-customindex');
        el.setAttribute('title', `${ model.getType() } has custom placement. Click to remove on mobile`);
        const bindingHandler = (theModel, key, path) => {
            if (theModel.getParent() && theModel.getParent().getType() !== 'bodytext') {
                callback();
                el.remove();
                this.api.v1.model.bindings.unbind(model, 'path', bindingHandler);
            }
        };
        this.api.v1.model.bindings.bind(model, 'path', bindingHandler);
        return el;
    }

    removeCustomIndexElement(model) {
        for (const view of this.api.v1.view.getViews(model)) {
            view.unsetExtraElement('customIndexElement');
        }
    }

}
