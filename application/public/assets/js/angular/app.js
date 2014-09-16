var app = angular.module('eventsd_browser', [
	'ngRoute',
	'ngSanitize',
	'ngClipboard',
	'appControllers',
	'appServices',
	'LocalStorageModule',
	'ui.bootstrap'
]);

app.config(['$routeProvider',
	function ($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: '/browser/views/buckets.html',
				controller: 'bucketsCtrl'
			}).
			when('/events/:bucketId', {
				templateUrl: '/browser/views/events.html',
				controller: 'eventsCtrl'
			});
	}
]);

app.config(['ngClipProvider',
	function (ngClipProvider) {
		ngClipProvider.setPath("//cdnjs.cloudflare.com/ajax/libs/zeroclipboard/2.1.6/ZeroClipboard.swf");
	}
]);