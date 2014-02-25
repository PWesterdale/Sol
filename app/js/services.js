'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('sol.services', ['ngCookies'])
.factory('Auth', function($cookies, $rootScope) {

	var auth = {
		authorize: function(access){
			if(access == false && !this.isLoggedIn()){
				return false;
			} else {
				return true;
			}
		},
		getAuthKey: function(){
			var cookieData = $cookies['connect.sess'];
			if(!cookieData){
				return false;
			}
			var data = cookieData.match(/{(.*?)}/gi);
			var oAuth = JSON.parse(data[0]);
			if(oAuth.auth_key){
				return oAuth.auth_key;
			} else {
				return false;
			}
		},
		isLoggedIn : function(){
			/* This check guarantees nothing!
			 * it is purely used to transport users
			 * if the user is not logged in they will be reverted back to
			 * login by a 401
			*/
			if(!this.getAuthKey()){
			  return false;
			} else {
			  return true;
			}
		},
		activeUser : {},
		getUser : function(){
			return this.activeUser;
		},
		setUser : function(user){
			this.activeUser = user;
		}
	};

	$rootScope.auth = auth;

	return auth;

})
.factory('Api', function($cookies, $http, Auth){

	return{
		get: function(endpoint){
			var query = $http({method: 'get', url: endpoint, params: {'auth_key' : Auth.getAuthKey()}});
			return query;
		},
		post: function(endpoint, data){
			var query = $http({
				method: 'post',
				url: endpoint,
				data: data,
				params: {'auth_key' : Auth.getAuthKey()}
			});
			return query;
		},
		put : function(endpoint, data){
			var query = $http({
				method: 'put',
				url: endpoint,
				data: data,
				params: {'auth_key' : Auth.getAuthKey()}
			});
			return query;
		}
	};

})
.factory('Jeeves', function(){
	var client = new Faye.Client('http://localhost:9401/jeeves');

	return {
		premonition: false,
		updateItem : function(old, update, cb){
			old = angular.extend(old, update);
			cb(null);
		},
		updateItemInList : function(identifier, list, item, cb){
			for(var x in list){
				if(angular.isUndefined(list[x][identifier]) || 
					list[x][identifier].toString() == item[identifier].toString()) {
					list[x] = angular.extend(list[x], item);
					cb(null);
				}
			}

			cb(true, 'item does not exist in list.');
		},
		addItem : function(identifier, list, item, cb){
			for(var x in list){
				if(list[x][identifier].toString() == item[identifier].toString()){
					cb(null); // already in list - no adding to do.
				}
			}
			list.push(item);
			cb(null);
		},
		subscribe : function(endpoint, cb){
			var resp = client.subscribe(endpoint, function(message) {
				cb(message);
			});
		}
	}
	
})
.factory('User', function(Api){

	return {
		invite : function(email, cb){
			Api.put('/api/v1/user/invite', {invitee : email})
			.success(function(data, status){
				cb(data);
			}).error(function(data, status){

			})
		},
		preCollect : function(token, cb){
			Api.get('/user/pre-collect?token=' + token)
			.success(function(data, status){
				cb(null, data);
			}).error(function(data, status){
				cb(true, null);
			});
		},
		claim : function(token, data, cb){
			Api.put('/user/collect?token=' + token, data)
			.success(function(data, status){
				cb(data);
			}).error(function(data, status){

			});
		}
	}

})
.factory('Project', function(Api){

	return {
		all : [],
		setAll : function(projs){
			this.all = projs;
		},
		getAll : function(cb){
			if(!this.all || this.all.length == 0){
				var self = this;
				Api.get('/api/v1/projects')
				.success(function(data, status){
					self.setAll(data);
					cb(data);
				}).error(function(data, status){
					console.log(data);
				});
			} else {
				cb(this.all);
			}
		},
		get : function(name, cb){
			Api.get('/api/v1/project/' + name)
			.success(function(data, status){
				cb(data);
			}).error(function(data, status){

			});
		}
	}

})
.factory('Issue', function(Api){

	return {
		all : [],
		getByProject : function(project, cb){
			Api.get('/api/v1/project/' + project + '/issues')
			.success(function(data, status){
				cb(data);
			}).error(function(data, status){

			})
		},
		getById : function(project, id, cb){
			Api.get('/api/v1/project/' + project + '/issue/' + id)
			.success(function(data, status){
				cb(data);
			}).error(function(data, status){

			});
		},
		getMine : function(cb){},
		create : function(project, issue, cb){
			Api.put('/api/v1/project/' + project + '/issue', issue)
			.success(function(data, status){
				cb(data);
			}).error(function(data, status){

			});
		},
		commit : function(project, issue, commit, cb){
			var data = {
				'issue' : issue,
				'commit' : commit
			};
			Api.put('/api/v1/project/' + project + '/issue/' + issue.id, data)
			.success(function(data, status){
				cb(data);
			}).error(function(data, status){

			});
		}
	}

})
.factory('History', function(Api){

	var subscribers = [];

	return {
		subscribe : function(cb){
			subscribers.push(cb);
		},
		publish : function(data){
			for(var x in subscribers){
				subscribers[x](data);
			}
		},
		clear : function(){
			for(var x in subscribers){
				subscribers[x](false);
			}
		}
	}

});
