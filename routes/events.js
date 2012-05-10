var async = require('async');
var models = require('../lib/models');

var ONE_HOUR = 1000 * 60 * 60;
var ONE_WEEK = ONE_HOUR * 24 * 7;

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
            if (org.admins.indexOf(req.user.id) >= 0) {
                return cb();
            }
            return res.send(403);
        },
        function(cb) {
            if (!req.body.end_time || (req.body.start_time
                    && req.body.end_time < req.body.start_time)) {
                req.body.start_time = new Date(req.body.start_time);
                if (req.body.start_time != 'Invalid Date') {
                    req.body.end_time = +req.body.start_time + ONE_HOUR;
                } else {
                    return next('Invalid start time');
                }
            }
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
        req.flash('success', 'Event created: %s', req.body.title);
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
                res.send(403);
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
        req.flash('success', 'Event deleted: %s', event.title);
        res.redirect('/events/');
    });
};

exports.create = function(req, res, next) {
    models.Org.find({}, function(err, orgs) {
        if(err) {
            return next(err);
        }
        res.render('create-event', {
            event: {},
            orgs: orgs,
            update: false,
        });
    });
};

exports.details = function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params.id}, function(err, event) {
                if (event == null) {
                    return res.send(404);
                } else {
                    cb(err, event);
                }
            });
        },
        function(event, cb) {
            models.Org.findOne({_id: event.org}, function(err, org) {
                if (org == null) {
                    res.send(404);
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
            /*this is a map which looks for user based on the
             * attendees list which exist within the "event" object
             * We now use a combination of a participation and user/guest
             * models to accomplish this. However, this is kept for legacy
             * support purposes - NOTE: if the database is ever restarted,
             * this functionality should be safe to remove! */
            async.map(event.attendees, function(user_id, cb) {
                models.User.findOne({_id: user_id}, cb);
            }, function(err, attendees) {
                cb(err, event, org, place, attendees);
            });
        },
        function(event, org, place, legacy_attendees, cb){
            models.Part.find({'event':event._id}, ['account'],
                function(err, docs){
                    async.map(docs, function(user_id, cb) {
                        models.User.findOne({_id: user_id.account}, function(err,att){
                            cb(null, att);
                        });
                    }, function(err, new_attendees) {
                      async.filter(new_attendees, function(att, fcb){
                        if (att){
                          return fcb(true);
                        }else{
                          return fcb(false);
                        }
                      },function(user_att){
                        cb(err, event, org, place, legacy_attendees, user_att);
                      });
                    });
                }
            );
        },
        function(event,org,place,legacy_attendees,attendees, cb){
          models.Part.find({'event':event._id}, ['account'],
                function(err, docs){
                    async.map(docs, function(user_id, cb) {
                        models.Guest.findOne({_id: user_id.account}, function(err,att){
                            cb(null, att);
                        });
                    }, function(err, new_attendees) {
                      async.filter(new_attendees, function(att, fcb){
                        if (att){
                          return fcb(true);
                        }else{
                          return fcb(false);
                        }
                      },function(guest_att){
                          async.map(docs, function(doc,cb){
                              cb(null, doc.account);
                          }, function(err, final_att){
                              cb(err, event, org, place, legacy_attendees, attendees, guest_att, final_att);
                          });
                      });
                    });
                }
            );
        }
    ], function(err, event, org, place, legacy_attendees, attendees, guests, att_ids) {
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
            att_users: attendees,
            att_guests: guests,
            atts: att_ids,
            legacy:legacy_attendees,
        });
    });
};


exports.list = function(req, res, next) {
    async.waterfall([
        function(cb) {
            var page = req.query.page || 0;
            var limit = 10;
            var q = models.Event.find().populate('org');

            if (page == 0) {
                q = q.where('end_time').gte(+new Date() - ONE_HOUR)
                    .where('start_time').lte(+new Date() + ONE_WEEK)
                    .asc('start_time');
            } else if (page > 0) {
                q = q.where('start_time').gte(+new Date() + ONE_WEEK)
                    .asc('start_time').limit(limit).skip(limit * (page - 1));
            } else if (page < 0) {
                q = q.where('end_time').lte(+new Date() - ONE_HOUR)
                    .desc('start_time').limit(limit).skip(limit * (-page - 1));
            }

            q.run(cb);
        },
        function(events, cb) {
            if (!req.user) {
                return cb(null, events, false);
            }
            models.Org.find()
                    .$where('this.admins.indexOf("' + req.user.id + '") >= 0')
                    .count(function(err, count) {
                return cb(null, events, count > 0);
            });
        },
    ], function(err, events, user_is_admin) {
        if (err) {
            return next(err);
        }

        res.render('events', {
            title: 'Events',
            events: events,
            user_is_admin: user_is_admin,
        });
    });
};

exports.kiosk = function(req,res,next) {
  async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params.id}, function(err, event) {
                if (event == null) {
                    return res.send(404);
                } else {
                    cb(err, event);
                }
            });
        },
        function(event, cb) {
            models.Org.findOne({_id: event.org}, function(err, org) {
                if (org == null) {
                    res.send(404);
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
            /*this is a map which looks for user based on the
             * attendees list which exist within the "event" object
             * We now use a combination of a participation and user/guest
             * models to accomplish this. However, this is kept for legacy
             * support purposes - NOTE: if the database is ever restarted,
             * this functionality should be safe to remove! */
            async.map(event.attendees, function(user_id, cb) {
                models.User.findOne({_id: user_id}, cb);
            }, function(err, attendees) {
                cb(err, event, org, place, attendees);
            });
        },
        function(event, org, place, legacy_attendees, cb){
            models.Part.find({'event':event._id}, ['account'],
                function(err, docs){
                    async.map(docs, function(user_id, cb) {
                        models.User.findOne({_id: user_id.account}, function(err,att){
                            cb(null, att);
                        });
                    }, function(err, new_attendees) {
                      async.filter(new_attendees, function(att, fcb){
                        if (att){
                          return fcb(true);
                        }else{
                          return fcb(false);
                        }
                      },function(user_att){
                        cb(err, event, org, place, legacy_attendees, user_att);
                      });
                    });
                }
            );
        },
        function(event,org,place,legacy_attendees,attendees, cb){
          models.Part.find({'event':event._id}, ['account'],
                function(err, docs){
                    async.map(docs, function(user_id, cb) {
                        models.Guest.findOne({_id: user_id.account}, function(err,att){
                            cb(null, att);
                        });
                    }, function(err, new_attendees) {
                      async.filter(new_attendees, function(att, fcb){
                        if (att){
                          return fcb(true);
                        }else{
                          return fcb(false);
                        }
                      },function(guest_att){
                          async.map(docs, function(doc,cb){
                              cb(null, doc.account);
                          }, function(err, final_att){
                              cb(err, event, org, place, legacy_attendees, attendees, guest_att, final_att);
                          });
                      });
                    });
                }
            );
        }
    ], function(err, event, org, place, legacy_attendees, attendees, guests, att_ids) {
        if (err) {
            return next(err);
        }
        if (!event) {
            return res.send(404);
        }
        res.render('kiosk', {
            event: event,
            org: org,
            place: place,
            att_users: attendees,
            att_guests: guests,
            atts: att_ids,
            legacy:legacy_attendees,
        });
    });
};

/*
        function(event, org, place, legacy_attendees, cb){
          debugger;
            models.Part.find({'event':event._id}, ['account'],
                function(err, docs){
                    async.map(docs, function(user_id, cb) {
                        models.User.findOne({_id: user_id.account}, function(err,att){
                            if(att){
                                cb(null, att);
                            }else{
                                models.Guest.findOne({_id:  user_id.account});
                            }
                        });
                    }, function(err, new_attendees) {
                        cb(err, event, org, place, legacy_attendees, new_attendees);
                    });

                }
            );
        }
    ], function(err, event, org, place, legacy_attendees, attendees ) {
        if (err) {
            return next(err);
        }
        if (!event) {
            return res.send(404);
        }
        console.log(attendees);
        res.render('kiosk', {
            event: event,
            org: org,
            place: place,
            attendees: attendees,
            legacy: legacy_attendees,
        });    
    });
}
*/
exports.guest = function(req, res, next) {
    if (!req.body._type) {
        res.send(400); // Bad Request
    }
    if (req.body._type === 'guest') {
        exports.guest_attend(req, res, next);
    }
};

exports.guest_attend = function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params.id}, cb);
        },
        function(event, cb) {
            models.User.findOne({'email':req.body.email, 'gt_id':req.body.gtid},
                function(err,doc){
                    debugger;
                    if (doc==null){
                        models.Guest.findOne({'email':req.body.email, 'gt_id':req.body.gtid},
                            function(err,guest_doc){
                                var my_doc;
                                if (!guest_doc){
                                    my_doc = new models.Guest({
                                        'email':req.body.email,
                                        'gt_id':req.body.gtid
                                    });
                                    my_doc.save();
                                } else {
                                    my_doc = guest_doc;
                                }
                                cb(null,event, my_doc);
                        });
                    }else{
                        cb(null,event,doc)
                    }
                });
        },
        function(event, user, cb) {
            models.Part.count({'event':event._id, 'account':user._id},
                    function(err, count){
                        if (count==0){
                            var new_part = new models.Part({
                                    'event':event._id,
                                    'account':user._id,
                                    'date':new Date()
                            });
                            new_part.save()
                        }
            });
            cb();
        },
    ], function(err) {
        if (err) {
            return next(err);
        }
        res.redirect(req.url);
    });
};

exports.put = function(req, res, next) {
    if (!req.body._type) {
        res.send(400); // Bad Request
    }
    if (req.body._type === 'attend') {
        exports.attend(req, res, next);
    } else if (req.body._type === 'unattend') {
        exports.unattend(req, res, next);
    } else if (req.body._type === 'update') {
        exports.update(req, res, next);
    } else if (req.body._type === 'unguest'){
        exports.unguest(req, res, next);
    }
};

exports.unguest = function(req,res,next){
    async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params.id}, cb);
        },
        function(event, cb) {
            models.Part.remove({'event':event._id, 'account':req.body.guest},
                function(err){
                    cb();
            });
        },
    ], function(err) {
        if (err) {
            return next(err);
        }
        res.redirect(req.url);
    });
}

exports.attend = function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params.id}, cb);
        },
        function(event, cb) {
            models.Part.count({'event':event._id, 'account':req.user.id},
                function(err,count){
                    if (count==0){
                        var new_part = new models.Part({
                                'event':event._id,
                                'account':req.user.id,
                                'date':new Date()
                        });
                        new_part.save()
                    }
            });
            cb();
        },
    ], function(err) {
        if (err) {
            return next(err);
        }
        res.redirect(req.url);
    });
};

exports.unattend = function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Event.findOne({_id: req.params.id}, cb);
        },
        function(event, cb) {
            models.Part.remove({'event':event._id, 'account':req.user.id},
                function(err){
                    cb();
            });
        },
    ], function(err) {
        if (err) {
            return next(err);
        }
        res.redirect(req.url);
    });
};

exports.update = function(req, res, next) {
    models.Event.findOne({_id: req.params.id}).populate('org')
                .run(function(err, event) {
        if (err) {
            return next(err);
        }
        if (event == null) {
            return res.send(404);
        }
        if ((!req.user || event.org.admins.indexOf(req.user.id) < 0) &&  !req.user.is_admin)  {
          console.log(require("util").inspect(req.user));
            return res.send(403);
        }
        event.title = req.body.title;
        event.start_time = req.body.start_time;
        event.end_time = req.body.end_time;
        event.description = req.body.description;
        event.save();
        res.redirect(req.url);
    });
};

exports.edit = function(req, res, next) {
    models.Event.findOne({_id: req.params.id}, function(err, event) {
        if (err) {
            return next(err);
        }
        if (event == null) {
            return res.send(404);
        }
        res.render('create-event', {
            event: event,
            update: true,
        });
    });
};
