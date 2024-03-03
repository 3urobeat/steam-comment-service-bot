/*
 * File: relationship.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2024-02-28 22:24:32
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const Bot = require("../bot.js");


/**
 * Accepts a friend request, adds the user to the lastcomment.db database and invites him to your group
 */
Bot.prototype._attachSteamFriendRelationshipEvent = function() {

    this.user.on("friendRelationship", (steamID, relationship) => {

        if (relationship == 2) {
            let steamID64 = new SteamID(String(steamID)).getSteamID64();

            if (!this.data.advancedconfig.acceptFriendRequests) return logger("info", `[${this.logPrefix}] Received friend request from ${steamID64} but acceptFriendRequests is turned off in advancedconfig.json`);

            // Accept friend request
            this.user.addFriend(steamID);


            // Log message and send welcome message if this is the main bot. Delay message by 2.5 seconds to prevent possible AccessDenied errors
            logger("info", `[${this.logPrefix}] Added User: ` + steamID64);

            if (this.index == 0) {
                setTimeout(async () => {
                    this.sendChatMessage(this, { userID: steamID64 }, await this.controller.data.getLang("useradded", { "cmdprefix": "!", "langcount": Object.keys(this.data.lang).length }, steamID64));
                }, 2500);
            }


            // Add user to lastcomment database
            let time = Date.now() - (this.controller.data.config.requestCooldown * 60000); // Subtract requestCooldown so that the user is able to use the command instantly;

            this.controller.data.lastCommentDB.update({ id: steamID64 }, { $set: { time: time } }, { upsert: true }, (err) => {
                if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err);
            });


            // Invite user to yourgroup (and to my to make some stonks)
            if (this.index == 0 && this.controller.data.cachefile.configgroup64id && Object.keys(this.user.myGroups).includes(this.controller.data.cachefile.configgroup64id)) {
                this.user.inviteToGroup(steamID, new SteamID(this.controller.data.cachefile.configgroup64id)); // Invite the user to your group

                if (this.controller.data.cachefile.configgroup64id != "103582791464712227") { // https://steamcommunity.com/groups/3urobeatGroup
                    this.user.inviteToGroup(steamID, new SteamID("103582791464712227"));
                }
            }


            // Check remaining friendlist space
            this.controller.friendListCapacityCheck(this, (remaining) => {
                if (remaining < 25) {
                    logger("warn", `[${this.logPrefix}] Friendlist space is running low! There are ${remaining} spots remaining.`);
                }
            });
        }

    });

};



/**
 * Accepts a group invite if acceptgroupinvites in the config is true
 */
Bot.prototype._attachSteamGroupRelationshipEvent = function() {

    this.user.on("groupRelationship", (steamID, relationship) => {

        if (relationship == 2) { // Ignore if relationship type is not "Invited"
            let steamID64 = new SteamID(String(steamID)).getSteamID64();

            // Check if acceptgroupinvites is set to false and only allow botsgroup invite to be accepted
            if (!this.controller.data.config.acceptgroupinvites) {
                if (this.controller.data.config.yourgroup.length < 1 && this.controller.data.config.botsgroup.length < 1) return;
                if (steamID64 != this.controller.data.cachefile.configgroup64id && steamID64 != this.controller.data.cachefile.botsgroupid) return;
                logger("info", "acceptgroupinvites is turned off but this is an invite to the group set as yourgroup or botsgroup. Accepting invite anyway...");
            }

            this.user.respondToGroupInvite(steamID, true);

            logger("info", `[${this.logPrefix}] Accepted group invite: ` + steamID64);
        }

    });

};
