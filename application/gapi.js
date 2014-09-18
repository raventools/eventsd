var fs = require("fs"),
	google = require("googleapis"),
	Q = require("q"),
	config = JSON.parse(fs.readFileSync('app_config.json')),
	OAuth2 = google.auth.OAuth2,
	plus = google.plus('v1');

if (config.hasOwnProperty('auth_system') && config.auth_system === 'google') {
	var oauth2client = new OAuth2(config.client_id, config.client_secret, config.client_redirect);
}

/**
 * Gapi Service - Provides Oauth Services based on Google+ Profile
 *
 * @author Kevin Crawley <kevin@raventools.com>
 * @type {{getOAuthUrl: Function, getToken: Function, refreshToken: Function, getPlusProfile: Function, setCredentials: Function}}
 */
var api = {
	/**
	 * Returns formatted oauth url
	 *
	 * @returns {string}
	 */
	getOAuthUrl: function () {
		return oauth2client.generateAuthUrl({
			access_type: 'offline',
			scope: 'https://www.googleapis.com/auth/plus.profile.emails.read'
		}) + '&approval_prompt=force';
	},
	/**
	 * Resolves Oauth2 token object
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param code
	 * @returns {promise|*|Q.promise}
	 */
	getToken: function (code) {
		var deferred = Q.defer();

		oauth2client.getToken(code, function (err, tokens) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(tokens);
			}
		});

		return deferred.promise;
	},
	/**
	 * Refreshes Oauth2 token and resolves with a new Oauth2 token object
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @returns {promise|*|Q.promise}
	 */
	refreshToken: function () {
		var deferred = Q.defer();

		oauth2client.refreshAccessToken(function (err, tokens) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(tokens);
			}
		});

		return deferred.promise;
	},
	/**
	 * Resolves with a complete Google+ Profile
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @returns {promise|*|Q.promise}
	 */
	getPlusProfile: function () {
		var deferred = Q.defer();

		plus.people.get({userId: 'me'}, function (err, response) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(response);
			}
		});

		return deferred.promise;
	},
	/**
	 * Sets Oauth2 global credentials
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param tokens
	 */
	setCredentials: function (tokens) {
		oauth2client.setCredentials(tokens);
		google.options({auth: oauth2client}); // set auth as a global default;
	}
};

exports = module.exports = api;