/*
 * File: checkMsgBlock.js
 * Project: steam-comment-service-bot
 * Created Date: 20.03.2023 12:46:47
 * Author: 3urobeat
 *
 * Last Modified: 20.03.2023 13:15:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const lastmessage = {}; // Tracks the last cmd usage of a normal command to apply cooldown if the user spams


/**
 * Checks if user is blocked, has an active cooldown for spamming or isn't a friend
 * @param {String} thisbot The thisbot string of the calling account
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {Object} steamID The steamID object from steam-user
 * @param {String} message The message string provided by steam-user friendMessage event
 * @param {Object} lang The language object
 * @param {Function} chatmsg The chatmsg function
 * @returns {Boolean} `true` if friendMessage event shouldn't be handled, `false` if user is allowed to be handled
 */
module.exports.checkMsgBlock = (thisbot, bot, steamID, message, lang, chatmsg) => {
    let steam64id = new SteamID(String(steamID)).getSteamID64();


    // Check if user is blocked and ignore message
    if (bot.myFriends[steam64id] == 1 || bot.myFriends[steam64id] == 6) {
        logger("debug", `[${thisbot}] Blocked user '${steam64id}' sent message: ${message}`); // Ignore messages from blocked users but log a debug message
        return true;
    }


    // Spam "protection" because spamming the bot is bad!
    if (!lastmessage[steam64id] || lastmessage[steam64id][0] + advancedconfig.commandCooldown < Date.now()) lastmessage[steam64id] = [Date.now(), 0]; // Add user to array or Reset time
    if (lastmessage[steam64id] && lastmessage[steam64id][0] + advancedconfig.commandCooldown > Date.now() && lastmessage[steam64id][1] > 5) return true; // Just don't respond

    if (lastmessage[steam64id] && lastmessage[steam64id][0] + advancedconfig.commandCooldown > Date.now() && lastmessage[steam64id][1] > 4) { // Inform the user about the cooldown
        chatmsg(steamID, lang.userspamblock);
        logger("info", `${steam64id} has been blocked for 90 seconds for spamming.`);

        lastmessage[steam64id][0] += 90000;
        lastmessage[steam64id][1]++;

        return true;
    }

    if (!cachefile.ownerid.includes(steam64id)) lastmessage[steam64id][1]++; // Push new message to array if user isn't an owner


    // Deny non-friends the use of any command
    if (bot.myFriends[steam64id] != 3) {
        chatmsg(steamID, lang.usernotfriend);
        return true;
    }


    // Return false and let the event be handled if nothing from above already halted the execution
    return false;

};