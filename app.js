var coffee = require('coffee-script'),
    express = require('express'),
    everyauth = require('everyauth'),
    mongoose = require('mongoose'),
    conf = require('./conf'),
    routes = require('./routes'),
    models = require('./lib/models'),
    auth = require('./lib/auth');

//connect to db
mongoose.connect(conf.mongo.uri);

//generate authenticate paths and functions
everyauth.password
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login')
    .authenticate(auth.authenticate)
    .loginLocals(function(req, res) {
        return {
            next: req.query.next
        };
    })
    .respondToLoginSucceed(auth.respondToLoginSucceed)
    .registerLocals(function(req, res) {
        return {
            next: req.query.next
        };
    })
    .respondToRegistrationSucceed(auth.respondToRegistrationSucceed)
    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register')
    .extractExtraRegistrationParams(function (req) {
        return {
            userParams: req.body.userParams,
        };
    })
    .validateRegistration(auth.validateRegistration)
    .registerUser(auth.registerUser);

//create express app
var app = module.exports = express.createServer();

//bind everyauth to express
everyauth.helpExpress(app);

// Configuration
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
});

//development mode config
app.configure('development', function() {
    app.use(express.session({
        secret: conf.session.secret,
    }));
});

//production mode condfig: set a limit on the age of cookies, etc.
app.configure('production', function() {
    var MongoStore = require('connect-mongodb');
    var oneWeek = 60 * 60 * 24 * 7;
    app.use(express.session({
        secret: conf.session.secret,
        store: new MongoStore({
          db: mongoose.connections[0].db,
          reapInterval: oneWeek,
        }),
        cookie: {
            maxAge: oneWeek * 1000, // milliseconds - lol javascript
        },
    }));
});

//general config for all modes
app.configure(function() {
    app.use(express.csrf());
    app.use(everyauth.middleware());
    app.use(auth.middleware());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

//more development config
app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//don't show errors on production
app.configure('production', function(){
    app.use(express.errorHandler({ dumpExceptions: true}));
});

app.dynamicHelpers({
    user: function(req, res) {
        return req.user;
    },
    messages: require('./lib/bootstrap2-messages'),
    req: function(req, res) {
        return req;
    },
    md: function(req, res) {
        return require('marked');
    },
    alcohol: function(req, res) {
        return require('./lib/alcohol').stringify;
    },
});

// Routes
routes.registerOn(app);

//start the app
app.listen(conf.port);
//quick message for the masses!
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
