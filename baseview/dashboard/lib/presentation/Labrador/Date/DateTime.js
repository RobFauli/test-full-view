


var Labrador = Labrador || {};
Labrador.Date = Labrador.Date || {};
Labrador.Date.DateTime = function() {
    
    function formatDate(date, format) {
        
        format = format.replace("Y", date.getFullYear());
        format = format.replace("m", (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1));
        format = format.replace("d", (date.getDate() < 10 ? '0' : '') + date.getDate());
        
        format = format.replace("H", (date.getHours() < 10 ? '0' : '') + date.getHours() );
        //format = format.replace("H", date.getHours());
        format = format.replace("i", (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() );
        format = format.replace("s", date.getSeconds());
       
        return format;
    }

    function timestampToDate(timestamp) {
        return new Date(timestamp*1000);
    }

    function dateToTimestamp(date) {
        return Math.round(date.getTime() / 1000);
    }

    function parseDateString(str) {
        var y = str.substr(0,4),
            m = str.substr(4,2) - 1,
            d = str.substr(6,2);
        var D = new Date(y,m,d);
        return (D.getFullYear() == y && D.getMonth() == m && D.getDate() == d) ? D : 'invalid date';
    }

    // Søndag = 0 ...
    function weekdayFromDate(date, charCount) {
        var weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        return weekdays[date.getDay()].substr(0,charCount);
    }

    return {

        // Eks: var dateString = Labrador.Date.DateTime.formattedDate(date, "Ymd")
        formattedDate: function(date, format) {
            return formatDate(date, format);
        },

        // Eks: var date = Labrador.Date.DateTime.parseDate(20140203);
        parseDate: function(dateString) {
            return parseDateString(dateString);
        },

        weekday: function(date, charCount) {
            return weekdayFromDate(date, charCount);
        },

        toTimestamp: function(date) {
            return dateToTimestamp(date ? date : new Date());
        },

        timestampToNiceDate: function( timestamp, shortFormat ) {
            
            //console.log("timestampToNiceDate: " + timestamp);

            if (typeof(shortFormat) == "undefined") {
                shortFormat = false;
            }

            var labels = {
                ago:        shortFormat ? '' : 'ago',
                now:        'Now',
                minute:     shortFormat ? 'min' : 'minute',
                minutes:    shortFormat ? 'min' : 'minutes',
                hour:       'hour',
                hours:      'hours',
                day:        'day',
                days:       'days'
            };

            var dateNow = new Date().getTime();
            var dateInput = new Date(timestamp * 1000).getTime() - 0;
            var dateDiff = parseInt(((dateNow - dateInput) / 1000) / 60, 10); // Minutes.
        

            if (dateDiff < 60) { // Less than 1 hour.
                if (dateDiff < 1) {
                    return labels.now;
                }
                if (dateDiff == 1) {
                    return '1 ' + labels.minute + ' ' + labels.ago;
                }
                return dateDiff + ' ' + labels.minutes + ' ' + labels.ago;
            }
            if (dateDiff < 1440) { // Less than 1 day.
                if (parseInt((dateDiff / 60), 10) == 1) {
                    return '1 ' + labels.hour + ' ' + labels.ago;
                }
                return parseInt((dateDiff / 60), 10) + ' ' + labels.hours + ' ' + labels.ago;
            }
            if (parseInt(dateDiff / (60 * 24), 10) < 30) { // Less than 1 month.
                if (parseInt(dateDiff / (60 * 24), 10) == 1) { // 1 or more days.
                    return '1 ' + labels.day + ' ' + labels.ago;
                }
                return parseInt(dateDiff / (60 * 24), 10) + ' ' + labels.days + ' ' + labels.ago;
            }

            return formatDate(
                timestampToDate(timestamp), 
                'd.m.Y'
            );

        }

    };

};
