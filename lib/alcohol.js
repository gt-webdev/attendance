/*
 * alcohol.js - making your Date's pretty
 */

var ONE_DAY = 1000 * 60 * 60 * 24;
var ONE_WEEK = ONE_DAY * 7;
var WEEKDAYS = ['Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'];

var format_time = function(date) {
    var h = date.getHours();
    var m = date.getMinutes();

    var ampm;

    if (h < 12) {
        ampm = "am";
    } else {
        h = h - 12;
        ampm = "pm";
    }

    if (h == 0) {
        h = 12;
    }

    return h + ":" + m + " " + ampm;
};

var past_date = function(date) {
    var now = new Date();

    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var day_of_date = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (today == day_of_date) { // today
        return "today at " + format_time(date);
    }
    if (today - day_of_date == ONE_DAY) { // yesterday
        return "yesterday at " + format_time(date);
    }

    return (date.getMonth() + 1) + "/" +
        (date.getDate() + 1) + "/" +
        date.getFullYear();
};

var future_date = function(date) {
    var now = new Date();
    var diff = now - date;

    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var day_of_date = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (today == day_of_date) { // today
        return "today at " + format_time(date);
    }
    if (day_of_date - today == ONE_DAY) { // tomorrow
        return "tomorrow at " + format_time(date);
    }

    if (date - today < ONE_WEEK) {
        return WEEKDAYS[date.getDay()] + " at " + format_time(date);
    }

    return (date.getMonth() + 1) + "/" +
        (date.getDate() + 1) + "/" +
        date.getFullYear();
};

exports.stringfy = function(date) {
    if (new Date() - date > 0) {
        return past_date(date);
    } else {
        return future_date(date);
    }
};