var bcrypt    = require('bcrypt');
var everyauth = require('everyauth');
var mongoose  = require('mongoose');

var models = require('./models');

var User = models.User;

var MAX_LENGTH = 512;

exports.authenticate = function authenticate(login, password) {
    if (!password || !password.length || password.length == 0) {
        return ['Password required'];
    }
    var promise = this.Promise();
    
    User.findOne().or([{gt_userid: login},
                       {email: login},
                       {gt_id: login}]).limit(1).exec(function(err, user) {
        if (err) {
            return promise.fulfill(['Database error while authenticating user']);
        }
        if (!user) {
            return promise.fulfill(['No such user']);
        }
        bcrypt.compare(password, user.password, function(err, res) {
            if (err) {
                return promise.fulfill(['Password check error']);
            }
            if (res) {
                return promise.fulfill(user);
            }
            return promise.fulfill(['Incorrect password']);
        });
        return promise;
    });

    return promise;
};

exports.validateRegistration = function validateRegistration(attribs) {
    var a;
    if (!attribs.password || !attribs.password.length
            || attribs.password.length == 0) {
        return ['Password required'];
    }
    for (a in attribs) {
        if (attribs[a].length && attribs[a].length > MAX_LENGTH) {
            return ['Field too long'];
        }
    }

    var promise = this.Promise();

    User.findOne({gt_userid: attribs.login}, function(err, user) {
        if (err) {
            return promise.fulfill(['Database error while authenticating user']);
        }
        if (user) {
            return promise.fulfill(['User with this GT user name already exists']);
        }
        return promise.fulfill([]);
    });

    return promise;
};

exports.registerUser = function registerUser(attribs) {
    var promise = this.Promise();
    
    bcrypt.genSalt(function(err, salt) {
        if (err) {
            return promise.fulfill(['Error generating salt']);
        }
        bcrypt.hash(attribs.password, salt, function(err, hash) {
            if (err) {
                return promise.fulfill(['Error encrypting password']);
            }
            var user = new User({
                name: {
                    first: attribs.userParams.first_name,
                    last: attribs.userParams.last_name,
                },
                email: attribs.userParams.email,
                is_admin: false,
                gt_id: attribs.userParams.gt_id,
                gt_userid: attribs.login,
                password: hash,
            });
            user.save(function(err) {
                if (err) {
                    return promise.fulfill(['Error creating new user']);
                }
                exports.checkGuest(user, function(){
                  return promise.fulfill(user);
                });
            });
            return promise;
        });
        return promise;
    });
    
    return promise;
};

exports.checkGuest = function(user, cb){
  models.Guest.findOne({'email':user.email, 'gt_id':user.gt_id}, function(err, guest){
    if (err){
      cb();
    }else if (guest){
      models.Part.update({'account':guest.id}, {$set:{'account':user.id}},function(err){
        models.Guest.remove({'email':user.email, 'gt_id':user.gt_id},function(err){
          cb();
        });
      });
    }else{
      cb();
    }
  });
};

exports.middleware = function middleware(params) {
    return function(req, res, next) {
        if (!req.loggedIn) {
            next();
            return;
        }
        User.findOne({_id: req.session.auth.userId}, function(err, user) {
            if (err) {
                next(err);
                return;
            }
            req.user = user;
            next();
        });
    };
};

exports.loginRequired = function(req, res, next) {
    if (req.loggedIn) {
        return next();
    }
    res.redirect(everyauth.password.getLoginPath() +
            "?next=" + encodeURIComponent(req.url));
};

exports.respondToLoginSucceed = function(res, user, data) {
    if(!user) {
      return;
    }

    var loc = data.req.body.next || '/';
    res.writeHead(303, {'Location': loc});
    res.end();
};

exports.respondToRegistrationSucceed = function(res, user, data) {
    if(!user) {
      return;
    }

    var loc = data.req.body.next || '/';
    res.writeHead(303, {'Location': loc});
    res.end();
};

exports.resetPassword = function(user, password, cb) {
    bcrypt.gen_salt(function(err, salt) {
        if (err) {
          return cb(err);
        }
        bcrypt.encrypt(password, salt, function(err, hash) {
            if (err) {
              return cb(err);
            }
            user.password = hash;
            user.save(cb);
        });
    });
};
exports.preEveryauthMiddlewareHack = function() {
      console.log('hey fender');
    return function (req, res, next) {
      console.log('hey fender1');
      var sess = req.session
        , k
        , auth = sess.auth
        , ea = { loggedIn: !!(auth && auth.loggedIn) };

      // Copy the session.auth properties over
      for (k in auth) {
        ea[k] = auth[k];
      }

      if (everyauth.enabled.password) {
        // Add in access to loginFormFieldName() + passwordFormFieldName()
        if (!ea.password){
          ea.password = {};
        }
        ea.password.loginFormFieldName = everyauth.password.loginFormFieldName();
        ea.password.passwordFormFieldName = everyauth.password.passwordFormFieldName();
      }

      res.locals.everyauth = ea;

      next();
    };
};

exports.postEveryauthMiddlewareHack = function () {
  var userAlias = everyauth.expressHelperUserAlias || 'user';
  return function( req, res, next) {
    res.locals.everyauth.user = req.user;
    res.locals[userAlias] = req.user;
    next();
  };
};
