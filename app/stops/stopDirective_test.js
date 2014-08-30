describe('thing', function () {

    // we're fetching an injector from angular that knows about 'ng' and 'angularcourse'
    var inject = angular.injector(['ng', 'angularcourse']).invoke;

    // this is a bit of boilerplate to easily compile some markup
    function compile(markup) {
        return inject(function ($compile, $rootScope) {
            var element = $compile(markup)($rootScope.$new());
            $rootScope.$digest();
            return element;
        });
    }

    // this is the actual test
    it('compiles and displays "Bus stop"', function () {
        var busStopDirective = compile("<bus-stop></bus-stop>");

        expect(busStopDirective.html()).toContain("Title of Stop");
    });
});