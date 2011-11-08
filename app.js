var express = require('express');
var everyauth = require('everyauth');
var mongoose = require('mongoose');
var async = require('async');

var conf = require('./conf');

var models = require('./lib/models');
var auth = require('./lib/auth');

mongoose.connect(conf.mongo.uri);

everyauth.password
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login')
    .authenticate(auth.authenticate)
    .loginSuccessRedirect('/')
    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register')
    .extractExtraRegistrationParams(function (req) {
        return {
            userParams: req.body.userParams,
        };
    })
    .validateRegistration(auth.validateRegistration)
    .registerUser(auth.registerUser)
    .registerSuccessRedirect('/');

var app = module.exports = express.createServer();

everyauth.helpExpress(app);

// Configuration

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: conf.session.secret,
    }));
    app.use(everyauth.middleware());
    app.use(auth.middleware());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});


app.dynamicHelpers({
    user: function(req, res) {
        return req.user;
    },
});

// Routes

app.get('/', function(req, res) {
    res.redirect('/orgs');
});

app.get('/orgs', function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Org.find({}, cb);
        },
    ], function(err, orgs) {
        if (err) {
            return next(err);
        }
        res.render('orgs', {
            title: 'All Organizations',
            orgs: orgs,
        });
    });
});

app.get('/orgs/:slug', function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Org.findOne({slug: req.params.slug}, cb);
        },
    ], function(err, org) {
        if (err) {
            return next(err);
        }
        if (!org) {
            return res.send(404);
        }
        res.render('org', {
            title: org.name,
            flash: req.flash().info,
            description: org.description,
        });
    });
});

app.put('/orgs', function(req, res, next) {
    async.waterfall([
        function(cb) {
            var org = new models.Org({
                name: req.body.name,
                description: req.body.desc,
                slug: req.body.slug,
            });
            org.save(cb);
        },
    ], function(err) {
        if (err) {
            return next(err);
        }
        req.flash('info', 'Org created: ' + req.body.name);
        res.redirect('/orgs/' + req.body.slug);
    });
});

app.get('/create-org', function(req, res) {
    res.render('create-org', {
        title: 'Create New Org'
    });
});

app.put('/events', function(req, res, next) {
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
        req.flash('info', 'Event created: ' + req.body.title);
        res.redirect('/events/' + event._id);
    });
});

app.get('/create-event', function(req, res, next) {
    models.Org.find({}, function(err, orgs) {
        if(err) {
            return next(err);
        }
        res.render('create-event', {
            title: 'Create New Event',
            orgs: orgs, 
        });
    });
});

app.get('/events/:_id', function(req, res, next) {
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
            flash: req.flash().info,
            event: event,
            org: org,
            place: place,
            attendees: attendees,
        });
    });
});


app.get('/events', function(req, res, next) {
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
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
