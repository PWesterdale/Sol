'use strict';

/* Controllers */

angular.module('sol.controllers', []).
	controller('dashCtrl', ['Auth', 
		'Api', 
		'Project', 
		'Jeeves', 
		'$scope',
		'$location', function(auth, api, project, jeeves, $scope, $location) {

		project.getAll(function(projects){
			$scope.projects = projects
		});

		$scope.createProject = function(){
			api.put(
				'/api/v1/project',
				{
					'name' : $scope.project.name,
					'desc' : $scope.project.description,
					'url'  : $scope.project.name.toLowerCase().replace('/\s/g','-')
				})
			.success(function(data, status){
				$location.path('/home');
			}).error(function(data, status){

			})
		}

	}])
	.controller('installCtrl', ['$http', '$location', '$scope', function($http, $location, $scope) {
		

		$http({method: 'get', url: '/config.json'}).success(function(data){
			
			if(data.installed == true){
				$location.path('/login');
			}
			
		});

		$scope.priorities = [];
		$scope.assigneeGroups = [];
		$scope.statuses = [];

		$scope.addPriority = function(){
			$scope.priorities.push({
				name : $scope.priority
			});
			$scope.priority = '';
		}

		$scope.addAssigneeGroup = function(){
			$scope.assigneeGroups.push({
				name : $scope.assigneeGroup
			});
			$scope.assigneeGroup = '';
		}

		$scope.addStatus = function(){
			$scope.statuses.push({
				name : $scope.status,
				assignBy : $scope.assignBy
			});
			$scope.status = '';
			$scope.assignBy = 'anyone';
		}

		$scope.install = function(){
			var payload = {
				user : $scope.user,
				statuses : $scope.statuses,
				priorities : $scope.priorities,
				groups : $scope.assigneeGroups,
			};
			console.log(payload);
			$http({method: 'POST', url: '/install', data: payload}).success(function(data){

			});
		}

	}])
	.controller('UserInfoCtrl', [
		'Auth', 
		'Api', 
		'$scope', function(auth, api, $scope){

		api.get('/api/v1/user')
			.success(function(data, status){
				$scope.user = data;
				auth.setUser(data);
			}).error(function(data, status){
				console.log(data);
			});

	}])
	.controller('loginCtrl', [
		'Auth', 
		'Api', 
		'$scope', 
		'$http', 
		'$location', function(auth, api, $scope, $http, $location) {

		if(auth.isLoggedIn()){
			$location.path('/dashboard');
		}

		$scope.doLogin = function(){

			api.post(
				'/login',
				{
					'email' : $scope.login.email,
					'password' : $scope.login.password,
				})
			.success(function(data, status, headers, config) {
				window.location.reload();
			}).error(function(data, status, headers, config) {
				console.log(data);
			});

		}

	}])
	.controller('projectCtrl', ['Auth', 
		'Api', 
		'Project',
		'Issue',
		'Jeeves', 
		'$scope',
		'$location',
		'$routeParams',
		'$rootScope',
		'History', function(auth, api, project, issue, jeeves, $scope, $location, $rp, $rs, h) {

		project.get($rp.project, function(data){
			$scope.p = data;
		});

		h.publish({
			url : '#/dashboard',
			content : 'Back to Dashboard'
		});

		jeeves.subscribe('/project/' + $rp.project, function(msg){
			switch(msg.type){
				case 'newIssue':
					$scope.$apply(function() {
						if(jeeves.premonition){
							jeeves.updateItemInList('_id', $scope.projectIssues, msg.updateWith, function(){
								jeeves.premonition = false;
							});
						} else {
							jeeves.addItem('_id', $scope.projectIssues, msg.updateWith, function(){
							});
						}
					});
				break;
			}
		});

		issue.getByProject($rp.project, function(data){
			$scope.projectIssues = data;
		});

		$rs.$watch('solUsers', function() {
			if(!$rs.solUsers){
				return false;
			}
			$scope.issue.assignee = $rs.solUsers[0]._id;
		});

		$scope.addIssue = function(){
			var premonition = angular.copy($scope.issue, premonition);
			premonition.posted = new Date();
			premonition.assignee = $rs.solUsersById[$scope.issue.assignee];
			premonition.id = 'New';
			jeeves.premonition = premonition;

			$scope.projectIssues.push(premonition);
			
			issue.create($rp.project, $scope.issue, function(newIssue){
				$scope.issue = {};
			});
		}

		$scope.goToIssue = function(id){
			$location.path('/project/' + $rp.project + '/' + id);
		}
		

	}])
	.controller('issueCtrl', ['Auth', 
		'Api', 
		'Project',
		'Issue',
		'Jeeves', 
		'$scope',
		'$location',
		'$routeParams',
		'$rootScope',
		'History', function(auth, api, project, issue, jeeves, $scope, $location, $rp, $rs, h){

		$scope.commit = {};
		$scope.diff = false;
		$scope.diffOn = {};
		$scope.participants = {};
		$scope.user = auth.getUser();

		issue.getById($rp.project, $rp.issue, function(data){
			$scope.issue = data;
			$scope.issue.assigneeRaw = $scope.issue.assignee;
			$scope.issue.assignee = $scope.issue.assigneeRaw._id;
			setCommit();
			setParticipants();
		});

		h.publish({
			url : '#/project/' + $rp.project,
			content : 'Back to Project'
		});

		var setCommit = function(){
			$scope.commit.assignee = $scope.issue.assignee;
			$scope.commit.priority = $scope.issue.priority;
			$scope.commit.status = $scope.issue.status;
			$scope.commit.group = $scope.issue.group;
			$scope.commit.notes = '';
		}

		var setParticipants = function(){
			var p = $rs.solUsers;
			for(var z in p){
				$scope.participants[p[z]._id] = p[z];
			}
		}

		$scope.commitDiff = function(){
			var diffable = ['priority', 'status', 'group', 'assignee'];
			$scope.diff = false;
			for(var i in diffable){
				if($scope.commit[diffable[i]] != $scope.issue[diffable[i]]){
					$scope.diff = true;
					$scope.diffOn[diffable[i]] = true;
				} else {
					$scope.diffOn[diffable[i]] = false;
				}
			}
		};

		$scope.updateIssue = function(){

			var commit = {'actions' : []};
			var oIssue = {'id' : $scope.issue.id};
			for(var x in $scope.diffOn){
				if($scope.diffOn[x]){
					oIssue[x] = $scope.commit[x];
					commit.actions.push({
						type : x,
						from : $scope.issue[x],
						to : $scope.commit[x]
					});
				}
			}
			commit.message = $scope.commit.notes;

			issue.commit($rp.project, oIssue, commit, function(rIssue){
				$scope.issue = rIssue;
				$scope.issue.assigneeRaw = $scope.issue.assignee;
				$scope.issue.assignee = $scope.issue.assigneeRaw._id;
				setCommit();
				$scope.commitDiff();
				setParticipants();
			});
			
		};

	}])
	.controller('historyCtrl', ['$scope', 'History', function($scope, h){
		h.subscribe(function(data){
			if(data){
				$scope.url = data.url;
				$scope.content = data.content;
			} else {
				$scope.url = $scope.content = null;
			}
		});
	}])
	.controller('inviteCtrl', ['$scope', 'User', function($scope, user){

		$scope.invite = function(){
			user.invite($scope.invitee, function(){
				$scope.invitee = '';
			});
		}

	}])
	.controller('collectCtrl', ['$scope',
	'User', 
	'$routeParams', 
	'$location', function($scope, user, $rp, $location){

		user.preCollect($rp.collect, function(err, data){
			if(err){
				$location.path('/');
				return false;
			}
			$scope.email = data.email;
		});

		$scope.claim = function(){
			user.claim($rp.collect, $scope.collect, function(data){
				window.location.reload();
			});
		}

	}])
	.controller('userCtrl', [function() {

	}])
	.controller('zoneCtrl', [function() {

	}]);