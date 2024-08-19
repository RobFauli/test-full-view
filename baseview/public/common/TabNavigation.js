/**
 * Tabnavigation
 * Options:
 * - debug              (boolean)                   If true, actions are logged to the console
 * - canCloseTabs       (boolean)                   If true, tabs can be toggled on and off.
 * - selector           (string)                    A selector for the container holding tabs and navigation
 * - tabsSelector       (string)                    A selector that should result in a NodeList for all tabs
 * - navigationSelector (string)                    A selector that should result in a NodeList for all navigation elements
 * - defaultIndex       (int)                       Index to select in constructor
 * - onNavigate         (function(current, previous))  A callback function, which is fired when a navigator is clicked.
 */

window.Dac = window.Dac || {};
window.Dac.TabNavigation = class {

    constructor(options) {
        this.index = null;
        this.debug = !!options.debug;
        this.canCloseTabs = !!options.canCloseTabs;
        this.onNavigate = options.onNavigate || (() => {});
        this.log('Creating instance ...');
        this.elements = {
            container: null,        // Dom-element
            tabs: null,             // NodeList
            navigationItems: null   // NodeList
        };
        if (!this.setup(options)) {
            this.log('Missing required dom-elements.', true);
            return;
        }
        this.activeSelector = 'selected';
        this.setupNavigation();
        if (options.defaultIndex && !isNaN(options.defaultIndex)) {
            this.setIndex(parseInt(options.defaultIndex, 10));
        }
    }

    log(msg, isCritical = false) {
        if (isCritical) {
            console.warn('TabNavigation:', msg);
            return;
        }
        if (!this.debug) { return; }
        console.log('TabNavigation:', msg);
    }

    // (bool) Return true if required dom-elements are found, false if not.
    setup(options) {
        this.elements.container = document.querySelector(options.selector);
        if (!this.elements.container) {
            return false;
        }
        this.elements.tabs = this.elements.container.querySelectorAll(options.tabsSelector);
        this.elements.navigationItems = this.elements.container.querySelectorAll(options.navigationSelector);
        this.log(`Found ${ this.elements.tabs.length } tab-elements and ${ this.elements.navigationItems.length } navigation items.`);
        return this.elements.tabs.length > 0 && this.elements.navigationItems.length > 0;
    }

    setupNavigation() {
        this.log(`Will register events for navigation.`);
        let index = 0;
        for (const item of this.elements.navigationItems) {
            this.setupNavigationItem(item, index);
            index++;
        }
    }

    setupNavigationItem(item, index) {
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            const prevIndex = this.index;
            this.setIndex(index);
            this.onNavigate(
                this.createCallbackObject(prevIndex),
                this.createCallbackObject(this.index),
            );
        }, false);
    }

    createCallbackObject(index) {
        if (null === index) return null;
        return {
            tab: this.elements.tabs[index],
            navigator: this.elements.navigationItems[index]
        };
    }

    setIndex(index) {
        if (this.index === index) {
            if (!this.canCloseTabs) {
                this.log(`Index ${ index } already defined. No change.`);
                return;
            }
            index = null;
        }
        if (index < 0 || index >= this.elements.tabs.length) {
            this.log(`Index ${ index } is out of bounds.`, true);
            return;
        }
        this.log(`Will set index ${ index }.`);
        this.index = index;
        this.updateGui();
    }

    updateGui() {
        for (const item of this.elements.tabs) {
            item.classList.remove(this.activeSelector);
        }
        for (const item of this.elements.navigationItems) {
            item.classList.remove(this.activeSelector);
        }
        if (this.elements.tabs[this.index]) {
            this.elements.tabs[this.index].classList.add(this.activeSelector);
        }
        if (this.elements.navigationItems[this.index]) {
            this.elements.navigationItems[this.index].classList.add(this.activeSelector);
        }
    }

}
