if (!window.Dac) window.Dac = {};

/**
 * Manager which toggles a value for an attribute.
 * 
 * @class
 */
window.Dac.ElementAttributeToggler = class {

    /**
     * Constructs a new {@link ElementAttributeToggler} with the appropriate options.
     * 
     * @param {Object} options - Options object passed to the constructor.
     * @param {Object[]} options.selectors - Array containing selectors and elements to toggle.
     * @param {string} options.selectors[].elementToToggle - Element which will have an attribute toggled.
     * @param {string} options.selectors[].toggleActivator - Element to click in order to trigger a toggle on "elementToToggle".
     * @param {Object} options.selectors[].attributes - Object containing the attributes to toggle.
     */
    constructor(options = { selectors: [] }) {
        this.validate(options);
        this.options = options;
        this.selectors = this.getSelectorsElements();
        this.setup();
    }

    /**
     * Sets up the listeners on all selectors specified in {@link ElementAttributeToggler#options}
     */
    setup() {
        this.selectors.forEach((selector) => {
            this.setInitialAttributes(selector);
            this.addListeners(selector);
        });
    }

    /**
     * Fetches elements defined in selectors.
     */
    getSelectorsElements() {
        return this.options.selectors.map((selector) => ({
            activators: document.querySelectorAll(selector.toggleActivator),
            elements: document.querySelectorAll(selector.elementToToggle),
            attributes: selector.attributes,
        }));
    }

    /**
     * Sets initial attributes, defined in options.
     * 
     * @param {Object} selector - Selector object.
     */
    setInitialAttributes(selector) {
        const attributes = selector.attributes;
        selector.elements.forEach((element, index) => {
            for (const key of Object.keys(attributes || {})) {
                if (attributes[key].initial) {
                    this.setAttribute(element, key, attributes[key].value);
                }
            }
        });
    }

    /**
     * Sets an attribute to a value.
     * 
     * @param {HTMLElement} element - Element to toggle on.
     * @param {string} attribute - Attribute to toggle on element.
     * @param {string} value - Value to toggle on attribute.
     */
    setAttribute(element, attribute, value) {
        switch (attribute) {
            case 'className':
                element.classList.add(value);
                break;
            default:
                element[attribute] = value;
                break;
        }
    }

    /**
     * Aquires an element based on a selector, and adds a click listener.
     * Listener will fire the segregateAttributeHandlers method.
     * 
     * @param {Object} selector - A selector object, fetched from the selectors[] in options.
     */
    addListeners(selector) {
        selector.activators.forEach((activator, index) => {
            activator.addEventListener('click', (e) => {
                e.preventDefault();
                this.segregateAttributeHandlers(selector.elements[index], selector);
            });
        });
    }

    /**
     * Segregates into different handlers for attribute type.
     * className could use a different toggle than other attributes.
     * 
     * @param {HTMLElement} element - The element to toggle.
     * @param {Object} selector - The element to
     */
    segregateAttributeHandlers(element, selector) {
        const attributes = selector.attributes;
        for (const key of Object.keys(attributes || {})) {
            switch (key) {
                case 'className':
                    this.toggleClassName(element, attributes[key].value);
                    break;
                default:
                    this.toggleAnyAttribute(element, attributes[key].value, key);
                    break;
            }
        }
    }

    /**
     * Toggles a {@param className} on a specified {@param element}.
     * 
     * @param {HTMLElement} element - The element in which className should be toggled. 
     * @param {string} className - A string which represents the className to be toggled. 
     */
    toggleClassName(element, className) {
        element.classList.toggle(className);
    }

    /**
     * Toggles an {@param attribute} on a specified {@param element}.
     * 
     * @param {HTMLElement} element - The element in which attribute should be toggled.
     * @param {string} attribute - The attribute-value to toggle on and off.
     * @param {string} key - The attribute key/name.
     */
    toggleAnyAttribute(element, attribute, key) {
        if (element[key] === attribute) element[key] = "";
        else element[key] = attribute;
    }

    /**
     * Validate input and throw error in case of faulty result.
     */
    validate(options) {
        if (!this.validateObject(options)) {
            console.error('ElementAttributeToggler: Options is not an object.');
            return false;
        }
        if (!this.validateArray(options.selectors)) {
            console.error('ElementAttributeToggler: Options.selectors is not an array.');
            return false;
        }
    }

    /**
     * Validate if variable is an object.
     * 
     * @param {*} variable 
     */
    validateObject(variable) {
        return typeof variable === 'object' && variable !== null;
    }

    /**
     * Validate if variable is an array.
     * 
     * @param {*} variable 
     */
    validateArray(variable) {
        return Array.isArray(variable);
    }
}