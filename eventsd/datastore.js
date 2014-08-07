/**
 * datastore.js
 *
 * used to manage writing of messages to buckets
 */

redis_handle = null;

max_bucket_events = 10;

/**
 * sets redis handle
 */
exports.redis = function(redis) {
	redis_handle = redis;
}

/**
 * Allow override of default bucket limit
 */
exports.setMaxEvents = function(num) {
	max_bucket_events = num;
}

/**
 * inserts a message object into a given bucket
 */
exports.insert = function(ob_event) {

	var ts				= (new Date).getTime();
	var bucket			= ob_event.bucket;
	var sorted_set_key	= "EventsD:"+bucket;
	var encoded_event	= JSON.stringify(ob_event);
	
	// multi() necessary to do these operations atomically
	redis_handle.multi()
		.zadd(sorted_set_key,ts,encoded_event)
		.expire(sorted_set_key, (86400 * 30)) // expire after 30 days
		.zcard(sorted_set_key)
		.zremrangebyrank(sorted_set_key,0,-(max_bucket_events + 1))
		.exec(function(err,replies) {
			if(err) throw err;
		});

}
