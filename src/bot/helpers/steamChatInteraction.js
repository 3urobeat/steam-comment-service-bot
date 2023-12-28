/*
 * File: steamChatInteraction.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-04-01 21:09:00
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 13:59:39
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// Steam Chat interaction helper which is implemented by the main bot account. It gets called by commands to respond to the user


const SteamUser = require("steam-user");
const SteamID   = require("steamid");

const Bot = require("../bot");

const { cutStringsIntelligently } = require("../../controller/helpers/misc.js");


/**
 * Our commandHandler respondModule implementation - Sends a message to a Steam user
 * @param {Bot} _this The Bot object context
 * @param {import("../../commands/commandHandler").resInfo} resInfo Object containing information passed to command by friendMessage event. Supported by this handler: prefix, charLimit, cutChars
 * @param {string} txt The text to send
 * @param {number} retry Internal: Counter of retries for this part if sending failed
 * @param {number} part Internal: Index of which part to send for messages larger than charLimit chars
 */
Bot.prototype.sendChatMessage = function(_this, resInfo, txt, retry = 0, part = 0) {
    if (!resInfo) return logger("warn", "sendChatMessage() was called without a resInfo object! Ignoring call...");
    if (!txt) return logger("warn", "sendChatMessage() was called without any message content! Ignoring call...");
    if (typeof txt !== "string") return logger("warn", "sendChatMessage() was called with txt that isn't a string! Ignoring call...");

    let steamID64 = resInfo.userID;
    let username  = _this.user.users[steamID64].player_name;

    let relationshipStatus = SteamUser.EFriendRelationship.None;
    if (_this.user.myFriends[steamID64]) relationshipStatus = SteamUser.EFriendRelationship[_this.user.myFriends[steamID64]];

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
        logger("debug", `[${_this.logPrefix}] Sending message (${thisPart.length} chars) to '${username}' (${steamID64}: ${relationshipStatus}) (retry: ${retry}, part: ${part}): "${thisPart.replace(/\n/g, "\\n")}"`);
    } else {
        if (thisPart.length >= 75) logger("info", `[${_this.logPrefix}] Sending message to '${username}' (${steamID64}: ${relationshipStatus}): "${thisPart.slice(0, 75).replace(/\n/g, "\\n") + "..."}"`);
            else logger("info", `[${_this.logPrefix}] Sending message to '${username}' (${steamID64}: ${relationshipStatus}): "${thisPart.replace(/\n/g, "\\n")}"`);
    }

    // Send part and call function again if this wasn't the last one
    _this.user.chat.sendFriendMessage(steamID64, thisPart, {}, (err) => {
        if (err) { // Check for error as some chat messages seem to not get send lately
            logger("warn", `[${_this.logPrefix}] Error trying to send chat message of length ${thisPart.length} to ${steamID64}! ${err}`);

            // Don't bother if account is offline
            if (_this.status == Bot.EStatus.OFFLINE) {
                logger("info", `[${_this.logPrefix}] Ignoring msg retries to '${steamID64}' as they will always fail because this bot is offline!`);
                return;
            }

            // Check for AccessDenied error and abort retries if this was caused by the recipient not being a friend
            if (String(err).toLowerCase() == "error: accessdenied" && (!_this.user.myFriends[steamID64] || _this.user.myFriends[steamID64] != SteamUser.EFriendRelationship.Friend)) {
                logger("info", `[${_this.logPrefix}] AccessDenied error caused by non-friend detected. Ignoring msg retries to '${steamID64}' as they will always fail unless they add this bot account: https://steamcommunity.com/profiles/${_this.controller.data.cachefile.botaccid[_this.index]}`);
                return;
            }

            // Start typing to indicate the bot is not down
            _this.user.chat.sendFriendTyping(steamID64);

            // Hard cap amount of attempts to send this message to 5
            if (retry >= 5) return;
            if (retry == 4) return setTimeout(() => _this.sendChatMessage(_this, resInfo, "Sorry, Steam seems to block my messages. Please try again in a few minutes.", retry + 1), 10000);

            // Retry message in 10 seconds
            setTimeout(() => _this.sendChatMessage(_this, resInfo, txt, retry + 1, part), 10000 * (retry + 1)); // Send the same part again and increase delay for subsequent fails

        } else {

            // Send next part if there is one left
            if (limit * (part + 1) <= txt.length) {
                logger("info", `Message is ${txt.length} chars long, sending next chunk of ${limit} chars to '${steamID64}' in 7.5 seconds...`, false, false, logger.animation("waiting"));

                // Start typing to indicate there is more coming
                _this.user.chat.sendFriendTyping(steamID64);

                setTimeout(() => _this.sendChatMessage(_this, resInfo, txt, retry, part + 1), 7500);
            } else {
                if (part != 0) logger("debug", "Bot sendChatMessage(): All parts of the message have been sent"); // Only log debug for multi-part messages
            }
        }
    });
};


/**
 * Waits for a Steam Chat message from this user to this account and resolves their message content. The "normal" friendMessage event handler will be blocked for this user.
 * @param {string} steamID64 The steamID64 of the user to read a message from
 * @param {number} timeout Time in ms after which the Promise will be resolved if user does not respond. Pass 0 to disable (not recommended)
 * @returns {Promise.<string|null>} Resolved with `String` on response or `null` on timeout.
 */
Bot.prototype.readChatMessage = function(steamID64, timeout) {
    return new Promise((resolve) => {
        let noResponseTimeout;

        logger("debug", `Bot readChatMessage(): Attaching event listener for ${steamID64} with timeout of ${timeout}ms`);

        // Check for duplicate request and block "normal" friendMessage event handler
        if (this.friendMessageBlock.includes(steamID64)) {
            logger("warn", "Duplicate readChatMessage() request! Ignoring call as another instance is already waiting for a response...");
            return resolve(null);
        }

        this.friendMessageBlock.push(steamID64);

        // Provide function to handle event
        let handleEvent = (steamID, message) => { // ES6 function to keep previous context
            let msgSteamID64 = new SteamID(String(steamID)).getSteamID64();

            if (msgSteamID64 != steamID64) return; // Ignore if not from our user

            logger("debug", `Bot readChatMessage(): Response from user ${steamID64}: ${message}`);
            resolve(message); // Resolve with message content

            // Clean up!
            this.friendMessageBlock = this.friendMessageBlock.filter(e => e !== steamID64);
            this.user.removeListener("friendMessage", handleEvent);
            if (timeout > 0) clearTimeout(noResponseTimeout);
        };

        // Attach a friendMessage event handler for this steamID64
        this.user.addListener("friendMessage", handleEvent);

        // Attach a timeout handler
        if (timeout > 0) {
            noResponseTimeout = setTimeout(() => {
                logger("debug", `Bot readChatMessage(): No response from ${steamID64} in ${timeout}ms. Timing out...`);

                // Resolve with null
                resolve(null);

                // Clean up!
                this.friendMessageBlock = this.friendMessageBlock.filter(e => e !== steamID64);
                this.user.removeListener("friendMessage", handleEvent);
                if (timeout > 0) clearTimeout(noResponseTimeout);

            }, timeout);
        }
    });
};
