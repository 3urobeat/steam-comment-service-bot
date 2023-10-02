const SteamID = require("steamid");
const SteamCommunity = require('steamcommunity');
const Helpers = require("../../node_modules/steamcommunity/components/helpers.js");

SteamCommunity.prototype.followUser = function(userID, callback) {
	if(typeof userID === 'string') {
		userID = new SteamID(userID);
	}

	this.httpRequestPost({
		"uri": `https://steamcommunity.com/profiles/${userID.toString()}/followuser/`,
		"form": {
			"sessionid": this.getSessionID(),
		},
		"json": true
	}, function(err, response, body) {
		if (!callback) {
			return;
		}

		if (err) {
			callback(err);
			return;
		}

		if (body.success && body.success != SteamCommunity.EResult.OK) {
			callback(Helpers.eresultError(body.success));
			return;
		}

		callback(null);
	}, "steamcommunity");
};

SteamCommunity.prototype.unfollowUser = function(userID, callback) {
	if(typeof userID === 'string') {
		userID = new SteamID(userID);
	}

	this.httpRequestPost({
		"uri": `https://steamcommunity.com/profiles/${userID.toString()}/unfollowuser/`,
		"form": {
			"sessionid": this.getSessionID(),
		},
		"json": true
	}, function(err, response, body) {
		if (!callback) {
			return;
		}

		if (err) {
			callback(err);
			return;
		}

		if (body.success && body.success != SteamCommunity.EResult.OK) {
			callback(Helpers.eresultError(body.success));
			return;
		}

		callback(null);
	}, "steamcommunity");
};