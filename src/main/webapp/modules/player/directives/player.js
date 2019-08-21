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
 *     "glenPlayerError":
 *         The current recording cannot be loaded or played due to an error.
 *         The recording may be unreadable (lack of permissions) or corrupt
 *         (protocol error).
 *
 *     "glenPlayerProgress"
 *         Additional data has been loaded for the current recording and the
 *         recording's duration has changed. The new duration in milliseconds
 *         and the number of bytes loaded so far are passed to the event.
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
angular.module('player').directive('glenPlayer', ['$injector', function glenPlayer($injector) {

    // Required types
    var SessionRecording = $injector.get('SessionRecording');

    var config = {
        restrict : 'E',
        templateUrl : 'modules/player/templates/player.html'
    };

    config.scope = {

        /**
         * A Blob containing the Guacamole session recording to load.
         *
         * @type {Blob}
         */
        blob : '='

    };

    config.controller = ['$scope', '$element', '$injector',
        function glenPlayerController($scope) {

        /**
         * SessionRecording instance to be used to playback the session
         * recording given via $scope.src. If the recording has not yet been
         * loaded, this will be null.
         *
         * @type {SessionRecording}
         */
        $scope.recording = null;

        /**
         * The current playback position, in milliseconds. If a seek request is
         * in progress, this will be the desired playback position of the
         * pending request.
         *
         * @type {Number}
         */
        $scope.playbackPosition = 0;

        /**
         * Human-readable text describing the operation currently running in
         * the background, or null if no such operation is running.
         *
         * @type {String}
         */
        $scope.operationText = null;

        /**
         * The current progress toward completion of the operation running in
         * the background, where 0 represents no progress and 1 represents full
         * completion. If no such operation is running, this value has no
         * meaning.
         *
         * @type {Number}
         */
        $scope.operationProgress = 0;

        /**
         * The position within the recording of the current seek operation, in
         * milliseconds. If a seek request is not in progress, this will be
         * null.
         *
         * @type {Number}
         */
        $scope.seekPosition = null;

        /**
         * Whether a seek request is currently in progress. A seek request is
         * in progress if the user is attempting to change the current playback
         * position (the user is manipulating the playback position slider).
         *
         * @type {Boolean}
         */
        var pendingSeekRequest = false;

        /**
         * Whether playback should be resumed (play() should be invoked on the
         * recording) once the current seek request is complete. This value
         * only has meaning if a seek request is pending.
         *
         * @type {Boolean}
         */
        var resumeAfterSeekRequest = false;

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

        /**
         * Pauses playback and decouples the position slider from current
         * playback position, allowing the user to manipulate the slider
         * without interference. Playback state will be resumed following a
         * call to commitSeekRequest().
         */
        $scope.beginSeekRequest = function beginSeekRequest() {

            // If a recording is present, pause and save state if we haven't
            // already done so
            if ($scope.recording && !pendingSeekRequest) {
                resumeAfterSeekRequest = $scope.recording.isPlaying();
                $scope.recording.pause();
            }

            // Flag seek request as in progress
            pendingSeekRequest = true;

        };

        /**
         * Restores the playback state at the time beginSeekRequest() was
         * called and resumes coupling between the playback position slider and
         * actual playback position.
         */
        $scope.commitSeekRequest = function commitSeekRequest() {

            // If a recording is present and there is an active seek request,
            // restore the playback state at the time that request began and
            // begin seeking to the requested position
            if ($scope.recording && pendingSeekRequest) {

                $scope.seekPosition = null;
                $scope.operationText = 'Seeking to the requested position. Please wait...';
                $scope.operationProgress = 0;

                // Cancel seek when requested, updating playback position if
                // that position changed
                $scope.cancelOperation = function abortSeek() {
                    $scope.recording.cancel();
                    $scope.playbackPosition = $scope.seekPosition || $scope.playbackPosition;
                };

                resumeAfterSeekRequest && $scope.recording.play();
                $scope.recording.seek($scope.playbackPosition, function seekComplete() {
                    $scope.operationText = null;
                    $scope.$evalAsync();
                });

            }

            // Flag seek request as completed
            pendingSeekRequest = false;

        };

        /**
         * Toggles the current playback state. If playback is currently paused,
         * playback is resumed. If playback is currently active, playback is
         * paused. If no recording has been loaded, this function has no
         * effect.
         */
        $scope.togglePlayback = function togglePlayback() {
            if ($scope.recording) {
                if ($scope.recording.isPlaying())
                    $scope.recording.pause();
                else
                    $scope.recording.play();
            }
        };

        // Automatically load the requested session recording
        $scope.$watch('blob', function blobChanged(blob) {

            // Reset position and seek state
            pendingSeekRequest = false;
            $scope.playbackPosition = 0;

            // Stop loading the current recording, if any
            if ($scope.recording) {
                $scope.recording.pause();
                $scope.recording.abort();
            }

            // If no recording is provided, reset to empty
            if (!blob)
                $scope.recording = null;

            // Otherwise, begin loading the provided recording
            else {

                $scope.recording = new SessionRecording(blob);

                // Notify listeners when the recording is completely loaded
                $scope.recording.onload = function recordingLoaded() {
                    $scope.operationText = null;
                    $scope.$emit('glenPlayerLoaded');
                    $scope.$evalAsync();
                };

                // Notify listeners if an error occurs
                $scope.recording.onerror = function recordingFailed(message) {
                    $scope.operationText = null;
                    $scope.$emit('glenPlayerError', message);
                    $scope.$evalAsync();
                };

                // Notify listeners when additional recording data has been
                // loaded
                $scope.recording.onprogress = function recordingLoadProgressed(duration, current) {
                    $scope.operationProgress = current / blob.size;
                    $scope.$emit('glenPlayerProgress', duration, current);
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
                $scope.recording.onseek = function positionChanged(position, current, total) {

                    // Update current playback position while playing
                    if ($scope.recording.isPlaying())
                        $scope.playbackPosition = position;

                    // Update seek progress while seeking
                    else {
                        $scope.seekPosition = position;
                        $scope.operationProgress = current / total;
                    }

                    $scope.$emit('glenPlayerSeek', position);
                    $scope.$evalAsync();

                };

                $scope.operationText = 'Your recording is now being loaded. Please wait...';
                $scope.operationProgress = 0;

                $scope.cancelOperation = function abortLoad() {
                    $scope.recording.abort();
                    $scope.operationText = null;
                };

                $scope.$emit('glenPlayerLoading');

            }

        });

    }];

    return config;

}]);
