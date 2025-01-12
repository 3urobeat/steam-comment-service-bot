/*
 * File: friendMessage.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 16:41:00
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamUser = require("steam-user");
const SteamID   = require("steamid");

const Bot = require("../bot.js");


/**
 * Handles messages, cooldowns and executes commands
 * @private
 */
Bot.prototype._attachSteamFriendMessageEvent = function() {

    this.user.chat.on("friendMessage", async (msg) => {
        const message = msg.message_no_bbcode;
        const steamID = msg.steamid_friend;

        const steamID64 = new SteamID(String(steamID)).getSteamID64();
        const username  = this.user.users[steamID64] ? this.user.users[steamID64].player_name : ""; // Set username to nothing in case they are not cached yet to avoid errors

        let relationshipStatus = SteamUser.EFriendRelationship.None;
        if (this.user.myFriends[steamID64]) relationshipStatus = SteamUser.EFriendRelationship[this.user.myFriends[steamID64]];

        const resInfo = { userID: steamID64, cmdprefix: "!", fromSteamChat: true }; // Object required for sendChatMessage(), our commandHandler respondModule implementation


        // Check if another friendMessage handler is currently active
        if (this.friendMessageBlock.includes(steamID64)) return logger("debug", `[${this.logPrefix}] Ignoring friendMessage event from ${steamID64} as user is on friendMessageBlock list.`);

        // Check if this event should be handled or if user is blocked
        const isBlocked = await this.checkMsgBlock(steamID64, message);
        if (isBlocked) return; // Stop right here if user is blocked, on cooldown or not a friend


        // Log friend message but cut it if it is >= 75 chars
        if (message.length >= 75) logger("info", `[${this.logPrefix}] Message from '${username}' (${steamID64}: ${relationshipStatus}): ${message.slice(0, 75) + "..."}`);
            else logger("info", `[${this.logPrefix}] Message from '${username}' (${steamID64}: ${relationshipStatus}): ${message}`);


        // Sort out any chat messages not sent to the main bot
        if (this.index !== 0) {
            switch(message.toLowerCase()) {
                case `${resInfo.cmdprefix}about`: // Please don't change this message as it gives credit to me; the person who put really much of their free time into this project. The bot will still refer to you - the operator of this instance.
                    this.sendChatMessage(this, resInfo, this.controller.data.datafile.aboutstr);
                    break;
                default:
                    if (message.startsWith(resInfo.cmdprefix)) {
                        this.sendChatMessage(this, resInfo, `${await this.controller.data.getLang("childbotmessage", { "cmdprefix": resInfo.cmdprefix }, steamID64)}\nhttps://steamcommunity.com/profiles/${new SteamID(String(this.controller.main.user.steamID)).getSteamID64()}`);
                    } else {
                        logger("debug", `[${this.logPrefix}] Chat message is not a command, ignoring message.`);
                    }
            }

            return;
        }


        /* -------------- Handle message event for the main bot -------------- */

        // Check if user is in lastcomment database
        this.controller.data.lastCommentDB.findOne({ id: steamID64 }, (err, doc) => {
            if (err) logger("error", "Database error on friendMessage. This is weird. Error: " + err);

            if (!doc) { // Add user to database if they are missing for some reason
                const lastcommentobj = {
                    id: new SteamID(String(steamID)).getSteamID64(),
                    time: Date.now() - (this.data.config.requestCooldown * 60000) // Subtract requestCooldown so that the user is able to use the command instantly
                };

                this.controller.data.lastCommentDB.insert(lastcommentobj, (err) => { if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err); });
            }
        });


        // Handle non-prefixed messages
        if (!message.startsWith(resInfo.cmdprefix)) {
            if (message.toLowerCase() == ":)") return this.sendChatMessage(this, resInfo, ":))"); // Hehe

            logger("debug", "Chat message is not a command, ignoring message.");
            return;
        }


        // Ask command handler to figure things out for us when a message with prefix was sent
        const cont = message.slice(1).split(" "); // Remove prefix and split
        const args = cont.slice(1);               // Remove cmd name to only get arguments

        const runCommandResult = await this.controller.commandHandler.runCommand(cont[0].toLowerCase(), args, this.sendChatMessage, this, resInfo); // Don't listen to your linter, this *await is necessary*

        if (!runCommandResult.success) {
            this.sendChatMessage(this, resInfo, runCommandResult.message); // Send cmd not found msg if runCommand() returned false
        }
    });

};
