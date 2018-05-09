'use strict';

angular.module('sbauthzApp')
  .controller('MainCtrl', ['$scope', '$location',
        function ($scope, $location) {

    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  }]);