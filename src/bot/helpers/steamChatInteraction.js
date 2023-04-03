/*
 * File: steamChatInteraction.js
 * Project: steam-comment-service-bot
 * Created Date: 01.04.2023 21:09:00
 * Author: 3urobeat
 *
 * Last Modified: 03.04.2023 13:22:56
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// Steam Chat interaction helper which is implemented by the main bot account. It gets called by commands to respond to the user


const SteamID = require("steamid"); // eslint-disable-line

const Bot = require("../bot");


/**
 * Send a message to a Steam user
 * @param {Object} _this The Bot object context
 * @param {Object} resInf Object containing information passed to command by friendMessage event
 * @param {String} txt The text to send
 * @param {Boolean} retry Internal: true if this message called itself again to send failure message
 */
Bot.prototype.sendChatMessage = function(_this, resInf, txt, retry) {

    _this.user.chat.sendFriendMessage(resInf.steamID, txt);

    /* if (!txt) return logger("warn", "chatmsg() was called without txt parameter? Ignoring call...");

    // Cut message if over 1k chars to try and reduce the risk of a RateLimitExceeded error
    if (txt.length > 1000) {
        logger("warn", `[${this.logPrefix}] The bot tried to send a chat message that's longer than 1000 chars. Cutting it to 996 chars to reduce the risk of a RateLimitExceeded error!`);

        txt = txt.slice(0, 996);
        txt += "...";
    }

    // Log full message if in debug mode, otherwise log cut down version
    let recipientSteamID64 = new SteamID(String(steamID)).getSteamID64();

    if (_this.controller.data.advancedconfig.printDebug) {
        logger("debug", `[${_this.logPrefix}] Sending message (${txt.length} chars) to ${recipientSteamID64} (retry: ${retry == true}): "${txt.replace(/\n/g, "\\n")}"`); // Intentionally checking for == true to prevent showing undefined
    } else {
        if (txt.length >= 75) logger("info", `[${_this.logPrefix}] Sending message to ${recipientSteamID64}: "${txt.slice(0, 75).replace(/\n/g, "\\n") + "..."}"`);
            else logger("info", `[${_this.logPrefix}] Sending message to ${recipientSteamID64}: "${txt.replace(/\n/g, "\\n")}"`);
    }

    _this.user.chat.sendFriendMessage(steamID, txt, {}, (err) => {
        if (err) { // Check for error as some chat messages seem to not get send lately
            logger("warn", `[${_this.logPrefix}] Error trying to send chat message of length ${txt.length} to ${recipientSteamID64}! ${err}`);

            // Send the user a fallback message after 5 seconds just to indicate the bot is not down
            if (!retry) setTimeout(() => chatmsg(steamID, "Sorry, it looks like Steam blocked my last message. Please try again in 30 seconds.", true), 5000);
        }
    }); */
};