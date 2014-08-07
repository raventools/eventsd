var dgram = require("dgram");
var http = require('http'),
	faye = require('faye'),
	SDC = require('statsd-client');
var util = require('util');

// fragment handler module
var fragment = require("./fragment.js");
var datastore = require("./datastore.js");

// redis setup
var redis_config = require("./redis_config.js");
var Redis = require("redis");
redis_client = Redis.createClient(redis_config.port,redis_config.host);

// set up redis clients
fragment.redis(redis_client);
datastore.redis(redis_client);

// pubsub client, for publishing events to pubsub server
var faye_client = new faye.Client('http://localhost:6970/eventsd');

process.on('error',function(err) {
	console.log("caught error...");
	console.log(err);
});

process.on('uncaughtException',function(err) {
	console.log("uncaught exception caught :p");
	console.log(err);
});

// command line regex parameters for development usage. expects a regex as the only parameter
// used to select which buckets to display to the console
var dump_events = (typeof(process.argv[2]) !== 'undefined' && process.argv[2] !== null ? true : false);
var dump_events_regex = process.argv[2] || '';
if(dump_events_regex != '') {
	dump_events_regex = new RegExp(dump_events_regex);
}

// udp listener
var server = dgram.createSocket("udp4");

server.on("message", function (msg, rinfo) { 

		try {
			var str_event = msg+'';
			var ob_event = JSON.parse(str_event);
		} catch(ex) {
			/* black hoel */ 
			console.log("got wrongly formatted message "+str_event.substring(0,80));
			return;
		}

		this.storeMessage = function(ob_event) {
			if(dump_events) {
				if (typeof(dump_events_regex) == 'object') {
					if (dump_events_regex.test(ob_event.bucket)) {
						console.log(JSON.stringify(ob_event,null,2));
					}
				}
				else {
					console.log(JSON.stringify(ob_event,null,2));
				}
			}

			datastore.insert(ob_event);
			publishToFaye(ob_event);

			ob_event = null;
		}

		// is this a message fragment?
		if(ob_event.hash && ob_event.index && ob_event.pieces && ob_event.body) {
			// assemble fragments, calls storeMessage() when we have a complete message
			fragment.frag(ob_event,this.storeMessage);
			return;
		}

		if(!ob_event.bucket) {
			console.log("bucket is required");
			return;
		}

		this.storeMessage(ob_event);


		ob_event = null;
		msg = null;
		rinfo = null;

		console.log(util.inspect(process.memoryUsage()));
	}
);

server.on("listening", function () { 
	var address = server.address(); 
	console.log("server listening " + address.address + ":" + address.port); 
});

function publishToFaye(ob_event) {
	var pubsub_bucket = '/eventsd/'+ob_event.bucket.replace(/\./g,'/');
	faye_client.publish(pubsub_bucket,ob_event);
	ob_event=null;
}

server.bind(6969);
