var express = require("express"),
	fs = require("fs"),
	expressJwt = require("express-jwt"),
	cookieParser = require("cookie-parser"),
	eventsdApi = require("./api"),
	oauth = require("./oauth");

var app = express(),
	config = JSON.parse(fs.readFileSync('app_config.json'));

app.use(cookieParser(config.client_secret));

app.get('/', function(req, res){
	res.redirect('/browser')
});

app.get('/events/:bucket', expressJwt({secret: config.client_secret}), function(req, res) {
	eventsdApi.events(req, res)
});

app.get('/buckets', expressJwt({secret: config.client_secret}), function(req, res) {
	eventsdApi.buckets(req, res)
});

app.use('/oauth2', function(req, res) {
	oauth.oauth2(req, res);
});

app.use('/oauth2callback', function(req, res) {
	oauth.callback(req, res);
});

app.use('/browser', express.static('./public'));

app.listen(config.port);