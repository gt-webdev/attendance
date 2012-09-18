var async = require('async');
var models = require('../lib/models'),
    email = require('../lib/email');

var ONE_HOUR = 1000 * 60 * 60;
var ONE_WEEK = ONE_HOUR * 24 * 7;

/**
 * attempts to post new events from POST /events
 */
exports.post = function(req, res, next) {
  async.waterfall([
    function(cb) {
      //retrieve the org which is being passed
      models.Org.findOne({_id: req.body.org}, cb);
    },
    function(org, cb) {
      // to make an event, must be either an admin of the site
      if (req.user.is_admin) {
        return cb();
      }
      // ...or an admin of the Org
      if (org.admins.indexOf(req.user.id) >= 0) {
        return cb();
      }
      return res.send(403);
    },
    function(cb) {
      //confirm the validity of the start and end-time
      if (!req.body.end_time || (req.body.start_time
          && req.body.end_time < req.body.start_time)) {
        req.body.start_time = new Date(req.body.start_time);
        if (req.body.start_time != 'Invalid Date' 
            && req.body.end_time != "Invalid Date") {
          req.body.end_time = +req.body.start_time + ONE_HOUR;
        } else {
          return next('Invalid start/endn time');
        }
      }
      //produce event model and save
      var event = new models.Event({
        title:        req.body.title,
        org:          req.body.org,
        start_time:   req.body.start_time,
        end_time:     req.body.end_time,
        description:  req.body.description,
      });
      event.save(function(err) {
        cb(err, event);
      });
    }], 
    function(err, event) {
      if (err) {
        return next(err);
      }
      //flash success notification and redirect to GET handler
      req.session.messages=['success','Event created: '+ req.body.title];
      res.redirect('/events/' + event._id);
    }
  );
};

/**
 * deletes an event from the event page
 */
exports.delete = function(req, res, next) {
  async.waterfall([
    function(cb) {
      //find the event in db
      models.Event.findOne({_id: req.params.id}, cb);
    },
    function(event, cb) {
      //find the corresponding org
      models.Org.findOne({_id: event.org}, function(err, org) {
        if (err) {
          return cb(err);
        }
        //...and make sure the user is allowed to delete the event
        if (req.user.is_admin ||
          (org && org.admins.indexOf(req.user.id) != -1)) {
          return cb(null, event);
        }
        //forbidden!
        res.send(403);
      });
    },
    function(event, cb) {
      //remove the event through mongoose
      models.Event.remove({_id: event.id}, function(err) {
        cb(err, event);
      });
    }],
    function(err, event) {
      if (err) {
        return next(err);
      }
      //flash message and redirect
      req.session.messages = ['success', 'Event deleted: '+ event.title];
      res.redirect('/events/');
    }
  );
};

/**
 * show the create-event page for GET /create-event/
 */
exports.create = function(req, res, next) {
  //produce a list of all orgs
  models.Org.find({}, function(err, orgs) {
    if(err) {
      return next(err);
    }
    //render the page with the list of orgs embedded
    res.render('create-event', {
      req:req,
      user:req.user,
      event: {},
      orgs: orgs,
      update: false,
    });
  });
};

/**
 * an event details page from GET /events/:id
 */
exports.details = function(req, res, next) {
  async.waterfall([
    function(cb) {
      //find the event by url-embedded param :id
      models.Event.findOne({_id: req.params.id}, function(err, event) {
        if (event == null) {
          return res.send(404);
        } 
        cb(err, event);
      });
    },
    function(event, cb) {
      //find the org corresponding to the event
      models.Org.findOne({_id: event.org}, function(err, org) {
        if (org == null) {
          res.send(404);
        } else {
          cb(err, event, org);
        }
      });
    },
    function(event, org, cb) {
      //I'm not sure if this is being used for anything, probably returns null
      models.Place.findOne({_id: event.place}, function(err, place) {
        cb(err, event, org, place);
      });
    },
    function(event, org, place, cb) {
      /*this is a map which looks for user based on the
       * attendees list which exist within the "event" object
       * We now use a combination of a participation and user/guest
       * models to accomplish this. However, this is kept for legacy
       * support purposes - NOTE: if the database is ever restarted,
       * this functionality should be safe to remove! */
      async.map(event.attendees, function(user_id, cb) {
        models.User.findOne({_id: user_id}, cb);
      }, function(err, attendees) {
        cb(err, event, org, place, attendees);
      });
    },
    function(event, org, place, legacy_attendees, cb){
      /* this function uses the Participation model to find guests and users*/
      //find all participations for the given event
      models.Part.find({'event':event._id}, 'account',
        function(err, docs){
          async.map(docs, function(user_id, cb) {
            models.User.findOne({_id: user_id.account}, function(err,att){
              cb(null, att);
              }
            );
          },
          function(err, new_attendees) {
            //filter out guest accounts
            async.filter(new_attendees, function(att, fcb){
              if (att){
                return fcb(true);
              }
              return fcb(false);
            },function(user_att){
              //call the next function with the list of user-attendees
              cb(err, event, org, place, legacy_attendees, user_att);
            });
          });
        }
      );
    },
    function(event,org,place,legacy_attendees,attendees, cb){
      //does the same as the previous function, but fetches guest accounts
      //instead of user accounts for the event
      models.Part.find({'event':event._id}, 'account',
        function(err, docs){
          async.map(docs, function(user_id, cb) {
            models.Guest.findOne({_id: user_id.account}, function(err,att){
              cb(null, att);
            });
          }, 
          function(err, new_attendees) {
            async.filter(new_attendees, function(att, fcb){
              if (att){
                return fcb(true);
              }
              return fcb(false);
            },
            function(guest_att){
              async.map(docs, function(doc,cb){
                cb(null, doc.account);
              }, 
              function(err, final_att){
                cb(err, event, org, place, legacy_attendees, attendees, 
                   guest_att, final_att);
              });
            });
          });
        }
      );
    }
  ], 
  function(err, event, org, place, legacy_attendees, attendees, guests, att_ids) {
    //at this point, all data about the event, including users and guest
    //attendees has been retrieved
    if (err) {
      return next(err);
    }
    if (!event) {
      return res.send(404);
    }
    //render the event page with the given data
    res.render('event', {
      req:req,
      user:req.user,
      event: event,
      org: org,
      place: place,
      att_users: attendees,
      att_guests: guests,
      atts: att_ids,
      legacy:legacy_attendees,
    });
  });
};

/**
 * list events, defaults to upcoming and current event
 * from GET /events
 */
exports.list = function(req, res, next) {
  async.waterfall([
    function(cb) {
      //calculate which page is requested
      var page = req.query.page || 0;
      var limit = 10;
      //find all events, and fetch the corresponding org (instead of id)
      var q = models.Event.find().populate('org');
      //calculate page and times to query by
      if (page == 0) {
        q = q.where('end_time').gte(+new Date() - ONE_HOUR)
             .where('start_time').lte(+new Date() + ONE_WEEK)
             .sort('-start_time');
      } else if (page > 0) {
        q = q.where('start_time').gte(+new Date() + ONE_WEEK)
             .sort('-start_time').limit(limit).skip(limit * (page - 1));
      } else if (page < 0) {
        q = q.where('end_time').lte(+new Date() - ONE_HOUR)
             .sort('-start_time').limit(limit).skip(limit * (-page - 1));
      }
      //run the query to get results
      q.exec(cb);
    },
    function(events, cb) {
      //check to see if the user is an admin of some orgs
      if (!req.user) {
        return cb(null, events, false);
      }
      models.Org.find()
            .$where('this.admins.indexOf("' + req.user.id + '") >= 0')
            .count(function(err, count) {
        return cb(null, events, count > 0);
      });
    },
    ],
    function(err, events, user_is_admin) {
      if (err) {
        return next(err);
      }
      //render the page
      res.render('events', {
        req:req,
        user:req.user,
        title: 'Events',
        events: events,
        user_is_admin: user_is_admin,
      });
    }
  );
};

/**
 * produce the kiosk mode page for an event
 * for GET /events/:id/kiosk
 */
exports.kiosk = function(req,res,next) {
  async.waterfall([
    function(cb) {
      //find the even by the id provided in the url
      models.Event.findOne({_id: req.params.id}, function(err, event) {
        //make sure that an event was found, 404 if not found
        if (event == null) {
          return res.send(404);
        } 
        cb(err, event);
      });
    },
    function(event, cb) {
      //find the org listed in the event object
      models.Org.findOne({_id: event.org}, function(err, org) {
        //404 if couldn't be found
        if (org == null) {
          res.send(404);
        } else {
          cb(err, event, org);
        }
      });
    },
    function(event, org, cb) {
      //search for a place, pretty sure this is disabled
      models.Place.findOne({_id: event.place}, function(err, place) {
        cb(err, event, org, place);
      });
    },
    function(event, org, place, cb) {
      /*this is a map which looks for user based on the
       * attendees list which exist within the "event" object
       * We now use a combination of a participation and user/guest
       * models to accomplish this. However, this is kept for legacy
       * support purposes - NOTE: if the database is ever restarted,
       * this functionality should be safe to remove! */
      async.map(event.attendees, function(user_id, cb) {
        models.User.findOne({_id: user_id}, cb);
      }, 
      function(err, attendees) {
        cb(err, event, org, place, attendees);
      });
    },
    function(event, org, place, legacy_attendees, cb){
      //find participation objects tied to the event
      models.Part.find({'event':event._id}, 'account',
        function(err, docs){
          //for each participation object found, look for a user object
            async.map(docs, function(user_id, cb) {
              models.User.findOne({_id: user_id.account}, function(err,att){
                cb(null, att);
              });
            }, 
            function(err, new_attendees) {
              //filter out all the guest objects
              async.filter(new_attendees, function(att, fcb){
                if (att){
                  return fcb(true);
                }
                return fcb(false);
              },
              function(user_att){
                cb(err, event, org, place, legacy_attendees, user_att);
              });
            }
          );
        }
      );
    },
    function(event,org,place,legacy_attendees,attendees, cb){
      //do the same as the previous function, but for guests instead of users
      models.Part.find({'event':event._id}, 'account',
        function(err, docs){
          async.map(docs, function(user_id, cb) {
            models.Guest.findOne({_id: user_id.account}, function(err,att){
              cb(null, att);
            });
          }, 
          function(err, new_attendees) {
            async.filter(new_attendees, function(att, fcb){
              if (att){
                return fcb(true);
              }
              return fcb(false);
            },
            function(guest_att){
              async.map(docs, function(doc,cb){
                cb(null, doc.account);
              }, 
              function(err, final_att){
                cb(err, event, org, place, legacy_attendees, attendees, 
                   guest_att, final_att);
                }
              );
            });
          });
        }
      );
    }
  ], 
  function(err, event, org, place, legacy_attendees, attendees, guests, att_ids) {
    if (err) {
      return next(err);
    }
    if (!event) {
      return res.send(404);
    }
    //render the page
    res.render('kiosk', {
      req:req,
      user:req.user,
      event: event,
      org: org,
      place: place,
      att_users: attendees,
      att_guests: guests,
      atts: att_ids,
      legacy:legacy_attendees,
    });
  });
};

/**
 * function used to register a guest to an event
 * for PUT /events/:id/kiosk
 *   -this function only filters out bad requests and calls 'guest_attend'
 */
exports.guest = function(req, res, next) {
  if (!req.body._type) {
    res.send(400); // Bad Request
  }
  if (req.body._type === 'guest') {
    exports.guest_attend(req, res, next);
  }
};

/**
 * handles error checking and db interface for registering guests for an event
 */
exports.guest_attend = function(req, res, next) {
  //validation regex for email and gtids to filter out bad data
  var emailre = /\S+@\S+\.\S+/;
  var gtidre = /\d{9}/;
  if (!emailre.test(req.body.email) || !gtidre.test(req.body.gtid)){
    //send out an error message if the input data is invalid
    return next("Could not parse e-mail or gtid! try again.");
  }
  async.waterfall([
    function(cb) {
      //first find an event that matches the url :id
      models.Event.findOne({_id: req.params.id}, cb);
    },
    function(event, cb) {
      /* we assume that the gtid and email may already exist in the system!
       * before we register a guest, we check to see if a user who matches
       * the gtid and e-mail provided exists */ 
      models.User.findOne({'email':req.body.email.toLowerCase(), 'gt_id':req.body.gtid},
        function(err,doc){
          //if the doc doesn't exist, than we also search to see if the same
          //guest is already in the system
          if (doc==null){
            models.Guest.findOne({'email':req.body.email.toLowerCase(), 'gt_id':req.body.gtid},
              function(err,guest_doc){
                var my_doc;
                //case for new guest (first time we see gtid & e-mail)
                if (!guest_doc){
                  //create a new guest
                  my_doc = new models.Guest({
                    'email':req.body.email.toLowerCase(),
                    'gt_id':req.body.gtid
                  });
                  //save it
                  my_doc.save(function(err, doc){

                    email.send({
                      to: doc.email,
                      subject: 'Please register your ccorgs.com account',
                      body: "Thanks for attending an event on"+
                        "http://ccorgs.com/\n\n"+
                        "In order to keep better records, we ask that you\n"+
                        "register a full account. To do so, please open the\n"+
                        "following url in your favorite browser (it has to\n"+
                        "be your favorite :)) and complete the registration\n"+
                        "process!\n"+
                        "\n http://ccorgs.com/register?guest=" + doc._id
                    }, function(error, success) {
                      if (!success){
                        console.error(error);
                      }
                      var reg = models.Regiquest({
                        gt_id: doc.gt_id
                      });
                      reg.save();
                      cb(null, event, my_doc);
                    });
                  });
                } else {
                  //if the guest is returning, we just pass it along
                  my_doc = guest_doc;
                  //quick check to see if the user has a regiquest
                  models.Regiquest.findOne({'gt_id':guest_doc.gt_id},
                    function(err, reg){
                      if (err){
                        return cb(true);
                      }
                      if (reg){
                        return cb(null, event, my_doc);
                      }
                      email.send({
                      to: guest_doc.email,
                      subject: 'Please register your ccorgs.com account',
                      body: "Thanks for attending an event on"+
                        " http://ccorgs.com/\n\n In order to keep better"+
                        " records, we ask that you register a full account.\n"+
                        " To do so, please open the following url in your"+
                        " favorite browser (it has to be your favorite :))\n"+
                        " and complete the registration process!\n"+
                        "\n http://ccorgs.com/register?guest=" + guest_doc._id
                      }, function(error, success) {
                        if (!success){
                          console.error(error);
                        } 
                        var newreg = models.Regiquest({
                          gt_id: guest_doc.gt_id
                        });
                        newreg.save();
                        cb(null, event, my_doc);
                      });
                    }
                  );
                }
              }
            );
          }else{
            //if a user was found, just proceed as usual
            cb(null,event,doc);
          }
        }
      );
    },
    function(event, user, cb) {
      //query the Participation collection to see if there are matching
      models.Part.count({'event':event._id, 'account':user._id},
        function(err, count){
          if (count==0){
            //we usually expect no entries to exist beforehand, create a new one
            //and save it
            var new_part = new models.Part({
              'event':event._id,
              'account':user._id,
              'date':new Date()
            });
            new_part.save();
          }
        }
       );
      //all done! Continue to the redirect statement
        cb();
    }], 
    function(err) {
      if (err) {
        return next(err);
      }
      //lead the user back to the kiosk page
      res.redirect(req.url);
    }
  );
};

/**
 * handles user actions with an event (attend, un-attend, etc.)
 * for PUT /events/:id
 */
exports.put = function(req, res, next) {
  if (!req.body._type) {
    res.send(400); // Bad Request
  }
  if (req.body._type === 'attend') {
    exports.attend(req, res, next);
  } else if (req.body._type === 'unattend') {
    exports.unattend(req, res, next);
  } else if (req.body._type === 'update') {
    exports.update(req, res, next);
  } else if (req.body._type === 'unguest'){
    exports.unguest(req, res, next);
  }
};

/**
 * Admins may remove quest accounts who participate in an event from the event page
 *   see 'exports.put()' above
 */
exports.unguest = function(req,res,next){
  //make sure that the user is an org-admin, or super-admin before allowing un-guesting
  async.waterfall([
    function(cb) {
      //find the event
      models.Event.findOne({_id: req.params.id}, cb);
    },
    function(event, cb) {
      models.Org.findOne({_id:event.org}, function(err, org){
        if (err){
          res.send(404, "Org couldn't be found");
          cb (true);
        }
        //make sure that the user is an org-admin, or super-admin before 
        //allowing un-guesting
        if ((!req.user || org.admins.indexOf(req.user.id) < 0) 
            &&  !req.user.is_admin)  {
          return res.send(403);
        }
        models.Part.remove({'event':event._id, 'account':req.body.guest},
          function(err){
            //callback for remove operation, once we're here, we're done
            cb();
          }
        );
      });
    },
    function(event, org, cb) {
      //remove a participation with the event and the guest-id, if found
      if ((!req.user || org.admins.indexOf(req.user.id) < 0) &&  !req.user.is_admin)  {
        return res.send(403);
      }
      models.Part.remove({'event':event._id, 'account':req.body.guest},
        function(err){
          //callback for remove operation, once we're here, we're done
          cb();
        }
      );
    }], 
    function(err) {
      if (err) {
        return next(err);
      }
      //redirect back to event page
      res.redirect(req.url);
    }
  );
};

/**
 * action triggered by the "I'm here" button
 *   see 'exports.put()' above
 */
exports.attend = function(req, res, next) {
  async.waterfall([
    function(cb) {
      //find the event
      models.Event.findOne({_id: req.params.id}, cb);
    },
    function(event, cb) {
      //check to see if the user is already attending the event
      models.Part.count({'event':event._id, 'account':req.user.id},
        function(err,count){
          if (count==0){
            //if the user isn't already attending, create a new participation object
            var new_part = new models.Part({
              'event':event._id,
              'account':req.user.id,
              'date':new Date()
            });
            //save thy object
            new_part.save();
          }
        }
      );
      //all done!
      cb();
    }], 
    function(err) {
      if (err) {
        return next(err);
      }
      //redirect back to event page
      res.redirect(req.url);
    }
  );
};

/**
 * action triggered when a user cancels his attendance for an event
 *   see 'exports.put()' above
 */
exports.unattend = function(req, res, next) {
  async.waterfall([
    function(cb) {
      //find the event
      models.Event.findOne({_id: req.params.id}, cb);
    },
    function(event, cb) {
      //remove participation for the event, and the logged-in user
      models.Part.remove({'event':event._id, 'account':req.user.id},
        function(err){
          //all done
          cb();
        }
      );
    }], 
    function(err) {
      if (err) {
        return next(err);
      }
      //redirect to event page
      res.redirect(req.url);
    }
  );
};

/**
 * action triggered when an admin updates the details of an event
 *   see 'exports.put()' above
 */
exports.update = function(req, res, next) {
  //find the event in question
  models.Event.findOne({_id: req.params.id}).populate('org')
        .exec(function(err, event) {
    if (err) {
      return next(err);
    }
    if (event == null) {
      return res.send(404);
    }
    //validate that the user is an admin of the org or a super-admin
    if ((!req.user || event.org.admins.indexOf(req.user.id) < 0) 
        &&  !req.user.is_admin)  {
      return res.send(403);
    }
    //update the details of the event
    event.title = req.body.title;
    event.start_time = req.body.start_time;
    event.end_time = req.body.end_time;
    event.description = req.body.description;
    //save the event
    event.save();
    //redirect to the event page
    res.redirect(req.url);
  });
};

/**
 * allows admins to edit the details of an existing event
 * for GET /events/:id/edit
 *  - note: anyone can open this page, but only admins can save the changes.
 */
exports.edit = function(req, res, next) {
  //find the event
  models.Event.findOne({_id: req.params.id}, function(err, event) {
    if (err) {
      return next(err);
    }
    if (event == null) {
      return res.send(404);
    }
    //create the create-event page
    res.render('create-event', {
      req:req,
      user:req.user,
      event: event,
      update: true,
    });
  });
};

/**
 * Allows troy (or any org admin and super admin) to get better information
 * about an event.
 * for GET  /events/:id/troy
 */
exports.troy = function(req, res, next) {
  //find the event
  async.waterfall([
    function(cb) {
      //find the event by url-embedded param :id
      models.Event.findOne({_id: req.params.id}, function(err, event) {
        if (event == null) {
          return res.send(404);
        } 
        cb(err, event);
      });
    },
    function(event, cb) {
      //find the org corresponding to the event
      models.Org.findOne({_id: event.org}, function(err, org) {
        if (org == null) {
          res.send(404);
        } else {
          cb(err, event, org);
        }
      });
    },
    function(event, org, cb) {
      //I'm not sure if this is being used for anything, probably returns null
      models.Place.findOne({_id: event.place}, function(err, place) {
        cb(err, event, org, place);
      });
    },
    function(event, org, place, cb) {
      /*this is a map which looks for user based on the
       * attendees list which exist within the "event" object
       * We now use a combination of a participation and user/guest
       * models to accomplish this. However, this is kept for legacy
       * support purposes - NOTE: if the database is ever restarted,
       * this functionality should be safe to remove! */
      async.map(event.attendees, function(user_id, cb) {
        models.User.findOne({_id: user_id}, cb);
      }, function(err, attendees) {
        cb(err, event, org, place, attendees);
      });
    },
    function(event, org, place, legacy_attendees, cb){
      /* this function uses the Participation model to find guests and users*/
      //find all participations for the given event
      models.Part.find({'event':event._id}, 'account',
        function(err, docs){
          async.map(docs, function(user_id, cb) {
            models.User.findOne({_id: user_id.account}, function(err,att){
              cb(null, att);
              }
            );
          },
          function(err, new_attendees) {
            //filter out guest accounts
            async.filter(new_attendees, function(att, fcb){
              if (att){
                return fcb(true);
              }
              return fcb(false);
            },function(user_att){
              //call the next function with the list of user-attendees
              cb(err, event, org, place, legacy_attendees, user_att);
            });
          });
        }
      );
    },
    function(event,org,place,legacy_attendees,attendees, cb){
      //does the same as the previous function, but fetches guest accounts
      //instead of user accounts for the event
      models.Part.find({'event':event._id}, 'account',
        function(err, docs){
          async.map(docs, function(user_id, cb) {
            models.Guest.findOne({_id: user_id.account}, function(err,att){
              cb(null, att);
            });
          }, 
          function(err, new_attendees) {
            async.filter(new_attendees, function(att, fcb){
              if (att){
                return fcb(true);
              }
              return fcb(false);
            },
            function(guest_att){
              async.map(docs, function(doc,cb){
                cb(null, doc.account);
              }, 
              function(err, final_att){
                cb(err, event, org, place, legacy_attendees, attendees, 
                   guest_att, final_att);
              });
            });
          });
        }
      );
    }
  ], 
  function(err, event, org, place, legacy_attendees, attendees, guests, att_ids) {
    //at this point, all data about the event, including users and guest
    //attendees has been retrieved
    if (err) {
      return next(err);
    }
    if (!event) {
     return res.send(404);
    }
    //render the event page with the given data
    res.render('troy', {
      req:req,
      user:req.user,
      event: event,
      org: org,
      place: place,
      att_users: attendees,
      att_guests: guests,
      atts: att_ids,
      legacy:legacy_attendees,
    });
  });
};
