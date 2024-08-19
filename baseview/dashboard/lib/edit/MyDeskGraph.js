

var MyDeskGraph = function(container, data, days) {

    if (!container) return;
    if (!data) return;

    // Create emty slots for all days
    if (!days) days = 14;
    var dayList = {};
    var dateHander = new Labrador.Date.DateTime();
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    for (var i = 0; i < days; i++) {
        currentDate.setDate(currentDate.getDate() - 1);
        var currentDay = parseInt(dateHander.formattedDate(currentDate, "Ymd"), 10);
        dayList[currentDay] = {
            value: 0,
            label: dateHander.formattedDate(currentDate, "m/d")
        };
    }

    container.innerHTML = "";

    // (int) 2016-06-21T11:50:59+02:00 -> 20160621
    var dayFromDate = function(dateString) {
        return parseInt(dateString.substring(0, 10).replace(/-/g, ''), 10);
    };

    var newStatElementy = function(value, label, maxValue) {
        var percentValue = value ? Math.round((value / maxValue) * 100) : 0;
        var el = document.createElement("span");
        el.setAttribute("style", "height:" + percentValue + "%");
        el.setAttribute("data-value", value);
        el.setAttribute("data-label", label);
        return el;
    };

    var maxVal = 0;

    for (var i = 0; i < data.length; i++) {
        var day = dayFromDate(data[i].date);
        if (typeof(dayList[day]) !== "undefined") {
            dayList[day].value ++;
            if (dayList[day].value > maxVal) maxVal = dayList[day].value;
        }
    }

    for (var day in dayList) {
        container.appendChild(
            newStatElementy(dayList[day].value, dayList[day].label, maxVal)
        );
    }
};
