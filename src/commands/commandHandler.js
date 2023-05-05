/*
 * File: commandHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 01.04.2023 21:54:21
 * Author: 3urobeat
 *
 * Last Modified: 03.05.2023 20:28:45
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
 * Constructor - Initializes the commandHandler which allows you to integrate core commands into your plugin or add new commands from your plugin.
 * @param {Controller} controller Reference to the current controller object
 */
const CommandHandler = function(controller) {

    this.controller = controller;
    this.data       = controller.data;

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
        files.forEach((e, i) => {
            let thisFile;

            // Try to load plugin
            try {
                // Load the plugin file
                thisFile = require(`./core/${e}`);

                // Push all exported commands in this file into the command list
                Object.values(thisFile).every(val => this.commands.push(val));

            } catch (err) {

                logger("error", `Error loading core command '${e}'! ${err.stack}`, true);
            }

            if (i + 1 == files.length) logger("info", `Successfully loaded ${this.commands.length} core commands!`, false, true, logger.animation("loading"));
        });
    });

};
/**
 * Finds a loaded command by name and runs it
 * @param {String} name The name of the command
 * @param {Array} args Array of arguments that will be passed to the command
 * @param {Number} steamID64 SteamID64 of the requesting user which is used to check for ownerOnly and will be passed to the command
 * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
 * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
 * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @returns `true` if command was found, `false` if not
 */
CommandHandler.prototype.runCommand = function(name, args, steamID64, respondModule, context, resInfo) {

    // Iterate through all command objects in commands array and check if name is included in names array of each command.
    let thisCmd = this.commands.find(e => e.names.includes(name));

    if (!thisCmd) {
        logger("warn", `CommandHandler runCommand(): Command '${name}' was not found!`);
        return false;
    }

    // Compare id of requesting user with owners array if command is owner only
    if (thisCmd.ownersOnly && !this.data.cachefile.ownerid.includes(steamID64)) return respondModule(context, resInfo, this.data.lang.commandowneronly);

    // Run command if one was found
    thisCmd.run(this, args, steamID64, respondModule, context, resInfo);

    // Return true if command was found
    return true;

};


module.exports = CommandHandler;