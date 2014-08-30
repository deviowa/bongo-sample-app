describe('thing', function () {

    // we're fetching an injector from angular that knows about 'ng' and 'angularcourse'
    var inject = angular.injector(['ng', 'angularcourse']).invoke;

    // this is a bit of near-boilerplate that simulates generating a bus-stop directive
    function createStopDirective() {
        return inject(function ($compile, $rootScope) {
            var element = $compile("<bus-stop></bus-stop>")($rootScope.$new());
            $rootScope.$digest();
            return element;
        });
    }

    // this is the actual test
    it('compiles and displays "Bus stop"', function () {
        var busStopDirective = createStopDirective();
        
        expect(busStopDirective.html()).toContain("Title of Stop");
    });
});