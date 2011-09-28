var mongoose = require('mongoose');
var everyauth = require('everyauth');
var bcrypt = require('bcrypt');

var User = mongoose.model('User');

exports.authenticate = function(login, password) {
    var promise = everyauth.Promise();
    
    User.findOne({email: login}, function(err, user) {
	if (err) {
	    promise.fail(["Database error while authenticating user"]);
	    return;
	}
	if (user.length != 1) {
	    promise.fail(["No such user"]);
	    return;
	}
	bcrypt.compare(password, user[0].password, function(err, res) {
	    if (err) {
		promise.fail(["Password check error"]);
		return;
	    }
	    if (res) {
		promise.fulfill(user[0]);
		return;
	    }
	    promise.fail(["Incorrect password"]);
	    return;
	});
    });

    return promise;
};