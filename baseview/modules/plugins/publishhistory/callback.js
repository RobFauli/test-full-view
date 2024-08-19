import { PublishHistory } from './PublishHistory.js';

export default (menu, event) => {
    const model = menu.getModel();
    lab_api.v1.util.dom.addFile('css', '/view-resources/Baseview/modules/plugins/publishhistory/style.css');
    const id = model.get('instance_of');
    if (!id) {
        Sys.logger.debug('[PublishHistory] No instance-of-id found. Cannot show publish history.');
        return;
    }

    const editor = new PublishHistory(id);

    lab_api.v1.ui.modal.dialog({
        container: {
            width: 900,
            state: {
                busy: true
            }
        },
        content: {
            title: model.get('fields.title') || '[Unnamed article]',
            markup: `<div class="publishhistory"></div>`
        },
        callbacks: {
            didDisplay: (modal) => {
                editor.run(modal.getMarkup().querySelector('.publishhistory'), () => {
                    modal.setBusyState(false);
                });
            }
        }
    });

};
