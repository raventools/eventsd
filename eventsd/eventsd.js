var dgram = require("dgram");
var mongo = require('mongodb'), Server = mongo.Server, Db = mongo.Db;
var http = require('http'),
	faye = require('faye'),
	SDC = require('statsd-client');
var util = require('util');

// fragment handler module
var fragment = require("./fragment.js");

// redis setup
var redis_config = require("./redis_config.js");
var Redis = require("redis");
redis_client = Redis.createClient(redis_config.port,redis_config.host);

fragment.redis(redis_client);

// pubsub client, for publishing events to pubsub server
var faye_client = new faye.Client('http://localhost:6970/eventsd');

// mongo connection
var mongo_server = new Server('localhost',27017, {auto_reconnect: true});
var db = new Db('eventsd', mongo_server, {safe:true});
db.open(function(err, db) {
	if(!err) {
		console.log("connected to mongo");
	} else {
		console.log("error connecting to mongo: "+err);
	}
});

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

server.on("message", function (msg, rinfo) 
	{ 
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
		//			console.log(JSON.stringify(ob_event,null,2));
				}
			}

			try {
				db.createCollection(ob_event.bucket, {safe:false,capped:true,size:10485760,max:10000}, 
					function(err,collection) {
						insertIntoCollection(collection,ob_event);
						ob_event=null;
					});
			} catch(ex) {
				console.log("CREATE COLLECTION exception");
				console.log(ex);
			}

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

//		console.log(util.inspect(process.memoryUsage()));

	}
);

server.on("listening", function () 
	{ 
		var address = server.address(); 
		console.log("server listening " + address.address + ":" + address.port); 
	}
);

function insertIntoCollection(collection,ob_event) {

	var now = new Date();
	var pubsub_bucket = '/eventsd/'+ob_event.bucket.replace(/\./g,'/');
	ob_event.ts = now;

	if(collection) {
		collection.insert(ob_event, {safe:false}, function() {
				publishToFaye(pubsub_bucket,ob_event);
				ob_event = null;
			});
	}
}

function publishToFaye(pubsub_bucket,ob_event) {
	faye_client.publish(pubsub_bucket,ob_event);
	ob_event=null;
}

server.bind(6969);
