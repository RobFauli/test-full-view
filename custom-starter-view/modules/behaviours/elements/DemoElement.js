export default class DemoElement {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const externalData = view.get('external');
        if (!externalData) {
            return;
        }
        if (externalData.properties && externalData.properties.timeseries && externalData.properties.timeseries[0]) {
            model.setFiltered('air_temperature', this.api.v1.util.object.get('data.instant.details.air_temperature', externalData.properties.timeseries[0]));
            model.setFiltered('wind_speed', this.api.v1.util.object.get('data.instant.details.wind_speed', externalData.properties.timeseries[0]));
            model.setFiltered('symbol_code', this.api.v1.util.object.get('data.next_1_hours.summary.symbol_code', externalData.properties.timeseries[0]));
        }
    }

    onSettingsPanel(model, view, settings) {
        const locations = [
            { location: 'Oslo', lat: '59.9333', lon: '10.7166' },
            { location: 'Stockholm', lat: '59.3345', lon: '18.0632' },
            { location: 'Copenhagen', lat: '55.6760', lon: '12.5683' },
            { location: 'Helsinki', lat: '60.1920', lon: '24.9458' }
        ];
        model.setFiltered('locations', locations);
        return {
            // Return a handler for the settings panel
            // Documentation: /support/docs/#view/modules/behaviours.md
            // formValues will hold the property `location` defined in the name attribute in the settings template.
            onSubmit: ({ formValues }) => {
                if (formValues.location) {
                    // Get selected location from the formValues and find matching lat and lon params from the definition above:
                    const data = locations.filter((item) => item.location === formValues.location).pop();
                    model.set('fields.lat', data.lat);
                    model.set('fields.lon', data.lon);
                    model.set('fields.location', data.location);
                }
            }
            // onDisplay: ({ model, view, config, markup, modal }) => {
            //     // ...
            // },
            // onHide: ({ model, view, config, markup, modal }) => {
            //     // ...
            // }
        };
    }

}
