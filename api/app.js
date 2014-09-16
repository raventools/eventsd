var express = require("express"),
	redis = require("redis"),
	sqlite3 = require("sqlite3"),
	Q = require("q"),
	_ = require("underscore");

var app = express(),
	db = new sqlite3.Database('database.sqlite'),
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
		],
		bucketName: function(key) {
			return key.replace("EventsD:", "");
		},
		keyName: function(bucket) {
			return "EventsD:" + bucket;
		}
	},
	packageJson = function(info, data, status) {
		return JSON.stringify({
				status: (_.isString(status)) ? status : 'ok',
				info: (_.isString(info)) ? info : 'unknown',
				data: data
			}
		);
	};

app.get('/', function(req, res){
	res.send('EventsD Client API Service - Alpha v0.0.1');
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
					'name': redisPresets.bucketName(element),
					'hits': (_.has(csorted, redisPresets.bucketName(element))) ?
						csorted[redisPresets.bucketName(element)] : 0,
					'time': (_.isObject(time)) ?
						time.getTime() : 0
				};

				key_data.push(obj);
			}).then(function() {
				res.send(packageJson('buckets', key_data));
			});
		});
	});
});

app.listen(5910);