import { DateTimeHelper } from '../../lib/helpers/datetime/DateTimeHelper.js';

export default class Tvguide {

    constructor(api) {
        this.api = api;
    }

    onRender(model, view) {
        const tvArray = view.get('external.tv');
        if (!tvArray || !tvArray.length) {
            return;
        }
        const data = tvArray[0];
        const dateHandler = new DateTimeHelper(lab_api.v1.config.get('lang'));

        // Input date:
        // 2021-06-01T00:00:00000+0000
        // Note: '00000' must be replaced by '00.000' to create a js Date-object (new Date(2021-06-01T00:00:00.000+0000))
        const dateFormatter = (dateString, format = 'd/m Y H:i') => {
            const d = new Date(dateString);
            return dateHandler.formattedUtcDate(d, format);
        };

        const formatDateString = (dateString) => dateString.replace('00000+', '00.000+');

        const isDateBeforeToday = (date) => {
            const newDate = new Date(date.toUTCString().split(' ').slice(0, 4).join(' '));
            const currentDate = new Date(new Date().toUTCString().split(' ').slice(0, 4)
                .join(' '));
            return newDate < currentDate;
        };

        // Adjust for summertime
        const summerTimeHandler = (date) => {
            const isSummerTime = dateHandler.isSummerTime(date);
            if (isSummerTime) {
                return dateHandler.manipulateTime(date, 1);
            }
            return date;
        };

        // Get correct date, affedted by summertime
        const getProgrammeDate = (dateString) => {
            const d = new Date(dateString);
            const date = `${  d.getUTCFullYear()  }${ (`0${  d.getUTCMonth() + 1 }`).slice(-2)  }${ (`0${  d.getUTCDate() }`).slice(-2) }`;
            return date;
        };

        // Clean up data from integration-services:
        const programme = data.programme.filter((item) => {
            let d = new Date(formatDateString(item.start));
            d = summerTimeHandler(d);

            // Filter out programmes before current date
            if (isDateBeforeToday(d)) {
                return false;
            }
            return true;
        }).map((item) => {
            const d = summerTimeHandler(new Date(formatDateString(item.start))).toUTCString();
            return {
                start: dateFormatter(d, 'H:i'),     // 2021-06-01T00:00:00000+0000 -> 01/06 2021 00:00
                // stop: item.stop,                 // 2021-06-01T01:00:00000+0000
                icon: item.icon[0].src,             // https://d537y3nbkeq75.cloudfront.net/gbnews/epg/20210601000000-20210601010000-1069.jpg?width=1920&lang=en
                title: item.title[0]._,
                desc: item.desc[0]._,
                date: getProgrammeDate(d)           // "20210601"
            };
        });

        const groupedByDate = {};
        for (const item of programme) {
            if (!groupedByDate[item.date]) {
                const d = dateHandler.parseDate(item.date);
                groupedByDate[item.date] = {
                    date: dateHandler.formattedDate(d, 'd/m Y'),
                    items: []
                };
            }
            groupedByDate[item.date].items.push(item);
        }

        model.setFiltered('tvguide', Object.values(groupedByDate));
    }

}
