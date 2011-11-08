var express = require('express');
var everyauth = require('everyauth');
var mongoose = require('mongoose');

var conf = require('./conf');

var routes = require('./routes');

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

app.get('/orgs', routes.orgs.list);
app.get('/create-org', routes.orgs.create);
app.get('/orgs/:slug', routes.orgs.details);
app.put('/orgs', routes.orgs.post);

app.get('/events', routes.events.list);
app.get('/create-event', routes.events.create);
app.get('/events/:_id', routes.events.details);
app.put('/events', routes.events.post);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
