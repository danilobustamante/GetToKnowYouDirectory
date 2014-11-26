(function(app)
{
	this.username = 'hello';
	this.password = 'world';
	app.controller('loginController', [
		'$scope',
		'loginService',
		function($scope, loginService)
		{
			angular.extend($scope, {
				state: {
					authenticated: false
				},
				/*
				addPost: function()
				{
					var post = {
						id: Math.random(),
						title: 'Untitled Post',
						creationDate: new Date().getTime(),
						content: '',
						views: 0
					};

					$scope.posts[post.id] = post;
					blogService.savePost(post);
					$scope.editPost(post);
				},
				editPost: function(post)
				{
					$scope.state.activePost = post;
					$scope.state.editing = true;
				},
				savePost: function(post)
				{
					post.creationDate = new Date().getTime();
					blogService.savePost(post);
					$scope.state.editing = false;
				},
				deletePost: function(post)
				{
					$scope.state.editing = false;
					$scope.state.activePost = null;

					delete $scope.posts[post.id];
					blogService.deletePost(post);
				},
				viewPost: function(post)
				{
					post.views++;
					blogService.savePost(post);
					$scope.state.activePost = post;
				}*/
				login: function()
				{
					username = this.username;
					password = this.password;
					loginService.login().then(function(data){
						if(data.authenticated === 'true'){
							$scope.state.authenticated = true;
						}
					});
				}
			});
			/*
			blogService.getPosts().then(function(posts) {
				$scope.posts = posts;
			});
			*/
		}
	]);

	app.factory('loginService',['$http', function($http)
	{
		return {
			login: function()
			{
				//TODO change to post
				 return $http.get('http://localhost:3000/login',{ headers: {'Username': username, 'Password':password}
					}).then(function (response) {
						return response.data;
					});
			}/*,
			savePost: function(post)
			{
				return $http.put('http://localhost:3000/posts/' + post.id, post);
			},
			deletePost: function(post)
			{
				return $http.delete('http://localhost:3000/posts/' + post.id);
			}*/
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
	/*
	app.directive('blogPost', [function() {
		return {
			restrict: 'A',
			scope: {
				post: '=ngModel'
			},
			template: "" +
				"<div>" +
					"<h1>{{post.title}}</h1>" +
					"<em>{{ post.creationDate | date:'medium' }}</em>" +
					"<p>{{post.content}}</p>" +
					"<button class='btn btn-success' ng-click='edit()'>Edit Blog Post</button>" +
				"</div>",
			link: function($scope)
			{
				$scope.edit = function()
				{
					$scope.$parent.editPost($scope.post);
				};
			}
		};
	}]);*/
	/*
	app.directive('blogPostEditor', [function() {
		return {
			restrict: 'A',
			scope: {
				post: '=ngModel'
			},
			template: "" +
				"<div class='form-group'>" +
					"<h1><input type='text' ng-model='post.title' /></h1>" +
					"<em>{{ post.creationDate | date:'medium' }}</em>" +
					"<textarea class='form-control' ng-model='post.content' rows='10'></textarea>" +
				"</div>" +
				"<div class='form-group pull-right'>" +
					"<button class='btn btn-default' ng-click='delete()'>Delete</button>" +
					"<button class='btn btn-success' ng-click='save()'>Publish</button>" +
				"</div>",
			link: function($scope)
			{
				angular.extend($scope, {
					delete: function()
					{
						$scope.$parent.deletePost($scope.post);
					},
					save: function()
					{
						$scope.$parent.savePost($scope.post);
					}
				});
			}
		};
	}]);*/

})(angular.module('loginApp', []));
