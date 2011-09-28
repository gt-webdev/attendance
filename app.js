var express = require('express');
var everyauth = require('everyauth');
var mongoose = require('mongoose');

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
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
    res.render('index', {
        title: 'Express'
    });
});

app.get('/orgs', function(req, res){
  // TODO: actually read list of all orgs
  var orgs = [{name: "Name1", desc: "Desc1"}, {name: "Name2", desc: "Desc2"}];

  res.render('orgs', {
    title: 'All Organizations',
    orgs: orgs,
  });
});

app.get('/orgs/:id', function(req, res){
  // TODO: actually read org
  var id = req.params.id;
  var name = "This org's name";

  res.render('orgs', {
    title: 'Organization: ' + name,
    flash: req.flash().info,
  });
});

app.put('/orgs', function(req, res){
  req.flash('info', 'Org created: ' + req.body.name);
  // TODO: actually create org
  var id = 1;
  res.redirect('/orgs/' + id);
});

app.get('/create-org', function(req, res){
  res.render('create-org', {
    title: 'Create new org'
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
