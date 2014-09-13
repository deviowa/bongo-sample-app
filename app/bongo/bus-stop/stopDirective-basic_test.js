describe('thing', function () {

    // test-global variables that will be used to manipulate the dependency-injection at different phases
    var bongoService, $compile, $rootScope, $q;

    beforeEach(module("angularcourse", function ($provide) {
        var mockBongoService = {
            stopInfo: function (stopId) {
                var stop7213 = {"stopid": "7213", "stoptitle": "College Street and Governor street", "latitude": "41.6589299", "longitude": "-91.5226999", "routes": [
                    {"title": "7th Avenue", "tag": "7thave", "agency": "iowa-city"}
                ]};
                if (stopId === 7213) {
                    return $q.when(stop7213);
                } else {
                    throw new Error("Not implemented");
                }
            }
        };

        $provide.value('bongoService', mockBongoService);
    }));

    beforeEach(inject(function (_bongoService_, _$compile_, _$rootScope_, _$q_) {
        bongoService = bongoService;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $q = _$q_;
    }));

    // this is a bit of boilerplate to easily compile some markup
    function compile(markup) {
        var element = $compile(markup)($rootScope.$new());
        $rootScope.$digest();
        return element;
    }

    // this is the actual test
    it('compiles bus-stop and displays correct template', function () {
        var busStopDirective = compile("<bus-stop stop-id='7213'></bus-stop>");
        expect(busStopDirective.html()).toContain("College Street and Governor street");
    });
});