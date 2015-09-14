'use strict';
/**
 * @ngdoc overview
 * @name linshare.Authentication
 */
angular.module('linshare.authentication', ['restangular', 'linshare.userProfile', 'http-auth-interceptor', 'ui.bootstrap'])
  .config(function(RestangularProvider) {
    RestangularProvider.setBaseUrl('linshare');
    RestangularProvider.setDefaultHttpFields({cache: false});
    RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json;'});
    RestangularProvider.addFullRequestInterceptor(function(element, operation, route, url, headers) {
      headers['WWW-No-Authenticate'] = 'linshare';
    });
  })
  .factory('AuthenticationService', ['Restangular', '$q', '$log', 'authService', 'LinshareUserService',
    function (Restangular, $q, $log, authService, LinshareUserService) {
      var deferred = $q.defer();

      var baseAuthentication = Restangular.all('authentication');
      /*
       Check if the user is authorized
       */
      baseAuthentication.customGET('authorized')
        .then(function (userLoggedIn) {
          LinshareUserService.fillProfile(userLoggedIn);
          console.log('hihih auth', LinshareUserService.profile);
          deferred.resolve(userLoggedIn);
        }, function (error) {
          $log.debug('current user not authenticated', error);
          if (error.status == 401) LinshareUserService = null;
        });

      return {
        login: function (login, password) {
          $log.debug('Authentication:login');
          return baseAuthentication.customGET('authorized', {
            //while the all requests have no auth header we need to ignote authmodule
            ignoreAuthModule: true
          }, {
            Authorization: 'Basic ' + Base64.encode(login + ':' + password)
          }).then(function (user) {
            $log.debug('Authentication success : logged as ' + user.firstName + ' ' + user.lastName + '');
            authService.loginConfirmed();
            //Session.create(user.uuid, user.role);
            LinshareUserService.fillProfile(user);
            deferred.resolve(user);
            console.log('resolveeee', deferred);
          }, function (error) {
            $log.error('Authentication failed', error.status);
            deferred.reject(error);
          });
        },
        logout: function () {
          $log.debug('Authentication:logout');
          LinshareUserService.init();
          $log.info('///////////////////////', LinshareUserService);
          baseAuthentication.one('logout').get()
            .then(function () {
              authService.loginCancelled();
              //After being disconnected, authentication model is reloaded
              //you can use $location to redirect through home page (login page)
              Restangular.all('authentication').customGET('authorized').then(function (user) {

                deferred.resolve(user);
              });
            });
        },
        getCurrentUser: function () {
          return deferred.promise;
        }
      };
    }]);
