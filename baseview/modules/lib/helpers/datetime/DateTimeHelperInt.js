/**
 * DateTimeHelper that uses localisation
 */

import { DateTimeHelper } from './DateTimeHelper.js';

export class DateTimeHelperInt extends DateTimeHelper {

    // languageCode: 'nb-NO', 'en-GB', etc.
    constructor({ languageCode } = {}) {
        super('en');
        this.languageCode = languageCode || lab_api.v1.config.get('contentLanguage');
    }

    str(key, { data, noRender } = {}) {
        return lab_api.v1.locale.get(`dates.${ key }`, { data, noRender });
    }

    // durationSince:
    // Norwegian structure: '{{count}} {{period}} {{ago}}' // 3 days ago
    // Spanish structure: '{{ago}} {{count}} {{period}}' // ago 3 days
    timestampToNiceDate(timestamp, shortFormat = false) {
        const dateNow = new Date().getTime();
        const dateInput = new Date(timestamp * 1000).getTime() - 0;
        const dateDiff = parseInt(((dateNow - dateInput) / 1000) / 60, 10); // Minutes.

        // Minutes. Less than 1 hour
        if (dateDiff < 60) {
            if (dateDiff < 1) {
                return this.str('now');
            }
            return this.str('durationSince', {
                data: {
                    count: dateDiff,
                    // eslint-disable-next-line no-nested-ternary
                    period: shortFormat ? this.str('min') : (dateDiff === 1 ? this.str('minute') : this.str('minutes')),
                    ago: shortFormat ? '' : this.str('ago')
                }
            });
        }

        // Hours. Less than 1 day
        if (dateDiff < 1440) {
            const count = parseInt((dateDiff / 60), 10);
            return this.str('durationSince', {
                data: {
                    count,
                    period: count === 1 ? this.str('hour') : this.str('hours'),
                    ago: shortFormat ? '' : this.str('ago')
                }
            });
        }

        // Days. Less than 1 month
        if (parseInt(dateDiff / (60 * 24), 10) < 30) {
            const count = parseInt(dateDiff / (60 * 24), 10);
            return this.str('durationSince', {
                data: {
                    count,
                    period: count === 1 ? this.str('day') : this.str('days'),
                    ago: shortFormat ? '' : this.str('ago')
                }
            });
        }

        // Date. More than one month
        return this.format(
            this.timestampToDate(timestamp),
            this.str('monthdayyear', { noRender: true })
        );
    }

}
