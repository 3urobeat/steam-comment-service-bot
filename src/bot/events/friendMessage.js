/*
 * File: friendMessage.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 26.06.2023 23:30:29
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
 * Handles messages, cooldowns and executes commands.
 */
Bot.prototype._attachSteamFriendMessageEvent = function() {

    this.user.chat.on("friendMessage", (msg) => {
        let message = msg.message_no_bbcode;
        let steamID = msg.steamid_friend;

        let steamID64 = new SteamID(String(steamID)).getSteamID64();
        let resInfo   = { steamID64: steamID64, cmdprefix: "!" }; // Object required for sendChatMessage(), our commandHandler respondModule implementation

        // Check if another friendMessage handler is currently active
        if (this.friendMessageBlock.includes(steamID64)) return logger("debug", `[${this.logPrefix}] Ignoring friendMessage event from ${steamID64} as user is on friendMessageBlock list.`);

        // Check if this event should be handled or if user is blocked
        let isBlocked = this.checkMsgBlock(steamID64, message);
        if (isBlocked) return; // Stop right here if user is blocked, on cooldown or not a friend


        // Log friend message but cut it if it is >= 75 chars
        if (message.length >= 75) logger("info", `[${this.logPrefix}] Friend message from ${steamID64}: ${message.slice(0, 75) + "..."}`);
            else logger("info", `[${this.logPrefix}] Friend message from ${steamID64}: ${message}`);


        // Sort out any chat messages not sent to the main bot
        if (this.index !== 0) {
            switch(message.toLowerCase()) {
                case `${resInfo.cmdprefix}about`: // Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
                    this.sendChatMessage(this, resInfo, this.controller.data.datafile.aboutstr);
                    break;
                default:
                    if (message.startsWith(resInfo.cmdprefix)) this.sendChatMessage(this, resInfo, `${this.controller.data.lang.childbotmessage.replace(/cmdprefix/g, resInfo.cmdprefix)}\nhttps://steamcommunity.com/profiles/${new SteamID(String(this.controller.main.user.steamID)).getSteamID64()}`);
                        else logger("debug", `[${this.logPrefix}] Chat message is not a command, ignoring message.`);
            }

            return;
        }


        /* -------------- Handle message event for the main bot -------------- */

        // Check if user is in lastcomment database
        this.controller.data.lastCommentDB.findOne({ id: steamID64 }, (err, doc) => {
            if (err) logger("error", "Database error on friendMessage. This is weird. Error: " + err);

            if (!doc) { // Add user to database if he/she is missing for some reason
                let lastcommentobj = {
                    id: new SteamID(String(steamID)).getSteamID64(),
                    time: Date.now() - (this.data.config.commentcooldown * 60000) // Subtract commentcooldown so that the user is able to use the command instantly
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


        // Ask command handler to figure out things for us when a message with prefix was sent
        let cont = message.slice(1).split(" "); // Remove prefix and split
        let args = cont.slice(1);               // Remove cmd name to only get arguments

        let success = this.controller.commandHandler.runCommand(cont[0].toLowerCase(), args, steamID64, this.sendChatMessage, this, resInfo);

        if (!success) this.sendChatMessage(this, resInfo, this.controller.data.lang.commandnotfound.replace(/cmdprefix/g, resInfo.cmdprefix)); // Send cmd not found msg if runCommand() returned false
    });

};