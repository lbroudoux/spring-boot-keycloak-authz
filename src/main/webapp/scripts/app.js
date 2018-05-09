'use strict';

/**
 * Main module of the application.
 */
angular
  .module('sbauthzApp', [
    'sbauthzApp.services',
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ui.bootstrap'
  ])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/authz', {
        templateUrl: 'views/authz.html',
        controller: 'AuthzController'
      })
      .when('/services', {
        templateUrl: 'views/services.html',
        controller: 'ServicesController',
        resolve: {
          services: ['$location', 'Service', function ($location, Service) {
            var searchObject = $location.search();
            if (Object.keys(searchObject).indexOf('searchTerm') != -1) {
              return Service.search({name: searchObject.searchTerm});
            }
            return Service.query({size: 20});
          }]
        }
      })
      .when('/service/:id', {
        templateUrl: 'views/service.html',
        controller: 'ServiceController',
        resolve: {
          service: ['$route', 'Service', function ($route, Service) {
            return Service.get({serviceId: $route.current.params.id}).$promise;
          }]
        }
      })
      .otherwise({
        redirectTo: '/'
      });
    }]);
