/**
 * Get any number of articles and place them in rows.
 * Try to resize images and text to give each article the same height.
 * Note: Require a style-definition to generate css for text-size.
 */

import { datatype } from '../datatype.js';

export class RowLines {

    constructor(settings) {
        this.active = settings.postprocessor === 'RowLines';
        this.aspectRatio = settings.layout.imageAspectRatio || 0.45;
        this.options = {
            ratioOptionsSource: {
                title: 1.4, subtitle: 1, kicker: 1, image: 1
            },
            ratioOptionsTarget: {
                title: 1.4, subtitle: 1, kicker: 1, image: 1
            },
            text_size: {
                min: 16, max: 70, base: 30
            },
            fieldSuffix: {
                size: 'text_size'
            }
        };
    }

    // Data is a list of rows
    // Group in rows and apply layout for each article in each row.
    // Todo: Remove grouping from this class and add an extra step in the transformer to group content.
    map(clientData) {
        if (!this.active) {
            return clientData;
        }
        const data = clientData.getData();
        this.autoLayoutRows(data, this.options);
        clientData.setData(data);
        return clientData;
    }

    autoLayoutRows(data, options) {
        data.forEach((row) => this.autoLayoutRow(row, options));
        return data;
    }

    autoLayoutRow(data, options) {
        const rowLength = data.children.length;

        // Get character length of each element in row:
        const contentLength = {
            kicker: data.children.map((child) => Math.max((child.contentdata.fields.kicker.value || '').length, 10)),
            title: data.children.map((child) => Math.max((datatype.string.strip_tags(child.contentdata.fields.title.value || '')).length, 10)),
            subtitle: data.children.map((child) => Math.max((child.contentdata.fields.subtitle.value || '').length, 50)),
            image: data.children.map((child) => (child.children.length ? 177 : 0))
        };
        const keys = Object.keys(contentLength);

        const templateSizes = {
            title: 3, // Pixel-height per character
            kicker: 1.5, // Pixel-height per character
            subtitle: 0.54, // Pixel-height per character
            image: 0.5 // Pixel-height per character (based on height = 177px)
        };

        const ratioOptionsSource = options.ratioOptionsSource || {};
        const ratioOptionsTarget = options.ratioOptionsTarget || {};
        // const ratioLimits = options.ratioLimits || {};

        // Assure options. Set defaults:
        for (const key of keys) {
            ratioOptionsSource[key] = ratioOptionsSource[key] || 1; // Range: 0.1 - 1.9
            ratioOptionsTarget[key] = ratioOptionsTarget[key] || 1; // Range: 0.1 - 1.9
            // ratioLimits[key] = ratioLimits[key] || [0.5, 1.5];  // Range: [0.1 - 1.9, 0.1 - 1.9]
        }

        // Get calculated pixel-height of each element in row
        // This should match actual layout using image-height = 177px and title-size = text_size.base.
        const heights = [];
        for (let i = 0; i < rowLength; i++) {
            heights.push(
                parseInt((contentLength.title[i] * templateSizes.title * ratioOptionsSource.title)
                    + (contentLength.kicker[i] * templateSizes.kicker * ratioOptionsSource.kicker)
                    + (contentLength.subtitle[i] * templateSizes.subtitle * ratioOptionsSource.subtitle)
                    + (contentLength.image[i] * templateSizes.image * ratioOptionsSource.image), 10)
            );
        }

        // Get average height for elements in the row
        const avgHeight = this.getAvg(heights);

        // Get a list of what amount each element needs to resize in percent (1 = 100%, no resizing. 0.5 = 50%, shrink by half. ...).
        // Use the average height as base:
        // Todo: This data may be pre-processed to normalize against all rows ...
        const resize = heights.map((height) => avgHeight / height);

        for (const child of data.children) {
            const index = data.children.indexOf(child);
            const hasImage = contentLength.image[index] > 0;

            // 1.4 = 1.2 on each
            // 0.6 = 0.8 on each
            const elementResize = hasImage ? (resize[index] - 1) / 2 + 1 : resize[index];

            if (hasImage) {
                const elementDiffImage = elementResize * ratioOptionsTarget.image;
                child.children[0].contentdata.fields.whRatio = {
                    value: this.aspectRatio * elementDiffImage
                };
            }

            let size = Math.round(options.text_size.base * elementResize * ratioOptionsTarget.title);
            if (size < options.text_size.min) {
                size = options.text_size.min;
            }
            if (size > options.text_size.max) {
                size = options.text_size.max;
            }
            datatype.object.set(`attributes.${ this.options.fieldSuffix.size }.value`, size, child.contentdata.fields.title)
        }
    }

    getAvg(data) {
        return Math.round(data.reduce((a, b) => a + b, 0) / data.length);
    }

}
