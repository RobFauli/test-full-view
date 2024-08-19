import template from './template.js';
import { YouTubeEditor } from './YouTubeEditor.js';

export default (menu, event) => {
    const { model, view } = menu;

    const editor = new YouTubeEditor(model, view);

    const dialog = lab_api.v1.ui.modal.dialog({
        container: {
            width: 750
        },
        content: {
            markup: template
        },
        callbacks: {
            didDisplay: ({ markup }) => {
                const success = editor.run(markup);
                if (!success) {
                    dialog.close();
                }
            }
        }
    });
};
