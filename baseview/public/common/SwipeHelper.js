/**
 * SwipeHelper
 * Acts on a container displaying items overflowing horizontally or vertically.
 * User can swipe / scroll normally or use click-handlers delivered by this class.
 */

if (!window.Dac) window.Dac = {}
var Dac = window.Dac;
Dac.SwipeHelper = class {

    constructor(container, options) {
        this.debug = window.location.toString().includes('debug=');
        this.log('Creating instance ...');
        this.settings = {
            isHorizontal: options.isHorizontal,
            css: {
                hidden: 'nav-hidden'
            },
            navWidth: 0,
            preloadNextImage: !!options.preloadNextImage,
            intersectionObserver: {
                threshold: 0.5
            }
        };
        const navItems = options.navItemsSelector ? container.querySelector(options.navItemsSelector) : null;
        const previewItems = options.previewItemsSelector ? container.querySelector(options.previewItemsSelector) : null;
        this.elements = {
            nav: {
                forward: container.querySelector(options.navItems.forwardSelector),
                backward: container.querySelector(options.navItems.backwardSelector)
            },
            itemsContainer: container.querySelector(options.itemsContainerSelector),
            items: container.querySelectorAll(options.itemsSelector),
            navItems: navItems ? [...navItems.children] : null,
            previewItems: previewItems ? [...previewItems.children] : null
        }
        if (
            !this.validateElement(this.elements.itemsContainer) ||
            !this.validateElement(this.elements.items)
        ) {
            this.log('Missing required dom-element(s).', true);
            return;
        }
        if (this.elements.items.length < 2) {
            this.log('To few elements. No need for the helper.', true);
            return;
        }
        this.items = [...this.elements.items].map(el => ({ visible: false, element: el }));
        this.index = null;
        this.observeElements(this.elements.itemsContainer, this.elements.items);
        this.setupNavigation();
        this.autoScrollInterval = null;
        this.autoScroll = options.autoScroll;
        this.elementWidth = this.items[0].element.scrollWidth;
        this.currentLeft = 0;
        this.isAutoscrolling = false;
        this.preloadedIndexes = [];
        this.registerAutoscroll();
    }

    log(msg, isCritical = false) {
        if (isCritical) {
            console.warn('[SwipeHelper]', msg);
        }
        if (!this.debug) { return; }
        console.log('[SwipeHelper]', msg);
    }

    // NodeList or element
    validateElement(element) {
        return element && (element.length || element.nodeType === 1);
    }

    // Only use autoscrolling when element is visible
    registerAutoscroll() {
        if (!this.autoScroll || !this.autoScroll.enabled) {
            return;
        }
        if (!this.autoScroll.interval) {
            this.autoScroll.interval = 4000;
        }
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0
        };
        const observer = new IntersectionObserver((entries, theObserver) => {
            if (entries[0].isIntersecting) {
                this.startAutoScroll();
            } else {
                this.stopAutoScroll();
            }
        }, options);
        observer.observe(this.elements.itemsContainer);
    }

    startAutoScroll() {
        if (this.isAutoscrolling) {
            return;
        }
        this.isAutoscrolling = true;
        this.log('Starting autoscroll ...');

        this.autoScrollInterval = setInterval(() => {
            this.autoScroll.scrolling = true;

            if (this.autoScroll.reset) {
                this.elements.itemsContainer.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
                this.autoScroll.reset = false;
            } else {
                this.elements.itemsContainer.scrollTo({
                    top: 0,
                    left: this.elements.itemsContainer.scrollLeft + this.elementWidth,
                    behavior: 'smooth'
                });
            }
            setTimeout(() => {
                this.autoScroll.scrolling = false;
            }, 1000);
        }, parseInt(this.autoScroll.interval));
        
        const scrolled = () => {
            if (!this.autoScroll.scrolling) {
                this.log('Will disable autoscroll');
                this.stopAutoScroll();
                this.elements.itemsContainer.removeEventListener('scroll', scrolled);
            }
        };

        this.elements.itemsContainer.addEventListener('scroll', scrolled);
    }

    stopAutoScroll() {
        if (!this.isAutoscrolling) {
            return;
        }
        this.log('Stopping autoscroll ...');
        clearInterval(this.autoScrollInterval);
        this.autoScrollInterval = null;
        this.isAutoscrolling = false;
    }

    setupNavigation() {
        if(this.elements.nav.forward && this.elements.nav.backward) {
            this.log(`Will register events for navigation.`);
            this.settings.navWidth = this.elements.nav.backward.offsetWidth;
            this.elements.nav.backward.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.navigate(-1);
            }, false);
            this.elements.nav.forward.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.navigate(1);
            }, false);
        }
        if (this.elements.navItems) {
            for (const item of this.elements.navItems) {
                const index = this.elements.navItems.indexOf(item);
                item.addEventListener('click', (event) => {
                    this.navigateToIndex(index, 'auto');
                }, false);
            }
        }
        if (this.elements.previewItems) {
            for (const item of this.elements.previewItems) {
                const index = this.elements.previewItems.indexOf(item);
                item.addEventListener('click', (event) => {
                    this.navigateToIndex(index, 'auto');
                }, false);
            }
        }
    }

    navigateToIndex(index, behavior) {
        this.log(`Navigate to index: ${ index }`);
        if (!this.items[index]) {
            return;
        }
        this.navigateToItem(this.items[index], behavior);
    }

    navigate(steps) {
        const visibleItems = this.items.filter(itm => itm.visible);
        if (!visibleItems.length) {
            this.log('Cannot navigate. Did not find any visible items ...', true);
            return;
        }
        // Calculate index based on the first visible item:
        let index = this.items.indexOf(visibleItems.shift()) + steps;
        if (index >= 0 && index < this.items.length) {
            this.navigateToItem(this.items[index]);
        }
    }

    navigateToItem(item, behavior = 'smooth') {
        if (this.settings.isHorizontal) {
            const leftPos = Math.max(0, item.element.offsetLeft - this.settings.navWidth);
            this.elements.itemsContainer.scrollTo({
                top: 0,
                left: leftPos,
                behavior
            });
        } else {
            this.elements.itemsContainer.scrollTo({
                top: item.element.offsetTop,
                left: 0,
                behavior
            });
        }
    }

    observeElements(root, items) {
        this.log(`Will register IntersectionObserver`);
        const options = {
            root: root,
            rootMargin: '0px',
            threshold: this.settings.intersectionObserver.threshold
        };
        const observer = new IntersectionObserver((entries, theObserver) => {
            const touchedIndexes = [];
            let visibleIndex = null;
            for (const entry of entries) {
                const index = Array.from(entry.target.parentNode.children).indexOf(entry.target);
                this.items[index].visible = entry.isIntersecting;
                touchedIndexes.push(index);
                if (this.items[index].visible) {
                    visibleIndex = index;
                }
                if (this.settings.preloadNextImage && entry.isIntersecting && this.items[index+1] && !this.preloadedIndexes.includes(index+1)) {
                    this.preloadAtIndex(index+1);
                }
                this.log(`IntersectionObserver triggered at index ${ index }. Setting visibility to ${ this.items[index].visible }.`);
            }
            if (visibleIndex !== null) {
                this.updateNavItems(visibleIndex);
            }
            if (touchedIndexes.includes(0) || touchedIndexes.includes(this.items.length - 1)) {
                this.updateGui();
                if (this.autoScroll && this.autoScroll.enabled && this.items[this.items.length - 1].visible) {
                    this.autoScroll.reset = true;
                }
            }
        }, options);
        for (const item of items) {
            observer.observe(item);
        }
    }

    // Remove "loading"-attribute to force browser to load image.
    preloadAtIndex(index) {
        this.preloadedIndexes.push(index);
        if (!this.items[index] || !this.items[index].element) { return; }
        const img = this.items[index].element.querySelector('img');
        if (img) {
            this.log(`Will preload image at index ${ index }`);
            img.removeAttribute('loading');
        }
    }

    // Update nav-elements based on visibility of first / last item
    updateGui() {
        if (this.elements.nav.forward && this.elements.nav.backward) {
            this.log('Updating navigation-GUI ...');
            if (this.items[0].visible) {
                this.elements.nav.backward.classList.add(this.settings.css.hidden);
            } else {
                this.elements.nav.backward.classList.remove(this.settings.css.hidden);
            }
            if (this.items[this.items.length - 1].visible) {
                this.elements.nav.forward.classList.add(this.settings.css.hidden);
            } else {
                this.elements.nav.forward.classList.remove(this.settings.css.hidden);
            }
        }
    }

    updateNavItems(index) {
        const selector = 'selected';
        if (this.elements.navItems) {
            if (this.elements.navItems[this.index]) {
                this.elements.navItems[this.index].classList.remove(selector);
            }
            if (this.elements.navItems[index]) {
                this.elements.navItems[index].classList.add(selector);
            }
        }
        if (this.elements.previewItems) {
            if (this.elements.previewItems[this.index]) {
                this.elements.previewItems[this.index].classList.remove(selector);
            }
            if (this.elements.previewItems[index]) {
                this.elements.previewItems[index].classList.add(selector);
            }
        }
        this.index = index;
    }

}
