const SteamCommunity = require('steamcommunity');
const EResult = SteamCommunity.EResult;

/**
 * Downvotes a sharedfile
 * @param {string} sid - ID of the sharedfile
 * @param {function} callback - Takes only an Error object/null as the first argument
 */
SteamCommunity.prototype.voteDownSharedFile = function(sid, callback) {
	this.httpRequestPost({
		"uri": "https://steamcommunity.com/sharedfiles/votedown",
		"form": {
			"id": sid,
			"json": "1",
			"sessionid": this.getSessionID()
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
			let err = new Error(body.message || SteamCommunity.EResult[body.success]);
			err.eresult = err.code = body.success;
			callback(err);
			return;
		}

		callback(null);
	}, "steamcommunity");
};

/**
 * Upvotes a sharedfile
 * @param {string} sid - ID of the sharedfile
 * @param {function} callback - Takes only an Error object/null as the first argument
 */
SteamCommunity.prototype.voteUpSharedFile = function(sid, callback) {
	this.httpRequestPost({
		"uri": "https://steamcommunity.com/sharedfiles/voteup",
		"form": {
			"id": sid,
			"json": "1",
			"sessionid": this.getSessionID()
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
			let err = new Error(body.message || SteamCommunity.EResult[body.success]);
			err.eresult = err.code = body.success;
			callback(err);
			return;
		}

		callback(null);
	}, "steamcommunity");
};