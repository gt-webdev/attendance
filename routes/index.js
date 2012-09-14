exports.events = require('./events');
exports.orgs = require('./orgs');
exports.users = require('./users');
exports.admin = require('./admin');

var orgs   = exports.orgs;
var events = exports.events;
var users = exports.users;
var admin = exports.admin;
var auth   = require('../lib/auth');

//new paths should be registered here, see the usual documentation for express
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
    app.post('/orgs/:slug/admin', auth.adminRequired, orgs.addAdmin);
    app.delete('/orgs/:slug/admin', auth.adminRequired, orgs.deleteAdmin);

    app.get('/events', events.list);
    app.get('/events/:id', events.details);
    app.get('/events/:id/edit', auth.loginRequired, events.edit);
    app.get('/events/:id/kiosk', events.kiosk);
    app.get('/events/:id/troy', auth.loginRequired, events.troy);
    app.get('/create-event', auth.loginRequired, events.create);
    app.post('/events', auth.loginRequired, events.post);
    app.put('/events/:id', auth.loginRequired, events.put);
    app.delete('/events/:id', auth.loginRequired, events.delete);
    app.put('/events/:id/kiosk', events.guest);

    app.get('/recover', users.recover);
    app.post('/recover', users.recover_post);
    app.get('/recover/:id', users.reset_password);
    app.post('/recover/:id', users.reset_password_post);
    app.get('/profile', auth.loginRequired, users.profile);
    app.get('/profile/:id', auth.adminRequired, users.profile);
    app.put('/profile', auth.loginRequired, users.put);
    app.put('/profile/:id', auth.loginRequired, users.put);

    app.get('/admin', admin.list);
};
