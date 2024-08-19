/**
 * ClientConfig. Get site-config and config-object that should be passed to the client.
 */

export class ClientConfig {

    static buildConfig(api) {
        return {
            paywall: {
                label: api.v1.config.get('paywall.label')
            }
        };
    }

}
