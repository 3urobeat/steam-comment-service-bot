const SteamCommunity = require('steamcommunity');
const Helpers = require("../../node_modules/steamcommunity/components/helpers.js");

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

		if (body.success && body.success.success != SteamCommunity.EResult.OK) {
			callback(Helpers.eresultError(body.success.success));
			return;
		}

		callback(null);
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

		if (body.success && body.success.success != SteamCommunity.EResult.OK) {
			callback(Helpers.eresultError(body.success.success));
			return;
		}

		callback(null);
	}, "steamcommunity");
};