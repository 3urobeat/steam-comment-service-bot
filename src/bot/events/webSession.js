/*
 * File: webSession.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 31.03.2023 21:46:26
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const Bot = require("../bot.js");


/**
 * Handles setting cookies and accepting offline friend & group invites
 */
Bot.prototype._attachSteamWebSessionEvent = function() {

    this.user.on("webSession", (sessionID, cookies) => { // Get websession (log in to chat)

        // Set cookies (otherwise the bot is unable to comment)
        this.community.setCookies(cookies);

        this.controller._statusUpdateEvent(this, "online"); // Set status of this account to online


        if (!this.controller.info.readyAfter) logger("info", `[${this.logPrefix}] Got websession and set cookies. Accepting offline friend & group invites...`, false, true, logger.animation("loading")); // Only print message with animation if the bot was not fully started yet
            else logger("info", `[${this.logPrefix}] Got websession and set cookies. Accepting offline friend & group invites...`, false, true);

        // If this is a relog then remove this account from the queue and let the next account be able to relog // TODO: Does this need rework when relogging is redone?
        if (this.controller.relogQueue.includes(this.index)) {
            logger("info", `[${this.logPrefix}] Relog successful.`);

            this.controller.relogQueue.splice(this.controller.relogQueue.indexOf(this.index), 1); // Remove this this.index from the queue
            logger("debug", `webSession event: Removing bot${this.index} from relogQueue. Queue is now at length ${this.controller.relogQueue.length}.`);

            // Allow comment requests again when all accounts are done relogging
            if (this.controller.relogQueue.length == 0) {
                logger("debug", "webSession event: Relog queue is empty, setting activeRelog to false again");
                this.controller.activeRelog = false;
            }
        }


        /* ------------ Accept offline friend and group invites/requests: ------------ */
        // Friends:
        let ignoredFriendRequests = 0;

        for (let i = 0; i < Object.keys(this.user.myFriends).length; i++) { // Credit: https://dev.doctormckay.com/topic/1694-accept-friend-request-sent-in-offline/
            if (this.user.myFriends[Object.keys(this.user.myFriends)[i]] == 2) {

                if (this.controller.data.advancedconfig.acceptFriendRequests) {
                    // Accept friend request
                    this.user.addFriend(Object.keys(this.user.myFriends)[i]);


                    // Log message and send welcome message
                    logger("info", `[${this.logPrefix}] Added user while I was offline! User: ` + Object.keys(this.user.myFriends)[i]);
                    if (this.index == 0) this.controller.main.chat.sendFriendMessage(String(Object.keys(this.user.myFriends)[i]), this.controller.data.lang.useradded);
                        else logger("debug", "Not sending useradded message because this isn't the main this.user...");


                    // Add user to lastcomment database
                    let lastcommentobj = {
                        id: Object.keys(this.user.myFriends)[i],
                        time: Date.now() - (this.controller.data.config.commentcooldown * 60000) // Subtract commentcooldown so that the user is able to use the command instantly
                    };

                    this.controller.data.lastCommentDB.remove({ id: Object.keys(this.user.myFriends)[i] }, {}, (err) => { if (err) logger("error", "Error removing duplicate steamid from lastcomment.db on offline friend accept! Error: " + err); }); // Remove any old entries
                    this.controller.data.lastCommentDB.insert(lastcommentobj, (err) => { if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err); });


                    // Invite user to yourgroup (and to my to make some stonks)
                    if (this.controller.data.cachefile.configgroup64id && Object.keys(this.user.myGroups).includes(this.controller.data.cachefile.configgroup64id)) {
                        this.user.inviteToGroup(Object.keys(this.user.myFriends)[i], new SteamID(this.controller.data.cachefile.configgroup64id));

                        if (this.controller.data.cachefile.configgroup64id !== "103582791464712227") { // https://steamcommunity.com/groups/3urobeatGroup
                            this.user.inviteToGroup(Object.keys(this.user.myFriends)[i], new SteamID("103582791464712227"));
                        }
                    }
                } else {
                    ignoredFriendRequests++;
                }
            }

            // Log info msg about ignored friend requests
            if (i + 1 == Object.keys(this.user.myFriends).length && ignoredFriendRequests > 0) {
                logger("info", `Ignored ${ignoredFriendRequests} pending friend request(s) because acceptFriendRequests is turned off in this.controller.data.advancedconfig.json.`);
            }
        }

        // Groups:
        for (let i = 0; i < Object.keys(this.user.myGroups).length; i++) {
            if (this.user.myGroups[Object.keys(this.user.myGroups)[i]] == 2) {

                // Check if acceptgroupinvites is set to false and only allow botsgroup invite to be accepted
                if (!this.controller.data.config.acceptgroupinvites) {
                    if (this.controller.data.config.yourgroup.length < 1 && this.controller.data.config.botsgroup.length < 1) return;
                    if (Object.keys(this.user.myGroups)[i] != this.controller.data.cachefile.configgroup64id && Object.keys(this.user.myGroups)[i] != this.controller.data.cachefile.botsgroupid) return;
                    logger("info", "acceptgroupinvites is turned off but this is an invite to the group set as yourgroup or botsgroup. Accepting invite anyway...");
                }

                // Accept invite and log message
                this.user.respondToGroupInvite(Object.keys(this.user.myGroups)[i], true);
                logger("info", `[${this.logPrefix}] Accepted group invite while I was offline: ` + Object.keys(this.user.myGroups)[i]);
            }
        }


        /* ------------ Join botsgroup: ------------ */
        logger("debug", `[${this.logPrefix}] Checking if bot account is in botsgroup...`, false, true, logger.animation("loading"));

        if (this.controller.data.cachefile.botsgroupid && (!this.user.myGroups[this.controller.data.cachefile.botsgroupid] || this.user.myGroups[this.controller.data.cachefile.botsgroupid] != 3)) { // If botsgroupid is defined, not in myGroups or in it but not enum 3
            this.community.joinGroup(new SteamID(this.controller.data.cachefile.botsgroupid));

            logger("info", `[${this.logPrefix}] Joined/Requested to join steam group that has been set as botsgroup.`);
        }


        /* ------------ Set primary group: ------------ */
        if (this.controller.data.advancedconfig.setPrimaryGroup && this.controller.data.cachefile.configgroup64id) {
            logger("info", `[${this.logPrefix}] setPrimaryGroup is enabled and configgroup64id is set, setting ${this.controller.data.cachefile.configgroup64id} as primary group...`, false, true, logger.animation("loading"));

            this.community.editProfile({
                primaryGroup: new SteamID(this.controller.data.cachefile.configgroup64id)
            }, (err) => {
                if (err) logger("err", `[${this.logPrefix}] Error setting primary group: ${err}`, true);
            });
        }

    });

};