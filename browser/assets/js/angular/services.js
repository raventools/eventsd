var appServices = angular.module('appServices', []);

appServices.service('eventService', ['$http', function ($http) {
	var container = null;

	return {
		getBucketsEndpoint: function () {
			var promise = $http.get("/index.php/v2/api/buckets").then(function (response) {
				return response.data;
			});
			return promise;
		},
		getEventsEndpoint: function (bucket) {
			var promise = $http.get("/index.php/v2/api/events/" + bucket).then(function (response) {
				return response.data;
			});
			return promise;
		},
		getProperty: function () {
			return container;
		},
		setProperty: function (value) {
			container = value;
		},
		formatCode: function (code, time) {
			var deferred = $q.defer();

			var raw = JSON.stringify(code, undefined, 2),
				json = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

			deferred.resolve({
				'time': time,
				'raw': raw,
				'html': json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
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
					return '<span class="' + cls + '">' + match + '</span>'
				})
			});

			return deferred.promise;
		},
		loadCharts: function () {
			function drawHourlyChart() {
				var deferred = $q.defer();

				var array = [];
				array.push(['hour', 'count']);
				_.each(container.data.hour_data, function (element) {
					array.push([element.display, element.count]);
				});
				var data = google.visualization.arrayToDataTable(array);

				var options = {
					title: 'Activity in past 24 hours',
					legend: {position: 'none'}
				};

				try {
					var chart = new google.visualization.LineChart(document.getElementById('hour-chart'));
					chart.draw(data, options);
					deferred.resolve(true);
				} catch (e) {
					deferred.reject(e);
				}

				return deferred.promise;
			}

			function drawMonthlyChart() {
				var deferred = $q.defer();

				var array = [];
				array.push(['day', 'count']);
				_.each(container.data.month_data, function (element, index) {
					array.push([index, element]);
				});
				var data = google.visualization.arrayToDataTable(array);

				var options = {
					title: 'Activity in past 30 days',
					legend: {position: 'none'}
				};

				try {
					var chart = new google.visualization.LineChart(document.getElementById('month-chart'));
					chart.draw(data, options);
					deferred.resolve(true);
				} catch (e) {
					deferred.reject(e);
				}

				return deferred.promise;
			}

			drawHourlyChart().then(function(chart) {
				// whee! success
			}, function(error) {
				// something with the error
			});

			drawMonthlyChart().then(function(chart) {
				// whee! success
			}, function(error) {
				// something with the error
			});
		}
	}
}]);
