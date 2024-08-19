export class ResourceHelper {

    /**
     * Fetches paths to stylesheets specified for a given site. Stylesheets can be specified in "site_styles.<SITE ALIAS>".
     *
     * @param {string} siteAlias Site to fetch stylesheet paths for.
     * @param {Array<string>} fallbackValue An array of fallback stylesheet paths to use in case of failure.
     * @returns {Array<string>} An array containing paths to stylesheets for the provided site.
     */
    static getSiteStyles(siteAlias, fallbackValue = []) {
        const paths = lab_api.v1.config.get(`site_styles.${ siteAlias }`) || fallbackValue;
        Sys.logger.debug(`ViewSupport: Found ${ Array.isArray(paths) ? paths.length : 0 } stylesheet(s) for site "${ siteAlias }".`);
        return paths;
    }

    /**
     * Get a list of paths for stylesheets.
     * If none is defined, check configured fallback-site
     * A site using a fallback-site may set site_styles.<SITE ALIAS> to an empty array to prevent using fallback-resources.
     *
     * @param {string} siteAlias Site to fetch stylesheet paths for.
     * @param {Array<string>} ignoreSites An array of site aliases refering to sites which are to be ignored.
     * @returns {Array<string>} An array containing paths to stylesheets for the provided site or any of its declared fallback sites.
     */
    static getSiteStylesWithFallback(siteAlias, ignoreSites = []) {
        const paths = this.getSiteStyles(siteAlias, null);
        if (paths === null) {
            ignoreSites.push(siteAlias);
            const fallbackSite = lab_api.v1.config.get('lab_fallback_site', { site: siteAlias });
            if (fallbackSite && !ignoreSites.includes(fallbackSite)) {
                return this.getSiteStylesWithFallback(fallbackSite, ignoreSites);
            }
        }
        return paths || [];
    }

    /**
     * Fetches an array of script paths for a site based on the provided site alias.
     *
     * @param {string} siteAlias The alias of the site to fetch script paths for.
     * @param {string} pageType The type of page which is to be generated.
     * @returns {Array<string>} An array containing paths to scripts for a given site.
     */
    static getSiteScripts(siteAlias, pageType, isEditor) {
        const paths = this.filterScriptListByPageType(lab_api.v1.config.get(`site_scripts.${ siteAlias }`) || [], pageType, isEditor);
        Sys.logger.debug(`ViewSupport: Found ${ paths.length } script-path(s) for site "${ siteAlias }".`);
        return paths;
    }

    /**
     * Get a list of paths for scripts.
     * If none is defined, check configured fallback-site
     * A site using a fallback-site may set site_scripts.<SITE ALIAS> to an empty array to prevent using fallback-resources.
     *
     * @param {string} siteAlias Site to fetch script paths for.
     * @param {string} pageType The type of page which is to be generated.
     * @param {boolean} isEditor Flag for editor-mode
     * @param {Array<string>} ignoreSites An array of site aliases refering to sites which are to be ignored.
     * @returns {Array<object>} An array containing objects with paths to scripts for a given site or any of its declared fallback sites.
     */
    static getSiteScriptsWithFallback(siteAlias, pageType, isEditor, ignoreSites = []) {
        let paths = this.getSiteScripts(siteAlias, pageType, isEditor);
        if (ignoreSites.length) {
            paths = this.removeWithInheritFalse(paths);
        }
        if (!paths.length) {
            ignoreSites.push(siteAlias);
            const fallbackSite = lab_api.v1.config.get('lab_fallback_site', { site: siteAlias });
            if (fallbackSite && !ignoreSites.includes(fallbackSite)) {
                return this.getSiteScriptsWithFallback(fallbackSite, pageType, isEditor, ignoreSites).filter((item) => item.inherit !== false);
            }
        }
        return paths;
    }

    /**
     * Fetches paths for scripts which are common for all sites.
     *
     * @param {string} pageType The type of page to be generated.
     * @param {boolean} isEditor Flag for editor-mode
     * @returns {Array<string>} An array containing paths to scripts common for all sites.
     */
    static getCommonScripts(pageType, isEditor, isModule = false) {
        const paths = this.filterScriptListByPageType(lab_api.v1.config.get(`site_scripts_common`) || [], pageType, isEditor, isModule);
        Sys.logger.debug(`ViewSupport: Found ${ paths.length } common ${ isModule ? 'script-path(s)' : 'JS modules' }`);
        return paths;
    }

    // (array)
    static filterScriptListByPageType(list, pageType, isEditor, isModule = false) {
        return list.filter((item) => ((!item.isModule && !isModule) || (item.isModule && isModule)) && (!item.pageType || item.pageType === pageType) && (!isEditor || (isEditor && !item.skipEditor)));
    }

    static removeWithInheritFalse(items) {
        if (Array.isArray(items) && items.length > 0) {
            return items.filter((item) => item.inherit !== false);
        }
        return items;
    }

    /**
     * Get element-specific resources.
     * User-config can specify files needed per element.
     * Handle it here to avoid multiple copies of the same files included on page.
     * Config: "contentbox_settings.<BOX NAME>.require.<FILETYPE>"
     *
     * Note: Query config per content-type ('contentbox_settings.my_box' instead of 'contentbox_settings') to get site-overrides
     *
     * @param {LabModel} pageModel
     * @param {LabView} pageView
     * @param {string} filetype Type of file to be fetched (JS or CSS).
     * @param {Array<string>} ignorePaths
     * @returns
     */
    static getSiteFilesForContentboxes(pageModel, pageView, filetype, ignorePaths = []) {
        const result = [];
        const contentboxList = lab_api.v1.model.query.getModelTypes();
        Sys.logger.debug(`ViewSupport sitefiles: Will register ${ filetype }-file(s) for contentbox-types ${ contentboxList.join(', ') }.`);
        for (const type of contentboxList) {
            const config = lab_api.v1.config.get(`contentbox_settings.${ type }.require.${ filetype }`);
            if (Array.isArray(config)) {
                for (const path of config) {
                    if (!result.includes(path) && !ignorePaths.includes(path)) {
                        Sys.logger.debug(`ViewSupport sitefiles: Will include ${ filetype }-file "${ path }" for contentbox "${ type }".`);
                        result.push(path);
                    }
                }
            }
        }
        Sys.logger.debug(`ViewSupport sitefiles: Finished registering ${ filetype }-file(s). Found ${ result.length } file(s).`);
        return result;
    }

}
