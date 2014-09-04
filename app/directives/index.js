/**
 * Steps for making a new directive
 * 1. define directive in a js file (see busStop.js for example)
 * 2. require the js file here (or in any module that is loaded)
 * 3. use the directive selector in your markup
 */

var directivesModule = angular.module('angularcourse-stops', [
    require('./bus-stop/busStop')
]);


module.exports = directivesModule.name;