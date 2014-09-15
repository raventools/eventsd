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
		loadCharts: function () {
			function drawHourlyChart() {
				var array = [];
				array.push(['hour', 'count']);
				_.each(container.data.hour_data, function (element, index) {
					array.push([index, element]);
				});
				var data = google.visualization.arrayToDataTable(array);

				var options = {
					title: 'Activity in past 24 hours',
					legend: {position: 'none'}
				};

				var chart = new google.visualization.LineChart(document.getElementById('hour-chart'));
				chart.draw(data, options);
			}

			function drawMonthlyChart() {
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

				var chart = new google.visualization.LineChart(document.getElementById('month-chart'));
				chart.draw(data, options);
			}

			drawHourlyChart();
			drawMonthlyChart();
		}
	}
}]);
