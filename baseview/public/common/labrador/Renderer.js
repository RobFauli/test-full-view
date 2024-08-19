/**
 * Create an instance of Labrador rendering engine
 * Uses view-resources from Baseview
 */

import { Core } from './Core.js';
import { behaviours as baseviewBehaviours, Entry } from '../../../build/modules/client_modules.js';
import { config, properties, templates } from '../../../build/modules/client_package.js';

export class Renderer {

    constructor(settings) {

        console.group('[Labrador] Setup rendering engine');

        const input = Renderer.resolveConfig(settings);

        // Javascript modules
        const behaviours = {};

        // Multiview: Add entries from subsequent views to the entries-array
        const entries = [Entry];

        for (const key of Object.keys(baseviewBehaviours)) {
            // Multiview: Add behaviours from subsequent views to the behaviours[key]-array
            behaviours[key] = [baseviewBehaviours[key]];
        }

        let debug = false;
        if (new URLSearchParams(window.location.search).get('debug')) {
            debug = true;
        }

        window.Sys = { logger: console };

        this.renderer = new Core({
            logger: window.Sys.logger,
            settings: {
                siteAlias: input.site.alias,
                device: input.app.device,
                debug,
                transform: input.app.transform // Will require data in internal format
            },
            resources: {
                config: {
                    site: {
                        alias: input.site.alias,
                        display_name: input.site.display_name,
                        domain: input.site.domain,
                        id: input.site.id
                    },
                    image_server: input.app.image_server,
                    app: {
                        mode: 'presentation',
                        abc: 123
                    },
                    customer: { ...config, ...input.config }
                },
                templates: {
                    view: templates
                },
                properties,
                views: ['baseview_client']
            },
            globals: window,
            callbacks: {},
            entries,
            behaviours
        });
        this.api = this.renderer.getApi();
        console.groupEnd();
    }

    // (object)
    static resolveConfig(conf) {
        const site = conf.site || {};
        const app = conf.app || {};
        return {
            config: conf.config || {},
            site: {
                alias: site.alias,
                display_name: site.display_name,
                id: site.id,
                domain: site.domain,
            },
            app: {
                debug: !!app.debug,
                image_server: app.image_server,
                device: app.device,
                transform: !!app.transform
            }
        };
    }

    // (void) data: ClientData or array
    setData(data) {
        return this.renderer.setData(typeof data.getData === 'function' ? data.getData() : data);
    }

    // (Promise)
    render() {
        return new Promise((resolve, reject) => {
            console.group('[Labrador] Render data');
            this.renderer.draw((result) => {
                resolve(result);
                console.groupEnd();
            });
        });
    }

}
