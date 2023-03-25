/*
 * File: attachSteamEvents.js
 * Project: steam-comment-service-bot
 * Created Date: 20.03.2023 16:47:39
 * Author: 3urobeat
 *
 * Last Modified: 25.03.2023 21:04:22
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot.js");


/**
 * Attaches all events from SteamUser
 */
Bot.prototype._attachSteamEvents = function() {

    /* ------------ Events: ------------ */
    this.user.on("error", (err) => { // Handle errors that were caused during logOn
        require("../events/error.js").run(err, this.index, this.logPrefix, this.logOnOptions, this.user);
    });

    this.user.on("loggedOn", () => { // This account is now logged on
        require("../events/loggedOn.js").run(this.index, this.logPrefix, this.user, this.community);
    });

    this.user.on("webSession", (sessionID, cookies) => { // Get websession (log in to chat)
        require("../events/webSession.js").run(this.index, this.logPrefix, this.user, this.community, cookies);
    });

    // Accept Friend & Group requests/invites
    this.user.on("friendRelationship", (steamID, relationship) => {
        require("../events/relationship.js").friendRelationship(this.index, this.logPrefix, this.user, steamID, relationship);
    });

    this.user.on("groupRelationship", (steamID, relationship) => {
        require("../events/relationship.js").groupRelationship(this.logPrefix, this.user, steamID, relationship);
    });


    /* ------------ Message interactions: ------------ */
    this.user.on("friendMessage", function(steamID, message) {
        require("../events/friendMessage.js").run(this.index, this.logPrefix, this.user, this.community, steamID, message);
    });

    // Display message when connection was lost to Steam
    this.user.on("disconnected", (eresult, msg) => {
        require("../events/disconnected.js").run(this.index, this.logPrefix, this.loginInfo, this.user, msg);
    });


    // Get new websession as sometimes the this.user would relog after a lost connection but wouldn't get a websession. Read more about cookies & expiration: https://dev.doctormckay.com/topic/365-cookies/
    let lastWebSessionRefresh = Date.now(); // Track when the last refresh was to avoid spamming webLogOn() on sessionExpired

    this.community.on("sessionExpired", () => {
        if (Date.now() - lastWebSessionRefresh < 15000) return; // Last refresh was 15 seconds ago so ignore this call

        logger("info", `[${this.logPrefix}] Session seems to be expired. Trying to get new websession...`);
        lastWebSessionRefresh = Date.now(); // Update time
        this.user.webLogOn();
    });

};