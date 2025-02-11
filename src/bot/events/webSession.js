/*
 * File: webSession.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-02-11 17:26:08
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const Bot = require("../bot.js");


/**
 * Handles setting cookies and accepting offline friend & group invites
 * @private
 */
Bot.prototype._attachSteamWebSessionEvent = function() {

    this.user.on("webSession", async (sessionID, cookies) => { // Get websession (log in to chat)

        // Increase progress bar if one is active
        if (logger.getProgressBar()) logger.increaseProgressBar((100 / this.data.logininfo.length) / 3);


        // Set cookies to allow sending authenticated requests (e.g. for commenting)
        this.community.setCookies(cookies);


        // Check if account has family view enabled
        if (!this.data.advancedconfig.skipFamilyViewUnlock) {
            logger("info", `[${this.logPrefix}] Checking if this account has family view enabled...`, false, true, logger.animation("loading"));

            if (await this.checkForFamilyView(this.community)) {
                logger("warn", `[${this.logPrefix}] It appears that this account has family view enabled!`, false, false, logger.animation("loading"), true);
                await this.unlockFamilyView(this.community);
            } else {
                logger("debug", `[${this.logPrefix}] Account does not seem to have family view enabled. Proceeding...`, false, true);
            }
        }


        // Update bot's status to progress login queue
        this.controller._statusUpdateEvent(this, Bot.EStatus.ONLINE);

        this.loginData.relogTries = 0;       // Reset relogTries to indicate that this proxy is working should one of the next logOn retries fail
        this.loginData.pendingLogin = false; // Unlock login again

        // Print logged in message with animation on initial login, otherwise without
        if (!this.controller.info.readyAfter) {
            logger("info", `[${this.logPrefix}] Logged in! Accepting pending friend requests & group invites...`, false, true, logger.animation("loading"));
        } else {
            logger("info", `[${this.logPrefix}] Logged in! Accepting pending friend requests & group invites...`, false, true);
        }


        // Run check if all friends are in lastcomment.db database for main bot account
        if (this.index == 0) this.controller.checkLastcommentDB(this);


        /* ------------ Accept offline friend and group invites/requests: ------------ */
        // Friends:
        let processedFriendRequests = 0;
        let ignoredFriendRequests   = 0;

        for (let i = 0; i < Object.keys(this.user.myFriends).length; i++) { // Credit: https://dev.doctormckay.com/topic/1694-accept-friend-request-sent-in-offline/
            if (this.user.myFriends[Object.keys(this.user.myFriends)[i]] == 2) {

                if (this.controller.data.advancedconfig.acceptFriendRequests) {
                    const thisfriend = Object.keys(this.user.myFriends)[i];

                    // Accept friend request
                    this.user.addFriend(thisfriend);
                    processedFriendRequests++;

                    // Log message and send welcome message. Delay msg to avoid AccessDenied and RateLimitExceeded errors
                    logger("info", `[${this.logPrefix}] Added user while I was offline! User: ` + thisfriend);

                    setTimeout(async () => {
                        if (this.index == 0) this.sendChatMessage(this, { userID: String(thisfriend) }, await this.controller.data.getLang("useradded", { "cmdprefix": "!", "langcount": Object.keys(this.data.lang).length }, String(thisfriend)));
                            else logger("debug", `[${this.logPrefix}] Not sending useradded message because this isn't the main bot...`);
                    }, 1000 * processedFriendRequests);


                    // Add user to lastcomment database
                    const time = Date.now() - ((this.controller.data.config.requestCooldown || 0) * 60000); // Subtract requestCooldown (if !undefined) so that the user is able to use the command instantly;

                    this.controller.data.lastCommentDB.update({ id: thisfriend }, { $set: { time: time } }, { upsert: true }, (err) => {
                        if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err);
                    });

                    // Invite user to yourgroup (and to my to make some stonks)
                    if (this.controller.data.cachefile.configgroup64id && Object.keys(this.user.myGroups).includes(this.controller.data.cachefile.configgroup64id)) {
                        this.user.inviteToGroup(thisfriend, new SteamID(this.controller.data.cachefile.configgroup64id));

                        if (this.controller.data.cachefile.configgroup64id !== "103582791464712227") { // https://steamcommunity.com/groups/3urobeatGroup
                            this.user.inviteToGroup(thisfriend, new SteamID("103582791464712227"));
                        }
                    }
                } else {
                    ignoredFriendRequests++;
                }

            }
        }

        // Log info msg about ignored friend requests
        if (ignoredFriendRequests > 0) {
            logger("info", `Ignored ${ignoredFriendRequests} pending friend request(s) because acceptFriendRequests is turned off in advancedconfig.json.`);
        }

        // Groups:
        for (let i = 0; i < Object.keys(this.user.myGroups).length; i++) {
            if (this.user.myGroups[Object.keys(this.user.myGroups)[i]] == 2) {
                const thisgroup = Object.keys(this.user.myGroups)[i];

                // Check if acceptgroupinvites is set to false and only allow botsgroup invite to be accepted
                if (!this.controller.data.config.acceptgroupinvites) {
                    if (!this.controller.data.config.yourgroup && !this.controller.data.config.botsgroup) return;
                    if (thisgroup != this.controller.data.cachefile.configgroup64id && thisgroup != this.controller.data.cachefile.botsgroupid) return;
                    logger("info", "acceptgroupinvites is turned off but this is an invite to the group set as yourgroup or botsgroup. Accepting invite anyway...");
                }

                // Accept invite and log message
                this.user.respondToGroupInvite(thisgroup, true);
                logger("info", `[${this.logPrefix}] Accepted group invite while I was offline: ` + thisgroup);
            }
        }


        // Run the following only on initial login
        if (this.lastDisconnect.timestamp == 0) {

            /* ------------ Join botsgroup: ------------ */
            logger("debug", `[${this.logPrefix}] Checking if bot account is in botsgroup...`);

            if (this.controller.data.cachefile.botsgroupid && (!this.user.myGroups[this.controller.data.cachefile.botsgroupid] || this.user.myGroups[this.controller.data.cachefile.botsgroupid] != 3)) { // If botsgroupid is defined, not in myGroups or in it but not enum 3
                this.community.joinGroup(new SteamID(this.controller.data.cachefile.botsgroupid));

                logger("info", `[${this.logPrefix}] Joined/Requested to join steam group that has been set as botsgroup.`);
            }


            /* ------------ Set primary group: ------------ */ // TODO: Add further delays? https://github.com/3urobeat/steam-comment-service-bot/issues/165
            if (this.controller.data.advancedconfig.setPrimaryGroup && this.controller.data.cachefile.configgroup64id) {
                logger("debug", `[${this.logPrefix}] setPrimaryGroup is enabled and configgroup64id is set, setting '${this.controller.data.cachefile.configgroup64id}' as primary group if not set already...`);

                this.community.getSteamUser(this.user.steamID, (err, res) => {
                    if (err) return logger("err", `[${this.logPrefix}] Failed to get my own profile to check currently set primaryGroup! ${err}`);

                    if (res.primaryGroup.getSteamID64() != this.controller.data.cachefile.configgroup64id) {
                        this.community.editProfile({
                            primaryGroup: new SteamID(this.controller.data.cachefile.configgroup64id)
                        }, (err) => {
                            if (err) logger("err", `[${this.logPrefix}] Error setting primary group: ${err}`, false, false, null, true);
                                else logger("info", `[${this.logPrefix}] Successfully set '${this.controller.data.cachefile.configgroup64id}' as primary group!`, false, false, logger.animation("loading"));
                        });
                    } else {
                        logger("debug", `[${this.logPrefix}] Successfully fetched profile and currently set primaryGroup matches configgroup64id, no need to take action`);
                    }
                });
            }


            /* ------------ Check for missing game licenses and start playing: ------------ */
            this.handleMissingGameLicenses();

        }


        // Increase progress bar if one is active
        if (logger.getProgressBar()) logger.increaseProgressBar((100 / this.data.logininfo.length) / 3);

    });

};
