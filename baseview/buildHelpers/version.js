/**
 * Bump build version for Baseview
 *
 * To run:
 * $ npm run version
 */

import { versionFileHelper as fileHelper } from './versionFileHelper.js';

const versionFile = 'config/version.json';

console.log(`Bumping build version for Baseview  ...`);

const bumpBuildVersion = (version) => (version || 0) + 1;

fileHelper.readJsonFile(versionFile).then((versionObj) => {
    const obj = Object.assign(fileHelper.getDefaultVersionObject(), versionObj);
    const build = bumpBuildVersion(obj.view_build.baseview.version);
    obj.view_build.baseview.version = build;
    fileHelper.saveJsonFile(versionFile, obj);
    console.info(`Baseview build-version "${ obj.view_build.baseview.version }" saved to "${ versionFile }"`);
}).catch((err) => {
    console.log('Error fetching version: ', err);
});
