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
 * The controller for the root of the Glyptodon Enterprise session player web
 * application.
 */
angular.module('app').controller('appController', ['$scope', function appController($scope) {

    /**
     * The currently selected recording, or null if no recording is selected.
     *
     * @type {Blob}
     */
    $scope.selectedRecording = null;

    /**
     * Whether the session recording player within the application is currently
     * playing a recording.
     *
     * @type {Boolean}
     */
    $scope.playing = false;

    /**
     * Whether an error prevented the requested recording from being loaded.
     *
     * @type {Boolean}
     */
    $scope.error = false;

    // Clear any errors if a new recording is loading
    $scope.$on('glenPlayerLoading', function loadingStarted() {
        $scope.error = false;
    });

    // Update error status if a failure occurs
    $scope.$on('glenPlayerError', function recordingError() {
        $scope.selectedRecording = null;
        $scope.error = true;
    });

    // Update playing/paused status when playback starts
    $scope.$on('glenPlayerPlay', function playbackStarted() {
        $scope.playing = true;
    });

    // Update playing/paused status when playback stops
    $scope.$on('glenPlayerPause', function playbackStopped() {
        $scope.playing = false;
    });

}]);
