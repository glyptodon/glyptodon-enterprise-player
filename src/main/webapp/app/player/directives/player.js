/*
 * Copyright (C) 2019 Glyptodon, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Directive which plays back Glyptodon Enterprise / Apache Guacamole session
 * recordings. This directive emits the following events based on state changes
 * within the current recording:
 *
 *     "glenPlayerLoading":
 *         A new recording has been selected and is now loading.
 *
 *     "glenPlayerProgress"
 *         Additional data has been loaded for the current recording and the
 *         recording's duration has changed. The new duration in milliseconds
 *         is passed to the event.
 *
 *     "glenPlayerLoaded"
 *         The current recording has finished loading.
 *
 *     "glenPlayerPlay"
 *         Playback of the current recording has started or has been resumed.
 *
 *     "glenPlayerPause"
 *         Playback of the current recording has been paused.
 *
 *     "glenPlayerSeek"
 *         The playback position of the current recording has changed. The new
 *         position within the recording is passed to the event as the number
 *         of milliseconds since the start of the recording.
 */
angular.module('player').directive('glenPlayer', [function glenPlayer() {

    var config = {
        restrict : 'E',
        templateUrl : 'app/player/templates/player.html'
    };

    config.scope = {

        /**
         * The URL of the Guacamole session recording to load.
         *
         * @type {String}
         */
        src : '='

    };

    config.controller = ['$scope', '$element', '$injector',
        function glenPlayerController($scope, $element, $injector) {

        /**
         * Guacamole.SessionRecording instance to be used to playback the
         * session recording given via $scope.src. If the recording has not yet
         * been loaded, this will be null.
         *
         * @type {Guacamole.SessionRecording}
         */
        $scope.recording = null;

        /**
         * Formats the given number as a decimal string, adding leading zeroes
         * such that the string contains at least two digits. The given number
         * MUST NOT be negative.
         *
         * @param {Number} value
         *     The number to format.
         *
         * @returns {String}
         *     The decimal string representation of the given value, padded
         *     with leading zeroes up to a minimum length of two digits.
         */
        var zeroPad = function zeroPad(value) {
            return value > 9 ? value : '0' + value;
        };

        /**
         * Formats the given quantity of milliseconds as days, hours, minutes,
         * and whole seconds, separated by colons (DD:HH:MM:SS). Hours are
         * included only if the quantity is at least one hour, and days are
         * included only if the quantity is at least one day. All included
         * groups are zero-padded to two digits with the exception of the
         * left-most group.
         *
         * @param {Number} value
         *     The time to format, in milliseconds.
         *
         * @returns {String}
         *     The given quantity of milliseconds formatted as "DD:HH:MM:SS".
         */
        $scope.formatTime = function formatTime(value) {

            // Round provided value down to whole seconds
            value = Math.floor((value || 0) / 1000);

            // Separate seconds into logical groups of seconds, minutes,
            // hours, etc.
            var groups = [ 1, 24, 60, 60 ];
            for (var i = groups.length - 1; i >= 0; i--) {
                var placeValue = groups[i];
                groups[i] = zeroPad(value % placeValue);
                value = Math.floor(value / placeValue);
            }

            // Format groups separated by colons, stripping leading zeroes and
            // groups which are entirely zeroes, leaving at least minutes and
            // seconds
            var formatted = groups.join(':');
            return /^[0:]*([0-9]{1,2}(?::[0-9]{2})+)$/.exec(formatted)[1];

        };

        // Automatically load the requested session recording
        $scope.$watch('src', function urlChanged(url) {

            // Stop loading the current recording, if any
            if ($scope.recording)
                $scope.recording.disconnect();

            // If no recording is provided, reset to empty
            if (!url)
                $scope.recording = null;

            // Otherwise, begin loading the provided recording
            else {

                var tunnel = new Guacamole.StaticHTTPTunnel(url);
                $scope.recording = new Guacamole.SessionRecording(tunnel);

                // Notify listeners when the recording is completely loaded
                tunnel.onstatechange = function tunnelStateChanged(state) {
                    if (state === Guacamole.Tunnel.State.CLOSED) {
                        $scope.$emit('glenPlayerLoaded');
                        $scope.$evalAsync();
                    }
                };

                // Notify listeners when additional recording data has been
                // loaded
                $scope.recording.onprogress = function durationChanged(duration) {
                    $scope.$emit('glenPlayerProgress', duration);
                    $scope.$evalAsync();
                };

                // Notify listeners when playback has started/resumed
                $scope.recording.onplay = function playbackStarted() {
                    $scope.$emit('glenPlayerPlay');
                    $scope.$evalAsync();
                };

                // Notify listeners when playback has paused
                $scope.recording.onpause = function playbackPaused() {
                    $scope.$emit('glenPlayerPause');
                    $scope.$evalAsync();
                };

                // Notify listeners when current position within the recording
                // has changed
                $scope.recording.onseek = function positionChanged(position) {
                    $scope.$emit('glenPlayerSeek', position);
                    $scope.$evalAsync();
                };

                // Begin loading new recording
                $scope.$emit('glenPlayerLoading');
                $scope.recording.connect();

            }

        });

    }];

    return config;

}]);
