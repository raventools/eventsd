var appControllers = angular.module('appControllers', []);

appControllers.directive('header', function() {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: '/browser/views/partials/header.html'
	}
});

appControllers.directive('summary', function() {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: '/browser/views/partials/summary.html'
	}
});

appControllers.directive('buckets', function() {
	return {
		restrict: 'E',
		scope: {
			table: '=',
			searchFilter: '=filter'
		},
		templateUrl: '/browser/views/partials/bucketTable.html'
	};
});

appControllers.controller('modalInstanceCtrl', ['$scope', '$modalInstance', 'data',
	function ($scope, $modalInstance, data) {
		$scope.modal = data;

		$scope.ok = function () {
			$modalInstance.close(data.bucket);
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	}
]);

appControllers.controller('bucketsCtrl', ['$scope', '$http', '$modal', '$log', 'eventService', 'localStorageService',
	function ($scope, $http, $modal, $log, eventService, localStorageService) {
		var alertTimeout,
			bucketTimeout,
			bucketsApi = {
			favoriteHandler: function(bucket) {
				var favoriteBuckets = localStorageService.get('favoriteBuckets');
				if (!_.isArray(favoriteBuckets)) {
					favoriteBuckets = [];
				}

				if (!_.isUndefined(bucket)) {
					var index = _.indexOf(favoriteBuckets, bucket);
					if (index !== -1) {
						delete favoriteBuckets[index];
						bucketsApi.alertHandler({
							type: 'success',
							msg: 'Removed `' + bucket + '` from your favorites.'
						});
					} else {
						favoriteBuckets.push(bucket);
						bucketsApi.alertHandler({
							type: 'success',
							msg: 'Added `' + bucket + '` to your favorites.'
						});
					}
				}

				if (_.isArray(favoriteBuckets)) {
					localStorageService.set('favoriteBuckets', JSON.stringify(favoriteBuckets));
				}

				$scope.favorites.data = [];
				_.each($scope.all.data, function(element) {
					if (_.contains(favoriteBuckets, element.name)) {
						element.favoriteText = " Remove Favorite";
						$scope.favorites.data.push(element);
					} else {
						element.favoriteText = " Favorite";
					}

					if (element.name == bucket) {
						element.tools = false;
					}
				});
			},
			alertHandler: function(alert) {
				clearTimeout(alertTimeout);
				$scope.alerts[0] = alert;

				alertTimeout = setTimeout(function() {
					bucketsApi.closeAlert(0);
				}, 5000);
			},
			deleteHandler: function(bucket) {
				var modalInstance = $modal.open({
					templateUrl: 'bucketModal.html',
					controller: 'modalInstanceCtrl',
					size: 'sm',
					resolve: {
						data: function () {
							return {
								bucket: bucket,
								title: 'Confirm Delete',
								body: 'Are you sure you want to delete `' + bucket + '`?'
							}
						}
					}
				});

				modalInstance.result.then(function (bucket) {
					$http.get('/index.php/v2/api/delete/' + bucket).then(function() {
						_.each($scope.all.data, function(element, index) {
							if (element.name == bucket) {
								$scope.all.data.splice(index, 1);
							}
							bucketsApi.favoriteHandler();
						});
					});
				}, function () {
					$log.info('Modal dismissed at: ' + new Date());
				});
			},
			checkIn: function (bucket) {
				bucketTimeout = bucket;
				setTimeout(function () {
					if (bucketTimeout == bucket) {
						bucketsApi.loadBucket(bucket);
					}
				}, 500);
			},
			checkOut: function() {
				bucketTimeout = undefined;
			},
			closeAlert: function(index) {
				$scope.alerts.splice(index, 1);
			},
			loadBucket: function(bucket) {
				$scope.bucket = bucket;
				eventService.getEventsEndpoint(bucket).
					then(function (data) {
						eventService.setProperty(data);
						eventService.loadCharts();
					}
				);
			}
		};

		$scope.breadCrumb = 'Home';
		$scope.alerts = [];
		$scope.all = {
			toolsDropDown: false,
			predicate: 'name',
			data: [],
			deleteHandler: function(bucket) {
				bucketsApi.deleteHandler(bucket);
			},
			favoriteHandler: function(bucket) {
				bucketsApi.favoriteHandler(bucket);
			},
			checkIn: function(bucket) {
				bucketsApi.checkIn(bucket);
			},
			checkOut: function() {
				bucketsApi.checkOut();
			}
		};

		$scope.favorites = {
			toolsDropDown: false,
			predicate: 'name',
			data: [],
			deleteHandler: function(bucket) {
				bucketsApi.deleteHandler(bucket);
			},
			favoriteHandler: function(bucket) {
				bucketsApi.favoriteHandler(bucket);
			},
			checkIn: function(bucket) {
				bucketsApi.checkIn(bucket);
			},
			checkOut: function() {
				bucketsApi.checkOut();
			}
		};

		var init = function() {
			eventService.getBucketsEndpoint().
				then(function (response) {
					$scope.all.data = response.data;
					bucketsApi.favoriteHandler();
				});
		};

		init();
	}
]);

appControllers.controller('eventsCtrl', ['$scope', '$http', '$routeParams', 'eventService',
	function ($scope, $http, $routeParams, eventService) {
		$scope.snippy = true;
		$scope.breadCrumb = '<a href="#/">Home</a> > Event Browser';
		eventService.getEventsEndpoint($routeParams.bucketId).
			then(function (data) {
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
			}
		);

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
			$scope.snippy = false;
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