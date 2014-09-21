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
	bucketName: function (key) {
		return key.replace("EventsD:", "");
	},
	/**
	 * Converts bucket into key
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param bucket String
	 * @returns {string}
	 */
	keyName: function (bucket) {
		return "EventsD:" + bucket;
	},
	/**
	 * Attempts to calculate size of string
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param str String
	 * @returns {string}
	 */
	getSize: function (str) {
		var size = encodeURI(str).split(/%..|./).length - 1;
		if (size > 1024) {
			size = (size / 1024).toFixed(2) + ' kb';
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
	packageJson: function (res, info, data, status) {
		var d = new Date();
		d.setMinutes(d.getMinutes() + 1);
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
			table_data = [];

		Q.npost(client, "zrange", [helpers.keyName(bucket), 0, 1000]).then(function (results) {
			_.each(results, function (ev) {
				var event = JSON.parse(ev),
					time = new Date(event.datetime);

				table_data.push({
					name: bucket,
					size: helpers.getSize(ev),
					time: time.toUTCString(),
					data: event.data
				});
			});
		}).then(function () {
			helpers.packageJson(res, 'events', {
				table_data: table_data
			});
		});
	},
	/**
	 * Delivers bucket index
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param req Object - Express request object
	 * @param res Object - Express response object
	 */
	buckets: function (req, res) {
		var promises = [];

		Q.spread([
			Q.ninvoke(client, "keys", "EventsD:*"),
			Q.npost(client, "zrevrangebyscore", redisPresets.counters)
		], function (keys, counters) {
			var key_data = [],
				csorted = {},
				deferred = Q.defer();

			// php was easier
			csorted = _.object(_.toArray(_.groupBy(counters, function (a, b) {
				return Math.floor(b / 2);
			})));

			_.each(keys, function (element) {
				var defer = Q.defer();

				if (_.contains(redisPresets.ignores, element)) {
					return;
				}

				var promise = Q.npost(client, "zrevrange", [element, 0, 1]).then(function (latest) {
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
							time.toUTCString() : 0
					};

					key_data.push(obj);
				}).then(function () {
					defer.resolve();
				});

				promises.push(promise);
			});

			Q.all(promises).then(function () {
				deferred.resolve();
			});

			deferred.promise.done(function () {
				helpers.packageJson(res, 'buckets', key_data);
			})
		});
	},
	delete: function(req, res) {
		Q.ninvoke(client, "del", helpers.keyName(req.params.bucket)).done(function() {
			helpers.packageJson(res, 'delete', null);
		})
	}
};

exports = module.exports = api;