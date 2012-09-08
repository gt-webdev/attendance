var express = require('express'),
    app = express(),
    coffee = require('coffee-script'),
    everyauth = require("everyauth"),
    mongoose = require("mongoose"),
    conf = require("./conf"),
    routes = require('./routes'),
    models = require('./lib/models'),
    auth = require('./lib/auth'),
    MongoStore = require('connect-mongodb'),
    mongo = require('mongodb'),
    remote_db = null,
    User = models.User;

//connect to db
mongoose.connect(conf.mongo.uri);

//connect to db through mongodb
mongo.connect(conf.mongo.uri, {}, function(err, db){
  if (err){
    return;
  }
  remote_db = db;
});


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
            user: req.user,
            messages: require("./lib/bootstrap2-messages")
        };
    })
    .respondToLoginSucceed(auth.respondToLoginSucceed)
    .registerLocals(function(req, res) {
        return {
            next: req.query.next,
            req: req,
            user: req.user,
            messages: require("./lib/bootstrap2-messages")
        };
    })
    .respondToRegistrationSucceed(auth.respondToRegistrationSucceed)
    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register')
    .extractExtraRegistrationParams(function(req) {
        return {
            userParams: req.body.userParams,
        };
    })
    .validateRegistration(auth.validateRegistration)
    .registerUser(auth.registerUser);

everyauth.everymodule.findUserById( function(req, userId, callback){
  User.findOne({_id: userId}, function(err, user) {
    if (err) {
      callback(err);
      return;
    }
    callback(false, user);
  });
});

//config
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
});

//development-mode specific config
app.configure('development', function(){
  app.use(express.session({
    secret: conf.session.secret,
  }));
});

//production mode config
app.configure('production', function(){
  var oneWeek = 60 * 60 * 24 * 7 * 1000;
  app.use(express.session({
    secret: conf.session.secret,
    store: new MongoStore({
      url: conf.mongo.uri,
      reapInterval: oneWeek
    }),
    cookie: {
      maxAge: oneWeek
    }
  }));
});

//everyauth.helpExpress(app);
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
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler({dumpExceptions: true}));
});

//local variables to the app
app.locals({
  messages: require("./lib/bootstrap2-messages"),
  md: require('marked'),
  alcohol: require('./lib/alcohol').stringify,
  jumble: function(str){
    var ere = /(.*?)@/, ret, len;
    if (ere.test(str)){
      ret = ere.exec(str)[1];
      len = ret.length;
      ret = ret.substr(0,3) + "***" + ret.charAt(len - 1) + str.substr(len);
      return ret;
    }
    return "INVILID E-MAIL";
  }
});


//register all routes found in routes file
routes.registerOn(app);

app.listen(conf.port);
//quick message for the masses!
console.log("Express server listening on port %d in %s mode", conf.port, app.settings.env);
console.log("serverinfo", conf.parsedMongo);
