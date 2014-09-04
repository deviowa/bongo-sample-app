var busStopModule = angular.module('angularcourse-bus-stop', [])

/**
 * Defining a directive
 *
 * 1. Call exampleModule.directive('camelCasedSelector', definition)
 *
 *   `definition` can be complex, but the most common attrs are
 *      a. template OR templateUrl (specify a template or template url)
 *      b. controller (define a function to be used as a controller)
 *      c. controllerAs (a string - the name your markup can use to access the controller)
 *      c. restrict ('E' for an element, 'A' for an attribute)
 *
 * 2. Use selector in markup.
 *   Note: `exampleDirectiveName` in javascript will become
 *         `example-directive-name` in markup. Forgetting this is a common source of head-scratching!
 */

busStopModule.directive('busStop', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/bus-stop/busStop.html',
        controllerAs: 'busStopCtrl',
        controller: [function() {
            this.exampleStop = {
                title: 'Example Bus Title!'
            };
        }]
    };
});

module.exports = busStopModule.name;