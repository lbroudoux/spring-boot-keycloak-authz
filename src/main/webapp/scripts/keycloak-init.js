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
      auth.authorization = new KeycloakAuthorization(keycloak);
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
            // Check if we have obtain an authorization token from the server.
            if (Auth.authorization.rpt) {
              config.headers['Authorization'] = 'Bearer ' + Auth.authorization.rpt;
            } else {
              config.headers['Authorization'] = 'Bearer ' + Auth.keycloak.token;
            }
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
          var retry = (!rejection.config.retry ||  rejection.config.retry < 1);
          console.log('retry: ' + retry);
          if (!retry) {
             alert('You can not access or perform the requested operation on this resource.');
             return $q.reject(rejection);
          }

          if (rejection.config.url.indexOf('/authorize') == -1 && retry) {
            var delay = $q.defer();

            // here is the authorization logic, which tries to obtain an authorization token from the server
            // in case the resource server returns a 403 or 401.
            Auth.authorization.authorize(rejection.headers('WWW-Authenticate')).then(function (rpt) {
              delay.resolve(rejection);
            }, function () {
              alert('You can not access or perform the requested operation on this resource.');
            }, function () {
              alert('Unexpected error from server.');
            });

            var promise = delay.promise;

            return promise.then(function (res) {
              if (!res.config.retry) {
                res.config.retry = 1;
              } else {
                res.config.retry++;
              }
              var $http = $injector.get("$http");

              return $http(res.config).then(function (response) {
                return response;
              });
            });
          }
        }
        return $q.reject(rejection);
      }
    };
  });

  app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });

})();
