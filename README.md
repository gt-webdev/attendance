# Attendance

This application will be used to keep track of attendance for Georgia
Tech College of Computing student organizations and act as a landing
page for them as well.

## Dependencies

To run the app locally, you'll need node, npm (packaged with node >=
0.6), mongodb, 

## Setting up the development environment

First, fork the `cc-wit/attendance` repository on GitHub, then clone
your fork. For example:

    $ git clone git@github.com:cc-wit/attendance.git

Then, install all the dependencies and start mongodb:

    $ cd attendance
    $ npm install
    $ sudo /etc/init.d/mongodb start  # or the variant for your system

Start the app with:

    $ node app.js

## Code Quality and Documentation

Please maintain well-documented code by providing headers for all named
functions and by placing a comment before each logical section of code
describing what is being done. Pull requests for undocumented code will
not be merged.

All `.js` files should be validated with jslint using the following rules:

    /*jslint browser: true, devel: true, node: true, bitwise: true, 
    continue: true, debug: true, eqeq: true, es5: true, forin: true, 
    newcap: true, nomen: true, plusplus: true, regexp: true,undef: true, 
    sloppy: true, sub: true, vars: true, white: true, on: true, indent: 2 */

For validation, you may either use the [online validator](http://www.jslint.com/)
or use an editor extension such as
[jslint.vim](https://github.com/hallettj/jslint.vim/) for Vim.

## Testing

Before submitting changes for a pull request, make sure that all tests are
passing.

> tests coming soon

## Submitting changes

To submit changes, make a new branch for your change, and then add
commits, and then submit a pull request on GitHub.
