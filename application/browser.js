var express = require("express"),
	auth = require("basic-auth"),
	fs = require("fs");

var app = express(),
	config = JSON.parse(fs.readFileSync('app_config.json'));

app.use(function(req, res, next) {
	var user = auth(req);

	if (user === undefined || user['name'] !== config.browser_auth || user['pass'] !== config.browser_pass) {
		res.statusCode = 401;
		res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
		res.end('Unauthorized');
	} else {
		next();
	}
});

app.use('/browser', express.static('./public'));

app.listen(config.browser_port);