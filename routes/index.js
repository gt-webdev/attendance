exports.events = require('./events');
exports.orgs = require('./orgs');

var orgs   = exports.orgs;
var events = exports.events;
var auth   = require('../lib/auth');

exports.registerOn = function(app) {
    app.get('/', function(req, res) {
        res.redirect('/orgs');
    });

    app.get('/orgs', orgs.list);
    app.get('/orgs/:slug', orgs.details);
    app.get('/create-org', auth.loginRequired, orgs.create);
    app.post('/orgs', auth.loginRequired, orgs.post);
    app.delete('/orgs/:slug', auth.loginRequired, orgs.delete);

    app.get('/events', events.list);
    app.get('/events/:id', events.details);
    app.get('/events/:id/edit', events.edit);
    app.get('/create-event', auth.loginRequired, events.create);
    app.post('/events', auth.loginRequired, events.post);
    app.put('/events/:id', auth.loginRequired, events.put);
    app.delete('/events/:id', auth.loginRequired, events.delete);
};
