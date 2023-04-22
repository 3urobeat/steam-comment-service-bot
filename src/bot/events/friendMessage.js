/*
 * File: friendMessage.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 22.04.2023 18:21:25
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
    let _this = this;

    this.user.on("friendMessage", (steamID, message) => {

        let resInfo    = { steamID64: steamID.getSteamID64() };                         // Object required for sendChatMessage(), our commandHandler respondModule implementation
        let steamID64  = new SteamID(String(steamID)).getSteamID64();
        let ownercheck = this.data.cachefile.ownerid.includes(steamID64);


        // Check if this event should be handled or if user is blocked
        let isBlocked = this.checkMsgBlock(steamID64, message);
        if (isBlocked) return; // Stop right here if user is blocked, on cooldown or not a friend


        // Log friend message but cut it if it is >= 75 chars
        if (message.length >= 75) logger("info", `[${this.logPrefix}] Friend message from ${steamID64}: ${message.slice(0, 75) + "..."}`);
            else logger("info", `[${this.logPrefix}] Friend message from ${steamID64}: ${message}`);


        // Sort out any chat messages not sent to the main bot
        if (this.index !== 0) {
            switch(message.toLowerCase()) {
                case "!about": // Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
                    this.sendChatMessage(resInfo, this.controller.data.datafile.aboutstr);
                    break;
                default:
                    if (message.startsWith("!")) this.sendChatMessage(steamID64, `${this.controller.data.lang.childbotmessage}\nhttps://steamcommunity.com/profiles/${new SteamID(String(this.controller.main.user.steamID)).getSteamID64()}`);
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
        if (!message.startsWith("!")) {
            if (message.toLowerCase() == ":)") return this.sendChatMessage(steamID, ":))"); // Hehe

            logger("debug", "Chat message is not a command, ignoring message.");
            return;
        }


        // Ask command handler to figure out things for us when a message with prefix was sent
        let cont = message.slice(1).split(" "); // Remove prefix and split
        let args = cont.slice(1);               // Remove cmd name to only get arguments

        let success = this.controller.commandHandler.runCommand(cont[0].toLowerCase(), args, steamID64, this.sendChatMessage, this, resInfo);

        if (!success) this.sendChatMessage(steamID, this.controller.data.lang.commandnotfound); // Send cmd not found msg if runCommand() returned false

    });

};