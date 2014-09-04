var busStopModule = angular.module('angularcourse-bus-stop', [])

busStopModule.directive('busStop', function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/bus-stop/busStop.html'
    };
});

module.exports = busStopModule.name;