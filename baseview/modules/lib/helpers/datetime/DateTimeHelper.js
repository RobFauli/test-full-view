import words from './words.js';

export class DateTimeHelper {

    constructor(language = 'en', fallbackLanguage = 'en') {
        this.fallbackLanguage = fallbackLanguage;
        this.language = language || fallbackLanguage;
        this.words = words;
        this.timezone = this.getTimezone();
    }

    // (int) Get GMT timezone. Defaults to Western Europe (1)
    // Value can be overridden by config 'timezone' (int or string)
    getTimezone() {
        const configValue = lab_api.v1.config.get('timezone');
        if (configValue !== undefined && !Number.isNaN(configValue) && !Number.isNaN(parseFloat(configValue))) {
            return parseInt(configValue, 10);
        }
        return 1;
    }

    str(key) {
        let { language } = this;
        if (!(key in this.words)) return null;
        if (!(language in this.words[key])) language = this.fallbackLanguage;
        if (!(language in this.words[key])) return null;
        return this.words[key][language];
    }

    /*
    Format  | Output              | Description
    ---     | ---                 | ---
    YY      | 18                  | Two-digit year
    YYYY    | 2018                | Four-digit year
    M       | 1-12                | The month, beginning at 1
    MM      | 01-12               | The month, 2-digits
    MMM     | Jan-Dec             | The abbreviated month name
    MMMM    | January-December    | The full month name
    D       | 1-31                | The day of the month
    DD      | 01-31               | The day of the month, 2-digits
    ddd     | Sun-Sat             | The short name of the day of the week
    dddd    | Sunday-Saturday     | The name of the day of the week
    H       | 0-23                | The hour
    HH      | 00-23               | The hour, 2-digits
    m       | 0-59                | The minute
    mm      | 00-59               | The minute, 2-digits
    s       | 0-59                | The second
    ss      | 00-59               | The second, 2-digits
    */
    // https://day.js.org/docs/en/display/format

    // 'template' is a standard Mustache template: 'Year: {{ YYYY }}, month: {{ MM }}, day: {{ DD }}'
    format(date, template) {
        return Mustache.render(template, {
            YYYY: () => date.getFullYear(),                                     // (2022)
            YY: () => `${ date.getFullYear() }`.slice(-2),                      // (22)
            MM: () => (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1), // (08)
            M: () => date.getMonth() + 1,                                       // (8)
            D: () => date.getDate(),                                            //
            DD: () => (date.getDate() < 10 ? '0' : '') + date.getDate(),
            H: () => date.getHours(),
            HH: () => (date.getHours() < 10 ? '0' : '') + date.getHours(),
            m: () => date.getMinutes(),
            mm: () => (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(),
            s: () => date.getSeconds(),
            ss: () => (date.getSeconds() < 10 ? '0' : '') + date.getSeconds(),
            dddd: () => this.weekday(date, false),
            ddd: () => this.weekday(date, false, 3),
            MMMM: () => this.monthName(date, false),
            MMM: () => this.monthName(date, false, 3),
            W: () => this.weekNumber(date, true, true),
            WW: () => this.weekNumber(date, true, false)
        });
    }

    // 'template' is a standard Mustache template: 'Year: {{ YYYY }}, month: {{ MM }}, day: {{ DD }}'
    utcFormat(date, template) {
        const realDate = this.correctDate(date);
        return Mustache.render(template, {
            YYYY: () => realDate.getUTCFullYear(),                                     // (2022)
            YY: () => `${ realDate.getUTCFullYear() }`.slice(-2),                      // (22)
            MM: () => (realDate.getUTCMonth() < 9 ? '0' : '') + (realDate.getUTCMonth() + 1), // (08)
            M: () => realDate.getUTCMonth() + 1,                                       // (8)
            D: () => realDate.getUTCDate(),                                            //
            DD: () => (realDate.getUTCDate() < 10 ? '0' : '') + realDate.getUTCDate(),
            H: () => realDate.getUTCHours(),
            HH: () => (realDate.getUTCHours() < 10 ? '0' : '') + realDate.getUTCHours(),
            m: () => realDate.getUTCMinutes(),
            mm: () => (realDate.getUTCMinutes() < 10 ? '0' : '') + realDate.getUTCMinutes(),
            s: () => realDate.getUTCSeconds(),
            ss: () => (realDate.getUTCSeconds() < 10 ? '0' : '') + realDate.getUTCSeconds(),
            dddd: () => this.weekday(realDate, true),
            ddd: () => this.weekday(realDate, true, 3),
            MMMM: () => this.monthName(realDate, true),
            MMM: () => this.monthName(realDate, true, 3),
            W: () => this.weekNumber(realDate, true, true),
            WW: () => this.weekNumber(realDate, true, false)
        });
    }

    formattedDate(date, inputFormat, prependZeroDate = true, prependZeroTime = true) {
        let format = inputFormat || '';
        format = format.replace('Y', date.getFullYear());
        format = format.replace('m', (prependZeroDate && date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1));
        format = format.replace('d', (prependZeroDate && date.getDate() < 10 ? '0' : '') + date.getDate());
        format = format.replace('H', (prependZeroTime && date.getHours() < 10 ? '0' : '') + date.getHours());
        format = format.replace('i', (prependZeroTime && date.getMinutes() < 10 ? '0' : '') + date.getMinutes());
        format = format.replace('s', date.getSeconds());
        format = format.replace('l', this.weekday(date, false));
        format = format.replace('D', this.weekday(date, false, 3));
        format = format.replace('F', this.monthName(date, false));
        format = format.replace('M', this.monthName(date, false, 3));
        return format;
    }

    formattedUtcDate(date, inputFormat, prependZeroDate = true, prependZeroTime = true) {
        const realDate = this.correctDate(date);
        let format = inputFormat || '';
        format = format.replace('Y', realDate.getUTCFullYear());
        format = format.replace('m', (prependZeroDate && realDate.getUTCMonth() < 9 ? '0' : '') + (realDate.getUTCMonth() + 1));
        format = format.replace('d', (prependZeroDate && realDate.getUTCDate() < 10 ? '0' : '') + realDate.getUTCDate());
        format = format.replace('H', (prependZeroTime && realDate.getUTCHours() < 10 ? '0' : '') + realDate.getUTCHours());
        format = format.replace('i', (prependZeroTime && realDate.getUTCMinutes() < 10 ? '0' : '') + realDate.getUTCMinutes());
        format = format.replace('s', realDate.getUTCSeconds());
        format = format.replace('l', this.weekday(realDate, true));
        format = format.replace('D', this.weekday(realDate, true, 3));
        format = format.replace('F', this.monthName(realDate, true));
        format = format.replace('M', this.monthName(realDate, true, 3));
        return format;
    }

    correctDate(date) {
        return this.manipulateTime(date, this.isSummerTime(date) ? this.timezone + 1 : this.timezone);
    }

    utcDate(date) {
        return this.unmanipulateTime(date, this.isSummerTime(date) ? this.timezone + 1 : this.timezone);
    }

    timestampToDate(timestamp) {
        return new Date(timestamp * 1000);
    }

    toTimestamp(date) {
        return Math.round(date.getTime() / 1000);
    }

    parseDate(str) {
        const year = str.substr(0, 4);
        const month = str.substr(4, 2) - 1;
        const day = str.substr(6, 2);

        const date = new Date(year, month, day);

        // Note: Use sloppy compare (==)
        const isValidYear = date.getFullYear() == year;
        const isValidMonth = date.getMonth() == month;
        const isValidDay = date.getDate() == day;

        return (isValidYear && isValidMonth && isValidDay)
            ? date
            : 'invalid date';
    }

    weekday(date, isUtc = false, charCount = 9) {
        const weekdays = [
            this.str('sunday'),
            this.str('monday'),
            this.str('tuesday'),
            this.str('wednesday'),
            this.str('thursday'),
            this.str('friday'),
            this.str('saturday')
        ];
        return (weekdays[isUtc ? date.getUTCDay() : date.getDay()] || '').substr(0, charCount);
    }

    monthName(date, isUtc = false, charCount = 10) {
        const months = [
            this.str('january'),
            this.str('february'),
            this.str('mars'),
            this.str('april'),
            this.str('may'),
            this.str('june'),
            this.str('july'),
            this.str('august'),
            this.str('september'),
            this.str('october'),
            this.str('november'),
            this.str('december')
        ];
        return (months[isUtc ? date.getUTCMonth() : date.getMonth()] || '').substr(0, charCount);
    }

    weekNumber(date, isUtc = false, shortFormat = true) {
        const tdt = new Date(date.valueOf());
        const dayn = ((isUtc ? date.getUTCDay() : date.getDay()) + 6) % 7;
        tdt.setDate(tdt.getDate() - dayn + 3);
        const firstThursday = tdt.valueOf();
        tdt.setMonth(0, 1);
        if (tdt.getDay() !== 4) {
            tdt.setMonth(0, 1 + (((4 - tdt.getDay()) + 7) % 7));
        }
        const wn = 1 + Math.ceil((firstThursday - tdt) / 604800000);
        return (!shortFormat && wn < 10 ? '0' : '') + wn;
    }

    timestampToNiceDate(timestamp, shortFormat = false) {
        const labels = {
            ago: shortFormat ? '' : this.str('ago'),
            now: this.str('now'),
            minute: shortFormat ? this.str('min') : this.str('minutes'),
            minutes: shortFormat ? this.str('min') : this.str('minutes'),
            hour: this.str('hour'),
            hours: this.str('hours'),
            day: this.str('day'),
            days: this.str('days')
        };

        const dateNow = new Date().getTime();
        const dateInput = new Date(timestamp * 1000).getTime() - 0;
        const dateDiff = parseInt(((dateNow - dateInput) / 1000) / 60, 10); // Minutes.

        if (dateDiff < 60) { // Less than 1 hour.
            if (dateDiff < 1) {
                return labels.now;
            }
            if (dateDiff == 1) {
                return `1 ${ labels.minute } ${ labels.ago }`;
            }
            return `${ dateDiff } ${ labels.minutes } ${ labels.ago }`;
        }

        if (dateDiff < 1440) { // Less than 1 day.
            if (parseInt((dateDiff / 60), 10) == 1) {
                return `1 ${ labels.hour } ${ labels.ago }`;
            }
            return `${ parseInt((dateDiff / 60), 10)  } ${ labels.hours } ${ labels.ago }`;
        }

        if (parseInt(dateDiff / (60 * 24), 10) < 30) { // Less than 1 month.
            if (parseInt(dateDiff / (60 * 24), 10) == 1) { // 1 or more days.
                return `1 ${ labels.day } ${ labels.ago }`;
            }
            return `${ parseInt(dateDiff / (60 * 24), 10) } ${ labels.days } ${ labels.ago }`;
        }

        return this.format(
            this.timestampToDate(timestamp),
            this.str('monthdayyear')
        );
    }

    isSummerTime(date) {
        function lastSunday(month, year) {
            const d = new Date();
            const lastDayOfMonth = new Date(Date.UTC(year || d.getFullYear(), month + 1, 0));
            const day = lastDayOfMonth.getDay();
            return new Date(Date.UTC(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate() - day));
        }
        const d = date || new Date();
        const starts = lastSunday(2, d.getFullYear());
        starts.setHours(1);
        const ends = lastSunday(9, d.getFullYear());
        starts.setHours(1);
        return d.getTime() >= starts.getTime() && d.getTime() < ends.getTime();
    }

    manipulateTime(date, hours) {
        return new Date(date.getTime() + (hours * 60 * 60 * 1000));
    }

    unmanipulateTime(date, hours) {
        return new Date(date.getTime() - (hours * 60 * 60 * 1000));
    }

}
