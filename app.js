var express = require('express'),
    app = express(),
    coffee = require('coffee-script'),
    everyauth = require("everyauth"),
    mongoose = require("mongoose"),
    conf = require("./conf"),
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
            next: req.query.next,
            req: req,
            user:req.user
        };
    })
    .respondToLoginSucceed(auth.respondToLoginSucceed)
    .registerLocals(function(req, res) {
        return {
            next: req.query.next,
            req: req,
            user:req.user
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


//config
app.configure(function (){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    everyauth: everyauth
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
});

//development-mode specific config
app.configure('development', function (){
  app.use(express.session({
    secret: conf.session.secret,
  }));
});

//production mode config
app.configure('production', function (){
  var MongoStore = require('connect-mongodb');
  var oneWeek = 60 * 60 * 24 * 7;
  app.use(express.session({
    secret: conf.session.secret,
    store: new MongoStore({
      db: mongoose.connections[0].db,
      reapInterval: oneWeek
    }),
    cookie: {
      maxAge: oneWeek * 1000 //milliseconds
    }
  }));
});

everyauth.helpExpress(app);
//stupid config that I missed when I migrated old code and then spent an hour debugging
app.configure(function() {
    app.use(express.csrf());
    app.use(everyauth.middleware(app));
    app.use(auth.middleware());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});



//aditional development config
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true}));
});

app.configure('production', function(){
  app.use(express.errorHandler({dumpExceptions: true}));
});

//local variables to the app
app.locals({
  messages: require('./lib/bootstrap2-messages'),
  md: require('marked'),
  alcohol: require('./lib/alcohol').stringify
});


//register all routes found in routes file
routes.registerOn(app);

app.listen(conf.port);
//quick message for the masses!
console.log("Express server listening on port %d in %s mode", conf.port, app.settings.env);
