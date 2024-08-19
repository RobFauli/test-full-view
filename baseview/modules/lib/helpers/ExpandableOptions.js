export class ExpandableOptions {

    // (object) Get settings for an expandable contentbox.
    // The box needs css to display the toggle-element and to hide collapsed content.
    // ViewSupport.expandableOptions = function(configPath, expanded) {
    // params: { options, configPath, expanded }
    // "options" is an object containing config. If not set "configPath" is used to read config.
    static run(params) {

        const siteOptions = params.options || lab_api.v1.config.get(params.configPath) || {};

        // Define default settings and merge with site-settings.
        // The factbox is default visible on desktop (collapsedState.desktop = false), collapsed on mobile (collapsedState.mobile = true).
        const options = lab_api.v1.util.object.merge({

            // Content for kicker-element on top of the box
            kicker: null,

            // Editable kicker element
            kicker_editable: false,

            // Is the box expandable?
            expandable: {
                mobile: true,
                desktop: true
            },

            // Can a collapsed box expand?
            collapsable: {
                mobile: true,
                desktop: true
            },

            // Collapsed state
            collapsedState: {
                mobile: true,
                desktop: false
            },

            // Do the box need js to handle collapsed state?
            needJs: false,

            // How should the box style a collapsed box?
            style: 'fade' // Options: 'fade': Display some of the fact-content, fade to transparent. ''hide': Only display title and optional kicker.

        }, siteOptions);

        // Let template reflect state for all viewports
        const cssStrings = [`style-${  options.style }`];
        for (const vp in options.expandable) {
            if (options.expandable[vp]) {
                cssStrings.push(`expandable-${  vp }`);
            }
        }
        for (const vp in options.collapsable) {
            if (options.collapsable[vp]) {
                cssStrings.push(`collapsable-${  vp }`);
            }
        }
        options.needJs = cssStrings.length > 0;
        options.cssString = cssStrings.join(' ');

        return options;
    }

}
