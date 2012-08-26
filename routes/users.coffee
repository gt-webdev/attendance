models = require '../lib/models'
email = require '../lib/email'
auth = require '../lib/auth'
conf = require '../conf'

exports.recover = (req, res, next) ->
  res.render('recover',{req:req})

exports.recover_post = (req, res, next) ->
  models.User.findOne({email: req.body.email}, (err, user) ->
    if err
      return next(err)

    if !user
      req.flash('error', "Couldn't find a user with that email")
      return res.render('recover',{req:req})

    reset_url = 'http://' + conf.domain + '/recover/' + user.id

    email.send({
      to: user.email
      subject: 'CC Orgs Password Reset'
      body: "Click here to reset your password:\n#{reset_url}"
    }, (error, success) ->
      if not success
        console.error error
    )

    req.flash('info', 'Check your email to reset your password')
    res.render('recover', {req:req})
  )

exports.reset_password = (req, res, next) ->
  res.render('reset-password', {req:req})

exports.reset_password_post = (req, res, next) ->
  models.User.findOne({_id: req.params.id}, (err, user) ->
    if err
      return next(err)
    if !user
      return res.send 404

    auth.resetPassword(user, req.body.password, (err) ->
      if err
        return next(err)

      req.flash('info', 'Password reset successfully')
      res.redirect '/login'
    )
  )
