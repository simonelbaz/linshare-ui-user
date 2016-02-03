'use strict';

/**
 * @ngdoc overview
 * @name linshare.userProfile
 * @description
 *
 * A module in which we have one service
 *
 */
angular.module('linshare.userProfile', [])
/**
 * @ngdoc service
 * @name linshare.userProfile.service:LinshareUserService
 * @description
 *
 * This service will help to store in a object the user information
 */
  .service('LinshareUserService', function () {

    this.profile = {
      firstName: null,
      lastName: null,
      locale: null,
      role: null,
      mail: null,
      accountType: null
    };

    var self = this;
    this.loggedIn = false;
    this.authorized = false;

    this.fillProfile = function (userDto) {
      self.profile.firstName = userDto.firstName;
      self.profile.lastName = userDto.lastName;
      self.profile.locale = userDto.locale;
      self.profile.role = userDto.role;
      self.profile.mail = userDto.mail;
      self.profile.accountType = userDto.accountType;
      self.loggedIn = true;
    };

    this.init = function() {
      self.profile = {
        firstName: null,
        lastName: null,
        locale: null,
        role: null,
        mail: null,
        accountType: null
      };
    };

    // will see the implementation of these methods
    this.getProfile = function () {
      return self.profile;
    };
    this.isLoggedIn = function () {
      return self.loggedIn;
    };
    this.hasRightRole = function (role) {
      return self.profile.role === role;
    };
    this.hasRightAccountType = function(accountType) {
      return self.profile.accountType === accountType;
    };

  })
  .factory('LinshareGuestService', function(Restangular) {
    var baseGuestRest = Restangular.all('guests');
    return {
      find: function(uuid) {
        return baseGuestRest.one(uuid).get();
      },
      getList: function() {
        return baseGuestRest.getList();
      },
      addGuest: function(guestDto) {
        return baseGuestRest.post(guestDto);
      },
      delete: function(guestDto) {
        return baseGuestRest.remove(guestDto);
      },
      update: function(uuid) {
        return baseGuestRest.put(uuid);
      },
      assignGroup: function(uuid) {
        return null;
      }
    }
  });
