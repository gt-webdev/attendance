var models = require('./models');
exports.middleware = function(req, res, next){
  req.regdata = {
    email: "",
    fname: "",
    lname: "",
    gt_id: "",
    gt_userid: ""
  };
  if (req.query.guest){
    models.Guest.findOne({_id:req.query.guest}, function(err, guest){
      var ere = /(.*?)(\d+?)@/, emaildata;
      if (guest){
        req.regdata.email = guest.email;
        req.regdata.gt_id = guest.gt_id;
        if (ere.test(req.regdata.email)){
          emaildata = ere.exec(req.regdata.email);
          req.regdata.gt_userid = emaildata[1] + emaildata[2];
          req.regdata.lname = emaildata[1].substr(1,1).toUpperCase() + 
            emaildata[1].substr(2);
        }
      } else {
        req.session.messages=['info', 'No such guest found'];
      }
      return next();
    });
  } else {
    return next();
  }
};
