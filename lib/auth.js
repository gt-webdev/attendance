var mongoose = require('mongoose');
var everyauth = require('everyauth');
var bcrypt = require('bcrypt');

var User = mongoose.model('User');

exports.authenticate = function(login, password) {
    var promise = this.Promise();
    
    User.findOne({gt_userid: login}, function(err, user) {
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

exports.validateRegistration = function(attribs) {
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

exports.registerUser = function(attribs) {
    var promise = this.Promise();
    
    bcrypt.gen_salt(function(err, salt) {
        if (err) {
            return promise.fulfill(['Error generating salt']);
        }
        bcrypt.encrypt(attribs.password, salt, function(err, hash) {
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
                return promise.fulfill(user);
            });
            return promise;
        });
    });
    
    return promise;
};

exports.middleware = function(req, res, next) {
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