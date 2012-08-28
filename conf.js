module.exports = {
    port: process.env.PORT || 3000,
    mongo: {
        uri: process.env.MONGOLAB_URI || 'mongodb://localhost/attendance',
    },
    session: {
        secret: process.env.SESSION_SECRET || 'heheheh secret',
    },
    domain: 'ccorgs.com',
    sendgrid: {
        username: process.env.SENDGRID_USERNAME,
        password: process.env.SENDGRID_PASSWORD,
        host: 'smtp.sendgrid.net',
        port: '587',
    },
};
var urire = /mongodb:\/\/(\w+?):(\w+?)@([\w\.]+?):(\d+?)\/(\w+)/,
    res;
if (urire.test(module.exports.mongo.uri)) {
  res = urire.exec(module.exports.mongo.uri);
  module.exports.parsedMongo = {
    username: res[1],
    password: res[2],
    host: res[3],
    port: parseInt(res[4], 10),
    db: res[5]
  };
}
