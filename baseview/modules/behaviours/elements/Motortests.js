import { DateTimeHelper } from '../../lib/helpers/datetime/DateTimeHelper.js';

export default class Motortests {

    constructor(api) {
        this.api = api;
    }

    // Prepare url for external data
    onViewHelper(model, view) {
        const site = this.api.v1.site.getSite();
        model.setFiltered('siteId', site.id);
        model.setFiltered('testId', model.get('fields.testId'));
        const testTypeMap = {
            summerTire: 'tiresummertests',
            winterTire: 'tirewintertests',
            food: 'foodtests',
            hotel: 'hoteltests',
            vehicle: 'vehicletests'
        };
        const testType = model.get('fields.testType') || 'vehicle';
        const displayDirection = model.get('fields.displayDirection') === 'horizontal' ? 'horizontal' : 'vertical';
        model.setFiltered('displayDirection', displayDirection);
        model.setFiltered('displayDirectionOptions', [
            {
                value: 'horizontal',
                selected: displayDirection === 'horizontal'
            },
            {
                value: 'vertical',
                selected: displayDirection === 'vertical'
            }
        ]);
        model.setFiltered('needSlider', displayDirection === 'horizontal');
        model.setFiltered('isDebug', this.api.v1.util.request.hasQueryParam('debug'));
        const typeOptions = [];
        for (const testName of Object.keys(testTypeMap)) {
            typeOptions.push({
                value: testName,
                selected: testName === testType
            });
        }
        model.setFiltered('typeOptions', typeOptions);
        model.setFiltered('apiEndpoint', testTypeMap[testType]);
    }

    // External data-elements are run twice in Labrador. On second run we have external data
    onRender(model, view) {
        const externalData = view.get('external');
        if (!externalData) return;
        const testType = model.get('fields.testType') || 'vehicle';
        const categoryMap = {
            vehicle: {
                comfort: 'Komfort',
                design: 'Design',
                driveability: 'Kjøreegenskaper',
                environment: 'Miljø og forbruk',
                equipment: 'Utstyr',
                practicality: 'Praktisk',
                price: 'Pris',
                runningCosts: 'Driftskostnader',
                security: 'Sikkerhet',
                value: 'Annenhåndsverdi'
            },
            food: {
                firstImpression: 'Førsteinntrykk',
                menu: 'Meny',
                taste: 'Smak',
                price: 'Pris',
                service: 'Service',
                familyFriendly: 'Barnevennlig',
                homemade: 'Hjemmelaget',
                drinks: 'Drikke',
                cleaning: 'Renhold',
                lavatories: 'Toaletter'

            },
            hotel: {
                location: 'Beliggenhet',
                rooms: 'Rom',
                standard: 'Standard',
                beds: 'Senger',
                breakfast: 'Frokost',
                bathroom: 'Bad',
                commonAreas: 'Fellesområder',
                cleaning: 'Renhold',
                value: 'Valuta for pengene'
            },
            summerTire: {
                asphalt: 'Tørr asfalt',
                asphaltWet: 'Våt asfalt',
                grip: 'Grep',
                breaking: 'Bremselengde',
                driveability: 'Kjøreegenskaper',
                aquaplaning: 'Vannplaning',
                aquaplaningSwing: 'Vannplaning sving',
                comfort: 'Komfort',
                fuelConsumption: 'Forbruk',
                noise: 'Støy',
                other: 'Annet'
            },
            winterTire: {
                snow: 'Snø',
                ice: 'Is',
                asphalt: 'Tørr asfalt',
                asphaltWet: 'Våt asfalt',
                breaking: 'Bremselengde',
                driveability: 'Kjøreegenskaper',
                aquaplaning: 'Vannplaning',
                aquaplaningSwing: 'Vannplaning sving',
                comfort: 'Komfort',
                fuelConsumption: 'Forbruk',
                noise: 'Støy',
                grip: 'Grep',
                acceleration: 'Akselerasjon',
                other: 'Annet',
                spikes: 'Pigger',
                count: 'Antall',
                spikeLengthBefore: 'Piggutstikk etter innkjøring (mm)',
                spikeLengthAfter: 'Piggutstikk etter snø/istest (mm)',
                weightKg: 'Vekt',
                installationDescription: 'Montering'
            }
        };
        const mappedCategories = [];
        if (testType.indexOf('Tire') > 0) {
            const dateHelper = new DateTimeHelper(this.api.v1.config.get('lang'));
            const date = new  Date(externalData.production.date);
            const dateString = Number.isNaN(date.getTime()) ? externalData.production.date : dateHelper.formattedDate(date, 'd/m Y');
            let winterTire = '';
            if (testType === 'winterTire') {
                winterTire = `<span class="test-key-value"><span class="test-key">Pigger:</span><span class="test-value">${ (externalData.spikes && externalData.spikes.isSpikes) ? externalData.spikes.count : 'nei' }</span></span>`;
            }
            if (externalData.description && typeof externalData.description === 'string') {
                externalData.description = externalData.description.replace(/\n/g, '<br>');
            }
            mappedCategories.push({
                title: 'Fakta',
                description: `
                    <span class="test-key-value"><span class="test-key">Produksjonsland:</span><span class="test-value">${ externalData.production.country || '' }</span></span>
                    <span class="test-key-value"><span class="test-key">Produksjonsdato:</span><span class="test-value">${ dateString || '' }</span></span>
                    ${ winterTire }
                    <p>${ externalData.description || '' }</p>
                `
            });
            externalData.description = '';
            if (externalData.loadSpeedRating && externalData.loadSpeedRating.length) {
                externalData.description += `<span class="test-key-value"><span class="test-key">Last- og hastighetsindeks:</span><span class="test-value">${ externalData.loadSpeedRating }</span></span>`;
            }
            if (externalData.shore && externalData.shore.length) {
                externalData.description += `<span class="test-key-value"><span class="test-key">Hardhetstall</span><span class="test-value">${ externalData.shore }</span></span>`;
            }
            if (externalData.installationDescription && externalData.installationDescription.length) {
                externalData.description += `<span class="test-key-value"><span class="test-key">Montering:</span><span class="test-value">${ externalData.installationDescription }</span></span>`;
            }

            Object.keys(categoryMap[testType]).forEach((key) => {
                if (externalData[key] && (typeof externalData[key] === 'object' && Array.isArray(Object.keys(externalData[key])) && Object.keys(externalData[key]).length > 0)) {
                    if (key === 'spikes' && !externalData.spikes.isSpikes) {
                        return;
                    }
                    let subDescription = '';
                    Object.keys(externalData[key]).forEach((subKey) => {
                        if (externalData[key][subKey] > 0 && categoryMap[testType][subKey]) {
                            subDescription += `<span class="test-key-value"><span class="test-key">${ categoryMap[testType][subKey] }:</span><span class="test-value">${ externalData[key][subKey] }</span></span> `;
                        }
                    });

                    mappedCategories.push({
                        title: categoryMap[testType][key],
                        description: subDescription
                    });
                }
            });
        } else {
            Object.keys(categoryMap[testType]).forEach((key) => {
                if (externalData[key]) {
                    const tmpObj = {
                        title: categoryMap[testType][key],
                        score: externalData[key].score,
                        description: externalData[key].description
                    };
                    mappedCategories.push(tmpObj);
                }
            });
        }
        model.setFiltered('testSubject', externalData.name ? externalData.name : null);
        model.setFiltered('totalScore', externalData.score ? externalData.score : null);
        model.setFiltered('introduction', externalData.description ? externalData.description : null);
        model.setFiltered('mappedCategories', mappedCategories);
    }

}
