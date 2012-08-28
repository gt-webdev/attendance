var async = require('async');
var models = require('../lib/models');

/**
 * shows a list of the organizations in the system and their mods
 * for GET /admin
 */
exports.list = function(req, res, next) {
  if (!req.user || req.user.is_admin !== true){
    res.send(403);
    return;
  }
  async.waterfall([
                  //first, find all the orgs, sort by name (ascending)
  function(cb) {
    models.Org.find().sort('name').exec(cb);
  },
  function(orgs, cb){
    var users = {};
    async.map(orgs, function(org, cb){
      async.map(org.admins ,function(user, cb){
      models.User.findOne({_id:user}, cb);
      }, function(err,admin_list){
        users[org.slug] = admin_list;
        return cb(false, true);
      });
    }, function(final_list){
      cb(false, orgs, users);
    });
  }
  ], function(err, orgs, users) {
    if (err) {
      return next(err);
    }
    //render a page with the resulting list
    res.render('admin_main', {
      req: req,
      user: req.user,
      users: users,
      title: 'All Organizations',
      orgs: orgs,
    });
  });
};


