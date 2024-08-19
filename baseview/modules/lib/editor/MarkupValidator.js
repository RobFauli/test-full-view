export class MarkupValidator {

    /**
     * Fix missing end-tags etc. by inserting markup into a template and read out the (fixed) result.
     * @param {String} input The markup to validate
     * @returns {Promise<String|Error>} The validated, fixed markup
     */
    validate(input = '')  {
        return new Promise((resolve, reject) => {
            try {
                // Use a template creating a DocumentFragment.
                // This prevents the client from rendering any markup (including loading scripts)
                // until the element actually is inserted into the DOM.
                // If scripts are loaded they may modify the markup.
                const tmpEl = document.createElement('template');
                tmpEl.innerHTML = input.trim();
                resolve(tmpEl.innerHTML.trim());
            } catch (error) {
                reject(error);
            }
        });
    }

    // (array)
    createElements(markup) {
        const fragment = document.createRange().createContextualFragment(markup);
        return [...fragment.children];
    }

}
