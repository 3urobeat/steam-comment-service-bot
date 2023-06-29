/*
 * File: requests.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 29.06.2023 22:35:03
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler                = require("../commandHandler.js"); // eslint-disable-line
const { failedCommentsObjToString } = require("../helpers/handleCommentSkips.js");


module.exports.abort = {
    names: ["abort"],
    description: "",
    ownersOnly: false,

    /**
     * The abort command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        if (commandHandler.controller.info.readyAfter == 0) return respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.botnotready); // Check if bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained

        commandHandler.controller.handleSteamIdResolving(args[0], null, (err, res) => {
            if (res) {
                let activeReqEntry = commandHandler.controller.activeRequests[res];

                // Refuse if user is not an owner and the request is not from them
                if (!commandHandler.data.cachefile.ownerid.includes(steamID64) && (activeReqEntry && activeReqEntry.requestedby != steamID64)) return respond(commandHandler.data.lang.commandowneronly);
                    else logger("debug", "CommandHandler abort cmd: Non-owner provided ID as parameter but is requester of that request. Permitting abort...");

                steamID64 = res; // If user provided an id as argument then use that instead of their id
            }

            if (!commandHandler.controller.activeRequests[steamID64] || commandHandler.controller.activeRequests[steamID64].status != "active") return respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.abortcmdnoprocess); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

            // Set new status for this request
            commandHandler.controller.activeRequests[steamID64].status = "aborted";

            logger("info", `Aborting active process for ID ${steamID64}...`);
            respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.abortcmdsuccess); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
        });
    }
};


module.exports.resetCooldown = {
    names: ["resetcooldown", "rc"],
    description: "",
    ownersOnly: true,

    /**
     * The resetcooldown command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        if (args[0] && args[0] == "global") { // Check if user wants to reset the global cooldown (will reset all until entries in activeRequests)
            if (commandHandler.data.config.botaccountcooldown == 0) return respond(commandHandler.data.lang.resetcooldowncmdcooldowndisabled); // Is the global cooldown enabled?

            Object.keys(commandHandler.controller.activeRequests).forEach((e) => {
                commandHandler.controller.activeRequests[e].until = Date.now() - (commandHandler.data.config.botaccountcooldown * 60000); // Since the cooldown checks will add the cooldown we need to subtract it (can't delete the entry because we might abort running processes with it)
            });

            respond(commandHandler.data.lang.resetcooldowncmdglobalreset);

        } else {

            commandHandler.controller.handleSteamIdResolving(args[0], "profile", (err, res) => {
                if (err) return respond(commandHandler.data.lang.invalidprofileid + "\n\nError: " + err);
                if (res) steamID64 = res; // Change steamID64 to the provided id

                if (commandHandler.data.config.commentcooldown == 0) return respond(commandHandler.data.lang.resetcooldowncmdcooldowndisabled); // Is the cooldown enabled?

                commandHandler.data.lastCommentDB.update({ id: steamID64 }, { $set: { time: Date.now() - (commandHandler.data.config.commentcooldown * 60000) } }, (err) => {
                    if (err) return respond("Error updating database entry: " + err);
                        else respond(commandHandler.data.lang.resetcooldowncmdsuccess.replace("profileid", steamID64.toString()));
                });
            });
        }
    }
};


module.exports.failed = {
    names: ["failed"],
    description: "",
    ownersOnly: false,

    /**
     * The failed command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        commandHandler.controller.handleSteamIdResolving(args[0], null, (err, res) => {
            if (res) {
                let activeReqEntry = commandHandler.controller.activeRequests[res];

                // Refuse if user is not an owner and the request is not from them
                if (!commandHandler.data.cachefile.ownerid.includes(steamID64) && (activeReqEntry && activeReqEntry.requestedby != steamID64)) return respond(commandHandler.data.lang.commandowneronly);
                    else logger("debug", "CommandHandler failed cmd: Non-owner provided ID as parameter but is requester of that request. Permitting data retrieval...");

                steamID64 = res; // If user provided an id as argument then use that instead of their id
            }

            if (!commandHandler.controller.activeRequests[steamID64] || Object.keys(commandHandler.controller.activeRequests[steamID64].failed).length < 1) return respond(commandHandler.data.lang.failedcmdnothingfound);

            // Get timestamp of request
            let requestTime = new Date(commandHandler.controller.activeRequests[steamID64].until).toISOString().replace(/T/, " ").replace(/\..+/, "");

            // Group errors and convert them to string using helper function
            let failedcommentsstr = failedCommentsObjToString(commandHandler.controller.activeRequests[steamID64].failed);

            // Get start of message from lang file and add data
            let messagestart = commandHandler.data.lang.failedcmdmsg.replace("steamID64", steamID64).replace("requesttime", requestTime);

            // Send message and limit to 500 chars as this call can cause many messages to be sent
            respondModule(context, { prefix: "/pre", charLimit: 500, ...resInfo }, messagestart + "\nc = Comment, b = Bot, p = Proxy\n\n" + failedcommentsstr); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
        });
    }
};


module.exports.sessions = {
    names: ["sessions"],
    description: "",
    ownersOnly: true,

    /**
     * The sessions command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        let str = "";

        if (Object.keys(commandHandler.controller.activeRequests).length > 0) { // Only loop through object if it isn't empty
            let objlength = Object.keys(commandHandler.controller.activeRequests).length; // Save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

            Object.keys(commandHandler.controller.activeRequests).forEach((e, i) => {
                if (Date.now() < commandHandler.controller.activeRequests[e].until + (commandHandler.data.config.botaccountcooldown * 60000)) { // Check if entry is not finished yet
                    str += `- Status: ${commandHandler.controller.activeRequests[e].status} | ${commandHandler.controller.activeRequests[e].amount} iterations with ${commandHandler.controller.activeRequests[e].accounts.length} accounts by ${commandHandler.controller.activeRequests[e].requestedby} for ${commandHandler.controller.activeRequests[e].type} ${Object.keys(commandHandler.controller.activeRequests)[i]}\n`;
                } else {
                    delete commandHandler.controller.activeRequests[e]; // Remove entry from object if it is finished to keep the object clean
                }

                if (i == objlength - 1) {
                    if (Object.keys(commandHandler.controller.activeRequests).length > 0) { // Check if obj is still not empty
                        respond(commandHandler.data.lang.sessionscmdmsg.replace("amount", Object.keys(commandHandler.controller.activeRequests).length) + "\n" + str);
                    } else {
                        respond(commandHandler.data.lang.sessionscmdnosessions);
                    }
                }
            });
        } else {
            respond(commandHandler.data.lang.sessionscmdnosessions);
        }
    }
};


module.exports.mySessions = {
    names: ["mysessions"],
    description: "",
    ownersOnly: false,

    /**
     * The mysessions command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        let str = "";

        if (Object.keys(commandHandler.controller.activeRequests).length > 0) { // Only loop through object if it isn't empty
            let objlength = Object.keys(commandHandler.controller.activeRequests).length; // Save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

            Object.keys(commandHandler.controller.activeRequests).forEach((e, i) => {
                if (Date.now() < commandHandler.controller.activeRequests[e].until + (commandHandler.data.config.botaccountcooldown * 60000)) { // Check if entry is not finished yet
                    if (commandHandler.controller.activeRequests[e].requestedby == steamID64) str += `- Status: ${commandHandler.controller.activeRequests[e].status} | ${commandHandler.controller.activeRequests[e].amount} iterations with ${commandHandler.controller.activeRequests[e].accounts.length} accounts by ${commandHandler.controller.activeRequests[e].requestedby} for ${commandHandler.controller.activeRequests[e].type} ${Object.keys(commandHandler.controller.activeRequests)[i]}`;
                } else {
                    delete commandHandler.controller.activeRequests[e]; // Remove entry from object if it is finished to keep the object clean
                }

                if (i == objlength - 1) {
                    if (i == objlength - 1) {
                        if (Object.keys(commandHandler.controller.activeRequests).length > 0) { // Check if obj is still not empty
                            respond(commandHandler.data.lang.sessionscmdmsg.replace("amount", Object.keys(commandHandler.controller.activeRequests).length) + "\n" + str);
                        } else {
                            respond(commandHandler.data.lang.mysessionscmdnosessions);
                        }
                    }
                }
            });
        } else {
            respond(commandHandler.data.lang.mysessionscmdnosessions);
        }
    }
};