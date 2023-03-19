/*
 * File: plugin.js
 * Project: steam-comment-service-bot
 * Created Date: 25.02.2022 09:37:57
 * Author: 3urobeat
 *
 * Last Modified: 19.03.2023 13:53:38
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamUser      = require("steam-user"); //eslint-disable-line
const SteamCommunity = require("steamcommunity"); //eslint-disable-line
const SteamID        = require("steamid"); //eslint-disable-line


/**
 * This function will be called by the plugin loader when the bot finished logging in. Initialize your plugin here.
 * @param {SteamUser} mainBot The main bot account (botobject[0]), the account you interact with, the account listening for events etc.
 * @param {Object.<number, SteamUser>} botobject Object of all bot accounts SteamUser instances (used for general steam interactions)
 * @param {Object.<number, SteamCommunity>} communityobject Object of all bot accounts SteamCommunity instances (used for community interactions like commenting etc.)
 */
module.exports.run = (mainBot, botobject, communityobject) => { //eslint-disable-line

    logger("info", "Hello World!"); // Log something for example


    // Example of pretending the first owner used the '!ping' command
    var firstOwnerSteamID = new SteamID(cachefile.ownerid[0]); // Makes a steamID object of the first owner so we can pass it to the friendMessage event

    mainBot.emit("friendMessage", firstOwnerSteamID, "!ping"); // Pretend like the first owner send the bot the message "!ping" - Result: The bot will send you a response

};


/**
 * Include some information about your plugin here
 */
module.exports.info = {
    name: "template",
    version: "1.0",
    author: "3urobeat"
};



// JSDoc for a few things to make them easier to use for you
/**
 * Log something to the output
 * @param {String} type Type of your log message. Valid types: `info`, `warn`, `error` or `debug`
 * @param {String} message The message to log
 * @param {Boolean} nodate Set to true to hide date and time
 * @param {Boolean} remove Set to true if the next log message should overwrite this one
 * @param {Array} animation Call `logger.animation("animation-name")` in this parameter to get pre-defined animations. Valid animation-name's: loading, waiting, bounce, progress, arrows, bouncearrows
 * @returns {String} The full formatted message which will be logged
 */
var logger = global.logger;