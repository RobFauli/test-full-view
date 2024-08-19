import { Movable } from '../../lib/helpers/Movable.js';

export default class Markup {

    constructor(api) {
        this.api = api;
        this.isEditor = this.api.v1.app.mode.isEditor();
    }

    onInserted(model) {
        const dateString = model.get('metadata.visibleAfterDate');
        if (dateString) {
            const date = this.stringToDate(dateString);
            if (date) {
                const now = new Date().getTime();
                if (date.getTime() > now) {
                    if (!this.api.v1.app.mode.isEditor()) {
                        Sys.logger.debug(`[Baseview] The path 'metadata.visibleAfterDate' ('${ dateString }') has prevented the row '${ model.getPositionedPath() }' from rendering`);
                        this.api.v1.model.noRender(model);
                    }
                }
            }
        }
    }

    onRender(model, view) {
        if (view.get('metadata.movableContent')) {
            model.setFiltered('movableStyle', Movable.createStyle(model, 'metadata.contentPosition', ['desktop', 'mobile']));
        }

        const dateString = model.get('metadata.visibleAfterDate');
        if (dateString) {
            const date = this.stringToDate(dateString);
            if (date) {
                const now = new Date().getTime();
                if (date.getTime() > now) {
                    if (this.api.v1.app.mode.isEditor()) {
                        view.addCssStates(['hidden-on-front', 'has-date-restriction']);
                    }
                }
                if (this.isEditor) {
                    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                    model.setFiltered('visibleAfterDate', date.toISOString().slice(0, 16));
                }
            }
        }
    }

    onSettingsPanel() {
        return {
            onSubmit: ({
                model, formValues
            }) => {
                for (const view of this.api.v1.view.getViews(model)) {
                    view.resetCssState();
                }
                const date = this.stringToDate(formValues['metadata.visibleAfterDate']); // "2023-06-08T10:44"
                let value;
                if (date) {
                    value = date.toISOString(); // '2023-06-08T08:44:00.000Z'
                } else {
                    model.setFiltered('visibleAfterDate', null);
                    value = null;
                }
                model.set('metadata.visibleAfterDate', value);
            }
        };
    }

    stringToDate(dateString) {
        const date = new Date(dateString || '');
        if (date instanceof Date && Number.isFinite(date.getTime())) {
            return date;
        }
        return null;
    }

}
