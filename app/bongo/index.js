/**
 * Steps for making a new directive
 * 1. define directive in a js file (see busStop.js for example)
 * 2. require the js file here (or in any module that is loaded)
 * 3. use the directive selector in your markup
 */

var bongoModule = angular.module('angularcourse-bongo', [
    require('./bus-stop/busStop'),
    require('./apiService')
]);

module.exports = bongoModule.name;