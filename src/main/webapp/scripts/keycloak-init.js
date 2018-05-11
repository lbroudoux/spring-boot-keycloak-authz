'use strict';

(function () {
  /**
   * Snippet extracted from Keycloak examples
   */
  var auth = {};
  var app = angular.module('sbauthzApp');

  angular.element(document).ready(function () {
    var keycloak = new Keycloak('api/keycloak/config');
    auth.loggedIn = false;

    keycloak.init({ onLoad: 'login-required' }).success(function (authenticated) {
      auth.loggedIn = true;
      auth.keycloak = keycloak;
      auth.logout = function() {
        auth.loggedIn = false;
        auth.keycloak = null;
        window.location = keycloak.createLogoutUrl();
      };
      app.factory('Auth', function () {
        return auth;
      });
      keycloak.loadUserProfile().success(function(profile) {
          console.log('User profile: ' + JSON.stringify(profile));
      }).error(function() {
          console.log('Failed to load user profile');
      });
      angular.bootstrap(document, ['sbauthzApp']);
    }).error(function () {
      window.location.reload();
    });
  });

  app.factory('Auth', function () {
    return auth;
  });

  app.factory('authInterceptor', function ($q, $injector, Auth) {
    return {
      request: function (config) {
        var delay = $q.defer();
        if (Auth.keycloak && Auth.keycloak.token) {
          Auth.keycloak.updateToken(30).success(function () {
            config.headers = config.headers || {};
            config.headers['Authorization'] = 'Bearer ' + Auth.keycloak.token;
            delay.resolve(config);
          }).error(function () {
            window.location.reload();
          });
        } else {
          delay.resolve(config);
        }
        return delay.promise;
      },
      responseError: function (rejection) {
        var status = rejection.status;

        if (status == 403 || status == 401) {
            document.getElementById("output").innerHTML = 'You can not access or perform the requested operation on this resource.';
            return $q.reject(rejection);
        }

        return $q.reject(rejection);
      }
    };
  });

  app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });

})();
