const SteamID = require('steamid');
const StdLib  = require('@doctormckay/stdlib');

const SteamCommunity = require('steamcommunity');
const Helpers = require('../../node_modules/steamcommunity/components/helpers.js');


SteamCommunity.prototype.postReviewComment = function(userID, appID, message, callback) {
	if (typeof userID == 'string') {
		userID = new SteamID(userID);
	}

	this.httpRequestPost({
		"uri": `https://steamcommunity.com/comment/Recommendation/post/${userID.getSteamID64()}/${appID}/`,
		"form": {
			"comment": message,
			"count": 10,
			"sessionid": this.getSessionID(),
			"json": 1
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

SteamCommunity.prototype.voteReviewHelpful = function(rid, callback) {
	this.httpRequestPost({
		"uri": `https://steamcommunity.com/userreviews/rate/${rid}`,
		"form": {
			"rateup": 'true',
			"sessionid": this.getSessionID(),
			"json": 1
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

SteamCommunity.prototype.voteReviewUnhelpful = function(rid, callback) {
	this.httpRequestPost({
		"uri": `https://steamcommunity.com/userreviews/rate/${rid}`,
		"form": {
			"rateup": 'false',
			"sessionid": this.getSessionID(),
			"json": 1
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

SteamCommunity.prototype.voteReviewFunny = function(rid, callback) {
	this.httpRequestPost({
		"uri": `https://steamcommunity.com/userreviews/votetag/${rid}`,
		"form": {
			"tagid": '1',
			"rateup": 'true',
			"sessionid": this.getSessionID(),
			"json": 1
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

SteamCommunity.prototype.voteReviewRemoveFunny = function(rid, callback) {
	this.httpRequestPost({
		"uri": `https://steamcommunity.com/userreviews/votetag/${rid}`,
		"form": {
			"tagid": '1',
			"rateup": 'false',
			"sessionid": this.getSessionID(),
			"json": 1
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
