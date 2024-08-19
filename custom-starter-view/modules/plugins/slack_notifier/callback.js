import { Notifier } from './Notifier.js';

// This method is set as callback for the Slack-button in the content menu
// Display a modal for user to enter a message and send it to Slack
export default (menu, event) => {
    const model = menu.getModel();
    const rootModel = lab_api.v1.model.query.getRootModel();
    const url = `${ lab_api.v1.properties.get('customer_cms_url') }/edit/${ rootModel.getType().replace('page_', '') }/id/${ rootModel.getId() }`;
    lab_api.v1.ui.modal.dialog({
        content: {
            title: 'Notify on Slack',
            formgroups: [
                {
                    hasGrid: true,
                    elements: [
                        {
                            grid: 12,
                            id: 'text_area',
                            label: 'Write a message to send to Slack',
                            tag: 'textarea',
                            attributes: [
                                {
                                    name: 'id',
                                    value: 'text_area'
                                },
                                {
                                    name: 'name',
                                    value: 'text_area'
                                }
                            ],
                            value: `Please have a look at row ${ model.getModelIndex() + 1 } at this page:\n${ url }`
                        }
                    ]
                }
            ]
        },
        footer: {
            informalText: 'This functionality is for demo purposes only',
            buttons: [{
                type: 'submit',
                value: 'Send',
                highlight: true
            }]
        },
        callbacks: {
            submit: (input) => {
                Notifier.notify(input.text_area);
            }
        }
    });

};
