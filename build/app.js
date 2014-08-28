(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var mainMenuModule = require('./mainMenu/module');
var uiRouter = require('angular-ui-router');

var app = angular.module('angularcourse', ['templates', uiRouter, mainMenuModule.name]);

app.config(['$urlRouterProvider', function($urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
}]);

app.config(['$stateProvider', function($stateProvider) {

    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'home.html'
        })
        .state('about', {
            url: '/about',
            templateUrl: 'about.html'
        });
}]);
},{"./mainMenu/module":2,"angular-ui-router":4}],2:[function(require,module,exports){
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




},{}],4:[function(require,module,exports){
/**
 * State-based routing for AngularJS
 * @version v0.2.10
 * @link http://angular-ui.github.com/
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

/* commonjs package manager support (eg componentjs) */
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){
  module.exports = 'ui.router';
}

(function (window, angular, undefined) {
/*jshint globalstrict:true*/
/*global angular:false*/
'use strict';

var isDefined = angular.isDefined,
    isFunction = angular.isFunction,
    isString = angular.isString,
    isObject = angular.isObject,
    isArray = angular.isArray,
    forEach = angular.forEach,
    extend = angular.extend,
    copy = angular.copy;

function inherit(parent, extra) {
  return extend(new (extend(function() {}, { prototype: parent }))(), extra);
}

function merge(dst) {
  forEach(arguments, function(obj) {
    if (obj !== dst) {
      forEach(obj, function(value, key) {
        if (!dst.hasOwnProperty(key)) dst[key] = value;
      });
    }
  });
  return dst;
}

/**
 * Finds the common ancestor path between two states.
 *
 * @param {Object} first The first state.
 * @param {Object} second The second state.
 * @return {Array} Returns an array of state names in descending order, not including the root.
 */
function ancestors(first, second) {
  var path = [];

  for (var n in first.path) {
    if (first.path[n] !== second.path[n]) break;
    path.push(first.path[n]);
  }
  return path;
}

/**
 * IE8-safe wrapper for `Object.keys()`.
 *
 * @param {Object} object A JavaScript object.
 * @return {Array} Returns the keys of the object as an array.
 */
function keys(object) {
  if (Object.keys) {
    return Object.keys(object);
  }
  var result = [];

  angular.forEach(object, function(val, key) {
    result.push(key);
  });
  return result;
}

/**
 * IE8-safe wrapper for `Array.prototype.indexOf()`.
 *
 * @param {Array} array A JavaScript array.
 * @param {*} value A value to search the array for.
 * @return {Number} Returns the array index value of `value`, or `-1` if not present.
 */
function arraySearch(array, value) {
  if (Array.prototype.indexOf) {
    return array.indexOf(value, Number(arguments[2]) || 0);
  }
  var len = array.length >>> 0, from = Number(arguments[2]) || 0;
  from = (from < 0) ? Math.ceil(from) : Math.floor(from);

  if (from < 0) from += len;

  for (; from < len; from++) {
    if (from in array && array[from] === value) return from;
  }
  return -1;
}

/**
 * Merges a set of parameters with all parameters inherited between the common parents of the
 * current state and a given destination state.
 *
 * @param {Object} currentParams The value of the current state parameters ($stateParams).
 * @param {Object} newParams The set of parameters which will be composited with inherited params.
 * @param {Object} $current Internal definition of object representing the current state.
 * @param {Object} $to Internal definition of object representing state to transition to.
 */
function inheritParams(currentParams, newParams, $current, $to) {
  var parents = ancestors($current, $to), parentParams, inherited = {}, inheritList = [];

  for (var i in parents) {
    if (!parents[i].params || !parents[i].params.length) continue;
    parentParams = parents[i].params;

    for (var j in parentParams) {
      if (arraySearch(inheritList, parentParams[j]) >= 0) continue;
      inheritList.push(parentParams[j]);
      inherited[parentParams[j]] = currentParams[parentParams[j]];
    }
  }
  return extend({}, inherited, newParams);
}

/**
 * Normalizes a set of values to string or `null`, filtering them by a list of keys.
 *
 * @param {Array} keys The list of keys to normalize/return.
 * @param {Object} values An object hash of values to normalize.
 * @return {Object} Returns an object hash of normalized string values.
 */
function normalize(keys, values) {
  var normalized = {};

  forEach(keys, function (name) {
    var value = values[name];
    normalized[name] = (value != null) ? String(value) : null;
  });
  return normalized;
}

/**
 * Performs a non-strict comparison of the subset of two objects, defined by a list of keys.
 *
 * @param {Object} a The first object.
 * @param {Object} b The second object.
 * @param {Array} keys The list of keys within each object to compare. If the list is empty or not specified,
 *                     it defaults to the list of keys in `a`.
 * @return {Boolean} Returns `true` if the keys match, otherwise `false`.
 */
function equalForKeys(a, b, keys) {
  if (!keys) {
    keys = [];
    for (var n in a) keys.push(n); // Used instead of Object.keys() for IE8 compatibility
  }

  for (var i=0; i<keys.length; i++) {
    var k = keys[i];
    if (a[k] != b[k]) return false; // Not '===', values aren't necessarily normalized
  }
  return true;
}

/**
 * Returns the subset of an object, based on a list of keys.
 *
 * @param {Array} keys
 * @param {Object} values
 * @return {Boolean} Returns a subset of `values`.
 */
function filterByKeys(keys, values) {
  var filtered = {};

  forEach(keys, function (name) {
    filtered[name] = values[name];
  });
  return filtered;
}
/**
 * @ngdoc overview
 * @name ui.router.util
 *
 * @description
 * # ui.router.util sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.util', ['ng']);

/**
 * @ngdoc overview
 * @name ui.router.router
 * 
 * @requires ui.router.util
 *
 * @description
 * # ui.router.router sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 */
angular.module('ui.router.router', ['ui.router.util']);

/**
 * @ngdoc overview
 * @name ui.router.state
 * 
 * @requires ui.router.router
 * @requires ui.router.util
 *
 * @description
 * # ui.router.state sub-module
 *
 * This module is a dependency of the main ui.router module. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 * 
 */
angular.module('ui.router.state', ['ui.router.router', 'ui.router.util']);

/**
 * @ngdoc overview
 * @name ui.router
 *
 * @requires ui.router.state
 *
 * @description
 * # ui.router
 * 
 * ## The main module for ui.router 
 * There are several sub-modules included with the ui.router module, however only this module is needed
 * as a dependency within your angular app. The other modules are for organization purposes. 
 *
 * The modules are:
 * * ui.router - the main "umbrella" module
 * * ui.router.router - 
 * 
 * *You'll need to include **only** this module as the dependency within your angular app.*
 * 
 * <pre>
 * <!doctype html>
 * <html ng-app="myApp">
 * <head>
 *   <script src="js/angular.js"></script>
 *   <!-- Include the ui-router script -->
 *   <script src="js/angular-ui-router.min.js"></script>
 *   <script>
 *     // ...and add 'ui.router' as a dependency
 *     var myApp = angular.module('myApp', ['ui.router']);
 *   </script>
 * </head>
 * <body>
 * </body>
 * </html>
 * </pre>
 */
angular.module('ui.router', ['ui.router.state']);

angular.module('ui.router.compat', ['ui.router']);

/**
 * @ngdoc object
 * @name ui.router.util.$resolve
 *
 * @requires $q
 * @requires $injector
 *
 * @description
 * Manages resolution of (acyclic) graphs of promises.
 */
$Resolve.$inject = ['$q', '$injector'];
function $Resolve(  $q,    $injector) {
  
  var VISIT_IN_PROGRESS = 1,
      VISIT_DONE = 2,
      NOTHING = {},
      NO_DEPENDENCIES = [],
      NO_LOCALS = NOTHING,
      NO_PARENT = extend($q.when(NOTHING), { $$promises: NOTHING, $$values: NOTHING });
  

  /**
   * @ngdoc function
   * @name ui.router.util.$resolve#study
   * @methodOf ui.router.util.$resolve
   *
   * @description
   * Studies a set of invocables that are likely to be used multiple times.
   * <pre>
   * $resolve.study(invocables)(locals, parent, self)
   * </pre>
   * is equivalent to
   * <pre>
   * $resolve.resolve(invocables, locals, parent, self)
   * </pre>
   * but the former is more efficient (in fact `resolve` just calls `study` 
   * internally).
   *
   * @param {object} invocables Invocable objects
   * @return {function} a function to pass in locals, parent and self
   */
  this.study = function (invocables) {
    if (!isObject(invocables)) throw new Error("'invocables' must be an object");
    
    // Perform a topological sort of invocables to build an ordered plan
    var plan = [], cycle = [], visited = {};
    function visit(value, key) {
      if (visited[key] === VISIT_DONE) return;
      
      cycle.push(key);
      if (visited[key] === VISIT_IN_PROGRESS) {
        cycle.splice(0, cycle.indexOf(key));
        throw new Error("Cyclic dependency: " + cycle.join(" -> "));
      }
      visited[key] = VISIT_IN_PROGRESS;
      
      if (isString(value)) {
        plan.push(key, [ function() { return $injector.get(value); }], NO_DEPENDENCIES);
      } else {
        var params = $injector.annotate(value);
        forEach(params, function (param) {
          if (param !== key && invocables.hasOwnProperty(param)) visit(invocables[param], param);
        });
        plan.push(key, value, params);
      }
      
      cycle.pop();
      visited[key] = VISIT_DONE;
    }
    forEach(invocables, visit);
    invocables = cycle = visited = null; // plan is all that's required
    
    function isResolve(value) {
      return isObject(value) && value.then && value.$$promises;
    }
    
    return function (locals, parent, self) {
      if (isResolve(locals) && self === undefined) {
        self = parent; parent = locals; locals = null;
      }
      if (!locals) locals = NO_LOCALS;
      else if (!isObject(locals)) {
        throw new Error("'locals' must be an object");
      }       
      if (!parent) parent = NO_PARENT;
      else if (!isResolve(parent)) {
        throw new Error("'parent' must be a promise returned by $resolve.resolve()");
      }
      
      // To complete the overall resolution, we have to wait for the parent
      // promise and for the promise for each invokable in our plan.
      var resolution = $q.defer(),
          result = resolution.promise,
          promises = result.$$promises = {},
          values = extend({}, locals),
          wait = 1 + plan.length/3,
          merged = false;
          
      function done() {
        // Merge parent values we haven't got yet and publish our own $$values
        if (!--wait) {
          if (!merged) merge(values, parent.$$values); 
          result.$$values = values;
          result.$$promises = true; // keep for isResolve()
          resolution.resolve(values);
        }
      }
      
      function fail(reason) {
        result.$$failure = reason;
        resolution.reject(reason);
      }
      
      // Short-circuit if parent has already failed
      if (isDefined(parent.$$failure)) {
        fail(parent.$$failure);
        return result;
      }
      
      // Merge parent values if the parent has already resolved, or merge
      // parent promises and wait if the parent resolve is still in progress.
      if (parent.$$values) {
        merged = merge(values, parent.$$values);
        done();
      } else {
        extend(promises, parent.$$promises);
        parent.then(done, fail);
      }
      
      // Process each invocable in the plan, but ignore any where a local of the same name exists.
      for (var i=0, ii=plan.length; i<ii; i+=3) {
        if (locals.hasOwnProperty(plan[i])) done();
        else invoke(plan[i], plan[i+1], plan[i+2]);
      }
      
      function invoke(key, invocable, params) {
        // Create a deferred for this invocation. Failures will propagate to the resolution as well.
        var invocation = $q.defer(), waitParams = 0;
        function onfailure(reason) {
          invocation.reject(reason);
          fail(reason);
        }
        // Wait for any parameter that we have a promise for (either from parent or from this
        // resolve; in that case study() will have made sure it's ordered before us in the plan).
        forEach(params, function (dep) {
          if (promises.hasOwnProperty(dep) && !locals.hasOwnProperty(dep)) {
            waitParams++;
            promises[dep].then(function (result) {
              values[dep] = result;
              if (!(--waitParams)) proceed();
            }, onfailure);
          }
        });
        if (!waitParams) proceed();
        function proceed() {
          if (isDefined(result.$$failure)) return;
          try {
            invocation.resolve($injector.invoke(invocable, self, values));
            invocation.promise.then(function (result) {
              values[key] = result;
              done();
            }, onfailure);
          } catch (e) {
            onfailure(e);
          }
        }
        // Publish promise synchronously; invocations further down in the plan may depend on it.
        promises[key] = invocation.promise;
      }
      
      return result;
    };
  };
  
  /**
   * @ngdoc function
   * @name ui.router.util.$resolve#resolve
   * @methodOf ui.router.util.$resolve
   *
   * @description
   * Resolves a set of invocables. An invocable is a function to be invoked via 
   * `$injector.invoke()`, and can have an arbitrary number of dependencies. 
   * An invocable can either return a value directly,
   * or a `$q` promise. If a promise is returned it will be resolved and the 
   * resulting value will be used instead. Dependencies of invocables are resolved 
   * (in this order of precedence)
   *
   * - from the specified `locals`
   * - from another invocable that is part of this `$resolve` call
   * - from an invocable that is inherited from a `parent` call to `$resolve` 
   *   (or recursively
   * - from any ancestor `$resolve` of that parent).
   *
   * The return value of `$resolve` is a promise for an object that contains 
   * (in this order of precedence)
   *
   * - any `locals` (if specified)
   * - the resolved return values of all injectables
   * - any values inherited from a `parent` call to `$resolve` (if specified)
   *
   * The promise will resolve after the `parent` promise (if any) and all promises 
   * returned by injectables have been resolved. If any invocable 
   * (or `$injector.invoke`) throws an exception, or if a promise returned by an 
   * invocable is rejected, the `$resolve` promise is immediately rejected with the 
   * same error. A rejection of a `parent` promise (if specified) will likewise be 
   * propagated immediately. Once the `$resolve` promise has been rejected, no 
   * further invocables will be called.
   * 
   * Cyclic dependencies between invocables are not permitted and will caues `$resolve`
   * to throw an error. As a special case, an injectable can depend on a parameter 
   * with the same name as the injectable, which will be fulfilled from the `parent` 
   * injectable of the same name. This allows inherited values to be decorated. 
   * Note that in this case any other injectable in the same `$resolve` with the same
   * dependency would see the decorated value, not the inherited value.
   *
   * Note that missing dependencies -- unlike cyclic dependencies -- will cause an 
   * (asynchronous) rejection of the `$resolve` promise rather than a (synchronous) 
   * exception.
   *
   * Invocables are invoked eagerly as soon as all dependencies are available. 
   * This is true even for dependencies inherited from a `parent` call to `$resolve`.
   *
   * As a special case, an invocable can be a string, in which case it is taken to 
   * be a service name to be passed to `$injector.get()`. This is supported primarily 
   * for backwards-compatibility with the `resolve` property of `$routeProvider` 
   * routes.
   *
   * @param {object} invocables functions to invoke or 
   * `$injector` services to fetch.
   * @param {object} locals  values to make available to the injectables
   * @param {object} parent  a promise returned by another call to `$resolve`.
   * @param {object} self  the `this` for the invoked methods
   * @return {object} Promise for an object that contains the resolved return value
   * of all invocables, as well as any inherited and local values.
   */
  this.resolve = function (invocables, locals, parent, self) {
    return this.study(invocables)(locals, parent, self);
  };
}

angular.module('ui.router.util').service('$resolve', $Resolve);


/**
 * @ngdoc object
 * @name ui.router.util.$templateFactory
 *
 * @requires $http
 * @requires $templateCache
 * @requires $injector
 *
 * @description
 * Service. Manages loading of templates.
 */
$TemplateFactory.$inject = ['$http', '$templateCache', '$injector'];
function $TemplateFactory(  $http,   $templateCache,   $injector) {

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromConfig
   * @methodOf ui.router.util.$templateFactory
   *
   * @description
   * Creates a template from a configuration object. 
   *
   * @param {object} config Configuration object for which to load a template. 
   * The following properties are search in the specified order, and the first one 
   * that is defined is used to create the template:
   *
   * @param {string|object} config.template html string template or function to 
   * load via {@link ui.router.util.$templateFactory#fromString fromString}.
   * @param {string|object} config.templateUrl url to load or a function returning 
   * the url to load via {@link ui.router.util.$templateFactory#fromUrl fromUrl}.
   * @param {Function} config.templateProvider function to invoke via 
   * {@link ui.router.util.$templateFactory#fromProvider fromProvider}.
   * @param {object} params  Parameters to pass to the template function.
   * @param {object} locals Locals to pass to `invoke` if the template is loaded 
   * via a `templateProvider`. Defaults to `{ params: params }`.
   *
   * @return {string|object}  The template html as a string, or a promise for 
   * that string,or `null` if no template is configured.
   */
  this.fromConfig = function (config, params, locals) {
    return (
      isDefined(config.template) ? this.fromString(config.template, params) :
      isDefined(config.templateUrl) ? this.fromUrl(config.templateUrl, params) :
      isDefined(config.templateProvider) ? this.fromProvider(config.templateProvider, params, locals) :
      null
    );
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromString
   * @methodOf ui.router.util.$templateFactory
   *
   * @description
   * Creates a template from a string or a function returning a string.
   *
   * @param {string|object} template html template as a string or function that 
   * returns an html template as a string.
   * @param {object} params Parameters to pass to the template function.
   *
   * @return {string|object} The template html as a string, or a promise for that 
   * string.
   */
  this.fromString = function (template, params) {
    return isFunction(template) ? template(params) : template;
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromUrl
   * @methodOf ui.router.util.$templateFactory
   * 
   * @description
   * Loads a template from the a URL via `$http` and `$templateCache`.
   *
   * @param {string|Function} url url of the template to load, or a function 
   * that returns a url.
   * @param {Object} params Parameters to pass to the url function.
   * @return {string|Promise.<string>} The template html as a string, or a promise 
   * for that string.
   */
  this.fromUrl = function (url, params) {
    if (isFunction(url)) url = url(params);
    if (url == null) return null;
    else return $http
        .get(url, { cache: $templateCache })
        .then(function(response) { return response.data; });
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$templateFactory#fromUrl
   * @methodOf ui.router.util.$templateFactory
   *
   * @description
   * Creates a template by invoking an injectable provider function.
   *
   * @param {Function} provider Function to invoke via `$injector.invoke`
   * @param {Object} params Parameters for the template.
   * @param {Object} locals Locals to pass to `invoke`. Defaults to 
   * `{ params: params }`.
   * @return {string|Promise.<string>} The template html as a string, or a promise 
   * for that string.
   */
  this.fromProvider = function (provider, params, locals) {
    return $injector.invoke(provider, null, locals || { params: params });
  };
}

angular.module('ui.router.util').service('$templateFactory', $TemplateFactory);

/**
 * @ngdoc object
 * @name ui.router.util.type:UrlMatcher
 *
 * @description
 * Matches URLs against patterns and extracts named parameters from the path or the search
 * part of the URL. A URL pattern consists of a path pattern, optionally followed by '?' and a list
 * of search parameters. Multiple search parameter names are separated by '&'. Search parameters
 * do not influence whether or not a URL is matched, but their values are passed through into
 * the matched parameters returned by {@link ui.router.util.type:UrlMatcher#methods_exec exec}.
 * 
 * Path parameter placeholders can be specified using simple colon/catch-all syntax or curly brace
 * syntax, which optionally allows a regular expression for the parameter to be specified:
 *
 * * `':'` name - colon placeholder
 * * `'*'` name - catch-all placeholder
 * * `'{' name '}'` - curly placeholder
 * * `'{' name ':' regexp '}'` - curly placeholder with regexp. Should the regexp itself contain
 *   curly braces, they must be in matched pairs or escaped with a backslash.
 *
 * Parameter names may contain only word characters (latin letters, digits, and underscore) and
 * must be unique within the pattern (across both path and search parameters). For colon 
 * placeholders or curly placeholders without an explicit regexp, a path parameter matches any
 * number of characters other than '/'. For catch-all placeholders the path parameter matches
 * any number of characters.
 * 
 * Examples:
 * 
 * * `'/hello/'` - Matches only if the path is exactly '/hello/'. There is no special treatment for
 *   trailing slashes, and patterns have to match the entire path, not just a prefix.
 * * `'/user/:id'` - Matches '/user/bob' or '/user/1234!!!' or even '/user/' but not '/user' or
 *   '/user/bob/details'. The second path segment will be captured as the parameter 'id'.
 * * `'/user/{id}'` - Same as the previous example, but using curly brace syntax.
 * * `'/user/{id:[^/]*}'` - Same as the previous example.
 * * `'/user/{id:[0-9a-fA-F]{1,8}}'` - Similar to the previous example, but only matches if the id
 *   parameter consists of 1 to 8 hex digits.
 * * `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the
 *   path into the parameter 'path'.
 * * `'/files/*path'` - ditto.
 *
 * @param {string} pattern  the pattern to compile into a matcher.
 *
 * @property {string} prefix  A static prefix of this pattern. The matcher guarantees that any
 *   URL matching this matcher (i.e. any string for which {@link ui.router.util.type:UrlMatcher#methods_exec exec()} returns
 *   non-null) will start with this prefix.
 *
 * @property {string} source  The pattern that was passed into the contructor
 *
 * @property {string} sourcePath  The path portion of the source property
 *
 * @property {string} sourceSearch  The search portion of the source property
 *
 * @property {string} regex  The constructed regex that will be used to match against the url when 
 *   it is time to determine which url will match.
 *
 * @returns {Object}  New UrlMatcher object
 */
function UrlMatcher(pattern) {

  // Find all placeholders and create a compiled pattern, using either classic or curly syntax:
  //   '*' name
  //   ':' name
  //   '{' name '}'
  //   '{' name ':' regexp '}'
  // The regular expression is somewhat complicated due to the need to allow curly braces
  // inside the regular expression. The placeholder regexp breaks down as follows:
  //    ([:*])(\w+)               classic placeholder ($1 / $2)
  //    \{(\w+)(?:\:( ... ))?\}   curly brace placeholder ($3) with optional regexp ... ($4)
  //    (?: ... | ... | ... )+    the regexp consists of any number of atoms, an atom being either
  //    [^{}\\]+                  - anything other than curly braces or backslash
  //    \\.                       - a backslash escape
  //    \{(?:[^{}\\]+|\\.)*\}     - a matched set of curly braces containing other atoms
  var placeholder = /([:*])(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
      names = {}, compiled = '^', last = 0, m,
      segments = this.segments = [],
      params = this.params = [];

  function addParameter(id) {
    if (!/^\w+(-+\w+)*$/.test(id)) throw new Error("Invalid parameter name '" + id + "' in pattern '" + pattern + "'");
    if (names[id]) throw new Error("Duplicate parameter name '" + id + "' in pattern '" + pattern + "'");
    names[id] = true;
    params.push(id);
  }

  function quoteRegExp(string) {
    return string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
  }

  this.source = pattern;

  // Split into static segments separated by path parameter placeholders.
  // The number of segments is always 1 more than the number of parameters.
  var id, regexp, segment;
  while ((m = placeholder.exec(pattern))) {
    id = m[2] || m[3]; // IE[78] returns '' for unmatched groups instead of null
    regexp = m[4] || (m[1] == '*' ? '.*' : '[^/]*');
    segment = pattern.substring(last, m.index);
    if (segment.indexOf('?') >= 0) break; // we're into the search part
    compiled += quoteRegExp(segment) + '(' + regexp + ')';
    addParameter(id);
    segments.push(segment);
    last = placeholder.lastIndex;
  }
  segment = pattern.substring(last);

  // Find any search parameter names and remove them from the last segment
  var i = segment.indexOf('?');
  if (i >= 0) {
    var search = this.sourceSearch = segment.substring(i);
    segment = segment.substring(0, i);
    this.sourcePath = pattern.substring(0, last+i);

    // Allow parameters to be separated by '?' as well as '&' to make concat() easier
    forEach(search.substring(1).split(/[&?]/), addParameter);
  } else {
    this.sourcePath = pattern;
    this.sourceSearch = '';
  }

  compiled += quoteRegExp(segment) + '$';
  segments.push(segment);
  this.regexp = new RegExp(compiled);
  this.prefix = segments[0];
}

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#concat
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Returns a new matcher for a pattern constructed by appending the path part and adding the
 * search parameters of the specified pattern to this pattern. The current pattern is not
 * modified. This can be understood as creating a pattern for URLs that are relative to (or
 * suffixes of) the current pattern.
 *
 * @example
 * The following two matchers are equivalent:
 * ```
 * new UrlMatcher('/user/{id}?q').concat('/details?date');
 * new UrlMatcher('/user/{id}/details?q&date');
 * ```
 *
 * @param {string} pattern  The pattern to append.
 * @returns {ui.router.util.type:UrlMatcher}  A matcher for the concatenated pattern.
 */
UrlMatcher.prototype.concat = function (pattern) {
  // Because order of search parameters is irrelevant, we can add our own search
  // parameters to the end of the new pattern. Parse the new pattern by itself
  // and then join the bits together, but it's much easier to do this on a string level.
  return new UrlMatcher(this.sourcePath + pattern + this.sourceSearch);
};

UrlMatcher.prototype.toString = function () {
  return this.source;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#exec
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Tests the specified path against this matcher, and returns an object containing the captured
 * parameter values, or null if the path does not match. The returned object contains the values
 * of any search parameters that are mentioned in the pattern, but their value may be null if
 * they are not present in `searchParams`. This means that search parameters are always treated
 * as optional.
 *
 * @example
 * ```
 * new UrlMatcher('/user/{id}?q&r').exec('/user/bob', { x:'1', q:'hello' });
 * // returns { id:'bob', q:'hello', r:null }
 * ```
 *
 * @param {string} path  The URL path to match, e.g. `$location.path()`.
 * @param {Object} searchParams  URL search parameters, e.g. `$location.search()`.
 * @returns {Object}  The captured parameter values.
 */
UrlMatcher.prototype.exec = function (path, searchParams) {
  var m = this.regexp.exec(path);
  if (!m) return null;

  var params = this.params, nTotal = params.length,
    nPath = this.segments.length-1,
    values = {}, i;

  if (nPath !== m.length - 1) throw new Error("Unbalanced capture group in route '" + this.source + "'");

  for (i=0; i<nPath; i++) values[params[i]] = m[i+1];
  for (/**/; i<nTotal; i++) values[params[i]] = searchParams[params[i]];

  return values;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#parameters
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Returns the names of all path and search parameters of this pattern in an unspecified order.
 * 
 * @returns {Array.<string>}  An array of parameter names. Must be treated as read-only. If the
 *    pattern has no parameters, an empty array is returned.
 */
UrlMatcher.prototype.parameters = function () {
  return this.params;
};

/**
 * @ngdoc function
 * @name ui.router.util.type:UrlMatcher#format
 * @methodOf ui.router.util.type:UrlMatcher
 *
 * @description
 * Creates a URL that matches this pattern by substituting the specified values
 * for the path and search parameters. Null values for path parameters are
 * treated as empty strings.
 *
 * @example
 * ```
 * new UrlMatcher('/user/{id}?q').format({ id:'bob', q:'yes' });
 * // returns '/user/bob?q=yes'
 * ```
 *
 * @param {Object} values  the values to substitute for the parameters in this pattern.
 * @returns {string}  the formatted URL (path and optionally search part).
 */
UrlMatcher.prototype.format = function (values) {
  var segments = this.segments, params = this.params;
  if (!values) return segments.join('');

  var nPath = segments.length-1, nTotal = params.length,
    result = segments[0], i, search, value;

  for (i=0; i<nPath; i++) {
    value = values[params[i]];
    // TODO: Maybe we should throw on null here? It's not really good style to use '' and null interchangeabley
    if (value != null) result += encodeURIComponent(value);
    result += segments[i+1];
  }
  for (/**/; i<nTotal; i++) {
    value = values[params[i]];
    if (value != null) {
      result += (search ? '&' : '?') + params[i] + '=' + encodeURIComponent(value);
      search = true;
    }
  }

  return result;
};



/**
 * @ngdoc object
 * @name ui.router.util.$urlMatcherFactory
 *
 * @description
 * Factory for {@link ui.router.util.type:UrlMatcher} instances. The factory is also available to providers
 * under the name `$urlMatcherFactoryProvider`.
 */
function $UrlMatcherFactory() {

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#compile
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Creates a {@link ui.router.util.type:UrlMatcher} for the specified pattern.
   *   
   * @param {string} pattern  The URL pattern.
   * @returns {ui.router.util.type:UrlMatcher}  The UrlMatcher.
   */
  this.compile = function (pattern) {
    return new UrlMatcher(pattern);
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$urlMatcherFactory#isMatcher
   * @methodOf ui.router.util.$urlMatcherFactory
   *
   * @description
   * Returns true if the specified object is a UrlMatcher, or false otherwise.
   *
   * @param {Object} object  The object to perform the type check against.
   * @returns {Boolean}  Returns `true` if the object has the following functions: `exec`, `format`, and `concat`.
   */
  this.isMatcher = function (o) {
    return isObject(o) && isFunction(o.exec) && isFunction(o.format) && isFunction(o.concat);
  };
  
  /* No need to document $get, since it returns this */
  this.$get = function () {
    return this;
  };
}

// Register as a provider so it's available to other providers
angular.module('ui.router.util').provider('$urlMatcherFactory', $UrlMatcherFactory);

/**
 * @ngdoc object
 * @name ui.router.router.$urlRouterProvider
 *
 * @requires ui.router.util.$urlMatcherFactoryProvider
 *
 * @description
 * `$urlRouterProvider` has the responsibility of watching `$location`. 
 * When `$location` changes it runs through a list of rules one by one until a 
 * match is found. `$urlRouterProvider` is used behind the scenes anytime you specify 
 * a url in a state configuration. All urls are compiled into a UrlMatcher object.
 *
 * There are several methods on `$urlRouterProvider` that make it useful to use directly
 * in your module config.
 */
$UrlRouterProvider.$inject = ['$urlMatcherFactoryProvider'];
function $UrlRouterProvider(  $urlMatcherFactory) {
  var rules = [], 
      otherwise = null;

  // Returns a string that is a prefix of all strings matching the RegExp
  function regExpPrefix(re) {
    var prefix = /^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(re.source);
    return (prefix != null) ? prefix[1].replace(/\\(.)/g, "$1") : '';
  }

  // Interpolates matched values into a String.replace()-style pattern
  function interpolate(pattern, match) {
    return pattern.replace(/\$(\$|\d{1,2})/, function (m, what) {
      return match[what === '$' ? 0 : Number(what)];
    });
  }

  /**
   * @ngdoc function
   * @name ui.router.router.$urlRouterProvider#rule
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Defines rules that are used by `$urlRouterProvider to find matches for
   * specific URLs.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *   // Here's an example of how you might allow case insensitive urls
   *   $urlRouterProvider.rule(function ($injector, $location) {
   *     var path = $location.path(),
   *         normalized = path.toLowerCase();
   *
   *     if (path !== normalized) {
   *       return normalized;
   *     }
   *   });
   * });
   * </pre>
   *
   * @param {object} rule Handler function that takes `$injector` and `$location`
   * services as arguments. You can use them to return a valid path as a string.
   *
   * @return {object} $urlRouterProvider - $urlRouterProvider instance
   */
  this.rule =
    function (rule) {
      if (!isFunction(rule)) throw new Error("'rule' must be a function");
      rules.push(rule);
      return this;
    };

  /**
   * @ngdoc object
   * @name ui.router.router.$urlRouterProvider#otherwise
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Defines a path that is used when an invalied route is requested.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *   // if the path doesn't match any of the urls you configured
   *   // otherwise will take care of routing the user to the
   *   // specified url
   *   $urlRouterProvider.otherwise('/index');
   *
   *   // Example of using function rule as param
   *   $urlRouterProvider.otherwise(function ($injector, $location) {
   *     ...
   *   });
   * });
   * </pre>
   *
   * @param {string|object} rule The url path you want to redirect to or a function 
   * rule that returns the url path. The function version is passed two params: 
   * `$injector` and `$location` services.
   *
   * @return {object} $urlRouterProvider - $urlRouterProvider instance
   */
  this.otherwise =
    function (rule) {
      if (isString(rule)) {
        var redirect = rule;
        rule = function () { return redirect; };
      }
      else if (!isFunction(rule)) throw new Error("'rule' must be a function");
      otherwise = rule;
      return this;
    };


  function handleIfMatch($injector, handler, match) {
    if (!match) return false;
    var result = $injector.invoke(handler, handler, { $match: match });
    return isDefined(result) ? result : true;
  }

  /**
   * @ngdoc function
   * @name ui.router.router.$urlRouterProvider#when
   * @methodOf ui.router.router.$urlRouterProvider
   *
   * @description
   * Registers a handler for a given url matching. if handle is a string, it is
   * treated as a redirect, and is interpolated according to the syyntax of match
   * (i.e. like String.replace() for RegExp, or like a UrlMatcher pattern otherwise).
   *
   * If the handler is a function, it is injectable. It gets invoked if `$location`
   * matches. You have the option of inject the match object as `$match`.
   *
   * The handler can return
   *
   * - **falsy** to indicate that the rule didn't match after all, then `$urlRouter`
   *   will continue trying to find another one that matches.
   * - **string** which is treated as a redirect and passed to `$location.url()`
   * - **void** or any **truthy** value tells `$urlRouter` that the url was handled.
   *
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.router']);
   *
   * app.config(function ($urlRouterProvider) {
   *   $urlRouterProvider.when($state.url, function ($match, $stateParams) {
   *     if ($state.$current.navigable !== state ||
   *         !equalForKeys($match, $stateParams) {
   *      $state.transitionTo(state, $match, false);
   *     }
   *   });
   * });
   * </pre>
   *
   * @param {string|object} what The incoming path that you want to redirect.
   * @param {string|object} handler The path you want to redirect your user to.
   */
  this.when =
    function (what, handler) {
      var redirect, handlerIsString = isString(handler);
      if (isString(what)) what = $urlMatcherFactory.compile(what);

      if (!handlerIsString && !isFunction(handler) && !isArray(handler))
        throw new Error("invalid 'handler' in when()");

      var strategies = {
        matcher: function (what, handler) {
          if (handlerIsString) {
            redirect = $urlMatcherFactory.compile(handler);
            handler = ['$match', function ($match) { return redirect.format($match); }];
          }
          return extend(function ($injector, $location) {
            return handleIfMatch($injector, handler, what.exec($location.path(), $location.search()));
          }, {
            prefix: isString(what.prefix) ? what.prefix : ''
          });
        },
        regex: function (what, handler) {
          if (what.global || what.sticky) throw new Error("when() RegExp must not be global or sticky");

          if (handlerIsString) {
            redirect = handler;
            handler = ['$match', function ($match) { return interpolate(redirect, $match); }];
          }
          return extend(function ($injector, $location) {
            return handleIfMatch($injector, handler, what.exec($location.path()));
          }, {
            prefix: regExpPrefix(what)
          });
        }
      };

      var check = { matcher: $urlMatcherFactory.isMatcher(what), regex: what instanceof RegExp };

      for (var n in check) {
        if (check[n]) {
          return this.rule(strategies[n](what, handler));
        }
      }

      throw new Error("invalid 'what' in when()");
    };

  /**
   * @ngdoc object
   * @name ui.router.router.$urlRouter
   *
   * @requires $location
   * @requires $rootScope
   * @requires $injector
   *
   * @description
   *
   */
  this.$get =
    [        '$location', '$rootScope', '$injector',
    function ($location,   $rootScope,   $injector) {
      // TODO: Optimize groups of rules with non-empty prefix into some sort of decision tree
      function update(evt) {
        if (evt && evt.defaultPrevented) return;
        function check(rule) {
          var handled = rule($injector, $location);
          if (handled) {
            if (isString(handled)) $location.replace().url(handled);
            return true;
          }
          return false;
        }
        var n=rules.length, i;
        for (i=0; i<n; i++) {
          if (check(rules[i])) return;
        }
        // always check otherwise last to allow dynamic updates to the set of rules
        if (otherwise) check(otherwise);
      }

      $rootScope.$on('$locationChangeSuccess', update);

      return {
        /**
         * @ngdoc function
         * @name ui.router.router.$urlRouter#sync
         * @methodOf ui.router.router.$urlRouter
         *
         * @description
         * Triggers an update; the same update that happens when the address bar url changes, aka `$locationChangeSuccess`.
         * This method is useful when you need to use `preventDefault()` on the `$locationChangeSuccess` event, 
         * perform some custom logic (route protection, auth, config, redirection, etc) and then finally proceed 
         * with the transition by calling `$urlRouter.sync()`.
         *
         * @example
         * <pre>
         * angular.module('app', ['ui.router']);
         *   .run(function($rootScope, $urlRouter) {
         *     $rootScope.$on('$locationChangeSuccess', function(evt) {
         *       // Halt state change from even starting
         *       evt.preventDefault();
         *       // Perform custom logic
         *       var meetsRequirement = ...
         *       // Continue with the update and state transition if logic allows
         *       if (meetsRequirement) $urlRouter.sync();
         *     });
         * });
         * </pre>
         */
        sync: function () {
          update();
        }
      };
    }];
}

angular.module('ui.router.router').provider('$urlRouter', $UrlRouterProvider);

/**
 * @ngdoc object
 * @name ui.router.state.$stateProvider
 *
 * @requires ui.router.router.$urlRouterProvider
 * @requires ui.router.util.$urlMatcherFactoryProvider
 * @requires $locationProvider
 *
 * @description
 * The new `$stateProvider` works similar to Angular's v1 router, but it focuses purely
 * on state.
 *
 * A state corresponds to a "place" in the application in terms of the overall UI and
 * navigation. A state describes (via the controller / template / view properties) what
 * the UI looks like and does at that place.
 *
 * States often have things in common, and the primary way of factoring out these
 * commonalities in this model is via the state hierarchy, i.e. parent/child states aka
 * nested states.
 *
 * The `$stateProvider` provides interfaces to declare these states for your app.
 */
$StateProvider.$inject = ['$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider'];
function $StateProvider(   $urlRouterProvider,   $urlMatcherFactory,           $locationProvider) {

  var root, states = {}, $state, queue = {}, abstractKey = 'abstract';

  // Builds state properties from definition passed to registerState()
  var stateBuilder = {

    // Derive parent state from a hierarchical name only if 'parent' is not explicitly defined.
    // state.children = [];
    // if (parent) parent.children.push(state);
    parent: function(state) {
      if (isDefined(state.parent) && state.parent) return findState(state.parent);
      // regex matches any valid composite state name
      // would match "contact.list" but not "contacts"
      var compositeName = /^(.+)\.[^.]+$/.exec(state.name);
      return compositeName ? findState(compositeName[1]) : root;
    },

    // inherit 'data' from parent and override by own values (if any)
    data: function(state) {
      if (state.parent && state.parent.data) {
        state.data = state.self.data = extend({}, state.parent.data, state.data);
      }
      return state.data;
    },

    // Build a URLMatcher if necessary, either via a relative or absolute URL
    url: function(state) {
      var url = state.url;

      if (isString(url)) {
        if (url.charAt(0) == '^') {
          return $urlMatcherFactory.compile(url.substring(1));
        }
        return (state.parent.navigable || root).url.concat(url);
      }

      if ($urlMatcherFactory.isMatcher(url) || url == null) {
        return url;
      }
      throw new Error("Invalid url '" + url + "' in state '" + state + "'");
    },

    // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
    navigable: function(state) {
      return state.url ? state : (state.parent ? state.parent.navigable : null);
    },

    // Derive parameters for this state and ensure they're a super-set of parent's parameters
    params: function(state) {
      if (!state.params) {
        return state.url ? state.url.parameters() : state.parent.params;
      }
      if (!isArray(state.params)) throw new Error("Invalid params in state '" + state + "'");
      if (state.url) throw new Error("Both params and url specicified in state '" + state + "'");
      return state.params;
    },

    // If there is no explicit multi-view configuration, make one up so we don't have
    // to handle both cases in the view directive later. Note that having an explicit
    // 'views' property will mean the default unnamed view properties are ignored. This
    // is also a good time to resolve view names to absolute names, so everything is a
    // straight lookup at link time.
    views: function(state) {
      var views = {};

      forEach(isDefined(state.views) ? state.views : { '': state }, function (view, name) {
        if (name.indexOf('@') < 0) name += '@' + state.parent.name;
        views[name] = view;
      });
      return views;
    },

    ownParams: function(state) {
      if (!state.parent) {
        return state.params;
      }
      var paramNames = {}; forEach(state.params, function (p) { paramNames[p] = true; });

      forEach(state.parent.params, function (p) {
        if (!paramNames[p]) {
          throw new Error("Missing required parameter '" + p + "' in state '" + state.name + "'");
        }
        paramNames[p] = false;
      });
      var ownParams = [];

      forEach(paramNames, function (own, p) {
        if (own) ownParams.push(p);
      });
      return ownParams;
    },

    // Keep a full path from the root down to this state as this is needed for state activation.
    path: function(state) {
      return state.parent ? state.parent.path.concat(state) : []; // exclude root from path
    },

    // Speed up $state.contains() as it's used a lot
    includes: function(state) {
      var includes = state.parent ? extend({}, state.parent.includes) : {};
      includes[state.name] = true;
      return includes;
    },

    $delegates: {}
  };

  function isRelative(stateName) {
    return stateName.indexOf(".") === 0 || stateName.indexOf("^") === 0;
  }

  function findState(stateOrName, base) {
    var isStr = isString(stateOrName),
        name  = isStr ? stateOrName : stateOrName.name,
        path  = isRelative(name);

    if (path) {
      if (!base) throw new Error("No reference point given for path '"  + name + "'");
      var rel = name.split("."), i = 0, pathLength = rel.length, current = base;

      for (; i < pathLength; i++) {
        if (rel[i] === "" && i === 0) {
          current = base;
          continue;
        }
        if (rel[i] === "^") {
          if (!current.parent) throw new Error("Path '" + name + "' not valid for state '" + base.name + "'");
          current = current.parent;
          continue;
        }
        break;
      }
      rel = rel.slice(i).join(".");
      name = current.name + (current.name && rel ? "." : "") + rel;
    }
    var state = states[name];

    if (state && (isStr || (!isStr && (state === stateOrName || state.self === stateOrName)))) {
      return state;
    }
    return undefined;
  }

  function queueState(parentName, state) {
    if (!queue[parentName]) {
      queue[parentName] = [];
    }
    queue[parentName].push(state);
  }

  function registerState(state) {
    // Wrap a new object around the state so we can store our private details easily.
    state = inherit(state, {
      self: state,
      resolve: state.resolve || {},
      toString: function() { return this.name; }
    });

    var name = state.name;
    if (!isString(name) || name.indexOf('@') >= 0) throw new Error("State must have a valid name");
    if (states.hasOwnProperty(name)) throw new Error("State '" + name + "'' is already defined");

    // Get parent name
    var parentName = (name.indexOf('.') !== -1) ? name.substring(0, name.lastIndexOf('.'))
        : (isString(state.parent)) ? state.parent
        : '';

    // If parent is not registered yet, add state to queue and register later
    if (parentName && !states[parentName]) {
      return queueState(parentName, state.self);
    }

    for (var key in stateBuilder) {
      if (isFunction(stateBuilder[key])) state[key] = stateBuilder[key](state, stateBuilder.$delegates[key]);
    }
    states[name] = state;

    // Register the state in the global state list and with $urlRouter if necessary.
    if (!state[abstractKey] && state.url) {
      $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match, $stateParams) {
        if ($state.$current.navigable != state || !equalForKeys($match, $stateParams)) {
          $state.transitionTo(state, $match, { location: false });
        }
      }]);
    }

    // Register any queued children
    if (queue[name]) {
      for (var i = 0; i < queue[name].length; i++) {
        registerState(queue[name][i]);
      }
    }

    return state;
  }

  // Checks text to see if it looks like a glob.
  function isGlob (text) {
    return text.indexOf('*') > -1;
  }

  // Returns true if glob matches current $state name.
  function doesStateMatchGlob (glob) {
    var globSegments = glob.split('.'),
        segments = $state.$current.name.split('.');

    //match greedy starts
    if (globSegments[0] === '**') {
       segments = segments.slice(segments.indexOf(globSegments[1]));
       segments.unshift('**');
    }
    //match greedy ends
    if (globSegments[globSegments.length - 1] === '**') {
       segments.splice(segments.indexOf(globSegments[globSegments.length - 2]) + 1, Number.MAX_VALUE);
       segments.push('**');
    }

    if (globSegments.length != segments.length) {
      return false;
    }

    //match single stars
    for (var i = 0, l = globSegments.length; i < l; i++) {
      if (globSegments[i] === '*') {
        segments[i] = '*';
      }
    }

    return segments.join('') === globSegments.join('');
  }


  // Implicit root state that is always active
  root = registerState({
    name: '',
    url: '^',
    views: null,
    'abstract': true
  });
  root.navigable = null;


  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#decorator
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Allows you to extend (carefully) or override (at your own peril) the 
   * `stateBuilder` object used internally by `$stateProvider`. This can be used 
   * to add custom functionality to ui-router, for example inferring templateUrl 
   * based on the state name.
   *
   * When passing only a name, it returns the current (original or decorated) builder
   * function that matches `name`.
   *
   * The builder functions that can be decorated are listed below. Though not all
   * necessarily have a good use case for decoration, that is up to you to decide.
   *
   * In addition, users can attach custom decorators, which will generate new 
   * properties within the state's internal definition. There is currently no clear 
   * use-case for this beyond accessing internal states (i.e. $state.$current), 
   * however, expect this to become increasingly relevant as we introduce additional 
   * meta-programming features.
   *
   * **Warning**: Decorators should not be interdependent because the order of 
   * execution of the builder functions in non-deterministic. Builder functions 
   * should only be dependent on the state definition object and super function.
   *
   *
   * Existing builder functions and current return values:
   *
   * - **parent** `{object}` - returns the parent state object.
   * - **data** `{object}` - returns state data, including any inherited data that is not
   *   overridden by own values (if any).
   * - **url** `{object}` - returns a {link ui.router.util.type:UrlMatcher} or null.
   * - **navigable** `{object}` - returns closest ancestor state that has a URL (aka is 
   *   navigable).
   * - **params** `{object}` - returns an array of state params that are ensured to 
   *   be a super-set of parent's params.
   * - **views** `{object}` - returns a views object where each key is an absolute view 
   *   name (i.e. "viewName@stateName") and each value is the config object 
   *   (template, controller) for the view. Even when you don't use the views object 
   *   explicitly on a state config, one is still created for you internally.
   *   So by decorating this builder function you have access to decorating template 
   *   and controller properties.
   * - **ownParams** `{object}` - returns an array of params that belong to the state, 
   *   not including any params defined by ancestor states.
   * - **path** `{string}` - returns the full path from the root down to this state. 
   *   Needed for state activation.
   * - **includes** `{object}` - returns an object that includes every state that 
   *   would pass a '$state.includes()' test.
   *
   * @example
   * <pre>
   * // Override the internal 'views' builder with a function that takes the state
   * // definition, and a reference to the internal function being overridden:
   * $stateProvider.decorator('views', function ($state, parent) {
   *   var result = {},
   *       views = parent(state);
   *
   *   angular.forEach(view, function (config, name) {
   *     var autoName = (state.name + '.' + name).replace('.', '/');
   *     config.templateUrl = config.templateUrl || '/partials/' + autoName + '.html';
   *     result[name] = config;
   *   });
   *   return result;
   * });
   *
   * $stateProvider.state('home', {
   *   views: {
   *     'contact.list': { controller: 'ListController' },
   *     'contact.item': { controller: 'ItemController' }
   *   }
   * });
   *
   * // ...
   *
   * $state.go('home');
   * // Auto-populates list and item views with /partials/home/contact/list.html,
   * // and /partials/home/contact/item.html, respectively.
   * </pre>
   *
   * @param {string} name The name of the builder function to decorate. 
   * @param {object} func A function that is responsible for decorating the original 
   * builder function. The function receives two parameters:
   *
   *   - `{object}` - state - The state config object.
   *   - `{object}` - super - The original builder function.
   *
   * @return {object} $stateProvider - $stateProvider instance
   */
  this.decorator = decorator;
  function decorator(name, func) {
    /*jshint validthis: true */
    if (isString(name) && !isDefined(func)) {
      return stateBuilder[name];
    }
    if (!isFunction(func) || !isString(name)) {
      return this;
    }
    if (stateBuilder[name] && !stateBuilder.$delegates[name]) {
      stateBuilder.$delegates[name] = stateBuilder[name];
    }
    stateBuilder[name] = func;
    return this;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#state
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Registers a state configuration under a given state name. The stateConfig object
   * has the following acceptable properties.
   *
   * <a id='template'></a>
   *
   * - **`template`** - {string|function=} - html template as a string or a function that returns
   *   an html template as a string which should be used by the uiView directives. This property 
   *   takes precedence over templateUrl.
   *   
   *   If `template` is a function, it will be called with the following parameters:
   *
   *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by
   *     applying the current state
   *
   * <a id='templateUrl'></a>
   *
   * - **`templateUrl`** - {string|function=} - path or function that returns a path to an html 
   *   template that should be used by uiView.
   *   
   *   If `templateUrl` is a function, it will be called with the following parameters:
   *
   *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by 
   *     applying the current state
   *
   * <a id='templateProvider'></a>
   *
   * - **`templateProvider`** - {function=} - Provider function that returns HTML content
   *   string.
   *
   * <a id='controller'></a>
   *
   * - **`controller`** - {string|function=} -  Controller fn that should be associated with newly 
   *   related scope or the name of a registered controller if passed as a string.
   *
   * <a id='controllerProvider'></a>
   *
   * - **`controllerProvider`** - {function=} - Injectable provider function that returns
   *   the actual controller or string.
   *
   * <a id='controllerAs'></a>
   * 
   * - **`controllerAs`** – {string=} – A controller alias name. If present the controller will be 
   *   published to scope under the controllerAs name.
   *
   * <a id='resolve'></a>
   *
   * - **`resolve`** - {object.&lt;string, function&gt;=} - An optional map of dependencies which 
   *   should be injected into the controller. If any of these dependencies are promises, 
   *   the router will wait for them all to be resolved or one to be rejected before the 
   *   controller is instantiated. If all the promises are resolved successfully, the values 
   *   of the resolved promises are injected and $stateChangeSuccess event is fired. If any 
   *   of the promises are rejected the $stateChangeError event is fired. The map object is:
   *   
   *   - key - {string}: name of dependency to be injected into controller
   *   - factory - {string|function}: If string then it is alias for service. Otherwise if function, 
   *     it is injected and return value it treated as dependency. If result is a promise, it is 
   *     resolved before its value is injected into controller.
   *
   * <a id='url'></a>
   *
   * - **`url`** - {string=} - A url with optional parameters. When a state is navigated or
   *   transitioned to, the `$stateParams` service will be populated with any 
   *   parameters that were passed.
   *
   * <a id='params'></a>
   *
   * - **`params`** - {object=} - An array of parameter names or regular expressions. Only 
   *   use this within a state if you are not using url. Otherwise you can specify your
   *   parameters within the url. When a state is navigated or transitioned to, the 
   *   $stateParams service will be populated with any parameters that were passed.
   *
   * <a id='views'></a>
   *
   * - **`views`** - {object=} - Use the views property to set up multiple views or to target views
   *   manually/explicitly.
   *
   * <a id='abstract'></a>
   *
   * - **`abstract`** - {boolean=} - An abstract state will never be directly activated, 
   *   but can provide inherited properties to its common children states.
   *
   * <a id='onEnter'></a>
   *
   * - **`onEnter`** - {object=} - Callback function for when a state is entered. Good way
   *   to trigger an action or dispatch an event, such as opening a dialog.
   *
   * <a id='onExit'></a>
   *
   * - **`onExit`** - {object=} - Callback function for when a state is exited. Good way to
   *   trigger an action or dispatch an event, such as opening a dialog.
   *
   * <a id='reloadOnSearch'></a>
   *
   * - **`reloadOnSearch = true`** - {boolean=} - If `false`, will not retrigger the same state 
   *   just because a search/query parameter has changed (via $location.search() or $location.hash()). 
   *   Useful for when you'd like to modify $location.search() without triggering a reload.
   *
   * <a id='data'></a>
   *
   * - **`data`** - {object=} - Arbitrary data object, useful for custom configuration.
   *
   * @example
   * <pre>
   * // Some state name examples
   *
   * // stateName can be a single top-level name (must be unique).
   * $stateProvider.state("home", {});
   *
   * // Or it can be a nested state name. This state is a child of the 
   * // above "home" state.
   * $stateProvider.state("home.newest", {});
   *
   * // Nest states as deeply as needed.
   * $stateProvider.state("home.newest.abc.xyz.inception", {});
   *
   * // state() returns $stateProvider, so you can chain state declarations.
   * $stateProvider
   *   .state("home", {})
   *   .state("about", {})
   *   .state("contacts", {});
   * </pre>
   *
   * @param {string} name A unique state name, e.g. "home", "about", "contacts". 
   * To create a parent/child state use a dot, e.g. "about.sales", "home.newest".
   * @param {object} definition State configuration object.
   */
  this.state = state;
  function state(name, definition) {
    /*jshint validthis: true */
    if (isObject(name)) definition = name;
    else definition.name = name;
    registerState(definition);
    return this;
  }

  /**
   * @ngdoc object
   * @name ui.router.state.$state
   *
   * @requires $rootScope
   * @requires $q
   * @requires ui.router.state.$view
   * @requires $injector
   * @requires ui.router.util.$resolve
   * @requires ui.router.state.$stateParams
   *
   * @property {object} params A param object, e.g. {sectionId: section.id)}, that 
   * you'd like to test against the current active state.
   * @property {object} current A reference to the state's config object. However 
   * you passed it in. Useful for accessing custom data.
   * @property {object} transition Currently pending transition. A promise that'll 
   * resolve or reject.
   *
   * @description
   * `$state` service is responsible for representing states as well as transitioning
   * between them. It also provides interfaces to ask for current state or even states
   * you're coming from.
   */
  // $urlRouter is injected just to ensure it gets instantiated
  this.$get = $get;
  $get.$inject = ['$rootScope', '$q', '$view', '$injector', '$resolve', '$stateParams', '$location', '$urlRouter', '$browser'];
  function $get(   $rootScope,   $q,   $view,   $injector,   $resolve,   $stateParams,   $location,   $urlRouter,   $browser) {

    var TransitionSuperseded = $q.reject(new Error('transition superseded'));
    var TransitionPrevented = $q.reject(new Error('transition prevented'));
    var TransitionAborted = $q.reject(new Error('transition aborted'));
    var TransitionFailed = $q.reject(new Error('transition failed'));
    var currentLocation = $location.url();
    var baseHref = $browser.baseHref();

    function syncUrl() {
      if ($location.url() !== currentLocation) {
        $location.url(currentLocation);
        $location.replace();
      }
    }

    root.locals = { resolve: null, globals: { $stateParams: {} } };
    $state = {
      params: {},
      current: root.self,
      $current: root,
      transition: null
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#reload
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method that force reloads the current state. All resolves are re-resolved, events are not re-fired, 
     * and controllers reinstantiated (bug with controllers reinstantiating right now, fixing soon).
     *
     * @example
     * <pre>
     * var app angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     $state.reload();
     *   }
     * });
     * </pre>
     *
     * `reload()` is just an alias for:
     * <pre>
     * $state.transitionTo($state.current, $stateParams, { 
     *   reload: true, inherit: false, notify: false 
     * });
     * </pre>
     */
    $state.reload = function reload() {
      $state.transitionTo($state.current, $stateParams, { reload: true, inherit: false, notify: false });
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#go
     * @methodOf ui.router.state.$state
     *
     * @description
     * Convenience method for transitioning to a new state. `$state.go` calls 
     * `$state.transitionTo` internally but automatically sets options to 
     * `{ location: true, inherit: true, relative: $state.$current, notify: true }`. 
     * This allows you to easily use an absolute or relative to path and specify 
     * only the parameters you'd like to update (while letting unspecified parameters 
     * inherit from the currently active ancestor states).
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.go('contact.detail');
     *   };
     * });
     * </pre>
     * <img src='../ngdoc_assets/StateGoExamples.png'/>
     *
     * @param {string} to Absolute state name or relative state path. Some examples:
     *
     * - `$state.go('contact.detail')` - will go to the `contact.detail` state
     * - `$state.go('^')` - will go to a parent state
     * - `$state.go('^.sibling')` - will go to a sibling state
     * - `$state.go('.child.grandchild')` - will go to grandchild state
     *
     * @param {object=} params A map of the parameters that will be sent to the state, 
     * will populate $stateParams. Any parameters that are not specified will be inherited from currently 
     * defined parameters. This allows, for example, going to a sibling state that shares parameters
     * specified in a parent state. Parameter inheritance only works between common ancestor states, I.e.
     * transitioning to a sibling will get you the parameters for all parents, transitioning to a child
     * will get you all current parameters, etc.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false}, If `true` will force transition even if the state or params 
     *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
     *    use this when you want to force a reload when *everything* is the same, including search params.
     *
     * @returns {promise} A promise representing the state of the new transition.
     *
     * Possible success values:
     *
     * - $state.current
     *
     * <br/>Possible rejection values:
     *
     * - 'transition superseded' - when a newer transition has been started after this one
     * - 'transition prevented' - when `event.preventDefault()` has been called in a `$stateChangeStart` listener
     * - 'transition aborted' - when `event.preventDefault()` has been called in a `$stateNotFound` listener or
     *   when a `$stateNotFound` `event.retry` promise errors.
     * - 'transition failed' - when a state has been unsuccessfully found after 2 tries.
     * - *resolve error* - when an error has occurred with a `resolve`
     *
     */
    $state.go = function go(to, params, options) {
      return this.transitionTo(to, params, extend({ inherit: true, relative: $state.$current }, options));
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#transitionTo
     * @methodOf ui.router.state.$state
     *
     * @description
     * Low-level method for transitioning to a new state. {@link ui.router.state.$state#methods_go $state.go}
     * uses `transitionTo` internally. `$state.go` is recommended in most situations.
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.transitionTo('contact.detail');
     *   };
     * });
     * </pre>
     *
     * @param {string} to State name.
     * @param {object=} toParams A map of the parameters that will be sent to the state,
     * will populate $stateParams.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=false}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false}, If `true` will force transition even if the state or params 
     *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
     *    use this when you want to force a reload when *everything* is the same, including search params.
     *
     * @returns {promise} A promise representing the state of the new transition. See
     * {@link ui.router.state.$state#methods_go $state.go}.
     */
    $state.transitionTo = function transitionTo(to, toParams, options) {
      toParams = toParams || {};
      options = extend({
        location: true, inherit: false, relative: null, notify: true, reload: false, $retry: false
      }, options || {});

      var from = $state.$current, fromParams = $state.params, fromPath = from.path;
      var evt, toState = findState(to, options.relative);

      if (!isDefined(toState)) {
        // Broadcast not found event and abort the transition if prevented
        var redirect = { to: to, toParams: toParams, options: options };

        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateNotFound
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired when a requested state **cannot be found** using the provided state name during transition.
         * The event is broadcast allowing any handlers a single chance to deal with the error (usually by
         * lazy-loading the unfound state). A special `unfoundState` object is passed to the listener handler,
         * you can see its three properties in the example. You can use `event.preventDefault()` to abort the
         * transition and the promise returned from `go` will be rejected with a `'transition aborted'` value.
         *
         * @param {Object} event Event object.
         * @param {Object} unfoundState Unfound State information. Contains: `to, toParams, options` properties.
         * @param {State} fromState Current state object.
         * @param {Object} fromParams Current state params.
         *
         * @example
         *
         * <pre>
         * // somewhere, assume lazy.state has not been defined
         * $state.go("lazy.state", {a:1, b:2}, {inherit:false});
         *
         * // somewhere else
         * $scope.$on('$stateNotFound',
         * function(event, unfoundState, fromState, fromParams){
         *     console.log(unfoundState.to); // "lazy.state"
         *     console.log(unfoundState.toParams); // {a:1, b:2}
         *     console.log(unfoundState.options); // {inherit:false} + default options
         * })
         * </pre>
         */
        evt = $rootScope.$broadcast('$stateNotFound', redirect, from.self, fromParams);
        if (evt.defaultPrevented) {
          syncUrl();
          return TransitionAborted;
        }

        // Allow the handler to return a promise to defer state lookup retry
        if (evt.retry) {
          if (options.$retry) {
            syncUrl();
            return TransitionFailed;
          }
          var retryTransition = $state.transition = $q.when(evt.retry);
          retryTransition.then(function() {
            if (retryTransition !== $state.transition) return TransitionSuperseded;
            redirect.options.$retry = true;
            return $state.transitionTo(redirect.to, redirect.toParams, redirect.options);
          }, function() {
            return TransitionAborted;
          });
          syncUrl();
          return retryTransition;
        }

        // Always retry once if the $stateNotFound was not prevented
        // (handles either redirect changed or state lazy-definition)
        to = redirect.to;
        toParams = redirect.toParams;
        options = redirect.options;
        toState = findState(to, options.relative);
        if (!isDefined(toState)) {
          if (options.relative) throw new Error("Could not resolve '" + to + "' from state '" + options.relative + "'");
          throw new Error("No such state '" + to + "'");
        }
      }
      if (toState[abstractKey]) throw new Error("Cannot transition to abstract state '" + to + "'");
      if (options.inherit) toParams = inheritParams($stateParams, toParams || {}, $state.$current, toState);
      to = toState;

      var toPath = to.path;

      // Starting from the root of the path, keep all levels that haven't changed
      var keep, state, locals = root.locals, toLocals = [];
      for (keep = 0, state = toPath[keep];
           state && state === fromPath[keep] && equalForKeys(toParams, fromParams, state.ownParams) && !options.reload;
           keep++, state = toPath[keep]) {
        locals = toLocals[keep] = state.locals;
      }

      // If we're going to the same state and all locals are kept, we've got nothing to do.
      // But clear 'transition', as we still want to cancel any other pending transitions.
      // TODO: We may not want to bump 'transition' if we're called from a location change that we've initiated ourselves,
      // because we might accidentally abort a legitimate transition initiated from code?
      if (shouldTriggerReload(to, from, locals, options) ) {
        if ( to.self.reloadOnSearch !== false )
          syncUrl();
        $state.transition = null;
        return $q.when($state.current);
      }

      // Normalize/filter parameters before we pass them to event handlers etc.
      toParams = normalize(to.params, toParams || {});

      // Broadcast start event and cancel the transition if requested
      if (options.notify) {
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeStart
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired when the state transition **begins**. You can use `event.preventDefault()`
         * to prevent the transition from happening and then the transition promise will be
         * rejected with a `'transition prevented'` value.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         *
         * @example
         *
         * <pre>
         * $rootScope.$on('$stateChangeStart',
         * function(event, toState, toParams, fromState, fromParams){
         *     event.preventDefault();
         *     // transitionTo() promise will be rejected with
         *     // a 'transition prevented' error
         * })
         * </pre>
         */
        evt = $rootScope.$broadcast('$stateChangeStart', to.self, toParams, from.self, fromParams);
        if (evt.defaultPrevented) {
          syncUrl();
          return TransitionPrevented;
        }
      }

      // Resolve locals for the remaining states, but don't update any global state just
      // yet -- if anything fails to resolve the current state needs to remain untouched.
      // We also set up an inheritance chain for the locals here. This allows the view directive
      // to quickly look up the correct definition for each view in the current state. Even
      // though we create the locals object itself outside resolveState(), it is initially
      // empty and gets filled asynchronously. We need to keep track of the promise for the
      // (fully resolved) current locals, and pass this down the chain.
      var resolved = $q.when(locals);
      for (var l=keep; l<toPath.length; l++, state=toPath[l]) {
        locals = toLocals[l] = inherit(locals);
        resolved = resolveState(state, toParams, state===to, resolved, locals);
      }

      // Once everything is resolved, we are ready to perform the actual transition
      // and return a promise for the new state. We also keep track of what the
      // current promise is, so that we can detect overlapping transitions and
      // keep only the outcome of the last transition.
      var transition = $state.transition = resolved.then(function () {
        var l, entering, exiting;

        if ($state.transition !== transition) return TransitionSuperseded;

        // Exit 'from' states not kept
        for (l=fromPath.length-1; l>=keep; l--) {
          exiting = fromPath[l];
          if (exiting.self.onExit) {
            $injector.invoke(exiting.self.onExit, exiting.self, exiting.locals.globals);
          }
          exiting.locals = null;
        }

        // Enter 'to' states not kept
        for (l=keep; l<toPath.length; l++) {
          entering = toPath[l];
          entering.locals = toLocals[l];
          if (entering.self.onEnter) {
            $injector.invoke(entering.self.onEnter, entering.self, entering.locals.globals);
          }
        }

        // Run it again, to catch any transitions in callbacks
        if ($state.transition !== transition) return TransitionSuperseded;

        // Update globals in $state
        $state.$current = to;
        $state.current = to.self;
        $state.params = toParams;
        copy($state.params, $stateParams);
        $state.transition = null;

        // Update $location
        var toNav = to.navigable;
        if (options.location && toNav) {
          $location.url(toNav.url.format(toNav.locals.globals.$stateParams));

          if (options.location === 'replace') {
            $location.replace();
          }
        }

        if (options.notify) {
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeSuccess
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired once the state transition is **complete**.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         */
          $rootScope.$broadcast('$stateChangeSuccess', to.self, toParams, from.self, fromParams);
        }
        currentLocation = $location.url();

        return $state.current;
      }, function (error) {
        if ($state.transition !== transition) return TransitionSuperseded;

        $state.transition = null;
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeError
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired when an **error occurs** during transition. It's important to note that if you
         * have any errors in your resolve functions (javascript errors, non-existent services, etc)
         * they will not throw traditionally. You must listen for this $stateChangeError event to
         * catch **ALL** errors.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         * @param {Error} error The resolve error object.
         */
        $rootScope.$broadcast('$stateChangeError', to.self, toParams, from.self, fromParams, error);
        syncUrl();

        return $q.reject(error);
      });

      return transition;
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#is
     * @methodOf ui.router.state.$state
     *
     * @description
     * Similar to {@link ui.router.state.$state#methods_includes $state.includes},
     * but only checks for the full state name. If params is supplied then it will be 
     * tested for strict equality against the current active params object, so all params 
     * must match with none missing and no extras.
     *
     * @example
     * <pre>
     * $state.is('contact.details.item'); // returns true
     * $state.is(contactDetailItemStateObject); // returns true
     *
     * // everything else would return false
     * </pre>
     *
     * @param {string|object} stateName The state name or state object you'd like to check.
     * @param {object=} params A param object, e.g. `{sectionId: section.id}`, that you'd like 
     * to test against the current active state.
     * @returns {boolean} Returns true if it is the state.
     */
    $state.is = function is(stateOrName, params) {
      var state = findState(stateOrName);

      if (!isDefined(state)) {
        return undefined;
      }

      if ($state.$current !== state) {
        return false;
      }

      return isDefined(params) && params !== null ? angular.equals($stateParams, params) : true;
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#includes
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method to determine if the current active state is equal to or is the child of the 
     * state stateName. If any params are passed then they will be tested for a match as well.
     * Not all the parameters need to be passed, just the ones you'd like to test for equality.
     *
     * @example
     * <pre>
     * $state.$current.name = 'contacts.details.item';
     *
     * $state.includes("contacts"); // returns true
     * $state.includes("contacts.details"); // returns true
     * $state.includes("contacts.details.item"); // returns true
     * $state.includes("contacts.list"); // returns false
     * $state.includes("about"); // returns false
     * </pre>
     *
     * @description
     * Basic globing patterns will also work.
     *
     * @example
     * <pre>
     * $state.$current.name = 'contacts.details.item.url';
     *
     * $state.includes("*.details.*.*"); // returns true
     * $state.includes("*.details.**"); // returns true
     * $state.includes("**.item.**"); // returns true
     * $state.includes("*.details.item.url"); // returns true
     * $state.includes("*.details.*.url"); // returns true
     * $state.includes("*.details.*"); // returns false
     * $state.includes("item.**"); // returns false
     * </pre>
     *
     * @param {string} stateOrName A partial name to be searched for within the current state name.
     * @param {object} params A param object, e.g. `{sectionId: section.id}`, 
     * that you'd like to test against the current active state.
     * @returns {boolean} Returns true if it does include the state
     */

    $state.includes = function includes(stateOrName, params) {
      if (isString(stateOrName) && isGlob(stateOrName)) {
        if (doesStateMatchGlob(stateOrName)) {
          stateOrName = $state.$current.name;
        } else {
          return false;
        }
      }

      var state = findState(stateOrName);
      if (!isDefined(state)) {
        return undefined;
      }

      if (!isDefined($state.$current.includes[state.name])) {
        return false;
      }

      var validParams = true;
      angular.forEach(params, function(value, key) {
        if (!isDefined($stateParams[key]) || $stateParams[key] !== value) {
          validParams = false;
        }
      });
      return validParams;
    };


    /**
     * @ngdoc function
     * @name ui.router.state.$state#href
     * @methodOf ui.router.state.$state
     *
     * @description
     * A url generation method that returns the compiled url for the given state populated with the given params.
     *
     * @example
     * <pre>
     * expect($state.href("about.person", { person: "bob" })).toEqual("/about/bob");
     * </pre>
     *
     * @param {string|object} stateOrName The state name or state object you'd like to generate a url from.
     * @param {object=} params An object of parameter values to fill the state's required parameters.
     * @param {object=} options Options object. The options are:
     *
     * - **`lossy`** - {boolean=true} -  If true, and if there is no url associated with the state provided in the
     *    first parameter, then the constructed href url will be built from the first navigable ancestor (aka
     *    ancestor with a valid url).
     * - **`inherit`** - {boolean=false}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
     * 
     * @returns {string} compiled state url
     */
    $state.href = function href(stateOrName, params, options) {
      options = extend({ lossy: true, inherit: false, absolute: false, relative: $state.$current }, options || {});
      var state = findState(stateOrName, options.relative);
      if (!isDefined(state)) return null;

      params = inheritParams($stateParams, params || {}, $state.$current, state);
      var nav = (state && options.lossy) ? state.navigable : state;
      var url = (nav && nav.url) ? nav.url.format(normalize(state.params, params || {})) : null;
      if (!$locationProvider.html5Mode() && url) {
        url = "#" + $locationProvider.hashPrefix() + url;
      }

      if (baseHref !== '/') {
        if ($locationProvider.html5Mode()) {
          url = baseHref.slice(0, -1) + url;
        } else if (options.absolute){
          url = baseHref.slice(1) + url;
        }
      }

      if (options.absolute && url) {
        url = $location.protocol() + '://' + 
              $location.host() + 
              ($location.port() == 80 || $location.port() == 443 ? '' : ':' + $location.port()) + 
              (!$locationProvider.html5Mode() && url ? '/' : '') + 
              url;
      }
      return url;
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#get
     * @methodOf ui.router.state.$state
     *
     * @description
     * Returns the state configuration object for any specific state or all states.
     *
     * @param {string|object=} stateOrName If provided, will only get the config for
     * the requested state. If not provided, returns an array of ALL state configs.
     * @returns {object|array} State configuration object or array of all objects.
     */
    $state.get = function (stateOrName, context) {
      if (!isDefined(stateOrName)) {
        var list = [];
        forEach(states, function(state) { list.push(state.self); });
        return list;
      }
      var state = findState(stateOrName, context);
      return (state && state.self) ? state.self : null;
    };

    function resolveState(state, params, paramsAreFiltered, inherited, dst) {
      // Make a restricted $stateParams with only the parameters that apply to this state if
      // necessary. In addition to being available to the controller and onEnter/onExit callbacks,
      // we also need $stateParams to be available for any $injector calls we make during the
      // dependency resolution process.
      var $stateParams = (paramsAreFiltered) ? params : filterByKeys(state.params, params);
      var locals = { $stateParams: $stateParams };

      // Resolve 'global' dependencies for the state, i.e. those not specific to a view.
      // We're also including $stateParams in this; that way the parameters are restricted
      // to the set that should be visible to the state, and are independent of when we update
      // the global $state and $stateParams values.
      dst.resolve = $resolve.resolve(state.resolve, locals, dst.resolve, state);
      var promises = [ dst.resolve.then(function (globals) {
        dst.globals = globals;
      }) ];
      if (inherited) promises.push(inherited);

      // Resolve template and dependencies for all views.
      forEach(state.views, function (view, name) {
        var injectables = (view.resolve && view.resolve !== state.resolve ? view.resolve : {});
        injectables.$template = [ function () {
          return $view.load(name, { view: view, locals: locals, params: $stateParams, notify: false }) || '';
        }];

        promises.push($resolve.resolve(injectables, locals, dst.resolve, state).then(function (result) {
          // References to the controller (only instantiated at link time)
          if (isFunction(view.controllerProvider) || isArray(view.controllerProvider)) {
            var injectLocals = angular.extend({}, injectables, locals);
            result.$$controller = $injector.invoke(view.controllerProvider, null, injectLocals);
          } else {
            result.$$controller = view.controller;
          }
          // Provide access to the state itself for internal use
          result.$$state = state;
          result.$$controllerAs = view.controllerAs;
          dst[name] = result;
        }));
      });

      // Wait for all the promises and then return the activation object
      return $q.all(promises).then(function (values) {
        return dst;
      });
    }

    return $state;
  }

  function shouldTriggerReload(to, from, locals, options) {
    if ( to === from && ((locals === from.locals && !options.reload) || (to.self.reloadOnSearch === false)) ) {
      return true;
    }
  }
}

angular.module('ui.router.state')
  .value('$stateParams', {})
  .provider('$state', $StateProvider);


$ViewProvider.$inject = [];
function $ViewProvider() {

  this.$get = $get;
  /**
   * @ngdoc object
   * @name ui.router.state.$view
   *
   * @requires ui.router.util.$templateFactory
   * @requires $rootScope
   *
   * @description
   *
   */
  $get.$inject = ['$rootScope', '$templateFactory'];
  function $get(   $rootScope,   $templateFactory) {
    return {
      // $view.load('full.viewName', { template: ..., controller: ..., resolve: ..., async: false, params: ... })
      /**
       * @ngdoc function
       * @name ui.router.state.$view#load
       * @methodOf ui.router.state.$view
       *
       * @description
       *
       * @param {string} name name
       * @param {object} options option object.
       */
      load: function load(name, options) {
        var result, defaults = {
          template: null, controller: null, view: null, locals: null, notify: true, async: true, params: {}
        };
        options = extend(defaults, options);

        if (options.view) {
          result = $templateFactory.fromConfig(options.view, options.params, options.locals);
        }
        if (result && options.notify) {
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$viewContentLoading
         * @eventOf ui.router.state.$view
         * @eventType broadcast on root scope
         * @description
         *
         * Fired once the view **begins loading**, *before* the DOM is rendered.
         *
         * @param {Object} event Event object.
         * @param {Object} viewConfig The view config properties (template, controller, etc).
         *
         * @example
         *
         * <pre>
         * $scope.$on('$viewContentLoading',
         * function(event, viewConfig){
         *     // Access to all the view config properties.
         *     // and one special property 'targetView'
         *     // viewConfig.targetView
         * });
         * </pre>
         */
          $rootScope.$broadcast('$viewContentLoading', options);
        }
        return result;
      }
    };
  }
}

angular.module('ui.router.state').provider('$view', $ViewProvider);

/**
 * @ngdoc object
 * @name ui.router.state.$uiViewScrollProvider
 *
 * @description
 * Provider that returns the {@link ui.router.state.$uiViewScroll} service function.
 */
function $ViewScrollProvider() {

  var useAnchorScroll = false;

  /**
   * @ngdoc function
   * @name ui.router.state.$uiViewScrollProvider#useAnchorScroll
   * @methodOf ui.router.state.$uiViewScrollProvider
   *
   * @description
   * Reverts back to using the core [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll) service for
   * scrolling based on the url anchor.
   */
  this.useAnchorScroll = function () {
    useAnchorScroll = true;
  };

  /**
   * @ngdoc object
   * @name ui.router.state.$uiViewScroll
   *
   * @requires $anchorScroll
   * @requires $timeout
   *
   * @description
   * When called with a jqLite element, it scrolls the element into view (after a
   * `$timeout` so the DOM has time to refresh).
   *
   * If you prefer to rely on `$anchorScroll` to scroll the view to the anchor,
   * this can be enabled by calling {@link ui.router.state.$uiViewScrollProvider#methods_useAnchorScroll `$uiViewScrollProvider.useAnchorScroll()`}.
   */
  this.$get = ['$anchorScroll', '$timeout', function ($anchorScroll, $timeout) {
    if (useAnchorScroll) {
      return $anchorScroll;
    }

    return function ($element) {
      $timeout(function () {
        $element[0].scrollIntoView();
      }, 0, false);
    };
  }];
}

angular.module('ui.router.state').provider('$uiViewScroll', $ViewScrollProvider);

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-view
 *
 * @requires ui.router.state.$state
 * @requires $compile
 * @requires $controller
 * @requires $injector
 * @requires ui.router.state.$uiViewScroll
 * @requires $document
 *
 * @restrict ECA
 *
 * @description
 * The ui-view directive tells $state where to place your templates.
 *
 * @param {string=} ui-view A view name. The name should be unique amongst the other views in the
 * same state. You can have views of the same name that live in different states.
 *
 * @param {string=} autoscroll It allows you to set the scroll behavior of the browser window
 * when a view is populated. By default, $anchorScroll is overridden by ui-router's custom scroll
 * service, {@link ui.router.state.$uiViewScroll}. This custom service let's you
 * scroll ui-view elements into view when they are populated during a state activation.
 *
 * *Note: To revert back to old [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll)
 * functionality, call `$uiViewScrollProvider.useAnchorScroll()`.*
 *
 * @param {string=} onload Expression to evaluate whenever the view updates.
 * 
 * @example
 * A view can be unnamed or named. 
 * <pre>
 * <!-- Unnamed -->
 * <div ui-view></div> 
 * 
 * <!-- Named -->
 * <div ui-view="viewName"></div>
 * </pre>
 *
 * You can only have one unnamed view within any template (or root html). If you are only using a 
 * single view and it is unnamed then you can populate it like so:
 * <pre>
 * <div ui-view></div> 
 * $stateProvider.state("home", {
 *   template: "<h1>HELLO!</h1>"
 * })
 * </pre>
 * 
 * The above is a convenient shortcut equivalent to specifying your view explicitly with the {@link ui.router.state.$stateProvider#views `views`}
 * config property, by name, in this case an empty name:
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }    
 * })
 * </pre>
 * 
 * But typically you'll only use the views property if you name your view or have more than one view 
 * in the same template. There's not really a compelling reason to name a view if its the only one, 
 * but you could if you wanted, like so:
 * <pre>
 * <div ui-view="main"></div>
 * </pre> 
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "main": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }    
 * })
 * </pre>
 * 
 * Really though, you'll use views to set up multiple views:
 * <pre>
 * <div ui-view></div>
 * <div ui-view="chart"></div> 
 * <div ui-view="data"></div> 
 * </pre>
 * 
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     },
 *     "chart": {
 *       template: "<chart_thing/>"
 *     },
 *     "data": {
 *       template: "<data_thing/>"
 *     }
 *   }    
 * })
 * </pre>
 *
 * Examples for `autoscroll`:
 *
 * <pre>
 * <!-- If autoscroll present with no expression,
 *      then scroll ui-view into view -->
 * <ui-view autoscroll/>
 *
 * <!-- If autoscroll present with valid expression,
 *      then scroll ui-view into view if expression evaluates to true -->
 * <ui-view autoscroll='true'/>
 * <ui-view autoscroll='false'/>
 * <ui-view autoscroll='scopeVariable'/>
 * </pre>
 */
$ViewDirective.$inject = ['$state', '$injector', '$uiViewScroll'];
function $ViewDirective(   $state,   $injector,   $uiViewScroll) {

  function getService() {
    return ($injector.has) ? function(service) {
      return $injector.has(service) ? $injector.get(service) : null;
    } : function(service) {
      try {
        return $injector.get(service);
      } catch (e) {
        return null;
      }
    };
  }

  var service = getService(),
      $animator = service('$animator'),
      $animate = service('$animate');

  // Returns a set of DOM manipulation functions based on which Angular version
  // it should use
  function getRenderer(attrs, scope) {
    var statics = function() {
      return {
        enter: function (element, target, cb) { target.after(element); cb(); },
        leave: function (element, cb) { element.remove(); cb(); }
      };
    };

    if ($animate) {
      return {
        enter: function(element, target, cb) { $animate.enter(element, null, target, cb); },
        leave: function(element, cb) { $animate.leave(element, cb); }
      };
    }

    if ($animator) {
      var animate = $animator && $animator(scope, attrs);

      return {
        enter: function(element, target, cb) {animate.enter(element, null, target); cb(); },
        leave: function(element, cb) { animate.leave(element); cb(); }
      };
    }

    return statics();
  }

  var directive = {
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    compile: function (tElement, tAttrs, $transclude) {
      return function (scope, $element, attrs) {
        var previousEl, currentEl, currentScope, latestLocals,
            onloadExp     = attrs.onload || '',
            autoScrollExp = attrs.autoscroll,
            renderer      = getRenderer(attrs, scope);

        scope.$on('$stateChangeSuccess', function() {
          updateView(false);
        });
        scope.$on('$viewContentLoading', function() {
          updateView(false);
        });

        updateView(true);

        function cleanupLastView() {
          if (previousEl) {
            previousEl.remove();
            previousEl = null;
          }

          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }

          if (currentEl) {
            renderer.leave(currentEl, function() {
              previousEl = null;
            });

            previousEl = currentEl;
            currentEl = null;
          }
        }

        function updateView(firstTime) {
          var newScope        = scope.$new(),
              name            = currentEl && currentEl.data('$uiViewName'),
              previousLocals  = name && $state.$current && $state.$current.locals[name];

          if (!firstTime && previousLocals === latestLocals) return; // nothing to do

          var clone = $transclude(newScope, function(clone) {
            renderer.enter(clone, $element, function onUiViewEnter() {
              if (angular.isDefined(autoScrollExp) && !autoScrollExp || scope.$eval(autoScrollExp)) {
                $uiViewScroll(clone);
              }
            });
            cleanupLastView();
          });

          latestLocals = $state.$current.locals[clone.data('$uiViewName')];

          currentEl = clone;
          currentScope = newScope;
          /**
           * @ngdoc event
           * @name ui.router.state.directive:ui-view#$viewContentLoaded
           * @eventOf ui.router.state.directive:ui-view
           * @eventType emits on ui-view directive scope
           * @description           *
           * Fired once the view is **loaded**, *after* the DOM is rendered.
           *
           * @param {Object} event Event object.
           */
          currentScope.$emit('$viewContentLoaded');
          currentScope.$eval(onloadExp);
        }
      };
    }
  };

  return directive;
}

$ViewDirectiveFill.$inject = ['$compile', '$controller', '$state'];
function $ViewDirectiveFill ($compile, $controller, $state) {
  return {
    restrict: 'ECA',
    priority: -400,
    compile: function (tElement) {
      var initial = tElement.html();
      return function (scope, $element, attrs) {
        var name      = attrs.uiView || attrs.name || '',
            inherited = $element.inheritedData('$uiView');

        if (name.indexOf('@') < 0) {
          name = name + '@' + (inherited ? inherited.state.name : '');
        }

        $element.data('$uiViewName', name);

        var current = $state.$current,
            locals  = current && current.locals[name];

        if (! locals) {
          return;
        }

        $element.data('$uiView', { name: name, state: locals.$$state });
        $element.html(locals.$template ? locals.$template : initial);

        var link = $compile($element.contents());

        if (locals.$$controller) {
          locals.$scope = scope;
          var controller = $controller(locals.$$controller, locals);
          if (locals.$$controllerAs) {
            scope[locals.$$controllerAs] = controller;
          }
          $element.data('$ngControllerController', controller);
          $element.children().data('$ngControllerController', controller);
        }

        link(scope);
      };
    }
  };
}

angular.module('ui.router.state').directive('uiView', $ViewDirective);
angular.module('ui.router.state').directive('uiView', $ViewDirectiveFill);

function parseStateRef(ref) {
  var parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
  if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1], paramExpr: parsed[3] || null };
}

function stateContext(el) {
  var stateData = el.parent().inheritedData('$uiView');

  if (stateData && stateData.state && stateData.state.name) {
    return stateData.state;
  }
}

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref
 *
 * @requires ui.router.state.$state
 * @requires $timeout
 *
 * @restrict A
 *
 * @description
 * A directive that binds a link (`<a>` tag) to a state. If the state has an associated 
 * URL, the directive will automatically generate & update the `href` attribute via 
 * the {@link ui.router.state.$state#methods_href $state.href()} method. Clicking 
 * the link will trigger a state transition with optional parameters. 
 *
 * Also middle-clicking, right-clicking, and ctrl-clicking on the link will be 
 * handled natively by the browser.
 *
 * You can also use relative state paths within ui-sref, just like the relative 
 * paths passed to `$state.go()`. You just need to be aware that the path is relative
 * to the state that the link lives in, in other words the state that loaded the 
 * template containing the link.
 *
 * You can specify options to pass to {@link ui.router.state.$state#go $state.go()}
 * using the `ui-sref-opts` attribute. Options are restricted to `location`, `inherit`,
 * and `reload`.
 *
 * @example
 * Here's an example of how you'd use ui-sref and how it would compile. If you have the 
 * following template:
 * <pre>
 * <a ui-sref="home">Home</a> | <a ui-sref="about">About</a>
 * 
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a ui-sref="contacts.detail({ id: contact.id })">{{ contact.name }}</a>
 *     </li>
 * </ul>
 * </pre>
 * 
 * Then the compiled html would be (assuming Html5Mode is off):
 * <pre>
 * <a href="#/home" ui-sref="home">Home</a> | <a href="#/about" ui-sref="about">About</a>
 * 
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/1" ui-sref="contacts.detail({ id: contact.id })">Joe</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/2" ui-sref="contacts.detail({ id: contact.id })">Alice</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/3" ui-sref="contacts.detail({ id: contact.id })">Bob</a>
 *     </li>
 * </ul>
 *
 * <a ui-sref="home" ui-sref-opts="{reload: true}">Home</a>
 * </pre>
 *
 * @param {string} ui-sref 'stateName' can be any valid absolute or relative state
 * @param {Object} ui-sref-opts options to pass to {@link ui.router.state.$state#go $state.go()}
 */
$StateRefDirective.$inject = ['$state', '$timeout'];
function $StateRefDirective($state, $timeout) {
  var allowedOptions = ['location', 'inherit', 'reload'];

  return {
    restrict: 'A',
    require: '?^uiSrefActive',
    link: function(scope, element, attrs, uiSrefActive) {
      var ref = parseStateRef(attrs.uiSref);
      var params = null, url = null, base = stateContext(element) || $state.$current;
      var isForm = element[0].nodeName === "FORM";
      var attr = isForm ? "action" : "href", nav = true;

      var options = {
        relative: base
      };
      var optionsOverride = scope.$eval(attrs.uiSrefOpts) || {};
      angular.forEach(allowedOptions, function(option) {
        if (option in optionsOverride) {
          options[option] = optionsOverride[option];
        }
      });

      var update = function(newVal) {
        if (newVal) params = newVal;
        if (!nav) return;

        var newHref = $state.href(ref.state, params, options);

        if (uiSrefActive) {
          uiSrefActive.$$setStateInfo(ref.state, params);
        }
        if (!newHref) {
          nav = false;
          return false;
        }
        element[0][attr] = newHref;
      };

      if (ref.paramExpr) {
        scope.$watch(ref.paramExpr, function(newVal, oldVal) {
          if (newVal !== params) update(newVal);
        }, true);
        params = scope.$eval(ref.paramExpr);
      }
      update();

      if (isForm) return;

      element.bind("click", function(e) {
        var button = e.which || e.button;
        if ( !(button > 1 || e.ctrlKey || e.metaKey || e.shiftKey || element.attr('target')) ) {
          // HACK: This is to allow ng-clicks to be processed before the transition is initiated:
          $timeout(function() {
            $state.go(ref.state, params, options);
          });
          e.preventDefault();
        }
      });
    }
  };
}

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref-active
 *
 * @requires ui.router.state.$state
 * @requires ui.router.state.$stateParams
 * @requires $interpolate
 *
 * @restrict A
 *
 * @description
 * A directive working alongside ui-sref to add classes to an element when the 
 * related ui-sref directive's state is active, and removing them when it is inactive.
 * The primary use-case is to simplify the special appearance of navigation menus 
 * relying on `ui-sref`, by having the "active" state's menu button appear different,
 * distinguishing it from the inactive menu items.
 *
 * @example
 * Given the following template:
 * <pre>
 * <ul>
 *   <li ui-sref-active="active" class="item">
 *     <a href ui-sref="app.user({user: 'bilbobaggins'})">@bilbobaggins</a>
 *   </li>
 * </ul>
 * </pre>
 * 
 * When the app state is "app.user", and contains the state parameter "user" with value "bilbobaggins", 
 * the resulting HTML will appear as (note the 'active' class):
 * <pre>
 * <ul>
 *   <li ui-sref-active="active" class="item active">
 *     <a ui-sref="app.user({user: 'bilbobaggins'})" href="/users/bilbobaggins">@bilbobaggins</a>
 *   </li>
 * </ul>
 * </pre>
 * 
 * The class name is interpolated **once** during the directives link time (any further changes to the 
 * interpolated value are ignored). 
 * 
 * Multiple classes may be specified in a space-separated format:
 * <pre>
 * <ul>
 *   <li ui-sref-active='class1 class2 class3'>
 *     <a ui-sref="app.user">link</a>
 *   </li>
 * </ul>
 * </pre>
 */
$StateActiveDirective.$inject = ['$state', '$stateParams', '$interpolate'];
function $StateActiveDirective($state, $stateParams, $interpolate) {
  return {
    restrict: "A",
    controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
      var state, params, activeClass;

      // There probably isn't much point in $observing this
      activeClass = $interpolate($attrs.uiSrefActive || '', false)($scope);

      // Allow uiSref to communicate with uiSrefActive
      this.$$setStateInfo = function(newState, newParams) {
        state = $state.get(newState, stateContext($element));
        params = newParams;
        update();
      };

      $scope.$on('$stateChangeSuccess', update);

      // Update route state
      function update() {
        if ($state.$current.self === state && matchesParams()) {
          $element.addClass(activeClass);
        } else {
          $element.removeClass(activeClass);
        }
      }

      function matchesParams() {
        return !params || equalForKeys(params, $stateParams);
      }
    }]
  };
}

angular.module('ui.router.state')
  .directive('uiSref', $StateRefDirective)
  .directive('uiSrefActive', $StateActiveDirective);

/**
 * @ngdoc filter
 * @name ui.router.state.filter:isState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_is $state.is("stateName")}.
 */
$IsStateFilter.$inject = ['$state'];
function $IsStateFilter($state) {
  return function(state) {
    return $state.is(state);
  };
}

/**
 * @ngdoc filter
 * @name ui.router.state.filter:includedByState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_includes $state.includes('fullOrPartialStateName')}.
 */
$IncludedByStateFilter.$inject = ['$state'];
function $IncludedByStateFilter($state) {
  return function(state) {
    return $state.includes(state);
  };
}

angular.module('ui.router.state')
  .filter('isState', $IsStateFilter)
  .filter('includedByState', $IncludedByStateFilter);

/*
 * @ngdoc object
 * @name ui.router.compat.$routeProvider
 *
 * @requires ui.router.state.$stateProvider
 * @requires ui.router.router.$urlRouterProvider
 *
 * @description
 * `$routeProvider` of the `ui.router.compat` module overwrites the existing
 * `routeProvider` from the core. This is done to provide compatibility between
 * the UI Router and the core router.
 *
 * It also provides a `when()` method to register routes that map to certain urls.
 * Behind the scenes it actually delegates either to 
 * {@link ui.router.router.$urlRouterProvider $urlRouterProvider} or to the 
 * {@link ui.router.state.$stateProvider $stateProvider} to postprocess the given 
 * router definition object.
 */
$RouteProvider.$inject = ['$stateProvider', '$urlRouterProvider'];
function $RouteProvider(  $stateProvider,    $urlRouterProvider) {

  var routes = [];

  onEnterRoute.$inject = ['$$state'];
  function onEnterRoute(   $$state) {
    /*jshint validthis: true */
    this.locals = $$state.locals.globals;
    this.params = this.locals.$stateParams;
  }

  function onExitRoute() {
    /*jshint validthis: true */
    this.locals = null;
    this.params = null;
  }

  this.when = when;
  /*
   * @ngdoc function
   * @name ui.router.compat.$routeProvider#when
   * @methodOf ui.router.compat.$routeProvider
   *
   * @description
   * Registers a route with a given route definition object. The route definition
   * object has the same interface the angular core route definition object has.
   * 
   * @example
   * <pre>
   * var app = angular.module('app', ['ui.router.compat']);
   *
   * app.config(function ($routeProvider) {
   *   $routeProvider.when('home', {
   *     controller: function () { ... },
   *     templateUrl: 'path/to/template'
   *   });
   * });
   * </pre>
   *
   * @param {string} url URL as string
   * @param {object} route Route definition object
   *
   * @return {object} $routeProvider - $routeProvider instance
   */
  function when(url, route) {
    /*jshint validthis: true */
    if (route.redirectTo != null) {
      // Redirect, configure directly on $urlRouterProvider
      var redirect = route.redirectTo, handler;
      if (isString(redirect)) {
        handler = redirect; // leave $urlRouterProvider to handle
      } else if (isFunction(redirect)) {
        // Adapt to $urlRouterProvider API
        handler = function (params, $location) {
          return redirect(params, $location.path(), $location.search());
        };
      } else {
        throw new Error("Invalid 'redirectTo' in when()");
      }
      $urlRouterProvider.when(url, handler);
    } else {
      // Regular route, configure as state
      $stateProvider.state(inherit(route, {
        parent: null,
        name: 'route:' + encodeURIComponent(url),
        url: url,
        onEnter: onEnterRoute,
        onExit: onExitRoute
      }));
    }
    routes.push(route);
    return this;
  }

  /*
   * @ngdoc object
   * @name ui.router.compat.$route
   *
   * @requires ui.router.state.$state
   * @requires $rootScope
   * @requires $routeParams
   *
   * @property {object} routes - Array of registered routes.
   * @property {object} params - Current route params as object.
   * @property {string} current - Name of the current route.
   *
   * @description
   * The `$route` service provides interfaces to access defined routes. It also let's
   * you access route params through `$routeParams` service, so you have fully
   * control over all the stuff you would actually get from angular's core `$route`
   * service.
   */
  this.$get = $get;
  $get.$inject = ['$state', '$rootScope', '$routeParams'];
  function $get(   $state,   $rootScope,   $routeParams) {

    var $route = {
      routes: routes,
      params: $routeParams,
      current: undefined
    };

    function stateAsRoute(state) {
      return (state.name !== '') ? state : undefined;
    }

    $rootScope.$on('$stateChangeStart', function (ev, to, toParams, from, fromParams) {
      $rootScope.$broadcast('$routeChangeStart', stateAsRoute(to), stateAsRoute(from));
    });

    $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
      $route.current = stateAsRoute(to);
      $rootScope.$broadcast('$routeChangeSuccess', stateAsRoute(to), stateAsRoute(from));
      copy(toParams, $route.params);
    });

    $rootScope.$on('$stateChangeError', function (ev, to, toParams, from, fromParams, error) {
      $rootScope.$broadcast('$routeChangeError', stateAsRoute(to), stateAsRoute(from), error);
    });

    return $route;
  }
}

angular.module('ui.router.compat')
  .provider('$route', $RouteProvider)
  .directive('ngView', $ViewDirective);
})(window, window.angular);
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9yZWwvRG9jdW1lbnRzL2FuZ3VsYXJDb3Vyc2Uvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3JlbC9Eb2N1bWVudHMvYW5ndWxhckNvdXJzZS9hcHAvZmFrZV83ZDVhODVhNC5qcyIsIi9Vc2Vycy9yZWwvRG9jdW1lbnRzL2FuZ3VsYXJDb3Vyc2UvYXBwL21haW5NZW51L21vZHVsZS5qcyIsIi9Vc2Vycy9yZWwvRG9jdW1lbnRzL2FuZ3VsYXJDb3Vyc2UvYXBwL21haW5NZW51L3Rlc3QuY29mZmVlIiwiL1VzZXJzL3JlbC9Eb2N1bWVudHMvYW5ndWxhckNvdXJzZS9ub2RlX21vZHVsZXMvYW5ndWxhci11aS1yb3V0ZXIvcmVsZWFzZS9hbmd1bGFyLXVpLXJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgbWFpbk1lbnVNb2R1bGUgPSByZXF1aXJlKCcuL21haW5NZW51L21vZHVsZScpO1xudmFyIHVpUm91dGVyID0gcmVxdWlyZSgnYW5ndWxhci11aS1yb3V0ZXInKTtcblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhbmd1bGFyY291cnNlJywgWyd0ZW1wbGF0ZXMnLCB1aVJvdXRlciwgbWFpbk1lbnVNb2R1bGUubmFtZV0pO1xuXG5hcHAuY29uZmlnKFsnJHVybFJvdXRlclByb3ZpZGVyJywgZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2hvbWUnKTtcbn1dKTtcblxuYXBwLmNvbmZpZyhbJyRzdGF0ZVByb3ZpZGVyJywgZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgICAgIHVybDogJy9ob21lJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnaG9tZS5odG1sJ1xuICAgICAgICB9KVxuICAgICAgICAuc3RhdGUoJ2Fib3V0Jywge1xuICAgICAgICAgICAgdXJsOiAnL2Fib3V0JyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYWJvdXQuaHRtbCdcbiAgICAgICAgfSk7XG59XSk7IiwidmFyIHRlc3QgPSByZXF1aXJlKCcuL3Rlc3QuY29mZmVlJyk7XG5cbnZhciBhbmd1bGFyTW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ21haW4tbWVudScsIFtdKTtcblxuYW5ndWxhck1vZHVsZS5jb250cm9sbGVyKCdNYWluTWVudUNvbnRyb2xsZXInLCBbZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1haW5NZW51Q29udHJvbGxlciA9IHRoaXM7XG5cbiAgICBtYWluTWVudUNvbnRyb2xsZXIubGVzc29ucyA9IFtcbiAgICAgICAge25hbWU6ICdMZXNzb24gMSEnfVxuICAgIF07XG59XSk7XG5cbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhck1vZHVsZTtcbiIsIlxuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lMMVZ6WlhKekwzSmxiQzlFYjJOMWJXVnVkSE12WVc1bmRXeGhja052ZFhKelpTOWhjSEF2YldGcGJrMWxiblV2ZEdWemRDNWpiMlptWldVaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sY3lJNld5SXZWWE5sY25NdmNtVnNMMFJ2WTNWdFpXNTBjeTloYm1kMWJHRnlRMjkxY25ObEwyRndjQzl0WVdsdVRXVnVkUzkwWlhOMExtTnZabVpsWlNKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pUVVGQlFTSXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJaUpkZlE9PVxuIiwiLyoqXG4gKiBTdGF0ZS1iYXNlZCByb3V0aW5nIGZvciBBbmd1bGFySlNcbiAqIEB2ZXJzaW9uIHYwLjIuMTBcbiAqIEBsaW5rIGh0dHA6Ly9hbmd1bGFyLXVpLmdpdGh1Yi5jb20vXG4gKiBAbGljZW5zZSBNSVQgTGljZW5zZSwgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAqL1xuXG4vKiBjb21tb25qcyBwYWNrYWdlIG1hbmFnZXIgc3VwcG9ydCAoZWcgY29tcG9uZW50anMpICovXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cyA9PT0gZXhwb3J0cyl7XG4gIG1vZHVsZS5leHBvcnRzID0gJ3VpLnJvdXRlcic7XG59XG5cbihmdW5jdGlvbiAod2luZG93LCBhbmd1bGFyLCB1bmRlZmluZWQpIHtcbi8qanNoaW50IGdsb2JhbHN0cmljdDp0cnVlKi9cbi8qZ2xvYmFsIGFuZ3VsYXI6ZmFsc2UqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNEZWZpbmVkID0gYW5ndWxhci5pc0RlZmluZWQsXG4gICAgaXNGdW5jdGlvbiA9IGFuZ3VsYXIuaXNGdW5jdGlvbixcbiAgICBpc1N0cmluZyA9IGFuZ3VsYXIuaXNTdHJpbmcsXG4gICAgaXNPYmplY3QgPSBhbmd1bGFyLmlzT2JqZWN0LFxuICAgIGlzQXJyYXkgPSBhbmd1bGFyLmlzQXJyYXksXG4gICAgZm9yRWFjaCA9IGFuZ3VsYXIuZm9yRWFjaCxcbiAgICBleHRlbmQgPSBhbmd1bGFyLmV4dGVuZCxcbiAgICBjb3B5ID0gYW5ndWxhci5jb3B5O1xuXG5mdW5jdGlvbiBpbmhlcml0KHBhcmVudCwgZXh0cmEpIHtcbiAgcmV0dXJuIGV4dGVuZChuZXcgKGV4dGVuZChmdW5jdGlvbigpIHt9LCB7IHByb3RvdHlwZTogcGFyZW50IH0pKSgpLCBleHRyYSk7XG59XG5cbmZ1bmN0aW9uIG1lcmdlKGRzdCkge1xuICBmb3JFYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gZHN0KSB7XG4gICAgICBmb3JFYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICBpZiAoIWRzdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSBkc3Rba2V5XSA9IHZhbHVlO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGRzdDtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgY29tbW9uIGFuY2VzdG9yIHBhdGggYmV0d2VlbiB0d28gc3RhdGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBmaXJzdCBUaGUgZmlyc3Qgc3RhdGUuXG4gKiBAcGFyYW0ge09iamVjdH0gc2Vjb25kIFRoZSBzZWNvbmQgc3RhdGUuXG4gKiBAcmV0dXJuIHtBcnJheX0gUmV0dXJucyBhbiBhcnJheSBvZiBzdGF0ZSBuYW1lcyBpbiBkZXNjZW5kaW5nIG9yZGVyLCBub3QgaW5jbHVkaW5nIHRoZSByb290LlxuICovXG5mdW5jdGlvbiBhbmNlc3RvcnMoZmlyc3QsIHNlY29uZCkge1xuICB2YXIgcGF0aCA9IFtdO1xuXG4gIGZvciAodmFyIG4gaW4gZmlyc3QucGF0aCkge1xuICAgIGlmIChmaXJzdC5wYXRoW25dICE9PSBzZWNvbmQucGF0aFtuXSkgYnJlYWs7XG4gICAgcGF0aC5wdXNoKGZpcnN0LnBhdGhbbl0pO1xuICB9XG4gIHJldHVybiBwYXRoO1xufVxuXG4vKipcbiAqIElFOC1zYWZlIHdyYXBwZXIgZm9yIGBPYmplY3Qua2V5cygpYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IEEgSmF2YVNjcmlwdCBvYmplY3QuXG4gKiBAcmV0dXJuIHtBcnJheX0gUmV0dXJucyB0aGUga2V5cyBvZiB0aGUgb2JqZWN0IGFzIGFuIGFycmF5LlxuICovXG5mdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuICBpZiAoT2JqZWN0LmtleXMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KTtcbiAgfVxuICB2YXIgcmVzdWx0ID0gW107XG5cbiAgYW5ndWxhci5mb3JFYWNoKG9iamVjdCwgZnVuY3Rpb24odmFsLCBrZXkpIHtcbiAgICByZXN1bHQucHVzaChrZXkpO1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBJRTgtc2FmZSB3cmFwcGVyIGZvciBgQXJyYXkucHJvdG90eXBlLmluZGV4T2YoKWAuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgQSBKYXZhU2NyaXB0IGFycmF5LlxuICogQHBhcmFtIHsqfSB2YWx1ZSBBIHZhbHVlIHRvIHNlYXJjaCB0aGUgYXJyYXkgZm9yLlxuICogQHJldHVybiB7TnVtYmVyfSBSZXR1cm5zIHRoZSBhcnJheSBpbmRleCB2YWx1ZSBvZiBgdmFsdWVgLCBvciBgLTFgIGlmIG5vdCBwcmVzZW50LlxuICovXG5mdW5jdGlvbiBhcnJheVNlYXJjaChhcnJheSwgdmFsdWUpIHtcbiAgaWYgKEFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgcmV0dXJuIGFycmF5LmluZGV4T2YodmFsdWUsIE51bWJlcihhcmd1bWVudHNbMl0pIHx8IDApO1xuICB9XG4gIHZhciBsZW4gPSBhcnJheS5sZW5ndGggPj4+IDAsIGZyb20gPSBOdW1iZXIoYXJndW1lbnRzWzJdKSB8fCAwO1xuICBmcm9tID0gKGZyb20gPCAwKSA/IE1hdGguY2VpbChmcm9tKSA6IE1hdGguZmxvb3IoZnJvbSk7XG5cbiAgaWYgKGZyb20gPCAwKSBmcm9tICs9IGxlbjtcblxuICBmb3IgKDsgZnJvbSA8IGxlbjsgZnJvbSsrKSB7XG4gICAgaWYgKGZyb20gaW4gYXJyYXkgJiYgYXJyYXlbZnJvbV0gPT09IHZhbHVlKSByZXR1cm4gZnJvbTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTWVyZ2VzIGEgc2V0IG9mIHBhcmFtZXRlcnMgd2l0aCBhbGwgcGFyYW1ldGVycyBpbmhlcml0ZWQgYmV0d2VlbiB0aGUgY29tbW9uIHBhcmVudHMgb2YgdGhlXG4gKiBjdXJyZW50IHN0YXRlIGFuZCBhIGdpdmVuIGRlc3RpbmF0aW9uIHN0YXRlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjdXJyZW50UGFyYW1zIFRoZSB2YWx1ZSBvZiB0aGUgY3VycmVudCBzdGF0ZSBwYXJhbWV0ZXJzICgkc3RhdGVQYXJhbXMpLlxuICogQHBhcmFtIHtPYmplY3R9IG5ld1BhcmFtcyBUaGUgc2V0IG9mIHBhcmFtZXRlcnMgd2hpY2ggd2lsbCBiZSBjb21wb3NpdGVkIHdpdGggaW5oZXJpdGVkIHBhcmFtcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSAkY3VycmVudCBJbnRlcm5hbCBkZWZpbml0aW9uIG9mIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgc3RhdGUuXG4gKiBAcGFyYW0ge09iamVjdH0gJHRvIEludGVybmFsIGRlZmluaXRpb24gb2Ygb2JqZWN0IHJlcHJlc2VudGluZyBzdGF0ZSB0byB0cmFuc2l0aW9uIHRvLlxuICovXG5mdW5jdGlvbiBpbmhlcml0UGFyYW1zKGN1cnJlbnRQYXJhbXMsIG5ld1BhcmFtcywgJGN1cnJlbnQsICR0bykge1xuICB2YXIgcGFyZW50cyA9IGFuY2VzdG9ycygkY3VycmVudCwgJHRvKSwgcGFyZW50UGFyYW1zLCBpbmhlcml0ZWQgPSB7fSwgaW5oZXJpdExpc3QgPSBbXTtcblxuICBmb3IgKHZhciBpIGluIHBhcmVudHMpIHtcbiAgICBpZiAoIXBhcmVudHNbaV0ucGFyYW1zIHx8ICFwYXJlbnRzW2ldLnBhcmFtcy5sZW5ndGgpIGNvbnRpbnVlO1xuICAgIHBhcmVudFBhcmFtcyA9IHBhcmVudHNbaV0ucGFyYW1zO1xuXG4gICAgZm9yICh2YXIgaiBpbiBwYXJlbnRQYXJhbXMpIHtcbiAgICAgIGlmIChhcnJheVNlYXJjaChpbmhlcml0TGlzdCwgcGFyZW50UGFyYW1zW2pdKSA+PSAwKSBjb250aW51ZTtcbiAgICAgIGluaGVyaXRMaXN0LnB1c2gocGFyZW50UGFyYW1zW2pdKTtcbiAgICAgIGluaGVyaXRlZFtwYXJlbnRQYXJhbXNbal1dID0gY3VycmVudFBhcmFtc1twYXJlbnRQYXJhbXNbal1dO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZXh0ZW5kKHt9LCBpbmhlcml0ZWQsIG5ld1BhcmFtcyk7XG59XG5cbi8qKlxuICogTm9ybWFsaXplcyBhIHNldCBvZiB2YWx1ZXMgdG8gc3RyaW5nIG9yIGBudWxsYCwgZmlsdGVyaW5nIHRoZW0gYnkgYSBsaXN0IG9mIGtleXMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0ga2V5cyBUaGUgbGlzdCBvZiBrZXlzIHRvIG5vcm1hbGl6ZS9yZXR1cm4uXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzIEFuIG9iamVjdCBoYXNoIG9mIHZhbHVlcyB0byBub3JtYWxpemUuXG4gKiBAcmV0dXJuIHtPYmplY3R9IFJldHVybnMgYW4gb2JqZWN0IGhhc2ggb2Ygbm9ybWFsaXplZCBzdHJpbmcgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemUoa2V5cywgdmFsdWVzKSB7XG4gIHZhciBub3JtYWxpemVkID0ge307XG5cbiAgZm9yRWFjaChrZXlzLCBmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciB2YWx1ZSA9IHZhbHVlc1tuYW1lXTtcbiAgICBub3JtYWxpemVkW25hbWVdID0gKHZhbHVlICE9IG51bGwpID8gU3RyaW5nKHZhbHVlKSA6IG51bGw7XG4gIH0pO1xuICByZXR1cm4gbm9ybWFsaXplZDtcbn1cblxuLyoqXG4gKiBQZXJmb3JtcyBhIG5vbi1zdHJpY3QgY29tcGFyaXNvbiBvZiB0aGUgc3Vic2V0IG9mIHR3byBvYmplY3RzLCBkZWZpbmVkIGJ5IGEgbGlzdCBvZiBrZXlzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhIFRoZSBmaXJzdCBvYmplY3QuXG4gKiBAcGFyYW0ge09iamVjdH0gYiBUaGUgc2Vjb25kIG9iamVjdC5cbiAqIEBwYXJhbSB7QXJyYXl9IGtleXMgVGhlIGxpc3Qgb2Yga2V5cyB3aXRoaW4gZWFjaCBvYmplY3QgdG8gY29tcGFyZS4gSWYgdGhlIGxpc3QgaXMgZW1wdHkgb3Igbm90IHNwZWNpZmllZCxcbiAqICAgICAgICAgICAgICAgICAgICAgaXQgZGVmYXVsdHMgdG8gdGhlIGxpc3Qgb2Yga2V5cyBpbiBgYWAuXG4gKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUga2V5cyBtYXRjaCwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGVxdWFsRm9yS2V5cyhhLCBiLCBrZXlzKSB7XG4gIGlmICgha2V5cykge1xuICAgIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBuIGluIGEpIGtleXMucHVzaChuKTsgLy8gVXNlZCBpbnN0ZWFkIG9mIE9iamVjdC5rZXlzKCkgZm9yIElFOCBjb21wYXRpYmlsaXR5XG4gIH1cblxuICBmb3IgKHZhciBpPTA7IGk8a2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBrID0ga2V5c1tpXTtcbiAgICBpZiAoYVtrXSAhPSBiW2tdKSByZXR1cm4gZmFsc2U7IC8vIE5vdCAnPT09JywgdmFsdWVzIGFyZW4ndCBuZWNlc3NhcmlseSBub3JtYWxpemVkXG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc3Vic2V0IG9mIGFuIG9iamVjdCwgYmFzZWQgb24gYSBsaXN0IG9mIGtleXMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0ga2V5c1xuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlc1xuICogQHJldHVybiB7Qm9vbGVhbn0gUmV0dXJucyBhIHN1YnNldCBvZiBgdmFsdWVzYC5cbiAqL1xuZnVuY3Rpb24gZmlsdGVyQnlLZXlzKGtleXMsIHZhbHVlcykge1xuICB2YXIgZmlsdGVyZWQgPSB7fTtcblxuICBmb3JFYWNoKGtleXMsIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgZmlsdGVyZWRbbmFtZV0gPSB2YWx1ZXNbbmFtZV07XG4gIH0pO1xuICByZXR1cm4gZmlsdGVyZWQ7XG59XG4vKipcbiAqIEBuZ2RvYyBvdmVydmlld1xuICogQG5hbWUgdWkucm91dGVyLnV0aWxcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgdWkucm91dGVyLnV0aWwgc3ViLW1vZHVsZVxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGEgZGVwZW5kZW5jeSBvZiBvdGhlciBzdWItbW9kdWxlcy4gRG8gbm90IGluY2x1ZGUgdGhpcyBtb2R1bGUgYXMgYSBkZXBlbmRlbmN5XG4gKiBpbiB5b3VyIGFuZ3VsYXIgYXBwICh1c2Uge0BsaW5rIHVpLnJvdXRlcn0gbW9kdWxlIGluc3RlYWQpLlxuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci51dGlsJywgWyduZyddKTtcblxuLyoqXG4gKiBAbmdkb2Mgb3ZlcnZpZXdcbiAqIEBuYW1lIHVpLnJvdXRlci5yb3V0ZXJcbiAqIFxuICogQHJlcXVpcmVzIHVpLnJvdXRlci51dGlsXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiAjIHVpLnJvdXRlci5yb3V0ZXIgc3ViLW1vZHVsZVxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGEgZGVwZW5kZW5jeSBvZiBvdGhlciBzdWItbW9kdWxlcy4gRG8gbm90IGluY2x1ZGUgdGhpcyBtb2R1bGUgYXMgYSBkZXBlbmRlbmN5XG4gKiBpbiB5b3VyIGFuZ3VsYXIgYXBwICh1c2Uge0BsaW5rIHVpLnJvdXRlcn0gbW9kdWxlIGluc3RlYWQpLlxuICovXG5hbmd1bGFyLm1vZHVsZSgndWkucm91dGVyLnJvdXRlcicsIFsndWkucm91dGVyLnV0aWwnXSk7XG5cbi8qKlxuICogQG5nZG9jIG92ZXJ2aWV3XG4gKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGVcbiAqIFxuICogQHJlcXVpcmVzIHVpLnJvdXRlci5yb3V0ZXJcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIudXRpbFxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogIyB1aS5yb3V0ZXIuc3RhdGUgc3ViLW1vZHVsZVxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGEgZGVwZW5kZW5jeSBvZiB0aGUgbWFpbiB1aS5yb3V0ZXIgbW9kdWxlLiBEbyBub3QgaW5jbHVkZSB0aGlzIG1vZHVsZSBhcyBhIGRlcGVuZGVuY3lcbiAqIGluIHlvdXIgYW5ndWxhciBhcHAgKHVzZSB7QGxpbmsgdWkucm91dGVyfSBtb2R1bGUgaW5zdGVhZCkuXG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci5zdGF0ZScsIFsndWkucm91dGVyLnJvdXRlcicsICd1aS5yb3V0ZXIudXRpbCddKTtcblxuLyoqXG4gKiBAbmdkb2Mgb3ZlcnZpZXdcbiAqIEBuYW1lIHVpLnJvdXRlclxuICpcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGVcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgdWkucm91dGVyXG4gKiBcbiAqICMjIFRoZSBtYWluIG1vZHVsZSBmb3IgdWkucm91dGVyIFxuICogVGhlcmUgYXJlIHNldmVyYWwgc3ViLW1vZHVsZXMgaW5jbHVkZWQgd2l0aCB0aGUgdWkucm91dGVyIG1vZHVsZSwgaG93ZXZlciBvbmx5IHRoaXMgbW9kdWxlIGlzIG5lZWRlZFxuICogYXMgYSBkZXBlbmRlbmN5IHdpdGhpbiB5b3VyIGFuZ3VsYXIgYXBwLiBUaGUgb3RoZXIgbW9kdWxlcyBhcmUgZm9yIG9yZ2FuaXphdGlvbiBwdXJwb3Nlcy4gXG4gKlxuICogVGhlIG1vZHVsZXMgYXJlOlxuICogKiB1aS5yb3V0ZXIgLSB0aGUgbWFpbiBcInVtYnJlbGxhXCIgbW9kdWxlXG4gKiAqIHVpLnJvdXRlci5yb3V0ZXIgLSBcbiAqIFxuICogKllvdSdsbCBuZWVkIHRvIGluY2x1ZGUgKipvbmx5KiogdGhpcyBtb2R1bGUgYXMgdGhlIGRlcGVuZGVuY3kgd2l0aGluIHlvdXIgYW5ndWxhciBhcHAuKlxuICogXG4gKiA8cHJlPlxuICogPCFkb2N0eXBlIGh0bWw+XG4gKiA8aHRtbCBuZy1hcHA9XCJteUFwcFwiPlxuICogPGhlYWQ+XG4gKiAgIDxzY3JpcHQgc3JjPVwianMvYW5ndWxhci5qc1wiPjwvc2NyaXB0PlxuICogICA8IS0tIEluY2x1ZGUgdGhlIHVpLXJvdXRlciBzY3JpcHQgLS0+XG4gKiAgIDxzY3JpcHQgc3JjPVwianMvYW5ndWxhci11aS1yb3V0ZXIubWluLmpzXCI+PC9zY3JpcHQ+XG4gKiAgIDxzY3JpcHQ+XG4gKiAgICAgLy8gLi4uYW5kIGFkZCAndWkucm91dGVyJyBhcyBhIGRlcGVuZGVuY3lcbiAqICAgICB2YXIgbXlBcHAgPSBhbmd1bGFyLm1vZHVsZSgnbXlBcHAnLCBbJ3VpLnJvdXRlciddKTtcbiAqICAgPC9zY3JpcHQ+XG4gKiA8L2hlYWQ+XG4gKiA8Ym9keT5cbiAqIDwvYm9keT5cbiAqIDwvaHRtbD5cbiAqIDwvcHJlPlxuICovXG5hbmd1bGFyLm1vZHVsZSgndWkucm91dGVyJywgWyd1aS5yb3V0ZXIuc3RhdGUnXSk7XG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIuY29tcGF0JywgWyd1aS5yb3V0ZXInXSk7XG5cbi8qKlxuICogQG5nZG9jIG9iamVjdFxuICogQG5hbWUgdWkucm91dGVyLnV0aWwuJHJlc29sdmVcbiAqXG4gKiBAcmVxdWlyZXMgJHFcbiAqIEByZXF1aXJlcyAkaW5qZWN0b3JcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIE1hbmFnZXMgcmVzb2x1dGlvbiBvZiAoYWN5Y2xpYykgZ3JhcGhzIG9mIHByb21pc2VzLlxuICovXG4kUmVzb2x2ZS4kaW5qZWN0ID0gWyckcScsICckaW5qZWN0b3InXTtcbmZ1bmN0aW9uICRSZXNvbHZlKCAgJHEsICAgICRpbmplY3Rvcikge1xuICBcbiAgdmFyIFZJU0lUX0lOX1BST0dSRVNTID0gMSxcbiAgICAgIFZJU0lUX0RPTkUgPSAyLFxuICAgICAgTk9USElORyA9IHt9LFxuICAgICAgTk9fREVQRU5ERU5DSUVTID0gW10sXG4gICAgICBOT19MT0NBTFMgPSBOT1RISU5HLFxuICAgICAgTk9fUEFSRU5UID0gZXh0ZW5kKCRxLndoZW4oTk9USElORyksIHsgJCRwcm9taXNlczogTk9USElORywgJCR2YWx1ZXM6IE5PVEhJTkcgfSk7XG4gIFxuXG4gIC8qKlxuICAgKiBAbmdkb2MgZnVuY3Rpb25cbiAgICogQG5hbWUgdWkucm91dGVyLnV0aWwuJHJlc29sdmUjc3R1ZHlcbiAgICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLiRyZXNvbHZlXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBTdHVkaWVzIGEgc2V0IG9mIGludm9jYWJsZXMgdGhhdCBhcmUgbGlrZWx5IHRvIGJlIHVzZWQgbXVsdGlwbGUgdGltZXMuXG4gICAqIDxwcmU+XG4gICAqICRyZXNvbHZlLnN0dWR5KGludm9jYWJsZXMpKGxvY2FscywgcGFyZW50LCBzZWxmKVxuICAgKiA8L3ByZT5cbiAgICogaXMgZXF1aXZhbGVudCB0b1xuICAgKiA8cHJlPlxuICAgKiAkcmVzb2x2ZS5yZXNvbHZlKGludm9jYWJsZXMsIGxvY2FscywgcGFyZW50LCBzZWxmKVxuICAgKiA8L3ByZT5cbiAgICogYnV0IHRoZSBmb3JtZXIgaXMgbW9yZSBlZmZpY2llbnQgKGluIGZhY3QgYHJlc29sdmVgIGp1c3QgY2FsbHMgYHN0dWR5YCBcbiAgICogaW50ZXJuYWxseSkuXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBpbnZvY2FibGVzIEludm9jYWJsZSBvYmplY3RzXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRvIHBhc3MgaW4gbG9jYWxzLCBwYXJlbnQgYW5kIHNlbGZcbiAgICovXG4gIHRoaXMuc3R1ZHkgPSBmdW5jdGlvbiAoaW52b2NhYmxlcykge1xuICAgIGlmICghaXNPYmplY3QoaW52b2NhYmxlcykpIHRocm93IG5ldyBFcnJvcihcIidpbnZvY2FibGVzJyBtdXN0IGJlIGFuIG9iamVjdFwiKTtcbiAgICBcbiAgICAvLyBQZXJmb3JtIGEgdG9wb2xvZ2ljYWwgc29ydCBvZiBpbnZvY2FibGVzIHRvIGJ1aWxkIGFuIG9yZGVyZWQgcGxhblxuICAgIHZhciBwbGFuID0gW10sIGN5Y2xlID0gW10sIHZpc2l0ZWQgPSB7fTtcbiAgICBmdW5jdGlvbiB2aXNpdCh2YWx1ZSwga2V5KSB7XG4gICAgICBpZiAodmlzaXRlZFtrZXldID09PSBWSVNJVF9ET05FKSByZXR1cm47XG4gICAgICBcbiAgICAgIGN5Y2xlLnB1c2goa2V5KTtcbiAgICAgIGlmICh2aXNpdGVkW2tleV0gPT09IFZJU0lUX0lOX1BST0dSRVNTKSB7XG4gICAgICAgIGN5Y2xlLnNwbGljZSgwLCBjeWNsZS5pbmRleE9mKGtleSkpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDeWNsaWMgZGVwZW5kZW5jeTogXCIgKyBjeWNsZS5qb2luKFwiIC0+IFwiKSk7XG4gICAgICB9XG4gICAgICB2aXNpdGVkW2tleV0gPSBWSVNJVF9JTl9QUk9HUkVTUztcbiAgICAgIFxuICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICBwbGFuLnB1c2goa2V5LCBbIGZ1bmN0aW9uKCkgeyByZXR1cm4gJGluamVjdG9yLmdldCh2YWx1ZSk7IH1dLCBOT19ERVBFTkRFTkNJRVMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICRpbmplY3Rvci5hbm5vdGF0ZSh2YWx1ZSk7XG4gICAgICAgIGZvckVhY2gocGFyYW1zLCBmdW5jdGlvbiAocGFyYW0pIHtcbiAgICAgICAgICBpZiAocGFyYW0gIT09IGtleSAmJiBpbnZvY2FibGVzLmhhc093blByb3BlcnR5KHBhcmFtKSkgdmlzaXQoaW52b2NhYmxlc1twYXJhbV0sIHBhcmFtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHBsYW4ucHVzaChrZXksIHZhbHVlLCBwYXJhbXMpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjeWNsZS5wb3AoKTtcbiAgICAgIHZpc2l0ZWRba2V5XSA9IFZJU0lUX0RPTkU7XG4gICAgfVxuICAgIGZvckVhY2goaW52b2NhYmxlcywgdmlzaXQpO1xuICAgIGludm9jYWJsZXMgPSBjeWNsZSA9IHZpc2l0ZWQgPSBudWxsOyAvLyBwbGFuIGlzIGFsbCB0aGF0J3MgcmVxdWlyZWRcbiAgICBcbiAgICBmdW5jdGlvbiBpc1Jlc29sdmUodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc09iamVjdCh2YWx1ZSkgJiYgdmFsdWUudGhlbiAmJiB2YWx1ZS4kJHByb21pc2VzO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZnVuY3Rpb24gKGxvY2FscywgcGFyZW50LCBzZWxmKSB7XG4gICAgICBpZiAoaXNSZXNvbHZlKGxvY2FscykgJiYgc2VsZiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNlbGYgPSBwYXJlbnQ7IHBhcmVudCA9IGxvY2FsczsgbG9jYWxzID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICghbG9jYWxzKSBsb2NhbHMgPSBOT19MT0NBTFM7XG4gICAgICBlbHNlIGlmICghaXNPYmplY3QobG9jYWxzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInbG9jYWxzJyBtdXN0IGJlIGFuIG9iamVjdFwiKTtcbiAgICAgIH0gICAgICAgXG4gICAgICBpZiAoIXBhcmVudCkgcGFyZW50ID0gTk9fUEFSRU5UO1xuICAgICAgZWxzZSBpZiAoIWlzUmVzb2x2ZShwYXJlbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIidwYXJlbnQnIG11c3QgYmUgYSBwcm9taXNlIHJldHVybmVkIGJ5ICRyZXNvbHZlLnJlc29sdmUoKVwiKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gVG8gY29tcGxldGUgdGhlIG92ZXJhbGwgcmVzb2x1dGlvbiwgd2UgaGF2ZSB0byB3YWl0IGZvciB0aGUgcGFyZW50XG4gICAgICAvLyBwcm9taXNlIGFuZCBmb3IgdGhlIHByb21pc2UgZm9yIGVhY2ggaW52b2thYmxlIGluIG91ciBwbGFuLlxuICAgICAgdmFyIHJlc29sdXRpb24gPSAkcS5kZWZlcigpLFxuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdXRpb24ucHJvbWlzZSxcbiAgICAgICAgICBwcm9taXNlcyA9IHJlc3VsdC4kJHByb21pc2VzID0ge30sXG4gICAgICAgICAgdmFsdWVzID0gZXh0ZW5kKHt9LCBsb2NhbHMpLFxuICAgICAgICAgIHdhaXQgPSAxICsgcGxhbi5sZW5ndGgvMyxcbiAgICAgICAgICBtZXJnZWQgPSBmYWxzZTtcbiAgICAgICAgICBcbiAgICAgIGZ1bmN0aW9uIGRvbmUoKSB7XG4gICAgICAgIC8vIE1lcmdlIHBhcmVudCB2YWx1ZXMgd2UgaGF2ZW4ndCBnb3QgeWV0IGFuZCBwdWJsaXNoIG91ciBvd24gJCR2YWx1ZXNcbiAgICAgICAgaWYgKCEtLXdhaXQpIHtcbiAgICAgICAgICBpZiAoIW1lcmdlZCkgbWVyZ2UodmFsdWVzLCBwYXJlbnQuJCR2YWx1ZXMpOyBcbiAgICAgICAgICByZXN1bHQuJCR2YWx1ZXMgPSB2YWx1ZXM7XG4gICAgICAgICAgcmVzdWx0LiQkcHJvbWlzZXMgPSB0cnVlOyAvLyBrZWVwIGZvciBpc1Jlc29sdmUoKVxuICAgICAgICAgIHJlc29sdXRpb24ucmVzb2x2ZSh2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIGZ1bmN0aW9uIGZhaWwocmVhc29uKSB7XG4gICAgICAgIHJlc3VsdC4kJGZhaWx1cmUgPSByZWFzb247XG4gICAgICAgIHJlc29sdXRpb24ucmVqZWN0KHJlYXNvbik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFNob3J0LWNpcmN1aXQgaWYgcGFyZW50IGhhcyBhbHJlYWR5IGZhaWxlZFxuICAgICAgaWYgKGlzRGVmaW5lZChwYXJlbnQuJCRmYWlsdXJlKSkge1xuICAgICAgICBmYWlsKHBhcmVudC4kJGZhaWx1cmUpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBNZXJnZSBwYXJlbnQgdmFsdWVzIGlmIHRoZSBwYXJlbnQgaGFzIGFscmVhZHkgcmVzb2x2ZWQsIG9yIG1lcmdlXG4gICAgICAvLyBwYXJlbnQgcHJvbWlzZXMgYW5kIHdhaXQgaWYgdGhlIHBhcmVudCByZXNvbHZlIGlzIHN0aWxsIGluIHByb2dyZXNzLlxuICAgICAgaWYgKHBhcmVudC4kJHZhbHVlcykge1xuICAgICAgICBtZXJnZWQgPSBtZXJnZSh2YWx1ZXMsIHBhcmVudC4kJHZhbHVlcyk7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4dGVuZChwcm9taXNlcywgcGFyZW50LiQkcHJvbWlzZXMpO1xuICAgICAgICBwYXJlbnQudGhlbihkb25lLCBmYWlsKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gUHJvY2VzcyBlYWNoIGludm9jYWJsZSBpbiB0aGUgcGxhbiwgYnV0IGlnbm9yZSBhbnkgd2hlcmUgYSBsb2NhbCBvZiB0aGUgc2FtZSBuYW1lIGV4aXN0cy5cbiAgICAgIGZvciAodmFyIGk9MCwgaWk9cGxhbi5sZW5ndGg7IGk8aWk7IGkrPTMpIHtcbiAgICAgICAgaWYgKGxvY2Fscy5oYXNPd25Qcm9wZXJ0eShwbGFuW2ldKSkgZG9uZSgpO1xuICAgICAgICBlbHNlIGludm9rZShwbGFuW2ldLCBwbGFuW2krMV0sIHBsYW5baSsyXSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGZ1bmN0aW9uIGludm9rZShrZXksIGludm9jYWJsZSwgcGFyYW1zKSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIGRlZmVycmVkIGZvciB0aGlzIGludm9jYXRpb24uIEZhaWx1cmVzIHdpbGwgcHJvcGFnYXRlIHRvIHRoZSByZXNvbHV0aW9uIGFzIHdlbGwuXG4gICAgICAgIHZhciBpbnZvY2F0aW9uID0gJHEuZGVmZXIoKSwgd2FpdFBhcmFtcyA9IDA7XG4gICAgICAgIGZ1bmN0aW9uIG9uZmFpbHVyZShyZWFzb24pIHtcbiAgICAgICAgICBpbnZvY2F0aW9uLnJlamVjdChyZWFzb24pO1xuICAgICAgICAgIGZhaWwocmVhc29uKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXYWl0IGZvciBhbnkgcGFyYW1ldGVyIHRoYXQgd2UgaGF2ZSBhIHByb21pc2UgZm9yIChlaXRoZXIgZnJvbSBwYXJlbnQgb3IgZnJvbSB0aGlzXG4gICAgICAgIC8vIHJlc29sdmU7IGluIHRoYXQgY2FzZSBzdHVkeSgpIHdpbGwgaGF2ZSBtYWRlIHN1cmUgaXQncyBvcmRlcmVkIGJlZm9yZSB1cyBpbiB0aGUgcGxhbikuXG4gICAgICAgIGZvckVhY2gocGFyYW1zLCBmdW5jdGlvbiAoZGVwKSB7XG4gICAgICAgICAgaWYgKHByb21pc2VzLmhhc093blByb3BlcnR5KGRlcCkgJiYgIWxvY2Fscy5oYXNPd25Qcm9wZXJ0eShkZXApKSB7XG4gICAgICAgICAgICB3YWl0UGFyYW1zKys7XG4gICAgICAgICAgICBwcm9taXNlc1tkZXBdLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICB2YWx1ZXNbZGVwXSA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgaWYgKCEoLS13YWl0UGFyYW1zKSkgcHJvY2VlZCgpO1xuICAgICAgICAgICAgfSwgb25mYWlsdXJlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXdhaXRQYXJhbXMpIHByb2NlZWQoKTtcbiAgICAgICAgZnVuY3Rpb24gcHJvY2VlZCgpIHtcbiAgICAgICAgICBpZiAoaXNEZWZpbmVkKHJlc3VsdC4kJGZhaWx1cmUpKSByZXR1cm47XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGludm9jYXRpb24ucmVzb2x2ZSgkaW5qZWN0b3IuaW52b2tlKGludm9jYWJsZSwgc2VsZiwgdmFsdWVzKSk7XG4gICAgICAgICAgICBpbnZvY2F0aW9uLnByb21pc2UudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgIHZhbHVlc1trZXldID0gcmVzdWx0O1xuICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICB9LCBvbmZhaWx1cmUpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIG9uZmFpbHVyZShlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gUHVibGlzaCBwcm9taXNlIHN5bmNocm9ub3VzbHk7IGludm9jYXRpb25zIGZ1cnRoZXIgZG93biBpbiB0aGUgcGxhbiBtYXkgZGVwZW5kIG9uIGl0LlxuICAgICAgICBwcm9taXNlc1trZXldID0gaW52b2NhdGlvbi5wcm9taXNlO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG4gIFxuICAvKipcbiAgICogQG5nZG9jIGZ1bmN0aW9uXG4gICAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiRyZXNvbHZlI3Jlc29sdmVcbiAgICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLiRyZXNvbHZlXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBSZXNvbHZlcyBhIHNldCBvZiBpbnZvY2FibGVzLiBBbiBpbnZvY2FibGUgaXMgYSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIHZpYSBcbiAgICogYCRpbmplY3Rvci5pbnZva2UoKWAsIGFuZCBjYW4gaGF2ZSBhbiBhcmJpdHJhcnkgbnVtYmVyIG9mIGRlcGVuZGVuY2llcy4gXG4gICAqIEFuIGludm9jYWJsZSBjYW4gZWl0aGVyIHJldHVybiBhIHZhbHVlIGRpcmVjdGx5LFxuICAgKiBvciBhIGAkcWAgcHJvbWlzZS4gSWYgYSBwcm9taXNlIGlzIHJldHVybmVkIGl0IHdpbGwgYmUgcmVzb2x2ZWQgYW5kIHRoZSBcbiAgICogcmVzdWx0aW5nIHZhbHVlIHdpbGwgYmUgdXNlZCBpbnN0ZWFkLiBEZXBlbmRlbmNpZXMgb2YgaW52b2NhYmxlcyBhcmUgcmVzb2x2ZWQgXG4gICAqIChpbiB0aGlzIG9yZGVyIG9mIHByZWNlZGVuY2UpXG4gICAqXG4gICAqIC0gZnJvbSB0aGUgc3BlY2lmaWVkIGBsb2NhbHNgXG4gICAqIC0gZnJvbSBhbm90aGVyIGludm9jYWJsZSB0aGF0IGlzIHBhcnQgb2YgdGhpcyBgJHJlc29sdmVgIGNhbGxcbiAgICogLSBmcm9tIGFuIGludm9jYWJsZSB0aGF0IGlzIGluaGVyaXRlZCBmcm9tIGEgYHBhcmVudGAgY2FsbCB0byBgJHJlc29sdmVgIFxuICAgKiAgIChvciByZWN1cnNpdmVseVxuICAgKiAtIGZyb20gYW55IGFuY2VzdG9yIGAkcmVzb2x2ZWAgb2YgdGhhdCBwYXJlbnQpLlxuICAgKlxuICAgKiBUaGUgcmV0dXJuIHZhbHVlIG9mIGAkcmVzb2x2ZWAgaXMgYSBwcm9taXNlIGZvciBhbiBvYmplY3QgdGhhdCBjb250YWlucyBcbiAgICogKGluIHRoaXMgb3JkZXIgb2YgcHJlY2VkZW5jZSlcbiAgICpcbiAgICogLSBhbnkgYGxvY2Fsc2AgKGlmIHNwZWNpZmllZClcbiAgICogLSB0aGUgcmVzb2x2ZWQgcmV0dXJuIHZhbHVlcyBvZiBhbGwgaW5qZWN0YWJsZXNcbiAgICogLSBhbnkgdmFsdWVzIGluaGVyaXRlZCBmcm9tIGEgYHBhcmVudGAgY2FsbCB0byBgJHJlc29sdmVgIChpZiBzcGVjaWZpZWQpXG4gICAqXG4gICAqIFRoZSBwcm9taXNlIHdpbGwgcmVzb2x2ZSBhZnRlciB0aGUgYHBhcmVudGAgcHJvbWlzZSAoaWYgYW55KSBhbmQgYWxsIHByb21pc2VzIFxuICAgKiByZXR1cm5lZCBieSBpbmplY3RhYmxlcyBoYXZlIGJlZW4gcmVzb2x2ZWQuIElmIGFueSBpbnZvY2FibGUgXG4gICAqIChvciBgJGluamVjdG9yLmludm9rZWApIHRocm93cyBhbiBleGNlcHRpb24sIG9yIGlmIGEgcHJvbWlzZSByZXR1cm5lZCBieSBhbiBcbiAgICogaW52b2NhYmxlIGlzIHJlamVjdGVkLCB0aGUgYCRyZXNvbHZlYCBwcm9taXNlIGlzIGltbWVkaWF0ZWx5IHJlamVjdGVkIHdpdGggdGhlIFxuICAgKiBzYW1lIGVycm9yLiBBIHJlamVjdGlvbiBvZiBhIGBwYXJlbnRgIHByb21pc2UgKGlmIHNwZWNpZmllZCkgd2lsbCBsaWtld2lzZSBiZSBcbiAgICogcHJvcGFnYXRlZCBpbW1lZGlhdGVseS4gT25jZSB0aGUgYCRyZXNvbHZlYCBwcm9taXNlIGhhcyBiZWVuIHJlamVjdGVkLCBubyBcbiAgICogZnVydGhlciBpbnZvY2FibGVzIHdpbGwgYmUgY2FsbGVkLlxuICAgKiBcbiAgICogQ3ljbGljIGRlcGVuZGVuY2llcyBiZXR3ZWVuIGludm9jYWJsZXMgYXJlIG5vdCBwZXJtaXR0ZWQgYW5kIHdpbGwgY2F1ZXMgYCRyZXNvbHZlYFxuICAgKiB0byB0aHJvdyBhbiBlcnJvci4gQXMgYSBzcGVjaWFsIGNhc2UsIGFuIGluamVjdGFibGUgY2FuIGRlcGVuZCBvbiBhIHBhcmFtZXRlciBcbiAgICogd2l0aCB0aGUgc2FtZSBuYW1lIGFzIHRoZSBpbmplY3RhYmxlLCB3aGljaCB3aWxsIGJlIGZ1bGZpbGxlZCBmcm9tIHRoZSBgcGFyZW50YCBcbiAgICogaW5qZWN0YWJsZSBvZiB0aGUgc2FtZSBuYW1lLiBUaGlzIGFsbG93cyBpbmhlcml0ZWQgdmFsdWVzIHRvIGJlIGRlY29yYXRlZC4gXG4gICAqIE5vdGUgdGhhdCBpbiB0aGlzIGNhc2UgYW55IG90aGVyIGluamVjdGFibGUgaW4gdGhlIHNhbWUgYCRyZXNvbHZlYCB3aXRoIHRoZSBzYW1lXG4gICAqIGRlcGVuZGVuY3kgd291bGQgc2VlIHRoZSBkZWNvcmF0ZWQgdmFsdWUsIG5vdCB0aGUgaW5oZXJpdGVkIHZhbHVlLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgbWlzc2luZyBkZXBlbmRlbmNpZXMgLS0gdW5saWtlIGN5Y2xpYyBkZXBlbmRlbmNpZXMgLS0gd2lsbCBjYXVzZSBhbiBcbiAgICogKGFzeW5jaHJvbm91cykgcmVqZWN0aW9uIG9mIHRoZSBgJHJlc29sdmVgIHByb21pc2UgcmF0aGVyIHRoYW4gYSAoc3luY2hyb25vdXMpIFxuICAgKiBleGNlcHRpb24uXG4gICAqXG4gICAqIEludm9jYWJsZXMgYXJlIGludm9rZWQgZWFnZXJseSBhcyBzb29uIGFzIGFsbCBkZXBlbmRlbmNpZXMgYXJlIGF2YWlsYWJsZS4gXG4gICAqIFRoaXMgaXMgdHJ1ZSBldmVuIGZvciBkZXBlbmRlbmNpZXMgaW5oZXJpdGVkIGZyb20gYSBgcGFyZW50YCBjYWxsIHRvIGAkcmVzb2x2ZWAuXG4gICAqXG4gICAqIEFzIGEgc3BlY2lhbCBjYXNlLCBhbiBpbnZvY2FibGUgY2FuIGJlIGEgc3RyaW5nLCBpbiB3aGljaCBjYXNlIGl0IGlzIHRha2VuIHRvIFxuICAgKiBiZSBhIHNlcnZpY2UgbmFtZSB0byBiZSBwYXNzZWQgdG8gYCRpbmplY3Rvci5nZXQoKWAuIFRoaXMgaXMgc3VwcG9ydGVkIHByaW1hcmlseSBcbiAgICogZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IHdpdGggdGhlIGByZXNvbHZlYCBwcm9wZXJ0eSBvZiBgJHJvdXRlUHJvdmlkZXJgIFxuICAgKiByb3V0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBpbnZvY2FibGVzIGZ1bmN0aW9ucyB0byBpbnZva2Ugb3IgXG4gICAqIGAkaW5qZWN0b3JgIHNlcnZpY2VzIHRvIGZldGNoLlxuICAgKiBAcGFyYW0ge29iamVjdH0gbG9jYWxzICB2YWx1ZXMgdG8gbWFrZSBhdmFpbGFibGUgdG8gdGhlIGluamVjdGFibGVzXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnQgIGEgcHJvbWlzZSByZXR1cm5lZCBieSBhbm90aGVyIGNhbGwgdG8gYCRyZXNvbHZlYC5cbiAgICogQHBhcmFtIHtvYmplY3R9IHNlbGYgIHRoZSBgdGhpc2AgZm9yIHRoZSBpbnZva2VkIG1ldGhvZHNcbiAgICogQHJldHVybiB7b2JqZWN0fSBQcm9taXNlIGZvciBhbiBvYmplY3QgdGhhdCBjb250YWlucyB0aGUgcmVzb2x2ZWQgcmV0dXJuIHZhbHVlXG4gICAqIG9mIGFsbCBpbnZvY2FibGVzLCBhcyB3ZWxsIGFzIGFueSBpbmhlcml0ZWQgYW5kIGxvY2FsIHZhbHVlcy5cbiAgICovXG4gIHRoaXMucmVzb2x2ZSA9IGZ1bmN0aW9uIChpbnZvY2FibGVzLCBsb2NhbHMsIHBhcmVudCwgc2VsZikge1xuICAgIHJldHVybiB0aGlzLnN0dWR5KGludm9jYWJsZXMpKGxvY2FscywgcGFyZW50LCBzZWxmKTtcbiAgfTtcbn1cblxuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci51dGlsJykuc2VydmljZSgnJHJlc29sdmUnLCAkUmVzb2x2ZSk7XG5cblxuLyoqXG4gKiBAbmdkb2Mgb2JqZWN0XG4gKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5XG4gKlxuICogQHJlcXVpcmVzICRodHRwXG4gKiBAcmVxdWlyZXMgJHRlbXBsYXRlQ2FjaGVcbiAqIEByZXF1aXJlcyAkaW5qZWN0b3JcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIFNlcnZpY2UuIE1hbmFnZXMgbG9hZGluZyBvZiB0ZW1wbGF0ZXMuXG4gKi9cbiRUZW1wbGF0ZUZhY3RvcnkuJGluamVjdCA9IFsnJGh0dHAnLCAnJHRlbXBsYXRlQ2FjaGUnLCAnJGluamVjdG9yJ107XG5mdW5jdGlvbiAkVGVtcGxhdGVGYWN0b3J5KCAgJGh0dHAsICAgJHRlbXBsYXRlQ2FjaGUsICAgJGluamVjdG9yKSB7XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5I2Zyb21Db25maWdcbiAgICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLiR0ZW1wbGF0ZUZhY3RvcnlcbiAgICpcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSB0ZW1wbGF0ZSBmcm9tIGEgY29uZmlndXJhdGlvbiBvYmplY3QuIFxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB3aGljaCB0byBsb2FkIGEgdGVtcGxhdGUuIFxuICAgKiBUaGUgZm9sbG93aW5nIHByb3BlcnRpZXMgYXJlIHNlYXJjaCBpbiB0aGUgc3BlY2lmaWVkIG9yZGVyLCBhbmQgdGhlIGZpcnN0IG9uZSBcbiAgICogdGhhdCBpcyBkZWZpbmVkIGlzIHVzZWQgdG8gY3JlYXRlIHRoZSB0ZW1wbGF0ZTpcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBjb25maWcudGVtcGxhdGUgaHRtbCBzdHJpbmcgdGVtcGxhdGUgb3IgZnVuY3Rpb24gdG8gXG4gICAqIGxvYWQgdmlhIHtAbGluayB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5I2Zyb21TdHJpbmcgZnJvbVN0cmluZ30uXG4gICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gY29uZmlnLnRlbXBsYXRlVXJsIHVybCB0byBsb2FkIG9yIGEgZnVuY3Rpb24gcmV0dXJuaW5nIFxuICAgKiB0aGUgdXJsIHRvIGxvYWQgdmlhIHtAbGluayB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5I2Zyb21VcmwgZnJvbVVybH0uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbmZpZy50ZW1wbGF0ZVByb3ZpZGVyIGZ1bmN0aW9uIHRvIGludm9rZSB2aWEgXG4gICAqIHtAbGluayB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5I2Zyb21Qcm92aWRlciBmcm9tUHJvdmlkZXJ9LlxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zICBQYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0ge29iamVjdH0gbG9jYWxzIExvY2FscyB0byBwYXNzIHRvIGBpbnZva2VgIGlmIHRoZSB0ZW1wbGF0ZSBpcyBsb2FkZWQgXG4gICAqIHZpYSBhIGB0ZW1wbGF0ZVByb3ZpZGVyYC4gRGVmYXVsdHMgdG8gYHsgcGFyYW1zOiBwYXJhbXMgfWAuXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ3xvYmplY3R9ICBUaGUgdGVtcGxhdGUgaHRtbCBhcyBhIHN0cmluZywgb3IgYSBwcm9taXNlIGZvciBcbiAgICogdGhhdCBzdHJpbmcsb3IgYG51bGxgIGlmIG5vIHRlbXBsYXRlIGlzIGNvbmZpZ3VyZWQuXG4gICAqL1xuICB0aGlzLmZyb21Db25maWcgPSBmdW5jdGlvbiAoY29uZmlnLCBwYXJhbXMsIGxvY2Fscykge1xuICAgIHJldHVybiAoXG4gICAgICBpc0RlZmluZWQoY29uZmlnLnRlbXBsYXRlKSA/IHRoaXMuZnJvbVN0cmluZyhjb25maWcudGVtcGxhdGUsIHBhcmFtcykgOlxuICAgICAgaXNEZWZpbmVkKGNvbmZpZy50ZW1wbGF0ZVVybCkgPyB0aGlzLmZyb21VcmwoY29uZmlnLnRlbXBsYXRlVXJsLCBwYXJhbXMpIDpcbiAgICAgIGlzRGVmaW5lZChjb25maWcudGVtcGxhdGVQcm92aWRlcikgPyB0aGlzLmZyb21Qcm92aWRlcihjb25maWcudGVtcGxhdGVQcm92aWRlciwgcGFyYW1zLCBsb2NhbHMpIDpcbiAgICAgIG51bGxcbiAgICApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgZnVuY3Rpb25cbiAgICogQG5hbWUgdWkucm91dGVyLnV0aWwuJHRlbXBsYXRlRmFjdG9yeSNmcm9tU3RyaW5nXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5XG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgdGVtcGxhdGUgZnJvbSBhIHN0cmluZyBvciBhIGZ1bmN0aW9uIHJldHVybmluZyBhIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSB0ZW1wbGF0ZSBodG1sIHRlbXBsYXRlIGFzIGEgc3RyaW5nIG9yIGZ1bmN0aW9uIHRoYXQgXG4gICAqIHJldHVybnMgYW4gaHRtbCB0ZW1wbGF0ZSBhcyBhIHN0cmluZy5cbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBQYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd8b2JqZWN0fSBUaGUgdGVtcGxhdGUgaHRtbCBhcyBhIHN0cmluZywgb3IgYSBwcm9taXNlIGZvciB0aGF0IFxuICAgKiBzdHJpbmcuXG4gICAqL1xuICB0aGlzLmZyb21TdHJpbmcgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHBhcmFtcykge1xuICAgIHJldHVybiBpc0Z1bmN0aW9uKHRlbXBsYXRlKSA/IHRlbXBsYXRlKHBhcmFtcykgOiB0ZW1wbGF0ZTtcbiAgfTtcblxuICAvKipcbiAgICogQG5nZG9jIGZ1bmN0aW9uXG4gICAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiR0ZW1wbGF0ZUZhY3RvcnkjZnJvbVVybFxuICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnV0aWwuJHRlbXBsYXRlRmFjdG9yeVxuICAgKiBcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIExvYWRzIGEgdGVtcGxhdGUgZnJvbSB0aGUgYSBVUkwgdmlhIGAkaHR0cGAgYW5kIGAkdGVtcGxhdGVDYWNoZWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfEZ1bmN0aW9ufSB1cmwgdXJsIG9mIHRoZSB0ZW1wbGF0ZSB0byBsb2FkLCBvciBhIGZ1bmN0aW9uIFxuICAgKiB0aGF0IHJldHVybnMgYSB1cmwuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgUGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSB1cmwgZnVuY3Rpb24uXG4gICAqIEByZXR1cm4ge3N0cmluZ3xQcm9taXNlLjxzdHJpbmc+fSBUaGUgdGVtcGxhdGUgaHRtbCBhcyBhIHN0cmluZywgb3IgYSBwcm9taXNlIFxuICAgKiBmb3IgdGhhdCBzdHJpbmcuXG4gICAqL1xuICB0aGlzLmZyb21VcmwgPSBmdW5jdGlvbiAodXJsLCBwYXJhbXMpIHtcbiAgICBpZiAoaXNGdW5jdGlvbih1cmwpKSB1cmwgPSB1cmwocGFyYW1zKTtcbiAgICBpZiAodXJsID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIGVsc2UgcmV0dXJuICRodHRwXG4gICAgICAgIC5nZXQodXJsLCB7IGNhY2hlOiAkdGVtcGxhdGVDYWNoZSB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkgeyByZXR1cm4gcmVzcG9uc2UuZGF0YTsgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5I2Zyb21VcmxcbiAgICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLiR0ZW1wbGF0ZUZhY3RvcnlcbiAgICpcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSB0ZW1wbGF0ZSBieSBpbnZva2luZyBhbiBpbmplY3RhYmxlIHByb3ZpZGVyIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcm92aWRlciBGdW5jdGlvbiB0byBpbnZva2UgdmlhIGAkaW5qZWN0b3IuaW52b2tlYFxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgZm9yIHRoZSB0ZW1wbGF0ZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IGxvY2FscyBMb2NhbHMgdG8gcGFzcyB0byBgaW52b2tlYC4gRGVmYXVsdHMgdG8gXG4gICAqIGB7IHBhcmFtczogcGFyYW1zIH1gLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd8UHJvbWlzZS48c3RyaW5nPn0gVGhlIHRlbXBsYXRlIGh0bWwgYXMgYSBzdHJpbmcsIG9yIGEgcHJvbWlzZSBcbiAgICogZm9yIHRoYXQgc3RyaW5nLlxuICAgKi9cbiAgdGhpcy5mcm9tUHJvdmlkZXIgPSBmdW5jdGlvbiAocHJvdmlkZXIsIHBhcmFtcywgbG9jYWxzKSB7XG4gICAgcmV0dXJuICRpbmplY3Rvci5pbnZva2UocHJvdmlkZXIsIG51bGwsIGxvY2FscyB8fCB7IHBhcmFtczogcGFyYW1zIH0pO1xuICB9O1xufVxuXG5hbmd1bGFyLm1vZHVsZSgndWkucm91dGVyLnV0aWwnKS5zZXJ2aWNlKCckdGVtcGxhdGVGYWN0b3J5JywgJFRlbXBsYXRlRmFjdG9yeSk7XG5cbi8qKlxuICogQG5nZG9jIG9iamVjdFxuICogQG5hbWUgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBNYXRjaGVzIFVSTHMgYWdhaW5zdCBwYXR0ZXJucyBhbmQgZXh0cmFjdHMgbmFtZWQgcGFyYW1ldGVycyBmcm9tIHRoZSBwYXRoIG9yIHRoZSBzZWFyY2hcbiAqIHBhcnQgb2YgdGhlIFVSTC4gQSBVUkwgcGF0dGVybiBjb25zaXN0cyBvZiBhIHBhdGggcGF0dGVybiwgb3B0aW9uYWxseSBmb2xsb3dlZCBieSAnPycgYW5kIGEgbGlzdFxuICogb2Ygc2VhcmNoIHBhcmFtZXRlcnMuIE11bHRpcGxlIHNlYXJjaCBwYXJhbWV0ZXIgbmFtZXMgYXJlIHNlcGFyYXRlZCBieSAnJicuIFNlYXJjaCBwYXJhbWV0ZXJzXG4gKiBkbyBub3QgaW5mbHVlbmNlIHdoZXRoZXIgb3Igbm90IGEgVVJMIGlzIG1hdGNoZWQsIGJ1dCB0aGVpciB2YWx1ZXMgYXJlIHBhc3NlZCB0aHJvdWdoIGludG9cbiAqIHRoZSBtYXRjaGVkIHBhcmFtZXRlcnMgcmV0dXJuZWQgYnkge0BsaW5rIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlciNtZXRob2RzX2V4ZWMgZXhlY30uXG4gKiBcbiAqIFBhdGggcGFyYW1ldGVyIHBsYWNlaG9sZGVycyBjYW4gYmUgc3BlY2lmaWVkIHVzaW5nIHNpbXBsZSBjb2xvbi9jYXRjaC1hbGwgc3ludGF4IG9yIGN1cmx5IGJyYWNlXG4gKiBzeW50YXgsIHdoaWNoIG9wdGlvbmFsbHkgYWxsb3dzIGEgcmVndWxhciBleHByZXNzaW9uIGZvciB0aGUgcGFyYW1ldGVyIHRvIGJlIHNwZWNpZmllZDpcbiAqXG4gKiAqIGAnOidgIG5hbWUgLSBjb2xvbiBwbGFjZWhvbGRlclxuICogKiBgJyonYCBuYW1lIC0gY2F0Y2gtYWxsIHBsYWNlaG9sZGVyXG4gKiAqIGAneycgbmFtZSAnfSdgIC0gY3VybHkgcGxhY2Vob2xkZXJcbiAqICogYCd7JyBuYW1lICc6JyByZWdleHAgJ30nYCAtIGN1cmx5IHBsYWNlaG9sZGVyIHdpdGggcmVnZXhwLiBTaG91bGQgdGhlIHJlZ2V4cCBpdHNlbGYgY29udGFpblxuICogICBjdXJseSBicmFjZXMsIHRoZXkgbXVzdCBiZSBpbiBtYXRjaGVkIHBhaXJzIG9yIGVzY2FwZWQgd2l0aCBhIGJhY2tzbGFzaC5cbiAqXG4gKiBQYXJhbWV0ZXIgbmFtZXMgbWF5IGNvbnRhaW4gb25seSB3b3JkIGNoYXJhY3RlcnMgKGxhdGluIGxldHRlcnMsIGRpZ2l0cywgYW5kIHVuZGVyc2NvcmUpIGFuZFxuICogbXVzdCBiZSB1bmlxdWUgd2l0aGluIHRoZSBwYXR0ZXJuIChhY3Jvc3MgYm90aCBwYXRoIGFuZCBzZWFyY2ggcGFyYW1ldGVycykuIEZvciBjb2xvbiBcbiAqIHBsYWNlaG9sZGVycyBvciBjdXJseSBwbGFjZWhvbGRlcnMgd2l0aG91dCBhbiBleHBsaWNpdCByZWdleHAsIGEgcGF0aCBwYXJhbWV0ZXIgbWF0Y2hlcyBhbnlcbiAqIG51bWJlciBvZiBjaGFyYWN0ZXJzIG90aGVyIHRoYW4gJy8nLiBGb3IgY2F0Y2gtYWxsIHBsYWNlaG9sZGVycyB0aGUgcGF0aCBwYXJhbWV0ZXIgbWF0Y2hlc1xuICogYW55IG51bWJlciBvZiBjaGFyYWN0ZXJzLlxuICogXG4gKiBFeGFtcGxlczpcbiAqIFxuICogKiBgJy9oZWxsby8nYCAtIE1hdGNoZXMgb25seSBpZiB0aGUgcGF0aCBpcyBleGFjdGx5ICcvaGVsbG8vJy4gVGhlcmUgaXMgbm8gc3BlY2lhbCB0cmVhdG1lbnQgZm9yXG4gKiAgIHRyYWlsaW5nIHNsYXNoZXMsIGFuZCBwYXR0ZXJucyBoYXZlIHRvIG1hdGNoIHRoZSBlbnRpcmUgcGF0aCwgbm90IGp1c3QgYSBwcmVmaXguXG4gKiAqIGAnL3VzZXIvOmlkJ2AgLSBNYXRjaGVzICcvdXNlci9ib2InIG9yICcvdXNlci8xMjM0ISEhJyBvciBldmVuICcvdXNlci8nIGJ1dCBub3QgJy91c2VyJyBvclxuICogICAnL3VzZXIvYm9iL2RldGFpbHMnLiBUaGUgc2Vjb25kIHBhdGggc2VnbWVudCB3aWxsIGJlIGNhcHR1cmVkIGFzIHRoZSBwYXJhbWV0ZXIgJ2lkJy5cbiAqICogYCcvdXNlci97aWR9J2AgLSBTYW1lIGFzIHRoZSBwcmV2aW91cyBleGFtcGxlLCBidXQgdXNpbmcgY3VybHkgYnJhY2Ugc3ludGF4LlxuICogKiBgJy91c2VyL3tpZDpbXi9dKn0nYCAtIFNhbWUgYXMgdGhlIHByZXZpb3VzIGV4YW1wbGUuXG4gKiAqIGAnL3VzZXIve2lkOlswLTlhLWZBLUZdezEsOH19J2AgLSBTaW1pbGFyIHRvIHRoZSBwcmV2aW91cyBleGFtcGxlLCBidXQgb25seSBtYXRjaGVzIGlmIHRoZSBpZFxuICogICBwYXJhbWV0ZXIgY29uc2lzdHMgb2YgMSB0byA4IGhleCBkaWdpdHMuXG4gKiAqIGAnL2ZpbGVzL3twYXRoOi4qfSdgIC0gTWF0Y2hlcyBhbnkgVVJMIHN0YXJ0aW5nIHdpdGggJy9maWxlcy8nIGFuZCBjYXB0dXJlcyB0aGUgcmVzdCBvZiB0aGVcbiAqICAgcGF0aCBpbnRvIHRoZSBwYXJhbWV0ZXIgJ3BhdGgnLlxuICogKiBgJy9maWxlcy8qcGF0aCdgIC0gZGl0dG8uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdHRlcm4gIHRoZSBwYXR0ZXJuIHRvIGNvbXBpbGUgaW50byBhIG1hdGNoZXIuXG4gKlxuICogQHByb3BlcnR5IHtzdHJpbmd9IHByZWZpeCAgQSBzdGF0aWMgcHJlZml4IG9mIHRoaXMgcGF0dGVybi4gVGhlIG1hdGNoZXIgZ3VhcmFudGVlcyB0aGF0IGFueVxuICogICBVUkwgbWF0Y2hpbmcgdGhpcyBtYXRjaGVyIChpLmUuIGFueSBzdHJpbmcgZm9yIHdoaWNoIHtAbGluayB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXIjbWV0aG9kc19leGVjIGV4ZWMoKX0gcmV0dXJuc1xuICogICBub24tbnVsbCkgd2lsbCBzdGFydCB3aXRoIHRoaXMgcHJlZml4LlxuICpcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzb3VyY2UgIFRoZSBwYXR0ZXJuIHRoYXQgd2FzIHBhc3NlZCBpbnRvIHRoZSBjb250cnVjdG9yXG4gKlxuICogQHByb3BlcnR5IHtzdHJpbmd9IHNvdXJjZVBhdGggIFRoZSBwYXRoIHBvcnRpb24gb2YgdGhlIHNvdXJjZSBwcm9wZXJ0eVxuICpcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzb3VyY2VTZWFyY2ggIFRoZSBzZWFyY2ggcG9ydGlvbiBvZiB0aGUgc291cmNlIHByb3BlcnR5XG4gKlxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJlZ2V4ICBUaGUgY29uc3RydWN0ZWQgcmVnZXggdGhhdCB3aWxsIGJlIHVzZWQgdG8gbWF0Y2ggYWdhaW5zdCB0aGUgdXJsIHdoZW4gXG4gKiAgIGl0IGlzIHRpbWUgdG8gZGV0ZXJtaW5lIHdoaWNoIHVybCB3aWxsIG1hdGNoLlxuICpcbiAqIEByZXR1cm5zIHtPYmplY3R9ICBOZXcgVXJsTWF0Y2hlciBvYmplY3RcbiAqL1xuZnVuY3Rpb24gVXJsTWF0Y2hlcihwYXR0ZXJuKSB7XG5cbiAgLy8gRmluZCBhbGwgcGxhY2Vob2xkZXJzIGFuZCBjcmVhdGUgYSBjb21waWxlZCBwYXR0ZXJuLCB1c2luZyBlaXRoZXIgY2xhc3NpYyBvciBjdXJseSBzeW50YXg6XG4gIC8vICAgJyonIG5hbWVcbiAgLy8gICAnOicgbmFtZVxuICAvLyAgICd7JyBuYW1lICd9J1xuICAvLyAgICd7JyBuYW1lICc6JyByZWdleHAgJ30nXG4gIC8vIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gaXMgc29tZXdoYXQgY29tcGxpY2F0ZWQgZHVlIHRvIHRoZSBuZWVkIHRvIGFsbG93IGN1cmx5IGJyYWNlc1xuICAvLyBpbnNpZGUgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbi4gVGhlIHBsYWNlaG9sZGVyIHJlZ2V4cCBicmVha3MgZG93biBhcyBmb2xsb3dzOlxuICAvLyAgICAoWzoqXSkoXFx3KykgICAgICAgICAgICAgICBjbGFzc2ljIHBsYWNlaG9sZGVyICgkMSAvICQyKVxuICAvLyAgICBcXHsoXFx3KykoPzpcXDooIC4uLiApKT9cXH0gICBjdXJseSBicmFjZSBwbGFjZWhvbGRlciAoJDMpIHdpdGggb3B0aW9uYWwgcmVnZXhwIC4uLiAoJDQpXG4gIC8vICAgICg/OiAuLi4gfCAuLi4gfCAuLi4gKSsgICAgdGhlIHJlZ2V4cCBjb25zaXN0cyBvZiBhbnkgbnVtYmVyIG9mIGF0b21zLCBhbiBhdG9tIGJlaW5nIGVpdGhlclxuICAvLyAgICBbXnt9XFxcXF0rICAgICAgICAgICAgICAgICAgLSBhbnl0aGluZyBvdGhlciB0aGFuIGN1cmx5IGJyYWNlcyBvciBiYWNrc2xhc2hcbiAgLy8gICAgXFxcXC4gICAgICAgICAgICAgICAgICAgICAgIC0gYSBiYWNrc2xhc2ggZXNjYXBlXG4gIC8vICAgIFxceyg/Oltee31cXFxcXSt8XFxcXC4pKlxcfSAgICAgLSBhIG1hdGNoZWQgc2V0IG9mIGN1cmx5IGJyYWNlcyBjb250YWluaW5nIG90aGVyIGF0b21zXG4gIHZhciBwbGFjZWhvbGRlciA9IC8oWzoqXSkoXFx3Kyl8XFx7KFxcdyspKD86XFw6KCg/Oltee31cXFxcXSt8XFxcXC58XFx7KD86W157fVxcXFxdK3xcXFxcLikqXFx9KSspKT9cXH0vZyxcbiAgICAgIG5hbWVzID0ge30sIGNvbXBpbGVkID0gJ14nLCBsYXN0ID0gMCwgbSxcbiAgICAgIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50cyA9IFtdLFxuICAgICAgcGFyYW1zID0gdGhpcy5wYXJhbXMgPSBbXTtcblxuICBmdW5jdGlvbiBhZGRQYXJhbWV0ZXIoaWQpIHtcbiAgICBpZiAoIS9eXFx3KygtK1xcdyspKiQvLnRlc3QoaWQpKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHBhcmFtZXRlciBuYW1lICdcIiArIGlkICsgXCInIGluIHBhdHRlcm4gJ1wiICsgcGF0dGVybiArIFwiJ1wiKTtcbiAgICBpZiAobmFtZXNbaWRdKSB0aHJvdyBuZXcgRXJyb3IoXCJEdXBsaWNhdGUgcGFyYW1ldGVyIG5hbWUgJ1wiICsgaWQgKyBcIicgaW4gcGF0dGVybiAnXCIgKyBwYXR0ZXJuICsgXCInXCIpO1xuICAgIG5hbWVzW2lkXSA9IHRydWU7XG4gICAgcGFyYW1zLnB1c2goaWQpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVvdGVSZWdFeHAoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bXFxcXFxcW1xcXVxcXiQqKz8uKCl8e31dL2csIFwiXFxcXCQmXCIpO1xuICB9XG5cbiAgdGhpcy5zb3VyY2UgPSBwYXR0ZXJuO1xuXG4gIC8vIFNwbGl0IGludG8gc3RhdGljIHNlZ21lbnRzIHNlcGFyYXRlZCBieSBwYXRoIHBhcmFtZXRlciBwbGFjZWhvbGRlcnMuXG4gIC8vIFRoZSBudW1iZXIgb2Ygc2VnbWVudHMgaXMgYWx3YXlzIDEgbW9yZSB0aGFuIHRoZSBudW1iZXIgb2YgcGFyYW1ldGVycy5cbiAgdmFyIGlkLCByZWdleHAsIHNlZ21lbnQ7XG4gIHdoaWxlICgobSA9IHBsYWNlaG9sZGVyLmV4ZWMocGF0dGVybikpKSB7XG4gICAgaWQgPSBtWzJdIHx8IG1bM107IC8vIElFWzc4XSByZXR1cm5zICcnIGZvciB1bm1hdGNoZWQgZ3JvdXBzIGluc3RlYWQgb2YgbnVsbFxuICAgIHJlZ2V4cCA9IG1bNF0gfHwgKG1bMV0gPT0gJyonID8gJy4qJyA6ICdbXi9dKicpO1xuICAgIHNlZ21lbnQgPSBwYXR0ZXJuLnN1YnN0cmluZyhsYXN0LCBtLmluZGV4KTtcbiAgICBpZiAoc2VnbWVudC5pbmRleE9mKCc/JykgPj0gMCkgYnJlYWs7IC8vIHdlJ3JlIGludG8gdGhlIHNlYXJjaCBwYXJ0XG4gICAgY29tcGlsZWQgKz0gcXVvdGVSZWdFeHAoc2VnbWVudCkgKyAnKCcgKyByZWdleHAgKyAnKSc7XG4gICAgYWRkUGFyYW1ldGVyKGlkKTtcbiAgICBzZWdtZW50cy5wdXNoKHNlZ21lbnQpO1xuICAgIGxhc3QgPSBwbGFjZWhvbGRlci5sYXN0SW5kZXg7XG4gIH1cbiAgc2VnbWVudCA9IHBhdHRlcm4uc3Vic3RyaW5nKGxhc3QpO1xuXG4gIC8vIEZpbmQgYW55IHNlYXJjaCBwYXJhbWV0ZXIgbmFtZXMgYW5kIHJlbW92ZSB0aGVtIGZyb20gdGhlIGxhc3Qgc2VnbWVudFxuICB2YXIgaSA9IHNlZ21lbnQuaW5kZXhPZignPycpO1xuICBpZiAoaSA+PSAwKSB7XG4gICAgdmFyIHNlYXJjaCA9IHRoaXMuc291cmNlU2VhcmNoID0gc2VnbWVudC5zdWJzdHJpbmcoaSk7XG4gICAgc2VnbWVudCA9IHNlZ21lbnQuc3Vic3RyaW5nKDAsIGkpO1xuICAgIHRoaXMuc291cmNlUGF0aCA9IHBhdHRlcm4uc3Vic3RyaW5nKDAsIGxhc3QraSk7XG5cbiAgICAvLyBBbGxvdyBwYXJhbWV0ZXJzIHRvIGJlIHNlcGFyYXRlZCBieSAnPycgYXMgd2VsbCBhcyAnJicgdG8gbWFrZSBjb25jYXQoKSBlYXNpZXJcbiAgICBmb3JFYWNoKHNlYXJjaC5zdWJzdHJpbmcoMSkuc3BsaXQoL1smP10vKSwgYWRkUGFyYW1ldGVyKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnNvdXJjZVBhdGggPSBwYXR0ZXJuO1xuICAgIHRoaXMuc291cmNlU2VhcmNoID0gJyc7XG4gIH1cblxuICBjb21waWxlZCArPSBxdW90ZVJlZ0V4cChzZWdtZW50KSArICckJztcbiAgc2VnbWVudHMucHVzaChzZWdtZW50KTtcbiAgdGhpcy5yZWdleHAgPSBuZXcgUmVnRXhwKGNvbXBpbGVkKTtcbiAgdGhpcy5wcmVmaXggPSBzZWdtZW50c1swXTtcbn1cblxuLyoqXG4gKiBAbmdkb2MgZnVuY3Rpb25cbiAqIEBuYW1lIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlciNjb25jYXRcbiAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXJcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIFJldHVybnMgYSBuZXcgbWF0Y2hlciBmb3IgYSBwYXR0ZXJuIGNvbnN0cnVjdGVkIGJ5IGFwcGVuZGluZyB0aGUgcGF0aCBwYXJ0IGFuZCBhZGRpbmcgdGhlXG4gKiBzZWFyY2ggcGFyYW1ldGVycyBvZiB0aGUgc3BlY2lmaWVkIHBhdHRlcm4gdG8gdGhpcyBwYXR0ZXJuLiBUaGUgY3VycmVudCBwYXR0ZXJuIGlzIG5vdFxuICogbW9kaWZpZWQuIFRoaXMgY2FuIGJlIHVuZGVyc3Rvb2QgYXMgY3JlYXRpbmcgYSBwYXR0ZXJuIGZvciBVUkxzIHRoYXQgYXJlIHJlbGF0aXZlIHRvIChvclxuICogc3VmZml4ZXMgb2YpIHRoZSBjdXJyZW50IHBhdHRlcm4uXG4gKlxuICogQGV4YW1wbGVcbiAqIFRoZSBmb2xsb3dpbmcgdHdvIG1hdGNoZXJzIGFyZSBlcXVpdmFsZW50OlxuICogYGBgXG4gKiBuZXcgVXJsTWF0Y2hlcignL3VzZXIve2lkfT9xJykuY29uY2F0KCcvZGV0YWlscz9kYXRlJyk7XG4gKiBuZXcgVXJsTWF0Y2hlcignL3VzZXIve2lkfS9kZXRhaWxzP3EmZGF0ZScpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdHRlcm4gIFRoZSBwYXR0ZXJuIHRvIGFwcGVuZC5cbiAqIEByZXR1cm5zIHt1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXJ9ICBBIG1hdGNoZXIgZm9yIHRoZSBjb25jYXRlbmF0ZWQgcGF0dGVybi5cbiAqL1xuVXJsTWF0Y2hlci5wcm90b3R5cGUuY29uY2F0ID0gZnVuY3Rpb24gKHBhdHRlcm4pIHtcbiAgLy8gQmVjYXVzZSBvcmRlciBvZiBzZWFyY2ggcGFyYW1ldGVycyBpcyBpcnJlbGV2YW50LCB3ZSBjYW4gYWRkIG91ciBvd24gc2VhcmNoXG4gIC8vIHBhcmFtZXRlcnMgdG8gdGhlIGVuZCBvZiB0aGUgbmV3IHBhdHRlcm4uIFBhcnNlIHRoZSBuZXcgcGF0dGVybiBieSBpdHNlbGZcbiAgLy8gYW5kIHRoZW4gam9pbiB0aGUgYml0cyB0b2dldGhlciwgYnV0IGl0J3MgbXVjaCBlYXNpZXIgdG8gZG8gdGhpcyBvbiBhIHN0cmluZyBsZXZlbC5cbiAgcmV0dXJuIG5ldyBVcmxNYXRjaGVyKHRoaXMuc291cmNlUGF0aCArIHBhdHRlcm4gKyB0aGlzLnNvdXJjZVNlYXJjaCk7XG59O1xuXG5VcmxNYXRjaGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuc291cmNlO1xufTtcblxuLyoqXG4gKiBAbmdkb2MgZnVuY3Rpb25cbiAqIEBuYW1lIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlciNleGVjXG4gKiBAbWV0aG9kT2YgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBUZXN0cyB0aGUgc3BlY2lmaWVkIHBhdGggYWdhaW5zdCB0aGlzIG1hdGNoZXIsIGFuZCByZXR1cm5zIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBjYXB0dXJlZFxuICogcGFyYW1ldGVyIHZhbHVlcywgb3IgbnVsbCBpZiB0aGUgcGF0aCBkb2VzIG5vdCBtYXRjaC4gVGhlIHJldHVybmVkIG9iamVjdCBjb250YWlucyB0aGUgdmFsdWVzXG4gKiBvZiBhbnkgc2VhcmNoIHBhcmFtZXRlcnMgdGhhdCBhcmUgbWVudGlvbmVkIGluIHRoZSBwYXR0ZXJuLCBidXQgdGhlaXIgdmFsdWUgbWF5IGJlIG51bGwgaWZcbiAqIHRoZXkgYXJlIG5vdCBwcmVzZW50IGluIGBzZWFyY2hQYXJhbXNgLiBUaGlzIG1lYW5zIHRoYXQgc2VhcmNoIHBhcmFtZXRlcnMgYXJlIGFsd2F5cyB0cmVhdGVkXG4gKiBhcyBvcHRpb25hbC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgXG4gKiBuZXcgVXJsTWF0Y2hlcignL3VzZXIve2lkfT9xJnInKS5leGVjKCcvdXNlci9ib2InLCB7IHg6JzEnLCBxOidoZWxsbycgfSk7XG4gKiAvLyByZXR1cm5zIHsgaWQ6J2JvYicsIHE6J2hlbGxvJywgcjpudWxsIH1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoICBUaGUgVVJMIHBhdGggdG8gbWF0Y2gsIGUuZy4gYCRsb2NhdGlvbi5wYXRoKClgLlxuICogQHBhcmFtIHtPYmplY3R9IHNlYXJjaFBhcmFtcyAgVVJMIHNlYXJjaCBwYXJhbWV0ZXJzLCBlLmcuIGAkbG9jYXRpb24uc2VhcmNoKClgLlxuICogQHJldHVybnMge09iamVjdH0gIFRoZSBjYXB0dXJlZCBwYXJhbWV0ZXIgdmFsdWVzLlxuICovXG5VcmxNYXRjaGVyLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gKHBhdGgsIHNlYXJjaFBhcmFtcykge1xuICB2YXIgbSA9IHRoaXMucmVnZXhwLmV4ZWMocGF0aCk7XG4gIGlmICghbSkgcmV0dXJuIG51bGw7XG5cbiAgdmFyIHBhcmFtcyA9IHRoaXMucGFyYW1zLCBuVG90YWwgPSBwYXJhbXMubGVuZ3RoLFxuICAgIG5QYXRoID0gdGhpcy5zZWdtZW50cy5sZW5ndGgtMSxcbiAgICB2YWx1ZXMgPSB7fSwgaTtcblxuICBpZiAoblBhdGggIT09IG0ubGVuZ3RoIC0gMSkgdGhyb3cgbmV3IEVycm9yKFwiVW5iYWxhbmNlZCBjYXB0dXJlIGdyb3VwIGluIHJvdXRlICdcIiArIHRoaXMuc291cmNlICsgXCInXCIpO1xuXG4gIGZvciAoaT0wOyBpPG5QYXRoOyBpKyspIHZhbHVlc1twYXJhbXNbaV1dID0gbVtpKzFdO1xuICBmb3IgKC8qKi87IGk8blRvdGFsOyBpKyspIHZhbHVlc1twYXJhbXNbaV1dID0gc2VhcmNoUGFyYW1zW3BhcmFtc1tpXV07XG5cbiAgcmV0dXJuIHZhbHVlcztcbn07XG5cbi8qKlxuICogQG5nZG9jIGZ1bmN0aW9uXG4gKiBAbmFtZSB1aS5yb3V0ZXIudXRpbC50eXBlOlVybE1hdGNoZXIjcGFyYW1ldGVyc1xuICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlclxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogUmV0dXJucyB0aGUgbmFtZXMgb2YgYWxsIHBhdGggYW5kIHNlYXJjaCBwYXJhbWV0ZXJzIG9mIHRoaXMgcGF0dGVybiBpbiBhbiB1bnNwZWNpZmllZCBvcmRlci5cbiAqIFxuICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSAgQW4gYXJyYXkgb2YgcGFyYW1ldGVyIG5hbWVzLiBNdXN0IGJlIHRyZWF0ZWQgYXMgcmVhZC1vbmx5LiBJZiB0aGVcbiAqICAgIHBhdHRlcm4gaGFzIG5vIHBhcmFtZXRlcnMsIGFuIGVtcHR5IGFycmF5IGlzIHJldHVybmVkLlxuICovXG5VcmxNYXRjaGVyLnByb3RvdHlwZS5wYXJhbWV0ZXJzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5wYXJhbXM7XG59O1xuXG4vKipcbiAqIEBuZ2RvYyBmdW5jdGlvblxuICogQG5hbWUgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyI2Zvcm1hdFxuICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlclxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogQ3JlYXRlcyBhIFVSTCB0aGF0IG1hdGNoZXMgdGhpcyBwYXR0ZXJuIGJ5IHN1YnN0aXR1dGluZyB0aGUgc3BlY2lmaWVkIHZhbHVlc1xuICogZm9yIHRoZSBwYXRoIGFuZCBzZWFyY2ggcGFyYW1ldGVycy4gTnVsbCB2YWx1ZXMgZm9yIHBhdGggcGFyYW1ldGVycyBhcmVcbiAqIHRyZWF0ZWQgYXMgZW1wdHkgc3RyaW5ncy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgXG4gKiBuZXcgVXJsTWF0Y2hlcignL3VzZXIve2lkfT9xJykuZm9ybWF0KHsgaWQ6J2JvYicsIHE6J3llcycgfSk7XG4gKiAvLyByZXR1cm5zICcvdXNlci9ib2I/cT15ZXMnXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzICB0aGUgdmFsdWVzIHRvIHN1YnN0aXR1dGUgZm9yIHRoZSBwYXJhbWV0ZXJzIGluIHRoaXMgcGF0dGVybi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9ICB0aGUgZm9ybWF0dGVkIFVSTCAocGF0aCBhbmQgb3B0aW9uYWxseSBzZWFyY2ggcGFydCkuXG4gKi9cblVybE1hdGNoZXIucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgdmFyIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50cywgcGFyYW1zID0gdGhpcy5wYXJhbXM7XG4gIGlmICghdmFsdWVzKSByZXR1cm4gc2VnbWVudHMuam9pbignJyk7XG5cbiAgdmFyIG5QYXRoID0gc2VnbWVudHMubGVuZ3RoLTEsIG5Ub3RhbCA9IHBhcmFtcy5sZW5ndGgsXG4gICAgcmVzdWx0ID0gc2VnbWVudHNbMF0sIGksIHNlYXJjaCwgdmFsdWU7XG5cbiAgZm9yIChpPTA7IGk8blBhdGg7IGkrKykge1xuICAgIHZhbHVlID0gdmFsdWVzW3BhcmFtc1tpXV07XG4gICAgLy8gVE9ETzogTWF5YmUgd2Ugc2hvdWxkIHRocm93IG9uIG51bGwgaGVyZT8gSXQncyBub3QgcmVhbGx5IGdvb2Qgc3R5bGUgdG8gdXNlICcnIGFuZCBudWxsIGludGVyY2hhbmdlYWJsZXlcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkgcmVzdWx0ICs9IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgcmVzdWx0ICs9IHNlZ21lbnRzW2krMV07XG4gIH1cbiAgZm9yICgvKiovOyBpPG5Ub3RhbDsgaSsrKSB7XG4gICAgdmFsdWUgPSB2YWx1ZXNbcGFyYW1zW2ldXTtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgcmVzdWx0ICs9IChzZWFyY2ggPyAnJicgOiAnPycpICsgcGFyYW1zW2ldICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgIHNlYXJjaCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuXG4vKipcbiAqIEBuZ2RvYyBvYmplY3RcbiAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiR1cmxNYXRjaGVyRmFjdG9yeVxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogRmFjdG9yeSBmb3Ige0BsaW5rIHVpLnJvdXRlci51dGlsLnR5cGU6VXJsTWF0Y2hlcn0gaW5zdGFuY2VzLiBUaGUgZmFjdG9yeSBpcyBhbHNvIGF2YWlsYWJsZSB0byBwcm92aWRlcnNcbiAqIHVuZGVyIHRoZSBuYW1lIGAkdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlcmAuXG4gKi9cbmZ1bmN0aW9uICRVcmxNYXRjaGVyRmFjdG9yeSgpIHtcblxuICAvKipcbiAgICogQG5nZG9jIGZ1bmN0aW9uXG4gICAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiR1cmxNYXRjaGVyRmFjdG9yeSNjb21waWxlXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnlcbiAgICpcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSB7QGxpbmsgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyfSBmb3IgdGhlIHNwZWNpZmllZCBwYXR0ZXJuLlxuICAgKiAgIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0dGVybiAgVGhlIFVSTCBwYXR0ZXJuLlxuICAgKiBAcmV0dXJucyB7dWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyfSAgVGhlIFVybE1hdGNoZXIuXG4gICAqL1xuICB0aGlzLmNvbXBpbGUgPSBmdW5jdGlvbiAocGF0dGVybikge1xuICAgIHJldHVybiBuZXcgVXJsTWF0Y2hlcihwYXR0ZXJuKTtcbiAgfTtcblxuICAvKipcbiAgICogQG5nZG9jIGZ1bmN0aW9uXG4gICAqIEBuYW1lIHVpLnJvdXRlci51dGlsLiR1cmxNYXRjaGVyRmFjdG9yeSNpc01hdGNoZXJcbiAgICogQG1ldGhvZE9mIHVpLnJvdXRlci51dGlsLiR1cmxNYXRjaGVyRmFjdG9yeVxuICAgKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBzcGVjaWZpZWQgb2JqZWN0IGlzIGEgVXJsTWF0Y2hlciwgb3IgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0ICBUaGUgb2JqZWN0IHRvIHBlcmZvcm0gdGhlIHR5cGUgY2hlY2sgYWdhaW5zdC5cbiAgICogQHJldHVybnMge0Jvb2xlYW59ICBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0IGhhcyB0aGUgZm9sbG93aW5nIGZ1bmN0aW9uczogYGV4ZWNgLCBgZm9ybWF0YCwgYW5kIGBjb25jYXRgLlxuICAgKi9cbiAgdGhpcy5pc01hdGNoZXIgPSBmdW5jdGlvbiAobykge1xuICAgIHJldHVybiBpc09iamVjdChvKSAmJiBpc0Z1bmN0aW9uKG8uZXhlYykgJiYgaXNGdW5jdGlvbihvLmZvcm1hdCkgJiYgaXNGdW5jdGlvbihvLmNvbmNhdCk7XG4gIH07XG4gIFxuICAvKiBObyBuZWVkIHRvIGRvY3VtZW50ICRnZXQsIHNpbmNlIGl0IHJldHVybnMgdGhpcyAqL1xuICB0aGlzLiRnZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG59XG5cbi8vIFJlZ2lzdGVyIGFzIGEgcHJvdmlkZXIgc28gaXQncyBhdmFpbGFibGUgdG8gb3RoZXIgcHJvdmlkZXJzXG5hbmd1bGFyLm1vZHVsZSgndWkucm91dGVyLnV0aWwnKS5wcm92aWRlcignJHVybE1hdGNoZXJGYWN0b3J5JywgJFVybE1hdGNoZXJGYWN0b3J5KTtcblxuLyoqXG4gKiBAbmdkb2Mgb2JqZWN0XG4gKiBAbmFtZSB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJQcm92aWRlclxuICpcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIudXRpbC4kdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlclxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogYCR1cmxSb3V0ZXJQcm92aWRlcmAgaGFzIHRoZSByZXNwb25zaWJpbGl0eSBvZiB3YXRjaGluZyBgJGxvY2F0aW9uYC4gXG4gKiBXaGVuIGAkbG9jYXRpb25gIGNoYW5nZXMgaXQgcnVucyB0aHJvdWdoIGEgbGlzdCBvZiBydWxlcyBvbmUgYnkgb25lIHVudGlsIGEgXG4gKiBtYXRjaCBpcyBmb3VuZC4gYCR1cmxSb3V0ZXJQcm92aWRlcmAgaXMgdXNlZCBiZWhpbmQgdGhlIHNjZW5lcyBhbnl0aW1lIHlvdSBzcGVjaWZ5IFxuICogYSB1cmwgaW4gYSBzdGF0ZSBjb25maWd1cmF0aW9uLiBBbGwgdXJscyBhcmUgY29tcGlsZWQgaW50byBhIFVybE1hdGNoZXIgb2JqZWN0LlxuICpcbiAqIFRoZXJlIGFyZSBzZXZlcmFsIG1ldGhvZHMgb24gYCR1cmxSb3V0ZXJQcm92aWRlcmAgdGhhdCBtYWtlIGl0IHVzZWZ1bCB0byB1c2UgZGlyZWN0bHlcbiAqIGluIHlvdXIgbW9kdWxlIGNvbmZpZy5cbiAqL1xuJFVybFJvdXRlclByb3ZpZGVyLiRpbmplY3QgPSBbJyR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyJ107XG5mdW5jdGlvbiAkVXJsUm91dGVyUHJvdmlkZXIoICAkdXJsTWF0Y2hlckZhY3RvcnkpIHtcbiAgdmFyIHJ1bGVzID0gW10sIFxuICAgICAgb3RoZXJ3aXNlID0gbnVsbDtcblxuICAvLyBSZXR1cm5zIGEgc3RyaW5nIHRoYXQgaXMgYSBwcmVmaXggb2YgYWxsIHN0cmluZ3MgbWF0Y2hpbmcgdGhlIFJlZ0V4cFxuICBmdW5jdGlvbiByZWdFeHBQcmVmaXgocmUpIHtcbiAgICB2YXIgcHJlZml4ID0gL15cXF4oKD86XFxcXFteYS16QS1aMC05XXxbXlxcXFxcXFtcXF1cXF4kKis/LigpfHt9XSspKikvLmV4ZWMocmUuc291cmNlKTtcbiAgICByZXR1cm4gKHByZWZpeCAhPSBudWxsKSA/IHByZWZpeFsxXS5yZXBsYWNlKC9cXFxcKC4pL2csIFwiJDFcIikgOiAnJztcbiAgfVxuXG4gIC8vIEludGVycG9sYXRlcyBtYXRjaGVkIHZhbHVlcyBpbnRvIGEgU3RyaW5nLnJlcGxhY2UoKS1zdHlsZSBwYXR0ZXJuXG4gIGZ1bmN0aW9uIGludGVycG9sYXRlKHBhdHRlcm4sIG1hdGNoKSB7XG4gICAgcmV0dXJuIHBhdHRlcm4ucmVwbGFjZSgvXFwkKFxcJHxcXGR7MSwyfSkvLCBmdW5jdGlvbiAobSwgd2hhdCkge1xuICAgICAgcmV0dXJuIG1hdGNoW3doYXQgPT09ICckJyA/IDAgOiBOdW1iZXIod2hhdCldO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJQcm92aWRlciNydWxlXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJQcm92aWRlclxuICAgKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogRGVmaW5lcyBydWxlcyB0aGF0IGFyZSB1c2VkIGJ5IGAkdXJsUm91dGVyUHJvdmlkZXIgdG8gZmluZCBtYXRjaGVzIGZvclxuICAgKiBzcGVjaWZpYyBVUkxzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiA8cHJlPlxuICAgKiB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsndWkucm91dGVyLnJvdXRlciddKTtcbiAgICpcbiAgICogYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICAqICAgLy8gSGVyZSdzIGFuIGV4YW1wbGUgb2YgaG93IHlvdSBtaWdodCBhbGxvdyBjYXNlIGluc2Vuc2l0aXZlIHVybHNcbiAgICogICAkdXJsUm91dGVyUHJvdmlkZXIucnVsZShmdW5jdGlvbiAoJGluamVjdG9yLCAkbG9jYXRpb24pIHtcbiAgICogICAgIHZhciBwYXRoID0gJGxvY2F0aW9uLnBhdGgoKSxcbiAgICogICAgICAgICBub3JtYWxpemVkID0gcGF0aC50b0xvd2VyQ2FzZSgpO1xuICAgKlxuICAgKiAgICAgaWYgKHBhdGggIT09IG5vcm1hbGl6ZWQpIHtcbiAgICogICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAqICAgICB9XG4gICAqICAgfSk7XG4gICAqIH0pO1xuICAgKiA8L3ByZT5cbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IHJ1bGUgSGFuZGxlciBmdW5jdGlvbiB0aGF0IHRha2VzIGAkaW5qZWN0b3JgIGFuZCBgJGxvY2F0aW9uYFxuICAgKiBzZXJ2aWNlcyBhcyBhcmd1bWVudHMuIFlvdSBjYW4gdXNlIHRoZW0gdG8gcmV0dXJuIGEgdmFsaWQgcGF0aCBhcyBhIHN0cmluZy5cbiAgICpcbiAgICogQHJldHVybiB7b2JqZWN0fSAkdXJsUm91dGVyUHJvdmlkZXIgLSAkdXJsUm91dGVyUHJvdmlkZXIgaW5zdGFuY2VcbiAgICovXG4gIHRoaXMucnVsZSA9XG4gICAgZnVuY3Rpb24gKHJ1bGUpIHtcbiAgICAgIGlmICghaXNGdW5jdGlvbihydWxlKSkgdGhyb3cgbmV3IEVycm9yKFwiJ3J1bGUnIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgIHJ1bGVzLnB1c2gocnVsZSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBAbmdkb2Mgb2JqZWN0XG4gICAqIEBuYW1lIHVpLnJvdXRlci5yb3V0ZXIuJHVybFJvdXRlclByb3ZpZGVyI290aGVyd2lzZVxuICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyUHJvdmlkZXJcbiAgICpcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIERlZmluZXMgYSBwYXRoIHRoYXQgaXMgdXNlZCB3aGVuIGFuIGludmFsaWVkIHJvdXRlIGlzIHJlcXVlc3RlZC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogPHByZT5cbiAgICogdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ3VpLnJvdXRlci5yb3V0ZXInXSk7XG4gICAqXG4gICAqIGFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAgKiAgIC8vIGlmIHRoZSBwYXRoIGRvZXNuJ3QgbWF0Y2ggYW55IG9mIHRoZSB1cmxzIHlvdSBjb25maWd1cmVkXG4gICAqICAgLy8gb3RoZXJ3aXNlIHdpbGwgdGFrZSBjYXJlIG9mIHJvdXRpbmcgdGhlIHVzZXIgdG8gdGhlXG4gICAqICAgLy8gc3BlY2lmaWVkIHVybFxuICAgKiAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9pbmRleCcpO1xuICAgKlxuICAgKiAgIC8vIEV4YW1wbGUgb2YgdXNpbmcgZnVuY3Rpb24gcnVsZSBhcyBwYXJhbVxuICAgKiAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoZnVuY3Rpb24gKCRpbmplY3RvciwgJGxvY2F0aW9uKSB7XG4gICAqICAgICAuLi5cbiAgICogICB9KTtcbiAgICogfSk7XG4gICAqIDwvcHJlPlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IHJ1bGUgVGhlIHVybCBwYXRoIHlvdSB3YW50IHRvIHJlZGlyZWN0IHRvIG9yIGEgZnVuY3Rpb24gXG4gICAqIHJ1bGUgdGhhdCByZXR1cm5zIHRoZSB1cmwgcGF0aC4gVGhlIGZ1bmN0aW9uIHZlcnNpb24gaXMgcGFzc2VkIHR3byBwYXJhbXM6IFxuICAgKiBgJGluamVjdG9yYCBhbmQgYCRsb2NhdGlvbmAgc2VydmljZXMuXG4gICAqXG4gICAqIEByZXR1cm4ge29iamVjdH0gJHVybFJvdXRlclByb3ZpZGVyIC0gJHVybFJvdXRlclByb3ZpZGVyIGluc3RhbmNlXG4gICAqL1xuICB0aGlzLm90aGVyd2lzZSA9XG4gICAgZnVuY3Rpb24gKHJ1bGUpIHtcbiAgICAgIGlmIChpc1N0cmluZyhydWxlKSkge1xuICAgICAgICB2YXIgcmVkaXJlY3QgPSBydWxlO1xuICAgICAgICBydWxlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVkaXJlY3Q7IH07XG4gICAgICB9XG4gICAgICBlbHNlIGlmICghaXNGdW5jdGlvbihydWxlKSkgdGhyb3cgbmV3IEVycm9yKFwiJ3J1bGUnIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgIG90aGVyd2lzZSA9IHJ1bGU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5cbiAgZnVuY3Rpb24gaGFuZGxlSWZNYXRjaCgkaW5qZWN0b3IsIGhhbmRsZXIsIG1hdGNoKSB7XG4gICAgaWYgKCFtYXRjaCkgcmV0dXJuIGZhbHNlO1xuICAgIHZhciByZXN1bHQgPSAkaW5qZWN0b3IuaW52b2tlKGhhbmRsZXIsIGhhbmRsZXIsIHsgJG1hdGNoOiBtYXRjaCB9KTtcbiAgICByZXR1cm4gaXNEZWZpbmVkKHJlc3VsdCkgPyByZXN1bHQgOiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJQcm92aWRlciN3aGVuXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJQcm92aWRlclxuICAgKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogUmVnaXN0ZXJzIGEgaGFuZGxlciBmb3IgYSBnaXZlbiB1cmwgbWF0Y2hpbmcuIGlmIGhhbmRsZSBpcyBhIHN0cmluZywgaXQgaXNcbiAgICogdHJlYXRlZCBhcyBhIHJlZGlyZWN0LCBhbmQgaXMgaW50ZXJwb2xhdGVkIGFjY29yZGluZyB0byB0aGUgc3l5bnRheCBvZiBtYXRjaFxuICAgKiAoaS5lLiBsaWtlIFN0cmluZy5yZXBsYWNlKCkgZm9yIFJlZ0V4cCwgb3IgbGlrZSBhIFVybE1hdGNoZXIgcGF0dGVybiBvdGhlcndpc2UpLlxuICAgKlxuICAgKiBJZiB0aGUgaGFuZGxlciBpcyBhIGZ1bmN0aW9uLCBpdCBpcyBpbmplY3RhYmxlLiBJdCBnZXRzIGludm9rZWQgaWYgYCRsb2NhdGlvbmBcbiAgICogbWF0Y2hlcy4gWW91IGhhdmUgdGhlIG9wdGlvbiBvZiBpbmplY3QgdGhlIG1hdGNoIG9iamVjdCBhcyBgJG1hdGNoYC5cbiAgICpcbiAgICogVGhlIGhhbmRsZXIgY2FuIHJldHVyblxuICAgKlxuICAgKiAtICoqZmFsc3kqKiB0byBpbmRpY2F0ZSB0aGF0IHRoZSBydWxlIGRpZG4ndCBtYXRjaCBhZnRlciBhbGwsIHRoZW4gYCR1cmxSb3V0ZXJgXG4gICAqICAgd2lsbCBjb250aW51ZSB0cnlpbmcgdG8gZmluZCBhbm90aGVyIG9uZSB0aGF0IG1hdGNoZXMuXG4gICAqIC0gKipzdHJpbmcqKiB3aGljaCBpcyB0cmVhdGVkIGFzIGEgcmVkaXJlY3QgYW5kIHBhc3NlZCB0byBgJGxvY2F0aW9uLnVybCgpYFxuICAgKiAtICoqdm9pZCoqIG9yIGFueSAqKnRydXRoeSoqIHZhbHVlIHRlbGxzIGAkdXJsUm91dGVyYCB0aGF0IHRoZSB1cmwgd2FzIGhhbmRsZWQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIDxwcmU+XG4gICAqIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyd1aS5yb3V0ZXIucm91dGVyJ10pO1xuICAgKlxuICAgKiBhcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgICogICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbigkc3RhdGUudXJsLCBmdW5jdGlvbiAoJG1hdGNoLCAkc3RhdGVQYXJhbXMpIHtcbiAgICogICAgIGlmICgkc3RhdGUuJGN1cnJlbnQubmF2aWdhYmxlICE9PSBzdGF0ZSB8fFxuICAgKiAgICAgICAgICFlcXVhbEZvcktleXMoJG1hdGNoLCAkc3RhdGVQYXJhbXMpIHtcbiAgICogICAgICAkc3RhdGUudHJhbnNpdGlvblRvKHN0YXRlLCAkbWF0Y2gsIGZhbHNlKTtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICogfSk7XG4gICAqIDwvcHJlPlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IHdoYXQgVGhlIGluY29taW5nIHBhdGggdGhhdCB5b3Ugd2FudCB0byByZWRpcmVjdC5cbiAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBoYW5kbGVyIFRoZSBwYXRoIHlvdSB3YW50IHRvIHJlZGlyZWN0IHlvdXIgdXNlciB0by5cbiAgICovXG4gIHRoaXMud2hlbiA9XG4gICAgZnVuY3Rpb24gKHdoYXQsIGhhbmRsZXIpIHtcbiAgICAgIHZhciByZWRpcmVjdCwgaGFuZGxlcklzU3RyaW5nID0gaXNTdHJpbmcoaGFuZGxlcik7XG4gICAgICBpZiAoaXNTdHJpbmcod2hhdCkpIHdoYXQgPSAkdXJsTWF0Y2hlckZhY3RvcnkuY29tcGlsZSh3aGF0KTtcblxuICAgICAgaWYgKCFoYW5kbGVySXNTdHJpbmcgJiYgIWlzRnVuY3Rpb24oaGFuZGxlcikgJiYgIWlzQXJyYXkoaGFuZGxlcikpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgJ2hhbmRsZXInIGluIHdoZW4oKVwiKTtcblxuICAgICAgdmFyIHN0cmF0ZWdpZXMgPSB7XG4gICAgICAgIG1hdGNoZXI6IGZ1bmN0aW9uICh3aGF0LCBoYW5kbGVyKSB7XG4gICAgICAgICAgaWYgKGhhbmRsZXJJc1N0cmluZykge1xuICAgICAgICAgICAgcmVkaXJlY3QgPSAkdXJsTWF0Y2hlckZhY3RvcnkuY29tcGlsZShoYW5kbGVyKTtcbiAgICAgICAgICAgIGhhbmRsZXIgPSBbJyRtYXRjaCcsIGZ1bmN0aW9uICgkbWF0Y2gpIHsgcmV0dXJuIHJlZGlyZWN0LmZvcm1hdCgkbWF0Y2gpOyB9XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGV4dGVuZChmdW5jdGlvbiAoJGluamVjdG9yLCAkbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVJZk1hdGNoKCRpbmplY3RvciwgaGFuZGxlciwgd2hhdC5leGVjKCRsb2NhdGlvbi5wYXRoKCksICRsb2NhdGlvbi5zZWFyY2goKSkpO1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIHByZWZpeDogaXNTdHJpbmcod2hhdC5wcmVmaXgpID8gd2hhdC5wcmVmaXggOiAnJ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZWdleDogZnVuY3Rpb24gKHdoYXQsIGhhbmRsZXIpIHtcbiAgICAgICAgICBpZiAod2hhdC5nbG9iYWwgfHwgd2hhdC5zdGlja3kpIHRocm93IG5ldyBFcnJvcihcIndoZW4oKSBSZWdFeHAgbXVzdCBub3QgYmUgZ2xvYmFsIG9yIHN0aWNreVwiKTtcblxuICAgICAgICAgIGlmIChoYW5kbGVySXNTdHJpbmcpIHtcbiAgICAgICAgICAgIHJlZGlyZWN0ID0gaGFuZGxlcjtcbiAgICAgICAgICAgIGhhbmRsZXIgPSBbJyRtYXRjaCcsIGZ1bmN0aW9uICgkbWF0Y2gpIHsgcmV0dXJuIGludGVycG9sYXRlKHJlZGlyZWN0LCAkbWF0Y2gpOyB9XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGV4dGVuZChmdW5jdGlvbiAoJGluamVjdG9yLCAkbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVJZk1hdGNoKCRpbmplY3RvciwgaGFuZGxlciwgd2hhdC5leGVjKCRsb2NhdGlvbi5wYXRoKCkpKTtcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBwcmVmaXg6IHJlZ0V4cFByZWZpeCh3aGF0KVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgY2hlY2sgPSB7IG1hdGNoZXI6ICR1cmxNYXRjaGVyRmFjdG9yeS5pc01hdGNoZXIod2hhdCksIHJlZ2V4OiB3aGF0IGluc3RhbmNlb2YgUmVnRXhwIH07XG5cbiAgICAgIGZvciAodmFyIG4gaW4gY2hlY2spIHtcbiAgICAgICAgaWYgKGNoZWNrW25dKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucnVsZShzdHJhdGVnaWVzW25dKHdoYXQsIGhhbmRsZXIpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkICd3aGF0JyBpbiB3aGVuKClcIik7XG4gICAgfTtcblxuICAvKipcbiAgICogQG5nZG9jIG9iamVjdFxuICAgKiBAbmFtZSB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJcbiAgICpcbiAgICogQHJlcXVpcmVzICRsb2NhdGlvblxuICAgKiBAcmVxdWlyZXMgJHJvb3RTY29wZVxuICAgKiBAcmVxdWlyZXMgJGluamVjdG9yXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKi9cbiAgdGhpcy4kZ2V0ID1cbiAgICBbICAgICAgICAnJGxvY2F0aW9uJywgJyRyb290U2NvcGUnLCAnJGluamVjdG9yJyxcbiAgICBmdW5jdGlvbiAoJGxvY2F0aW9uLCAgICRyb290U2NvcGUsICAgJGluamVjdG9yKSB7XG4gICAgICAvLyBUT0RPOiBPcHRpbWl6ZSBncm91cHMgb2YgcnVsZXMgd2l0aCBub24tZW1wdHkgcHJlZml4IGludG8gc29tZSBzb3J0IG9mIGRlY2lzaW9uIHRyZWVcbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZShldnQpIHtcbiAgICAgICAgaWYgKGV2dCAmJiBldnQuZGVmYXVsdFByZXZlbnRlZCkgcmV0dXJuO1xuICAgICAgICBmdW5jdGlvbiBjaGVjayhydWxlKSB7XG4gICAgICAgICAgdmFyIGhhbmRsZWQgPSBydWxlKCRpbmplY3RvciwgJGxvY2F0aW9uKTtcbiAgICAgICAgICBpZiAoaGFuZGxlZCkge1xuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGhhbmRsZWQpKSAkbG9jYXRpb24ucmVwbGFjZSgpLnVybChoYW5kbGVkKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG49cnVsZXMubGVuZ3RoLCBpO1xuICAgICAgICBmb3IgKGk9MDsgaTxuOyBpKyspIHtcbiAgICAgICAgICBpZiAoY2hlY2socnVsZXNbaV0pKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWx3YXlzIGNoZWNrIG90aGVyd2lzZSBsYXN0IHRvIGFsbG93IGR5bmFtaWMgdXBkYXRlcyB0byB0aGUgc2V0IG9mIHJ1bGVzXG4gICAgICAgIGlmIChvdGhlcndpc2UpIGNoZWNrKG90aGVyd2lzZSk7XG4gICAgICB9XG5cbiAgICAgICRyb290U2NvcGUuJG9uKCckbG9jYXRpb25DaGFuZ2VTdWNjZXNzJywgdXBkYXRlKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgICAgICAgKiBAbmFtZSB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXIjc3luY1xuICAgICAgICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyXG4gICAgICAgICAqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKiBUcmlnZ2VycyBhbiB1cGRhdGU7IHRoZSBzYW1lIHVwZGF0ZSB0aGF0IGhhcHBlbnMgd2hlbiB0aGUgYWRkcmVzcyBiYXIgdXJsIGNoYW5nZXMsIGFrYSBgJGxvY2F0aW9uQ2hhbmdlU3VjY2Vzc2AuXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWZ1bCB3aGVuIHlvdSBuZWVkIHRvIHVzZSBgcHJldmVudERlZmF1bHQoKWAgb24gdGhlIGAkbG9jYXRpb25DaGFuZ2VTdWNjZXNzYCBldmVudCwgXG4gICAgICAgICAqIHBlcmZvcm0gc29tZSBjdXN0b20gbG9naWMgKHJvdXRlIHByb3RlY3Rpb24sIGF1dGgsIGNvbmZpZywgcmVkaXJlY3Rpb24sIGV0YykgYW5kIHRoZW4gZmluYWxseSBwcm9jZWVkIFxuICAgICAgICAgKiB3aXRoIHRoZSB0cmFuc2l0aW9uIGJ5IGNhbGxpbmcgYCR1cmxSb3V0ZXIuc3luYygpYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogPHByZT5cbiAgICAgICAgICogYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsndWkucm91dGVyJ10pO1xuICAgICAgICAgKiAgIC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgJHVybFJvdXRlcikge1xuICAgICAgICAgKiAgICAgJHJvb3RTY29wZS4kb24oJyRsb2NhdGlvbkNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICogICAgICAgLy8gSGFsdCBzdGF0ZSBjaGFuZ2UgZnJvbSBldmVuIHN0YXJ0aW5nXG4gICAgICAgICAqICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgKiAgICAgICAvLyBQZXJmb3JtIGN1c3RvbSBsb2dpY1xuICAgICAgICAgKiAgICAgICB2YXIgbWVldHNSZXF1aXJlbWVudCA9IC4uLlxuICAgICAgICAgKiAgICAgICAvLyBDb250aW51ZSB3aXRoIHRoZSB1cGRhdGUgYW5kIHN0YXRlIHRyYW5zaXRpb24gaWYgbG9naWMgYWxsb3dzXG4gICAgICAgICAqICAgICAgIGlmIChtZWV0c1JlcXVpcmVtZW50KSAkdXJsUm91dGVyLnN5bmMoKTtcbiAgICAgICAgICogICAgIH0pO1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICogPC9wcmU+XG4gICAgICAgICAqL1xuICAgICAgICBzeW5jOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfV07XG59XG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIucm91dGVyJykucHJvdmlkZXIoJyR1cmxSb3V0ZXInLCAkVXJsUm91dGVyUHJvdmlkZXIpO1xuXG4vKipcbiAqIEBuZ2RvYyBvYmplY3RcbiAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVQcm92aWRlclxuICpcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIucm91dGVyLiR1cmxSb3V0ZXJQcm92aWRlclxuICogQHJlcXVpcmVzIHVpLnJvdXRlci51dGlsLiR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyXG4gKiBAcmVxdWlyZXMgJGxvY2F0aW9uUHJvdmlkZXJcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIFRoZSBuZXcgYCRzdGF0ZVByb3ZpZGVyYCB3b3JrcyBzaW1pbGFyIHRvIEFuZ3VsYXIncyB2MSByb3V0ZXIsIGJ1dCBpdCBmb2N1c2VzIHB1cmVseVxuICogb24gc3RhdGUuXG4gKlxuICogQSBzdGF0ZSBjb3JyZXNwb25kcyB0byBhIFwicGxhY2VcIiBpbiB0aGUgYXBwbGljYXRpb24gaW4gdGVybXMgb2YgdGhlIG92ZXJhbGwgVUkgYW5kXG4gKiBuYXZpZ2F0aW9uLiBBIHN0YXRlIGRlc2NyaWJlcyAodmlhIHRoZSBjb250cm9sbGVyIC8gdGVtcGxhdGUgLyB2aWV3IHByb3BlcnRpZXMpIHdoYXRcbiAqIHRoZSBVSSBsb29rcyBsaWtlIGFuZCBkb2VzIGF0IHRoYXQgcGxhY2UuXG4gKlxuICogU3RhdGVzIG9mdGVuIGhhdmUgdGhpbmdzIGluIGNvbW1vbiwgYW5kIHRoZSBwcmltYXJ5IHdheSBvZiBmYWN0b3Jpbmcgb3V0IHRoZXNlXG4gKiBjb21tb25hbGl0aWVzIGluIHRoaXMgbW9kZWwgaXMgdmlhIHRoZSBzdGF0ZSBoaWVyYXJjaHksIGkuZS4gcGFyZW50L2NoaWxkIHN0YXRlcyBha2FcbiAqIG5lc3RlZCBzdGF0ZXMuXG4gKlxuICogVGhlIGAkc3RhdGVQcm92aWRlcmAgcHJvdmlkZXMgaW50ZXJmYWNlcyB0byBkZWNsYXJlIHRoZXNlIHN0YXRlcyBmb3IgeW91ciBhcHAuXG4gKi9cbiRTdGF0ZVByb3ZpZGVyLiRpbmplY3QgPSBbJyR1cmxSb3V0ZXJQcm92aWRlcicsICckdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlcicsICckbG9jYXRpb25Qcm92aWRlciddO1xuZnVuY3Rpb24gJFN0YXRlUHJvdmlkZXIoICAgJHVybFJvdXRlclByb3ZpZGVyLCAgICR1cmxNYXRjaGVyRmFjdG9yeSwgICAgICAgICAgICRsb2NhdGlvblByb3ZpZGVyKSB7XG5cbiAgdmFyIHJvb3QsIHN0YXRlcyA9IHt9LCAkc3RhdGUsIHF1ZXVlID0ge30sIGFic3RyYWN0S2V5ID0gJ2Fic3RyYWN0JztcblxuICAvLyBCdWlsZHMgc3RhdGUgcHJvcGVydGllcyBmcm9tIGRlZmluaXRpb24gcGFzc2VkIHRvIHJlZ2lzdGVyU3RhdGUoKVxuICB2YXIgc3RhdGVCdWlsZGVyID0ge1xuXG4gICAgLy8gRGVyaXZlIHBhcmVudCBzdGF0ZSBmcm9tIGEgaGllcmFyY2hpY2FsIG5hbWUgb25seSBpZiAncGFyZW50JyBpcyBub3QgZXhwbGljaXRseSBkZWZpbmVkLlxuICAgIC8vIHN0YXRlLmNoaWxkcmVuID0gW107XG4gICAgLy8gaWYgKHBhcmVudCkgcGFyZW50LmNoaWxkcmVuLnB1c2goc3RhdGUpO1xuICAgIHBhcmVudDogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgIGlmIChpc0RlZmluZWQoc3RhdGUucGFyZW50KSAmJiBzdGF0ZS5wYXJlbnQpIHJldHVybiBmaW5kU3RhdGUoc3RhdGUucGFyZW50KTtcbiAgICAgIC8vIHJlZ2V4IG1hdGNoZXMgYW55IHZhbGlkIGNvbXBvc2l0ZSBzdGF0ZSBuYW1lXG4gICAgICAvLyB3b3VsZCBtYXRjaCBcImNvbnRhY3QubGlzdFwiIGJ1dCBub3QgXCJjb250YWN0c1wiXG4gICAgICB2YXIgY29tcG9zaXRlTmFtZSA9IC9eKC4rKVxcLlteLl0rJC8uZXhlYyhzdGF0ZS5uYW1lKTtcbiAgICAgIHJldHVybiBjb21wb3NpdGVOYW1lID8gZmluZFN0YXRlKGNvbXBvc2l0ZU5hbWVbMV0pIDogcm9vdDtcbiAgICB9LFxuXG4gICAgLy8gaW5oZXJpdCAnZGF0YScgZnJvbSBwYXJlbnQgYW5kIG92ZXJyaWRlIGJ5IG93biB2YWx1ZXMgKGlmIGFueSlcbiAgICBkYXRhOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgaWYgKHN0YXRlLnBhcmVudCAmJiBzdGF0ZS5wYXJlbnQuZGF0YSkge1xuICAgICAgICBzdGF0ZS5kYXRhID0gc3RhdGUuc2VsZi5kYXRhID0gZXh0ZW5kKHt9LCBzdGF0ZS5wYXJlbnQuZGF0YSwgc3RhdGUuZGF0YSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RhdGUuZGF0YTtcbiAgICB9LFxuXG4gICAgLy8gQnVpbGQgYSBVUkxNYXRjaGVyIGlmIG5lY2Vzc2FyeSwgZWl0aGVyIHZpYSBhIHJlbGF0aXZlIG9yIGFic29sdXRlIFVSTFxuICAgIHVybDogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgIHZhciB1cmwgPSBzdGF0ZS51cmw7XG5cbiAgICAgIGlmIChpc1N0cmluZyh1cmwpKSB7XG4gICAgICAgIGlmICh1cmwuY2hhckF0KDApID09ICdeJykge1xuICAgICAgICAgIHJldHVybiAkdXJsTWF0Y2hlckZhY3RvcnkuY29tcGlsZSh1cmwuc3Vic3RyaW5nKDEpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHN0YXRlLnBhcmVudC5uYXZpZ2FibGUgfHwgcm9vdCkudXJsLmNvbmNhdCh1cmwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoJHVybE1hdGNoZXJGYWN0b3J5LmlzTWF0Y2hlcih1cmwpIHx8IHVybCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHVybCAnXCIgKyB1cmwgKyBcIicgaW4gc3RhdGUgJ1wiICsgc3RhdGUgKyBcIidcIik7XG4gICAgfSxcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGNsb3Nlc3QgYW5jZXN0b3Igc3RhdGUgdGhhdCBoYXMgYSBVUkwgKGkuZS4gaXMgbmF2aWdhYmxlKVxuICAgIG5hdmlnYWJsZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZS51cmwgPyBzdGF0ZSA6IChzdGF0ZS5wYXJlbnQgPyBzdGF0ZS5wYXJlbnQubmF2aWdhYmxlIDogbnVsbCk7XG4gICAgfSxcblxuICAgIC8vIERlcml2ZSBwYXJhbWV0ZXJzIGZvciB0aGlzIHN0YXRlIGFuZCBlbnN1cmUgdGhleSdyZSBhIHN1cGVyLXNldCBvZiBwYXJlbnQncyBwYXJhbWV0ZXJzXG4gICAgcGFyYW1zOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgaWYgKCFzdGF0ZS5wYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnVybCA/IHN0YXRlLnVybC5wYXJhbWV0ZXJzKCkgOiBzdGF0ZS5wYXJlbnQucGFyYW1zO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0FycmF5KHN0YXRlLnBhcmFtcykpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcGFyYW1zIGluIHN0YXRlICdcIiArIHN0YXRlICsgXCInXCIpO1xuICAgICAgaWYgKHN0YXRlLnVybCkgdGhyb3cgbmV3IEVycm9yKFwiQm90aCBwYXJhbXMgYW5kIHVybCBzcGVjaWNpZmllZCBpbiBzdGF0ZSAnXCIgKyBzdGF0ZSArIFwiJ1wiKTtcbiAgICAgIHJldHVybiBzdGF0ZS5wYXJhbXM7XG4gICAgfSxcblxuICAgIC8vIElmIHRoZXJlIGlzIG5vIGV4cGxpY2l0IG11bHRpLXZpZXcgY29uZmlndXJhdGlvbiwgbWFrZSBvbmUgdXAgc28gd2UgZG9uJ3QgaGF2ZVxuICAgIC8vIHRvIGhhbmRsZSBib3RoIGNhc2VzIGluIHRoZSB2aWV3IGRpcmVjdGl2ZSBsYXRlci4gTm90ZSB0aGF0IGhhdmluZyBhbiBleHBsaWNpdFxuICAgIC8vICd2aWV3cycgcHJvcGVydHkgd2lsbCBtZWFuIHRoZSBkZWZhdWx0IHVubmFtZWQgdmlldyBwcm9wZXJ0aWVzIGFyZSBpZ25vcmVkLiBUaGlzXG4gICAgLy8gaXMgYWxzbyBhIGdvb2QgdGltZSB0byByZXNvbHZlIHZpZXcgbmFtZXMgdG8gYWJzb2x1dGUgbmFtZXMsIHNvIGV2ZXJ5dGhpbmcgaXMgYVxuICAgIC8vIHN0cmFpZ2h0IGxvb2t1cCBhdCBsaW5rIHRpbWUuXG4gICAgdmlld3M6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICB2YXIgdmlld3MgPSB7fTtcblxuICAgICAgZm9yRWFjaChpc0RlZmluZWQoc3RhdGUudmlld3MpID8gc3RhdGUudmlld3MgOiB7ICcnOiBzdGF0ZSB9LCBmdW5jdGlvbiAodmlldywgbmFtZSkge1xuICAgICAgICBpZiAobmFtZS5pbmRleE9mKCdAJykgPCAwKSBuYW1lICs9ICdAJyArIHN0YXRlLnBhcmVudC5uYW1lO1xuICAgICAgICB2aWV3c1tuYW1lXSA9IHZpZXc7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB2aWV3cztcbiAgICB9LFxuXG4gICAgb3duUGFyYW1zOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgaWYgKCFzdGF0ZS5wYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnBhcmFtcztcbiAgICAgIH1cbiAgICAgIHZhciBwYXJhbU5hbWVzID0ge307IGZvckVhY2goc3RhdGUucGFyYW1zLCBmdW5jdGlvbiAocCkgeyBwYXJhbU5hbWVzW3BdID0gdHJ1ZTsgfSk7XG5cbiAgICAgIGZvckVhY2goc3RhdGUucGFyZW50LnBhcmFtcywgZnVuY3Rpb24gKHApIHtcbiAgICAgICAgaWYgKCFwYXJhbU5hbWVzW3BdKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyByZXF1aXJlZCBwYXJhbWV0ZXIgJ1wiICsgcCArIFwiJyBpbiBzdGF0ZSAnXCIgKyBzdGF0ZS5uYW1lICsgXCInXCIpO1xuICAgICAgICB9XG4gICAgICAgIHBhcmFtTmFtZXNbcF0gPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgICAgdmFyIG93blBhcmFtcyA9IFtdO1xuXG4gICAgICBmb3JFYWNoKHBhcmFtTmFtZXMsIGZ1bmN0aW9uIChvd24sIHApIHtcbiAgICAgICAgaWYgKG93bikgb3duUGFyYW1zLnB1c2gocCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBvd25QYXJhbXM7XG4gICAgfSxcblxuICAgIC8vIEtlZXAgYSBmdWxsIHBhdGggZnJvbSB0aGUgcm9vdCBkb3duIHRvIHRoaXMgc3RhdGUgYXMgdGhpcyBpcyBuZWVkZWQgZm9yIHN0YXRlIGFjdGl2YXRpb24uXG4gICAgcGF0aDogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5wYXJlbnQgPyBzdGF0ZS5wYXJlbnQucGF0aC5jb25jYXQoc3RhdGUpIDogW107IC8vIGV4Y2x1ZGUgcm9vdCBmcm9tIHBhdGhcbiAgICB9LFxuXG4gICAgLy8gU3BlZWQgdXAgJHN0YXRlLmNvbnRhaW5zKCkgYXMgaXQncyB1c2VkIGEgbG90XG4gICAgaW5jbHVkZXM6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICB2YXIgaW5jbHVkZXMgPSBzdGF0ZS5wYXJlbnQgPyBleHRlbmQoe30sIHN0YXRlLnBhcmVudC5pbmNsdWRlcykgOiB7fTtcbiAgICAgIGluY2x1ZGVzW3N0YXRlLm5hbWVdID0gdHJ1ZTtcbiAgICAgIHJldHVybiBpbmNsdWRlcztcbiAgICB9LFxuXG4gICAgJGRlbGVnYXRlczoge31cbiAgfTtcblxuICBmdW5jdGlvbiBpc1JlbGF0aXZlKHN0YXRlTmFtZSkge1xuICAgIHJldHVybiBzdGF0ZU5hbWUuaW5kZXhPZihcIi5cIikgPT09IDAgfHwgc3RhdGVOYW1lLmluZGV4T2YoXCJeXCIpID09PSAwO1xuICB9XG5cbiAgZnVuY3Rpb24gZmluZFN0YXRlKHN0YXRlT3JOYW1lLCBiYXNlKSB7XG4gICAgdmFyIGlzU3RyID0gaXNTdHJpbmcoc3RhdGVPck5hbWUpLFxuICAgICAgICBuYW1lICA9IGlzU3RyID8gc3RhdGVPck5hbWUgOiBzdGF0ZU9yTmFtZS5uYW1lLFxuICAgICAgICBwYXRoICA9IGlzUmVsYXRpdmUobmFtZSk7XG5cbiAgICBpZiAocGF0aCkge1xuICAgICAgaWYgKCFiYXNlKSB0aHJvdyBuZXcgRXJyb3IoXCJObyByZWZlcmVuY2UgcG9pbnQgZ2l2ZW4gZm9yIHBhdGggJ1wiICArIG5hbWUgKyBcIidcIik7XG4gICAgICB2YXIgcmVsID0gbmFtZS5zcGxpdChcIi5cIiksIGkgPSAwLCBwYXRoTGVuZ3RoID0gcmVsLmxlbmd0aCwgY3VycmVudCA9IGJhc2U7XG5cbiAgICAgIGZvciAoOyBpIDwgcGF0aExlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyZWxbaV0gPT09IFwiXCIgJiYgaSA9PT0gMCkge1xuICAgICAgICAgIGN1cnJlbnQgPSBiYXNlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWxbaV0gPT09IFwiXlwiKSB7XG4gICAgICAgICAgaWYgKCFjdXJyZW50LnBhcmVudCkgdGhyb3cgbmV3IEVycm9yKFwiUGF0aCAnXCIgKyBuYW1lICsgXCInIG5vdCB2YWxpZCBmb3Igc3RhdGUgJ1wiICsgYmFzZS5uYW1lICsgXCInXCIpO1xuICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudDtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHJlbCA9IHJlbC5zbGljZShpKS5qb2luKFwiLlwiKTtcbiAgICAgIG5hbWUgPSBjdXJyZW50Lm5hbWUgKyAoY3VycmVudC5uYW1lICYmIHJlbCA/IFwiLlwiIDogXCJcIikgKyByZWw7XG4gICAgfVxuICAgIHZhciBzdGF0ZSA9IHN0YXRlc1tuYW1lXTtcblxuICAgIGlmIChzdGF0ZSAmJiAoaXNTdHIgfHwgKCFpc1N0ciAmJiAoc3RhdGUgPT09IHN0YXRlT3JOYW1lIHx8IHN0YXRlLnNlbGYgPT09IHN0YXRlT3JOYW1lKSkpKSB7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBxdWV1ZVN0YXRlKHBhcmVudE5hbWUsIHN0YXRlKSB7XG4gICAgaWYgKCFxdWV1ZVtwYXJlbnROYW1lXSkge1xuICAgICAgcXVldWVbcGFyZW50TmFtZV0gPSBbXTtcbiAgICB9XG4gICAgcXVldWVbcGFyZW50TmFtZV0ucHVzaChzdGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWdpc3RlclN0YXRlKHN0YXRlKSB7XG4gICAgLy8gV3JhcCBhIG5ldyBvYmplY3QgYXJvdW5kIHRoZSBzdGF0ZSBzbyB3ZSBjYW4gc3RvcmUgb3VyIHByaXZhdGUgZGV0YWlscyBlYXNpbHkuXG4gICAgc3RhdGUgPSBpbmhlcml0KHN0YXRlLCB7XG4gICAgICBzZWxmOiBzdGF0ZSxcbiAgICAgIHJlc29sdmU6IHN0YXRlLnJlc29sdmUgfHwge30sXG4gICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLm5hbWU7IH1cbiAgICB9KTtcblxuICAgIHZhciBuYW1lID0gc3RhdGUubmFtZTtcbiAgICBpZiAoIWlzU3RyaW5nKG5hbWUpIHx8IG5hbWUuaW5kZXhPZignQCcpID49IDApIHRocm93IG5ldyBFcnJvcihcIlN0YXRlIG11c3QgaGF2ZSBhIHZhbGlkIG5hbWVcIik7XG4gICAgaWYgKHN0YXRlcy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkgdGhyb3cgbmV3IEVycm9yKFwiU3RhdGUgJ1wiICsgbmFtZSArIFwiJycgaXMgYWxyZWFkeSBkZWZpbmVkXCIpO1xuXG4gICAgLy8gR2V0IHBhcmVudCBuYW1lXG4gICAgdmFyIHBhcmVudE5hbWUgPSAobmFtZS5pbmRleE9mKCcuJykgIT09IC0xKSA/IG5hbWUuc3Vic3RyaW5nKDAsIG5hbWUubGFzdEluZGV4T2YoJy4nKSlcbiAgICAgICAgOiAoaXNTdHJpbmcoc3RhdGUucGFyZW50KSkgPyBzdGF0ZS5wYXJlbnRcbiAgICAgICAgOiAnJztcblxuICAgIC8vIElmIHBhcmVudCBpcyBub3QgcmVnaXN0ZXJlZCB5ZXQsIGFkZCBzdGF0ZSB0byBxdWV1ZSBhbmQgcmVnaXN0ZXIgbGF0ZXJcbiAgICBpZiAocGFyZW50TmFtZSAmJiAhc3RhdGVzW3BhcmVudE5hbWVdKSB7XG4gICAgICByZXR1cm4gcXVldWVTdGF0ZShwYXJlbnROYW1lLCBzdGF0ZS5zZWxmKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGVCdWlsZGVyKSB7XG4gICAgICBpZiAoaXNGdW5jdGlvbihzdGF0ZUJ1aWxkZXJba2V5XSkpIHN0YXRlW2tleV0gPSBzdGF0ZUJ1aWxkZXJba2V5XShzdGF0ZSwgc3RhdGVCdWlsZGVyLiRkZWxlZ2F0ZXNba2V5XSk7XG4gICAgfVxuICAgIHN0YXRlc1tuYW1lXSA9IHN0YXRlO1xuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIHN0YXRlIGluIHRoZSBnbG9iYWwgc3RhdGUgbGlzdCBhbmQgd2l0aCAkdXJsUm91dGVyIGlmIG5lY2Vzc2FyeS5cbiAgICBpZiAoIXN0YXRlW2Fic3RyYWN0S2V5XSAmJiBzdGF0ZS51cmwpIHtcbiAgICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKHN0YXRlLnVybCwgWyckbWF0Y2gnLCAnJHN0YXRlUGFyYW1zJywgZnVuY3Rpb24gKCRtYXRjaCwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIGlmICgkc3RhdGUuJGN1cnJlbnQubmF2aWdhYmxlICE9IHN0YXRlIHx8ICFlcXVhbEZvcktleXMoJG1hdGNoLCAkc3RhdGVQYXJhbXMpKSB7XG4gICAgICAgICAgJHN0YXRlLnRyYW5zaXRpb25UbyhzdGF0ZSwgJG1hdGNoLCB7IGxvY2F0aW9uOiBmYWxzZSB9KTtcbiAgICAgICAgfVxuICAgICAgfV0pO1xuICAgIH1cblxuICAgIC8vIFJlZ2lzdGVyIGFueSBxdWV1ZWQgY2hpbGRyZW5cbiAgICBpZiAocXVldWVbbmFtZV0pIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWVbbmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVnaXN0ZXJTdGF0ZShxdWV1ZVtuYW1lXVtpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgLy8gQ2hlY2tzIHRleHQgdG8gc2VlIGlmIGl0IGxvb2tzIGxpa2UgYSBnbG9iLlxuICBmdW5jdGlvbiBpc0dsb2IgKHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5pbmRleE9mKCcqJykgPiAtMTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdHJ1ZSBpZiBnbG9iIG1hdGNoZXMgY3VycmVudCAkc3RhdGUgbmFtZS5cbiAgZnVuY3Rpb24gZG9lc1N0YXRlTWF0Y2hHbG9iIChnbG9iKSB7XG4gICAgdmFyIGdsb2JTZWdtZW50cyA9IGdsb2Iuc3BsaXQoJy4nKSxcbiAgICAgICAgc2VnbWVudHMgPSAkc3RhdGUuJGN1cnJlbnQubmFtZS5zcGxpdCgnLicpO1xuXG4gICAgLy9tYXRjaCBncmVlZHkgc3RhcnRzXG4gICAgaWYgKGdsb2JTZWdtZW50c1swXSA9PT0gJyoqJykge1xuICAgICAgIHNlZ21lbnRzID0gc2VnbWVudHMuc2xpY2Uoc2VnbWVudHMuaW5kZXhPZihnbG9iU2VnbWVudHNbMV0pKTtcbiAgICAgICBzZWdtZW50cy51bnNoaWZ0KCcqKicpO1xuICAgIH1cbiAgICAvL21hdGNoIGdyZWVkeSBlbmRzXG4gICAgaWYgKGdsb2JTZWdtZW50c1tnbG9iU2VnbWVudHMubGVuZ3RoIC0gMV0gPT09ICcqKicpIHtcbiAgICAgICBzZWdtZW50cy5zcGxpY2Uoc2VnbWVudHMuaW5kZXhPZihnbG9iU2VnbWVudHNbZ2xvYlNlZ21lbnRzLmxlbmd0aCAtIDJdKSArIDEsIE51bWJlci5NQVhfVkFMVUUpO1xuICAgICAgIHNlZ21lbnRzLnB1c2goJyoqJyk7XG4gICAgfVxuXG4gICAgaWYgKGdsb2JTZWdtZW50cy5sZW5ndGggIT0gc2VnbWVudHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy9tYXRjaCBzaW5nbGUgc3RhcnNcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGdsb2JTZWdtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChnbG9iU2VnbWVudHNbaV0gPT09ICcqJykge1xuICAgICAgICBzZWdtZW50c1tpXSA9ICcqJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VnbWVudHMuam9pbignJykgPT09IGdsb2JTZWdtZW50cy5qb2luKCcnKTtcbiAgfVxuXG5cbiAgLy8gSW1wbGljaXQgcm9vdCBzdGF0ZSB0aGF0IGlzIGFsd2F5cyBhY3RpdmVcbiAgcm9vdCA9IHJlZ2lzdGVyU3RhdGUoe1xuICAgIG5hbWU6ICcnLFxuICAgIHVybDogJ14nLFxuICAgIHZpZXdzOiBudWxsLFxuICAgICdhYnN0cmFjdCc6IHRydWVcbiAgfSk7XG4gIHJvb3QubmF2aWdhYmxlID0gbnVsbDtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgZnVuY3Rpb25cbiAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVByb3ZpZGVyI2RlY29yYXRvclxuICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVByb3ZpZGVyXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBBbGxvd3MgeW91IHRvIGV4dGVuZCAoY2FyZWZ1bGx5KSBvciBvdmVycmlkZSAoYXQgeW91ciBvd24gcGVyaWwpIHRoZSBcbiAgICogYHN0YXRlQnVpbGRlcmAgb2JqZWN0IHVzZWQgaW50ZXJuYWxseSBieSBgJHN0YXRlUHJvdmlkZXJgLiBUaGlzIGNhbiBiZSB1c2VkIFxuICAgKiB0byBhZGQgY3VzdG9tIGZ1bmN0aW9uYWxpdHkgdG8gdWktcm91dGVyLCBmb3IgZXhhbXBsZSBpbmZlcnJpbmcgdGVtcGxhdGVVcmwgXG4gICAqIGJhc2VkIG9uIHRoZSBzdGF0ZSBuYW1lLlxuICAgKlxuICAgKiBXaGVuIHBhc3Npbmcgb25seSBhIG5hbWUsIGl0IHJldHVybnMgdGhlIGN1cnJlbnQgKG9yaWdpbmFsIG9yIGRlY29yYXRlZCkgYnVpbGRlclxuICAgKiBmdW5jdGlvbiB0aGF0IG1hdGNoZXMgYG5hbWVgLlxuICAgKlxuICAgKiBUaGUgYnVpbGRlciBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgZGVjb3JhdGVkIGFyZSBsaXN0ZWQgYmVsb3cuIFRob3VnaCBub3QgYWxsXG4gICAqIG5lY2Vzc2FyaWx5IGhhdmUgYSBnb29kIHVzZSBjYXNlIGZvciBkZWNvcmF0aW9uLCB0aGF0IGlzIHVwIHRvIHlvdSB0byBkZWNpZGUuXG4gICAqXG4gICAqIEluIGFkZGl0aW9uLCB1c2VycyBjYW4gYXR0YWNoIGN1c3RvbSBkZWNvcmF0b3JzLCB3aGljaCB3aWxsIGdlbmVyYXRlIG5ldyBcbiAgICogcHJvcGVydGllcyB3aXRoaW4gdGhlIHN0YXRlJ3MgaW50ZXJuYWwgZGVmaW5pdGlvbi4gVGhlcmUgaXMgY3VycmVudGx5IG5vIGNsZWFyIFxuICAgKiB1c2UtY2FzZSBmb3IgdGhpcyBiZXlvbmQgYWNjZXNzaW5nIGludGVybmFsIHN0YXRlcyAoaS5lLiAkc3RhdGUuJGN1cnJlbnQpLCBcbiAgICogaG93ZXZlciwgZXhwZWN0IHRoaXMgdG8gYmVjb21lIGluY3JlYXNpbmdseSByZWxldmFudCBhcyB3ZSBpbnRyb2R1Y2UgYWRkaXRpb25hbCBcbiAgICogbWV0YS1wcm9ncmFtbWluZyBmZWF0dXJlcy5cbiAgICpcbiAgICogKipXYXJuaW5nKio6IERlY29yYXRvcnMgc2hvdWxkIG5vdCBiZSBpbnRlcmRlcGVuZGVudCBiZWNhdXNlIHRoZSBvcmRlciBvZiBcbiAgICogZXhlY3V0aW9uIG9mIHRoZSBidWlsZGVyIGZ1bmN0aW9ucyBpbiBub24tZGV0ZXJtaW5pc3RpYy4gQnVpbGRlciBmdW5jdGlvbnMgXG4gICAqIHNob3VsZCBvbmx5IGJlIGRlcGVuZGVudCBvbiB0aGUgc3RhdGUgZGVmaW5pdGlvbiBvYmplY3QgYW5kIHN1cGVyIGZ1bmN0aW9uLlxuICAgKlxuICAgKlxuICAgKiBFeGlzdGluZyBidWlsZGVyIGZ1bmN0aW9ucyBhbmQgY3VycmVudCByZXR1cm4gdmFsdWVzOlxuICAgKlxuICAgKiAtICoqcGFyZW50KiogYHtvYmplY3R9YCAtIHJldHVybnMgdGhlIHBhcmVudCBzdGF0ZSBvYmplY3QuXG4gICAqIC0gKipkYXRhKiogYHtvYmplY3R9YCAtIHJldHVybnMgc3RhdGUgZGF0YSwgaW5jbHVkaW5nIGFueSBpbmhlcml0ZWQgZGF0YSB0aGF0IGlzIG5vdFxuICAgKiAgIG92ZXJyaWRkZW4gYnkgb3duIHZhbHVlcyAoaWYgYW55KS5cbiAgICogLSAqKnVybCoqIGB7b2JqZWN0fWAgLSByZXR1cm5zIGEge2xpbmsgdWkucm91dGVyLnV0aWwudHlwZTpVcmxNYXRjaGVyfSBvciBudWxsLlxuICAgKiAtICoqbmF2aWdhYmxlKiogYHtvYmplY3R9YCAtIHJldHVybnMgY2xvc2VzdCBhbmNlc3RvciBzdGF0ZSB0aGF0IGhhcyBhIFVSTCAoYWthIGlzIFxuICAgKiAgIG5hdmlnYWJsZSkuXG4gICAqIC0gKipwYXJhbXMqKiBge29iamVjdH1gIC0gcmV0dXJucyBhbiBhcnJheSBvZiBzdGF0ZSBwYXJhbXMgdGhhdCBhcmUgZW5zdXJlZCB0byBcbiAgICogICBiZSBhIHN1cGVyLXNldCBvZiBwYXJlbnQncyBwYXJhbXMuXG4gICAqIC0gKip2aWV3cyoqIGB7b2JqZWN0fWAgLSByZXR1cm5zIGEgdmlld3Mgb2JqZWN0IHdoZXJlIGVhY2gga2V5IGlzIGFuIGFic29sdXRlIHZpZXcgXG4gICAqICAgbmFtZSAoaS5lLiBcInZpZXdOYW1lQHN0YXRlTmFtZVwiKSBhbmQgZWFjaCB2YWx1ZSBpcyB0aGUgY29uZmlnIG9iamVjdCBcbiAgICogICAodGVtcGxhdGUsIGNvbnRyb2xsZXIpIGZvciB0aGUgdmlldy4gRXZlbiB3aGVuIHlvdSBkb24ndCB1c2UgdGhlIHZpZXdzIG9iamVjdCBcbiAgICogICBleHBsaWNpdGx5IG9uIGEgc3RhdGUgY29uZmlnLCBvbmUgaXMgc3RpbGwgY3JlYXRlZCBmb3IgeW91IGludGVybmFsbHkuXG4gICAqICAgU28gYnkgZGVjb3JhdGluZyB0aGlzIGJ1aWxkZXIgZnVuY3Rpb24geW91IGhhdmUgYWNjZXNzIHRvIGRlY29yYXRpbmcgdGVtcGxhdGUgXG4gICAqICAgYW5kIGNvbnRyb2xsZXIgcHJvcGVydGllcy5cbiAgICogLSAqKm93blBhcmFtcyoqIGB7b2JqZWN0fWAgLSByZXR1cm5zIGFuIGFycmF5IG9mIHBhcmFtcyB0aGF0IGJlbG9uZyB0byB0aGUgc3RhdGUsIFxuICAgKiAgIG5vdCBpbmNsdWRpbmcgYW55IHBhcmFtcyBkZWZpbmVkIGJ5IGFuY2VzdG9yIHN0YXRlcy5cbiAgICogLSAqKnBhdGgqKiBge3N0cmluZ31gIC0gcmV0dXJucyB0aGUgZnVsbCBwYXRoIGZyb20gdGhlIHJvb3QgZG93biB0byB0aGlzIHN0YXRlLiBcbiAgICogICBOZWVkZWQgZm9yIHN0YXRlIGFjdGl2YXRpb24uXG4gICAqIC0gKippbmNsdWRlcyoqIGB7b2JqZWN0fWAgLSByZXR1cm5zIGFuIG9iamVjdCB0aGF0IGluY2x1ZGVzIGV2ZXJ5IHN0YXRlIHRoYXQgXG4gICAqICAgd291bGQgcGFzcyBhICckc3RhdGUuaW5jbHVkZXMoKScgdGVzdC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogPHByZT5cbiAgICogLy8gT3ZlcnJpZGUgdGhlIGludGVybmFsICd2aWV3cycgYnVpbGRlciB3aXRoIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0aGUgc3RhdGVcbiAgICogLy8gZGVmaW5pdGlvbiwgYW5kIGEgcmVmZXJlbmNlIHRvIHRoZSBpbnRlcm5hbCBmdW5jdGlvbiBiZWluZyBvdmVycmlkZGVuOlxuICAgKiAkc3RhdGVQcm92aWRlci5kZWNvcmF0b3IoJ3ZpZXdzJywgZnVuY3Rpb24gKCRzdGF0ZSwgcGFyZW50KSB7XG4gICAqICAgdmFyIHJlc3VsdCA9IHt9LFxuICAgKiAgICAgICB2aWV3cyA9IHBhcmVudChzdGF0ZSk7XG4gICAqXG4gICAqICAgYW5ndWxhci5mb3JFYWNoKHZpZXcsIGZ1bmN0aW9uIChjb25maWcsIG5hbWUpIHtcbiAgICogICAgIHZhciBhdXRvTmFtZSA9IChzdGF0ZS5uYW1lICsgJy4nICsgbmFtZSkucmVwbGFjZSgnLicsICcvJyk7XG4gICAqICAgICBjb25maWcudGVtcGxhdGVVcmwgPSBjb25maWcudGVtcGxhdGVVcmwgfHwgJy9wYXJ0aWFscy8nICsgYXV0b05hbWUgKyAnLmh0bWwnO1xuICAgKiAgICAgcmVzdWx0W25hbWVdID0gY29uZmlnO1xuICAgKiAgIH0pO1xuICAgKiAgIHJldHVybiByZXN1bHQ7XG4gICAqIH0pO1xuICAgKlxuICAgKiAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICogICB2aWV3czoge1xuICAgKiAgICAgJ2NvbnRhY3QubGlzdCc6IHsgY29udHJvbGxlcjogJ0xpc3RDb250cm9sbGVyJyB9LFxuICAgKiAgICAgJ2NvbnRhY3QuaXRlbSc6IHsgY29udHJvbGxlcjogJ0l0ZW1Db250cm9sbGVyJyB9XG4gICAqICAgfVxuICAgKiB9KTtcbiAgICpcbiAgICogLy8gLi4uXG4gICAqXG4gICAqICRzdGF0ZS5nbygnaG9tZScpO1xuICAgKiAvLyBBdXRvLXBvcHVsYXRlcyBsaXN0IGFuZCBpdGVtIHZpZXdzIHdpdGggL3BhcnRpYWxzL2hvbWUvY29udGFjdC9saXN0Lmh0bWwsXG4gICAqIC8vIGFuZCAvcGFydGlhbHMvaG9tZS9jb250YWN0L2l0ZW0uaHRtbCwgcmVzcGVjdGl2ZWx5LlxuICAgKiA8L3ByZT5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGJ1aWxkZXIgZnVuY3Rpb24gdG8gZGVjb3JhdGUuIFxuICAgKiBAcGFyYW0ge29iamVjdH0gZnVuYyBBIGZ1bmN0aW9uIHRoYXQgaXMgcmVzcG9uc2libGUgZm9yIGRlY29yYXRpbmcgdGhlIG9yaWdpbmFsIFxuICAgKiBidWlsZGVyIGZ1bmN0aW9uLiBUaGUgZnVuY3Rpb24gcmVjZWl2ZXMgdHdvIHBhcmFtZXRlcnM6XG4gICAqXG4gICAqICAgLSBge29iamVjdH1gIC0gc3RhdGUgLSBUaGUgc3RhdGUgY29uZmlnIG9iamVjdC5cbiAgICogICAtIGB7b2JqZWN0fWAgLSBzdXBlciAtIFRoZSBvcmlnaW5hbCBidWlsZGVyIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtvYmplY3R9ICRzdGF0ZVByb3ZpZGVyIC0gJHN0YXRlUHJvdmlkZXIgaW5zdGFuY2VcbiAgICovXG4gIHRoaXMuZGVjb3JhdG9yID0gZGVjb3JhdG9yO1xuICBmdW5jdGlvbiBkZWNvcmF0b3IobmFtZSwgZnVuYykge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczogdHJ1ZSAqL1xuICAgIGlmIChpc1N0cmluZyhuYW1lKSAmJiAhaXNEZWZpbmVkKGZ1bmMpKSB7XG4gICAgICByZXR1cm4gc3RhdGVCdWlsZGVyW25hbWVdO1xuICAgIH1cbiAgICBpZiAoIWlzRnVuY3Rpb24oZnVuYykgfHwgIWlzU3RyaW5nKG5hbWUpKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKHN0YXRlQnVpbGRlcltuYW1lXSAmJiAhc3RhdGVCdWlsZGVyLiRkZWxlZ2F0ZXNbbmFtZV0pIHtcbiAgICAgIHN0YXRlQnVpbGRlci4kZGVsZWdhdGVzW25hbWVdID0gc3RhdGVCdWlsZGVyW25hbWVdO1xuICAgIH1cbiAgICBzdGF0ZUJ1aWxkZXJbbmFtZV0gPSBmdW5jO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlUHJvdmlkZXIjc3RhdGVcbiAgICogQG1ldGhvZE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVQcm92aWRlclxuICAgKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogUmVnaXN0ZXJzIGEgc3RhdGUgY29uZmlndXJhdGlvbiB1bmRlciBhIGdpdmVuIHN0YXRlIG5hbWUuIFRoZSBzdGF0ZUNvbmZpZyBvYmplY3RcbiAgICogaGFzIHRoZSBmb2xsb3dpbmcgYWNjZXB0YWJsZSBwcm9wZXJ0aWVzLlxuICAgKlxuICAgKiA8YSBpZD0ndGVtcGxhdGUnPjwvYT5cbiAgICpcbiAgICogLSAqKmB0ZW1wbGF0ZWAqKiAtIHtzdHJpbmd8ZnVuY3Rpb249fSAtIGh0bWwgdGVtcGxhdGUgYXMgYSBzdHJpbmcgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnNcbiAgICogICBhbiBodG1sIHRlbXBsYXRlIGFzIGEgc3RyaW5nIHdoaWNoIHNob3VsZCBiZSB1c2VkIGJ5IHRoZSB1aVZpZXcgZGlyZWN0aXZlcy4gVGhpcyBwcm9wZXJ0eSBcbiAgICogICB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGVtcGxhdGVVcmwuXG4gICAqICAgXG4gICAqICAgSWYgYHRlbXBsYXRlYCBpcyBhIGZ1bmN0aW9uLCBpdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHRoZSBmb2xsb3dpbmcgcGFyYW1ldGVyczpcbiAgICpcbiAgICogICAtIHthcnJheS4mbHQ7b2JqZWN0Jmd0O30gLSBzdGF0ZSBwYXJhbWV0ZXJzIGV4dHJhY3RlZCBmcm9tIHRoZSBjdXJyZW50ICRsb2NhdGlvbi5wYXRoKCkgYnlcbiAgICogICAgIGFwcGx5aW5nIHRoZSBjdXJyZW50IHN0YXRlXG4gICAqXG4gICAqIDxhIGlkPSd0ZW1wbGF0ZVVybCc+PC9hPlxuICAgKlxuICAgKiAtICoqYHRlbXBsYXRlVXJsYCoqIC0ge3N0cmluZ3xmdW5jdGlvbj19IC0gcGF0aCBvciBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBwYXRoIHRvIGFuIGh0bWwgXG4gICAqICAgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBieSB1aVZpZXcuXG4gICAqICAgXG4gICAqICAgSWYgYHRlbXBsYXRlVXJsYCBpcyBhIGZ1bmN0aW9uLCBpdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHRoZSBmb2xsb3dpbmcgcGFyYW1ldGVyczpcbiAgICpcbiAgICogICAtIHthcnJheS4mbHQ7b2JqZWN0Jmd0O30gLSBzdGF0ZSBwYXJhbWV0ZXJzIGV4dHJhY3RlZCBmcm9tIHRoZSBjdXJyZW50ICRsb2NhdGlvbi5wYXRoKCkgYnkgXG4gICAqICAgICBhcHBseWluZyB0aGUgY3VycmVudCBzdGF0ZVxuICAgKlxuICAgKiA8YSBpZD0ndGVtcGxhdGVQcm92aWRlcic+PC9hPlxuICAgKlxuICAgKiAtICoqYHRlbXBsYXRlUHJvdmlkZXJgKiogLSB7ZnVuY3Rpb249fSAtIFByb3ZpZGVyIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBIVE1MIGNvbnRlbnRcbiAgICogICBzdHJpbmcuXG4gICAqXG4gICAqIDxhIGlkPSdjb250cm9sbGVyJz48L2E+XG4gICAqXG4gICAqIC0gKipgY29udHJvbGxlcmAqKiAtIHtzdHJpbmd8ZnVuY3Rpb249fSAtICBDb250cm9sbGVyIGZuIHRoYXQgc2hvdWxkIGJlIGFzc29jaWF0ZWQgd2l0aCBuZXdseSBcbiAgICogICByZWxhdGVkIHNjb3BlIG9yIHRoZSBuYW1lIG9mIGEgcmVnaXN0ZXJlZCBjb250cm9sbGVyIGlmIHBhc3NlZCBhcyBhIHN0cmluZy5cbiAgICpcbiAgICogPGEgaWQ9J2NvbnRyb2xsZXJQcm92aWRlcic+PC9hPlxuICAgKlxuICAgKiAtICoqYGNvbnRyb2xsZXJQcm92aWRlcmAqKiAtIHtmdW5jdGlvbj19IC0gSW5qZWN0YWJsZSBwcm92aWRlciBmdW5jdGlvbiB0aGF0IHJldHVybnNcbiAgICogICB0aGUgYWN0dWFsIGNvbnRyb2xsZXIgb3Igc3RyaW5nLlxuICAgKlxuICAgKiA8YSBpZD0nY29udHJvbGxlckFzJz48L2E+XG4gICAqIFxuICAgKiAtICoqYGNvbnRyb2xsZXJBc2AqKiDigJMge3N0cmluZz19IOKAkyBBIGNvbnRyb2xsZXIgYWxpYXMgbmFtZS4gSWYgcHJlc2VudCB0aGUgY29udHJvbGxlciB3aWxsIGJlIFxuICAgKiAgIHB1Ymxpc2hlZCB0byBzY29wZSB1bmRlciB0aGUgY29udHJvbGxlckFzIG5hbWUuXG4gICAqXG4gICAqIDxhIGlkPSdyZXNvbHZlJz48L2E+XG4gICAqXG4gICAqIC0gKipgcmVzb2x2ZWAqKiAtIHtvYmplY3QuJmx0O3N0cmluZywgZnVuY3Rpb24mZ3Q7PX0gLSBBbiBvcHRpb25hbCBtYXAgb2YgZGVwZW5kZW5jaWVzIHdoaWNoIFxuICAgKiAgIHNob3VsZCBiZSBpbmplY3RlZCBpbnRvIHRoZSBjb250cm9sbGVyLiBJZiBhbnkgb2YgdGhlc2UgZGVwZW5kZW5jaWVzIGFyZSBwcm9taXNlcywgXG4gICAqICAgdGhlIHJvdXRlciB3aWxsIHdhaXQgZm9yIHRoZW0gYWxsIHRvIGJlIHJlc29sdmVkIG9yIG9uZSB0byBiZSByZWplY3RlZCBiZWZvcmUgdGhlIFxuICAgKiAgIGNvbnRyb2xsZXIgaXMgaW5zdGFudGlhdGVkLiBJZiBhbGwgdGhlIHByb21pc2VzIGFyZSByZXNvbHZlZCBzdWNjZXNzZnVsbHksIHRoZSB2YWx1ZXMgXG4gICAqICAgb2YgdGhlIHJlc29sdmVkIHByb21pc2VzIGFyZSBpbmplY3RlZCBhbmQgJHN0YXRlQ2hhbmdlU3VjY2VzcyBldmVudCBpcyBmaXJlZC4gSWYgYW55IFxuICAgKiAgIG9mIHRoZSBwcm9taXNlcyBhcmUgcmVqZWN0ZWQgdGhlICRzdGF0ZUNoYW5nZUVycm9yIGV2ZW50IGlzIGZpcmVkLiBUaGUgbWFwIG9iamVjdCBpczpcbiAgICogICBcbiAgICogICAtIGtleSAtIHtzdHJpbmd9OiBuYW1lIG9mIGRlcGVuZGVuY3kgdG8gYmUgaW5qZWN0ZWQgaW50byBjb250cm9sbGVyXG4gICAqICAgLSBmYWN0b3J5IC0ge3N0cmluZ3xmdW5jdGlvbn06IElmIHN0cmluZyB0aGVuIGl0IGlzIGFsaWFzIGZvciBzZXJ2aWNlLiBPdGhlcndpc2UgaWYgZnVuY3Rpb24sIFxuICAgKiAgICAgaXQgaXMgaW5qZWN0ZWQgYW5kIHJldHVybiB2YWx1ZSBpdCB0cmVhdGVkIGFzIGRlcGVuZGVuY3kuIElmIHJlc3VsdCBpcyBhIHByb21pc2UsIGl0IGlzIFxuICAgKiAgICAgcmVzb2x2ZWQgYmVmb3JlIGl0cyB2YWx1ZSBpcyBpbmplY3RlZCBpbnRvIGNvbnRyb2xsZXIuXG4gICAqXG4gICAqIDxhIGlkPSd1cmwnPjwvYT5cbiAgICpcbiAgICogLSAqKmB1cmxgKiogLSB7c3RyaW5nPX0gLSBBIHVybCB3aXRoIG9wdGlvbmFsIHBhcmFtZXRlcnMuIFdoZW4gYSBzdGF0ZSBpcyBuYXZpZ2F0ZWQgb3JcbiAgICogICB0cmFuc2l0aW9uZWQgdG8sIHRoZSBgJHN0YXRlUGFyYW1zYCBzZXJ2aWNlIHdpbGwgYmUgcG9wdWxhdGVkIHdpdGggYW55IFxuICAgKiAgIHBhcmFtZXRlcnMgdGhhdCB3ZXJlIHBhc3NlZC5cbiAgICpcbiAgICogPGEgaWQ9J3BhcmFtcyc+PC9hPlxuICAgKlxuICAgKiAtICoqYHBhcmFtc2AqKiAtIHtvYmplY3Q9fSAtIEFuIGFycmF5IG9mIHBhcmFtZXRlciBuYW1lcyBvciByZWd1bGFyIGV4cHJlc3Npb25zLiBPbmx5IFxuICAgKiAgIHVzZSB0aGlzIHdpdGhpbiBhIHN0YXRlIGlmIHlvdSBhcmUgbm90IHVzaW5nIHVybC4gT3RoZXJ3aXNlIHlvdSBjYW4gc3BlY2lmeSB5b3VyXG4gICAqICAgcGFyYW1ldGVycyB3aXRoaW4gdGhlIHVybC4gV2hlbiBhIHN0YXRlIGlzIG5hdmlnYXRlZCBvciB0cmFuc2l0aW9uZWQgdG8sIHRoZSBcbiAgICogICAkc3RhdGVQYXJhbXMgc2VydmljZSB3aWxsIGJlIHBvcHVsYXRlZCB3aXRoIGFueSBwYXJhbWV0ZXJzIHRoYXQgd2VyZSBwYXNzZWQuXG4gICAqXG4gICAqIDxhIGlkPSd2aWV3cyc+PC9hPlxuICAgKlxuICAgKiAtICoqYHZpZXdzYCoqIC0ge29iamVjdD19IC0gVXNlIHRoZSB2aWV3cyBwcm9wZXJ0eSB0byBzZXQgdXAgbXVsdGlwbGUgdmlld3Mgb3IgdG8gdGFyZ2V0IHZpZXdzXG4gICAqICAgbWFudWFsbHkvZXhwbGljaXRseS5cbiAgICpcbiAgICogPGEgaWQ9J2Fic3RyYWN0Jz48L2E+XG4gICAqXG4gICAqIC0gKipgYWJzdHJhY3RgKiogLSB7Ym9vbGVhbj19IC0gQW4gYWJzdHJhY3Qgc3RhdGUgd2lsbCBuZXZlciBiZSBkaXJlY3RseSBhY3RpdmF0ZWQsIFxuICAgKiAgIGJ1dCBjYW4gcHJvdmlkZSBpbmhlcml0ZWQgcHJvcGVydGllcyB0byBpdHMgY29tbW9uIGNoaWxkcmVuIHN0YXRlcy5cbiAgICpcbiAgICogPGEgaWQ9J29uRW50ZXInPjwvYT5cbiAgICpcbiAgICogLSAqKmBvbkVudGVyYCoqIC0ge29iamVjdD19IC0gQ2FsbGJhY2sgZnVuY3Rpb24gZm9yIHdoZW4gYSBzdGF0ZSBpcyBlbnRlcmVkLiBHb29kIHdheVxuICAgKiAgIHRvIHRyaWdnZXIgYW4gYWN0aW9uIG9yIGRpc3BhdGNoIGFuIGV2ZW50LCBzdWNoIGFzIG9wZW5pbmcgYSBkaWFsb2cuXG4gICAqXG4gICAqIDxhIGlkPSdvbkV4aXQnPjwvYT5cbiAgICpcbiAgICogLSAqKmBvbkV4aXRgKiogLSB7b2JqZWN0PX0gLSBDYWxsYmFjayBmdW5jdGlvbiBmb3Igd2hlbiBhIHN0YXRlIGlzIGV4aXRlZC4gR29vZCB3YXkgdG9cbiAgICogICB0cmlnZ2VyIGFuIGFjdGlvbiBvciBkaXNwYXRjaCBhbiBldmVudCwgc3VjaCBhcyBvcGVuaW5nIGEgZGlhbG9nLlxuICAgKlxuICAgKiA8YSBpZD0ncmVsb2FkT25TZWFyY2gnPjwvYT5cbiAgICpcbiAgICogLSAqKmByZWxvYWRPblNlYXJjaCA9IHRydWVgKiogLSB7Ym9vbGVhbj19IC0gSWYgYGZhbHNlYCwgd2lsbCBub3QgcmV0cmlnZ2VyIHRoZSBzYW1lIHN0YXRlIFxuICAgKiAgIGp1c3QgYmVjYXVzZSBhIHNlYXJjaC9xdWVyeSBwYXJhbWV0ZXIgaGFzIGNoYW5nZWQgKHZpYSAkbG9jYXRpb24uc2VhcmNoKCkgb3IgJGxvY2F0aW9uLmhhc2goKSkuIFxuICAgKiAgIFVzZWZ1bCBmb3Igd2hlbiB5b3UnZCBsaWtlIHRvIG1vZGlmeSAkbG9jYXRpb24uc2VhcmNoKCkgd2l0aG91dCB0cmlnZ2VyaW5nIGEgcmVsb2FkLlxuICAgKlxuICAgKiA8YSBpZD0nZGF0YSc+PC9hPlxuICAgKlxuICAgKiAtICoqYGRhdGFgKiogLSB7b2JqZWN0PX0gLSBBcmJpdHJhcnkgZGF0YSBvYmplY3QsIHVzZWZ1bCBmb3IgY3VzdG9tIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIDxwcmU+XG4gICAqIC8vIFNvbWUgc3RhdGUgbmFtZSBleGFtcGxlc1xuICAgKlxuICAgKiAvLyBzdGF0ZU5hbWUgY2FuIGJlIGEgc2luZ2xlIHRvcC1sZXZlbCBuYW1lIChtdXN0IGJlIHVuaXF1ZSkuXG4gICAqICRzdGF0ZVByb3ZpZGVyLnN0YXRlKFwiaG9tZVwiLCB7fSk7XG4gICAqXG4gICAqIC8vIE9yIGl0IGNhbiBiZSBhIG5lc3RlZCBzdGF0ZSBuYW1lLiBUaGlzIHN0YXRlIGlzIGEgY2hpbGQgb2YgdGhlIFxuICAgKiAvLyBhYm92ZSBcImhvbWVcIiBzdGF0ZS5cbiAgICogJHN0YXRlUHJvdmlkZXIuc3RhdGUoXCJob21lLm5ld2VzdFwiLCB7fSk7XG4gICAqXG4gICAqIC8vIE5lc3Qgc3RhdGVzIGFzIGRlZXBseSBhcyBuZWVkZWQuXG4gICAqICRzdGF0ZVByb3ZpZGVyLnN0YXRlKFwiaG9tZS5uZXdlc3QuYWJjLnh5ei5pbmNlcHRpb25cIiwge30pO1xuICAgKlxuICAgKiAvLyBzdGF0ZSgpIHJldHVybnMgJHN0YXRlUHJvdmlkZXIsIHNvIHlvdSBjYW4gY2hhaW4gc3RhdGUgZGVjbGFyYXRpb25zLlxuICAgKiAkc3RhdGVQcm92aWRlclxuICAgKiAgIC5zdGF0ZShcImhvbWVcIiwge30pXG4gICAqICAgLnN0YXRlKFwiYWJvdXRcIiwge30pXG4gICAqICAgLnN0YXRlKFwiY29udGFjdHNcIiwge30pO1xuICAgKiA8L3ByZT5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgQSB1bmlxdWUgc3RhdGUgbmFtZSwgZS5nLiBcImhvbWVcIiwgXCJhYm91dFwiLCBcImNvbnRhY3RzXCIuIFxuICAgKiBUbyBjcmVhdGUgYSBwYXJlbnQvY2hpbGQgc3RhdGUgdXNlIGEgZG90LCBlLmcuIFwiYWJvdXQuc2FsZXNcIiwgXCJob21lLm5ld2VzdFwiLlxuICAgKiBAcGFyYW0ge29iamVjdH0gZGVmaW5pdGlvbiBTdGF0ZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAgICovXG4gIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgZnVuY3Rpb24gc3RhdGUobmFtZSwgZGVmaW5pdGlvbikge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczogdHJ1ZSAqL1xuICAgIGlmIChpc09iamVjdChuYW1lKSkgZGVmaW5pdGlvbiA9IG5hbWU7XG4gICAgZWxzZSBkZWZpbml0aW9uLm5hbWUgPSBuYW1lO1xuICAgIHJlZ2lzdGVyU3RhdGUoZGVmaW5pdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQG5nZG9jIG9iamVjdFxuICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXG4gICAqXG4gICAqIEByZXF1aXJlcyAkcm9vdFNjb3BlXG4gICAqIEByZXF1aXJlcyAkcVxuICAgKiBAcmVxdWlyZXMgdWkucm91dGVyLnN0YXRlLiR2aWV3XG4gICAqIEByZXF1aXJlcyAkaW5qZWN0b3JcbiAgICogQHJlcXVpcmVzIHVpLnJvdXRlci51dGlsLiRyZXNvbHZlXG4gICAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlUGFyYW1zXG4gICAqXG4gICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBwYXJhbXMgQSBwYXJhbSBvYmplY3QsIGUuZy4ge3NlY3Rpb25JZDogc2VjdGlvbi5pZCl9LCB0aGF0IFxuICAgKiB5b3UnZCBsaWtlIHRvIHRlc3QgYWdhaW5zdCB0aGUgY3VycmVudCBhY3RpdmUgc3RhdGUuXG4gICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBjdXJyZW50IEEgcmVmZXJlbmNlIHRvIHRoZSBzdGF0ZSdzIGNvbmZpZyBvYmplY3QuIEhvd2V2ZXIgXG4gICAqIHlvdSBwYXNzZWQgaXQgaW4uIFVzZWZ1bCBmb3IgYWNjZXNzaW5nIGN1c3RvbSBkYXRhLlxuICAgKiBAcHJvcGVydHkge29iamVjdH0gdHJhbnNpdGlvbiBDdXJyZW50bHkgcGVuZGluZyB0cmFuc2l0aW9uLiBBIHByb21pc2UgdGhhdCdsbCBcbiAgICogcmVzb2x2ZSBvciByZWplY3QuXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBgJHN0YXRlYCBzZXJ2aWNlIGlzIHJlc3BvbnNpYmxlIGZvciByZXByZXNlbnRpbmcgc3RhdGVzIGFzIHdlbGwgYXMgdHJhbnNpdGlvbmluZ1xuICAgKiBiZXR3ZWVuIHRoZW0uIEl0IGFsc28gcHJvdmlkZXMgaW50ZXJmYWNlcyB0byBhc2sgZm9yIGN1cnJlbnQgc3RhdGUgb3IgZXZlbiBzdGF0ZXNcbiAgICogeW91J3JlIGNvbWluZyBmcm9tLlxuICAgKi9cbiAgLy8gJHVybFJvdXRlciBpcyBpbmplY3RlZCBqdXN0IHRvIGVuc3VyZSBpdCBnZXRzIGluc3RhbnRpYXRlZFxuICB0aGlzLiRnZXQgPSAkZ2V0O1xuICAkZ2V0LiRpbmplY3QgPSBbJyRyb290U2NvcGUnLCAnJHEnLCAnJHZpZXcnLCAnJGluamVjdG9yJywgJyRyZXNvbHZlJywgJyRzdGF0ZVBhcmFtcycsICckbG9jYXRpb24nLCAnJHVybFJvdXRlcicsICckYnJvd3NlciddO1xuICBmdW5jdGlvbiAkZ2V0KCAgICRyb290U2NvcGUsICAgJHEsICAgJHZpZXcsICAgJGluamVjdG9yLCAgICRyZXNvbHZlLCAgICRzdGF0ZVBhcmFtcywgICAkbG9jYXRpb24sICAgJHVybFJvdXRlciwgICAkYnJvd3Nlcikge1xuXG4gICAgdmFyIFRyYW5zaXRpb25TdXBlcnNlZGVkID0gJHEucmVqZWN0KG5ldyBFcnJvcigndHJhbnNpdGlvbiBzdXBlcnNlZGVkJykpO1xuICAgIHZhciBUcmFuc2l0aW9uUHJldmVudGVkID0gJHEucmVqZWN0KG5ldyBFcnJvcigndHJhbnNpdGlvbiBwcmV2ZW50ZWQnKSk7XG4gICAgdmFyIFRyYW5zaXRpb25BYm9ydGVkID0gJHEucmVqZWN0KG5ldyBFcnJvcigndHJhbnNpdGlvbiBhYm9ydGVkJykpO1xuICAgIHZhciBUcmFuc2l0aW9uRmFpbGVkID0gJHEucmVqZWN0KG5ldyBFcnJvcigndHJhbnNpdGlvbiBmYWlsZWQnKSk7XG4gICAgdmFyIGN1cnJlbnRMb2NhdGlvbiA9ICRsb2NhdGlvbi51cmwoKTtcbiAgICB2YXIgYmFzZUhyZWYgPSAkYnJvd3Nlci5iYXNlSHJlZigpO1xuXG4gICAgZnVuY3Rpb24gc3luY1VybCgpIHtcbiAgICAgIGlmICgkbG9jYXRpb24udXJsKCkgIT09IGN1cnJlbnRMb2NhdGlvbikge1xuICAgICAgICAkbG9jYXRpb24udXJsKGN1cnJlbnRMb2NhdGlvbik7XG4gICAgICAgICRsb2NhdGlvbi5yZXBsYWNlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcm9vdC5sb2NhbHMgPSB7IHJlc29sdmU6IG51bGwsIGdsb2JhbHM6IHsgJHN0YXRlUGFyYW1zOiB7fSB9IH07XG4gICAgJHN0YXRlID0ge1xuICAgICAgcGFyYW1zOiB7fSxcbiAgICAgIGN1cnJlbnQ6IHJvb3Quc2VsZixcbiAgICAgICRjdXJyZW50OiByb290LFxuICAgICAgdHJhbnNpdGlvbjogbnVsbFxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2MgZnVuY3Rpb25cbiAgICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI3JlbG9hZFxuICAgICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBBIG1ldGhvZCB0aGF0IGZvcmNlIHJlbG9hZHMgdGhlIGN1cnJlbnQgc3RhdGUuIEFsbCByZXNvbHZlcyBhcmUgcmUtcmVzb2x2ZWQsIGV2ZW50cyBhcmUgbm90IHJlLWZpcmVkLCBcbiAgICAgKiBhbmQgY29udHJvbGxlcnMgcmVpbnN0YW50aWF0ZWQgKGJ1ZyB3aXRoIGNvbnRyb2xsZXJzIHJlaW5zdGFudGlhdGluZyByaWdodCBub3csIGZpeGluZyBzb29uKS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogPHByZT5cbiAgICAgKiB2YXIgYXBwIGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ3VpLnJvdXRlciddKTtcbiAgICAgKlxuICAgICAqIGFwcC5jb250cm9sbGVyKCdjdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlKSB7XG4gICAgICogICAkc2NvcGUucmVsb2FkID0gZnVuY3Rpb24oKXtcbiAgICAgKiAgICAgJHN0YXRlLnJlbG9hZCgpO1xuICAgICAqICAgfVxuICAgICAqIH0pO1xuICAgICAqIDwvcHJlPlxuICAgICAqXG4gICAgICogYHJlbG9hZCgpYCBpcyBqdXN0IGFuIGFsaWFzIGZvcjpcbiAgICAgKiA8cHJlPlxuICAgICAqICRzdGF0ZS50cmFuc2l0aW9uVG8oJHN0YXRlLmN1cnJlbnQsICRzdGF0ZVBhcmFtcywgeyBcbiAgICAgKiAgIHJlbG9hZDogdHJ1ZSwgaW5oZXJpdDogZmFsc2UsIG5vdGlmeTogZmFsc2UgXG4gICAgICogfSk7XG4gICAgICogPC9wcmU+XG4gICAgICovXG4gICAgJHN0YXRlLnJlbG9hZCA9IGZ1bmN0aW9uIHJlbG9hZCgpIHtcbiAgICAgICRzdGF0ZS50cmFuc2l0aW9uVG8oJHN0YXRlLmN1cnJlbnQsICRzdGF0ZVBhcmFtcywgeyByZWxvYWQ6IHRydWUsIGluaGVyaXQ6IGZhbHNlLCBub3RpZnk6IGZhbHNlIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2MgZnVuY3Rpb25cbiAgICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI2dvXG4gICAgICogQG1ldGhvZE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIENvbnZlbmllbmNlIG1ldGhvZCBmb3IgdHJhbnNpdGlvbmluZyB0byBhIG5ldyBzdGF0ZS4gYCRzdGF0ZS5nb2AgY2FsbHMgXG4gICAgICogYCRzdGF0ZS50cmFuc2l0aW9uVG9gIGludGVybmFsbHkgYnV0IGF1dG9tYXRpY2FsbHkgc2V0cyBvcHRpb25zIHRvIFxuICAgICAqIGB7IGxvY2F0aW9uOiB0cnVlLCBpbmhlcml0OiB0cnVlLCByZWxhdGl2ZTogJHN0YXRlLiRjdXJyZW50LCBub3RpZnk6IHRydWUgfWAuIFxuICAgICAqIFRoaXMgYWxsb3dzIHlvdSB0byBlYXNpbHkgdXNlIGFuIGFic29sdXRlIG9yIHJlbGF0aXZlIHRvIHBhdGggYW5kIHNwZWNpZnkgXG4gICAgICogb25seSB0aGUgcGFyYW1ldGVycyB5b3UnZCBsaWtlIHRvIHVwZGF0ZSAod2hpbGUgbGV0dGluZyB1bnNwZWNpZmllZCBwYXJhbWV0ZXJzIFxuICAgICAqIGluaGVyaXQgZnJvbSB0aGUgY3VycmVudGx5IGFjdGl2ZSBhbmNlc3RvciBzdGF0ZXMpLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiA8cHJlPlxuICAgICAqIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyd1aS5yb3V0ZXInXSk7XG4gICAgICpcbiAgICAgKiBhcHAuY29udHJvbGxlcignY3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSkge1xuICAgICAqICAgJHNjb3BlLmNoYW5nZVN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAqICAgICAkc3RhdGUuZ28oJ2NvbnRhY3QuZGV0YWlsJyk7XG4gICAgICogICB9O1xuICAgICAqIH0pO1xuICAgICAqIDwvcHJlPlxuICAgICAqIDxpbWcgc3JjPScuLi9uZ2RvY19hc3NldHMvU3RhdGVHb0V4YW1wbGVzLnBuZycvPlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRvIEFic29sdXRlIHN0YXRlIG5hbWUgb3IgcmVsYXRpdmUgc3RhdGUgcGF0aC4gU29tZSBleGFtcGxlczpcbiAgICAgKlxuICAgICAqIC0gYCRzdGF0ZS5nbygnY29udGFjdC5kZXRhaWwnKWAgLSB3aWxsIGdvIHRvIHRoZSBgY29udGFjdC5kZXRhaWxgIHN0YXRlXG4gICAgICogLSBgJHN0YXRlLmdvKCdeJylgIC0gd2lsbCBnbyB0byBhIHBhcmVudCBzdGF0ZVxuICAgICAqIC0gYCRzdGF0ZS5nbygnXi5zaWJsaW5nJylgIC0gd2lsbCBnbyB0byBhIHNpYmxpbmcgc3RhdGVcbiAgICAgKiAtIGAkc3RhdGUuZ28oJy5jaGlsZC5ncmFuZGNoaWxkJylgIC0gd2lsbCBnbyB0byBncmFuZGNoaWxkIHN0YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdD19IHBhcmFtcyBBIG1hcCBvZiB0aGUgcGFyYW1ldGVycyB0aGF0IHdpbGwgYmUgc2VudCB0byB0aGUgc3RhdGUsIFxuICAgICAqIHdpbGwgcG9wdWxhdGUgJHN0YXRlUGFyYW1zLiBBbnkgcGFyYW1ldGVycyB0aGF0IGFyZSBub3Qgc3BlY2lmaWVkIHdpbGwgYmUgaW5oZXJpdGVkIGZyb20gY3VycmVudGx5IFxuICAgICAqIGRlZmluZWQgcGFyYW1ldGVycy4gVGhpcyBhbGxvd3MsIGZvciBleGFtcGxlLCBnb2luZyB0byBhIHNpYmxpbmcgc3RhdGUgdGhhdCBzaGFyZXMgcGFyYW1ldGVyc1xuICAgICAqIHNwZWNpZmllZCBpbiBhIHBhcmVudCBzdGF0ZS4gUGFyYW1ldGVyIGluaGVyaXRhbmNlIG9ubHkgd29ya3MgYmV0d2VlbiBjb21tb24gYW5jZXN0b3Igc3RhdGVzLCBJLmUuXG4gICAgICogdHJhbnNpdGlvbmluZyB0byBhIHNpYmxpbmcgd2lsbCBnZXQgeW91IHRoZSBwYXJhbWV0ZXJzIGZvciBhbGwgcGFyZW50cywgdHJhbnNpdGlvbmluZyB0byBhIGNoaWxkXG4gICAgICogd2lsbCBnZXQgeW91IGFsbCBjdXJyZW50IHBhcmFtZXRlcnMsIGV0Yy5cbiAgICAgKiBAcGFyYW0ge29iamVjdD19IG9wdGlvbnMgT3B0aW9ucyBvYmplY3QuIFRoZSBvcHRpb25zIGFyZTpcbiAgICAgKlxuICAgICAqIC0gKipgbG9jYXRpb25gKiogLSB7Ym9vbGVhbj10cnVlfHN0cmluZz19IC0gSWYgYHRydWVgIHdpbGwgdXBkYXRlIHRoZSB1cmwgaW4gdGhlIGxvY2F0aW9uIGJhciwgaWYgYGZhbHNlYFxuICAgICAqICAgIHdpbGwgbm90LiBJZiBzdHJpbmcsIG11c3QgYmUgYFwicmVwbGFjZVwiYCwgd2hpY2ggd2lsbCB1cGRhdGUgdXJsIGFuZCBhbHNvIHJlcGxhY2UgbGFzdCBoaXN0b3J5IHJlY29yZC5cbiAgICAgKiAtICoqYGluaGVyaXRgKiogLSB7Ym9vbGVhbj10cnVlfSwgSWYgYHRydWVgIHdpbGwgaW5oZXJpdCB1cmwgcGFyYW1ldGVycyBmcm9tIGN1cnJlbnQgdXJsLlxuICAgICAqIC0gKipgcmVsYXRpdmVgKiogLSB7b2JqZWN0PSRzdGF0ZS4kY3VycmVudH0sIFdoZW4gdHJhbnNpdGlvbmluZyB3aXRoIHJlbGF0aXZlIHBhdGggKGUuZyAnXicpLCBcbiAgICAgKiAgICBkZWZpbmVzIHdoaWNoIHN0YXRlIHRvIGJlIHJlbGF0aXZlIGZyb20uXG4gICAgICogLSAqKmBub3RpZnlgKiogLSB7Ym9vbGVhbj10cnVlfSwgSWYgYHRydWVgIHdpbGwgYnJvYWRjYXN0ICRzdGF0ZUNoYW5nZVN0YXJ0IGFuZCAkc3RhdGVDaGFuZ2VTdWNjZXNzIGV2ZW50cy5cbiAgICAgKiAtICoqYHJlbG9hZGAqKiAodjAuMi41KSAtIHtib29sZWFuPWZhbHNlfSwgSWYgYHRydWVgIHdpbGwgZm9yY2UgdHJhbnNpdGlvbiBldmVuIGlmIHRoZSBzdGF0ZSBvciBwYXJhbXMgXG4gICAgICogICAgaGF2ZSBub3QgY2hhbmdlZCwgYWthIGEgcmVsb2FkIG9mIHRoZSBzYW1lIHN0YXRlLiBJdCBkaWZmZXJzIGZyb20gcmVsb2FkT25TZWFyY2ggYmVjYXVzZSB5b3UnZFxuICAgICAqICAgIHVzZSB0aGlzIHdoZW4geW91IHdhbnQgdG8gZm9yY2UgYSByZWxvYWQgd2hlbiAqZXZlcnl0aGluZyogaXMgdGhlIHNhbWUsIGluY2x1ZGluZyBzZWFyY2ggcGFyYW1zLlxuICAgICAqXG4gICAgICogQHJldHVybnMge3Byb21pc2V9IEEgcHJvbWlzZSByZXByZXNlbnRpbmcgdGhlIHN0YXRlIG9mIHRoZSBuZXcgdHJhbnNpdGlvbi5cbiAgICAgKlxuICAgICAqIFBvc3NpYmxlIHN1Y2Nlc3MgdmFsdWVzOlxuICAgICAqXG4gICAgICogLSAkc3RhdGUuY3VycmVudFxuICAgICAqXG4gICAgICogPGJyLz5Qb3NzaWJsZSByZWplY3Rpb24gdmFsdWVzOlxuICAgICAqXG4gICAgICogLSAndHJhbnNpdGlvbiBzdXBlcnNlZGVkJyAtIHdoZW4gYSBuZXdlciB0cmFuc2l0aW9uIGhhcyBiZWVuIHN0YXJ0ZWQgYWZ0ZXIgdGhpcyBvbmVcbiAgICAgKiAtICd0cmFuc2l0aW9uIHByZXZlbnRlZCcgLSB3aGVuIGBldmVudC5wcmV2ZW50RGVmYXVsdCgpYCBoYXMgYmVlbiBjYWxsZWQgaW4gYSBgJHN0YXRlQ2hhbmdlU3RhcnRgIGxpc3RlbmVyXG4gICAgICogLSAndHJhbnNpdGlvbiBhYm9ydGVkJyAtIHdoZW4gYGV2ZW50LnByZXZlbnREZWZhdWx0KClgIGhhcyBiZWVuIGNhbGxlZCBpbiBhIGAkc3RhdGVOb3RGb3VuZGAgbGlzdGVuZXIgb3JcbiAgICAgKiAgIHdoZW4gYSBgJHN0YXRlTm90Rm91bmRgIGBldmVudC5yZXRyeWAgcHJvbWlzZSBlcnJvcnMuXG4gICAgICogLSAndHJhbnNpdGlvbiBmYWlsZWQnIC0gd2hlbiBhIHN0YXRlIGhhcyBiZWVuIHVuc3VjY2Vzc2Z1bGx5IGZvdW5kIGFmdGVyIDIgdHJpZXMuXG4gICAgICogLSAqcmVzb2x2ZSBlcnJvciogLSB3aGVuIGFuIGVycm9yIGhhcyBvY2N1cnJlZCB3aXRoIGEgYHJlc29sdmVgXG4gICAgICpcbiAgICAgKi9cbiAgICAkc3RhdGUuZ28gPSBmdW5jdGlvbiBnbyh0bywgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy50cmFuc2l0aW9uVG8odG8sIHBhcmFtcywgZXh0ZW5kKHsgaW5oZXJpdDogdHJ1ZSwgcmVsYXRpdmU6ICRzdGF0ZS4kY3VycmVudCB9LCBvcHRpb25zKSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjdHJhbnNpdGlvblRvXG4gICAgICogQG1ldGhvZE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIExvdy1sZXZlbCBtZXRob2QgZm9yIHRyYW5zaXRpb25pbmcgdG8gYSBuZXcgc3RhdGUuIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI21ldGhvZHNfZ28gJHN0YXRlLmdvfVxuICAgICAqIHVzZXMgYHRyYW5zaXRpb25Ub2AgaW50ZXJuYWxseS4gYCRzdGF0ZS5nb2AgaXMgcmVjb21tZW5kZWQgaW4gbW9zdCBzaXR1YXRpb25zLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiA8cHJlPlxuICAgICAqIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyd1aS5yb3V0ZXInXSk7XG4gICAgICpcbiAgICAgKiBhcHAuY29udHJvbGxlcignY3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSkge1xuICAgICAqICAgJHNjb3BlLmNoYW5nZVN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAqICAgICAkc3RhdGUudHJhbnNpdGlvblRvKCdjb250YWN0LmRldGFpbCcpO1xuICAgICAqICAgfTtcbiAgICAgKiB9KTtcbiAgICAgKiA8L3ByZT5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0byBTdGF0ZSBuYW1lLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0PX0gdG9QYXJhbXMgQSBtYXAgb2YgdGhlIHBhcmFtZXRlcnMgdGhhdCB3aWxsIGJlIHNlbnQgdG8gdGhlIHN0YXRlLFxuICAgICAqIHdpbGwgcG9wdWxhdGUgJHN0YXRlUGFyYW1zLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0PX0gb3B0aW9ucyBPcHRpb25zIG9iamVjdC4gVGhlIG9wdGlvbnMgYXJlOlxuICAgICAqXG4gICAgICogLSAqKmBsb2NhdGlvbmAqKiAtIHtib29sZWFuPXRydWV8c3RyaW5nPX0gLSBJZiBgdHJ1ZWAgd2lsbCB1cGRhdGUgdGhlIHVybCBpbiB0aGUgbG9jYXRpb24gYmFyLCBpZiBgZmFsc2VgXG4gICAgICogICAgd2lsbCBub3QuIElmIHN0cmluZywgbXVzdCBiZSBgXCJyZXBsYWNlXCJgLCB3aGljaCB3aWxsIHVwZGF0ZSB1cmwgYW5kIGFsc28gcmVwbGFjZSBsYXN0IGhpc3RvcnkgcmVjb3JkLlxuICAgICAqIC0gKipgaW5oZXJpdGAqKiAtIHtib29sZWFuPWZhbHNlfSwgSWYgYHRydWVgIHdpbGwgaW5oZXJpdCB1cmwgcGFyYW1ldGVycyBmcm9tIGN1cnJlbnQgdXJsLlxuICAgICAqIC0gKipgcmVsYXRpdmVgKiogLSB7b2JqZWN0PX0sIFdoZW4gdHJhbnNpdGlvbmluZyB3aXRoIHJlbGF0aXZlIHBhdGggKGUuZyAnXicpLCBcbiAgICAgKiAgICBkZWZpbmVzIHdoaWNoIHN0YXRlIHRvIGJlIHJlbGF0aXZlIGZyb20uXG4gICAgICogLSAqKmBub3RpZnlgKiogLSB7Ym9vbGVhbj10cnVlfSwgSWYgYHRydWVgIHdpbGwgYnJvYWRjYXN0ICRzdGF0ZUNoYW5nZVN0YXJ0IGFuZCAkc3RhdGVDaGFuZ2VTdWNjZXNzIGV2ZW50cy5cbiAgICAgKiAtICoqYHJlbG9hZGAqKiAodjAuMi41KSAtIHtib29sZWFuPWZhbHNlfSwgSWYgYHRydWVgIHdpbGwgZm9yY2UgdHJhbnNpdGlvbiBldmVuIGlmIHRoZSBzdGF0ZSBvciBwYXJhbXMgXG4gICAgICogICAgaGF2ZSBub3QgY2hhbmdlZCwgYWthIGEgcmVsb2FkIG9mIHRoZSBzYW1lIHN0YXRlLiBJdCBkaWZmZXJzIGZyb20gcmVsb2FkT25TZWFyY2ggYmVjYXVzZSB5b3UnZFxuICAgICAqICAgIHVzZSB0aGlzIHdoZW4geW91IHdhbnQgdG8gZm9yY2UgYSByZWxvYWQgd2hlbiAqZXZlcnl0aGluZyogaXMgdGhlIHNhbWUsIGluY2x1ZGluZyBzZWFyY2ggcGFyYW1zLlxuICAgICAqXG4gICAgICogQHJldHVybnMge3Byb21pc2V9IEEgcHJvbWlzZSByZXByZXNlbnRpbmcgdGhlIHN0YXRlIG9mIHRoZSBuZXcgdHJhbnNpdGlvbi4gU2VlXG4gICAgICoge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjbWV0aG9kc19nbyAkc3RhdGUuZ299LlxuICAgICAqL1xuICAgICRzdGF0ZS50cmFuc2l0aW9uVG8gPSBmdW5jdGlvbiB0cmFuc2l0aW9uVG8odG8sIHRvUGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICB0b1BhcmFtcyA9IHRvUGFyYW1zIHx8IHt9O1xuICAgICAgb3B0aW9ucyA9IGV4dGVuZCh7XG4gICAgICAgIGxvY2F0aW9uOiB0cnVlLCBpbmhlcml0OiBmYWxzZSwgcmVsYXRpdmU6IG51bGwsIG5vdGlmeTogdHJ1ZSwgcmVsb2FkOiBmYWxzZSwgJHJldHJ5OiBmYWxzZVxuICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICAgIHZhciBmcm9tID0gJHN0YXRlLiRjdXJyZW50LCBmcm9tUGFyYW1zID0gJHN0YXRlLnBhcmFtcywgZnJvbVBhdGggPSBmcm9tLnBhdGg7XG4gICAgICB2YXIgZXZ0LCB0b1N0YXRlID0gZmluZFN0YXRlKHRvLCBvcHRpb25zLnJlbGF0aXZlKTtcblxuICAgICAgaWYgKCFpc0RlZmluZWQodG9TdGF0ZSkpIHtcbiAgICAgICAgLy8gQnJvYWRjYXN0IG5vdCBmb3VuZCBldmVudCBhbmQgYWJvcnQgdGhlIHRyYW5zaXRpb24gaWYgcHJldmVudGVkXG4gICAgICAgIHZhciByZWRpcmVjdCA9IHsgdG86IHRvLCB0b1BhcmFtczogdG9QYXJhbXMsIG9wdGlvbnM6IG9wdGlvbnMgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIGV2ZW50XG4gICAgICAgICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjJHN0YXRlTm90Rm91bmRcbiAgICAgICAgICogQGV2ZW50T2YgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxuICAgICAgICAgKiBAZXZlbnRUeXBlIGJyb2FkY2FzdCBvbiByb290IHNjb3BlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKiBGaXJlZCB3aGVuIGEgcmVxdWVzdGVkIHN0YXRlICoqY2Fubm90IGJlIGZvdW5kKiogdXNpbmcgdGhlIHByb3ZpZGVkIHN0YXRlIG5hbWUgZHVyaW5nIHRyYW5zaXRpb24uXG4gICAgICAgICAqIFRoZSBldmVudCBpcyBicm9hZGNhc3QgYWxsb3dpbmcgYW55IGhhbmRsZXJzIGEgc2luZ2xlIGNoYW5jZSB0byBkZWFsIHdpdGggdGhlIGVycm9yICh1c3VhbGx5IGJ5XG4gICAgICAgICAqIGxhenktbG9hZGluZyB0aGUgdW5mb3VuZCBzdGF0ZSkuIEEgc3BlY2lhbCBgdW5mb3VuZFN0YXRlYCBvYmplY3QgaXMgcGFzc2VkIHRvIHRoZSBsaXN0ZW5lciBoYW5kbGVyLFxuICAgICAgICAgKiB5b3UgY2FuIHNlZSBpdHMgdGhyZWUgcHJvcGVydGllcyBpbiB0aGUgZXhhbXBsZS4gWW91IGNhbiB1c2UgYGV2ZW50LnByZXZlbnREZWZhdWx0KClgIHRvIGFib3J0IHRoZVxuICAgICAgICAgKiB0cmFuc2l0aW9uIGFuZCB0aGUgcHJvbWlzZSByZXR1cm5lZCBmcm9tIGBnb2Agd2lsbCBiZSByZWplY3RlZCB3aXRoIGEgYCd0cmFuc2l0aW9uIGFib3J0ZWQnYCB2YWx1ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IEV2ZW50IG9iamVjdC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHVuZm91bmRTdGF0ZSBVbmZvdW5kIFN0YXRlIGluZm9ybWF0aW9uLiBDb250YWluczogYHRvLCB0b1BhcmFtcywgb3B0aW9uc2AgcHJvcGVydGllcy5cbiAgICAgICAgICogQHBhcmFtIHtTdGF0ZX0gZnJvbVN0YXRlIEN1cnJlbnQgc3RhdGUgb2JqZWN0LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZnJvbVBhcmFtcyBDdXJyZW50IHN0YXRlIHBhcmFtcy5cbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogPHByZT5cbiAgICAgICAgICogLy8gc29tZXdoZXJlLCBhc3N1bWUgbGF6eS5zdGF0ZSBoYXMgbm90IGJlZW4gZGVmaW5lZFxuICAgICAgICAgKiAkc3RhdGUuZ28oXCJsYXp5LnN0YXRlXCIsIHthOjEsIGI6Mn0sIHtpbmhlcml0OmZhbHNlfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqIC8vIHNvbWV3aGVyZSBlbHNlXG4gICAgICAgICAqICRzY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJyxcbiAgICAgICAgICogZnVuY3Rpb24oZXZlbnQsIHVuZm91bmRTdGF0ZSwgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKXtcbiAgICAgICAgICogICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50byk7IC8vIFwibGF6eS5zdGF0ZVwiXG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUudG9QYXJhbXMpOyAvLyB7YToxLCBiOjJ9XG4gICAgICAgICAqICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUub3B0aW9ucyk7IC8vIHtpbmhlcml0OmZhbHNlfSArIGRlZmF1bHQgb3B0aW9uc1xuICAgICAgICAgKiB9KVxuICAgICAgICAgKiA8L3ByZT5cbiAgICAgICAgICovXG4gICAgICAgIGV2dCA9ICRyb290U2NvcGUuJGJyb2FkY2FzdCgnJHN0YXRlTm90Rm91bmQnLCByZWRpcmVjdCwgZnJvbS5zZWxmLCBmcm9tUGFyYW1zKTtcbiAgICAgICAgaWYgKGV2dC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgICAgc3luY1VybCgpO1xuICAgICAgICAgIHJldHVybiBUcmFuc2l0aW9uQWJvcnRlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFsbG93IHRoZSBoYW5kbGVyIHRvIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgc3RhdGUgbG9va3VwIHJldHJ5XG4gICAgICAgIGlmIChldnQucmV0cnkpIHtcbiAgICAgICAgICBpZiAob3B0aW9ucy4kcmV0cnkpIHtcbiAgICAgICAgICAgIHN5bmNVcmwoKTtcbiAgICAgICAgICAgIHJldHVybiBUcmFuc2l0aW9uRmFpbGVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmV0cnlUcmFuc2l0aW9uID0gJHN0YXRlLnRyYW5zaXRpb24gPSAkcS53aGVuKGV2dC5yZXRyeSk7XG4gICAgICAgICAgcmV0cnlUcmFuc2l0aW9uLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAocmV0cnlUcmFuc2l0aW9uICE9PSAkc3RhdGUudHJhbnNpdGlvbikgcmV0dXJuIFRyYW5zaXRpb25TdXBlcnNlZGVkO1xuICAgICAgICAgICAgcmVkaXJlY3Qub3B0aW9ucy4kcmV0cnkgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuICRzdGF0ZS50cmFuc2l0aW9uVG8ocmVkaXJlY3QudG8sIHJlZGlyZWN0LnRvUGFyYW1zLCByZWRpcmVjdC5vcHRpb25zKTtcbiAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBUcmFuc2l0aW9uQWJvcnRlZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzeW5jVXJsKCk7XG4gICAgICAgICAgcmV0dXJuIHJldHJ5VHJhbnNpdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFsd2F5cyByZXRyeSBvbmNlIGlmIHRoZSAkc3RhdGVOb3RGb3VuZCB3YXMgbm90IHByZXZlbnRlZFxuICAgICAgICAvLyAoaGFuZGxlcyBlaXRoZXIgcmVkaXJlY3QgY2hhbmdlZCBvciBzdGF0ZSBsYXp5LWRlZmluaXRpb24pXG4gICAgICAgIHRvID0gcmVkaXJlY3QudG87XG4gICAgICAgIHRvUGFyYW1zID0gcmVkaXJlY3QudG9QYXJhbXM7XG4gICAgICAgIG9wdGlvbnMgPSByZWRpcmVjdC5vcHRpb25zO1xuICAgICAgICB0b1N0YXRlID0gZmluZFN0YXRlKHRvLCBvcHRpb25zLnJlbGF0aXZlKTtcbiAgICAgICAgaWYgKCFpc0RlZmluZWQodG9TdGF0ZSkpIHtcbiAgICAgICAgICBpZiAob3B0aW9ucy5yZWxhdGl2ZSkgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IHJlc29sdmUgJ1wiICsgdG8gKyBcIicgZnJvbSBzdGF0ZSAnXCIgKyBvcHRpb25zLnJlbGF0aXZlICsgXCInXCIpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHN1Y2ggc3RhdGUgJ1wiICsgdG8gKyBcIidcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0b1N0YXRlW2Fic3RyYWN0S2V5XSkgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHRyYW5zaXRpb24gdG8gYWJzdHJhY3Qgc3RhdGUgJ1wiICsgdG8gKyBcIidcIik7XG4gICAgICBpZiAob3B0aW9ucy5pbmhlcml0KSB0b1BhcmFtcyA9IGluaGVyaXRQYXJhbXMoJHN0YXRlUGFyYW1zLCB0b1BhcmFtcyB8fCB7fSwgJHN0YXRlLiRjdXJyZW50LCB0b1N0YXRlKTtcbiAgICAgIHRvID0gdG9TdGF0ZTtcblxuICAgICAgdmFyIHRvUGF0aCA9IHRvLnBhdGg7XG5cbiAgICAgIC8vIFN0YXJ0aW5nIGZyb20gdGhlIHJvb3Qgb2YgdGhlIHBhdGgsIGtlZXAgYWxsIGxldmVscyB0aGF0IGhhdmVuJ3QgY2hhbmdlZFxuICAgICAgdmFyIGtlZXAsIHN0YXRlLCBsb2NhbHMgPSByb290LmxvY2FscywgdG9Mb2NhbHMgPSBbXTtcbiAgICAgIGZvciAoa2VlcCA9IDAsIHN0YXRlID0gdG9QYXRoW2tlZXBdO1xuICAgICAgICAgICBzdGF0ZSAmJiBzdGF0ZSA9PT0gZnJvbVBhdGhba2VlcF0gJiYgZXF1YWxGb3JLZXlzKHRvUGFyYW1zLCBmcm9tUGFyYW1zLCBzdGF0ZS5vd25QYXJhbXMpICYmICFvcHRpb25zLnJlbG9hZDtcbiAgICAgICAgICAga2VlcCsrLCBzdGF0ZSA9IHRvUGF0aFtrZWVwXSkge1xuICAgICAgICBsb2NhbHMgPSB0b0xvY2Fsc1trZWVwXSA9IHN0YXRlLmxvY2FscztcbiAgICAgIH1cblxuICAgICAgLy8gSWYgd2UncmUgZ29pbmcgdG8gdGhlIHNhbWUgc3RhdGUgYW5kIGFsbCBsb2NhbHMgYXJlIGtlcHQsIHdlJ3ZlIGdvdCBub3RoaW5nIHRvIGRvLlxuICAgICAgLy8gQnV0IGNsZWFyICd0cmFuc2l0aW9uJywgYXMgd2Ugc3RpbGwgd2FudCB0byBjYW5jZWwgYW55IG90aGVyIHBlbmRpbmcgdHJhbnNpdGlvbnMuXG4gICAgICAvLyBUT0RPOiBXZSBtYXkgbm90IHdhbnQgdG8gYnVtcCAndHJhbnNpdGlvbicgaWYgd2UncmUgY2FsbGVkIGZyb20gYSBsb2NhdGlvbiBjaGFuZ2UgdGhhdCB3ZSd2ZSBpbml0aWF0ZWQgb3Vyc2VsdmVzLFxuICAgICAgLy8gYmVjYXVzZSB3ZSBtaWdodCBhY2NpZGVudGFsbHkgYWJvcnQgYSBsZWdpdGltYXRlIHRyYW5zaXRpb24gaW5pdGlhdGVkIGZyb20gY29kZT9cbiAgICAgIGlmIChzaG91bGRUcmlnZ2VyUmVsb2FkKHRvLCBmcm9tLCBsb2NhbHMsIG9wdGlvbnMpICkge1xuICAgICAgICBpZiAoIHRvLnNlbGYucmVsb2FkT25TZWFyY2ggIT09IGZhbHNlIClcbiAgICAgICAgICBzeW5jVXJsKCk7XG4gICAgICAgICRzdGF0ZS50cmFuc2l0aW9uID0gbnVsbDtcbiAgICAgICAgcmV0dXJuICRxLndoZW4oJHN0YXRlLmN1cnJlbnQpO1xuICAgICAgfVxuXG4gICAgICAvLyBOb3JtYWxpemUvZmlsdGVyIHBhcmFtZXRlcnMgYmVmb3JlIHdlIHBhc3MgdGhlbSB0byBldmVudCBoYW5kbGVycyBldGMuXG4gICAgICB0b1BhcmFtcyA9IG5vcm1hbGl6ZSh0by5wYXJhbXMsIHRvUGFyYW1zIHx8IHt9KTtcblxuICAgICAgLy8gQnJvYWRjYXN0IHN0YXJ0IGV2ZW50IGFuZCBjYW5jZWwgdGhlIHRyYW5zaXRpb24gaWYgcmVxdWVzdGVkXG4gICAgICBpZiAob3B0aW9ucy5ub3RpZnkpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBldmVudFxuICAgICAgICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlIyRzdGF0ZUNoYW5nZVN0YXJ0XG4gICAgICAgICAqIEBldmVudE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcbiAgICAgICAgICogQGV2ZW50VHlwZSBicm9hZGNhc3Qgb24gcm9vdCBzY29wZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICogRmlyZWQgd2hlbiB0aGUgc3RhdGUgdHJhbnNpdGlvbiAqKmJlZ2lucyoqLiBZb3UgY2FuIHVzZSBgZXZlbnQucHJldmVudERlZmF1bHQoKWBcbiAgICAgICAgICogdG8gcHJldmVudCB0aGUgdHJhbnNpdGlvbiBmcm9tIGhhcHBlbmluZyBhbmQgdGhlbiB0aGUgdHJhbnNpdGlvbiBwcm9taXNlIHdpbGwgYmVcbiAgICAgICAgICogcmVqZWN0ZWQgd2l0aCBhIGAndHJhbnNpdGlvbiBwcmV2ZW50ZWQnYCB2YWx1ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IEV2ZW50IG9iamVjdC5cbiAgICAgICAgICogQHBhcmFtIHtTdGF0ZX0gdG9TdGF0ZSBUaGUgc3RhdGUgYmVpbmcgdHJhbnNpdGlvbmVkIHRvLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdG9QYXJhbXMgVGhlIHBhcmFtcyBzdXBwbGllZCB0byB0aGUgYHRvU3RhdGVgLlxuICAgICAgICAgKiBAcGFyYW0ge1N0YXRlfSBmcm9tU3RhdGUgVGhlIGN1cnJlbnQgc3RhdGUsIHByZS10cmFuc2l0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZnJvbVBhcmFtcyBUaGUgcGFyYW1zIHN1cHBsaWVkIHRvIHRoZSBgZnJvbVN0YXRlYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogPHByZT5cbiAgICAgICAgICogJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JyxcbiAgICAgICAgICogZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpe1xuICAgICAgICAgKiAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICogICAgIC8vIHRyYW5zaXRpb25UbygpIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZCB3aXRoXG4gICAgICAgICAqICAgICAvLyBhICd0cmFuc2l0aW9uIHByZXZlbnRlZCcgZXJyb3JcbiAgICAgICAgICogfSlcbiAgICAgICAgICogPC9wcmU+XG4gICAgICAgICAqL1xuICAgICAgICBldnQgPSAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJyRzdGF0ZUNoYW5nZVN0YXJ0JywgdG8uc2VsZiwgdG9QYXJhbXMsIGZyb20uc2VsZiwgZnJvbVBhcmFtcyk7XG4gICAgICAgIGlmIChldnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICAgIHN5bmNVcmwoKTtcbiAgICAgICAgICByZXR1cm4gVHJhbnNpdGlvblByZXZlbnRlZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZXNvbHZlIGxvY2FscyBmb3IgdGhlIHJlbWFpbmluZyBzdGF0ZXMsIGJ1dCBkb24ndCB1cGRhdGUgYW55IGdsb2JhbCBzdGF0ZSBqdXN0XG4gICAgICAvLyB5ZXQgLS0gaWYgYW55dGhpbmcgZmFpbHMgdG8gcmVzb2x2ZSB0aGUgY3VycmVudCBzdGF0ZSBuZWVkcyB0byByZW1haW4gdW50b3VjaGVkLlxuICAgICAgLy8gV2UgYWxzbyBzZXQgdXAgYW4gaW5oZXJpdGFuY2UgY2hhaW4gZm9yIHRoZSBsb2NhbHMgaGVyZS4gVGhpcyBhbGxvd3MgdGhlIHZpZXcgZGlyZWN0aXZlXG4gICAgICAvLyB0byBxdWlja2x5IGxvb2sgdXAgdGhlIGNvcnJlY3QgZGVmaW5pdGlvbiBmb3IgZWFjaCB2aWV3IGluIHRoZSBjdXJyZW50IHN0YXRlLiBFdmVuXG4gICAgICAvLyB0aG91Z2ggd2UgY3JlYXRlIHRoZSBsb2NhbHMgb2JqZWN0IGl0c2VsZiBvdXRzaWRlIHJlc29sdmVTdGF0ZSgpLCBpdCBpcyBpbml0aWFsbHlcbiAgICAgIC8vIGVtcHR5IGFuZCBnZXRzIGZpbGxlZCBhc3luY2hyb25vdXNseS4gV2UgbmVlZCB0byBrZWVwIHRyYWNrIG9mIHRoZSBwcm9taXNlIGZvciB0aGVcbiAgICAgIC8vIChmdWxseSByZXNvbHZlZCkgY3VycmVudCBsb2NhbHMsIGFuZCBwYXNzIHRoaXMgZG93biB0aGUgY2hhaW4uXG4gICAgICB2YXIgcmVzb2x2ZWQgPSAkcS53aGVuKGxvY2Fscyk7XG4gICAgICBmb3IgKHZhciBsPWtlZXA7IGw8dG9QYXRoLmxlbmd0aDsgbCsrLCBzdGF0ZT10b1BhdGhbbF0pIHtcbiAgICAgICAgbG9jYWxzID0gdG9Mb2NhbHNbbF0gPSBpbmhlcml0KGxvY2Fscyk7XG4gICAgICAgIHJlc29sdmVkID0gcmVzb2x2ZVN0YXRlKHN0YXRlLCB0b1BhcmFtcywgc3RhdGU9PT10bywgcmVzb2x2ZWQsIGxvY2Fscyk7XG4gICAgICB9XG5cbiAgICAgIC8vIE9uY2UgZXZlcnl0aGluZyBpcyByZXNvbHZlZCwgd2UgYXJlIHJlYWR5IHRvIHBlcmZvcm0gdGhlIGFjdHVhbCB0cmFuc2l0aW9uXG4gICAgICAvLyBhbmQgcmV0dXJuIGEgcHJvbWlzZSBmb3IgdGhlIG5ldyBzdGF0ZS4gV2UgYWxzbyBrZWVwIHRyYWNrIG9mIHdoYXQgdGhlXG4gICAgICAvLyBjdXJyZW50IHByb21pc2UgaXMsIHNvIHRoYXQgd2UgY2FuIGRldGVjdCBvdmVybGFwcGluZyB0cmFuc2l0aW9ucyBhbmRcbiAgICAgIC8vIGtlZXAgb25seSB0aGUgb3V0Y29tZSBvZiB0aGUgbGFzdCB0cmFuc2l0aW9uLlxuICAgICAgdmFyIHRyYW5zaXRpb24gPSAkc3RhdGUudHJhbnNpdGlvbiA9IHJlc29sdmVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbCwgZW50ZXJpbmcsIGV4aXRpbmc7XG5cbiAgICAgICAgaWYgKCRzdGF0ZS50cmFuc2l0aW9uICE9PSB0cmFuc2l0aW9uKSByZXR1cm4gVHJhbnNpdGlvblN1cGVyc2VkZWQ7XG5cbiAgICAgICAgLy8gRXhpdCAnZnJvbScgc3RhdGVzIG5vdCBrZXB0XG4gICAgICAgIGZvciAobD1mcm9tUGF0aC5sZW5ndGgtMTsgbD49a2VlcDsgbC0tKSB7XG4gICAgICAgICAgZXhpdGluZyA9IGZyb21QYXRoW2xdO1xuICAgICAgICAgIGlmIChleGl0aW5nLnNlbGYub25FeGl0KSB7XG4gICAgICAgICAgICAkaW5qZWN0b3IuaW52b2tlKGV4aXRpbmcuc2VsZi5vbkV4aXQsIGV4aXRpbmcuc2VsZiwgZXhpdGluZy5sb2NhbHMuZ2xvYmFscyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGV4aXRpbmcubG9jYWxzID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVudGVyICd0bycgc3RhdGVzIG5vdCBrZXB0XG4gICAgICAgIGZvciAobD1rZWVwOyBsPHRvUGF0aC5sZW5ndGg7IGwrKykge1xuICAgICAgICAgIGVudGVyaW5nID0gdG9QYXRoW2xdO1xuICAgICAgICAgIGVudGVyaW5nLmxvY2FscyA9IHRvTG9jYWxzW2xdO1xuICAgICAgICAgIGlmIChlbnRlcmluZy5zZWxmLm9uRW50ZXIpIHtcbiAgICAgICAgICAgICRpbmplY3Rvci5pbnZva2UoZW50ZXJpbmcuc2VsZi5vbkVudGVyLCBlbnRlcmluZy5zZWxmLCBlbnRlcmluZy5sb2NhbHMuZ2xvYmFscyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUnVuIGl0IGFnYWluLCB0byBjYXRjaCBhbnkgdHJhbnNpdGlvbnMgaW4gY2FsbGJhY2tzXG4gICAgICAgIGlmICgkc3RhdGUudHJhbnNpdGlvbiAhPT0gdHJhbnNpdGlvbikgcmV0dXJuIFRyYW5zaXRpb25TdXBlcnNlZGVkO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBnbG9iYWxzIGluICRzdGF0ZVxuICAgICAgICAkc3RhdGUuJGN1cnJlbnQgPSB0bztcbiAgICAgICAgJHN0YXRlLmN1cnJlbnQgPSB0by5zZWxmO1xuICAgICAgICAkc3RhdGUucGFyYW1zID0gdG9QYXJhbXM7XG4gICAgICAgIGNvcHkoJHN0YXRlLnBhcmFtcywgJHN0YXRlUGFyYW1zKTtcbiAgICAgICAgJHN0YXRlLnRyYW5zaXRpb24gPSBudWxsO1xuXG4gICAgICAgIC8vIFVwZGF0ZSAkbG9jYXRpb25cbiAgICAgICAgdmFyIHRvTmF2ID0gdG8ubmF2aWdhYmxlO1xuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbiAmJiB0b05hdikge1xuICAgICAgICAgICRsb2NhdGlvbi51cmwodG9OYXYudXJsLmZvcm1hdCh0b05hdi5sb2NhbHMuZ2xvYmFscy4kc3RhdGVQYXJhbXMpKTtcblxuICAgICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9uID09PSAncmVwbGFjZScpIHtcbiAgICAgICAgICAgICRsb2NhdGlvbi5yZXBsYWNlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMubm90aWZ5KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgZXZlbnRcbiAgICAgICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSMkc3RhdGVDaGFuZ2VTdWNjZXNzXG4gICAgICAgICAqIEBldmVudE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcbiAgICAgICAgICogQGV2ZW50VHlwZSBicm9hZGNhc3Qgb24gcm9vdCBzY29wZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICogRmlyZWQgb25jZSB0aGUgc3RhdGUgdHJhbnNpdGlvbiBpcyAqKmNvbXBsZXRlKiouXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCBFdmVudCBvYmplY3QuXG4gICAgICAgICAqIEBwYXJhbSB7U3RhdGV9IHRvU3RhdGUgVGhlIHN0YXRlIGJlaW5nIHRyYW5zaXRpb25lZCB0by5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHRvUGFyYW1zIFRoZSBwYXJhbXMgc3VwcGxpZWQgdG8gdGhlIGB0b1N0YXRlYC5cbiAgICAgICAgICogQHBhcmFtIHtTdGF0ZX0gZnJvbVN0YXRlIFRoZSBjdXJyZW50IHN0YXRlLCBwcmUtdHJhbnNpdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGZyb21QYXJhbXMgVGhlIHBhcmFtcyBzdXBwbGllZCB0byB0aGUgYGZyb21TdGF0ZWAuXG4gICAgICAgICAqL1xuICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnJHN0YXRlQ2hhbmdlU3VjY2VzcycsIHRvLnNlbGYsIHRvUGFyYW1zLCBmcm9tLnNlbGYsIGZyb21QYXJhbXMpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRMb2NhdGlvbiA9ICRsb2NhdGlvbi51cmwoKTtcblxuICAgICAgICByZXR1cm4gJHN0YXRlLmN1cnJlbnQ7XG4gICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgaWYgKCRzdGF0ZS50cmFuc2l0aW9uICE9PSB0cmFuc2l0aW9uKSByZXR1cm4gVHJhbnNpdGlvblN1cGVyc2VkZWQ7XG5cbiAgICAgICAgJHN0YXRlLnRyYW5zaXRpb24gPSBudWxsO1xuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIGV2ZW50XG4gICAgICAgICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjJHN0YXRlQ2hhbmdlRXJyb3JcbiAgICAgICAgICogQGV2ZW50T2YgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxuICAgICAgICAgKiBAZXZlbnRUeXBlIGJyb2FkY2FzdCBvbiByb290IHNjb3BlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgKiBGaXJlZCB3aGVuIGFuICoqZXJyb3Igb2NjdXJzKiogZHVyaW5nIHRyYW5zaXRpb24uIEl0J3MgaW1wb3J0YW50IHRvIG5vdGUgdGhhdCBpZiB5b3VcbiAgICAgICAgICogaGF2ZSBhbnkgZXJyb3JzIGluIHlvdXIgcmVzb2x2ZSBmdW5jdGlvbnMgKGphdmFzY3JpcHQgZXJyb3JzLCBub24tZXhpc3RlbnQgc2VydmljZXMsIGV0YylcbiAgICAgICAgICogdGhleSB3aWxsIG5vdCB0aHJvdyB0cmFkaXRpb25hbGx5LiBZb3UgbXVzdCBsaXN0ZW4gZm9yIHRoaXMgJHN0YXRlQ2hhbmdlRXJyb3IgZXZlbnQgdG9cbiAgICAgICAgICogY2F0Y2ggKipBTEwqKiBlcnJvcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCBFdmVudCBvYmplY3QuXG4gICAgICAgICAqIEBwYXJhbSB7U3RhdGV9IHRvU3RhdGUgVGhlIHN0YXRlIGJlaW5nIHRyYW5zaXRpb25lZCB0by5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHRvUGFyYW1zIFRoZSBwYXJhbXMgc3VwcGxpZWQgdG8gdGhlIGB0b1N0YXRlYC5cbiAgICAgICAgICogQHBhcmFtIHtTdGF0ZX0gZnJvbVN0YXRlIFRoZSBjdXJyZW50IHN0YXRlLCBwcmUtdHJhbnNpdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGZyb21QYXJhbXMgVGhlIHBhcmFtcyBzdXBwbGllZCB0byB0aGUgYGZyb21TdGF0ZWAuXG4gICAgICAgICAqIEBwYXJhbSB7RXJyb3J9IGVycm9yIFRoZSByZXNvbHZlIGVycm9yIG9iamVjdC5cbiAgICAgICAgICovXG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnJHN0YXRlQ2hhbmdlRXJyb3InLCB0by5zZWxmLCB0b1BhcmFtcywgZnJvbS5zZWxmLCBmcm9tUGFyYW1zLCBlcnJvcik7XG4gICAgICAgIHN5bmNVcmwoKTtcblxuICAgICAgICByZXR1cm4gJHEucmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHJhbnNpdGlvbjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIGZ1bmN0aW9uXG4gICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSNpc1xuICAgICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBTaW1pbGFyIHRvIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI21ldGhvZHNfaW5jbHVkZXMgJHN0YXRlLmluY2x1ZGVzfSxcbiAgICAgKiBidXQgb25seSBjaGVja3MgZm9yIHRoZSBmdWxsIHN0YXRlIG5hbWUuIElmIHBhcmFtcyBpcyBzdXBwbGllZCB0aGVuIGl0IHdpbGwgYmUgXG4gICAgICogdGVzdGVkIGZvciBzdHJpY3QgZXF1YWxpdHkgYWdhaW5zdCB0aGUgY3VycmVudCBhY3RpdmUgcGFyYW1zIG9iamVjdCwgc28gYWxsIHBhcmFtcyBcbiAgICAgKiBtdXN0IG1hdGNoIHdpdGggbm9uZSBtaXNzaW5nIGFuZCBubyBleHRyYXMuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIDxwcmU+XG4gICAgICogJHN0YXRlLmlzKCdjb250YWN0LmRldGFpbHMuaXRlbScpOyAvLyByZXR1cm5zIHRydWVcbiAgICAgKiAkc3RhdGUuaXMoY29udGFjdERldGFpbEl0ZW1TdGF0ZU9iamVjdCk7IC8vIHJldHVybnMgdHJ1ZVxuICAgICAqXG4gICAgICogLy8gZXZlcnl0aGluZyBlbHNlIHdvdWxkIHJldHVybiBmYWxzZVxuICAgICAqIDwvcHJlPlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBzdGF0ZU5hbWUgVGhlIHN0YXRlIG5hbWUgb3Igc3RhdGUgb2JqZWN0IHlvdSdkIGxpa2UgdG8gY2hlY2suXG4gICAgICogQHBhcmFtIHtvYmplY3Q9fSBwYXJhbXMgQSBwYXJhbSBvYmplY3QsIGUuZy4gYHtzZWN0aW9uSWQ6IHNlY3Rpb24uaWR9YCwgdGhhdCB5b3UnZCBsaWtlIFxuICAgICAqIHRvIHRlc3QgYWdhaW5zdCB0aGUgY3VycmVudCBhY3RpdmUgc3RhdGUuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiBpdCBpcyB0aGUgc3RhdGUuXG4gICAgICovXG4gICAgJHN0YXRlLmlzID0gZnVuY3Rpb24gaXMoc3RhdGVPck5hbWUsIHBhcmFtcykge1xuICAgICAgdmFyIHN0YXRlID0gZmluZFN0YXRlKHN0YXRlT3JOYW1lKTtcblxuICAgICAgaWYgKCFpc0RlZmluZWQoc3RhdGUpKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGlmICgkc3RhdGUuJGN1cnJlbnQgIT09IHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGlzRGVmaW5lZChwYXJhbXMpICYmIHBhcmFtcyAhPT0gbnVsbCA/IGFuZ3VsYXIuZXF1YWxzKCRzdGF0ZVBhcmFtcywgcGFyYW1zKSA6IHRydWU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgICAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjaW5jbHVkZXNcbiAgICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxuICAgICAqXG4gICAgICogQGRlc2NyaXB0aW9uXG4gICAgICogQSBtZXRob2QgdG8gZGV0ZXJtaW5lIGlmIHRoZSBjdXJyZW50IGFjdGl2ZSBzdGF0ZSBpcyBlcXVhbCB0byBvciBpcyB0aGUgY2hpbGQgb2YgdGhlIFxuICAgICAqIHN0YXRlIHN0YXRlTmFtZS4gSWYgYW55IHBhcmFtcyBhcmUgcGFzc2VkIHRoZW4gdGhleSB3aWxsIGJlIHRlc3RlZCBmb3IgYSBtYXRjaCBhcyB3ZWxsLlxuICAgICAqIE5vdCBhbGwgdGhlIHBhcmFtZXRlcnMgbmVlZCB0byBiZSBwYXNzZWQsIGp1c3QgdGhlIG9uZXMgeW91J2QgbGlrZSB0byB0ZXN0IGZvciBlcXVhbGl0eS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogPHByZT5cbiAgICAgKiAkc3RhdGUuJGN1cnJlbnQubmFtZSA9ICdjb250YWN0cy5kZXRhaWxzLml0ZW0nO1xuICAgICAqXG4gICAgICogJHN0YXRlLmluY2x1ZGVzKFwiY29udGFjdHNcIik7IC8vIHJldHVybnMgdHJ1ZVxuICAgICAqICRzdGF0ZS5pbmNsdWRlcyhcImNvbnRhY3RzLmRldGFpbHNcIik7IC8vIHJldHVybnMgdHJ1ZVxuICAgICAqICRzdGF0ZS5pbmNsdWRlcyhcImNvbnRhY3RzLmRldGFpbHMuaXRlbVwiKTsgLy8gcmV0dXJucyB0cnVlXG4gICAgICogJHN0YXRlLmluY2x1ZGVzKFwiY29udGFjdHMubGlzdFwiKTsgLy8gcmV0dXJucyBmYWxzZVxuICAgICAqICRzdGF0ZS5pbmNsdWRlcyhcImFib3V0XCIpOyAvLyByZXR1cm5zIGZhbHNlXG4gICAgICogPC9wcmU+XG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBCYXNpYyBnbG9iaW5nIHBhdHRlcm5zIHdpbGwgYWxzbyB3b3JrLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiA8cHJlPlxuICAgICAqICRzdGF0ZS4kY3VycmVudC5uYW1lID0gJ2NvbnRhY3RzLmRldGFpbHMuaXRlbS51cmwnO1xuICAgICAqXG4gICAgICogJHN0YXRlLmluY2x1ZGVzKFwiKi5kZXRhaWxzLiouKlwiKTsgLy8gcmV0dXJucyB0cnVlXG4gICAgICogJHN0YXRlLmluY2x1ZGVzKFwiKi5kZXRhaWxzLioqXCIpOyAvLyByZXR1cm5zIHRydWVcbiAgICAgKiAkc3RhdGUuaW5jbHVkZXMoXCIqKi5pdGVtLioqXCIpOyAvLyByZXR1cm5zIHRydWVcbiAgICAgKiAkc3RhdGUuaW5jbHVkZXMoXCIqLmRldGFpbHMuaXRlbS51cmxcIik7IC8vIHJldHVybnMgdHJ1ZVxuICAgICAqICRzdGF0ZS5pbmNsdWRlcyhcIiouZGV0YWlscy4qLnVybFwiKTsgLy8gcmV0dXJucyB0cnVlXG4gICAgICogJHN0YXRlLmluY2x1ZGVzKFwiKi5kZXRhaWxzLipcIik7IC8vIHJldHVybnMgZmFsc2VcbiAgICAgKiAkc3RhdGUuaW5jbHVkZXMoXCJpdGVtLioqXCIpOyAvLyByZXR1cm5zIGZhbHNlXG4gICAgICogPC9wcmU+XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGVPck5hbWUgQSBwYXJ0aWFsIG5hbWUgdG8gYmUgc2VhcmNoZWQgZm9yIHdpdGhpbiB0aGUgY3VycmVudCBzdGF0ZSBuYW1lLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgQSBwYXJhbSBvYmplY3QsIGUuZy4gYHtzZWN0aW9uSWQ6IHNlY3Rpb24uaWR9YCwgXG4gICAgICogdGhhdCB5b3UnZCBsaWtlIHRvIHRlc3QgYWdhaW5zdCB0aGUgY3VycmVudCBhY3RpdmUgc3RhdGUuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiBpdCBkb2VzIGluY2x1ZGUgdGhlIHN0YXRlXG4gICAgICovXG5cbiAgICAkc3RhdGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyhzdGF0ZU9yTmFtZSwgcGFyYW1zKSB7XG4gICAgICBpZiAoaXNTdHJpbmcoc3RhdGVPck5hbWUpICYmIGlzR2xvYihzdGF0ZU9yTmFtZSkpIHtcbiAgICAgICAgaWYgKGRvZXNTdGF0ZU1hdGNoR2xvYihzdGF0ZU9yTmFtZSkpIHtcbiAgICAgICAgICBzdGF0ZU9yTmFtZSA9ICRzdGF0ZS4kY3VycmVudC5uYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgc3RhdGUgPSBmaW5kU3RhdGUoc3RhdGVPck5hbWUpO1xuICAgICAgaWYgKCFpc0RlZmluZWQoc3RhdGUpKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGlmICghaXNEZWZpbmVkKCRzdGF0ZS4kY3VycmVudC5pbmNsdWRlc1tzdGF0ZS5uYW1lXSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgdmFsaWRQYXJhbXMgPSB0cnVlO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKHBhcmFtcywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICBpZiAoIWlzRGVmaW5lZCgkc3RhdGVQYXJhbXNba2V5XSkgfHwgJHN0YXRlUGFyYW1zW2tleV0gIT09IHZhbHVlKSB7XG4gICAgICAgICAgdmFsaWRQYXJhbXMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gdmFsaWRQYXJhbXM7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIGZ1bmN0aW9uXG4gICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSNocmVmXG4gICAgICogQG1ldGhvZE9mIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIEEgdXJsIGdlbmVyYXRpb24gbWV0aG9kIHRoYXQgcmV0dXJucyB0aGUgY29tcGlsZWQgdXJsIGZvciB0aGUgZ2l2ZW4gc3RhdGUgcG9wdWxhdGVkIHdpdGggdGhlIGdpdmVuIHBhcmFtcy5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogPHByZT5cbiAgICAgKiBleHBlY3QoJHN0YXRlLmhyZWYoXCJhYm91dC5wZXJzb25cIiwgeyBwZXJzb246IFwiYm9iXCIgfSkpLnRvRXF1YWwoXCIvYWJvdXQvYm9iXCIpO1xuICAgICAqIDwvcHJlPlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBzdGF0ZU9yTmFtZSBUaGUgc3RhdGUgbmFtZSBvciBzdGF0ZSBvYmplY3QgeW91J2QgbGlrZSB0byBnZW5lcmF0ZSBhIHVybCBmcm9tLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0PX0gcGFyYW1zIEFuIG9iamVjdCBvZiBwYXJhbWV0ZXIgdmFsdWVzIHRvIGZpbGwgdGhlIHN0YXRlJ3MgcmVxdWlyZWQgcGFyYW1ldGVycy5cbiAgICAgKiBAcGFyYW0ge29iamVjdD19IG9wdGlvbnMgT3B0aW9ucyBvYmplY3QuIFRoZSBvcHRpb25zIGFyZTpcbiAgICAgKlxuICAgICAqIC0gKipgbG9zc3lgKiogLSB7Ym9vbGVhbj10cnVlfSAtICBJZiB0cnVlLCBhbmQgaWYgdGhlcmUgaXMgbm8gdXJsIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3RhdGUgcHJvdmlkZWQgaW4gdGhlXG4gICAgICogICAgZmlyc3QgcGFyYW1ldGVyLCB0aGVuIHRoZSBjb25zdHJ1Y3RlZCBocmVmIHVybCB3aWxsIGJlIGJ1aWx0IGZyb20gdGhlIGZpcnN0IG5hdmlnYWJsZSBhbmNlc3RvciAoYWthXG4gICAgICogICAgYW5jZXN0b3Igd2l0aCBhIHZhbGlkIHVybCkuXG4gICAgICogLSAqKmBpbmhlcml0YCoqIC0ge2Jvb2xlYW49ZmFsc2V9LCBJZiBgdHJ1ZWAgd2lsbCBpbmhlcml0IHVybCBwYXJhbWV0ZXJzIGZyb20gY3VycmVudCB1cmwuXG4gICAgICogLSAqKmByZWxhdGl2ZWAqKiAtIHtvYmplY3Q9JHN0YXRlLiRjdXJyZW50fSwgV2hlbiB0cmFuc2l0aW9uaW5nIHdpdGggcmVsYXRpdmUgcGF0aCAoZS5nICdeJyksIFxuICAgICAqICAgIGRlZmluZXMgd2hpY2ggc3RhdGUgdG8gYmUgcmVsYXRpdmUgZnJvbS5cbiAgICAgKiAtICoqYGFic29sdXRlYCoqIC0ge2Jvb2xlYW49ZmFsc2V9LCAgSWYgdHJ1ZSB3aWxsIGdlbmVyYXRlIGFuIGFic29sdXRlIHVybCwgZS5nLiBcImh0dHA6Ly93d3cuZXhhbXBsZS5jb20vZnVsbHVybFwiLlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGNvbXBpbGVkIHN0YXRlIHVybFxuICAgICAqL1xuICAgICRzdGF0ZS5ocmVmID0gZnVuY3Rpb24gaHJlZihzdGF0ZU9yTmFtZSwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gZXh0ZW5kKHsgbG9zc3k6IHRydWUsIGluaGVyaXQ6IGZhbHNlLCBhYnNvbHV0ZTogZmFsc2UsIHJlbGF0aXZlOiAkc3RhdGUuJGN1cnJlbnQgfSwgb3B0aW9ucyB8fCB7fSk7XG4gICAgICB2YXIgc3RhdGUgPSBmaW5kU3RhdGUoc3RhdGVPck5hbWUsIG9wdGlvbnMucmVsYXRpdmUpO1xuICAgICAgaWYgKCFpc0RlZmluZWQoc3RhdGUpKSByZXR1cm4gbnVsbDtcblxuICAgICAgcGFyYW1zID0gaW5oZXJpdFBhcmFtcygkc3RhdGVQYXJhbXMsIHBhcmFtcyB8fCB7fSwgJHN0YXRlLiRjdXJyZW50LCBzdGF0ZSk7XG4gICAgICB2YXIgbmF2ID0gKHN0YXRlICYmIG9wdGlvbnMubG9zc3kpID8gc3RhdGUubmF2aWdhYmxlIDogc3RhdGU7XG4gICAgICB2YXIgdXJsID0gKG5hdiAmJiBuYXYudXJsKSA/IG5hdi51cmwuZm9ybWF0KG5vcm1hbGl6ZShzdGF0ZS5wYXJhbXMsIHBhcmFtcyB8fCB7fSkpIDogbnVsbDtcbiAgICAgIGlmICghJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKCkgJiYgdXJsKSB7XG4gICAgICAgIHVybCA9IFwiI1wiICsgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgpICsgdXJsO1xuICAgICAgfVxuXG4gICAgICBpZiAoYmFzZUhyZWYgIT09ICcvJykge1xuICAgICAgICBpZiAoJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKCkpIHtcbiAgICAgICAgICB1cmwgPSBiYXNlSHJlZi5zbGljZSgwLCAtMSkgKyB1cmw7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5hYnNvbHV0ZSl7XG4gICAgICAgICAgdXJsID0gYmFzZUhyZWYuc2xpY2UoMSkgKyB1cmw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMuYWJzb2x1dGUgJiYgdXJsKSB7XG4gICAgICAgIHVybCA9ICRsb2NhdGlvbi5wcm90b2NvbCgpICsgJzovLycgKyBcbiAgICAgICAgICAgICAgJGxvY2F0aW9uLmhvc3QoKSArIFxuICAgICAgICAgICAgICAoJGxvY2F0aW9uLnBvcnQoKSA9PSA4MCB8fCAkbG9jYXRpb24ucG9ydCgpID09IDQ0MyA/ICcnIDogJzonICsgJGxvY2F0aW9uLnBvcnQoKSkgKyBcbiAgICAgICAgICAgICAgKCEkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUoKSAmJiB1cmwgPyAnLycgOiAnJykgKyBcbiAgICAgICAgICAgICAgdXJsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHVybDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIGZ1bmN0aW9uXG4gICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSNnZXRcbiAgICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxuICAgICAqXG4gICAgICogQGRlc2NyaXB0aW9uXG4gICAgICogUmV0dXJucyB0aGUgc3RhdGUgY29uZmlndXJhdGlvbiBvYmplY3QgZm9yIGFueSBzcGVjaWZpYyBzdGF0ZSBvciBhbGwgc3RhdGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0PX0gc3RhdGVPck5hbWUgSWYgcHJvdmlkZWQsIHdpbGwgb25seSBnZXQgdGhlIGNvbmZpZyBmb3JcbiAgICAgKiB0aGUgcmVxdWVzdGVkIHN0YXRlLiBJZiBub3QgcHJvdmlkZWQsIHJldHVybnMgYW4gYXJyYXkgb2YgQUxMIHN0YXRlIGNvbmZpZ3MuXG4gICAgICogQHJldHVybnMge29iamVjdHxhcnJheX0gU3RhdGUgY29uZmlndXJhdGlvbiBvYmplY3Qgb3IgYXJyYXkgb2YgYWxsIG9iamVjdHMuXG4gICAgICovXG4gICAgJHN0YXRlLmdldCA9IGZ1bmN0aW9uIChzdGF0ZU9yTmFtZSwgY29udGV4dCkge1xuICAgICAgaWYgKCFpc0RlZmluZWQoc3RhdGVPck5hbWUpKSB7XG4gICAgICAgIHZhciBsaXN0ID0gW107XG4gICAgICAgIGZvckVhY2goc3RhdGVzLCBmdW5jdGlvbihzdGF0ZSkgeyBsaXN0LnB1c2goc3RhdGUuc2VsZik7IH0pO1xuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICAgIH1cbiAgICAgIHZhciBzdGF0ZSA9IGZpbmRTdGF0ZShzdGF0ZU9yTmFtZSwgY29udGV4dCk7XG4gICAgICByZXR1cm4gKHN0YXRlICYmIHN0YXRlLnNlbGYpID8gc3RhdGUuc2VsZiA6IG51bGw7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHJlc29sdmVTdGF0ZShzdGF0ZSwgcGFyYW1zLCBwYXJhbXNBcmVGaWx0ZXJlZCwgaW5oZXJpdGVkLCBkc3QpIHtcbiAgICAgIC8vIE1ha2UgYSByZXN0cmljdGVkICRzdGF0ZVBhcmFtcyB3aXRoIG9ubHkgdGhlIHBhcmFtZXRlcnMgdGhhdCBhcHBseSB0byB0aGlzIHN0YXRlIGlmXG4gICAgICAvLyBuZWNlc3NhcnkuIEluIGFkZGl0aW9uIHRvIGJlaW5nIGF2YWlsYWJsZSB0byB0aGUgY29udHJvbGxlciBhbmQgb25FbnRlci9vbkV4aXQgY2FsbGJhY2tzLFxuICAgICAgLy8gd2UgYWxzbyBuZWVkICRzdGF0ZVBhcmFtcyB0byBiZSBhdmFpbGFibGUgZm9yIGFueSAkaW5qZWN0b3IgY2FsbHMgd2UgbWFrZSBkdXJpbmcgdGhlXG4gICAgICAvLyBkZXBlbmRlbmN5IHJlc29sdXRpb24gcHJvY2Vzcy5cbiAgICAgIHZhciAkc3RhdGVQYXJhbXMgPSAocGFyYW1zQXJlRmlsdGVyZWQpID8gcGFyYW1zIDogZmlsdGVyQnlLZXlzKHN0YXRlLnBhcmFtcywgcGFyYW1zKTtcbiAgICAgIHZhciBsb2NhbHMgPSB7ICRzdGF0ZVBhcmFtczogJHN0YXRlUGFyYW1zIH07XG5cbiAgICAgIC8vIFJlc29sdmUgJ2dsb2JhbCcgZGVwZW5kZW5jaWVzIGZvciB0aGUgc3RhdGUsIGkuZS4gdGhvc2Ugbm90IHNwZWNpZmljIHRvIGEgdmlldy5cbiAgICAgIC8vIFdlJ3JlIGFsc28gaW5jbHVkaW5nICRzdGF0ZVBhcmFtcyBpbiB0aGlzOyB0aGF0IHdheSB0aGUgcGFyYW1ldGVycyBhcmUgcmVzdHJpY3RlZFxuICAgICAgLy8gdG8gdGhlIHNldCB0aGF0IHNob3VsZCBiZSB2aXNpYmxlIHRvIHRoZSBzdGF0ZSwgYW5kIGFyZSBpbmRlcGVuZGVudCBvZiB3aGVuIHdlIHVwZGF0ZVxuICAgICAgLy8gdGhlIGdsb2JhbCAkc3RhdGUgYW5kICRzdGF0ZVBhcmFtcyB2YWx1ZXMuXG4gICAgICBkc3QucmVzb2x2ZSA9ICRyZXNvbHZlLnJlc29sdmUoc3RhdGUucmVzb2x2ZSwgbG9jYWxzLCBkc3QucmVzb2x2ZSwgc3RhdGUpO1xuICAgICAgdmFyIHByb21pc2VzID0gWyBkc3QucmVzb2x2ZS50aGVuKGZ1bmN0aW9uIChnbG9iYWxzKSB7XG4gICAgICAgIGRzdC5nbG9iYWxzID0gZ2xvYmFscztcbiAgICAgIH0pIF07XG4gICAgICBpZiAoaW5oZXJpdGVkKSBwcm9taXNlcy5wdXNoKGluaGVyaXRlZCk7XG5cbiAgICAgIC8vIFJlc29sdmUgdGVtcGxhdGUgYW5kIGRlcGVuZGVuY2llcyBmb3IgYWxsIHZpZXdzLlxuICAgICAgZm9yRWFjaChzdGF0ZS52aWV3cywgZnVuY3Rpb24gKHZpZXcsIG5hbWUpIHtcbiAgICAgICAgdmFyIGluamVjdGFibGVzID0gKHZpZXcucmVzb2x2ZSAmJiB2aWV3LnJlc29sdmUgIT09IHN0YXRlLnJlc29sdmUgPyB2aWV3LnJlc29sdmUgOiB7fSk7XG4gICAgICAgIGluamVjdGFibGVzLiR0ZW1wbGF0ZSA9IFsgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiAkdmlldy5sb2FkKG5hbWUsIHsgdmlldzogdmlldywgbG9jYWxzOiBsb2NhbHMsIHBhcmFtczogJHN0YXRlUGFyYW1zLCBub3RpZnk6IGZhbHNlIH0pIHx8ICcnO1xuICAgICAgICB9XTtcblxuICAgICAgICBwcm9taXNlcy5wdXNoKCRyZXNvbHZlLnJlc29sdmUoaW5qZWN0YWJsZXMsIGxvY2FscywgZHN0LnJlc29sdmUsIHN0YXRlKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAvLyBSZWZlcmVuY2VzIHRvIHRoZSBjb250cm9sbGVyIChvbmx5IGluc3RhbnRpYXRlZCBhdCBsaW5rIHRpbWUpXG4gICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmlldy5jb250cm9sbGVyUHJvdmlkZXIpIHx8IGlzQXJyYXkodmlldy5jb250cm9sbGVyUHJvdmlkZXIpKSB7XG4gICAgICAgICAgICB2YXIgaW5qZWN0TG9jYWxzID0gYW5ndWxhci5leHRlbmQoe30sIGluamVjdGFibGVzLCBsb2NhbHMpO1xuICAgICAgICAgICAgcmVzdWx0LiQkY29udHJvbGxlciA9ICRpbmplY3Rvci5pbnZva2Uodmlldy5jb250cm9sbGVyUHJvdmlkZXIsIG51bGwsIGluamVjdExvY2Fscyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC4kJGNvbnRyb2xsZXIgPSB2aWV3LmNvbnRyb2xsZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFByb3ZpZGUgYWNjZXNzIHRvIHRoZSBzdGF0ZSBpdHNlbGYgZm9yIGludGVybmFsIHVzZVxuICAgICAgICAgIHJlc3VsdC4kJHN0YXRlID0gc3RhdGU7XG4gICAgICAgICAgcmVzdWx0LiQkY29udHJvbGxlckFzID0gdmlldy5jb250cm9sbGVyQXM7XG4gICAgICAgICAgZHN0W25hbWVdID0gcmVzdWx0O1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gV2FpdCBmb3IgYWxsIHRoZSBwcm9taXNlcyBhbmQgdGhlbiByZXR1cm4gdGhlIGFjdGl2YXRpb24gb2JqZWN0XG4gICAgICByZXR1cm4gJHEuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIGRzdDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiAkc3RhdGU7XG4gIH1cblxuICBmdW5jdGlvbiBzaG91bGRUcmlnZ2VyUmVsb2FkKHRvLCBmcm9tLCBsb2NhbHMsIG9wdGlvbnMpIHtcbiAgICBpZiAoIHRvID09PSBmcm9tICYmICgobG9jYWxzID09PSBmcm9tLmxvY2FscyAmJiAhb3B0aW9ucy5yZWxvYWQpIHx8ICh0by5zZWxmLnJlbG9hZE9uU2VhcmNoID09PSBmYWxzZSkpICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG59XG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIuc3RhdGUnKVxuICAudmFsdWUoJyRzdGF0ZVBhcmFtcycsIHt9KVxuICAucHJvdmlkZXIoJyRzdGF0ZScsICRTdGF0ZVByb3ZpZGVyKTtcblxuXG4kVmlld1Byb3ZpZGVyLiRpbmplY3QgPSBbXTtcbmZ1bmN0aW9uICRWaWV3UHJvdmlkZXIoKSB7XG5cbiAgdGhpcy4kZ2V0ID0gJGdldDtcbiAgLyoqXG4gICAqIEBuZ2RvYyBvYmplY3RcbiAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiR2aWV3XG4gICAqXG4gICAqIEByZXF1aXJlcyB1aS5yb3V0ZXIudXRpbC4kdGVtcGxhdGVGYWN0b3J5XG4gICAqIEByZXF1aXJlcyAkcm9vdFNjb3BlXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKi9cbiAgJGdldC4kaW5qZWN0ID0gWyckcm9vdFNjb3BlJywgJyR0ZW1wbGF0ZUZhY3RvcnknXTtcbiAgZnVuY3Rpb24gJGdldCggICAkcm9vdFNjb3BlLCAgICR0ZW1wbGF0ZUZhY3RvcnkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgLy8gJHZpZXcubG9hZCgnZnVsbC52aWV3TmFtZScsIHsgdGVtcGxhdGU6IC4uLiwgY29udHJvbGxlcjogLi4uLCByZXNvbHZlOiAuLi4sIGFzeW5jOiBmYWxzZSwgcGFyYW1zOiAuLi4gfSlcbiAgICAgIC8qKlxuICAgICAgICogQG5nZG9jIGZ1bmN0aW9uXG4gICAgICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHZpZXcjbG9hZFxuICAgICAgICogQG1ldGhvZE9mIHVpLnJvdXRlci5zdGF0ZS4kdmlld1xuICAgICAgICpcbiAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG5hbWVcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIG9wdGlvbiBvYmplY3QuXG4gICAgICAgKi9cbiAgICAgIGxvYWQ6IGZ1bmN0aW9uIGxvYWQobmFtZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgcmVzdWx0LCBkZWZhdWx0cyA9IHtcbiAgICAgICAgICB0ZW1wbGF0ZTogbnVsbCwgY29udHJvbGxlcjogbnVsbCwgdmlldzogbnVsbCwgbG9jYWxzOiBudWxsLCBub3RpZnk6IHRydWUsIGFzeW5jOiB0cnVlLCBwYXJhbXM6IHt9XG4gICAgICAgIH07XG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnZpZXcpIHtcbiAgICAgICAgICByZXN1bHQgPSAkdGVtcGxhdGVGYWN0b3J5LmZyb21Db25maWcob3B0aW9ucy52aWV3LCBvcHRpb25zLnBhcmFtcywgb3B0aW9ucy5sb2NhbHMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQgJiYgb3B0aW9ucy5ub3RpZnkpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBldmVudFxuICAgICAgICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlIyR2aWV3Q29udGVudExvYWRpbmdcbiAgICAgICAgICogQGV2ZW50T2YgdWkucm91dGVyLnN0YXRlLiR2aWV3XG4gICAgICAgICAqIEBldmVudFR5cGUgYnJvYWRjYXN0IG9uIHJvb3Qgc2NvcGVcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIEZpcmVkIG9uY2UgdGhlIHZpZXcgKipiZWdpbnMgbG9hZGluZyoqLCAqYmVmb3JlKiB0aGUgRE9NIGlzIHJlbmRlcmVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgRXZlbnQgb2JqZWN0LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmlld0NvbmZpZyBUaGUgdmlldyBjb25maWcgcHJvcGVydGllcyAodGVtcGxhdGUsIGNvbnRyb2xsZXIsIGV0YykuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqIDxwcmU+XG4gICAgICAgICAqICRzY29wZS4kb24oJyR2aWV3Q29udGVudExvYWRpbmcnLFxuICAgICAgICAgKiBmdW5jdGlvbihldmVudCwgdmlld0NvbmZpZyl7XG4gICAgICAgICAqICAgICAvLyBBY2Nlc3MgdG8gYWxsIHRoZSB2aWV3IGNvbmZpZyBwcm9wZXJ0aWVzLlxuICAgICAgICAgKiAgICAgLy8gYW5kIG9uZSBzcGVjaWFsIHByb3BlcnR5ICd0YXJnZXRWaWV3J1xuICAgICAgICAgKiAgICAgLy8gdmlld0NvbmZpZy50YXJnZXRWaWV3XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKiA8L3ByZT5cbiAgICAgICAgICovXG4gICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCckdmlld0NvbnRlbnRMb2FkaW5nJywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59XG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIuc3RhdGUnKS5wcm92aWRlcignJHZpZXcnLCAkVmlld1Byb3ZpZGVyKTtcblxuLyoqXG4gKiBAbmdkb2Mgb2JqZWN0XG4gKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHVpVmlld1Njcm9sbFByb3ZpZGVyXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBQcm92aWRlciB0aGF0IHJldHVybnMgdGhlIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHVpVmlld1Njcm9sbH0gc2VydmljZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gJFZpZXdTY3JvbGxQcm92aWRlcigpIHtcblxuICB2YXIgdXNlQW5jaG9yU2Nyb2xsID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSB1aS5yb3V0ZXIuc3RhdGUuJHVpVmlld1Njcm9sbFByb3ZpZGVyI3VzZUFuY2hvclNjcm9sbFxuICAgKiBAbWV0aG9kT2YgdWkucm91dGVyLnN0YXRlLiR1aVZpZXdTY3JvbGxQcm92aWRlclxuICAgKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogUmV2ZXJ0cyBiYWNrIHRvIHVzaW5nIHRoZSBjb3JlIFtgJGFuY2hvclNjcm9sbGBdKGh0dHA6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nLiRhbmNob3JTY3JvbGwpIHNlcnZpY2UgZm9yXG4gICAqIHNjcm9sbGluZyBiYXNlZCBvbiB0aGUgdXJsIGFuY2hvci5cbiAgICovXG4gIHRoaXMudXNlQW5jaG9yU2Nyb2xsID0gZnVuY3Rpb24gKCkge1xuICAgIHVzZUFuY2hvclNjcm9sbCA9IHRydWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBvYmplY3RcbiAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLiR1aVZpZXdTY3JvbGxcbiAgICpcbiAgICogQHJlcXVpcmVzICRhbmNob3JTY3JvbGxcbiAgICogQHJlcXVpcmVzICR0aW1lb3V0XG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBXaGVuIGNhbGxlZCB3aXRoIGEganFMaXRlIGVsZW1lbnQsIGl0IHNjcm9sbHMgdGhlIGVsZW1lbnQgaW50byB2aWV3IChhZnRlciBhXG4gICAqIGAkdGltZW91dGAgc28gdGhlIERPTSBoYXMgdGltZSB0byByZWZyZXNoKS5cbiAgICpcbiAgICogSWYgeW91IHByZWZlciB0byByZWx5IG9uIGAkYW5jaG9yU2Nyb2xsYCB0byBzY3JvbGwgdGhlIHZpZXcgdG8gdGhlIGFuY2hvcixcbiAgICogdGhpcyBjYW4gYmUgZW5hYmxlZCBieSBjYWxsaW5nIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHVpVmlld1Njcm9sbFByb3ZpZGVyI21ldGhvZHNfdXNlQW5jaG9yU2Nyb2xsIGAkdWlWaWV3U2Nyb2xsUHJvdmlkZXIudXNlQW5jaG9yU2Nyb2xsKClgfS5cbiAgICovXG4gIHRoaXMuJGdldCA9IFsnJGFuY2hvclNjcm9sbCcsICckdGltZW91dCcsIGZ1bmN0aW9uICgkYW5jaG9yU2Nyb2xsLCAkdGltZW91dCkge1xuICAgIGlmICh1c2VBbmNob3JTY3JvbGwpIHtcbiAgICAgIHJldHVybiAkYW5jaG9yU2Nyb2xsO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoJGVsZW1lbnQpIHtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJGVsZW1lbnRbMF0uc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgIH0sIDAsIGZhbHNlKTtcbiAgICB9O1xuICB9XTtcbn1cblxuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci5zdGF0ZScpLnByb3ZpZGVyKCckdWlWaWV3U2Nyb2xsJywgJFZpZXdTY3JvbGxQcm92aWRlcik7XG5cbi8qKlxuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgdWkucm91dGVyLnN0YXRlLmRpcmVjdGl2ZTp1aS12aWV3XG4gKlxuICogQHJlcXVpcmVzIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVcbiAqIEByZXF1aXJlcyAkY29tcGlsZVxuICogQHJlcXVpcmVzICRjb250cm9sbGVyXG4gKiBAcmVxdWlyZXMgJGluamVjdG9yXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnN0YXRlLiR1aVZpZXdTY3JvbGxcbiAqIEByZXF1aXJlcyAkZG9jdW1lbnRcbiAqXG4gKiBAcmVzdHJpY3QgRUNBXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBUaGUgdWktdmlldyBkaXJlY3RpdmUgdGVsbHMgJHN0YXRlIHdoZXJlIHRvIHBsYWNlIHlvdXIgdGVtcGxhdGVzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nPX0gdWktdmlldyBBIHZpZXcgbmFtZS4gVGhlIG5hbWUgc2hvdWxkIGJlIHVuaXF1ZSBhbW9uZ3N0IHRoZSBvdGhlciB2aWV3cyBpbiB0aGVcbiAqIHNhbWUgc3RhdGUuIFlvdSBjYW4gaGF2ZSB2aWV3cyBvZiB0aGUgc2FtZSBuYW1lIHRoYXQgbGl2ZSBpbiBkaWZmZXJlbnQgc3RhdGVzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nPX0gYXV0b3Njcm9sbCBJdCBhbGxvd3MgeW91IHRvIHNldCB0aGUgc2Nyb2xsIGJlaGF2aW9yIG9mIHRoZSBicm93c2VyIHdpbmRvd1xuICogd2hlbiBhIHZpZXcgaXMgcG9wdWxhdGVkLiBCeSBkZWZhdWx0LCAkYW5jaG9yU2Nyb2xsIGlzIG92ZXJyaWRkZW4gYnkgdWktcm91dGVyJ3MgY3VzdG9tIHNjcm9sbFxuICogc2VydmljZSwge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kdWlWaWV3U2Nyb2xsfS4gVGhpcyBjdXN0b20gc2VydmljZSBsZXQncyB5b3VcbiAqIHNjcm9sbCB1aS12aWV3IGVsZW1lbnRzIGludG8gdmlldyB3aGVuIHRoZXkgYXJlIHBvcHVsYXRlZCBkdXJpbmcgYSBzdGF0ZSBhY3RpdmF0aW9uLlxuICpcbiAqICpOb3RlOiBUbyByZXZlcnQgYmFjayB0byBvbGQgW2AkYW5jaG9yU2Nyb2xsYF0oaHR0cDovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmcuJGFuY2hvclNjcm9sbClcbiAqIGZ1bmN0aW9uYWxpdHksIGNhbGwgYCR1aVZpZXdTY3JvbGxQcm92aWRlci51c2VBbmNob3JTY3JvbGwoKWAuKlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nPX0gb25sb2FkIEV4cHJlc3Npb24gdG8gZXZhbHVhdGUgd2hlbmV2ZXIgdGhlIHZpZXcgdXBkYXRlcy5cbiAqIFxuICogQGV4YW1wbGVcbiAqIEEgdmlldyBjYW4gYmUgdW5uYW1lZCBvciBuYW1lZC4gXG4gKiA8cHJlPlxuICogPCEtLSBVbm5hbWVkIC0tPlxuICogPGRpdiB1aS12aWV3PjwvZGl2PiBcbiAqIFxuICogPCEtLSBOYW1lZCAtLT5cbiAqIDxkaXYgdWktdmlldz1cInZpZXdOYW1lXCI+PC9kaXY+XG4gKiA8L3ByZT5cbiAqXG4gKiBZb3UgY2FuIG9ubHkgaGF2ZSBvbmUgdW5uYW1lZCB2aWV3IHdpdGhpbiBhbnkgdGVtcGxhdGUgKG9yIHJvb3QgaHRtbCkuIElmIHlvdSBhcmUgb25seSB1c2luZyBhIFxuICogc2luZ2xlIHZpZXcgYW5kIGl0IGlzIHVubmFtZWQgdGhlbiB5b3UgY2FuIHBvcHVsYXRlIGl0IGxpa2Ugc286XG4gKiA8cHJlPlxuICogPGRpdiB1aS12aWV3PjwvZGl2PiBcbiAqICRzdGF0ZVByb3ZpZGVyLnN0YXRlKFwiaG9tZVwiLCB7XG4gKiAgIHRlbXBsYXRlOiBcIjxoMT5IRUxMTyE8L2gxPlwiXG4gKiB9KVxuICogPC9wcmU+XG4gKiBcbiAqIFRoZSBhYm92ZSBpcyBhIGNvbnZlbmllbnQgc2hvcnRjdXQgZXF1aXZhbGVudCB0byBzcGVjaWZ5aW5nIHlvdXIgdmlldyBleHBsaWNpdGx5IHdpdGggdGhlIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlUHJvdmlkZXIjdmlld3MgYHZpZXdzYH1cbiAqIGNvbmZpZyBwcm9wZXJ0eSwgYnkgbmFtZSwgaW4gdGhpcyBjYXNlIGFuIGVtcHR5IG5hbWU6XG4gKiA8cHJlPlxuICogJHN0YXRlUHJvdmlkZXIuc3RhdGUoXCJob21lXCIsIHtcbiAqICAgdmlld3M6IHtcbiAqICAgICBcIlwiOiB7XG4gKiAgICAgICB0ZW1wbGF0ZTogXCI8aDE+SEVMTE8hPC9oMT5cIlxuICogICAgIH1cbiAqICAgfSAgICBcbiAqIH0pXG4gKiA8L3ByZT5cbiAqIFxuICogQnV0IHR5cGljYWxseSB5b3UnbGwgb25seSB1c2UgdGhlIHZpZXdzIHByb3BlcnR5IGlmIHlvdSBuYW1lIHlvdXIgdmlldyBvciBoYXZlIG1vcmUgdGhhbiBvbmUgdmlldyBcbiAqIGluIHRoZSBzYW1lIHRlbXBsYXRlLiBUaGVyZSdzIG5vdCByZWFsbHkgYSBjb21wZWxsaW5nIHJlYXNvbiB0byBuYW1lIGEgdmlldyBpZiBpdHMgdGhlIG9ubHkgb25lLCBcbiAqIGJ1dCB5b3UgY291bGQgaWYgeW91IHdhbnRlZCwgbGlrZSBzbzpcbiAqIDxwcmU+XG4gKiA8ZGl2IHVpLXZpZXc9XCJtYWluXCI+PC9kaXY+XG4gKiA8L3ByZT4gXG4gKiA8cHJlPlxuICogJHN0YXRlUHJvdmlkZXIuc3RhdGUoXCJob21lXCIsIHtcbiAqICAgdmlld3M6IHtcbiAqICAgICBcIm1haW5cIjoge1xuICogICAgICAgdGVtcGxhdGU6IFwiPGgxPkhFTExPITwvaDE+XCJcbiAqICAgICB9XG4gKiAgIH0gICAgXG4gKiB9KVxuICogPC9wcmU+XG4gKiBcbiAqIFJlYWxseSB0aG91Z2gsIHlvdSdsbCB1c2Ugdmlld3MgdG8gc2V0IHVwIG11bHRpcGxlIHZpZXdzOlxuICogPHByZT5cbiAqIDxkaXYgdWktdmlldz48L2Rpdj5cbiAqIDxkaXYgdWktdmlldz1cImNoYXJ0XCI+PC9kaXY+IFxuICogPGRpdiB1aS12aWV3PVwiZGF0YVwiPjwvZGl2PiBcbiAqIDwvcHJlPlxuICogXG4gKiA8cHJlPlxuICogJHN0YXRlUHJvdmlkZXIuc3RhdGUoXCJob21lXCIsIHtcbiAqICAgdmlld3M6IHtcbiAqICAgICBcIlwiOiB7XG4gKiAgICAgICB0ZW1wbGF0ZTogXCI8aDE+SEVMTE8hPC9oMT5cIlxuICogICAgIH0sXG4gKiAgICAgXCJjaGFydFwiOiB7XG4gKiAgICAgICB0ZW1wbGF0ZTogXCI8Y2hhcnRfdGhpbmcvPlwiXG4gKiAgICAgfSxcbiAqICAgICBcImRhdGFcIjoge1xuICogICAgICAgdGVtcGxhdGU6IFwiPGRhdGFfdGhpbmcvPlwiXG4gKiAgICAgfVxuICogICB9ICAgIFxuICogfSlcbiAqIDwvcHJlPlxuICpcbiAqIEV4YW1wbGVzIGZvciBgYXV0b3Njcm9sbGA6XG4gKlxuICogPHByZT5cbiAqIDwhLS0gSWYgYXV0b3Njcm9sbCBwcmVzZW50IHdpdGggbm8gZXhwcmVzc2lvbixcbiAqICAgICAgdGhlbiBzY3JvbGwgdWktdmlldyBpbnRvIHZpZXcgLS0+XG4gKiA8dWktdmlldyBhdXRvc2Nyb2xsLz5cbiAqXG4gKiA8IS0tIElmIGF1dG9zY3JvbGwgcHJlc2VudCB3aXRoIHZhbGlkIGV4cHJlc3Npb24sXG4gKiAgICAgIHRoZW4gc2Nyb2xsIHVpLXZpZXcgaW50byB2aWV3IGlmIGV4cHJlc3Npb24gZXZhbHVhdGVzIHRvIHRydWUgLS0+XG4gKiA8dWktdmlldyBhdXRvc2Nyb2xsPSd0cnVlJy8+XG4gKiA8dWktdmlldyBhdXRvc2Nyb2xsPSdmYWxzZScvPlxuICogPHVpLXZpZXcgYXV0b3Njcm9sbD0nc2NvcGVWYXJpYWJsZScvPlxuICogPC9wcmU+XG4gKi9cbiRWaWV3RGlyZWN0aXZlLiRpbmplY3QgPSBbJyRzdGF0ZScsICckaW5qZWN0b3InLCAnJHVpVmlld1Njcm9sbCddO1xuZnVuY3Rpb24gJFZpZXdEaXJlY3RpdmUoICAgJHN0YXRlLCAgICRpbmplY3RvciwgICAkdWlWaWV3U2Nyb2xsKSB7XG5cbiAgZnVuY3Rpb24gZ2V0U2VydmljZSgpIHtcbiAgICByZXR1cm4gKCRpbmplY3Rvci5oYXMpID8gZnVuY3Rpb24oc2VydmljZSkge1xuICAgICAgcmV0dXJuICRpbmplY3Rvci5oYXMoc2VydmljZSkgPyAkaW5qZWN0b3IuZ2V0KHNlcnZpY2UpIDogbnVsbDtcbiAgICB9IDogZnVuY3Rpb24oc2VydmljZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoc2VydmljZSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICB2YXIgc2VydmljZSA9IGdldFNlcnZpY2UoKSxcbiAgICAgICRhbmltYXRvciA9IHNlcnZpY2UoJyRhbmltYXRvcicpLFxuICAgICAgJGFuaW1hdGUgPSBzZXJ2aWNlKCckYW5pbWF0ZScpO1xuXG4gIC8vIFJldHVybnMgYSBzZXQgb2YgRE9NIG1hbmlwdWxhdGlvbiBmdW5jdGlvbnMgYmFzZWQgb24gd2hpY2ggQW5ndWxhciB2ZXJzaW9uXG4gIC8vIGl0IHNob3VsZCB1c2VcbiAgZnVuY3Rpb24gZ2V0UmVuZGVyZXIoYXR0cnMsIHNjb3BlKSB7XG4gICAgdmFyIHN0YXRpY3MgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGVudGVyOiBmdW5jdGlvbiAoZWxlbWVudCwgdGFyZ2V0LCBjYikgeyB0YXJnZXQuYWZ0ZXIoZWxlbWVudCk7IGNiKCk7IH0sXG4gICAgICAgIGxlYXZlOiBmdW5jdGlvbiAoZWxlbWVudCwgY2IpIHsgZWxlbWVudC5yZW1vdmUoKTsgY2IoKTsgfVxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgaWYgKCRhbmltYXRlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBlbnRlcjogZnVuY3Rpb24oZWxlbWVudCwgdGFyZ2V0LCBjYikgeyAkYW5pbWF0ZS5lbnRlcihlbGVtZW50LCBudWxsLCB0YXJnZXQsIGNiKTsgfSxcbiAgICAgICAgbGVhdmU6IGZ1bmN0aW9uKGVsZW1lbnQsIGNiKSB7ICRhbmltYXRlLmxlYXZlKGVsZW1lbnQsIGNiKTsgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoJGFuaW1hdG9yKSB7XG4gICAgICB2YXIgYW5pbWF0ZSA9ICRhbmltYXRvciAmJiAkYW5pbWF0b3Ioc2NvcGUsIGF0dHJzKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZW50ZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIHRhcmdldCwgY2IpIHthbmltYXRlLmVudGVyKGVsZW1lbnQsIG51bGwsIHRhcmdldCk7IGNiKCk7IH0sXG4gICAgICAgIGxlYXZlOiBmdW5jdGlvbihlbGVtZW50LCBjYikgeyBhbmltYXRlLmxlYXZlKGVsZW1lbnQpOyBjYigpOyB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBzdGF0aWNzKCk7XG4gIH1cblxuICB2YXIgZGlyZWN0aXZlID0ge1xuICAgIHJlc3RyaWN0OiAnRUNBJyxcbiAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICBwcmlvcml0eTogNDAwLFxuICAgIHRyYW5zY2x1ZGU6ICdlbGVtZW50JyxcbiAgICBjb21waWxlOiBmdW5jdGlvbiAodEVsZW1lbnQsIHRBdHRycywgJHRyYW5zY2x1ZGUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoc2NvcGUsICRlbGVtZW50LCBhdHRycykge1xuICAgICAgICB2YXIgcHJldmlvdXNFbCwgY3VycmVudEVsLCBjdXJyZW50U2NvcGUsIGxhdGVzdExvY2FscyxcbiAgICAgICAgICAgIG9ubG9hZEV4cCAgICAgPSBhdHRycy5vbmxvYWQgfHwgJycsXG4gICAgICAgICAgICBhdXRvU2Nyb2xsRXhwID0gYXR0cnMuYXV0b3Njcm9sbCxcbiAgICAgICAgICAgIHJlbmRlcmVyICAgICAgPSBnZXRSZW5kZXJlcihhdHRycywgc2NvcGUpO1xuXG4gICAgICAgIHNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHVwZGF0ZVZpZXcoZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdXBkYXRlVmlldyhmYWxzZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHVwZGF0ZVZpZXcodHJ1ZSk7XG5cbiAgICAgICAgZnVuY3Rpb24gY2xlYW51cExhc3RWaWV3KCkge1xuICAgICAgICAgIGlmIChwcmV2aW91c0VsKSB7XG4gICAgICAgICAgICBwcmV2aW91c0VsLnJlbW92ZSgpO1xuICAgICAgICAgICAgcHJldmlvdXNFbCA9IG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGN1cnJlbnRTY29wZSkge1xuICAgICAgICAgICAgY3VycmVudFNjb3BlLiRkZXN0cm95KCk7XG4gICAgICAgICAgICBjdXJyZW50U2NvcGUgPSBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjdXJyZW50RWwpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLmxlYXZlKGN1cnJlbnRFbCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHByZXZpb3VzRWwgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHByZXZpb3VzRWwgPSBjdXJyZW50RWw7XG4gICAgICAgICAgICBjdXJyZW50RWwgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVZpZXcoZmlyc3RUaW1lKSB7XG4gICAgICAgICAgdmFyIG5ld1Njb3BlICAgICAgICA9IHNjb3BlLiRuZXcoKSxcbiAgICAgICAgICAgICAgbmFtZSAgICAgICAgICAgID0gY3VycmVudEVsICYmIGN1cnJlbnRFbC5kYXRhKCckdWlWaWV3TmFtZScpLFxuICAgICAgICAgICAgICBwcmV2aW91c0xvY2FscyAgPSBuYW1lICYmICRzdGF0ZS4kY3VycmVudCAmJiAkc3RhdGUuJGN1cnJlbnQubG9jYWxzW25hbWVdO1xuXG4gICAgICAgICAgaWYgKCFmaXJzdFRpbWUgJiYgcHJldmlvdXNMb2NhbHMgPT09IGxhdGVzdExvY2FscykgcmV0dXJuOyAvLyBub3RoaW5nIHRvIGRvXG5cbiAgICAgICAgICB2YXIgY2xvbmUgPSAkdHJhbnNjbHVkZShuZXdTY29wZSwgZnVuY3Rpb24oY2xvbmUpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLmVudGVyKGNsb25lLCAkZWxlbWVudCwgZnVuY3Rpb24gb25VaVZpZXdFbnRlcigpIHtcbiAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGF1dG9TY3JvbGxFeHApICYmICFhdXRvU2Nyb2xsRXhwIHx8IHNjb3BlLiRldmFsKGF1dG9TY3JvbGxFeHApKSB7XG4gICAgICAgICAgICAgICAgJHVpVmlld1Njcm9sbChjbG9uZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2xlYW51cExhc3RWaWV3KCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBsYXRlc3RMb2NhbHMgPSAkc3RhdGUuJGN1cnJlbnQubG9jYWxzW2Nsb25lLmRhdGEoJyR1aVZpZXdOYW1lJyldO1xuXG4gICAgICAgICAgY3VycmVudEVsID0gY2xvbmU7XG4gICAgICAgICAgY3VycmVudFNjb3BlID0gbmV3U2NvcGU7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQG5nZG9jIGV2ZW50XG4gICAgICAgICAgICogQG5hbWUgdWkucm91dGVyLnN0YXRlLmRpcmVjdGl2ZTp1aS12aWV3IyR2aWV3Q29udGVudExvYWRlZFxuICAgICAgICAgICAqIEBldmVudE9mIHVpLnJvdXRlci5zdGF0ZS5kaXJlY3RpdmU6dWktdmlld1xuICAgICAgICAgICAqIEBldmVudFR5cGUgZW1pdHMgb24gdWktdmlldyBkaXJlY3RpdmUgc2NvcGVcbiAgICAgICAgICAgKiBAZGVzY3JpcHRpb24gICAgICAgICAgICpcbiAgICAgICAgICAgKiBGaXJlZCBvbmNlIHRoZSB2aWV3IGlzICoqbG9hZGVkKiosICphZnRlciogdGhlIERPTSBpcyByZW5kZXJlZC5cbiAgICAgICAgICAgKlxuICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCBFdmVudCBvYmplY3QuXG4gICAgICAgICAgICovXG4gICAgICAgICAgY3VycmVudFNjb3BlLiRlbWl0KCckdmlld0NvbnRlbnRMb2FkZWQnKTtcbiAgICAgICAgICBjdXJyZW50U2NvcGUuJGV2YWwob25sb2FkRXhwKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuJFZpZXdEaXJlY3RpdmVGaWxsLiRpbmplY3QgPSBbJyRjb21waWxlJywgJyRjb250cm9sbGVyJywgJyRzdGF0ZSddO1xuZnVuY3Rpb24gJFZpZXdEaXJlY3RpdmVGaWxsICgkY29tcGlsZSwgJGNvbnRyb2xsZXIsICRzdGF0ZSkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRUNBJyxcbiAgICBwcmlvcml0eTogLTQwMCxcbiAgICBjb21waWxlOiBmdW5jdGlvbiAodEVsZW1lbnQpIHtcbiAgICAgIHZhciBpbml0aWFsID0gdEVsZW1lbnQuaHRtbCgpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzY29wZSwgJGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIHZhciBuYW1lICAgICAgPSBhdHRycy51aVZpZXcgfHwgYXR0cnMubmFtZSB8fCAnJyxcbiAgICAgICAgICAgIGluaGVyaXRlZCA9ICRlbGVtZW50LmluaGVyaXRlZERhdGEoJyR1aVZpZXcnKTtcblxuICAgICAgICBpZiAobmFtZS5pbmRleE9mKCdAJykgPCAwKSB7XG4gICAgICAgICAgbmFtZSA9IG5hbWUgKyAnQCcgKyAoaW5oZXJpdGVkID8gaW5oZXJpdGVkLnN0YXRlLm5hbWUgOiAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICAkZWxlbWVudC5kYXRhKCckdWlWaWV3TmFtZScsIG5hbWUpO1xuXG4gICAgICAgIHZhciBjdXJyZW50ID0gJHN0YXRlLiRjdXJyZW50LFxuICAgICAgICAgICAgbG9jYWxzICA9IGN1cnJlbnQgJiYgY3VycmVudC5sb2NhbHNbbmFtZV07XG5cbiAgICAgICAgaWYgKCEgbG9jYWxzKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgJGVsZW1lbnQuZGF0YSgnJHVpVmlldycsIHsgbmFtZTogbmFtZSwgc3RhdGU6IGxvY2Fscy4kJHN0YXRlIH0pO1xuICAgICAgICAkZWxlbWVudC5odG1sKGxvY2Fscy4kdGVtcGxhdGUgPyBsb2NhbHMuJHRlbXBsYXRlIDogaW5pdGlhbCk7XG5cbiAgICAgICAgdmFyIGxpbmsgPSAkY29tcGlsZSgkZWxlbWVudC5jb250ZW50cygpKTtcblxuICAgICAgICBpZiAobG9jYWxzLiQkY29udHJvbGxlcikge1xuICAgICAgICAgIGxvY2Fscy4kc2NvcGUgPSBzY29wZTtcbiAgICAgICAgICB2YXIgY29udHJvbGxlciA9ICRjb250cm9sbGVyKGxvY2Fscy4kJGNvbnRyb2xsZXIsIGxvY2Fscyk7XG4gICAgICAgICAgaWYgKGxvY2Fscy4kJGNvbnRyb2xsZXJBcykge1xuICAgICAgICAgICAgc2NvcGVbbG9jYWxzLiQkY29udHJvbGxlckFzXSA9IGNvbnRyb2xsZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgICRlbGVtZW50LmRhdGEoJyRuZ0NvbnRyb2xsZXJDb250cm9sbGVyJywgY29udHJvbGxlcik7XG4gICAgICAgICAgJGVsZW1lbnQuY2hpbGRyZW4oKS5kYXRhKCckbmdDb250cm9sbGVyQ29udHJvbGxlcicsIGNvbnRyb2xsZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGluayhzY29wZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn1cblxuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci5zdGF0ZScpLmRpcmVjdGl2ZSgndWlWaWV3JywgJFZpZXdEaXJlY3RpdmUpO1xuYW5ndWxhci5tb2R1bGUoJ3VpLnJvdXRlci5zdGF0ZScpLmRpcmVjdGl2ZSgndWlWaWV3JywgJFZpZXdEaXJlY3RpdmVGaWxsKTtcblxuZnVuY3Rpb24gcGFyc2VTdGF0ZVJlZihyZWYpIHtcbiAgdmFyIHBhcnNlZCA9IHJlZi5yZXBsYWNlKC9cXG4vZywgXCIgXCIpLm1hdGNoKC9eKFteKF0rPylcXHMqKFxcKCguKilcXCkpPyQvKTtcbiAgaWYgKCFwYXJzZWQgfHwgcGFyc2VkLmxlbmd0aCAhPT0gNCkgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzdGF0ZSByZWYgJ1wiICsgcmVmICsgXCInXCIpO1xuICByZXR1cm4geyBzdGF0ZTogcGFyc2VkWzFdLCBwYXJhbUV4cHI6IHBhcnNlZFszXSB8fCBudWxsIH07XG59XG5cbmZ1bmN0aW9uIHN0YXRlQ29udGV4dChlbCkge1xuICB2YXIgc3RhdGVEYXRhID0gZWwucGFyZW50KCkuaW5oZXJpdGVkRGF0YSgnJHVpVmlldycpO1xuXG4gIGlmIChzdGF0ZURhdGEgJiYgc3RhdGVEYXRhLnN0YXRlICYmIHN0YXRlRGF0YS5zdGF0ZS5uYW1lKSB7XG4gICAgcmV0dXJuIHN0YXRlRGF0YS5zdGF0ZTtcbiAgfVxufVxuXG4vKipcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS5kaXJlY3RpdmU6dWktc3JlZlxuICpcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXG4gKiBAcmVxdWlyZXMgJHRpbWVvdXRcbiAqXG4gKiBAcmVzdHJpY3QgQVxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogQSBkaXJlY3RpdmUgdGhhdCBiaW5kcyBhIGxpbmsgKGA8YT5gIHRhZykgdG8gYSBzdGF0ZS4gSWYgdGhlIHN0YXRlIGhhcyBhbiBhc3NvY2lhdGVkIFxuICogVVJMLCB0aGUgZGlyZWN0aXZlIHdpbGwgYXV0b21hdGljYWxseSBnZW5lcmF0ZSAmIHVwZGF0ZSB0aGUgYGhyZWZgIGF0dHJpYnV0ZSB2aWEgXG4gKiB0aGUge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjbWV0aG9kc19ocmVmICRzdGF0ZS5ocmVmKCl9IG1ldGhvZC4gQ2xpY2tpbmcgXG4gKiB0aGUgbGluayB3aWxsIHRyaWdnZXIgYSBzdGF0ZSB0cmFuc2l0aW9uIHdpdGggb3B0aW9uYWwgcGFyYW1ldGVycy4gXG4gKlxuICogQWxzbyBtaWRkbGUtY2xpY2tpbmcsIHJpZ2h0LWNsaWNraW5nLCBhbmQgY3RybC1jbGlja2luZyBvbiB0aGUgbGluayB3aWxsIGJlIFxuICogaGFuZGxlZCBuYXRpdmVseSBieSB0aGUgYnJvd3Nlci5cbiAqXG4gKiBZb3UgY2FuIGFsc28gdXNlIHJlbGF0aXZlIHN0YXRlIHBhdGhzIHdpdGhpbiB1aS1zcmVmLCBqdXN0IGxpa2UgdGhlIHJlbGF0aXZlIFxuICogcGF0aHMgcGFzc2VkIHRvIGAkc3RhdGUuZ28oKWAuIFlvdSBqdXN0IG5lZWQgdG8gYmUgYXdhcmUgdGhhdCB0aGUgcGF0aCBpcyByZWxhdGl2ZVxuICogdG8gdGhlIHN0YXRlIHRoYXQgdGhlIGxpbmsgbGl2ZXMgaW4sIGluIG90aGVyIHdvcmRzIHRoZSBzdGF0ZSB0aGF0IGxvYWRlZCB0aGUgXG4gKiB0ZW1wbGF0ZSBjb250YWluaW5nIHRoZSBsaW5rLlxuICpcbiAqIFlvdSBjYW4gc3BlY2lmeSBvcHRpb25zIHRvIHBhc3MgdG8ge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGUjZ28gJHN0YXRlLmdvKCl9XG4gKiB1c2luZyB0aGUgYHVpLXNyZWYtb3B0c2AgYXR0cmlidXRlLiBPcHRpb25zIGFyZSByZXN0cmljdGVkIHRvIGBsb2NhdGlvbmAsIGBpbmhlcml0YCxcbiAqIGFuZCBgcmVsb2FkYC5cbiAqXG4gKiBAZXhhbXBsZVxuICogSGVyZSdzIGFuIGV4YW1wbGUgb2YgaG93IHlvdSdkIHVzZSB1aS1zcmVmIGFuZCBob3cgaXQgd291bGQgY29tcGlsZS4gSWYgeW91IGhhdmUgdGhlIFxuICogZm9sbG93aW5nIHRlbXBsYXRlOlxuICogPHByZT5cbiAqIDxhIHVpLXNyZWY9XCJob21lXCI+SG9tZTwvYT4gfCA8YSB1aS1zcmVmPVwiYWJvdXRcIj5BYm91dDwvYT5cbiAqIFxuICogPHVsPlxuICogICAgIDxsaSBuZy1yZXBlYXQ9XCJjb250YWN0IGluIGNvbnRhY3RzXCI+XG4gKiAgICAgICAgIDxhIHVpLXNyZWY9XCJjb250YWN0cy5kZXRhaWwoeyBpZDogY29udGFjdC5pZCB9KVwiPnt7IGNvbnRhY3QubmFtZSB9fTwvYT5cbiAqICAgICA8L2xpPlxuICogPC91bD5cbiAqIDwvcHJlPlxuICogXG4gKiBUaGVuIHRoZSBjb21waWxlZCBodG1sIHdvdWxkIGJlIChhc3N1bWluZyBIdG1sNU1vZGUgaXMgb2ZmKTpcbiAqIDxwcmU+XG4gKiA8YSBocmVmPVwiIy9ob21lXCIgdWktc3JlZj1cImhvbWVcIj5Ib21lPC9hPiB8IDxhIGhyZWY9XCIjL2Fib3V0XCIgdWktc3JlZj1cImFib3V0XCI+QWJvdXQ8L2E+XG4gKiBcbiAqIDx1bD5cbiAqICAgICA8bGkgbmctcmVwZWF0PVwiY29udGFjdCBpbiBjb250YWN0c1wiPlxuICogICAgICAgICA8YSBocmVmPVwiIy9jb250YWN0cy8xXCIgdWktc3JlZj1cImNvbnRhY3RzLmRldGFpbCh7IGlkOiBjb250YWN0LmlkIH0pXCI+Sm9lPC9hPlxuICogICAgIDwvbGk+XG4gKiAgICAgPGxpIG5nLXJlcGVhdD1cImNvbnRhY3QgaW4gY29udGFjdHNcIj5cbiAqICAgICAgICAgPGEgaHJlZj1cIiMvY29udGFjdHMvMlwiIHVpLXNyZWY9XCJjb250YWN0cy5kZXRhaWwoeyBpZDogY29udGFjdC5pZCB9KVwiPkFsaWNlPC9hPlxuICogICAgIDwvbGk+XG4gKiAgICAgPGxpIG5nLXJlcGVhdD1cImNvbnRhY3QgaW4gY29udGFjdHNcIj5cbiAqICAgICAgICAgPGEgaHJlZj1cIiMvY29udGFjdHMvM1wiIHVpLXNyZWY9XCJjb250YWN0cy5kZXRhaWwoeyBpZDogY29udGFjdC5pZCB9KVwiPkJvYjwvYT5cbiAqICAgICA8L2xpPlxuICogPC91bD5cbiAqXG4gKiA8YSB1aS1zcmVmPVwiaG9tZVwiIHVpLXNyZWYtb3B0cz1cIntyZWxvYWQ6IHRydWV9XCI+SG9tZTwvYT5cbiAqIDwvcHJlPlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB1aS1zcmVmICdzdGF0ZU5hbWUnIGNhbiBiZSBhbnkgdmFsaWQgYWJzb2x1dGUgb3IgcmVsYXRpdmUgc3RhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSB1aS1zcmVmLW9wdHMgb3B0aW9ucyB0byBwYXNzIHRvIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI2dvICRzdGF0ZS5nbygpfVxuICovXG4kU3RhdGVSZWZEaXJlY3RpdmUuJGluamVjdCA9IFsnJHN0YXRlJywgJyR0aW1lb3V0J107XG5mdW5jdGlvbiAkU3RhdGVSZWZEaXJlY3RpdmUoJHN0YXRlLCAkdGltZW91dCkge1xuICB2YXIgYWxsb3dlZE9wdGlvbnMgPSBbJ2xvY2F0aW9uJywgJ2luaGVyaXQnLCAncmVsb2FkJ107XG5cbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHJlcXVpcmU6ICc/XnVpU3JlZkFjdGl2ZScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB1aVNyZWZBY3RpdmUpIHtcbiAgICAgIHZhciByZWYgPSBwYXJzZVN0YXRlUmVmKGF0dHJzLnVpU3JlZik7XG4gICAgICB2YXIgcGFyYW1zID0gbnVsbCwgdXJsID0gbnVsbCwgYmFzZSA9IHN0YXRlQ29udGV4dChlbGVtZW50KSB8fCAkc3RhdGUuJGN1cnJlbnQ7XG4gICAgICB2YXIgaXNGb3JtID0gZWxlbWVudFswXS5ub2RlTmFtZSA9PT0gXCJGT1JNXCI7XG4gICAgICB2YXIgYXR0ciA9IGlzRm9ybSA/IFwiYWN0aW9uXCIgOiBcImhyZWZcIiwgbmF2ID0gdHJ1ZTtcblxuICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgIHJlbGF0aXZlOiBiYXNlXG4gICAgICB9O1xuICAgICAgdmFyIG9wdGlvbnNPdmVycmlkZSA9IHNjb3BlLiRldmFsKGF0dHJzLnVpU3JlZk9wdHMpIHx8IHt9O1xuICAgICAgYW5ndWxhci5mb3JFYWNoKGFsbG93ZWRPcHRpb25zLCBmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgICAgaWYgKG9wdGlvbiBpbiBvcHRpb25zT3ZlcnJpZGUpIHtcbiAgICAgICAgICBvcHRpb25zW29wdGlvbl0gPSBvcHRpb25zT3ZlcnJpZGVbb3B0aW9uXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbihuZXdWYWwpIHtcbiAgICAgICAgaWYgKG5ld1ZhbCkgcGFyYW1zID0gbmV3VmFsO1xuICAgICAgICBpZiAoIW5hdikgcmV0dXJuO1xuXG4gICAgICAgIHZhciBuZXdIcmVmID0gJHN0YXRlLmhyZWYocmVmLnN0YXRlLCBwYXJhbXMsIG9wdGlvbnMpO1xuXG4gICAgICAgIGlmICh1aVNyZWZBY3RpdmUpIHtcbiAgICAgICAgICB1aVNyZWZBY3RpdmUuJCRzZXRTdGF0ZUluZm8ocmVmLnN0YXRlLCBwYXJhbXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbmV3SHJlZikge1xuICAgICAgICAgIG5hdiA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50WzBdW2F0dHJdID0gbmV3SHJlZjtcbiAgICAgIH07XG5cbiAgICAgIGlmIChyZWYucGFyYW1FeHByKSB7XG4gICAgICAgIHNjb3BlLiR3YXRjaChyZWYucGFyYW1FeHByLCBmdW5jdGlvbihuZXdWYWwsIG9sZFZhbCkge1xuICAgICAgICAgIGlmIChuZXdWYWwgIT09IHBhcmFtcykgdXBkYXRlKG5ld1ZhbCk7XG4gICAgICAgIH0sIHRydWUpO1xuICAgICAgICBwYXJhbXMgPSBzY29wZS4kZXZhbChyZWYucGFyYW1FeHByKTtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZSgpO1xuXG4gICAgICBpZiAoaXNGb3JtKSByZXR1cm47XG5cbiAgICAgIGVsZW1lbnQuYmluZChcImNsaWNrXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGJ1dHRvbiA9IGUud2hpY2ggfHwgZS5idXR0b247XG4gICAgICAgIGlmICggIShidXR0b24gPiAxIHx8IGUuY3RybEtleSB8fCBlLm1ldGFLZXkgfHwgZS5zaGlmdEtleSB8fCBlbGVtZW50LmF0dHIoJ3RhcmdldCcpKSApIHtcbiAgICAgICAgICAvLyBIQUNLOiBUaGlzIGlzIHRvIGFsbG93IG5nLWNsaWNrcyB0byBiZSBwcm9jZXNzZWQgYmVmb3JlIHRoZSB0cmFuc2l0aW9uIGlzIGluaXRpYXRlZDpcbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbyhyZWYuc3RhdGUsIHBhcmFtcywgb3B0aW9ucyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgdWkucm91dGVyLnN0YXRlLmRpcmVjdGl2ZTp1aS1zcmVmLWFjdGl2ZVxuICpcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVBhcmFtc1xuICogQHJlcXVpcmVzICRpbnRlcnBvbGF0ZVxuICpcbiAqIEByZXN0cmljdCBBXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBBIGRpcmVjdGl2ZSB3b3JraW5nIGFsb25nc2lkZSB1aS1zcmVmIHRvIGFkZCBjbGFzc2VzIHRvIGFuIGVsZW1lbnQgd2hlbiB0aGUgXG4gKiByZWxhdGVkIHVpLXNyZWYgZGlyZWN0aXZlJ3Mgc3RhdGUgaXMgYWN0aXZlLCBhbmQgcmVtb3ZpbmcgdGhlbSB3aGVuIGl0IGlzIGluYWN0aXZlLlxuICogVGhlIHByaW1hcnkgdXNlLWNhc2UgaXMgdG8gc2ltcGxpZnkgdGhlIHNwZWNpYWwgYXBwZWFyYW5jZSBvZiBuYXZpZ2F0aW9uIG1lbnVzIFxuICogcmVseWluZyBvbiBgdWktc3JlZmAsIGJ5IGhhdmluZyB0aGUgXCJhY3RpdmVcIiBzdGF0ZSdzIG1lbnUgYnV0dG9uIGFwcGVhciBkaWZmZXJlbnQsXG4gKiBkaXN0aW5ndWlzaGluZyBpdCBmcm9tIHRoZSBpbmFjdGl2ZSBtZW51IGl0ZW1zLlxuICpcbiAqIEBleGFtcGxlXG4gKiBHaXZlbiB0aGUgZm9sbG93aW5nIHRlbXBsYXRlOlxuICogPHByZT5cbiAqIDx1bD5cbiAqICAgPGxpIHVpLXNyZWYtYWN0aXZlPVwiYWN0aXZlXCIgY2xhc3M9XCJpdGVtXCI+XG4gKiAgICAgPGEgaHJlZiB1aS1zcmVmPVwiYXBwLnVzZXIoe3VzZXI6ICdiaWxib2JhZ2dpbnMnfSlcIj5AYmlsYm9iYWdnaW5zPC9hPlxuICogICA8L2xpPlxuICogPC91bD5cbiAqIDwvcHJlPlxuICogXG4gKiBXaGVuIHRoZSBhcHAgc3RhdGUgaXMgXCJhcHAudXNlclwiLCBhbmQgY29udGFpbnMgdGhlIHN0YXRlIHBhcmFtZXRlciBcInVzZXJcIiB3aXRoIHZhbHVlIFwiYmlsYm9iYWdnaW5zXCIsIFxuICogdGhlIHJlc3VsdGluZyBIVE1MIHdpbGwgYXBwZWFyIGFzIChub3RlIHRoZSAnYWN0aXZlJyBjbGFzcyk6XG4gKiA8cHJlPlxuICogPHVsPlxuICogICA8bGkgdWktc3JlZi1hY3RpdmU9XCJhY3RpdmVcIiBjbGFzcz1cIml0ZW0gYWN0aXZlXCI+XG4gKiAgICAgPGEgdWktc3JlZj1cImFwcC51c2VyKHt1c2VyOiAnYmlsYm9iYWdnaW5zJ30pXCIgaHJlZj1cIi91c2Vycy9iaWxib2JhZ2dpbnNcIj5AYmlsYm9iYWdnaW5zPC9hPlxuICogICA8L2xpPlxuICogPC91bD5cbiAqIDwvcHJlPlxuICogXG4gKiBUaGUgY2xhc3MgbmFtZSBpcyBpbnRlcnBvbGF0ZWQgKipvbmNlKiogZHVyaW5nIHRoZSBkaXJlY3RpdmVzIGxpbmsgdGltZSAoYW55IGZ1cnRoZXIgY2hhbmdlcyB0byB0aGUgXG4gKiBpbnRlcnBvbGF0ZWQgdmFsdWUgYXJlIGlnbm9yZWQpLiBcbiAqIFxuICogTXVsdGlwbGUgY2xhc3NlcyBtYXkgYmUgc3BlY2lmaWVkIGluIGEgc3BhY2Utc2VwYXJhdGVkIGZvcm1hdDpcbiAqIDxwcmU+XG4gKiA8dWw+XG4gKiAgIDxsaSB1aS1zcmVmLWFjdGl2ZT0nY2xhc3MxIGNsYXNzMiBjbGFzczMnPlxuICogICAgIDxhIHVpLXNyZWY9XCJhcHAudXNlclwiPmxpbms8L2E+XG4gKiAgIDwvbGk+XG4gKiA8L3VsPlxuICogPC9wcmU+XG4gKi9cbiRTdGF0ZUFjdGl2ZURpcmVjdGl2ZS4kaW5qZWN0ID0gWyckc3RhdGUnLCAnJHN0YXRlUGFyYW1zJywgJyRpbnRlcnBvbGF0ZSddO1xuZnVuY3Rpb24gJFN0YXRlQWN0aXZlRGlyZWN0aXZlKCRzdGF0ZSwgJHN0YXRlUGFyYW1zLCAkaW50ZXJwb2xhdGUpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogXCJBXCIsXG4gICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJGVsZW1lbnQnLCAnJGF0dHJzJywgZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzKSB7XG4gICAgICB2YXIgc3RhdGUsIHBhcmFtcywgYWN0aXZlQ2xhc3M7XG5cbiAgICAgIC8vIFRoZXJlIHByb2JhYmx5IGlzbid0IG11Y2ggcG9pbnQgaW4gJG9ic2VydmluZyB0aGlzXG4gICAgICBhY3RpdmVDbGFzcyA9ICRpbnRlcnBvbGF0ZSgkYXR0cnMudWlTcmVmQWN0aXZlIHx8ICcnLCBmYWxzZSkoJHNjb3BlKTtcblxuICAgICAgLy8gQWxsb3cgdWlTcmVmIHRvIGNvbW11bmljYXRlIHdpdGggdWlTcmVmQWN0aXZlXG4gICAgICB0aGlzLiQkc2V0U3RhdGVJbmZvID0gZnVuY3Rpb24obmV3U3RhdGUsIG5ld1BhcmFtcykge1xuICAgICAgICBzdGF0ZSA9ICRzdGF0ZS5nZXQobmV3U3RhdGUsIHN0YXRlQ29udGV4dCgkZWxlbWVudCkpO1xuICAgICAgICBwYXJhbXMgPSBuZXdQYXJhbXM7XG4gICAgICAgIHVwZGF0ZSgpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIHVwZGF0ZSk7XG5cbiAgICAgIC8vIFVwZGF0ZSByb3V0ZSBzdGF0ZVxuICAgICAgZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgICAgICBpZiAoJHN0YXRlLiRjdXJyZW50LnNlbGYgPT09IHN0YXRlICYmIG1hdGNoZXNQYXJhbXMoKSkge1xuICAgICAgICAgICRlbGVtZW50LmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkZWxlbWVudC5yZW1vdmVDbGFzcyhhY3RpdmVDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbWF0Y2hlc1BhcmFtcygpIHtcbiAgICAgICAgcmV0dXJuICFwYXJhbXMgfHwgZXF1YWxGb3JLZXlzKHBhcmFtcywgJHN0YXRlUGFyYW1zKTtcbiAgICAgIH1cbiAgICB9XVxuICB9O1xufVxuXG5hbmd1bGFyLm1vZHVsZSgndWkucm91dGVyLnN0YXRlJylcbiAgLmRpcmVjdGl2ZSgndWlTcmVmJywgJFN0YXRlUmVmRGlyZWN0aXZlKVxuICAuZGlyZWN0aXZlKCd1aVNyZWZBY3RpdmUnLCAkU3RhdGVBY3RpdmVEaXJlY3RpdmUpO1xuXG4vKipcbiAqIEBuZ2RvYyBmaWx0ZXJcbiAqIEBuYW1lIHVpLnJvdXRlci5zdGF0ZS5maWx0ZXI6aXNTdGF0ZVxuICpcbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBUcmFuc2xhdGVzIHRvIHtAbGluayB1aS5yb3V0ZXIuc3RhdGUuJHN0YXRlI21ldGhvZHNfaXMgJHN0YXRlLmlzKFwic3RhdGVOYW1lXCIpfS5cbiAqL1xuJElzU3RhdGVGaWx0ZXIuJGluamVjdCA9IFsnJHN0YXRlJ107XG5mdW5jdGlvbiAkSXNTdGF0ZUZpbHRlcigkc3RhdGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgcmV0dXJuICRzdGF0ZS5pcyhzdGF0ZSk7XG4gIH07XG59XG5cbi8qKlxuICogQG5nZG9jIGZpbHRlclxuICogQG5hbWUgdWkucm91dGVyLnN0YXRlLmZpbHRlcjppbmNsdWRlZEJ5U3RhdGVcbiAqXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogVHJhbnNsYXRlcyB0byB7QGxpbmsgdWkucm91dGVyLnN0YXRlLiRzdGF0ZSNtZXRob2RzX2luY2x1ZGVzICRzdGF0ZS5pbmNsdWRlcygnZnVsbE9yUGFydGlhbFN0YXRlTmFtZScpfS5cbiAqL1xuJEluY2x1ZGVkQnlTdGF0ZUZpbHRlci4kaW5qZWN0ID0gWyckc3RhdGUnXTtcbmZ1bmN0aW9uICRJbmNsdWRlZEJ5U3RhdGVGaWx0ZXIoJHN0YXRlKSB7XG4gIHJldHVybiBmdW5jdGlvbihzdGF0ZSkge1xuICAgIHJldHVybiAkc3RhdGUuaW5jbHVkZXMoc3RhdGUpO1xuICB9O1xufVxuXG5hbmd1bGFyLm1vZHVsZSgndWkucm91dGVyLnN0YXRlJylcbiAgLmZpbHRlcignaXNTdGF0ZScsICRJc1N0YXRlRmlsdGVyKVxuICAuZmlsdGVyKCdpbmNsdWRlZEJ5U3RhdGUnLCAkSW5jbHVkZWRCeVN0YXRlRmlsdGVyKTtcblxuLypcbiAqIEBuZ2RvYyBvYmplY3RcbiAqIEBuYW1lIHVpLnJvdXRlci5jb21wYXQuJHJvdXRlUHJvdmlkZXJcbiAqXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVByb3ZpZGVyXG4gKiBAcmVxdWlyZXMgdWkucm91dGVyLnJvdXRlci4kdXJsUm91dGVyUHJvdmlkZXJcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIGAkcm91dGVQcm92aWRlcmAgb2YgdGhlIGB1aS5yb3V0ZXIuY29tcGF0YCBtb2R1bGUgb3ZlcndyaXRlcyB0aGUgZXhpc3RpbmdcbiAqIGByb3V0ZVByb3ZpZGVyYCBmcm9tIHRoZSBjb3JlLiBUaGlzIGlzIGRvbmUgdG8gcHJvdmlkZSBjb21wYXRpYmlsaXR5IGJldHdlZW5cbiAqIHRoZSBVSSBSb3V0ZXIgYW5kIHRoZSBjb3JlIHJvdXRlci5cbiAqXG4gKiBJdCBhbHNvIHByb3ZpZGVzIGEgYHdoZW4oKWAgbWV0aG9kIHRvIHJlZ2lzdGVyIHJvdXRlcyB0aGF0IG1hcCB0byBjZXJ0YWluIHVybHMuXG4gKiBCZWhpbmQgdGhlIHNjZW5lcyBpdCBhY3R1YWxseSBkZWxlZ2F0ZXMgZWl0aGVyIHRvIFxuICoge0BsaW5rIHVpLnJvdXRlci5yb3V0ZXIuJHVybFJvdXRlclByb3ZpZGVyICR1cmxSb3V0ZXJQcm92aWRlcn0gb3IgdG8gdGhlIFxuICoge0BsaW5rIHVpLnJvdXRlci5zdGF0ZS4kc3RhdGVQcm92aWRlciAkc3RhdGVQcm92aWRlcn0gdG8gcG9zdHByb2Nlc3MgdGhlIGdpdmVuIFxuICogcm91dGVyIGRlZmluaXRpb24gb2JqZWN0LlxuICovXG4kUm91dGVQcm92aWRlci4kaW5qZWN0ID0gWyckc3RhdGVQcm92aWRlcicsICckdXJsUm91dGVyUHJvdmlkZXInXTtcbmZ1bmN0aW9uICRSb3V0ZVByb3ZpZGVyKCAgJHN0YXRlUHJvdmlkZXIsICAgICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gIHZhciByb3V0ZXMgPSBbXTtcblxuICBvbkVudGVyUm91dGUuJGluamVjdCA9IFsnJCRzdGF0ZSddO1xuICBmdW5jdGlvbiBvbkVudGVyUm91dGUoICAgJCRzdGF0ZSkge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczogdHJ1ZSAqL1xuICAgIHRoaXMubG9jYWxzID0gJCRzdGF0ZS5sb2NhbHMuZ2xvYmFscztcbiAgICB0aGlzLnBhcmFtcyA9IHRoaXMubG9jYWxzLiRzdGF0ZVBhcmFtcztcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRXhpdFJvdXRlKCkge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczogdHJ1ZSAqL1xuICAgIHRoaXMubG9jYWxzID0gbnVsbDtcbiAgICB0aGlzLnBhcmFtcyA9IG51bGw7XG4gIH1cblxuICB0aGlzLndoZW4gPSB3aGVuO1xuICAvKlxuICAgKiBAbmdkb2MgZnVuY3Rpb25cbiAgICogQG5hbWUgdWkucm91dGVyLmNvbXBhdC4kcm91dGVQcm92aWRlciN3aGVuXG4gICAqIEBtZXRob2RPZiB1aS5yb3V0ZXIuY29tcGF0LiRyb3V0ZVByb3ZpZGVyXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBSZWdpc3RlcnMgYSByb3V0ZSB3aXRoIGEgZ2l2ZW4gcm91dGUgZGVmaW5pdGlvbiBvYmplY3QuIFRoZSByb3V0ZSBkZWZpbml0aW9uXG4gICAqIG9iamVjdCBoYXMgdGhlIHNhbWUgaW50ZXJmYWNlIHRoZSBhbmd1bGFyIGNvcmUgcm91dGUgZGVmaW5pdGlvbiBvYmplY3QgaGFzLlxuICAgKiBcbiAgICogQGV4YW1wbGVcbiAgICogPHByZT5cbiAgICogdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ3VpLnJvdXRlci5jb21wYXQnXSk7XG4gICAqXG4gICAqIGFwcC5jb25maWcoZnVuY3Rpb24gKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICAqICAgJHJvdXRlUHJvdmlkZXIud2hlbignaG9tZScsIHtcbiAgICogICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgpIHsgLi4uIH0sXG4gICAqICAgICB0ZW1wbGF0ZVVybDogJ3BhdGgvdG8vdGVtcGxhdGUnXG4gICAqICAgfSk7XG4gICAqIH0pO1xuICAgKiA8L3ByZT5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVUkwgYXMgc3RyaW5nXG4gICAqIEBwYXJhbSB7b2JqZWN0fSByb3V0ZSBSb3V0ZSBkZWZpbml0aW9uIG9iamVjdFxuICAgKlxuICAgKiBAcmV0dXJuIHtvYmplY3R9ICRyb3V0ZVByb3ZpZGVyIC0gJHJvdXRlUHJvdmlkZXIgaW5zdGFuY2VcbiAgICovXG4gIGZ1bmN0aW9uIHdoZW4odXJsLCByb3V0ZSkge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczogdHJ1ZSAqL1xuICAgIGlmIChyb3V0ZS5yZWRpcmVjdFRvICE9IG51bGwpIHtcbiAgICAgIC8vIFJlZGlyZWN0LCBjb25maWd1cmUgZGlyZWN0bHkgb24gJHVybFJvdXRlclByb3ZpZGVyXG4gICAgICB2YXIgcmVkaXJlY3QgPSByb3V0ZS5yZWRpcmVjdFRvLCBoYW5kbGVyO1xuICAgICAgaWYgKGlzU3RyaW5nKHJlZGlyZWN0KSkge1xuICAgICAgICBoYW5kbGVyID0gcmVkaXJlY3Q7IC8vIGxlYXZlICR1cmxSb3V0ZXJQcm92aWRlciB0byBoYW5kbGVcbiAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbihyZWRpcmVjdCkpIHtcbiAgICAgICAgLy8gQWRhcHQgdG8gJHVybFJvdXRlclByb3ZpZGVyIEFQSVxuICAgICAgICBoYW5kbGVyID0gZnVuY3Rpb24gKHBhcmFtcywgJGxvY2F0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIHJlZGlyZWN0KHBhcmFtcywgJGxvY2F0aW9uLnBhdGgoKSwgJGxvY2F0aW9uLnNlYXJjaCgpKTtcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgJ3JlZGlyZWN0VG8nIGluIHdoZW4oKVwiKTtcbiAgICAgIH1cbiAgICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKHVybCwgaGFuZGxlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJlZ3VsYXIgcm91dGUsIGNvbmZpZ3VyZSBhcyBzdGF0ZVxuICAgICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoaW5oZXJpdChyb3V0ZSwge1xuICAgICAgICBwYXJlbnQ6IG51bGwsXG4gICAgICAgIG5hbWU6ICdyb3V0ZTonICsgZW5jb2RlVVJJQ29tcG9uZW50KHVybCksXG4gICAgICAgIHVybDogdXJsLFxuICAgICAgICBvbkVudGVyOiBvbkVudGVyUm91dGUsXG4gICAgICAgIG9uRXhpdDogb25FeGl0Um91dGVcbiAgICAgIH0pKTtcbiAgICB9XG4gICAgcm91dGVzLnB1c2gocm91dGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQG5nZG9jIG9iamVjdFxuICAgKiBAbmFtZSB1aS5yb3V0ZXIuY29tcGF0LiRyb3V0ZVxuICAgKlxuICAgKiBAcmVxdWlyZXMgdWkucm91dGVyLnN0YXRlLiRzdGF0ZVxuICAgKiBAcmVxdWlyZXMgJHJvb3RTY29wZVxuICAgKiBAcmVxdWlyZXMgJHJvdXRlUGFyYW1zXG4gICAqXG4gICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSByb3V0ZXMgLSBBcnJheSBvZiByZWdpc3RlcmVkIHJvdXRlcy5cbiAgICogQHByb3BlcnR5IHtvYmplY3R9IHBhcmFtcyAtIEN1cnJlbnQgcm91dGUgcGFyYW1zIGFzIG9iamVjdC5cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGN1cnJlbnQgLSBOYW1lIG9mIHRoZSBjdXJyZW50IHJvdXRlLlxuICAgKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVGhlIGAkcm91dGVgIHNlcnZpY2UgcHJvdmlkZXMgaW50ZXJmYWNlcyB0byBhY2Nlc3MgZGVmaW5lZCByb3V0ZXMuIEl0IGFsc28gbGV0J3NcbiAgICogeW91IGFjY2VzcyByb3V0ZSBwYXJhbXMgdGhyb3VnaCBgJHJvdXRlUGFyYW1zYCBzZXJ2aWNlLCBzbyB5b3UgaGF2ZSBmdWxseVxuICAgKiBjb250cm9sIG92ZXIgYWxsIHRoZSBzdHVmZiB5b3Ugd291bGQgYWN0dWFsbHkgZ2V0IGZyb20gYW5ndWxhcidzIGNvcmUgYCRyb3V0ZWBcbiAgICogc2VydmljZS5cbiAgICovXG4gIHRoaXMuJGdldCA9ICRnZXQ7XG4gICRnZXQuJGluamVjdCA9IFsnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJHJvdXRlUGFyYW1zJ107XG4gIGZ1bmN0aW9uICRnZXQoICAgJHN0YXRlLCAgICRyb290U2NvcGUsICAgJHJvdXRlUGFyYW1zKSB7XG5cbiAgICB2YXIgJHJvdXRlID0ge1xuICAgICAgcm91dGVzOiByb3V0ZXMsXG4gICAgICBwYXJhbXM6ICRyb3V0ZVBhcmFtcyxcbiAgICAgIGN1cnJlbnQ6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzdGF0ZUFzUm91dGUoc3RhdGUpIHtcbiAgICAgIHJldHVybiAoc3RhdGUubmFtZSAhPT0gJycpID8gc3RhdGUgOiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2LCB0bywgdG9QYXJhbXMsIGZyb20sIGZyb21QYXJhbXMpIHtcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnJHJvdXRlQ2hhbmdlU3RhcnQnLCBzdGF0ZUFzUm91dGUodG8pLCBzdGF0ZUFzUm91dGUoZnJvbSkpO1xuICAgIH0pO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXYsIHRvLCB0b1BhcmFtcywgZnJvbSwgZnJvbVBhcmFtcykge1xuICAgICAgJHJvdXRlLmN1cnJlbnQgPSBzdGF0ZUFzUm91dGUodG8pO1xuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCckcm91dGVDaGFuZ2VTdWNjZXNzJywgc3RhdGVBc1JvdXRlKHRvKSwgc3RhdGVBc1JvdXRlKGZyb20pKTtcbiAgICAgIGNvcHkodG9QYXJhbXMsICRyb3V0ZS5wYXJhbXMpO1xuICAgIH0pO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZUVycm9yJywgZnVuY3Rpb24gKGV2LCB0bywgdG9QYXJhbXMsIGZyb20sIGZyb21QYXJhbXMsIGVycm9yKSB7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJyRyb3V0ZUNoYW5nZUVycm9yJywgc3RhdGVBc1JvdXRlKHRvKSwgc3RhdGVBc1JvdXRlKGZyb20pLCBlcnJvcik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJHJvdXRlO1xuICB9XG59XG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5yb3V0ZXIuY29tcGF0JylcbiAgLnByb3ZpZGVyKCckcm91dGUnLCAkUm91dGVQcm92aWRlcilcbiAgLmRpcmVjdGl2ZSgnbmdWaWV3JywgJFZpZXdEaXJlY3RpdmUpO1xufSkod2luZG93LCB3aW5kb3cuYW5ndWxhcik7Il19
