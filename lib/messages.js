/*
 * a session-based messages storage system, made to replace
 * express--messages-bootstrap because they are broken and 
 * sort-of maybe making something that is a little like a 
 * transition into express 3.0
 *
 * author: theDekel
 */

exports.middleware = function(req, res, next){
  req.flash = function(type, message){

  };
};
