import { DateTimeHelper } from '../../lib/helpers/datetime/DateTimeHelper.js';

/**
 * @typedef {string}
 * @enum {TEST_METHODS}
 */
export const TEST_METHODS = {
    CLICK_RATIO_95_QUICK_EXIT: 'clickratio95qe',
    CLICK_RATIO_95: 'clickratio95'
};

export class AbTest {

    /**
     * @param {string} [data.id]
     * @param {string} [data.placeId]
     * @param {string} [data.status]
     * @param {{TEST_METHODS}} [data.testMethod]
     * @param {string} [data.url]
     * @param {string} [data.start]
     * @param {string} [data.end]
     * @param {Object<string, *>} [data.results]
     * @param {boolean} [data.published]
     * @param {boolean} [data.includeOriginal]
     */
    constructor(data = {}) {
        this.id = data.id || null;
        this.placeId = data.placeId || null;
        this.status = data.status || 'Not started';
        this.testMethod = data.testMethod || TEST_METHODS.CLICK_RATIO_95_QUICK_EXIT;
        this.url = data.url || '';
        this.start = data.start || '';
        this.end = data.end || '';
        this.results = data.results || {};
        this.published = !!data.published || false;
        this.dateTimeHelper = new DateTimeHelper(lab_api.v1.config.get('lang') || 'no');
        this.includeOriginal = data.includeOriginal !== false;
    }

    static getTestMethods() {
        return [
            { key: TEST_METHODS.CLICK_RATIO_95, description: 'Click-ratio 95%' },
            { key: TEST_METHODS.CLICK_RATIO_95_QUICK_EXIT, description: 'Click-ratio 95% (ignoring quick exit)' }
        ];
    }

    get correct_start() {
        return this.toLocalDateString((this.start !== '') ? new Date(this.start) : '');
    }

    get correct_end() {
        return this.toLocalDateString((this.end !== '') ? new Date(this.end) : '');
    }

    isFinished() {
        return ['finished', 'inconclusive', 'stopped', 'concluded'].includes(this.status);
    }

    isRunning() {
        return (this.status === 'running');
    }

    toLocalDateString(date) {
        if (!date) {
            return '';
        }
        return new Date(date.getTime() + new Date().getTimezoneOffset() * -60 * 1000).toISOString().slice(0, 19);
    }

    serialize(preparedVariants) {
        const startDate = (this.start !== '') ? new Date(this.start) : '';
        const endDate = (this.end !== '') ? new Date(this.end) : '';
        const variants = [];
        if (this.includeOriginal) {
            // We need to add an item for the original article-teaser in data we send to Kilkaya
            // Client side it is identified as 'original' and we'll use the version rendered server side.
            variants.push({
                vid: 1,
                active: this.includeOriginal,
                data: [
                    { name: 'title', value: 'Original article' },
                    { name: 'identifier', value: 'original' }
                ],
                name: 'Original article'
            });
        }
        let cc = 2;
        for (const [variant] of preparedVariants) {
            variants.push({
                vid: cc,
                active: !variant.state.disabled,
                data: [
                    { name: 'title', value: variant.data.contentdata.fields.title.value },
                    { name: 'identifier', value: variant.guid }
                ],
                name: variant.name
            });
            cc += 1;
        }
        return {
            id: this.id,
            placeId: this.placeId,
            status: this.status,
            testMethod: this.testMethod,
            url: this.url,
            start: (startDate !== '') ? startDate.toISOString().slice(0, 19) : '',
            end: (endDate !== '') ? endDate.toISOString().slice(0, 19) : '',
            published: this.published,
            variants: JSON.stringify(variants)
        };
    }

    updateTestData(data) {
        for (const key in data) {
            if (key === 'url' && data[key] === null) {
                continue;
            }
            this[key] = data[key];
        }
    }

    shouldSave() {
        if (this.start !== '' || this.end !== '') {
            return true;
        }

        return false;
    }

}
