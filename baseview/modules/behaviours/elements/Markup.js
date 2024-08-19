import { Movable } from '../../lib/helpers/Movable.js';
import { MarkupValidator } from '../../lib/editor/MarkupValidator.js';

export default class Markup {

    constructor(api) {
        this.api = api;
        this.validation = {
            suggestedMarkup: null,
            isUnvalid: false,
            error: ''
        };
    }

    // (void) Element is about to be rendered.
    // All data and parent/child-relationships are ready.
    onRender(model, view) {
        if (view.get('metadata.movableContent')) {
            model.setFiltered('movableStyle', Movable.createStyle(model, 'metadata.contentPosition', ['desktop', 'mobile']));
        }

        if (!this.api.v1.app.mode.isEditor() && this.api.v1.config.get('cookieConsent.enabled') === true) {
            model.setFiltered('requiredCookieConsent', view.get('metadata.requiredCookieConsent') || false);

            // Escape closing script tags
            let markup = view.get('fields.markup');
            markup = markup.replace(/<\/script>/g, '<\\/script>');
            model.setFiltered('markup_escaped', markup);
        }
    }

    // When opening the settings-panel to insert HTML:
    // - Focus the input element
    // - Allow tab-key to insert 4 spaces instead of setting focus to the next dom-element
    onSettingsPanel(model, view, settings) {
        return {
            onDisplay: (params) => {
                const textarea = params.markup.querySelector('textarea');
                if (!textarea) { return; }
                const doValidateBtn = params.markup.querySelector('input[name="doValidate"]');
                if (doValidateBtn) {
                    doValidateBtn.addEventListener('change', (event) => {
                        model.set('fields.skipValidation', event.target.checked ? null : true);
                    }, false);
                    doValidateBtn.checked = !model.get('fields.skipValidation');
                }
                textarea.value = view.get('fields.markup');
                if (this.validation.suggestedMarkup) {
                    textarea.value = this.validation.suggestedMarkup;
                    const msg = document.createElement('p');
                    if (this.validation.isUnvalid) {
                        msg.innerHTML = `<span style="color: red;">Markup is invalid. Please correct the markup and try again.</span><br>${ this.validation.error }`;
                    } else {
                        msg.innerHTML = 'Validator has modified markup. Please review the suggested markup below.';
                    }
                    textarea.before(msg);
                    this.validation.suggestedMarkup = null;
                    this.validation.isUnvalid = false;
                    this.validation.error = '';
                }
                params.markup.querySelector('textarea').focus();
                textarea.addEventListener('keydown', (event) => {
                    if (event.key === 'Tab') {
                        event.preventDefault();
                        const [start, end] = [textarea.selectionStart, textarea.selectionEnd];
                        textarea.setRangeText('    ', start, end, 'end');
                    }
                }, false);
            },
            onSubmit: ({
                model, view, config, markup, modal, formValues
            }) => {
                if (!formValues.doValidate) {
                    view.set('fields.markup', formValues['fields.markup']);
                    return;
                }
                const markupValidator = new MarkupValidator();
                markupValidator.validate(formValues['fields.markup']).then((validatedMarkup) => {
                    if (formValues['fields.markup'].trim() !== validatedMarkup) {
                        // Validator has modified markup
                        this.validation.suggestedMarkup = validatedMarkup;
                        this.validation.isUnvalid = false;
                        const panelConfig = { ...config };
                        panelConfig.defaultButtons = false;
                        panelConfig.container.state.warning = true;
                        this.api.v1.ui.modal.panel(model, view, panelConfig);
                        return;
                    }
                    view.set('fields.markup', validatedMarkup);
                }).catch((error) => {
                    this.validation.suggestedMarkup = formValues['fields.markup'];
                    this.validation.isUnvalid = true;
                    this.validation.error = error.message;
                    const panelConfig = { ...config };
                    panelConfig.defaultButtons = false;
                    panelConfig.container.state.error = true;
                    this.api.v1.ui.modal.panel(model, view, panelConfig);
                });
            }
        };
    }

}
