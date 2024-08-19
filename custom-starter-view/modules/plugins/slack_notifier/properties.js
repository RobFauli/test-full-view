/**
 * Properties added to rows. Adds a button for manually sending a message to Slack.
 */

import callback from './callback.js';

export default {
    contentMenus: {
        slackMenu: {
            position: 'right',
            snapToTop: true,
            style: {
                'margin-top': '50px',
                'margin-right': '-50px'
            },
            items: {
                slack: {
                    // Icon for the button. CSS defined in file slack_notifier.css
                    icon: 'my_icons-slack',

                    // Text for the button, displayed when hovering over it
                    title: 'Send message to Slack',

                    // Only display the button on top level rows
                    displayCondition: 'hasParentOfTypes',
                    params: {
                        modelTypes: ['dropZone']
                    },

                    // Callback to be executed when the button is clicked
                    callback
                }
            }
        }
    }
};
