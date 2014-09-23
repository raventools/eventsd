var dgram = require('dgram'),
		dns	 = require('dns');

var Client = function (host, port, globalize, cacheDns) {
	var options = host || {},
				 self = this;

	if(arguments.length > 1 || typeof(host) === 'string'){
		options = {
			host		: host,
			port		: port,
			globalize	: globalize,
			cacheDns	: cacheDns
		};
	}

	this.host	 = options.host || 'localhost';
	this.port	 = options.port || 6969;
	this.socket = dgram.createSocket('udp4');

	if(options.cacheDns === true){
		dns.lookup(options.host, function(err, address, family){
			if(err == null){
				self.host = address;
			}
		});
	}

	if(options.globalize){
		global.eventsd = this;
	}
};

Client.prototype.send = function (bucket, obj, callback) {
	var message = {"bucket":bucket,"datetime":new Date(),"data":obj}
		buf = new Buffer(JSON.stringify(message));

	this.socket.send(buf, 0, buf.length, this.port, this.host, callback);
};

exports = module.exports = Client;
exports.EventsD = Client;
