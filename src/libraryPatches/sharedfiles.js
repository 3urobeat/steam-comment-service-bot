const SteamCommunity = require('steamcommunity');
const EResult = SteamCommunity.EResult;
const SteamID = require('steamid');

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

/**
 * Posts a comment to a sharedfile
 * @param {SteamID | String} userID - ID of the user associated to this sharedfile
 * @param {String} sharedFileId - ID of the sharedfile
 * @param {String} message - Content of the comment to post
 * @param {function} callback - Takes only an Error object/null as the first argument
 */
SteamCommunity.prototype.postSharedFileComment = function(userID, sharedFileId, message, callback) {
	if (typeof userID === "string") {
		userID = new SteamID(userID);
	}

	this.httpRequestPost({
		"uri": `https://steamcommunity.com/comment/PublishedFile_Public/post/${userID.toString()}/${sharedFileId}/`,
		"form": {
			"comment": message,
			"count": 10,
			"json": 1,
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

		if (body.success) {
			callback(null);
		} else {
			callback(new Error(body.error));
		}
	}, "steamcommunity");
};