var sqlite3 = require("sqlite3"),
	fs = require("fs"),
	Q = require("q"),
	config = JSON.parse(fs.readFileSync('app_config.json')),
	sqlite = new sqlite3.Database(config.db_file);

/**
 * Initializes Database
 */
sqlite.serialize(function() {
	sqlite.run("CREATE TABLE IF NOT EXISTS Users(id INTEGER, tokens TEXT);")
});

/**
 * Database Access Layer for use with the EventsD API / Oauth System
 *
 * @author Kevin Crawley <kevin@raventools.com>
 * @type {{storeUserToken: Function, getUserToken: Function}}
 */
var api = {
	/**
	 * Inserts/Updates a User Token
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param id
	 * @param tokens
	 */
	storeUserToken: function(id, tokens) {
		var updateToken = function(err, row) {
			if (row === undefined) {
				sqlite.run("INSERT INTO Users(id, tokens) VALUES(?, ?)", [id, tokens]);
			} else {
				sqlite.run("UPDATE Users SET tokens = ? WHERE id = ?", [tokens, id]);
			}
		};

		sqlite.get("SELECT id FROM Users WHERE id = ?", id, updateToken);
	},
	/**
	 * Fetches User record from Database
	 *
	 * @author Kevin Crawley <kevin@raventools.com>
	 * @param id
	 * @returns {*}
	 */
	getUserToken: function(id) {
		return Q.npost(sqlite, "get", ["SELECT * FROM Users where id = ?", id]);
	}
};

module.exports = api;