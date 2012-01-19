var vows = require('vows');
var assert = require('assert');

var alcohol = require('../lib/alcohol');

var ONE_DAY = 1000 * 60 * 60 * 24;
var ONE_MINUTE = 1000 * 60;

vows.describe('alcohol.js').addBatch({
    'A Date way in the past': {
        topic: new Date(2000, 10 - 1, 2 - 1),

        'should display as just the date': function(date) {
            assert.equal(alcohol.stringify(date), '10/2/2000');
        },
    },
    'A Date yesterday': {
        topic: function(date) {
            var d = new Date(date - ONE_DAY);
            d.setHours(15);
            d.setMinutes(00);
            return d;
        }(new Date()),

        'should display as "yesterday at " plus a time': function(date) {
            assert.equal(alcohol.stringify(date), 'yesterday at 3:00 pm');
        },
    },
    'A Date in the past in the AM': {
        topic: function(date) {
            var d = new Date(date - ONE_DAY);
            d.setHours(3);
            d.setMinutes(14);
            return d;
        }(new Date()),

        'should display with an "am"': function(date) {
            assert.match(alcohol.stringify(date), /\d?\d:\d\d am/);
        },
    },
    'A Date in the past in the PM': {
        topic: function(date) {
            var d = new Date(date - ONE_DAY);
            d.setHours(15);
            d.setMinutes(14);
            return d;
        }(new Date()),

        'should display with an "pm"': function(date) {
            assert.match(alcohol.stringify(date), /\d?\d:\d\d pm/);
        },
    },
    'A Date in the future in the AM': {
        topic: function(date) {
            var d = new Date(date.valueOf() + ONE_DAY);
            d.setHours(3);
            d.setMinutes(14);
            return d;
        }(new Date()),

        'should display with an "am"': function(date) {
            assert.match(alcohol.stringify(date), /\d?\d:\d\d am/);
        },
    },
    'A Date in the future in the PM': {
        topic: function(date) {
            var d = new Date(date.valueOf() + ONE_DAY);
            d.setHours(15);
            d.setMinutes(14);
            return d;
        }(new Date()),

        'should display with an "pm"': function(date) {
            assert.match(alcohol.stringify(date), /\d?\d:\d\d pm/);
        },
    },
    'A Date earlier today': {
        topic: new Date(new Date() - ONE_MINUTE),

        'should display with "today at" plus a time': function(date) {
            assert.match(alcohol.stringify(date), /today at \d?\d:\d\d (am|pm)/);
        },
    },
    'A Date later today': {
        topic: new Date(new Date() + ONE_MINUTE),

        'should display with "today at" plus a time': function(date) {
            assert.match(alcohol.stringify(date), /today at \d?\d:\d\d (am|pm)/);
        },
    },
    'A Date tomorrow': {
        topic: function(date) {
            var d = new Date(date.valueOf() + ONE_DAY);
            return d;
        }(new Date()),

        'should display with "tomorrow at" plus a time': function(date) {
            assert.match(alcohol.stringify(date), /tomorrow at \d?\d:\d\d (am|pm)/);
        },
    },
    'A Date after tomorrow before next week': {
        topic: function(date) {
            var d = new Date(date.valueOf() + 2 * ONE_DAY);
            return d;
        }(new Date()),

        'should display with a day of the week plus a time': function(date) {
            assert.match(alcohol.stringify(date), /.+day at \d?\d:\d\d (am|pm)/);
        },
    },
}).export(module);