/**
 * Notifier.js
 * Send a message via a Slack webhook
 * The url is defined in the config.js file
 */
import config from './config.js';

export class Notifier {

    static notify(txt) {
        const payload = {
            text: `${ txt }\n(This is a demo message used by the Slack Notifier plugin)`
        };
        fetch(config.slack_webhook_url, {
            method: 'POST',
            body: JSON.stringify(payload)
        }).then((res) => {
            if (!res.ok) {
                throw new Error(`Server error ${ res.status }`);
            }
            return res.text();
        }).catch((error) => {
            console.log(error);
        });
    }

}
