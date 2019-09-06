Session Recording Player for Glyptodon Enterprise
=================================================

*glyptodon-enterprise-player* is a web application for playing session
recordings created by [Glyptodon Enterprise](https://enterprise.glyptodon.com/)
or [Apache Guacamole](http://guacamole.apache.org/). The web application is
fully static, relying on the JavaScript
[`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) object to
replay a session recording that is stored locally (on the same machine as the
web browser).

To replay your own session recordings, you may serve this web application on
your own server, or use Glyptodon's publicly-hosted copy at
**https://player.glyptodon.com/**.

Installation
------------

Releases of glyptodon-enterprise-player can be found in the [releases section
of the GitHub repository](https://github.com/glyptodon/glyptodon-enterprise-player/releases) and are packaged as `.tar.gz` archives containing the static files
which must be served to host the web application. To install the web
application, the contents of this archive only need to be extracted and placed
within a location which will be served by your web server.

For example, if you have a web server running at `http://YOURSERVER/` which
serves static files from `/var/www`, and you wish to serve
glyptodon-enterprise-player from `http://YOURSERVER/player/`:

```console
$ tar -xzf glyptodon-enterprise-player-1.1.0-1.tar.gz
$ mv glyptodon-enterprise-player-1.1.0-1/ /var/www/player
```

Building from Source
--------------------

*glyptodon-enterprise-player* is built using Apache Maven. As the web
application is static, the build process mainly involves bundling and minifying
JavaScript and CSS, and packing all resulting files within a `.tar.gz` archive.

To build the web application using Maven:

```console
$ mvn package
```

Once built, a `.tar.gz` archive containing the web application can be found
within the `target/` subdirectory.

### Testing a Build Locally

Once built, the web application can be tested locally if Python 3 is installed
using the provided `test.sh` convenience script. Running `test.sh` will start
the HTTP server included with Python, serving the static web application on
port 8080:

```console
$ ./test.sh
```

This port can be overridden by specifying a different port on the command line:

```console
$ ./test.sh 8081
```

**NOTE:** If running test.sh, beware that executing `mvn clean` will break the
currently deployed web application, as `mvn clean` removes the `target/`
directory. To take recent changes into account without rerunning `test.sh`, just
run `mvn package` without "clean".

