exports.events = require('./events');
exports.orgs = require('./orgs');
exports.users = require('./users');

var orgs   = exports.orgs;
var events = exports.events;
var users = exports.users;
var auth   = require('../lib/auth');

exports.registerOn = function(app) {
    app.get('/', function(req, res) {
        res.redirect('/orgs');
    });

    app.get('/orgs', orgs.list);
    app.get('/orgs/:slug', orgs.details);
    app.get('/orgs/:slug/edit', auth.loginRequired, orgs.edit);
    app.get('/create-org', auth.loginRequired, orgs.create);
    app.post('/orgs', auth.loginRequired, orgs.post);
    app.put('/orgs/:slug', auth.loginRequired, orgs.put);
    app.delete('/orgs/:slug', auth.loginRequired, orgs.delete);

    app.get('/events', events.list);
    app.get('/events/:id', events.details);
    app.get('/events/:id/edit', auth.loginRequired, events.edit);
    app.get('/create-event', auth.loginRequired, events.create);
    app.post('/events', auth.loginRequired, events.post);
    app.put('/events/:id', auth.loginRequired, events.put);
    app.delete('/events/:id', auth.loginRequired, events.delete);

    app.get('/recover', users.recover);
    app.post('/recover', users.recover_post);
    app.get('/recover/:id', users.reset_password);
    app.post('/recover/:id', users.reset_password_post);
};
