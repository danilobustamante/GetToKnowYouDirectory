angular.module('directoryApp').controller('ViewDirectoryCtrl', ['$scope', '$modal', 'directoryService', function ($scope, $modal, directoryService) {
	$scope.viewingMember = false;
	$scope.memberViewing = [];
	$scope.surveyResponses = [];
	$scope.hasResponses = false;
	$scope.noResponseText = '';

	//$scope.members --contained in loginController
	$scope.viewMember = function (member)
	{
		$scope.viewingMember = true;
		$scope.memberViewing = member;
		$scope.hasResponses = false;
		$scope.noResponseText = 'No Responses Were Found For '+$scope.memberViewing.firstname+' '+$scope.memberViewing.lastname;
		directoryService.getSurveyResponse($scope.userID, $scope.token, member.id).then(function (response){
			$scope.surveyResponses = response;
			if(response!=undefined && response!=null && response.length!=0){
				$scope.noResponseText = '';
				$scope.hasResponses = true;
			}
		});
	};
	$scope.unViewMember = function ()
	{
		$scope.viewingMember = false;
		$scope.hasResponses = false;
		$scope.memberViewing = [];
		$scope.surveyResponses = [];
	};
}]);

angular.module('directoryApp').factory('directoryService',['$http', function($http)
{
  	return {
	    getSurveyResponse: function(userID, token, memberID)
	    {
	      return $http.get('/surveyMemberResponse',{ headers: {'userID':userID, 'Authentication':token, 'memberID':memberID}
	        }).then(function (response) {
	          return response.data;
	        });
	    }
	}
}]);