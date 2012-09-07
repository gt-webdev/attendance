var models = require('../lib/models'),
  email = require('../lib/email'),
  auth = require( '../lib/auth'),
  conf = require('../conf');

exports.recover = function(req, res, next) {
  res.render('recover',{req:req});
};

exports.recover_post = function(req, res, next) {
  models.User.findOne({email: req.body.email},function(err, user){
    if (err){
      return next(err);
    }

    if (!user){
      req.session.messages=['error', "Couldn't find a user with that email"];
      return res.render('recover',{req:req});
    }
    var reset_url = 'http://' + conf.domain + '/recover/' + user.id;

    email.send({
      to: user.email,
      subject: 'CC Orgs Password Reset',
      body: "Click here to reset your password:\n<a href='" + reset_url +
        "'>" + reset_url + "</a>"
    }, function(error, success) {
      if (!success){
        console.error(error);
      }
    });

    req.session.messages=['info', 'Check your email to reset your password'];
    res.render('recover', {req:req});
  });
};

exports.reset_password = function(req, res, next) {
  res.render('reset-password', {req:req});
};

exports.reset_password_post = function(req, res, next) {
  models.User.findOne({_id: req.params.id}, function(err, user) {
    if (err){
      return next(err);
    }
    if (!user){
      return res.send(404);
    }

    auth.resetPassword(user, req.body.password, function(err) {
      if (err){
        return next(err);
      }

      req.session.mesasges=['info', 'Password reset successfully'];
      res.redirect('/login');
    });
  });
};
