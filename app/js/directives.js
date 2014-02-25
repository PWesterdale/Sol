'use strict';

/* Directives */


angular.module('sol.directives', [])
.directive('markdown', function () {
	var converter = new Showdown.converter();
	return {
		restrict: 'AE',
		link: function (scope, element, attrs) {
			if (attrs.markdown) {
				scope.$watch(attrs.markdown, function (newVal) {
				var html = newVal ? converter.makeHtml(newVal) : '';
				element.html(html);
				});
			} else {
				var html = converter.makeHtml(element.text());
				element.html(html);
			}
		}
	};
})
.directive('datewatch', function () {
	var elements = [];

	setInterval(function(){
		for(var i in elements){
			elements[i].html(prettyDate(elements[i].data('date')));
		}
	}, 5000);

	return {
		restrict : 'AE',
		link: function(scope, element, attrs) {
			element.html(prettyDate(attrs.date));
			elements.push(element);
		}
	};
})
.directive('gravatar', function () {
	return {
		restrict : 'AE',
		link: function(scope, element, attrs) {
			if (attrs.email) {
				scope.$watch(attrs.email, function (newVal) {
				var email = newVal ? md5(newVal) : '';
				element.attr('src', 'http://www.gravatar.com/avatar/' + email);
				});
			} else {
				var email = md5(element.attr('email'));
				element.attr('src', 'http://www.gravatar.com/avatar/' + email);
			}
		}
	};
})
.directive('soltransform', function ($rootScope) {
	return {
		restrict : 'AE',
		link: function(scope, element, attrs) {
			if (attrs.original) {
				scope.$watch(attrs.original, function (newVal) {
					switch(attrs.type){
						case 'assignee':
							element.html($rootScope.solUsersById[newVal].name);
						break;
						default:
							element.html(newVal);
						break;
					}
				});
			}
		}
	};
});
