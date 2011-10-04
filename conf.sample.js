/*
 * Default conf.local.js file.
 *
 * To use:
 *
 * $ npm run-script install-defaults
 */
module.exports = {
    mongo: {
        uri: 'mongodb://localhost/attendance',
    },
    session: {
        secret: 'some generated UUID',
    },
};
