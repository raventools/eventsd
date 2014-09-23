var db = require("./db"),
	gapi = require("./gapi"),
	fs = require("fs"),
	jwt = require("jsonwebtoken"),
	Q = require("q"),
	_ = require("underscore");

var config = JSON.parse(fs.readFileSync('app_config.json'));

/**
 * Internal helper methods
 *
 * @author Kevin Crawley <kevin@raventools.com>
 * @type {{storeTokens: Function, validateProfile: Function, invalidAuth: Function}}
 */
var oauthTools = {
	/**
	 * Creates a signed jwt token, stores the token in the database, and generates persistent cookies.
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param res Object - Express response object
	 * @param id int - Google Plus ID
	 * @param tokens - Google Plus Tokens object
	 */
	storeTokens: function(res, id, tokens) {
		if (_.isObject(tokens)) {
			tokens = JSON.stringify(tokens);
		}

		db.storeUserToken(id, tokens);

		var jwt_token = jwt.sign({
			'gid': id
		}, config.client_secret, { expiresInMinutes: 60*24 });

		res.cookie('jwt', jwt_token, { maxAge: 60*60*24*90*1000 });
		res.cookie('gid', id, { signed: true, maxAge: 60*60*24*90*1000 });
	},
	/**
	 * Validates the Google Plus domain
	 * @todo Get this into the app_config.json
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param profile Object - Google Plus profile
	 * @returns {boolean}
	 */
	validateProfile: function(profile) {
		return (profile.domain === 'raventools.com');
	},
	/**
	 * Invalidates an Auth session by clearing cookies
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param res Object Express response
	 */
	invalidAuth: function(res) {
		res.clearCookie('jwt');
		res.clearCookie('gid');
		res.json({ auth: false })
	}
};

/**
 * OAuth System - Google Api / Google Plus
 *
 * Author: Kevin Crawley <kevin@raventools.com>
 * @type {{oauth2: Function, callback: Function}}
 */
api = {
	/**
	 * Steps through and validates/revalidates a Google Oauth Token (@todo, uncomplicate this - anybody)
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param req Object - Express request object
	 * @param res Object - Express response object
	 */
	oauth2: function(req, res) {
		if (_.has(req.query, 'revalidate')) {
			// route is being used attempt revalidation
			if(_.has(req.cookies, 'jwt') && _.has(req.signedCookies, 'gid')) {
				// the proper stored credentials exist to attempt revalidation
				var deferred = Q.defer();

				// defers a request to check if the stored jwt token is expired/invalid
				jwt.verify(req.cookies.jwt, config.client_secret, function (error, decoded) {
					if (error) {
						deferred.reject(new Error(error));
					} else {
						deferred.resolve(decoded);
					}
				});

				deferred.promise.then(
					// jwt token checks out, we're good
					function(ok) {
						return res.json({ auth: true });
					},
					// restore the token by accessing the db token and revalidating it against google
					function(error) {
						// performs sqlite query against the stored cookie gid
						db.getUserToken(req.signedCookies.gid).then(function(result, error) {
							if (!_.isUndefined(result) && _.isObject(result)) {
								// check the db results for a token
								if (_.has(result, 'tokens') && !_.isNull(result.tokens)) {
									var tokens = JSON.parse(result.tokens);
									// sets the gapi credentials to the values stored in the db
									gapi.setCredentials(tokens);

									// attempt to reauth/refresh gapi tokens
									gapi.refreshToken().then(function(newTokens) {
										// get the gplus profile
										gapi.getPlusProfile().then(function (response) {
											// validate gplus profile
											if (oauthTools.validateProfile(response)) {
												// store the newly updated tokens and auth this request
												oauthTools.storeTokens(res, response.id, newTokens);
												res.json({ auth: true });
											}
										}, function(error) {
											// error retrieving gplus profile
											oauthTools.invalidAuth(res);
										});
									}, function(error) {
										// error refreshing the oauth token
										oauthTools.invalidAuth(res);
									});
								} else {
									// db request failed
									oauthTools.invalidAuth(res);
								}
							}
						});
					}
				);
			} else {
				// nope
				oauthTools.invalidAuth(res);
			}
		} else {
			// this is an actual request for a oauth url
			res.json({
				'oauth2.url': gapi.getOAuthUrl()
			});

		}
	},
	/**
	 * Handles a Oauth2 callback, setting up the necessary Auth objects
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param req Object - Express request object
	 * @param res Object - Express response object
	 */
	callback: function(req, res) {
		var code = req.query.code;

		gapi.getToken(code).then(function(tokens) {
			gapi.setCredentials(tokens);

			// get the gplus profile
			gapi.getPlusProfile().then(function (response) {
				// validate gplus profile
				if (oauthTools.validateProfile(response)) {
					// store the newly obtained tokens and auth this request
					oauthTools.storeTokens(res, response.id, tokens);
					res.redirect('/browser');
				}
			}, function(error) {
				// error retrieving gplus profile
				res.redirect('/browser/#/auth');
			});
		}, function() {
			// an error occured while getting a token
			res.redirect('/browser/#/auth');
		});
	},
	/**
	 * Allows for local override of the authentication system
	 *
	 * @param req
	 * @param res
	 */
	authHook: function(req, res) {
		if (!_.has(config, 'auth_system') || !config.auth_system || config.auth_system == "open") {
			oauthTools.storeTokens(res, '123456', { nope: true });
		}
	}
};

exports = module.exports = api;
