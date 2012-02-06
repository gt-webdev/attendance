email = require 'mailer'
conf = '../conf'

if conf.sendgrid.username
  # opts: to, subject, body
  # cb: function(err, success)
  exports.send = (opts, cb) ->
    email.send({
      host: conf.sendgrid.host
      port: conf.sendgrid.port
      domain: conf.domain
      to: opts.to
      from: 'password@' + conf.domain
      subject: opts.subject
      body: opts.body
      authentication: 'login'
      username: conf.sendgrid.username
      password: conf.sendgrid.password
    }, cb)
else
  exports.send = (opts, cb) ->
  console.log 'Sending email:'
  console.log opts
  cb(null, true)