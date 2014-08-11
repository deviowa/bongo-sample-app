var test = require('./test.coffee');

var angularModule = angular.module('main-menu', []);

angularModule.controller('MainMenuController', [function() {
    var mainMenuController = this;

    mainMenuController.lessons = [
        {name: 'Lesson 1!'}
    ];
}]);

module.exports = angularModule;
