/*
 * File: steamChatInteraction.js
 * Project: steam-comment-service-bot
 * Created Date: 01.04.2023 21:09:00
 * Author: 3urobeat
 *
 * Last Modified: 15.04.2023 13:25:00
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
 * Our commandHandler respondModule implementation - Sends a message to a Steam user
 * @param {Object} _this The Bot object context
 * @param {Object} resInf Object containing information passed to command by friendMessage event
 * @param {String} txt The text to send
 * @param {Boolean} retry Internal: true if this message called itself again to send failure message
 * @param {Number} part Internal: Index of which part to send for messages larger than 750 chars
 */
Bot.prototype.sendChatMessage = function(_this, resInf, txt, retry, part = 0) {
    if (!txt) return logger("warn", "sendChatMessage() was called without any message content! Ignoring call...");

    // Get the correct part to send // TODO: This should handle line breaks better to avoid cutting links in half (for accsToAdd for example)
    let thisPart = txt.slice(750 * part, 750 * (part + 1));

    // Log full message if in debug mode, otherwise log cut down version
    if (_this.controller.data.advancedconfig.printDebug) {
        logger("debug", `[${_this.logPrefix}] Sending message (${txt.length} chars) to ${resInf.steamID} (retry: ${retry == true}, part: ${part}): "${thisPart.replace(/\n/g, "\\n")}"`); // Intentionally checking for == true to prevent showing undefined
    } else {
        if (txt.length >= 75) logger("info", `[${_this.logPrefix}] Sending message to ${resInf.steamID}: "${thisPart.slice(0, 75).replace(/\n/g, "\\n") + "..."}"`);
            else logger("info", `[${_this.logPrefix}] Sending message to ${resInf.steamID}: "${thisPart.replace(/\n/g, "\\n")}"`);
    }

    // Send part and call function again if this wasn't the last one
    _this.user.chat.sendFriendMessage(resInf.steamID, txt, {}, (err) => {
        if (err) { // Check for error as some chat messages seem to not get send lately
            logger("warn", `[${_this.logPrefix}] Error trying to send chat message of length ${txt.length} to ${resInf.steamID}! ${err}`);

            // Send the user a fallback message after 5 seconds just to indicate the bot is not down
            //if (!retry) setTimeout(() => _this.sendChatMessage(resInf.steamID, "Sorry, it looks like Steam blocked my last message. Please try again in 30 seconds.", true), 5000);

            // Retry message in 10 seconds // TODO: Can I start typing to indicate the bot is not down?
            setTimeout(() => {
                this.sendChatMessage(_this, resInf, txt, retry, part); // Send the same part again
            }, 10000);

        } else {

            // Send next part if there is one left
            if (750 * (part + 1) <= txt.length) {
                logger("info", `Message longer than 750 chars, sending next part to '${resInf.steamID}' in 7.5 seconds...`, false, false, logger.animation("waiting"));
                setTimeout(() => this.sendChatMessage(_this, resInf, txt, retry, part + 1), 7500);
            } else {
                logger("debug", "Bot sendChatMessage(): All parts of the message have been sent");
            }
        }
    });
};