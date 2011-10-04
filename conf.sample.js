/*
 * Default conf.local.js file... to use:
 *
 * $ cp conf.sample.js conf.local.js
 */
module.exports = {
    mongo: {
        uri: 'mongodb://localhost/attendance',
    },
    session: {
        secret: 'some generated UUID',
    },
};
