var angularModule = angular.module('angularcourse-routes', [
    require('angular-ui-router')
]);

angularModule.config(['$urlRouterProvider', function($urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
}]);

angularModule.config(['$stateProvider', function($stateProvider) {

    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'home.html'
        })
        .state('about', {
            url: '/about',
            templateUrl: 'about.html'
        });
}]);

module.exports = angularModule.name;