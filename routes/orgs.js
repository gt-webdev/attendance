var async = require('async');
var models = require('../lib/models');

/**
 * shows a list of the organizations in the system
 * for GET /orgs
 */
exports.list = function(req, res, next) {
  async.waterfall([
                  //first, find all the orgs, sort by name (ascending)
                  function(cb) {
    models.Org.find().sort('-name').exec(cb);
  },
  ], function(err, orgs) {
    if (err) {
      return next(err);
    }
    //render a page with the resulting list
    res.render('orgs', {
      req:req,
      user:req.user,
      title: 'All Organizations',
      orgs: orgs,
    });
  });
};

/**
 * details for a single org
 * for GET /orgs/:slug
 */
exports.details = function(req, res, next) {
  async.waterfall([
                  //find one org, specified by the slug in the url
                  function(cb) {
    models.Org.findOne({slug: req.params.slug}, cb);
  },
  function(org, cb){
    //find all events for the org, sort from latest to earliest, limit to 10
    models.Event.find({org:org._id})
      .sort('start_time').limit(10).exec(function(err, events){
      cb(err, org, events);
    });
  }
  ], function(err, org, events) {
    if (err) {
      return next(err);
    }
    if (!org) {
      return res.send(404);
    }
    //render the page with the org info and list of latest 10 events
    res.render('org', {
      req:req,
      user:req.user,
      org: org,
      events: events
    });
  });
};

/**
 * create a new org
 * for POST /orgs
 */
exports.post = function(req, res, next) {
  async.waterfall([
  function(cb) {
    console.log(req.user);
    //only admins should be allowed to create events, all else get 403!
    if (!req.user.is_admin) {
      return res.send(403);
    }
    
    cb();
  },
  function(cb) {
    //create a new org model
    var org = new models.Org({
      name: req.body.name,
      description: req.body.description,
      slug: req.body.slug
      //slugs are defined as unique, so duplicate events should raise an error
    });
    //save to db
    org.save(cb);
  },
  ], function(err) {
    if (err) {
      return next(err);
    }
    //show a "success" message on the next page
    //req.flash('success', 'Org created: %s', req.body.name);
    //redirect to the org's new page
    res.redirect('/orgs/' + req.body.slug);
  });
};

/**
 * change an orgs details
 * for PUT /orgs/:slug
 */
exports.put = function(req, res, next) {
  //find the org
  models.Org.findOne({slug: req.params.slug}, function(err, org) {
    if (err) {
      return next(err);
    }
    if (org == null) {
      return res.send(404);
    }
    //prevent non admins from doing this operation
    if (!req.user || (org.admins.indexOf(req.user.id) < 0
                      && !req.user.is_admin)) {
      return res.send(403);
    }
    //change the org's details to the new ones
    org.name = req.body.name;
    org.description = req.body.description;
    org.slug = req.body.slug;
    //ATTACK THE DB! (save)
    org.save();
    //redirect to the org's new page
    res.redirect('/orgs/' + org.slug);
  });
};

/**
 * delete an org
 * for DELETE /org/:slug
 */
exports.delete = function(req, res, next) {
  async.waterfall([
  function(cb) {
    //find an org identified by the slug
    models.Org.findOne({slug: req.params.slug}, cb);
  },
  function(org, cb) {
    //reject non-admins with 403
    if (req.user.is_admin || org.admins.indexOf(req.user.id) >= 0) {
      return cb(null, org);
    }
    return res.send(403);
  },
  function(org, cb) {
    //remove all events tied to the org
    models.Event.remove({org: org.id}, function(err) {
      cb(err, org);
    });
  },
  function(org, cb) {
    //remove the org
    models.Org.remove({_id: org.id}, function(err) {
      cb(err, org);
    });
  },
  ], function(err, org) {
    if (err) {
      return next(err);
    }
    //flash success message on the next page
    //req.flash('success', 'Org deleted: %s', org.name);
    //redirect to the orgs-list page
    res.redirect('/orgs');
  });
};

/**
 * page for creating a new org
 * for GET /create-org
 */
exports.create = function(req, res, next) {
  //anyone can get to this page, only admins can submit, no prior info needed
  //for rendering the page, except that this is a new org and not an update
  res.render('create-org', {
      req:req,
      user:req.user,
    update: false,
    org: {},
  });
};

/**
 * same as create-org, but retrieves an existing org's details and allows edits
 * for POST /org/:slug/edit
 */
exports.edit = function(req, res, next) {
  //find the org in question
  models.Org.findOne({slug: req.params.slug}, function(err, org) {
    if (err) {
      return next(err);
    }
    if (org == null) {
      return res.send(404);
    }
    //render the page
    res.render('create-org', {
      req:req,
      user:req.user,
      update: true,
      org: org,
    });
  });
};
