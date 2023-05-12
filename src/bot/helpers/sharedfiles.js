/*
 * File: sharedfiles.js
 * Project: steam-comment-service-bot
 * Created Date: 12.05.2023 20:02:24
 * Author: 3urobeat
 *
 * Last Modified: 12.05.2023 22:09:22
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// My sharedfiles support implementation for the node-steamcommunity library

const SteamID = require("steamid");

const Bot = require("../bot.js");


/**
 * Posts a comment to a sharedfile
 * @param {SteamID | String} userID ID of the user associated to this sharedfile
 * @param {String} sid ID of the sharedfileof
 * @param {String} message Content of the comment to post
 * @param {function} [callback] Called with `err`, `null` on success, `Error` object on failure.
 */
Bot.prototype.postSharedfileComment = function(userID, sid, message, callback) {
    if (typeof userID === "string") {
        userID = new SteamID(userID);
    }

    this.community.httpRequestPost({
        "uri": `https://steamcommunity.com/comment/PublishedFile_Public/post/${userID.toString()}/${sid}/`,
        "form": {
            "comment": message,
            "count": 10,
            "sessionid": this.community.getSessionID()
        }
    }, function(err, response, body) { // eslint-disable-line
        if (!callback) {
            return;
        }

        callback(null || err);
    }, "steamcommunity");
};


/**
 * Deletes a comment from a sharedfile's comment section
 * @param {SteamID | String} userID ID of the user associated to this sharedfile
 * @param {String} sid ID of the sharedfileof
 * @param {String} cid ID of the comment to delete
 * @param {function} [callback] Called with `err`, `null` on success, `Error` object on failure.
 */
Bot.prototype.deleteSharedfileComment = function(userID, sid, cid, callback) {
    if (typeof userID === "string") {
        userID = new SteamID(userID);
    }

    this.community.httpRequestPost({
        "uri": `https://steamcommunity.com/comment/PublishedFile_Public/delete/${userID.toString()}/${sid}/`,
        "form": {
            "gidcomment": cid,
            "count": 10,
            "sessionid": this.community.getSessionID()
        }
    }, function(err, response, body) { // eslint-disable-line
        if (!callback) {
            return;
        }

        callback(null || err);
    }, "steamcommunity");
};

/**
 * Downvotes a sharedfile
 * @param {String} sid ID of the sharedfile
 * @param {function} [callback] Called with `err`, `null` on success, `Error` object on failure.
 */
Bot.prototype.voteDownSharedfile = function(sid, callback) {
    this.community.httpRequestPost({
        "uri": "https://steamcommunity.com/sharedfiles/votedown",
        "form": {
            "id": sid,
            "sessionid": this.community.getSessionID()
        }
    }, function(err, response, body) { // eslint-disable-line
        if (!callback) {
            return;
        }

        callback(null || err);
    }, "steamcommunity");
};

/**
 * Upvotes a sharedfile
 * @param {String} sid ID of the sharedfile
 * @param {function} [callback] Called with `err`, `null` on success, `Error` object on failure.
 */
Bot.prototype.voteUpSharedfile = function(sid, callback) {
    this.community.httpRequestPost({
        "uri": "https://steamcommunity.com/sharedfiles/voteup",
        "form": {
            "id": sid,
            "sessionid": this.community.getSessionID()
        }
    }, function(err, response, body) { // eslint-disable-line
        if (!callback) {
            return;
        }

        callback(null || err);
    }, "steamcommunity");
};