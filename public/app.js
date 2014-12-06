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
				adminDDSelect: [],
				adminDDSelected: {},
				wardDDSelected: {},
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
				addAdminPage: function()
				{
					$scope.state.addAdmin = true;
					$scope.state.managing = false;
					$scope.state.viewDirectory = false;
					loginService.getAdminAddPrivleges($scope.userID, $scope.token).then(function(data){
						$scope.adminDDSelect = data;
						$scope.adminDDSelected = {name:'Select Authorization'};
						$scope.wardDDSelected = {ward:'Selcet a Ward'};
					});
				},
				addAdmin: function(username, password, passwordConfirm, email, firstname, lastname, accessLevel, ward)
				{
					
					var requiredText;
					var requiredField = ' is a required field';
					//email regex
					var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					//try for null
					if(!username) requiredText = 'Username'+requiredField;
					else if(!password) requiredText = 'Password'+requiredField;
					else if(!passwordConfirm) requiredText = 'Confirm Password'+requiredField;
					else if(!email) requiredText = 'Email'+requiredField;
					else if(!firstname) requiredText = 'Firstname'+requiredField;
					else if(!lastname) requiredText = 'Lastname'+requiredField;
					else if(!accessLevel || accessLevel.id===undefined) requiredText = 'Authorization Level'+requiredField;
					else if(!ward || ward.id===undefined) requiredText = 'Ward'+requiredField;
					else if(username.length < 5) requiredText = 'Username needs to be at least 5 characters long';
					else if(username.length > 20) requiredText = 'Username cannon exceed 20 characters';
					else if(password.length < 8) requiredText = 'Password needs to be at least 8 characters long';
					else if(password.length > 25) requiredText = 'Password length cannot exceed 25 characters';
					else if(!emailRegex.test(email)) requiredText = 'Email not Valid'
					else if(!(password===passwordConfirm)) requiredText = 'Passwords do not match';
					if(requiredText){
						var modalInstance = $modal.open({
					      templateUrl: 'requiredFieldModal.html',
					      controller: 'ModalInstanceCtrl',
					      resolve: {
					      	title: function (){
					      		return 'Please Try Again';
					      	},
					        name: function () {
					          return requiredText;
					        }
					      }
					    });
					}
					else{
						var first = firstname.charAt(0).toUpperCase()+firstname.slice(1);
						var last = lastname.charAt(0).toUpperCase()+lastname.slice(1);
						var modalInstance = $modal.open({
					      templateUrl: 'confirmModal.html',
					      controller: 'ConfirmModalInstanceCtrl',
					      backdrop: 'static',
					      resolve: {
					        username: function () {
					          return username;
					        },
					        email: function() {
					        	return email;
					        },
					        firstname: function() {
					        	return first;
					        },
					        lastname: function() {
					        	return last;
					        },
					        accessLevel: function() {
					        	return accessLevel;
					        },
					        ward: function() {
					        	return ward;
					        }
					      }
					    });

					    //resolve modalInstance if OK is clicked
					    modalInstance.result.then(function(data){
					    	//send data
					    	loginService.addAdmin($scope.userID, $scope.token, username, password, email, first, last, accessLevel.id, ward.id).then(function(response){
					    		requiredText = '';
					    		if(response.username && response.email) requiredText = 'Username and Email already taken';
					    		else if(response.username) requiredText = 'Username already taken';
					    		else if(response.email) requiredText = 'Email already taken';
					    		if(requiredText){
									var modalInstance = $modal.open({
								      	templateUrl: 'requiredFieldModal.html',
								      	controller: 'ModalInstanceCtrl',
								      	resolve: {
								      		title: function() {
								      			return 'Please Try Again';
								      		},
									        name: function () {
									          return requiredText;
									        }
								      	}
								    });
								}
								else{
									var modalInstance = $modal.open({
								      	templateUrl: 'requiredFieldModal.html',
								      	controller: 'ModalInstanceCtrl',
								      	resolve: {
								      		title: function() {
								      			return 'Congratulations';
								      		},
									        name: function () {
									          return 'New User Created Succesfully!';
									        }
								      	}
								    });
								    modalInstance.result.then(function(data){
										$scope.adminDDSelected={name:'Select Authorization'};
										$scope.wardDDSelected={ward:'Select Ward'};
										location.reload();
									});
								}
					    	});
					    });
					}
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

	app.controller('ModalInstanceCtrl', function ($scope, $modalInstance, name, title) {

	   $scope.name = name;
	   $scope.title = title;

	  $scope.ok = function () {
	   $modalInstance.close('ok');
	  };

	  $scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	  };
	});

	app.controller('ConfirmModalInstanceCtrl', function ($scope, $modalInstance, username, email, firstname, lastname, accessLevel, ward) {

	   $scope.username = username;
	   $scope.email = email;
	   $scope.firstname = firstname;
	   $scope.lastname = lastname;
	   $scope.accessLevel = accessLevel;
	   $scope.ward = ward;

	  $scope.ok = function () {
	   $modalInstance.close('ok');
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
			},
			getAdminAddPrivleges: function(userID, token)
			{
				return $http.get('/adminAddPrivleges', {headers:  {'userID':userID, 'Authentication':token} }
					).success(function(data, status, headers, config) {
				  	}).error(function(data, status, headers, config) {
				  	}).then(function(response){
				  		return response.data;
				  	});
			},
			addAdmin: function(userID, token, username, password, email, firstname, lastname, accessLevel, wardID)
			{
				return $http.post('/addAdmin', {userID: userID, token: token, newuser: username, password: password, email: email, firstname: firstname, lastname: lastname, access: accessLevel, wardID: wardID}
					).success(function(data, status, headers, config) {
				    	//console.log(data);
				  	}).error(function(data, status, headers, config) {
				    	//console.log('Error');
				    	//console.log(data);
				  	}).then(function(response){
				  		return response.data;
				  	});;
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
})(angular.module('loginApp', ['ui.bootstrap', 'ipCookie', 'ngDropdowns']));