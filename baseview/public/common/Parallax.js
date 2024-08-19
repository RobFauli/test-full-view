/**
 * Parallax - perspective and animations
 * Sticky hero etc are handled using css only
 * This class is used for manual animations
 * Only css-attributes using GPU should be used in animations
 * (c) Publish Lab AS 2020
 */

if (!window.Dac) window.Dac = {}
var Dac = window.Dac;
Dac.Parallax = class {

    constructor(item) {
        this.container = item.container;
        this.debug = item.debug;
        this.log(`Starting Parallax-instance for element "${ this.container.classList }".`);
        this.isAnimating = false;
        this.handler = this.scrollHandler.bind(this);
        this.animator = this.animate.bind(this);
        this.register(this.container);
        this.elements = item.elements;
        this.resizeTimeoutId = null;
        this.lastYPos = window.scrollY;
        this.animatedItems = [];
        this.items = this.registerItems(this.elements);
        this.decorateStaticAttributes();
    }

    registerItems(items) {        
        this.log(`Will register ${ items.length } item(s)`);
        document.body.classList.add('dac-reflow');
        const result = items.map((itm) => {
            const el = this.container.querySelector(itm.selector);
            const rect = el.getBoundingClientRect();
            return {
                index: itm.index,
                element: el,
                rect: rect,
                animations: itm.animations,
                staticAttributes: itm.staticAttributes,
                style: '', // Last applied css-style
                // Positions relative to document
                position: {
                    top: parseInt(rect.top + window.scrollY, 10),
                    bottom: parseInt(rect.bottom + window.scrollY, 10)
                }
            }
        });
        document.body.classList.remove('dac-reflow');
        return result;
    }

    reflow() {
        this.log(`Will reflow items`);
        this.items = this.registerItems(this.elements);
    }

   scrollHandler(event) {
        this.requestAnimation();
    }

    decorateStaticAttributes() {
        for (const item of this.items) {
            const styles = item.staticAttributes.map(itm => this[`handleStatic_${ itm.name }`](itm, item));
            item.element.setAttribute('style', `transform: ${ styles.join(' ') }`);
        }
    }

    getItemsByPosition(min, max) {
        return this.items.filter((itm) => {
            return itm.position.top < max && itm.position.bottom > min;
        });
    }

    // (float) Get a percent-value (from 0 to 100) describing how much of the element is visible.
    // 0 means the top of the element is at the bottom edge of the screen,
    // 50 means the element is centered vertically on screen.
    // 100 means the bottom of the element is at the top of the screen.
    // Known bug: Sticky layers will report wrong rect when reloading the page 
    // to a scroll-position where the sticky-attribute kicks in.
    getPercentScroll(item, scrollY) {
        const top = Math.max(item.position.top - window.innerHeight, 0);
        const bottom = item.position.bottom;
        const scrollElementHeight = bottom - top;
        return ((scrollY - top) / scrollElementHeight) * 100;
    }

    log(msg) {
        if (!this.debug) { return; }
        console.log('Parallax:', msg);
    }

    requestAnimation() {
        if (!this.isAnimating) {
            requestAnimationFrame(this.animator);
        }
        this.isAnimating = true;
    }

    activateAnimations() {

        this.log(`Will activate animations`);
        this.container.classList.add('parallax-js-mode');
        window.addEventListener('scroll', this.handler, false);

        // Animate now:
        this.handler();
    }

    deactivateAnimations() {
        this.log(`Will deactivate animations`);
        this.container.style.height = '';
        this.container.classList.remove('parallax-js-mode');
        window.removeEventListener('scroll', this.handler, false);
    }

    register(element) {
        const options = {
            root: null,
            rootMargin: '0px',
            // threshold: [0, 0.5, 1]
        };
        this.log(`Will register IntersectionObserver`);
        const observer = new IntersectionObserver((entries, theObserver) => {
            for (const entry of entries) {
                if (entry.target === element) {
                    this.log(`IntersectionObserver triggered. Intersecting: ${ entry.isIntersecting }, ratio: ${ entry.intersectionRatio }`);
                    if (entry.isIntersecting) {
                        this.activateAnimations();
                    } else {
                        this.deactivateAnimations();
                    }
                }
            }     
        }, options);
        observer.observe(element);

        window.addEventListener('resize', (event) => {
            this.log(`Window resized`);
            clearTimeout(this.resizeTimeoutId);
            this.resizeTimeoutId = setTimeout(() => {
                this.reflow();
            }, 300);
        });
    }

    getFloat(number, presision = 2) {
        return parseFloat(number.toFixed(presision));
    }

    getInt(number) {
        return parseInt(number, 10);
    }

    // Calculate value for this percent-value
    getCurrentValue(item, percent) {
        
        /*
        startScrollPosition:    "26"
        endScrollPosition:      "100"
        startValue:             "11"
        endValue:               "80"
        */
        
        if (percent < item.startScrollPosition) {
            return parseFloat(item.startValue)
        }
        if (percent >= item.endScrollPosition) {
            return parseFloat(item.endValue)
        }

        // Get "local" percentage.
        // Current percent value relative to range [startScrollPosition, endScrollPosition]:
        const scrollSpan = item.endScrollPosition - item.startScrollPosition;
        const localScrollPercent = (100 / scrollSpan) * (percent - item.startScrollPosition);
        
        // Get "local" value
        // Use "local" percent to get value in range [item.startValue, item.endValue]:
        const valueRange = item.endValue - item.startValue;
        const localValue = ((localScrollPercent / 100) * valueRange) + parseFloat(item.startValue);
        return localValue;
    }


    animate() {
        const items = this.getItemsByPosition(window.scrollY, window.scrollY + window.innerHeight);
        if (this.debug) {
            const animations = items.map(item => `[${ item.animations.map(animation => animation.name).join(', ') }]`);
            this.log(`Will animate ${ items.length } element(s) ${ animations.join(', ') }`);
        }
        
        // Handle items animated in the last run but not included now. Set to start or end-state
        for (const item of this.animatedItems) {
            if (!items.includes(item)) {
                this.log(`Setting start/end state for item outside range.`);
                this.animateItem(item, this.lastYPos <= window.scrollY ? 100 : 0);
                item.element.classList.remove('isAnimating')
            }
        }
        
        for (const item of items) {
            item.element.classList.add('isAnimating')
            const percent = this.getPercentScroll(item, window.scrollY);
            this.animateItem(item, percent);
        }
        // items.forEach(itm => itm.element.classList.add('isAnimating'));
        this.lastYPos = window.scrollY;
        this.isAnimating = false;
        this.animatedItems = items;
    }

    animateItem(item, percent) {
        const styles = {
            transform: [],  // Attributes of "transform". Example: ["translateX(20%)", "..."]
            filter: [],     // Attributes of "filter". Example: ["blur(20px)", "..."]
            definition: []  // Speratate css-definitions. Example: ["scale: 0.5", "..."]
        };

        for (const animation of item.animations) {
            const result = this[`handleAnimation_${ animation.name }`](animation, percent, item);
            styles[result.key].push(result.value);
        }

        if (styles.transform.length) {
            styles.definition.push(`transform: ${ styles.transform.join(' ') }`);
        }

        if (styles.filter.length) {
            styles.definition.push(`filter: ${ styles.filter.join(' ') }`);
        }

        if (styles.definition.length) {
            const style = styles.definition.join('; ');
            // Only apply a modified style:
            if (item.style !== style) {
                item.element.setAttribute('style', styles.definition.join('; '));
                item.style = style;
            }

        }
    }


    /**
     * Animation-handlers 
     */

    handleAnimation_perspective(item, percent, obj) {
        const value = this.getCurrentValue(item, percent / 100) / 100;

        return {
            key: 'transform',
            value: `translateZ(${ this.getFloat(value * 100) }px) scale(${ this.getFloat(value) })`
        };
    }

    handleAnimation_scale(item, percent, obj) {
        const value = this.getCurrentValue(item, percent) / 100;
        return {
            key: 'transform',
            value: `scale(${ this.getFloat(value, 4) })`
        };
    }

    handleAnimation_opacity(item, percent, obj) {
        const value = this.getCurrentValue(item, percent) / 100;
        return {
            key: 'definition',
            value: `opacity:${ this.getFloat(value) }`
        };
    }

    handleAnimation_rotate(item, percent, obj) {
        const value = (this.getCurrentValue(item, percent) / 100) * 360;
        return {
            key: 'transform',
            value: `rotate(${ this.getInt(value) }deg)`
        };
    }

    /**
     * Filters
     */

    // Input: [0-100], output: [0-50] (px)
    handleAnimation_blur(item, percent, obj) {
        const value = this.getCurrentValue(item, percent) / 2;
        return {
            key: 'filter',
            value: `blur(${ this.getFloat(value) }px)`
        };
    }

    // Input: [0-100], output: [0-100] (percent)
    handleAnimation_sepia(item, percent, obj) {
        const value = this.getCurrentValue(item, percent);
        return {
            key: 'filter',
            value: `sepia(${ this.getInt(value) }%)`
        };
    }

    // Input: [0-100], output: [0-100] (percent)
    handleAnimation_brightness(item, percent, obj) {
        const value = this.getCurrentValue(item, percent);
        return {
            key: 'filter',
            value: `brightness(${ this.getInt(value) }%)`
        };
    }


    /**
     * Static attribute handlers
     */

    handleStatic_perspective(item, obj) {
        const scaleValue = this.getFloat(item.value / 100);
        return {
            key: 'transform',
            value: `translateZ(${ item.value }px) scale(${ scaleValue })`
        };
    }

}
