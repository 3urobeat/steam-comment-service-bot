/*
 * File: commandHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-04-01 21:54:21
 * Author: 3urobeat
 *
 * Last Modified: 2024-02-29 20:17:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const Controller = require("../controller/controller.js"); // eslint-disable-line


/**
 * @typedef Command Documentation of the Command structure
 * @type {object}
 * @property {[string]} names All names that should trigger this command
 * @property {string} description Description of what this command does
 * @property {Array.<CommandArg>} args Array of objects containing information about each parameter supported by this command
 * @property {boolean} ownersOnly Set to true to only allow owners to use this command.
 * @property {function(CommandHandler, Array, string, function(object, object, string): void, object, object): void} run Function that will be executed when the command runs. Arguments: commandHandler, args, steamID64, respondModule, context, resInfo
 */

/**
 * @typedef CommandArg Documentation of the Command argument structure
 * @type {object}
 * @property {string} name Name of this argument. Use common phrases like "ID" or "amount" if possible. If a specific word is expected, put the word inside quotation marks.
 * @property {string} description Description of this argument
 * @property {string} type Expected datatype of this argument. If read from a chat it will usually be "string"
 * @property {boolean} isOptional True if this argument is optional, false if it must be provided. Make sure to check for missing arguments and return an error if false.
 * @property {boolean} ownersOnly True if this argument is only allowed to be provided by owners set in the config. If the command itself is `ownersOnly`, set this property to `true` as well.
 */


/**
 * Constructor - Initializes the commandHandler which allows you to integrate core commands into your plugin or add new commands from your plugin.
 * @class
 * @param {Controller} controller Reference to the current controller object
 */
const CommandHandler = function(controller) {

    this.controller = controller;
    this.data       = controller.data;

    /**
     * Array of objects, where each object represents a registered command
     * @type {Array.<Command>}
     */
    this.commands = [];

};


/**
 * Internal: Imports core commands on startup
 * @returns {Promise.<void>} Resolved when all commands have been imported
 */
CommandHandler.prototype._importCoreCommands = function() {
    return new Promise((resolve) => {

        logger("info", "CommandHandler: Loading all core commands...", false, true, logger.animation("loading"));

        fs.readdir("./src/commands/core", (err, files) => {

            // Stop now on error or if nothing was found
            if (err) {
                logger("error", "Error while reading core dir: " + err, true);
                return resolve();
            }
            if (files.length == 0) {
                logger("info", "No commands in ./core found!", false, true, logger.animation("loading"));
                return resolve();
            }

            // Iterate over all files in this dir
            files.forEach((e) => {
                let thisFile;

                // Try to load command
                try {
                    // Load the command file
                    thisFile = require(`./core/${e}`);

                    // Push all exported commands in this file into the command list
                    Object.values(thisFile).every(val => this.commands.push(val));
                } catch (err) {
                    logger("error", `Error loading core command '${e}'! ${err.stack}`, true);
                }
            });

            logger("info", `CommandHandler: Successfully loaded ${this.commands.length} core commands!`, false, true, logger.animation("loading"));
            resolve();

        });

    });
};


/**
 * Registers a new command during runtime
 * @param {Command} command The command object to register
 * @returns {boolean} true if the command was successfully registered, false otherwise
 */
CommandHandler.prototype.registerCommand = function(command) {

    // Check for incomplete object
    if (!command || !command.names || command.names.length == 0 || !command.run) {
        logger("error", "CommandHandler registerCommand(): Cannot register command with incomplete content! Ignoring request...");
        return false;
    }

    // Set defaults for description & ownersOnly if omitted
    if (!command.description) command.description = "";
    if (!command.ownersOnly)  command.ownersOnly  = false;

    // Check for duplicate command name
    let returnval = true; // Dirty hack to return false from nested function (the forEach() below)

    command.names.forEach((e) => {
        if (this.commands.find(f => f.names.includes(e))) {
            logger("error", `CommandHandler registerCommand(): There is already a command registered with the name ${e}! Ignoring request...`);
            returnval = false;
        }
    });

    if (!returnval) return returnval; // Return if it was set to false

    // Register command
    this.commands.push(command);

    logger("info", `CommandHandler registerCommand(): Successfully registered the command '${command.names[0]}'"!`, false, true);
    return true;

};


/**
 * The name of the command to unregister during runtime
 * @param {string} commandName Name of the command to unregister
 * @returns {boolean} `true` if the command was successfully unregistered, `false` otherwise
 */
CommandHandler.prototype.unregisterCommand = function(commandName) {

    // Iterate through all command objects in commands array and check if name is included in names array of each command.
    let thisCmd = this.commands.find(e => e.names.includes(commandName));

    if (!thisCmd) {
        logger("warn", `CommandHandler unregisterCommand(): Command '${commandName}' was not found!`);
        return false;
    }

    // Remove command from commands array
    let index = this.commands.indexOf(thisCmd);

    this.commands.splice(index, index + 1);

    logger("info", `CommandHandler unregisterCommand(): Successfully unregistered the command '${thisCmd.names[0]}'"!`, false, true);
    return true;

};


/**
 * @typedef resInfo Documentation of the default/commonly used content the resInfo object can/should contain
 * @type {object}
 * @property {string} [cmdprefix] Prefix your command execution handler uses. This will be used in response messages referencing commands. Default: !
 * @property {string} userID ID of the user who executed this command. Will be used for command default behavior (e.g. commenting on the requester's profile), to check for owner privileges, apply cooldowns and maybe your respondModule implementation for responding. Strongly advised to include.
 * @property {Array.<string>} [ownerIDs] Can be provided to overwrite `config.ownerid` for owner privilege checks. Useful if you are implementing a different platform and so `userID` won't be a steamID64 (e.g. discord)
 * @property {number} [charLimit] Supported by the Steam Chat Message handler: Overwrites the default index from which response messages will be cut up into parts
 * @property {Array.<string>} [cutChars] Custom chars to search after for cutting string in parts to overwrite cutStringsIntelligently's default: [" ", "\n", "\r"]
 * @property {boolean} [fromSteamChat] Set to true if your command handler is receiving messages from the Steam Chat and `userID` is therefore a `steamID64`. Will be used to enable command default behavior (e.g. commenting on the requester's profile)
 * @property {string} [prefix] Do not provide this argument, you'll receive it from commands: Steam Chat Message prefixes like /me. Can be ignored or translated to similar prefixes your platform might support
 */


/**
 * Finds a loaded command by name and runs it
 * @param {string} name The name of the command
 * @param {Array} args Array of arguments that will be passed to the command
 * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
 * @param {object} context The context (`this.`) of the object calling this command. Will be passed to respondModule() as first parameter to make working in this function easier.
 * @param {resInfo} resInfo Object containing additional information
 * @returns {boolean} `true` if command was found, `false` if not
 */
CommandHandler.prototype.runCommand = async function(name, args, respondModule, context, resInfo) {

    // Iterate through all command objects in commands array and check if name is included in names array of each command.
    let thisCmd = this.commands.find(e => e.names.includes(name));

    if (!thisCmd) {
        logger("warn", `CommandHandler runCommand(): Command '${name}' was not found!`);
        return false;
    }

    if (!resInfo) {
        logger("warn", `CommandHandler runCommand(): Command '${name}' was called without 'resInfo'! Commands might fail because of missing information!`);
        resInfo = {};
    }

    // Set command to ownersOnly if one of its aliases is inlcuded in restrictAdditionalCommandsToOwners
    if (this.controller.data.advancedconfig.restrictAdditionalCommandsToOwners.some(e => thisCmd.names.includes(e))) {
        logger("info", `CommandHandler runCommand(): Command '${name}' is included in 'restrictAdditionalCommandsToOwners' and has been restricted to owners.`);
        thisCmd.ownersOnly = true;
    }

    // Display warning if a non Steam Chat userID was provided without a custom owner ID array. Permit usage of owner only parameters of non owner only commands.
    if (resInfo.userID && !resInfo.fromSteamChat && (!resInfo.ownerIDs || resInfo.ownerIDs.length == 0)) {
        logger("warn", `CommandHandler runCommand(): Command '${name}' was called with a non-SteamID without a custom ownerIDs array! *${logger.colors.fgred}This will either BYPASS or BLOCK all owner checks, leading to unprotected or no access!${logger.colors.reset}*`);
    }

    // Get the correct ownerid array for this request
    let owners = this.data.cachefile.ownerid;
    if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

    // If command is ownersOnly, check if user is included in owners array. If not, send error msg and return true to avoid caller sending a not found msg
    if (thisCmd.ownersOnly && !owners.includes(resInfo.userID)) { // If no userID was provided this check will also trigger
        respondModule(context, resInfo, await this.data.getLang("commandowneronly", null, resInfo.userID));
        return true;
    }

    // Add default prefix to resInfo object if none was provided
    if (!resInfo || !resInfo.cmdprefix) resInfo["cmdprefix"] = "!";

    // Run command if one was found
    thisCmd.run(this, args, respondModule, context, resInfo);

    // Return true if command was found
    return true;

};


/**
 * Reloads all core commands. Does NOT reload commands registered at runtime. Please consider reloading the pluginSystem as well.
 */
CommandHandler.prototype.reloadCommands = function() {

    this.commands = [];

    // Delete cache so requiring commands again will load new changes
    Object.keys(require.cache).forEach((key) => {
        if (key.includes("src/commands/core") || key.includes("src/commands/helpers")) delete require.cache[key];
    });

    // Load core commands again after a moment
    setTimeout(() => this._importCoreCommands(), 500);

};


module.exports = CommandHandler;
