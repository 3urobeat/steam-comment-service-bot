/*
 * File: plugin.js
 * Project: steam-comment-service-bot
 * Created Date: 25.02.2022 09:37:57
 * Author: 3urobeat
 *
 * Last Modified: 25.05.2023 13:06:31
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
 * Constructor - Creates a new object for this plugin
 * @param {PluginSystem} sys Your connector to the application
 */
const Plugin = function(sys) {
    this.info = Plugin.info;

    // Store references to commonly used properties
    this.sys            = sys;
    this.controller     = sys.controller;
    this.data           = sys.controller.data;
    this.commandHandler = sys.commandHandler;
};

// Include some information about your plugin here. This is exported directly so the plugin loader can read it before creating a new object.
Plugin.info = {
    name: "template",
    version: "1.0",
    author: "3urobeat"
};

// Export everything in this file to make it accessible to the plugin loader
module.exports = Plugin;


/**
 * This function will be called by the plugin loader after updating but before logging in. Initialize your plugin here.
 */
Plugin.prototype.load = function() {

    logger("info", "Hello World!"); // Log something for example. This will be logged instantly but only appear after ready because of the readyafterlogs system.

    // Example of adding a command that will respond with "Hello World!" on "hello" or "cool-alias"
    this.commandHandler.registerCommand({
        names: ["hello", "cool-alias"],
        description: "Responds with Hello World!",
        ownersOnly: false,

        run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
            respondModule(context, resInfo, "Hello world!");
        }
    });

};


/**
 * This function will be called when the bot is ready (aka all accounts were logged in).
 */
Plugin.prototype.ready = function() {

    logger("info", "I am the plugin and we seem to be ready!");

    // Example of pretending the first owner used the '!ping' command
    let firstOwnerSteamID = this.data.cachefile.ownerid[0]; // Get first ownerid from cache to make sure it was converted to a steamID64

    this.commandHandler.runCommand("ping", [], firstOwnerSteamID, this.controller.main.sendChatMessage, this.controller.main, { steamID64: firstOwnerSteamID });
    // Note: This does seem to throw a RateLimitExceeded error which even a large delay doesn't fix. The retry works however. Idk, I think Steam might be at fault. // TODO: or is this a context related problem?

};




// JSDoc for global logger function to make using it easier for you
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