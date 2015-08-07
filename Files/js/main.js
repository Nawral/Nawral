angular.module('Nawral', [])
.controller('nawralMainController', ['$scope', '$interval', function($scope, $interval){

  overwolf.games.onGameLaunched.addListener(function(){$scope.openSub("SubWindow");});

  $scope.values = {
    barWidth:       10,
    height:         20,
    offset:         0,
    gap:            0,
    seperation:     25,
    stc:            800,
    opacity:        1,
    minDecibels:    -90,
    maxDecibels:    -15,
    fps:            30,
    bars:           "16",
    color:          {r: 125, g: 125, b: 125},
    outward:        true,
    subtractive:    false,
    alternate:      false,
    bassFirst:      false,
    dynamicOpacity: true
  };

  $scope.values = JSON.parse(localStorage.getItem('settings') || JSON.stringify($scope.values));
  $scope.$watch('values', function(){
    if($scope.settings.$valid){
      localStorage.setItem('settings', JSON.stringify($scope.values));
    }
  }, true);

  $scope.isWindowOpen = false;

  $scope.openSub = function(windowName){
    overwolf.windows.obtainDeclaredWindow(windowName, function(result){
      if (result.status == "success"){
        overwolf.windows.restore(result.window.id, $.noop);
      }
    });
  };

  $interval(function(){
    overwolf.windows.obtainDeclaredWindow("Overlay",
    function(result){
      if (result.status == "success"){
        $scope.isWindowOpen = result.window.isVisible;
      } else {
        $scope.isWindowOpen = false;
      }
    });
  }, 1000);

  localStorage.setItem('settings', JSON.stringify($scope.values));
}]);
