/**
 * ReadProgress
 * Visually indicate remaining length of an article
 * Input:
 * - progressElement (dom-element) Element to display reader progress with
 * - options
 *   - targetSelectors (array) List of selectors. Children of these elements are used to measure progress.
 *   - minElementCount (int) Minimum number of elements required to use this functionality.
 *   - debug (bool) If true the class will print debug-info to the console. If false, only warnings are printed.
 */

window.Dac = window.Dac || {};
window.Dac.ReadProgress = class {

    constructor(progressElement, options) {
        this.debug = !!options.debug;
        this.log('Creating instance ...');
        this.progressElement = progressElement;
        let elements = [];
        for (const target of (options.targetSelectors || [])) {
            const targetElement = document.querySelector(target);
            if (targetElement) {
                elements = elements.concat(Array.from(targetElement.children).filter((el) => !el.classList.contains('column')));
            } else {
                this.log(`Cannot find element for selector "${ target }"`, true);
            }
        }
        if (!elements.length) {
            this.log(`No elements found. Cannot measure reading-progress`, true);
            return;
        }
        const minElementCount = parseInt(options.minElementCount || 25, 10);
        if (elements.length < minElementCount) {
            this.log(`Number of elements (${ elements.length }) is below required count (${ minElementCount }). Skipping.`);
            return;
        }
        let index = 0;
        this.items = elements.map(el => ({
            isIntersecting: false,
            index: index++,
            element: el
        }));
        setTimeout(() => {
            this.observeElements(elements);
            this.progressElement.classList.remove('dac-hidden');
        }, 1000);
    }

    log(msg, isCritical = false) {
        if (isCritical) {
            console.warn('ReadProgress:', msg);
            return;
        }
        if (!this.debug) { return; }
        console.log('ReadProgress:', msg);
    }

    getIndex(element) {
        for (const item of this.items) {
            if (item.element === element) {
                return item.index;
            }
        }
        return null;
    }

    observeElements(items) {
        this.log(`Will register IntersectionObserver for ${ items.length } elements.`);
        const options = {
            // root: root,
            rootMargin: '0px',
            threshold: [0.5]
            // threshold: [0, 0.25, 0.5, 0.75, 1]
        };
        let needUpdate = false;
        const observer = new IntersectionObserver((entries, theObserver) => {
            for (const entry of entries) {
                const index = this.getIndex(entry.target);
                if (this.items[index].isIntersecting !== entry.isIntersecting) {
                    this.items[index].isIntersecting = entry.isIntersecting;
                    needUpdate = true;
                }
            }
            if (needUpdate) {
                this.updateGui();
            }
        }, options);
        for (const item of items) {
            observer.observe(item);
        }
    }

    // Update nav-elements based on visibility of first / last item
    updateGui() {
        const itemCount = this.items.length;
        let firstVisible = -1;
        let firstInvisible = -1;
        for (const item of this.items) {
            const index = this.items.indexOf(item);
            if (firstVisible === -1 && item.isIntersecting) {
                firstVisible = index;
            }
            if (firstInvisible === -1 && firstVisible > -1 && !item.isIntersecting) {
                firstInvisible = index;
                this.updateGuiByRange(firstVisible, firstInvisible, itemCount);
                return;
            }
        }
    }

    updateGuiByRange(start, end, count) {
        const endIndex = (end > -1 ? end : count) + 1;
        const percent = Number((endIndex / count).toFixed(2));
        this.log(`Found progress-value of ${ percent }. Start-index: ${ start }, end-index: ${ endIndex }. Will update GUI.`);
        this.progressElement.style.transform = (`scaleX(${ percent })`);
    }

}
