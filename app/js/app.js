'use strict';


// Declare app level module which depends on filters, and services
angular.module('sol', [
  'ngRoute',
  'ngCookies',
  'ngAnimate',
  'ui.sortable',
  'sol.filters',
  'sol.services',
  'sol.directives',
  'sol.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/dashboard', {templateUrl: 'partials/dash.html', controller: 'dashCtrl', access: false});
  $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'loginCtrl', access: true});
  $routeProvider.when('/collect/:collect', {templateUrl: 'partials/collect.html', controller: 'collectCtrl', access: true});
  $routeProvider.when('/install', {templateUrl: 'partials/install.html', controller: 'installCtrl', access: true});
  $routeProvider.when('/project/:project', {templateUrl: 'partials/project.html', controller: 'projectCtrl', access: false});
  $routeProvider.when('/project/:project/:issue', {templateUrl: 'partials/issue.html', controller: 'issueCtrl', access: false});
  $routeProvider.when('/user/:user', {templateUrl: 'partials/user.html', controller: 'userCtrl', access: false});
  $routeProvider.when('/zone', {templateUrl: 'partials/zone.html', controller: 'zoneCtrl', access: false});
  $routeProvider.when('/style-guide', {templateUrl: 'partials/style.html', controller: 'styleCtrl', access: true});
  $routeProvider.otherwise({redirectTo: '/dashboard'});
}])
.run(['$rootScope', '$http', '$location', 'Auth', 'Api', 'History', function ($rootScope, $http, $location, Auth, api, h) {

    $rootScope.$on("$routeChangeStart", function (event, next, current) {

        $rootScope.error = null;
        if (!Auth.authorize(next.access)) {
            if(Auth.isLoggedIn()) $location.path('/');
            else                  $location.path('/login');
        }
        $rootScope.isLoggedIn = Auth.isLoggedIn();
        $rootScope.user = Auth.user;

        $http({method: 'get', url: '/config.json'}).success(function(data){
          $rootScope.solConfig = data; 
        });

        h.clear();

        api.get('/api/v1/users')
        .success(function(data, status){
          $rootScope.solUsers = data;
          $rootScope.solUsersById = {};
          for(var x in data){
            $rootScope.solUsersById[data[x]._id] = data[x];
          }
        }).error(function(data, status){

        });

    });

}]);
