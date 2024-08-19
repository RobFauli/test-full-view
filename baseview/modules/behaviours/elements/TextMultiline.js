export default class TextMultiline {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {

        const textCentered = view.get('metadata.text_align') === 'center';
        model.setFiltered('textCentered', textCentered);
    }

}
