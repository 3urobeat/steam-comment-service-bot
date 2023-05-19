/*
 * File: plugin.js
 * Project: steam-comment-service-bot
 * Created Date: 25.02.2022 09:37:57
 * Author: 3urobeat
 *
 * Last Modified: 19.05.2023 12:28:25
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// Note: This plugin, with the name "template" will not be loaded on start.
// To create your own command, copy this folder, rename it and edit the info object below! Have fun!

const PluginSystem = require("../../src/pluginSystem/pluginSystem.js"); // eslint-disable-line


/**
 * This function will be called by the plugin loader after updating but before logging in. Initialize your plugin here.
 * @param {PluginSystem} sys Your connector to the application
 */
module.exports.load = (sys) => { //eslint-disable-line

    logger("info", "Hello World!"); // Log something for example


    // Example of pretending the first owner used the '!ping' command
    let firstOwnerSteamID = sys.data.cachefile.ownerid[0]; // Get first ownerid from cache to make sure it was converted to a steamID64

    //sys.commandHandler.runCommand("ping", [], firstOwnerSteamID, sys.main.sendChatMessage, sys.main, { steamID64: firstOwnerSteamID }); // TODO: sendChatMessage is undefined for some reason


    // Example of adding a command that will respond with "Hello World!" on "hello" or "cool-alias"
    sys.commandHandler.registerCommand({
        names: ["hello", "cool-alias"],
        description: "Responds with Hello World!",
        ownersOnly: false,

        run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
            respondModule(context, resInfo, "Hello world!");
        }
    });
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
const logger = global.logger;