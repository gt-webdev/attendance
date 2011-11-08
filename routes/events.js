var async = require('async');
var models = require('../lib/models');

exports.post = function(req, res, next) {
    var event = new models.Event({
        title: req.body.title,
        org: req.body.org,
        start_time: req.body.start_time,
        stop_time: req.body.end_time,
        description: req.body.desc,
    });
    event.save(function(err) {
        if (err) {
            return next(err);
        }
        req.flash('info', 'Event created: %s', req.body.title);
        res.redirect('/events/' + event._id);
    });
};

exports.create = function(req, res, next) {
    models.Org.find({}, function(err, orgs) {
        if(err) {
            return next(err);
        }
        res.render('create-event', {
            title: 'Create New Event',
            orgs: orgs, 
        });
    });
};

exports.details = function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params._id}, cb);
        },
        function(event, cb) {
            models.Org.findOne({_id: event.org}, function(err, org) {
                cb(err, org, event);
            });
        },
        function(event, org, cb) {
            models.Place.findOne({_id: event.place}, function(err, place) {
                cb(err, org, event, place);
            });
        },
        function(event, org, place, cb) {
            async.map(event.attendees, function(user_id, cb) {
                models.User.findOne({_id: user_id}, cb);
            }, function(err, attendees) {
                cb(err, event, org, place, attendees);
            });
        },
    ], function(err, event, org, place, attendees) {
        if (err) {
            return next(err);
        }
        if (!event) {
            return res.send(404);
        }
        res.render('event', {
            title:  event.title,
            event: event,
            org: org,
            place: place,
            attendees: attendees,
        });
    });
};

exports.list = function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Event.find({}, cb);
        },
        function(events, cb) {
            async.map(events, function(event, cb) {
                models.Org.findOne({_id: event.org}, cb);
            }, function(err, orgs) {
                cb(err, events, orgs);
            });
        },
        function(events, orgs, cb) {
            cb(null, events.map(function(x,i) {
                return {
                    event: x,
                    org: orgs[i],
                };
            }));
        },
    ], function(err, events) {
        if (err) {
            return next(err);
        }

        res.render('events', {
            title: 'Events',
            events: events,
        });
    });
};