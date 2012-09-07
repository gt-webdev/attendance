
//NOTE: this is copied from express-messages-bootstrap, with the classes changes to support bootstrap2.0 -- JR, 02/18/12
module.exports = function(req, res) {
  return function() {
    var buf, i, j, len, messages, msg, msgs, type, types, _ref;
    buf = [];
    messages = req.session.messages || [];
    types = messages[0] || "None";
    if (types === "None") {
      return '';
    }
    buf.push('<div id="messages">');
    type = types;
    msgs = messages[1];
    if (msgs != null) {
      buf.push("<div class=\"alert alert-" + type + "\" data-alert=\"alert\">");
      buf.push("<a class=\"close\" href=\"#\">×</a>");
      buf.push("<p>" + msgs + "</p>");
      buf.push("</div>");
    }
    buf.push("</div>");
    req.session.messages = [];
    return buf.join('\n');
  };
};
