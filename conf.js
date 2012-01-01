module.exports = {
    mongo: {
        uri: process.env.MONGOLAB_URI || 'mongodb://localhost/attendance',
    },
    session: {
        secret: process.env.SESSION_SECRET || 'heheheh secret',
    },
};
