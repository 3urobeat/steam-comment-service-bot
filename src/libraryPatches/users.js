const SteamID = require("steamid");
const SteamCommunity = require('steamcommunity');

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

		if (body.success) {
			callback(null);
		} else {
			callback(new Error("Unknown error"));
		}
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

		if (body.success) {
			callback(null);
		} else {
			callback(new Error("Unknown error"));
		}
	}, "steamcommunity");
};