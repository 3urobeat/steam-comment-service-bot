/*
 * File: commentmisc.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 26.04.2023 20:33:59
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const CommandHandler             = require("../commandHandler.js"); // eslint-disable-line
const { handleSteamIdResolving } = require("../../bot/helpers/handleSteamIdResolving.js");


module.exports.abort = {
    names: ["abort"],
    description: "",
    ownersOnly: false,

    /**
     * The abort command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond   = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        handleSteamIdResolving(args[0], null, (err, res) => {
            if (res) {
                if (!commandHandler.data.cachefile.ownerid.includes(steamID64)) return respond(commandHandler.data.lang.commandowneronly);

                steamID64 = res; // If user provided an id as argument then use that instead of his/her id
            }

            if (!commandHandler.controller.activeRequests[steamID64] || commandHandler.controller.activeRequests[steamID64].status != "active") return respond(commandHandler.data.lang.abortcmdnoprocess);

            // Set new status for comment process
            commandHandler.controller.activeRequests[steamID64].status = "aborted";

            logger("info", `Aborting comment process for profile/group ${steamID64}...`);
            respond(commandHandler.data.lang.abortcmdsuccess);
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
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        if (commandHandler.data.advancedconfig.disableCommentCmd) return respond(commandHandler.data.lang.botmaintenance);

        if (args[0] && args[0] == "global") { // Check if user wants to reset the global cooldown (will reset all until entries in activecommentprocess)
            if (commandHandler.data.config.botaccountcooldown == 0) return respond(commandHandler.data.lang.resetcooldowncmdcooldowndisabled); // Is the global cooldown enabled?

            Object.keys(commandHandler.controller.activeRequests).forEach((e) => {
                commandHandler.controller.activeRequests[e].until = Date.now() - (commandHandler.data.config.botaccountcooldown * 60000); // Since the cooldown checks will add the cooldown we need to subtract it (can't delete the entry because we might abort running processes with it)
            });

            respond(commandHandler.data.lang.resetcooldowncmdglobalreset);

        } else {

            handleSteamIdResolving(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
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
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        handleSteamIdResolving(args[0], null, (err, res) => {
            if (res) {
                if (!commandHandler.data.cachefile.ownerid.includes(steamID64)) return respond(commandHandler.data.lang.commandowneronly);

                steamID64 = res; // If user provided an id as argument then use that instead of his/her id
            }

            commandHandler.controller.data.lastCommentDB.findOne({ id: steamID64 }, (err, doc) => {
                if (!commandHandler.controller.activeRequests[steamID64] || Object.keys(commandHandler.controller.activeRequests[steamID64].failed).length < 1) return respond(commandHandler.data.lang.failedcmdnothingfound);

                let requesttime = new Date(doc.time).toISOString().replace(/T/, " ").replace(/\..+/, "");

                let failedcommentsobj = JSON.stringify(commandHandler.controller.activeRequests[steamID64].failed, null, 4);
                let failedcommentsstr = failedcommentsobj.slice(1, -1).split("\n").map(s => s.trim()).join("\n"); // Remove brackets and whitespaces

                let messagestart = commandHandler.data.lang.failedcmdmsg.replace("steamID64", steamID64).replace("requesttime", requesttime);

                // Limit length to 750 characters to ensure the message can be sent
                if (failedcommentsstr.length >= 800) respond("/pre " + messagestart + "\nc = Comment, p = Proxy\n" + failedcommentsstr.slice(0, 800) + "... \n\n ..." + failedcommentsstr.slice(800, failedcommentsstr.length).split("\n").length + " entries hidden because message would be too long.");
                    else respond("/pre " + messagestart + "\nc = Comment, p = Proxy\n" + failedcommentsstr);
            });
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
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        var str = "";

        if (Object.keys(commandHandler.controller.activeRequests).length > 0) { // Only loop through object if it isn't empty
            let objlength = Object.keys(commandHandler.controller.activeRequests).length; // Save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

            Object.keys(commandHandler.controller.activeRequests).forEach((e, i) => {
                if (Date.now() < commandHandler.controller.activeRequests[e].until + (commandHandler.data.config.botaccountcooldown * 60000)) { // Check if entry is not finished yet
                    str += `- Status: ${commandHandler.controller.activeRequests[e].status} | ${commandHandler.controller.activeRequests[e].amount} comments with ${commandHandler.controller.activeRequests[e].accounts.length} accounts by ${commandHandler.controller.activeRequests[e].requestedby} for ${commandHandler.controller.activeRequests[e].type} ${Object.keys(commandHandler.controller.activeRequests)[i]}\n`;
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
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
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
                    if (commandHandler.controller.activeRequests[e].requestedby == steamID64) str += `- Status: ${commandHandler.controller.activeRequests[e].status} | ${commandHandler.controller.activeRequests[e].amount} comments with ${commandHandler.controller.activeRequests[e].accounts.length} accounts by ${commandHandler.controller.activeRequests[e].requestedby} for ${commandHandler.controller.activeRequests[e].type} ${Object.keys(commandHandler.controller.activeRequests)[i]}`;
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