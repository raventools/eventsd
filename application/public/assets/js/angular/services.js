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
					url = '/api/buckets';

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
						angular.forEach(success.data.data, function(element){
							var date = new Date(element.time);
							date.setHours(date.getHours()+(date.getTimezoneOffset()/60));
							element.ts = date.getTime();
						});

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
					url = "/api/events/" + bucket;

				if (_.has(cookies, 'jwt')) {
					token = cookies.jwt;
				}

				var promise = $http({
						method: 'get',
						url: url,
						headers: {'Authorization': 'Bearer ' + token}
					}).then(function (response) {
						angular.forEach(response.data.data.table_data, function(element) {
							var date = new Date(element.time);
							date.setHours(date.getHours()+(date.getTimezoneOffset()/60));
							element.ts = date.getTime();
							element.hits = parseFloat(element.hits);
						});

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
				console.log(time);
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
							month_utc = new Date(ev_date.getUTCFullYear(), ev_date.getUTCMonth(), ev_date.getUTCDate()).getTime(),
							yesterday = new Date(ev_date.getTime() - (24*60*60*1000));

						if (_.has(month_data, month_utc)) {
							month_data[month_utc]++;
						} else {
							month_data[month_utc] = 0;
						}

						if (month_utc > yesterday) {
							hour_data[ev_date.getUTCHours()].count++;
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

					var chart = new google.visualization.LineChart(document.getElementById('hour-chart'));
					chart.draw(dataTable, options);
				}

				function drawMonthlyChart(data) {
					var array = [];
					array.push(['day', 'count']);

					_.each(data.month_data, function (element, index) {
						var date = new Date(parseInt(index));
						var utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
						array.push([utcDate, element]);
					});
					var dataTable = google.visualization.arrayToDataTable(array);

					var options = {
						title: 'Activity in past 30 days',
						legend: {position: 'none'}
					};
					angular.extend(options, global_table_opts);

					var chart = new google.visualization.LineChart(document.getElementById('month-chart'));
					chart.draw(dataTable, options);
				}

				parseContainerData().then(function (data) {
					drawHourlyChart(data);
					drawMonthlyChart(data);
				});
			}
		}
	}]);
