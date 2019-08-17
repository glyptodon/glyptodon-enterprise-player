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
