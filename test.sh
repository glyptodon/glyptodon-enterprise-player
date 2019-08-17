#!/bin/bash -e
#
# Copyright (C) 2019 Glyptodon, Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
#

#
# test.sh - Convenience script for automatically deploying the most recent
# build results using the HTTP server included with Python 3.
#
# To start a web server which listens on port 8080 and serves the static
# contents of the most recent build:
#
#     $ ./test.sh
#
#
# To use a different port, specify that port as the sole argument to the
# script:
#
#     $ ./test.sh 8081
#
# If running test.sh, beware that executing "mvn clean" will break the
# currently deployed web application, as "mvn clean" removes the target
# directory. To take recent changes into account without rerunning test.sh,
# just run "mvn package" without "clean".
#

##
## The TCP port that the HTTP server should listen on. By default, port 8080
## will be used.
##
PORT="${1:-8080}"

# Change into the directory containing the build results
cd "$(dirname "$0")"/target/glyptodon-enterprise-player-*/

# Serve the current working directory with the Python 3 web server
python3 -m http.server "$PORT"

