(function(app)
{
	this.username = 'hello';
	this.password = 'world';
	app.controller('loginController', [
		'$scope',
		'ipCookie',
		'$modal',
		'loginService',
		function($scope, ipCookie, $modal, loginService)
		{
			angular.extend($scope, {
				state: {
					authenticated: false,
					managing: false,
					addAdmin: false,
					viewDirectory: false
				},
				accessLevel: 1000,
				name: 'Hello World',
				wards: [],
				wardsManagingIndex: 0,
				previewMembers: [],
				members: [],
				token: '',
				userID:-1,
				init: function()
				{
					$scope.token = ipCookie('token');
					$scope.userID = ipCookie('userID');
					if($scope.token && $scope.userID){
						loginService.loginCookie($scope.userID, $scope.token).then(function(data){
							if(data.authenticated === 'true'){
								$scope.state.authenticated = true;
								$scope.accessLevel = data.accessLevel;
								$scope.name = data.name;
								loginService.getWards($scope.userID, $scope.token).then(function(wards){
									$scope.wards = wards;
									$scope.state.managing = true;
									$scope.wardsManagingIndex = 0;
									//get preview member data
									loginService.getDirectoryPreview($scope.wards[$scope.wardsManagingIndex].ward, $scope.userID, $scope.token).then(function(members){
										$scope.previewMembers = members;
									});
								});
							}
						});
					}
				},
				login: function()
				{
					username = this.username;
					password = this.password;
					loginService.login().then(function(data){
						if(data.token){
							$scope.state.authenticated = true;
							$scope.token = data.token;
							$scope.userID = data.userID;
							$scope.accessLevel = data.accessLevel;
							$scope.name = data.name;
							//set cookie
							ipCookie('token', $scope.token, {expires:data.expires, expirationUnit:'seconds'});
							ipCookie('userID', $scope.userID, {expires:data.expires, expirationUnit:'seconds'});
							var modalInstance = $modal.open({
							      templateUrl: 'loginModalSuccessContent.html',
							      controller: 'ModalInstanceCtrl',
							      resolve: {
							        name: function () {
							          return $scope.name;
							        }
							      }
							   });
							//get ward data
							loginService.getWards($scope.userID, $scope.token).then(function(wards){
								$scope.wards = wards;
								$scope.state.managing = true;
								$scope.wardsManagingIndex = 0;
								//get preview member data
								loginService.getDirectoryPreview($scope.wards[$scope.wardsManagingIndex].ward, $scope.userID, $scope.token).then(function(members){
									$scope.previewMembers = members;
								});
							});
						}
						else{
								var modalInstance = $modal.open({
							      templateUrl: 'loginModalFailureContent.html',
							      controller: 'ModalInstanceCtrl',
							      resolve: {
							      	name: function (){
							      		return $scope.name;
							      	}
							      }
							    });
						}
						username = 'hello';
						password = 'world';
					});
				},
				logout: function()
				{
					loginService.logout($scope.userID, $scope.token).then(function(data){
						//TODO notifty server of end of session
						//$scope.state.authenticated = false;
						var modalInstance = $modal.open({
					      templateUrl: 'logoutModalSuccessContent.html',
					      controller: 'ModalInstanceCtrl',
					      resolve: {
					      	name: function (){
							      		return $scope.name;
							      	}
					      }
					    });
						username = 'hello';
						password = 'world';
						$scope.accessLevel = 1000;
						$scope.name = 'Hello World';
						$scope.wards = [];
						$scope.state.authenticated = false;
						$scope.state.managing = false;
						$scope.state.addAdmin = false;
						$scope.state.viewDirectory = false;
						$scope.token = '';
						$scope.previewMembers = [];
						//remove cookie
						ipCookie.remove('token');
						ipCookie.remove('userID');
					});
				},
				changeManagingWard: function(index)
				{
					$scope.wardsManagingIndex = index;
					$scope.state.addAdmin = false;
					$scope.state.managing = true;
					$scope.state.viewDirectory = false;
					//get preview member data
					loginService.getDirectoryPreview($scope.wards[$scope.wardsManagingIndex].ward, $scope.userID, $scope.token).then(function(members){
						$scope.previewMembers = members;
					});
				},
				addAdmin: function()
				{
					$scope.state.addAdmin = true;
					$scope.state.managing = false;
					$scope.state.viewDirectory = false;
				},
				getDirectory: function()
				{
					$scope.state.addAdmin = false;
					$scope.state.managing = false;
					$scope.state.viewDirectory = true;
					loginService.getDirectory($scope.wards[$scope.wardsManagingIndex].ward, $scope.userID, $scope.token).then(function(members){
						$scope.members = members;
					});
				}
			});
		}

	]);


	// Please note that $modalInstance represents a modal window (instance) dependency.
	// It is not the same as the $modal service used above.

	app.controller('ModalInstanceCtrl', function ($scope, $modalInstance, name) {

	   $scope.name = name;

	  $scope.ok = function () {
	   $modalInstance.dismiss('ok');
	  };

	  $scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	  };
	});

	app.factory('loginService',['$http', function($http)
	{
		return {
			login: function()
			{
				//TODO change to post
				 return $http.get('/login',{ headers: {'Username': username, 'Password':password}
					}).then(function (response) {
						return response.data;
					});
			},
			loginCookie: function(userID, token)
			{
				 return $http.get('/loginCookie',{ headers: {'userID':userID, 'Authentication':token}
					}).then(function (response) {
						return response.data;
					});
			},
			logout: function(userID, token)
			{
				return $http.get('/logout',{ headers:{'userID':userID, 'Authentication':token}}).then(function (response) {
					return response.data;
				});
			},
			getWards: function(userID, token)
			{
				return $http.get('/wards',{ headers: {'userID':userID, 'Authentication':token}
					}).then(function(response) {
						return response.data;
					});
			},
			getDirectoryPreview: function(name, userID, token)
			{
				return $http.get('/directoryPreview',{ headers: {'Ward': name, 'userID':userID, 'Authentication':token}
					}).then(function(response) {
						return response.data;
					});
			},
			getDirectory: function(name, userID, token)
			{
				return $http.get('/directory',{ headers: {'Ward': name, 'userID':userID, 'Authentication':token}
					}).then(function(response) {
						return response.data;
					});
			}
		};
	}]);
	/*
		This directive allows us to pass a function in on an enter key to do what we want.
 	*/
	app.directive('ngEnter', function () {
	    return function (scope, element, attrs) {
	        element.bind("keydown keypress", function (event) {
	            if(event.which === 13) {
	                scope.$apply(function (){
	                    scope.$eval(attrs.ngEnter);
	                });
	 
	                event.preventDefault();
	            }
	        });
	    };
	});

	app.directive('ngManageWard', [function() {
		return {
			restrict: 'A',
			scope: false,
			templateUrl: 'templates/manageWard.html',
			link: function($scope)
			{

			}
		}
	}]);
	app.directive('ngAddAdmin', [function() {
		return {
			restrict: 'A',
			scope: false,
			templateUrl: 'templates/addAdmin.html',
			link: function($scope)
			{

			}
		}
	}]);
	app.directive('ngViewDirectory', [function() {
		return {
			restrict: 'A',
			scope: false,
			templateUrl: 'templates/viewDirectory.html',
			link: function($scope)
			{

			}
		}
	}]);
})(angular.module('loginApp', ['ui.bootstrap', 'ipCookie']));