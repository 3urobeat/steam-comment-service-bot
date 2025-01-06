const SteamCommunity = require('steamcommunity');
const EResult = SteamCommunity.EResult;
const SteamID = require('steamid');
const Helpers = require("../../node_modules/steamcommunity/components/helpers.js");

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
			callback(Helpers.eresultError(body.success));
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
			callback(Helpers.eresultError(body.success));
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

/**
 * Subscribes to a workshop item sharedfile.
 * @param {String} sharedFileId - ID of the sharedfile
 * @param {String} appid - ID of the app associated to this sharedfile
 * @param {function} callback - Takes only an Error object/null as the first argument
 */
SteamCommunity.prototype.subscribeWorkshopSharedFile = function(sharedFileId, appid, callback) {
	this.httpRequestPost({
		"uri": "https://steamcommunity.com/sharedfiles/subscribe",
		"form": {
			"id": sharedFileId,
			"appid": appid,
			"sessionid": this.getSessionID()
		}
	}, function(err, response, body) {
		if (!callback) {
			return;
		}

		callback(err);
	}, "steamcommunity");
};

/**
 * Unsubscribes from a workshop item sharedfile.
 * @param {String} sharedFileId - ID of the sharedfile
 * @param {String} appid - ID of the app associated to this sharedfile
 * @param {function} callback - Takes only an Error object/null as the first argument
 */
SteamCommunity.prototype.unsubscribeWorkshopSharedFile = function(sharedFileId, appid, callback) {
	this.httpRequestPost({
		"uri": "https://steamcommunity.com/sharedfiles/unsubscribe",
		"form": {
			"id": sharedFileId,
			"appid": appid,
			"sessionid": this.getSessionID()
		}
	}, function(err, response, body) {
		if (!callback) {
			return;
		}

		callback(err);
	}, "steamcommunity");
};
