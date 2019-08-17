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
 * Directive which contains a given Guacamole.Display, automatically scaling
 * the display to fit available space.
 */
angular.module('player').directive('glenPlayerDisplay', [function glenPlayerDisplay() {

    var config = {
        restrict : 'E',
        templateUrl : 'modules/player/templates/playerDisplay.html'
    };

    config.scope = {

        /**
         * The Guacamole.Display instance which should be displayed within the
         * directive.
         *
         * @type {Guacamole.Display}
         */
        display : '='

    };

    config.controller = ['$scope', '$element', function glenPlayerDisplayController($scope, $element) {

        /**
         * The root element of this instance of the glenPlayerDisplay
         * directive.
         *
         * @type {Element}
         */
        var element = $element[0];

        /**
         * The element which serves as a container for the root element of the
         * Guacamole.Display assigned to $scope.display.
         *
         * @type {HTMLDivElement}
         */
        var container = $element.find('.glen-player-display-container')[0];

        /**
         * The object element contained within this directive which functions
         * as a source of resize events tied to the size of the available
         * space.
         *
         * @type {HTMLObjectElement}
         */
        var resizeSensor = $element.find('.glen-resize-sensor')[0];

        /**
         * Rescales the Guacamole.Display currently assigned to $scope.display
         * such that it exactly fits within this directive's available space.
         * If no display is currently assigned or the assigned display is not
         * at least 1x1 pixels in size, this function has no effect.
         */
        var fitDisplay = function fitDisplay() {

            // Ignore if no display is yet present
            if (!$scope.display)
                return;

            var displayWidth = $scope.display.getWidth();
            var displayHeight = $scope.display.getHeight();

            // Ignore if the provided display is not at least 1x1 pixels
            if (!displayWidth || !displayHeight)
                return;

            // Fit display within available space
            $scope.display.scale(Math.min(element.offsetWidth / displayWidth,
                element.offsetHeight / displayHeight));

        };

        // Automatically add/remove the Guacamole.Display as $scope.display is
        // updated
        $scope.$watch('display', function displayChanged(display, oldDisplay) {

            // Clear out old display, if any
            if (oldDisplay) {
                container.innerHTML = '';
                oldDisplay.onresize = null;
            }

            // If a new display is provided, add it to the container, keeping
            // its scale in sync with changes to available space and display
            // size
            if (display) {
                container.appendChild(display.getElement());
                display.onresize = fitDisplay;
                fitDisplay();
            }

        });

        // Rescale display whenever the resize sensor detects that the
        // available space has changed
        resizeSensor.onload = function resizeSensorLoaded() {
            resizeSensor.contentDocument.defaultView.addEventListener('resize', fitDisplay);
            fitDisplay();
        };

    }];

    return config;

}]);
