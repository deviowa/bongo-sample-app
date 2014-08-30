var stopsModule = angular.module('angularcourse-stops', []);

console.log("Loading stops module!");

stopsModule.directive('busStop', function () {
    return {
        restrict: 'E',
        templateUrl: 'stops/busStop.html'
    };
});

module.exports = stopsModule;