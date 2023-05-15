/*
 * File: steamChatInteraction.js
 * Project: steam-comment-service-bot
 * Created Date: 01.04.2023 21:09:00
 * Author: 3urobeat
 *
 * Last Modified: 14.05.2023 21:44:38
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// Steam Chat interaction helper which is implemented by the main bot account. It gets called by commands to respond to the user


const Bot = require("../bot");

const { cutStringsIntelligently } = require("../../controller/helpers/misc.js");


/**
 * Our commandHandler respondModule implementation - Sends a message to a Steam user
 * @param {Object} _this The Bot object context
 * @param {Object} resInfo Object containing information passed to command by friendMessage event. Supported by this handler: prefix, charLimit, cutChars
 * @param {String} txt The text to send
 * @param {Number} retry Internal: Counter of retries for this part if sending failed
 * @param {Number} part Internal: Index of which part to send for messages larger than charLimit chars
 */
Bot.prototype.sendChatMessage = function(_this, resInfo, txt, retry = 0, part = 0) {
    if (!resInfo) return logger("warn", "sendChatMessage() was called without a resInfo object! Ignoring call...");
    if (!txt) return logger("warn", "sendChatMessage() was called without any message content! Ignoring call...");
    if (typeof txt !== "string") return logger("warn", "sendChatMessage() was called with txt that isn't a string! Ignoring call...");

    // Allow resInfo to overwrite char limit of 750 chars
    let limit = 750;
    if (resInfo.charLimit) limit = resInfo.charLimit;

    // Allow resInfo to overwrite cutStringsIntelligently's cutChars
    let cutChars = resInfo.cutChars || null;

    // Check if message should be sent without a prefix and set it to an empty string
    if (!resInfo.prefix) resInfo.prefix = "";
        else resInfo.prefix += " "; // Add whitespace between prefix and message content

    // Get the correct part to send without breaking links and add prefix infront
    let thisPart = resInfo.prefix + cutStringsIntelligently(txt, limit, cutChars)[part];

    // Log full message if in debug mode, otherwise log cut down version
    if (_this.controller.data.advancedconfig.printDebug) {
        logger("debug", `[${_this.logPrefix}] Sending message (${thisPart.length} chars) to ${resInfo.steamID64} (retry: ${retry}, part: ${part}): "${thisPart.replace(/\n/g, "\\n")}"`);
    } else {
        if (thisPart.length >= 75) logger("info", `[${_this.logPrefix}] Sending message to ${resInfo.steamID64}: "${thisPart.slice(0, 75).replace(/\n/g, "\\n") + "..."}"`);
            else logger("info", `[${_this.logPrefix}] Sending message to ${resInfo.steamID64}: "${thisPart.replace(/\n/g, "\\n")}"`);
    }

    // Send part and call function again if this wasn't the last one
    _this.user.chat.sendFriendMessage(resInfo.steamID64, thisPart, {}, (err) => {
        if (err) { // Check for error as some chat messages seem to not get send lately
            logger("warn", `[${_this.logPrefix}] Error trying to send chat message of length ${thisPart.length} to ${resInfo.steamID64}! ${err}`);

            // Start typing to indicate the bot is not down
            _this.user.chat.sendFriendTyping(resInfo.steamID64);

            // Hard cap amount of attempts to send this message to 5
            if (retry >= 5) return;
            if (retry == 4) return setTimeout(() => _this.sendChatMessage(_this, resInfo, "Sorry, Steam seems to block my messages. Please try again in a few minutes.", retry + 1), 10000);

            // Retry message in 10 seconds
            setTimeout(() => _this.sendChatMessage(_this, resInfo, txt, retry + 1, part), 10000 * (retry + 1)); // Send the same part again and increase delay for subsequent fails

        } else {

            // Send next part if there is one left
            if (limit * (part + 1) <= txt.length) {
                logger("info", `Message is ${txt.length} chars long, sending next chunk of ${limit} chars to '${resInfo.steamID64}' in 7.5 seconds...`, false, false, logger.animation("waiting"));
                setTimeout(() => _this.sendChatMessage(_this, resInfo, txt, retry, part + 1), 7500);
            } else {
                if (part != 0) logger("debug", "Bot sendChatMessage(): All parts of the message have been sent"); // Only log debug for multi-part messages
            }
        }
    });
};