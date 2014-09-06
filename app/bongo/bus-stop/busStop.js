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
 *      d. restrict ('E' for an element, 'A' for an attribute)
 *      e. scope (essentially a list of parameters you'd like to pass in and out of the directive)
 *
 * 2. Use selector in markup.
 *   Note: `exampleDirectiveName` in javascript will become
 *         `example-directive-name` in markup. Forgetting this is a common source of head-scratching!
 */

busStopModule.directive('busStop', function () {
    return {
        restrict: 'E',

        // this links to an html template that can either be downloaded or preloaded.
        templateUrl: 'bongo/bus-stop/busStop.html',
        // Our build script automatically preloads all html templates (and also compiles jade files to html, so
        // directives/bus-stop/busStop.jade is the source for this directives/bus-stop/busStop.html file.

        // you could also just declare the template inline
        // template: "<div>You could write HTML right here if you wanted to, useful for debugging</div>"

        // by declaring a scope property, we basically specify the parameters that should go in and out of the directive
        scope: {
            'stop': '='
        },

        //this controller is only here as a placeholder for now. You can omit it in your own code.
        controller: ['$scope', function($scope) {
            // more on controllers later.
        }]
    };
});

module.exports = busStopModule.name;