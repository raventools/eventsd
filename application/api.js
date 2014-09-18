var redis = require("redis"),
	Q = require("q"),
	_ = require("underscore");

var client = redis.createClient();

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

/**
 * Internal Helper Methods
 *
 * @type {{bucketName: Function, keyName: Function, getSize: Function, packageJson: Function}}
 */
var helpers = {
	/**
	 * Converts key into bucket name
	 *
	 * @param key String
	 * @returns {*|XML|string|void}
	 */
	bucketName: function(key) {
		return key.replace("EventsD:", "");
	},
	/**
	 * Converts bucket into key
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param bucket String
	 * @returns {string}
	 */
	keyName: function(bucket) {
		return "EventsD:" + bucket;
	},
	/**
	 * Attempts to calculate size of string
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param str String
	 * @returns {string}
	 */
	getSize: function(str) {
		var size = encodeURI(str).split(/%..|./).length - 1;
		if (size > 1024) {
			size = (size/1024).toFixed(2) + ' kb';
		} else {
			size = size + " b"
		}

		return size;
	},
	/**
	 * Packages a cached json object formatted for use with the Frontend consumer (Browser)
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param res Object - Express response object
	 * @param info string - Short expression of the content
	 * @param data string - JSON object
	 * @param status string optional - Response status
	 */
	packageJson: function(res, info, data, status) {
		var d = new Date();
		d.setMinutes(d.getMinutes()+1);
		res.header('Cache-Control', 'must-revalidate');
		res.header('Expires', d.toUTCString());
		res.header('Content-type', 'application/json');
		res.json({
			status: (_.isString(status)) ? status : 'ok',
			info: (_.isString(info)) ? info : 'unknown',
			data: data
		});
	}
};

/**
 * Browser API endpoints, delivers main content to frontend
 *
 * @type {{events: Function, buckets: Function}}
 */
var api = {
	/**
	 * Delivers events in a given {bucket}
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param req Object - Express request object
	 * @param res Object - Express response object
	 */
	events: function (req, res) {
		var bucket = req.params.bucket,
			table_data = [],
			hour_data = [],
			month_data = {};

		Q.npost(client, "zrange", [helpers.keyName(bucket), 0, 1000]).then(function (results) {
			_.each(_.range(0, 24), function (hour) {
				hour_data[hour] = {
					count: 0,
					display: (hour < 10) ? '0' + hour : hour.toString()
				}
			});

			_.each(results, function (ev) {
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
		}).then(function () {
			var pkg = {
				'month_data': month_data,
				'hour_data': hour_data,
				'table_data': table_data
			};
			helpers.packageJson(res, 'events', pkg);
		});
	},
	/**
	 * Delivers bucket index
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param req Object - Express request object
	 * @param res Object - Express response object
	 */
	buckets: function(req, res) {
		// promises, yeaaaahhhh
		Q.spread([
			Q.ninvoke(client, "keys", "*"),
			Q.npost(client, "zrevrangebyscore", redisPresets.counters)
		], function (keys, counters) {
			var key_data = [],
				csorted = {};

			// php was easier
			csorted = _.object(_.toArray(_.groupBy(counters, function (a, b) {
				return Math.floor(b / 2);
			})));

			_.each(keys, function (element) {
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
				}).then(function () {
					helpers.packageJson(res, 'buckets', key_data);
				});
			});
		});
	}
};

exports = module.exports = api;