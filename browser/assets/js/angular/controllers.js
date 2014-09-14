var appControllers = angular.module('appControllers', []);

appControllers.controller('bucketsCtrl', ['$scope', '$http', 'eventService',
	function ($scope, $http, eventService) {
		$http.get("/index.php/v2/api/buckets")
			.success(function (data) {
				$scope.data = data.data;
				$scope.predicate = 'name';
			})
			.error(function () {
				$scope.names = "error in fetching data";
			});

		var bucketTemp;

		$scope.checkIn = function (bucket) {
			bucketTemp = bucket;
			setTimeout(function () {
				if (bucketTemp == bucket) {
					$scope.loadBucket(bucket);
				}
			}, 500);
		};

		$scope.checkOut = function () {
			bucketTemp = undefined;
		};

		$scope.loadBucket = function (bucket) {
			$scope.bucket = bucket;
			eventService.getEndpoint(bucket).then(function (data) {
				eventService.setProperty(data);
				eventService.loadCharts();
			});
		}
	}
]);

appControllers.controller('eventsCtrl', ['$scope', '$http', '$routeParams', 'eventService',
	function ($scope, $http, $routeParams, eventService) {
		eventService.getEndpoint($routeParams.bucketId).then(function (data) {
			eventService.setProperty(data);
			eventService.loadCharts();
			$scope.table_data = data.data.table_data;
			$scope.month_data = data.data.month_data;
			$scope.hour_data = data.data.hour_data;
			$scope.predicate = 'time';
			$scope.bucket = $routeParams.bucketId;
			$scope.totalItems = $scope.table_data.length;
			$scope.itemsPerPage = 10;
			$scope.setPage(1);
		});

		$scope.pageChanged = function () {
			var begin = (($scope.currentPage - 1) * $scope.itemsPerPage),
				end = begin + $scope.itemsPerPage;

			$scope.table_data_paginated = $scope.table_data.slice(begin, end);
		};

		$scope.setPage = function (pageNum) {
			$scope.currentPage = pageNum;
			$scope.pageChanged();
		};

		$scope.showSnippit = function (code) {
			var jsonRaw = JSON.stringify(code, undefined, 2);
			$scope.snippitRaw = jsonRaw;
			var json = jsonRaw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			$scope.snippit = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
				var cls = 'number';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'key';
					} else {
						cls = 'string';
					}
				} else if (/true|false/.test(match)) {
					cls = 'boolean';
				} else if (/null/.test(match)) {
					cls = 'null';
				}
				return '<span class="' + cls + '">' + match + '</span>';
			});
			$scope.clip_text = 'Copy to Clipboard';
		};

		$scope.getTextToCopy = function () {
			return $scope.snippitRaw;
		};

		$scope.clipClick = function () {
			$scope.clip_text = 'Copied to Clipboard';
		};
	}
]);