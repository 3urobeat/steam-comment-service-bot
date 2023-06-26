const SteamCommunity = require('steamcommunity');

/**
 * Downvotes a sharedfile
 * @param {String} sid - ID of the sharedfile
 * @param {function} callback - Takes only an Error object/null as the first argument
 */
SteamCommunity.prototype.voteDownSharedFile = function(sid, callback) {
	this.httpRequestPost({
		"uri": "https://steamcommunity.com/sharedfiles/votedown",
		"form": {
			"id": sid,
			"sessionid": this.getSessionID()
		}
	}, function(err, response, body) {
		if (!callback) {
			return;
		}

		callback(null || err);
	}, "steamcommunity");
};

/**
 * Upvotes a sharedfile
 * @param {String} sid - ID of the sharedfile
 * @param {function} callback - Takes only an Error object/null as the first argument
 */
SteamCommunity.prototype.voteUpSharedFile = function(sid, callback) {
	this.httpRequestPost({
		"uri": "https://steamcommunity.com/sharedfiles/voteup",
		"form": {
			"id": sid,
			"sessionid": this.getSessionID()
		}
	}, function(err, response, body) {
		if (!callback) {
			return;
		}

		callback(null || err);
	}, "steamcommunity");
};