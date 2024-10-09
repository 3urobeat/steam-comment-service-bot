/*
 * File: requests.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2024-10-09 22:31:31
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler                = require("../commandHandler.js"); // eslint-disable-line
const { failedCommentsObjToString } = require("../helpers/handleCommentErrors.js");


module.exports.abort = {
    names: ["abort"],
    description: "Abort your own comment process or one on another ID you have started. Owners can also abort requests started by other users",
    args: [
        {
            name: "ID",
            description: "The link, steamID64 or vanity of the profile, group or sharedfile to abort the request of",
            type: "string",
            isOptional: true,
            ownersOnly: false // Providing an ID for a request of another user is ownerOnly
        },
    ],
    ownersOnly: false,

    /**
     * The abort command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        const requesterID = resInfo.userID;

        if (commandHandler.controller.info.readyAfter == 0) return respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("botnotready", null, requesterID)); // Check if bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained

        let userID = resInfo.userID;

        // Check for no userID and no id param as both can be missing if called from outside the Steam Chat
        if (!userID && !args[0]) return respond(await commandHandler.data.getLang("noidparam", null, requesterID));

        commandHandler.controller.handleSteamIdResolving(args[0], null, async (err, res) => {
            if (res) {
                const activeReqEntry = commandHandler.controller.activeRequests[res];

                // Get the correct ownerid array for this request
                let owners = commandHandler.data.cachefile.ownerid;
                if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

                // Refuse if user is not an owner and the request is not from them
                if (!owners.includes(resInfo.userID) && (activeReqEntry && activeReqEntry.requestedby != resInfo.userID)) return respond(await commandHandler.data.getLang("commandowneronly", null, requesterID));
                    else logger("debug", "CommandHandler abort cmd: Non-owner provided ID as parameter but is requester of that request. Permitting abort...");

                userID = res; // If user provided an id as argument then use that instead of their id
            }

            if (!commandHandler.controller.activeRequests[userID] || commandHandler.controller.activeRequests[userID].status != "active") return respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("abortcmdnoprocess", null, requesterID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

            // Set new status for this request
            commandHandler.controller.activeRequests[userID].status = "aborted";

            logger("info", `Aborting active process for ID ${userID}...`);
            respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("abortcmdsuccess", null, requesterID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
        });
    }
};


module.exports.resetCooldown = {
    names: ["resetcooldown", "rc"],
    description: "Clear your, the ID's or the comment cooldown of all bot accounts (global)",
    args: [
        {
            name: 'ID or "global"',
            description: "The link, steamID64 or vanity of the profile to clear the cooldown of or the word global to clear the cooldown of all bot accounts",
            type: "string",
            isOptional: true,
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The resetcooldown command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        const requesterID = resInfo.userID;

        if (args[0] && args[0] == "global") { // Check if user wants to reset the global cooldown (will reset all until entries in activeRequests)
            if (commandHandler.data.config.botaccountcooldown == 0) return respond(await commandHandler.data.getLang("resetcooldowncmdcooldowndisabled", null, requesterID)); // Is the global cooldown enabled?

            Object.keys(commandHandler.controller.activeRequests).forEach((e) => {
                commandHandler.controller.activeRequests[e].until = Date.now() - (commandHandler.data.config.botaccountcooldown * 60000); // Since the cooldown checks will add the cooldown we need to subtract it (can't delete the entry because we might abort running processes with it)
            });

            respond(await commandHandler.data.getLang("resetcooldowncmdglobalreset", null, requesterID));

        } else {

            let userID = resInfo.userID;

            // Check for no userID and no id param as both can be missing if called from outside the Steam Chat
            if (!userID && !args[0]) return respond(await commandHandler.data.getLang("noidparam", null, requesterID));

            commandHandler.controller.handleSteamIdResolving(args[0], "profile", async (err, res) => {
                if (err) return respond((await commandHandler.data.getLang("invalidprofileid", null, requesterID)) + "\n\nError: " + err);
                if (res) userID = res; // Change steamID64 to the provided id

                if (commandHandler.data.config.requestCooldown == 0) return respond(await commandHandler.data.getLang("resetcooldowncmdcooldowndisabled", null, requesterID)); // Is the cooldown enabled?

                commandHandler.data.lastCommentDB.update({ id: userID }, { $set: { time: Date.now() - (commandHandler.data.config.requestCooldown * 60000) } }, async (err) => {
                    if (err) return respond("Error updating database entry: " + err);
                        else respond(await commandHandler.data.getLang("resetcooldowncmdsuccess", { "profileid": userID.toString() }, requesterID));
                });
            });
        }
    }
};


module.exports.failed = {
    names: ["failed"],
    description: "Displays the exact errors of the last request for your profile. Alternatively provide an ID of a request you have started. Owners can also view errors for requests started by other users.",
    args: [
        {
            name: "ID",
            description: "The link, steamID64 or vanity of the profile, group or sharedfile to view the errors of",
            type: "string",
            isOptional: true,
            ownersOnly: false // Providing an ID for a request of another user is ownerOnly
        }
    ],
    ownersOnly: false,

    /**
     * The failed command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        let userID = resInfo.userID;

        // Check for no userID and no id param as both can be missing if called from outside the Steam Chat
        if (!userID && !args[0]) return respond(await commandHandler.data.getLang("noidparam", null, resInfo.userID));

        commandHandler.controller.handleSteamIdResolving(args[0], null, async (err, res) => {
            if (res) {
                const activeReqEntry = commandHandler.controller.activeRequests[res];

                // Get the correct ownerid array for this request
                let owners = commandHandler.data.cachefile.ownerid;
                if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

                // Refuse if user is not an owner and the request is not from them
                if (!owners.includes(userID) && (activeReqEntry && activeReqEntry.requestedby != userID)) return respond(await commandHandler.data.getLang("commandowneronly", null, resInfo.userID));
                    else logger("debug", "CommandHandler failed cmd: Non-owner provided ID as parameter but is requester of that request. Permitting data retrieval...");

                userID = res; // If user provided an id as argument then use that instead of their id
            }


            const thisRequest = commandHandler.controller.activeRequests[userID];

            if (!thisRequest || thisRequest.length < 1) return respond(await commandHandler.data.getLang("failedcmdnothingfound", null, resInfo.userID));


            // Get timestamp of request
            const requestTime = new Date(thisRequest.until).toISOString().replace(/T/, " ").replace(/\..+/, "");

            // Group errors and convert them to string using helper function
            const failedcommentsstr = failedCommentsObjToString(thisRequest.failed);

            // Get start of message from lang file and add data
            const messagestart = await commandHandler.data.getLang("failedcmdmsg", { "steamID64": `${thisRequest.type} ${userID}`, "requesttime": requestTime }, resInfo.userID);

            // Send message and limit to 500 chars as this call can cause many messages to be sent
            respondModule(context, { prefix: "/pre", charLimit: 500, ...resInfo }, messagestart + "\ni = Index, b = Bot, p = Proxy\n\n" + failedcommentsstr); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
        });
    }
};


module.exports.sessions = {
    names: ["sessions", "requests"],
    description: "Displays all active requests",
    args: [],
    ownersOnly: true,

    /**
     * The sessions command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Don't bother if there is no active request
        if (Object.keys(commandHandler.controller.activeRequests).length == 0) return respond(await commandHandler.data.getLang("sessionscmdnosessions", null, resInfo.userID));

        // Loop through every entry and push it to str
        let str = "";

        Object.keys(commandHandler.controller.activeRequests).forEach((e, i) => {
            const thisRequest = commandHandler.controller.activeRequests[e];

            if (Date.now() < thisRequest.until + (commandHandler.data.config.botaccountcooldown * 60000)) { // Check if entry is not finished yet
                str += `- Status: ${thisRequest.status} | ${thisRequest.amount} iterations with ${thisRequest.accounts.length} accounts by ${thisRequest.requestedby} for ${thisRequest.type} ${Object.keys(commandHandler.controller.activeRequests)[i]}\n`;
            } else {
                delete commandHandler.controller.activeRequests[e]; // Remove entry from object if it is finished to keep the object clean
            }
        });

        if (Object.keys(commandHandler.controller.activeRequests).length > 0) { // Check if obj is still not empty
            respond((await commandHandler.data.getLang("sessionscmdmsg", { "amount": Object.keys(commandHandler.controller.activeRequests).length }, resInfo.userID)) + "\n" + str);
        } else {
            respond(await commandHandler.data.getLang("sessionscmdnosessions", null, resInfo.userID));
        }
    }
};


module.exports.mySessions = {
    names: ["mysessions", "myrequests"],
    description: "Displays all active requests that you have started",
    args: [],
    ownersOnly: false,

    /**
     * The mysessions command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Check for no userID as the default behavior might be unavailable when calling from outside of the Steam Chat
        if (!resInfo.userID) return respond(await commandHandler.data.getLang("nouserid")); // In this case the cmd doesn't have an ID param so send this message instead of noidparam

        if (Object.keys(commandHandler.controller.activeRequests).length == 0) return respond(await commandHandler.data.getLang("mysessionscmdnosessions", null, resInfo.userID));

        // Loop through every entry requested by this user and push it to str
        let str = "";

        Object.keys(commandHandler.controller.activeRequests).forEach(async (e, i) => {
            const thisRequest = commandHandler.controller.activeRequests[e];

            if (Date.now() < thisRequest.until + (commandHandler.data.config.botaccountcooldown * 60000)) { // Check if entry is not finished yet
                if (thisRequest.requestedby == resInfo.userID) str += `- Status: ${thisRequest.status} | ${thisRequest.amount} iterations with ${thisRequest.accounts.length} accounts by ${thisRequest.requestedby} for ${thisRequest.type} ${Object.keys(commandHandler.controller.activeRequests)[i]}`;
            } else {
                delete commandHandler.controller.activeRequests[e]; // Remove entry from object if it is finished to keep the object clean
            }
        });

        if (Object.keys(commandHandler.controller.activeRequests).length > 0) { // Check if obj is still not empty
            respond((await commandHandler.data.getLang("sessionscmdmsg", { "amount": Object.keys(commandHandler.controller.activeRequests).length }, resInfo.userID)) + "\n" + str);
        } else {
            respond(await commandHandler.data.getLang("mysessionscmdnosessions", null, resInfo.userID));
        }
    }
};
