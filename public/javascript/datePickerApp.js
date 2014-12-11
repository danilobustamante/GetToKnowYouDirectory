angular.module('directoryApp').controller('DatePickerCtrl', ['$scope', '$modal', 'dateService', function ($scope, $modal, dateService) {
  $scope.today = function() {
    $scope.dt = new Date();
    //$scope.dtBegin = new Date();
    //$scope.dtEnd = new Date();
    dateService.getSurveyTimes($scope.userID, $scope.token, $scope.wards[$scope.wardsManagingIndex].id).then(function(times){
      if(times.start_time) $scope.dtBegin = times.start_time; else $scope.dtBegin = $scope.dt.getTime();
      if(times.end_time) $scope.dtEnd = times.end_time; else $scope.dtEnd = $scope.dt.getTime();
      $scope.calcOpenSurvey();
    });
  };
  $scope.today();
  $scope.surveyOpen = false;

  $scope.clear = function () {
    $scope.dt = null;
  };

  $scope.calcOpenSurvey = function() {
    $scope.dt = new Date();
    if($scope.dtBegin < $scope.dt.getTime() && $scope.dtEnd > $scope.dt.getTime())
      $scope.surveyOpen = true;
    else
      $scope.surveyOpen = false;
  };


  $scope.toggleMin = function() {
    //$scope.minDate = $scope.minDate ? null : new Date();
    $scope.minDate = null;
  };
  $scope.toggleMin();

  $scope.openBegin = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.openedBegin = true;
  };

  $scope.openEnd = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.openedEnd = true;
  };

  $scope.submitOpenSurvey = function(beginTime, endTime) {
    try{
      beginTime=beginTime.getTime();
    } catch(err){

    }
    try{
      endTime=endTime.getTime();
    } catch(err){
    }
    if(!beginTime || !endTime || beginTime>endTime){
      var errorText = '';
      if(!beginTime) errorText = 'Start Time is required'
      else if(!endTime) errorText = 'End Time is required'
      else errorText = 'Please Select an End Time that is after the Start Time'
      
      var modalInstance = $modal.open({
        templateUrl: 'requiredFieldModal.html',
        controller: 'ModalInstanceCtrl',
        resolve: {
          title: function(){
            return 'Please Try Again';
          },
          name: function (){
            return errorText;
          }
        }
      });
    }
    /*else if(beginTime.getTime() && endTime.getTime() && beginTime.getTime()>endTime.getTime()){
      var errorText = 'Please Select an End Time that is after the Start Time'
      var modalInstance = $modal.open({
        templateUrl: 'requiredFieldModal.html',
        controller: 'ModalInstanceCtrl',
        resolve: {
          title: function(){
            return 'Please Try Again';
          },
          name: function (){
            return errorText;
          }
        }
      });
    }*/
    else{
      //set new times at server
      dateService.setSurveyTimes($scope.userID, $scope.token, $scope.wards[$scope.wardsManagingIndex].id, beginTime, endTime).then(function(response){
        //open modal to display success
        var title = '';
        var displayText = '';
        if(response) {
          title='Success';
          displayText='Survey Open Time succesfully updated!';
        }
        else {title='Please Try Again'; displayText='An error occurred while trying to update the survey, please contact your system adminstrator if this problem persists'};
      
        var modalInstance = $modal.open({
          templateUrl: 'requiredFieldModal.html',
          controller: 'ModalInstanceCtrl',
          resolve: {
            title: function(){
              return title;
            },
            name: function (){
              return displayText;
            }
          }
        });
      });
      //update display
      $scope.calcOpenSurvey();
    }
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];
}]);


angular.module('directoryApp').factory('dateService',['$http', function($http)
{
  return {
    getSurveyTimes: function(userID, token, wardID)
    {
      return $http.get('/surveyTimes',{ headers: {'userID':userID, 'Authentication':token, 'wardID':wardID}
        }).then(function (response) {
          return response.data;
        });
    },
    setSurveyTimes: function(userID, token, wardID, startTime, endTime)
    {
      var success = false;
      return $http.post('/surveyTimes', {'userID': userID, 'Authentication': token, 'wardID': wardID, 'start_time': startTime, 'end_time': endTime}
        ).success(function(data, status, headers, config) {
            success = true;
          }).then(function(response){
            return success;
          });
    }
  };
}]);