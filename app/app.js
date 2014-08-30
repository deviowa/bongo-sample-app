var mainMenuModule = require('./mainMenu/module');
var navigationModule = require('./navigation/module');

var app = angular.module('angularcourse', ['templates', navigationModule.name, mainMenuModule.name]);

