/**
 * Handle data and rendering engine for tagboard
 */

import { Mapper } from '../Mapper.js';
import { Reader } from '../Reader.js';
import { Renderer } from '../Renderer.js';
import { FrontContentMapper } from './FrontContentMapper.js';
import { Filter } from '../transformers/prosessors/Filter.js';
import { Tags } from '../transformers/prosessors/Tags.js';
import { RowLines } from '../transformers/prosessors/RowLines.js';
import { Setter } from '../transformers/prosessors/Setter.js';
import { RowsAndColumns } from '../transformers/layout/RowsAndColumns.js';
import { RandomRows } from '../transformers/layout/RandomRows.js';

export class FrontContentRenderer {

    constructor({
        url, app = {}, site = {}, settings = {}
    } = {}) {
        this.mappers = {
            api: new Mapper({ source: settings.sourceType, image_server: app.image_server, settings: { useEditorProxy: settings.isEditor && settings.sourceType !== 'LabradorApi' } }),
            tagboard: new FrontContentMapper(settings),
            filter: new Filter({ data: settings.articleFilterList }),
            tags: new Tags({ tagGroups: [] }),
            setter: new Setter({ data: settings.style }),
            rows: settings.organizer === 'RowsAndColumns' ? new RowsAndColumns({ layout: settings.layout }) : new RandomRows({ layout: settings.layout }),
            lines: new RowLines(settings)
        };

        this.reader = new Reader({
            url,
            mappers: [
                this.mappers.api,
                this.mappers.tagboard,
                this.mappers.filter,
                this.mappers.tags,
                this.mappers.setter,
                this.mappers.rows,
                this.mappers.lines
            ]
        });
        this.renderer = new Renderer({
            app,
            site
        });
    }

    // (Promise)
    read() {
        return new Promise((resolve, reject) => {
            this.reader.read().then((result) => {
                if (!result.data.count === 0) {
                    reject();
                    return;
                }
                this.render(result).then((res) => {
                    resolve(res);
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    render(result) {
        return new Promise((resolve, reject) => {
            if (!result.data.count === 0) {
                reject();
                return;
            }
            this.renderer.setData(result);
            this.renderer.render().then((markups) => {
                result.setMarkups(markups);
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    filter(tags) {
        if (Array.isArray(tags) && tags.length) {
            // this.tagGroups = [...tags];
            this.mappers.tags.tagGroups = [...tags];
            // return this.read();
        }
        // return new Promise.reject();
    }

    updateUrl(url) {
        this.reader.updateUrl(url);
    }

}
