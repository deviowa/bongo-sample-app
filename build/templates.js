angular.module("templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("mainMenu/mainMenu.html","Main menu!");
$templateCache.put("about.html","<h1>About</h1><p>Written by<span id=\"author-name\">Riley Eynon-Lynch</span></p>");
$templateCache.put("home.html","<h1 id=\"app-title\">Amazing Bus Route Navigator!</h1>");}]);