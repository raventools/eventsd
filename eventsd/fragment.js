var fs = require("fs");

/**
 * fragment.js
 *
 * used to manage and reassemble fragmented eventsd messages.
 * messages are fragmented when they exceed the MTU.
 */

redis_handle = null;

/**
 * sets redis handle
 */
exports.redis = function(redis) {
	redis_handle = redis;
}

/**
 * handles incoming message fragments and returns completed
 * message when all fragments have been received.
 */
exports.frag = function(msg,cb) {

	// had to wrap this up because of js "scope" "issues"
	defrag = function(hash,index,pieces,body) {

		// mother of god -- what have i done?
		redis_handle.multi()
			.zadd(hash,index,body) // queue zadd() and zcard() for multi exec [1]
			.expire(hash,5)
			.zcard(hash)
			.exec(function(err,replies) { // actually execute zadd and zcard [2]
				if(err) throw err;
				count = replies[2]; // retval from zcard
				// now we go here [3]
				if(count == pieces) { // if we have all the pieces... [4]
					// we queue another multi-exec of zrange() and then del() [5]
					redis_handle.multi()
						.zrange(hash,0,-1)
						.del(hash)
						.exec(function(err,replies) { // execute zrange(), del() [6]
							pieces = replies[0];
							if(err) throw err;
							try { // now we jump here [7]
								cb(JSON.parse(pieces.join(""))); // assemble and parse and call back to store event [8a]
							} catch(e) {
								console.log("problem decoding JSON fragments"); // fail [8b]
							}
						});
				}
			});
	}

	defrag(msg.hash,msg.index,msg.pieces,msg.body);
}
