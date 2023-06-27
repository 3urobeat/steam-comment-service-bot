/*
 * File: webSession.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 27.06.2023 12:55:21
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

        // Increase progress bar if one is active
        if (logger.getProgressBar()) logger.increaseProgressBar((100 / Object.keys(this.data.logininfo).length) / 3);


        // Set cookies (otherwise the bot is unable to comment)
        this.community.setCookies(cookies);

        this.controller._statusUpdateEvent(this, Bot.EStatus.ONLINE); // Set status of this account to online


        if (!this.controller.info.readyAfter) logger("info", `[${this.logPrefix}] Got websession and set cookies. Accepting offline friend & group invites...`, false, true, logger.animation("loading")); // Only print message with animation if the bot was not fully started yet
            else logger("info", `[${this.logPrefix}] Got websession and set cookies. Accepting offline friend & group invites...`, false, true);


        // Run check if all friends are in lastcomment.db database for main bot account
        if (this.index == 0) this.controller.checkLastcommentDB(this);


        /* ------------ Accept offline friend and group invites/requests: ------------ */
        // Friends:
        let processedFriendRequests = 0;
        let ignoredFriendRequests   = 0;

        for (let i = 0; i < Object.keys(this.user.myFriends).length; i++) { // Credit: https://dev.doctormckay.com/topic/1694-accept-friend-request-sent-in-offline/
            if (this.user.myFriends[Object.keys(this.user.myFriends)[i]] == 2) {

                if (this.controller.data.advancedconfig.acceptFriendRequests) {
                    let thisfriend = Object.keys(this.user.myFriends)[i];

                    // Accept friend request
                    this.user.addFriend(thisfriend);
                    processedFriendRequests++;

                    // Log message and send welcome message. Delay msg to avoid AccessDenied and RateLimitExceeded errors
                    logger("info", `[${this.logPrefix}] Added user while I was offline! User: ` + thisfriend);

                    setTimeout(() => {
                        if (this.index == 0) this.sendChatMessage(this, { steamID64: String(thisfriend) }, this.controller.data.lang.useradded.replace(/cmdprefix/g, "!"));
                            else logger("debug", "Not sending useradded message because this isn't the main user...");
                    }, 1000 * processedFriendRequests);


                    // Add user to lastcomment database
                    let lastcommentobj = {
                        id: thisfriend,
                        time: Date.now() - (this.controller.data.config.commentcooldown * 60000) // Subtract commentcooldown so that the user is able to use the command instantly
                    };

                    this.controller.data.lastCommentDB.remove({ id: thisfriend }, {}, (err) => { if (err) logger("error", "Error removing duplicate steamid from lastcomment.db on offline friend accept! Error: " + err); }); // Remove any old entries
                    this.controller.data.lastCommentDB.insert(lastcommentobj, (err) => { if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err); });

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

            // Log info msg about ignored friend requests
            if (i + 1 == Object.keys(this.user.myFriends).length && ignoredFriendRequests > 0) {
                logger("info", `Ignored ${ignoredFriendRequests} pending friend request(s) because acceptFriendRequests is turned off in advancedconfig.json.`);
            }
        }

        // Groups:
        for (let i = 0; i < Object.keys(this.user.myGroups).length; i++) {
            if (this.user.myGroups[Object.keys(this.user.myGroups)[i]] == 2) {
                let thisgroup = Object.keys(this.user.myGroups)[i];

                // Check if acceptgroupinvites is set to false and only allow botsgroup invite to be accepted
                if (!this.controller.data.config.acceptgroupinvites) {
                    if (this.controller.data.config.yourgroup.length < 1 && this.controller.data.config.botsgroup.length < 1) return;
                    if (thisgroup != this.controller.data.cachefile.configgroup64id && thisgroup != this.controller.data.cachefile.botsgroupid) return;
                    logger("info", "acceptgroupinvites is turned off but this is an invite to the group set as yourgroup or botsgroup. Accepting invite anyway...");
                }

                // Accept invite and log message
                this.user.respondToGroupInvite(thisgroup, true);
                logger("info", `[${this.logPrefix}] Accepted group invite while I was offline: ` + thisgroup);
            }
        }


        /* ------------ Join botsgroup: ------------ */
        logger("debug", `[${this.logPrefix}] Checking if bot account is in botsgroup...`, false, true, logger.animation("loading"));

        if (this.controller.data.cachefile.botsgroupid && (!this.user.myGroups[this.controller.data.cachefile.botsgroupid] || this.user.myGroups[this.controller.data.cachefile.botsgroupid] != 3)) { // If botsgroupid is defined, not in myGroups or in it but not enum 3
            this.community.joinGroup(new SteamID(this.controller.data.cachefile.botsgroupid));

            logger("info", `[${this.logPrefix}] Joined/Requested to join steam group that has been set as botsgroup.`);
        }


        /* ------------ Set primary group: ------------ */ // TODO: Add further delays? https://github.com/HerrEurobeat/steam-comment-service-bot/issues/165
        if (this.controller.data.advancedconfig.setPrimaryGroup && this.controller.data.cachefile.configgroup64id) {
            logger("info", `[${this.logPrefix}] setPrimaryGroup is enabled and configgroup64id is set, setting ${this.controller.data.cachefile.configgroup64id} as primary group...`, false, true, logger.animation("loading"));

            this.community.editProfile({
                primaryGroup: new SteamID(this.controller.data.cachefile.configgroup64id)
            }, (err) => {
                if (err) logger("err", `[${this.logPrefix}] Error setting primary group: ${err}`, true);
            });
        }


        /* ------------ Check for missing game licenses and start playing: ------------ */
        let startPlaying = () => { if (this.index == 0) this.user.gamesPlayed(this.controller.data.config.playinggames); else this.user.gamesPlayed(this.controller.data.config.childaccplayinggames); };
        let data = this.controller.data;

        let options = {
            includePlayedFreeGames: true,
            filterAppids: this.index == 0 ? data.config.playinggames.filter(e => !isNaN(e)) : data.config.childaccplayinggames.filter(e => !isNaN(e)), // We only need to check for these appIDs. Filter custom game string
            includeFreeSub: false
        };

        // Only request owned apps if we are supposed to idle something
        if (options.filterAppids.length > 0) {
            this.user.getUserOwnedApps(data.cachefile.botaccid[this.index], options, (err, res) => {
                if (err) {
                    logger("error", `[${this.logPrefix}] Failed to get owned apps! Attempting to play set appIDs anyways...`);

                    // Set playinggames for main account and child account
                    startPlaying();
                    return;
                }

                // Check if we are missing a license
                let missingLicenses = this.data.config.playinggames.filter(e => !isNaN(e) && res.apps.filter(f => f.appid == e).length == 0);

                // Redeem missing licenses or start playing if none are missing. Event will get triggered again on change.
                if (missingLicenses.length > 0) {
                    logger("info", `[${this.logPrefix}] Requesting ${missingLicenses.length} missing license(s) before starting to play games set in config...`, false, true, logger.animation("loading"));

                    this.user.requestFreeLicense(missingLicenses, (err) => {
                        if (err) {
                            logger("error", `[${this.logPrefix}] Failed to request missing licenses! Starting to play anyways...`);
                            startPlaying();
                        } else {
                            logger("info", `[${this.logPrefix}] Successfully requested ${missingLicenses.length} missing game license(s)!`);
                            setTimeout(() => startPlaying(), 2500);
                        }
                    });
                } else {
                    logger("debug", `[${this.logPrefix}] Bot webSession: ${options.filterAppids.length} appIDs are set, user is missing 0 of them. Starting to play...`);
                    startPlaying();
                }
            });

        } else { // ...check for custom game which was filtered above

            logger("debug", `[${this.logPrefix}] Bot webSession: No appIDs are set, starting to play custom game if one is set...`);
            startPlaying();
        }

        // Increase progress bar if one is active
        if (logger.getProgressBar()) logger.increaseProgressBar((100 / Object.keys(this.data.logininfo).length) / 3);

    });

};