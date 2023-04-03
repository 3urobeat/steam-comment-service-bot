/*
 * File: commandHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 01.04.2023 21:54:21
 * Author: 3urobeat
 *
 * Last Modified: 03.04.2023 19:49:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const Controller = require("../controller/controller.js"); // eslint-disable-line


/**
 * Constructor - Initializes the commandHandler which allows you to integrate bot commands into your plugin
 * @param {Object} context The context (this.) of the object implementing this commandHandler. Will be passed to respondModule() as first parameter.
 * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
 * @param {Controller} controller Reference to the current controller object
 */
const CommandHandler = function(context, respondModule, controller) {

    this.context    = context;
    this.respond    = respondModule;
    this.controller = controller;

    this.commands = []; // Array of objects, where each object represents a command

};


/**
 * Internal: Imports core commands on startup
 */
CommandHandler.prototype._importCoreCommands = function() {

    logger("info", "CommandHandler: Loading all core commands...", false, true, logger.animation("loading"));

    fs.readdir("./src/commands/core", (err, files) => {

        // Stop now on error or if nothing was found
        if (err)               return logger("error", "Error while reading core dir: " + err, true);
        if (files.length == 0) return logger("info", "No commands in ./core found!", false, true, logger.animation("loading"));

        // Iterate over all files in this dir
        files.forEach((e) => {
            let thisFile;

            // Try to load plugin
            try {
                // Load the plugin file
                thisFile = require(`./core/${e}`);

                // Push all exported commands in this file into the command list
                Object.values(thisFile).every(val => this.commands.push(val));

            } catch (err) {

                return logger("error", `Error loading core command '${e}'! ${err.stack}`, true);
            }
        });
    });

};
};


module.exports = CommandHandler;