/**
 * Read config from file client/config.json and resource-maps from client/resources.json.
 * Extract paths for all templates and properties and store values and config in a JS-module.
 * The resource-maps can use identical templates/properties as front,
 * minimizing the diff between rendering backend and in the client.
 * This buildt module can be imported by the client and used with Labrador renderer.
 * Other JS-modules (behaviours, entries etc.) are handled by webpack.config.client.cjs
 */

import { fileHelper } from './fileHelper.js';

const allPaths = {
    templates: [],
    properties: []
};

const allResources = {
    templates: {},
    properties: {},
    config: {}
};

const log = (msg) => {
    console.log(`[builder] ${ msg }`);
};

const readFile = (path) => new Promise((resolve, reject) => {
    fileHelper.readFile(path).then((data) => {
        resolve(data);
    }).catch((error) => {
        reject(error);
    });
});

// (array) Get a list of paths. Leaf nodes of a resource map.
const parseResource = (obj) => {
    if (!obj) { return []; }
    if (Array.isArray(obj)) { return obj; }
    if (typeof obj === 'object') {
        let result = [];
        for (const key of Object.keys(obj)) {
            const items = parseResource(obj[key]);
            if (items.length) {
                result = [...result, ...items];
            }
        }
        return result;
    } if (typeof obj === 'string') {
        return [obj];
    }
    return [];
};

const isObject = (item) => item && typeof (item) === 'object' && !Array.isArray(item);

// Deep merge
// If any key contains an array this will not be merged but overridden.
// source overrides target
const merge = (target, source) => {
    if (Array.isArray(target) && Array.isArray(source)) {
        return source;
    }
    const output = Object.assign(Array.isArray(target) ? [] : {}, target);
    if (isObject(target) && isObject(source)) {
        for (const key of Object.keys(source)) {
            if (isObject(source[key])) {
                //                      Case: target[key] = 'string', source[key] = {object} - Override
                if (!(key in target) || !isObject(target[key])) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = merge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        }
    }
    return output;
};

const sources = [
    './client/configPaths.json',
    './client/resources.json'
];
const buildConfig = {};

const resourcePromises = sources.map((source) => {
    log(`Will use source ${ source }`);
    return readFile(source);
});

Promise.all(resourcePromises).then((results) => {
    const resources = {
        config: JSON.parse(results[0]),
        maps: JSON.parse(results[1])
    };

    // Find all paths in resource maps:
    for (const path of Object.keys(resources.maps)) {
        log(`Parsing resource map ${ path }`);
        const paths = parseResource(resources.maps[path]);
        for (const p of paths) {
            let target; let
                fullPath;
            if (p.includes('.')) {
                target = allPaths.properties;
                fullPath = p;
            } else {
                target = allPaths.templates;
                fullPath = `${ p }.template.mustache`;
            }
            if (!target.includes(fullPath)) {
                target.push(fullPath);
            }
        }
    }

    const configPromises = [];
    for (const path of resources.config) {
        log(`Adding config-file ${ path }`);
        configPromises.push(readFile(path));
    }
    const pc = Promise.all(configPromises).then((results) => {
        for (const item of results) {
            const itemObj = JSON.parse(item);
            const merged = merge(allResources.config, itemObj);
            allResources.config = merged;
        }
        buildConfig.build = allResources.config.view_build.baseview.version;
        buildConfig.version = allResources.config.view_version;
    });

    const templatePromises = [];
    for (const path of allPaths.templates) {
        log(`Adding template-file ${ path }`);
        templatePromises.push(readFile(`./view/${ path }`));
    }
    const p1 = Promise.all(templatePromises).then((results) => {
        for (const item of results) {
            allResources.templates[allPaths.templates[results.indexOf(item)].replace('.template.mustache', '')] = item;
        }
    });
    const propertiesPromises = [];
    for (const path of allPaths.properties) {
        log(`Adding property-file ${ path }`);
        propertiesPromises.push(readFile(`./view/${ path }`));
    }
    const p2 = Promise.all(propertiesPromises).then((results) => {
        for (const item of results) {
            allResources.properties[allPaths.properties[results.indexOf(item)]] = item;
        }
    });

    Promise.all([p1, p2]).then((done) => {
        const { templates } = allResources;
        const properties = {}; // JSON.parse(allResources.properties);
        for (const path of Object.keys(allResources.properties)) {
            properties[path] = JSON.parse(allResources.properties[path]);
        }
        // Add resource-maps
        for (const path of (Object.keys(resources.maps))) {
            properties[path] = resources.maps[path];
        }
        const jsString = `// View export from Baseview
// Version: ${ buildConfig.version }, build: ${ buildConfig.build }
export const config = ${ JSON.stringify(allResources.config) };
export const properties = ${ JSON.stringify(properties) };
export const templates = ${ JSON.stringify(templates) };
`;
        const filePath = './build/modules/client_package.js';
        log(`Will save client config, properties and templates in js-module ${ filePath }`);
        log(`Baseview v${ buildConfig.version }, build: ${ buildConfig.build }`);
        fileHelper.saveFile(filePath, jsString);
    }).catch((error) => {
        console.log('error: ', error);
    });
});
