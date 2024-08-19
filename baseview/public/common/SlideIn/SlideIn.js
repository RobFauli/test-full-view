
class SlideIn {

    /**
     * 
     * @param {NodeList} elements Dom-elements to slide in
     */
    constructor(elements) {
        this.observer = this.getObserver(this.observerCallback.bind(this));
        if (!this.observer) {
            return;
        }
        for (const element of elements) {
            this.registerElement(element);
        }
    }

    registerElement(element) {
        element.classList.add('slidein', 'slidein-out');
        this.observer.observe(element);
    }

    observerCallback(entries, observer) {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.remove('slidein-out');
                this.observer.unobserve(entry.target);
            }
        }     
    }

    /**
     * Create and return a new IntersectionObserver
     * @param {function} callback 
     * @returns Instance of IntersectionObserver
     */
    getObserver(callback) {
        if (!'IntersectionObserver' in window) {
            // Feature not supported in client.
            return null;
        }
        var options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.4
        };
        return new IntersectionObserver(callback, options);
    }

}
