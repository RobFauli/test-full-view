import fs from 'fs';

export const fileHelper = {
    readFile: (path) => new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    }),
    saveFile: (path, text) => {
        fs.writeFile(path, text, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
};
