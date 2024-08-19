/**
 * Transform JSON from named source to internal format
 * Todo: Add LabradorJSON, Kilkaya, etc
 */
import { ClientData } from './ClientData.js';
import { LabradorApi } from './transformers/source/LabradorApi.js';
import { DachserJson } from './transformers/source/DachserJson.js';
import { KilkayaStreams } from './transformers/source/KilkayaStreams.js';

export class Mapper {

    constructor({
        source, image_server, mapperSettings = {}, settings = { useEditorProxy: false }
    } = {}) {
        this.source = source;
        this.useEditorProxy = settings.useEditorProxy;
        this.image_server = image_server;
        this.mapperSettings = mapperSettings;
    }

    // (array / ClientData)
    map(data) {
        const clientData = new ClientData();
        switch (this.source) {
            case 'LabradorApi':
                return this.mapLabradorApi(data, clientData);
            case 'DachserJson':
                return this.mapDachserJson(data, clientData);
            case 'KilkayaStreams':
                return this.mapKilkayaStreams(data, clientData);
            default:
                console.warn(`[Mapper] Unsupported source ${ this.source }`);
                return [];
        }
    }

    // Data is Labrador API-format
    mapLabradorApi(rawInput, clientData) {
        const input = this.resolveProxy(rawInput);
        if (!input || !input.result || !input.result.length) {
            return clientData;
        }
        const mapper = new LabradorApi(this.mapperSettings);
        clientData.setData(mapper.map(input));
        clientData.setTotalCount(input.totalCount);
        return clientData;
    }

    mapDachserJson(rawInput, clientData) {
        const input = this.resolveProxy(rawInput);
        if (!input || !input.result || !input.result.length) {
            return clientData;
        }
        const mapper = new DachserJson(this.mapperSettings);
        clientData.setData(mapper.map(input));
        clientData.setTotalCount(input.totalCount);
        return clientData;
    }

    mapKilkayaStreams(input, clientData) {
        if (!input || !input.stream || !input.stream.length) {
            return clientData;
        }
        const mapper = new KilkayaStreams(this.mapperSettings);
        clientData.setData(mapper.map(input.stream));
        clientData.setTotalCount(input.stream.length);
        return clientData;
    }

    // Editor may use a proxy returning a JSON-string @ input.value
    resolveProxy(input) {
        if (!this.useEditorProxy) {
            return input;
        }
        return JSON.parse(input.value);
    }

}
