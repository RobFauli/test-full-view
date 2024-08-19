import AppPusher from './AppPusher.js';

export default {
    name: 'App Pusher',
    description: 'Push message to app',
    version: '1.0.0',
    predicate: (api) => api.v1.config.get('plugins.appPusher.enable') && api.v1.config.get('plugins.appPusher.appName'),
    entry: AppPusher,
    on: {
        enabled(plugin) {
            if (plugin.entry.instance && plugin.entry.instance.onEnabled) {
                plugin.entry.instance.onEnabled();
            }
        },
        disabled(plugin) {
            if (plugin.entry.instance && plugin.entry.instance.onDisabled) {
                plugin.entry.instance.onDisabled();
            }
        }
    }
};
