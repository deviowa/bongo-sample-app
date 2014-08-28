var mainMenuModule = require('./mainMenu/module');
var uiRouter = require('angular-ui-router');

var app = angular.module('angularcourse', ['templates', uiRouter, mainMenuModule.name]);

app.config(['$urlRouterProvider', function($urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
}]);

app.config(['$stateProvider', function($stateProvider) {

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