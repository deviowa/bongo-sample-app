var navigationModule = require('./navigation/module');
var stopsModule = require('./stops/module');

var app = angular.module('angularcourse', ['templates', navigationModule.name, stopsModule.name]);

