const SteamCommunity = require('steamcommunity');

/**
 * Follows a curator page
 * @param {string} clanid - ID of the curator
 * @param {function} callback - Takes only an Error object/null as the first argument
 */
SteamCommunity.prototype.followCurator = function(clanid, callback) {
	this.httpRequestPost({
		"uri": "https://store.steampowered.com/curators/ajaxfollow",
		"form": {
			"clanid": clanid,
			"sessionid": this.getSessionID(),
			"follow": 1
		},
		"json": true
	}, (err, res, body) => {
		if (!callback) {
			return;
		}

		if (err) {
			callback(err);
			return;
		}

		if (body.success) {
			callback(null);
		} else {
			callback(new Error(EResult[body] || ("Error " + body)));
		}
	}, "steamcommunity");
};

/**
 * Unfollows a curator page
 * @param {string} clanid - ID of the curator
 * @param {function} callback - Takes only an Error object/null as the first argument
 */
SteamCommunity.prototype.unfollowCurator = function(clanid, callback) {
	this.httpRequestPost({
		"uri": "https://store.steampowered.com/curators/ajaxfollow",
		"form": {
			"clanid": clanid,
			"sessionid": this.getSessionID(),
			"follow": 0
		},
		"json": true
	}, (err, res, body) => {
		if (!callback) {
			return;
		}

		if (err) {
			callback(err);
			return;
		}

		if (body.success) {
			callback(null);
		} else {
			callback(new Error(EResult[body] || ("Error " + body)));
		}
	}, "steamcommunity");
};