var apiServiceModule = angular.module('angularcourse-bongo-service-module', []);
module.exports = apiServiceModule.name;

// BONGO_API_KEY is defined here but you could also require users of your module to define it themselves.
// For example, we might have defined BONGO_API_KEY in app.js at the top level, for easy configuration later
// without hunting through all of our JS files.
apiServiceModule.constant('BONGO_API_KEY', 'MTFUcpZstkSBFKg4QlsKNk9z4oBEodyM');

apiServiceModule.factory('bongoService', ['BONGO_API_KEY', '$http', function (BONGO_API_KEY, $http) {

    // Angular will run "factory" code once, and remember the return value. Later, any code which requests
    // 'bongoService' to be injected will receive the SAME, EXACTLY IDENTICAL OBJECT.
    // So, for example...


    // This code will run exactly once per angular app
    var apiRoot = 'http://api.ebongo.org/';

    var defaultParams = {
        format: 'json',
        api_key: BONGO_API_KEY
    };

    function makeCall(path, callParams) {
        var requestParams = angular.extend(angular.copy(defaultParams), callParams);

        return $http.get(apiRoot + path, {
            params: requestParams
        });
    }

    // This return value will be stored by angular, and the exact same object will be given to any code that
    // requests the 'bongoService' dependency injection.

    return {
        busLocations: function(agency, route) {
            return makeCall('buslocation', {agency: agency, route: route}); },

        prediction: function(stopId) {
            return makeCall('prediction', {stopid: stopId}); },

        routeList: function() {
            return makeCall('routelist') },

        routeInfo: function(agency, route) {
            return makeCall('route', {agency: agency, route: route}) },

        stopInfo: function(stopId) {
            return makeCall('stop', {stopid: stopId})
                .then(function(response) { return response.data.stopinfo; })
        },

        stopList: function() {
            return makeCall('stoplist'); }
    };

}]);