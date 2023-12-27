/*
 * File: checkMsgBlock.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-03-20 12:46:47
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:00:20
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot.js");

const lastmessage = {}; // Tracks the last cmd usage of a normal command to apply cooldown if the user spams


/**
 * Checks if user is blocked, has an active cooldown for spamming or isn't a friend
 * @param {object} steamID64 The steamID64 of the message sender
 * @param {string} message The message string provided by steam-user friendMessage event
 * @returns {boolean} `true` if friendMessage event shouldn't be handled, `false` if user is allowed to be handled
 */
Bot.prototype.checkMsgBlock = async function(steamID64, message) {

    // Check if user is blocked and ignore message
    if (this.user.myFriends[steamID64] == 1 || this.user.myFriends[steamID64] == 6) {
        logger("debug", `[${this.logPrefix}] Blocked user '${steamID64}' sent message: ${message}`); // Ignore messages from blocked users but log a debug message
        return true;
    }


    // Spam "protection" because spamming the bot is bad!
    if (!lastmessage[steamID64] || lastmessage[steamID64][0] + this.controller.data.advancedconfig.commandCooldown < Date.now()) lastmessage[steamID64] = [Date.now(), 0]; // Add user to array or Reset time
    if (lastmessage[steamID64] && lastmessage[steamID64][0] + this.controller.data.advancedconfig.commandCooldown > Date.now() && lastmessage[steamID64][1] > 5) return true; // Just don't respond

    if (lastmessage[steamID64] && lastmessage[steamID64][0] + this.controller.data.advancedconfig.commandCooldown > Date.now() && lastmessage[steamID64][1] > 4) { // Inform the user about the cooldown
        this.sendChatMessage({ userID: steamID64, prefix: "/me" }, await this.controller.data.getLang("userspamblock", null, steamID64));
        logger("info", `${steamID64} has been blocked for 90 seconds for spamming.`);

        lastmessage[steamID64][0] += 90000;
        lastmessage[steamID64][1]++;

        return true;
    }

    if (!this.controller.data.cachefile.ownerid.includes(steamID64)) lastmessage[steamID64][1]++; // Push new message to array if user isn't an owner (this function is only called for Steam Chat messages, not for plugins)


    // Deny non-friends the use of any command
    if (this.user.myFriends[steamID64] != 3) {
        this.sendChatMessage({ userID: steamID64, prefix: "/me" }, await this.controller.data.getLang("usernotfriend", null, steamID64));
        return true;
    }


    // Return false and let the event be handled if nothing from above already halted the execution
    return false;

};
