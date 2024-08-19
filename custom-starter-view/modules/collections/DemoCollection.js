/**
 * This is a demo collection that returns a list of elements of type 'demoElement'.
 * Each element has a set of locations used for fetching data from an external API.
 */
export default class {

    constructor(api) {
        this.api = api;
    }

    // Return an array of objects with location, lat and lon
    // Users will be able to drag and drop these items onto the page
    onGetData(uiInterface) {
        return [
            { location: 'Oslo', lat: '59.9333', lon: '10.7166' },
            { location: 'Bergen', lat: '60.3894', lon: '5.33' },
            { location: 'Trondheim', lat: '63.4308', lon: '10.4034' },
            { location: 'Tromsø', lat: '69.6827', lon: '18.9427' },
            { location: 'Vardø', lat: '70.3705', lon: '31.0241' }
        ];
    }

    // Map the data to view-format that Labrador may understand.
    // Documentation: /support/docs/#view/data/view-data-format.md
    // The element has properties defining an external url to fetch data from.
    // The location-fields (lat, lon) are used in this url.
    onMapData(uiInterface, data) {
        const results = [];
        data.forEach((item) => {
            results.push({
                type: 'demoElement',
                contentdata: {
                    fields: {
                        location: item.location,
                        lat: item.lat,
                        lon: item.lon
                    }
                }
            });
        });
        return results;
    }

    // Use the location field as title for each item in the collection
    onItemProperties(uiInterface) {
        return {
            title: {
                path: 'fields.location'
            }
        };
    }

}
