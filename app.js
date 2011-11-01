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

app.configure(function(){
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

app.get('/orgs/:slug', function(req, res) {
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
        title: 'Create new org'
    });
});

app.get('/events', function(req, res, next) {
    async.waterfall([
        function(cb) {
            models.Event.find({}, cb);
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

app.listen(4000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
