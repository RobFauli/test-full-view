import fs from 'fs';

export const versionFileHelper = {
    getDefaultVersionObject: () => ({
        view_version: "1.0.0",
        view_version_number: 134,
        view_name: "Baseview",
        view_build: {
            baseview: {
                releasenotes: "",
                userReleasenotes: "",
                version: 1
            }
        }
    }),
    readJsonFile: (path) => new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                const versionObj = JSON.parse(data);
                resolve(versionObj || {});
            }
        });
    }),
    saveJsonFile: (path, obj) => {
        fs.writeFile(path, JSON.stringify(obj, null, 4), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
};
