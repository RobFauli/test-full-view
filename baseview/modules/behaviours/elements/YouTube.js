export default class YouTube {

    constructor(api) {
        this.api = api;
        this.isEditor = this.api.v1.app.mode.isEditor();
    }

    onRender(model, view) {

        // Display caption on article-pages:
        let displayCaption = this.api.v1.model.root.getType() === 'page_article';
        if (this.api.v1.app.mode.isFront() && !view.get('fields.caption')) {
            displayCaption = false;
        }
        model.setFiltered('displayCaption', displayCaption);

        if (!this.api.v1.app.mode.isEditor() && this.api.v1.config.get('cookieConsent.enabled') === true) {
            const cookieConsentConfig = this.api.v1.config.get('cookieConsent');
            const youtubeConsent = cookieConsentConfig.contentboxes.filter((box) => box.name === 'youtube')[0];

            if (youtubeConsent) {
                model.setFiltered('requiredCookieConsent', youtubeConsent.requiredConsent || false);
                model.setFiltered('insufficientConsentMessage', youtubeConsent.insufficientConsentMessage || this.api.v1.config.get('cookieConsent.insufficientConsentMessage') || '');
            }
        }

        const params = [];
        const startPoint = model.get('fields.video_start');
        const endPoint = model.get('fields.video_end');
        if (startPoint) params.push(`start=${  Math.round(startPoint) }`);
        if (endPoint) params.push(`end=${  Math.round(endPoint) }`);
        if (!params.length) return;
        model.setFiltered('startstop', `?${  params.join('&') }`);
    }

    onRendered(model, view) {
        if (this.isEditor) {
            // The iframe from youtube.com/embed captures events on the element of the iframe disabling drag/drop in the editor.
            // Disable pointer-events when hovering the drag-handle.
            const iframe = view.getMarkup().querySelector('iframe');
            const dragHandle = view.getMarkup().querySelector('.youtube-drag-handle');
            if (iframe && dragHandle) {
                dragHandle.addEventListener('mouseenter', (event) => { iframe.style.pointerEvents = 'none'; }, false);
                dragHandle.addEventListener('mouseleave', (event) => { iframe.style.pointerEvents = ''; }, false);
            }
        }
    }

}
