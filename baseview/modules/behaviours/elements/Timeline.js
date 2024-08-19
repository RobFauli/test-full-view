export default class Timeline {

    constructor(api) {
        this.api = api;
        this.isEditor = this.api.v1.app.mode.isEditor();
        if (this.isEditor) {
            this.api.v1.ns.set('timeline.insertItem', (model, view, menuItem, params) => {
                this.addItem(model);
            });
        }
    }

    /**
     * Helper-functions for timeline
     */

    addItem(model) {
        const d = new Date();
        const child = this.api.v1.model.create.view({
            type: 'timelineItem',
            contentdata: {
                fields: {
                    date: `${ (d.getHours() < 10 ? '0' : '') + d.getHours() }.${ (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() }`
                }
            }
        });
        this.api.v1.model.prependChild(model, child);
    }

}
