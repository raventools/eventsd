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

		var getRequest = function(params) {
			var token = false;

			if (_.has($cookies, 'jwt')) {
				token = $cookies.jwt;
			}

			if (!_.has(params, 'success') || !_.isFunction(params.success)) {
				params.success = function() {
					// black hole
				}
			}

			return $http({
				method: 'get',
				url: params.url,
				headers: {
					'Authorization': 'Bearer ' + token
				}
			}).then(params.success, function(error) {
				if (error.status === 401) {
					authService.googleRedirect(true);
				}

				return [];
			});
		};

		return {
			deleteBucketEndpoint: function(bucket) {
				return getRequest({
					url: '/api/delete/' + bucket
				});
			},
			getBucketsEndpoint: function () {
				return getRequest({
					url: '/api/buckets',
					success: function (success) {
						angular.forEach(success.data.data, function (element) {
							element.ts = Date.parse(element.time);
							element.hits = parseFloat(element.hits);
						});

						return success.data;
					}
				});
			},
			getEventsEndpoint: function (bucket) {
				return getRequest({
					url: "/api/events/" + bucket,
					success: function (response) {
						angular.forEach(response.data.data.table_data, function (element) {
							element.ts = Date.parse(element.time);
						});

						if (_.isArray(response.data.data.table_data)) {
							response.data.data.table_data.reverse();
						}

						return response.data;
					}
				});
			},
			getProperty: function () {
				return container;
			},
			setProperty: function (value) {
				container = value;
			},
			formatCode: function (code, time) {
				var deferred = $q.defer(),
					raw = JSON.stringify(code, undefined, 2),
					json = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

				deferred.resolve({
					'time': new Date(time),
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
				var global_table_opts = {
					'backgroundColor': {
						stroke: '#1c1e22',
						strokeWidth: 2,
						fill: '#2e3338'
					},
					'chartArea': {
						width: '80%',
						height: '65%',
						left: '12%'
					},
					hAxis: {
						gridlines: {
							color: '#1c1e22'
						},
						textStyle: {
							color: '#fff'
						}
					},
					vAxis: {
						gridlines: {
							color: '#1c1e22'
						},
						textStyle: {
							color: '#ccc'
						}
					},
					colors: [ '#adadad' ],
					titleTextStyle: {
						color: '#fff'
					}
				};

				function getElement(element) {
					var deferred = $q.defer(),
						chkDom = setInterval(function() {
							var elem = document.getElementById(element);
							if (!_.isEmpty(elem)) {
								deferred.resolve(elem);
								clearTimeout(chkDom);
							}
						}, 5);

					return deferred.promise;
				}

				// parse container data
				function parseContainerData() {
					var deferred = $q.defer(),
						month_data = {},
						hour_data = [];

					_.each(_.range(0, 24), function (hour) {
						hour_data[hour] = {
							count: 0,
							display: (hour < 10) ? '0' + hour : hour.toString()
						}
					});

					_.each(container.data.table_data, function(element) {
						var ev_date = new Date(element.time),
							ev_date_ts = Date.parse(element.time),
							ev_date_month = new Date(ev_date.getFullYear(), ev_date.getMonth(), ev_date.getDate()).getTime(),
							ev_date_yesterday = new Date(ev_date_ts - (24*60*60*1000));

						if (_.has(month_data, ev_date_month)) {
							month_data[ev_date_month]++;
						} else {
							month_data[ev_date_month] = 1;
						}

						if (ev_date_ts > ev_date_yesterday.getTime()) {
							hour_data[ev_date.getHours()].count++;
						}
					});

					deferred.resolve({
						month_data: month_data,
						hour_data: hour_data
					});

					return deferred.promise;
				}

				function drawHourlyChart(data) {
					var array = [];
					array.push(['hour', 'count']);
					_.each(data.hour_data, function (element) {
						array.push([element.display, element.count]);
					});

					var dataTable = google.visualization.arrayToDataTable(array);

					var options = {
						title: 'Activity in past 24 hours',
						legend: {position: 'none'}
					};
					angular.extend(options, global_table_opts);

					getElement('hour-chart').then(function(element) {
						var chart = new google.visualization.LineChart(element);
						chart.draw(dataTable, options);
					});
				}

				function drawMonthlyChart(data) {
					var array = [];
					array.push(['day', 'count']);

					_.each(data.month_data, function (element, index) {
						var date = new Date(parseInt(index));
						array.push([date, element]);
					});
					var dataTable = google.visualization.arrayToDataTable(array);

					var options = {
						title: 'Activity in past 30 days',
						legend: {position: 'none'}
					};
					angular.extend(options, global_table_opts);

					getElement('month-chart').then(function(element) {
						var chart = new google.visualization.LineChart(element);
						chart.draw(dataTable, options);
					});
				}

				parseContainerData().then(function (data) {
					drawHourlyChart(data);
					drawMonthlyChart(data);
				});
			}
		}
	}]);
