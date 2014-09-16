var express = require("express"),
	redis = require("redis"),
	sqlite3 = require("sqlite3"),
	Q = require("q"),
	_ = require("underscore"),
	fs = require("fs"),
	browser = require("./browser.js");

var app = express(),
	config = JSON.parse(fs.readFileSync('app_config.json')),
	db = new sqlite3.Database(config.db_file),
	client = redis.createClient();

var redisPresets = {
	counters: [
		"EventsD:bucket_scores:sorted_set",
		"+inf",
		"-inf",
		"withscores"
	],
	ignores: [
		'EventsD:bucket_scores:sorted_set'
	]
};

var helpers = {
	bucketName: function(key) {
		return key.replace("EventsD:", "");
	},
	keyName: function(bucket) {
		return "EventsD:" + bucket;
	},
	getSize: function(s) {
		var size = encodeURI(s).split(/%..|./).length - 1;
		if (size > 1024) {
			size = size.toFixed(2) + ' kb';
		} else {
			size = size + " b"
		}

		return size;
	},
	packageJson: function(res, info, data, status) {
		var d = new Date();
		d.setMinutes(d.getMinutes()+1);
		res.header('Cache-Control', 'must-revalidate');
		res.header('Expires', d.toUTCString());
		res.header('Content-type', 'application/json');
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Credentials', true);
		res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type');
		res.send(JSON.stringify({
				status: (_.isString(status)) ? status : 'ok',
				info: (_.isString(info)) ? info : 'unknown',
				data: data
			}
		));
	}
};

app.get('/', function(req, res){
	res.send('EventsD Client API Service - Alpha v0.0.1');
});

app.get('/events/:bucket', function(req, res) {
	var bucket = req.params.bucket,
		table_data = [],
		hour_data = [],
		month_data = {};

	Q.npost(client, "zrange", [helpers.keyName(bucket), 0, 1000]).then(function (results) {
		_.each(_.range(0,24), function(hour) {
			hour_data[hour] = {
				count: 0,
				display: (hour < 10) ? '0'+hour : hour.toString()
			}
		});

		_.each(results, function(ev) {
			var event = JSON.parse(ev),
				date = new Date(event.datetime),
				dateString = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();

			if (!_.has(month_data, dateString)) {
				month_data[dateString] = 0;
			}
			month_data[dateString]++;
			hour_data[date.getHours()].count++;

			table_data.push({
				name: bucket,
				size: helpers.getSize(ev),
				time: date.getTime(),
				data: event.data
			});
		});
		table_data.reverse();
	}).then(function() {
		var pkg = {
			'month_data': month_data,
			'hour_data': hour_data,
			'table_data': table_data
		};
		helpers.packageJson(res, 'events', pkg);
	})
});

app.get('/buckets', function(req, res) {
	// promises, yeaaaahhhh
	Q.spread([
		Q.ninvoke(client, "keys", "*"),
		Q.npost(client, "zrevrangebyscore", redisPresets.counters)
	], function(keys, counters) {
		var key_data = [],
			csorted = {};

		// php was easier
		csorted = _.object(_.toArray(_.groupBy(counters, function(a,b) {
			return Math.floor(b/2);
		})));

		_.each(keys, function(element) {
			if (_.contains(redisPresets.ignores, element)) {
				return;
			}

			Q.npost(client, "zrevrange", [element, 0, 1]).then(function (latest) {
				var bucket_data = {},
					time;

				if (_.isArray(latest) && 0 in latest) {
					bucket_data = JSON.parse(latest[0]);
					time = new Date(bucket_data.datetime);
				}

				var obj = {
					'name': helpers.bucketName(element),
					'hits': (_.has(csorted, helpers.bucketName(element))) ?
						csorted[helpers.bucketName(element)] : 0,
					'time': (_.isObject(time)) ?
						time.getTime() : 0
				};

				key_data.push(obj);
			}).then(function() {
				helpers.packageJson(res, 'buckets', key_data);
			});
		});
	});
});

app.listen(config.api_port);