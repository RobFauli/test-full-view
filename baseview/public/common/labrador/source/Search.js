/**
 * Labrador Search
 * Search and render articles using the Labrador API
 */

import { Mapper } from '../Mapper.js';
import { Reader } from '../Reader.js';
import { Renderer } from '../Renderer.js';
import { SearchMapper } from './SearchMapper.js';

export class Search {

    // Arguments:
    // {
    //     url: '<url to fetch>',
    //     app: {
    //         image_server: '<url to image server>',
    //         devie: 'mobile'
    //     },
    //     site: {
    //         alias: 'my_site',
    //         display_name: 'My Site',
    //         id: 1,
    //         domain: 'lbrdr.com'
    //     }
    // }
    constructor({
        config, url, app = {}, site = {}, searchMapper = {}
    } = {}) {
        this.reader = new Reader({
            url,
            mappers: [
                new Mapper({
                    source: 'LabradorApi',
                    image_server: app.image_server
                }),
                new SearchMapper(searchMapper)
            ]
        });
        this.renderer = new Renderer({
            config,
            app,
            site
        });
    }

    // (Promise)
    read() {
        return new Promise((resolve, reject) => {
            // Get data and map to internal format
            // The resolved payload 'result' is an instance of ClientData
            this.reader.read().then((result) => {
                this.renderer.setData(result);
                this.renderer.render().then((markups) => {
                    result.setMarkups(markups);
                    resolve(result);
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    updateUrl(url) {
        this.reader.updateUrl(url);
    }

}
