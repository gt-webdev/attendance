var async = require('async');
var models = require('../lib/models');

exports.post = function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Org.findOne({_id: req.body.org}, cb);
        },
        function(org, cb) {
            // to make an event, must be either an admin
            if (req.user.is_admin) {
                return cb();
            }
            // or an admin of the Org
            if (org.admins.indexOf(req.user.id)) {
                return cb();
            }
            return cb('User is not an admin of this Org');
        },
        function(cb) {
            var event = new models.Event({
                title: req.body.title,
                org: req.body.org,
                start_time: req.body.start_time,
                end_time: req.body.end_time,
                description: req.body.description,
            });
            event.save(function(err) {
                cb(err, event);
            });
        },
    ], function(err, event) {
        if (err) {
            return next(err);
        }
        req.flash('info', 'Event created: %s', req.body.title);
        res.redirect('/events/' + event._id);
    });
};

exports.delete = function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params.id}, cb);
        },
        function(event, cb) {
            models.Org.findOne({_id: event.org}, function(err, org) {
                if (err) {
                    return cb(err);
                }
                if (req.user.is_admin ||
                        (org && org.admins.indexOf(req.user.id) != -1)) {
                    return cb(null, event);
                }
                cb('User does not have permissions to delete this event');
            });
        },
        function(event, cb) {
            models.Event.remove({_id: event.id}, function(err) {
                cb(err, event);
            });
        },
    ], function(err, event) {
        if (err) {
            return next(err);
        }
        req.flash('info', 'Event deleted: %s', event.title);
        res.redirect('/events/');
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
            models.Event.findOne({_id: req.params.id}, function(err, event) {
                if (event == null) {
                    cb('Event not found');
                } else {
                    cb(err, event);
                }
            });
        },
        function(event, cb) {
            models.Org.findOne({_id: event.org}, function(err, org) {
                if (org == null) {
                    cb('Org not found');
                } else {
                    cb(err, event, org);
                }
            });
        },
        function(event, org, cb) {
            models.Place.findOne({_id: event.place}, function(err, place) {
                cb(err, event, org, place);
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

exports.attend = function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params.id}, cb);
        },
        function(event, cb) {
            if (event.attendees.indexOf(req.user.id) < 0
                    && (!event.passkey || event.passkey === req.body.passkey)) {
                event.attendees.push(req.user.id);
                event.save();
            }
            cb();
        },
    ], function(err) {
        if (err) {
            return next(err);
        }
        res.redirect(req.url);
    });
};

exports.update = function(req, res, next) {
    if (req.body.type != 'unattend') {
        return next('Unexpected update type');
    }

    async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params.id}, cb);
        },
        function(event, cb) {
            var index = event.attendees.indexOf(req.user.id);
            if (index < 0) {
                return cb('User is not attending this event');
            }
            event.attendees.splice(index, 1);
            event.save();
            cb();
        },
    ], function(err) {
        if (err) {
            return next(err);
        }
        res.redirect(req.url);
    });
};