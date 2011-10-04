#!/bin/sh
#
# Install default conf.local.js
#

if [ ! -e conf.local.js ];
then
    cp conf.sample.js conf.local.js
    echo 'Default conf settings installed in conf.local.js'
else
    echo 'conf.local.js already exists... not installing.'
fi
