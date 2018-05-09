'use strict';

angular.module('sbauthzApp')
  .controller('RootController', ['$rootScope', '$scope', '$http', '$location', 'Auth', function ($rootScope, $scope, $http, $location, Auth) {

  $scope.searchTerm;
  $rootScope.isViewLoading = false;

  $rootScope.isProcessingData = function() {
    return $http.pendingRequests.some(function(config) {
      if (config.method !== 'GET') {
        console.log(config);
        return true;
      }
    });
  };

  $rootScope.$on('$routeChangeStart', function () {
    $rootScope.isViewLoading = true;
  });
  $rootScope.$on('$routeChangeSuccess', function (event, routeData) {
    $rootScope.isViewLoading = false;
    if (routeData.$$route && routeData.$$route.section) {
      $rootScope.section = routeData.$$route.section;
    }
  });

  $scope.hasRole = function(role) {
    return Auth.keycloak.hasRealmRole(role);
  };

  $scope.username = Auth.keycloak.idTokenParsed.name;

  $scope.logout = function() {
    Auth.logout();
  };

  $scope.goToAccountManagement = function() {
    window.location = Auth.keycloak.authServerUrl + '/realms/' + Auth.keycloak.realm + '/account?referrer=sbauthz-app-js';
  };
}]);
