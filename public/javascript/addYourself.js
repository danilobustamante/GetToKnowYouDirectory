angular.module('directoryApp').controller('AddYourselfCtrl', ['$scope', '$modal', 'addYourselfService', function ($scope, $modal, addYourselfService) {
  $scope.init = function()
  {
    $scope.wardDDSelect = [];
    $scope.stakeDDSelect = [];
    $scope.openSurveyWards = [];
    addYourselfService.getSurveysOpen().then(function (response){
      $scope.openSurveyWards = response;
      $scope.openWards = false;
      for(var i in response){
        $scope.openWards = true;
        $scope.wardDDSelect.push({'id':response[i].WardID,'name':response[i].wards_name});
        $scope.stakeDDSelect.push({'id':response[i].StakeID,'name':response[i].stakes_name});
      }
    });
  };
  $scope.init();
  $scope.openWards = false;
  $scope.stakeDDSelected = {name:'Select Stake (Optional)'};
  $scope.wardDDSelected = {name:'Selcet Ward'};

  //dynamically update wards list as user selects a stake
  $scope.$watch('stakeDDSelected', function(newVal, oldVal){
      if($scope.stakeDDSelected && $scope.stakeDDSelected.id){
        $scope.wardDDSelect = [];
        for(var i in $scope.openSurveyWards){
          if($scope.openSurveyWards[i].StakeID === $scope.stakeDDSelected.id)
            $scope.wardDDSelect.push({'id':$scope.openSurveyWards[i].WardID,'name':$scope.openSurveyWards[i].wards_name});
        }
        $scope.wardDDSelected = {name:'Selcet Ward'};
      }
  }, true);

  $scope.startSurvey = function(ward){
    if(ward && ward.id && ward.name){
      $scope.state.takeSurvey = true;
      $scope.ward = ward;
    }
    else{
      var modalInstance = $modal.open({
          templateUrl: 'requiredFieldModal.html',
          controller: 'ModalInstanceCtrl',
          resolve: {
            title: function(){
              return 'Please Try Again';
            },
            name: function (){
              return 'Please Select a Ward';
            }
          }
        });
    }
  };

  $scope.submitSurvey = function(name,phone,email){
    var requiredText;
    var requiredField = 'is a required Field';
    var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var phoneRegex = /^\+?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if(!name) requiredText = 'Full Name '+requiredField;
    else if(!phone) requiredText = 'Phone Number '+requiredField;
    else if(!email) requiredText = 'Email Address '+requiredField;
    else if(!phoneRegex.test(phone)) requiredText = 'Invalid Phone Number';
    else if(!emailRegex.test(email)) requiredText = 'Invalid Email Address';

    if(requiredText){
      var modalInstance = $modal.open({
          templateUrl: 'requiredFieldModal.html',
          controller: 'ModalInstanceCtrl',
          resolve: {
            title: function(){
              return 'Please Try Again';
            },
            name: function (){
              return requiredText;
            }
          }
        });
    }
    else{
      var answers = [{id:1,response:name},{id:2,response:phone},{id:3,response:email}];
      var wardName = $scope.ward.name;
      addYourselfService.submitSurvey($scope.ward.id,answers,name).then(function (response){
          console.log('here');
          var modalInstance = $modal.open({
          templateUrl: 'requiredFieldModal.html',
          controller: 'ModalInstanceCtrl',
          resolve: {
            title: function(){
              return 'Success!';
            },
            name: function (){
              return 'You have been successfully added to the '+wardName;
            }
          }
        });
      });
    }
  };
}]);


angular.module('directoryApp').factory('addYourselfService',['$http', function($http)
{
  return {
    getSurveysOpen: function()
    {
      return $http.get('/surveysOpen').then(function (response) {
          return response.data;
        });
    },
    submitSurvey: function(wardID, answers, name)
    {
      return $http.post('/submitSurvey', {wardID:wardID, answers:answers, name:name}
        ).success(function(data, status, headers, config) {
            console.log(status);
          }).error(function(data, status, headers, config) {
            console.log('Error');
            console.log(status);
          }).then(function(response){
            return true;
          });
    }
  };
}]);