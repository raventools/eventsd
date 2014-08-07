var http = require('http'),
	faye = require('faye'),
	SDC = require('statsd-client');

// statsd object 
// TODO make configurable
sdc = new SDC({host:'localhost'});

var faye_server = new faye.NodeAdapter({mount: '/eventsd', timeout:60});

faye_server.bind('publish', function(clientID, channel, data) { 
		sdc.increment('api.eventsd.pubsub.published');
//		console.log('published message to '+channel);
	}
);

faye_server.bind('subscribe', function(clientID, channel) {
		console.log('client subscribed to '+channel);
	}
);

faye_server.listen(6970);
