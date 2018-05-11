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

            if (!retry) {
                document.getElementById("output").innerHTML = 'You can not access or perform the requested operation on this resource.';
                return $q.reject(rejection);
            }

            if (rejection.config.url.indexOf('/authorize') == -1 && retry) {
                // here is the authorization logic, which tries to obtain an authorization token from the server in case the resource server
                // returns a 403 or 401.
                var wwwAuthenticateHeader = rejection.headers('WWW-Authenticate');

                // when using UMA, a WWW-Authenticate header should be returned by the resource server
                if (!wwwAuthenticateHeader) {
                    return $q.reject(rejection);
                }

                // when using UMA, a WWW-Authenticate header should contain UMA data
                if (wwwAuthenticateHeader.indexOf('UMA') == -1) {
                    return $q.reject(rejection);
                }

                var deferred = $q.defer();

                var params = wwwAuthenticateHeader.split(',');
                var ticket;

                // try to extract the permission ticket from the WWW-Authenticate header
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].split('=');

                    if (param[0] == 'ticket') {
                        ticket = param[1].substring(1, param[1].length - 1).trim();
                        break;
                    }
                }

                // a permission ticket must exist in order to send an authorization request
                if (!ticket) {
                    return $q.reject(rejection);
                }

                // prepare a authorization request with the permission ticket
                var authorizationRequest = {};
                authorizationRequest.ticket = ticket;

                // send the authorization request, if successful retry the request
                Auth.authorization.authorize(authorizationRequest).then(function (rpt) {
                    deferred.resolve(rejection);
                }, function () {
                    alert('You can not access or perform the requested operation on this resource.');
                }, function () {
                  alert('Unexpected error from server.');
                });

                var promise = deferred.promise;

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
