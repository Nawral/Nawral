angular.module('Nawral', [])
.controller('nawralMainController', ['$scope', function($scope){
  overwolf.games.onGameLaunched.addListener(function(){$scope.openSub();});
  $scope.values = {
    width:        5,
    height:       10,
    offset:       0,
    gap:          0,
    stc:          800,
    bars:         16,
    bass:         false,
    scale:        1,
    fps:          30,
    opacity:      1,
    color:        {r: 125, g: 125, b: 125},
    outward:      true,
    subtractive:  true,
    alternate:    false
  };
  $scope.values = JSON.parse(localStorage.getItem('settings') || JSON.stringify($scope.values));
  $scope.$watch('values', function(){
    if($scope.settings.$valid){
      localStorage.setItem('settings', JSON.stringify($scope.values));
    }
  }, true);
  $scope.openSub = function(){
    overwolf.windows.obtainDeclaredWindow("SubWindow",
    function(result){
        if (result.status == "success"){
          overwolf.windows.restore(result.window.id, $.noop);
         }
       }
     );
  };
  localStorage.setItem('settings', JSON.stringify($scope.values));
}]);
