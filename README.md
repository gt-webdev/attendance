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

    $ git clone git@github.com:thelastnode/attendance.git

Then, install all the dependencies and start mongodb:

    $ cd attendance
    $ npm install
    $ sudo /etc/init.d/mongodb start  # or the variant for your system

Start the app with:

    $ node app.js

## Submitting changes

To submit changes, make a new branch for your change, and then add
commits, and then submit a pull request on GitHub.