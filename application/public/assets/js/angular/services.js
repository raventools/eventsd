var appServices = angular.module('appServices', []);

appServices.service('authService', ['$http', function ($http) {
	return {
		googleRedirect: function (revalidate) {
			var url = '/oauth2';
			if (revalidate) {
				url += '?revalidate=true';
			}

			$http.get(url).then(function (response) {
				if (response.status === 200) {
					if (_.has(response.data, 'auth') && response.data.auth) {
						window.location = '/browser';
					}

					if (_.has(response.data, 'auth') && !response.data.auth) {
						window.location = '/browser/#/auth';
					}

					if (!_.has(response.data, 'auth')) {
						window.location = response.data['oauth2.url'];
					}
				}
			})
		}
	}
}]);

appServices.service('eventService', ['$http', '$q', '$cookies', 'authService',
	function ($http, $q, $cookies, authService) {
		var container = null;

		return {
			getBucketsEndpoint: function () {
				var cookies = $cookies,
					token = false,
					url = '/buckets';

				if (_.has(cookies, 'jwt')) {
					token = cookies.jwt;
				}

				var promise = $http({
					method: 'get',
					url: url,
					headers: {
						'Authorization': 'Bearer ' + token
					}
				}).then(function (success) {
						return success.data;
					},
					function (error) {
						if (error.status === 401) {
							authService.googleRedirect(true);
						}

						return [];
					});

				return promise;
			},
			getEventsEndpoint: function (bucket) {
				var cookies = $cookies,
					token = false,
					url = "/events/" + bucket;

				if (_.has(cookies, 'jwt')) {
					token = cookies.jwt;
				}

				var promise = $http({
						method: 'get',
						url: url,
						headers: {'Authorization': 'Bearer ' + token}
					}).then(function (response) {
						return response.data;
					},
					function (error) {
						if (error.status === 401) {
							authService.googleRedirect(true);
						}

						return [];
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
						deferred.resolve(chart);
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
						deferred.resolve(chart);
					} catch (e) {
						deferred.reject(e);
					}

					return deferred.promise;
				}

				drawHourlyChart().then(function (chart) {
					// whee! success
				}, function (error) {
					// something with the error
				});

				drawMonthlyChart().then(function (chart) {
					// whee! success
				}, function (error) {
					// something with the error
				});
			}
		}
	}]);
