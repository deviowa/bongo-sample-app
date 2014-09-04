var navigationModule = require('./navigation/module');

var app = angular.module('angularcourse', [
    'templates',
    navigationModule.name,
    require('./directives/module')
]);

