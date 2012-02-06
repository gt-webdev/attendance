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
