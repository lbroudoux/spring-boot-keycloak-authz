'use strict';

angular.module('sbauthzApp')
  .controller('AuthzController', ['$rootScope', '$scope', '$modal', '$location', '$http', '$q',
      function ($rootScope, $scope, $modal, $location, $http, $q) {

    $scope.users = null;

    $scope.getUsers = function() {
      $scope.getUsersPromise().then(function(result) {
        $scope.users = result;
      })
    }

    $scope.getUsersPromise = function() {
      var delay = $q.defer();
      $http.get('http://localhost:8180/auth/admin/realms/sbauthz/users').success(function(data) {
        delay.resolve(data);
      });
      return delay.promise;
    }

    $scope.getUserRoles = function(id) {
      var delay = $q.defer();
      $http.get('http://localhost:8180/auth/admin/realms/sbauthz/users/' + id + '/role-mappings/realm').success(function(data) {
        data = data.map(role => role.name);
        delay.resolve(data);
        alert('User roles: ' + JSON.stringify(data));
      });
      return delay.promise;
    }

    $scope.getOwnedResources = function(id) {
      var delay = $q.defer();
      $http.get('/api/authz/ownedResources/' + id).success(function(data) {
        delay.resolve(data);
        alert('Owned resources: ' + JSON.stringify(data));
      });
      return delay.promise;
    }

    $scope.createResource = function() {
      var delay = $q.defer();
      $http.get('/api/authz/createResource')
      .success(function(data) {
        delay.resolve(data);
      });
      return delay.promise;
    }

    $scope.attachResource = function(id) {
      var delay = $q.defer();
      $http.get('/api/authz/attachResource/' + id)
      .success(function(data) {
        delay.resolve(data);
      });
      return delay.promise;
    }

    $scope.cleanResource = function() {
      var delay = $q.defer();
      $http.get('/api/authz/cleanResource')
      .success(function(data) {
        delay.resolve(data);
      });
      return delay.promise;
    }

    $scope.checkIdentity = function() {
      var delay = $q.defer();
      $http.get('/api/authz/checkIdentity')
      .success(function(data) {
        delay.resolve(data);
      });
      return delay.promise;
    }
}]);