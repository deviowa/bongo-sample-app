(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var mainMenuModule = require('./mainMenu/module');
var app = angular.module('angularcourse', ['templates', mainMenuModule.name]);


},{"./mainMenu/module":2}],2:[function(require,module,exports){
var test = require('./test.coffee');

var angularModule = angular.module('main-menu', []);

angularModule.controller('MainMenuController', [function() {
    var mainMenuController = this;

    mainMenuController.lessons = [
        {name: 'Lesson 1!'}
    ];
}]);

module.exports = angularModule;

},{"./test.coffee":3}],3:[function(require,module,exports){




},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9yZWwvRG9jdW1lbnRzL2FuZ3VsYXJDb3Vyc2Uvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3JlbC9Eb2N1bWVudHMvYW5ndWxhckNvdXJzZS9hcHAvZmFrZV80MzJkOGY1OC5qcyIsIi9Vc2Vycy9yZWwvRG9jdW1lbnRzL2FuZ3VsYXJDb3Vyc2UvYXBwL21haW5NZW51L21vZHVsZS5qcyIsIi9Vc2Vycy9yZWwvRG9jdW1lbnRzL2FuZ3VsYXJDb3Vyc2UvYXBwL21haW5NZW51L3Rlc3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgbWFpbk1lbnVNb2R1bGUgPSByZXF1aXJlKCcuL21haW5NZW51L21vZHVsZScpO1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyY291cnNlJywgWyd0ZW1wbGF0ZXMnLCBtYWluTWVudU1vZHVsZS5uYW1lXSk7XG5cbiIsInZhciB0ZXN0ID0gcmVxdWlyZSgnLi90ZXN0LmNvZmZlZScpO1xuXG52YXIgYW5ndWxhck1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdtYWluLW1lbnUnLCBbXSk7XG5cbmFuZ3VsYXJNb2R1bGUuY29udHJvbGxlcignTWFpbk1lbnVDb250cm9sbGVyJywgW2Z1bmN0aW9uKCkge1xuICAgIHZhciBtYWluTWVudUNvbnRyb2xsZXIgPSB0aGlzO1xuXG4gICAgbWFpbk1lbnVDb250cm9sbGVyLmxlc3NvbnMgPSBbXG4gICAgICAgIHtuYW1lOiAnTGVzc29uIDEhJ31cbiAgICBdO1xufV0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXJNb2R1bGU7XG4iLCJcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pTDFWelpYSnpMM0psYkM5RWIyTjFiV1Z1ZEhNdllXNW5kV3hoY2tOdmRYSnpaUzloY0hBdmJXRnBiazFsYm5VdmRHVnpkQzVqYjJabVpXVWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGN5STZXeUl2VlhObGNuTXZjbVZzTDBSdlkzVnRaVzUwY3k5aGJtZDFiR0Z5UTI5MWNuTmxMMkZ3Y0M5dFlXbHVUV1Z1ZFM5MFpYTjBMbU52Wm1abFpTSmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaVFVRkJRU0lzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSWlKZGZRPT1cbiJdfQ==
