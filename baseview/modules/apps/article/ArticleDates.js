export class ArticleDates {

    constructor(api, params) {
        this.api = api;
        this.rootModel = params.rootModel;
        this.enabled = true;
        this.dom = {
            'fields.published': {
                date: null,
                time: null
            },
            'fields.hidefromfp_time': {
                date: null,
                time: null
            },
            'fields.calendar_start_date': {
                date: null,
                time: null
            },
            'fields.calendar_end_date': {
                date: null,
                time: null
            }
        };
        this.template = `<div class="lab-modal-form lab-grid lab-hidden">

            <div class="lab-formgroup lab-grid">
                <h2 class="lab-title lab-grid-large-12 lab-grid-gap">Published date</h2>
                <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-medium">
                    <label for="publishedDate">Date</label>
                    <input type="date" id="publishedDate" name="fields.published" value="{{ datetime.publishDate }}">
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-medium">
                    <label for="publishedTime">Time</label>
                    <input type="time" id="publishedTime" name="fields.published" value="{{ datetime.publishTime }}">
                </div>
            </div>

            <div class="lab-formgroup lab-grid">
                <h4 class="lab-title lab-grid-large-12 lab-grid-gap">Hide on front after</h4>
                <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-small">
                    <label for="hidefromfp_timeDate">Date</label>
                    <input type="date" id="hidefromfp_timeDate" name="fields.hidefromfp_time" value="{{ datetime.hideDate }}">
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-small">
                    <label for="hidefromfp_timeTime">Time</label>
                    <input type="time" id="hidefromfp_timeTime" name="fields.hidefromfp_time" value="{{ datetime.hideTime }}">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-below-medium">
                    <p class="lab-info">
                        This date affects automatic articles on front pages.
                    </p>
                </div>
            </div>

            <div class="lab-formgroup lab-grid">
                <h4 class="lab-title lab-grid-large-12 lab-grid-gap">Calendar dates</h4>
                <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-medium">
                    <label for="calendar_start_date-date">From Date</label>
                    <input type="date" id="calendar_start_date-date" name="fields.calendar_start_date" value="{{ datetime.calendarFromDate }}">
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-medium">
                    <label for="calendar_start_date-time">From Time</label>
                    <input type="time" id="calendar_start_date-time" name="fields.calendar_start_date" value="{{ datetime.calendarFromTime }}">
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-small">
                    <label for="calendar_end_date-date">To Date</label>
                    <input type="date" id="calendar_end_date-date" name="fields.calendar_end_date" value="{{ datetime.calendarToDate }}">
                </div>
                <div class="lab-formgroup-item lab-grid-large-6 lab-grid-gap lab-space-below-small">
                    <label for="calendar_end_date-time">To Time</label>
                    <input type="time" id="calendar_end_date-time" name="fields.calendar_end_date" value="{{ datetime.calendarToTime }}">
                </div>
                <div class="lab-formgroup-item lab-grid-large-12 lab-grid-gap lab-space-below-medium">
                    <p class="lab-info">
                        The calendar dates are used by elements like <span class="lab-label">Article Calendar</span> and <span class="lab-label">Article Scroller</span> to limit visibility to a date range.
                    </p>
                </div>
            </div>

        </div>`;
    }

    // {"published":1638362580,"hidefromfp_time":1750153380}}]
    // {"calendar_start_date":"2022-03-01T03:00:00Z"}
    // {"calendar_end_date":"2030-03-01T11:59:00Z"}

    // SettingsFront: If section exist: add item to it, if not: create.
    onAside() {
        return {
            section: 'General',
            label: 'Dates'
        };
    }

    onPaths() {
        return {
            'fields.published': {
                node: 'fields.published',
                transformer: (value, pathInfo) => this.dateTransformer(pathInfo)
            },
            'fields.hidefromfp_time': {
                node: 'fields.hidefromfp_time',
                transformer: (value, pathInfo) => this.dateTransformer(pathInfo)
            },
            'fields.calendar_start_date': {
                node: 'fields.calendar_start_date',
                transformer: (value, pathInfo) => this.dateTransformer(pathInfo, false)
            },
            'fields.calendar_end_date': {
                node: 'fields.calendar_end_date',
                transformer: (value, pathInfo) => this.dateTransformer(pathInfo, false)
            }
        };
    }

    dateTransformer(pathInfo, toTimestamp = true) {
        const date = this.dom[pathInfo.node].date.value;
        const time = this.dom[pathInfo.node].time.value;
        if (!date) { return ''; }
        if (toTimestamp) {
            return this.getTimestamp(date, time);
        }
        return `${ new Date(`${ date }T${ time || '00:00' }`).toISOString().split('.')[0] }Z`;
    }

    onMarkup() {
        const datetime = {
            publishDate: '',
            publishTime: '',
            hideDate: '',
            hideTime: '',
            calendarFromDate: '',
            calendarFromTime: '',
            calendarToDate: '',
            calendarToTime: ''
        };

        const published = this.rootModel.get('fields.published'); // timestamp
        const hidefromfp_time = this.rootModel.get('fields.hidefromfp_time'); // timestamp
        const calendar_start_date = this.rootModel.get('fields.calendar_start_date'); // ISO-date
        const calendar_end_date = this.rootModel.get('fields.calendar_end_date'); // ISO-date

        if (published) {
            const dt = this.getDateTime(published);
            datetime.publishDate = dt.date;
            datetime.publishTime = dt.time;
        }
        if (hidefromfp_time) {
            const dt = this.getDateTime(hidefromfp_time);
            datetime.hideDate = dt.date;
            datetime.hideTime = dt.time;
        }
        if (calendar_start_date) {
            const timestamp = new Date(calendar_start_date).valueOf() / 1000;
            const dt = this.getDateTime(timestamp);
            datetime.calendarFromDate = dt.date;
            datetime.calendarFromTime = dt.time;
        }
        if (calendar_end_date) {
            const timestamp = new Date(calendar_end_date).valueOf() / 1000;
            const dt = this.getDateTime(timestamp);
            datetime.calendarToDate = dt.date;
            datetime.calendarToTime = dt.time;
        }

        const markup = this.api.v1.util.dom.renderTemplate(this.template, {
            datetime
        }, true);
        this.dom['fields.published'].date = markup.querySelector('#publishedDate');
        this.dom['fields.published'].time = markup.querySelector('#publishedTime');
        this.dom['fields.hidefromfp_time'].date = markup.querySelector('#hidefromfp_timeDate');
        this.dom['fields.hidefromfp_time'].time = markup.querySelector('#hidefromfp_timeTime');
        this.dom['fields.calendar_start_date'].date = markup.querySelector('#calendar_start_date-date');
        this.dom['fields.calendar_start_date'].time = markup.querySelector('#calendar_start_date-time');
        this.dom['fields.calendar_end_date'].date = markup.querySelector('#calendar_end_date-date');
        this.dom['fields.calendar_end_date'].time = markup.querySelector('#calendar_end_date-time');

        return markup;
    }

    getTimestamp(date, time) {
        const d = new Date(`${ date  }T${  time || '00:00'  }Z`);
        const localDate = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
        return localDate.getTime() / 1000;
    }

    getDateTime(timestamp) {
        const date = new Date(timestamp * 1000);
        let month = date.getMonth() + 1;
        if (month < 10) month = `0${ month }`;
        let day = date.getDate();
        if (day < 10) day = `0${ day }`;
        let hour = date.getHours();
        if (hour < 10) hour = `0${ hour }`;
        let minute = date.getMinutes();
        if (minute < 10) minute = `0${ minute }`;

        return {
            date: `${ date.getFullYear()  }-${  month  }-${  day }`, // yyyy-mm-dd
            time: `${ hour  }:${  minute }` // hh:mm
        };
    }

}
