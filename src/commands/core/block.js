/*
 * File: block.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2024-05-08 20:49:02
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


module.exports.block = {
    names: ["block"],
    description: "Blocks a user with all bot accounts on Steam",
    args: [
        {
            name: "ID",
            description: "The link, steamID64 or vanity of the profile to block",
            type: "string",
            isOptional: false,
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The block command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        if (commandHandler.controller.info.readyAfter == 0) return respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("botnotready", null, resInfo.userID)); // Check if bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained

        if (!args[0]) return respond(await commandHandler.data.getLang("invalidprofileid", null, resInfo.userID));

        // Get the correct ownerid array for this request
        let owners = commandHandler.data.cachefile.ownerid;
        if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

        commandHandler.controller.handleSteamIdResolving(args[0], "profile", async (err, res) => {
            if (err) return respond((await commandHandler.data.getLang("invalidprofileid", null, resInfo.userID)) + "\n\nError: " + err);
            if (owners.includes(res)) return respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("idisownererror", null, resInfo.userID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

            commandHandler.controller.getBots().forEach((e) => {
                e.user.blockUser(new SteamID(res), (err) => { if (err) logger("error", `[${e.logPrefix}] Error blocking user '${res}': ${err}`); });
            });

            respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("blockcmdsuccess", { "profileid": res }, resInfo.userID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            logger("info", `Blocked '${res}' with all bot accounts.`);
        });
    }
};


module.exports.unblock = {
    names: ["unblock"],
    description: "Unblocks a user with all bot accounts on Steam. Note: The user can still get ignored by Steam for a while",
    args: [
        {
            name: "ID",
            description: "The link, steamID64 or vanity of the profile to unblock",
            type: "string",
            isOptional: false,
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The unblock command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        if (commandHandler.controller.info.readyAfter == 0) return respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("botnotready", null, resInfo.userID)); // Check if bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained

        if (!args[0]) return respond(await commandHandler.data.getLang("invalidprofileid", null, resInfo.userID));

        commandHandler.controller.handleSteamIdResolving(args[0], "profile", async (err, res) => {
            if (err) return respond((await commandHandler.data.getLang("invalidprofileid", null, resInfo.userID)) + "\n\nError: " + err);

            commandHandler.controller.getBots().forEach((e) => {
                e.user.unblockUser(new SteamID(res), (err) => { if (err) logger("error", `[${e.logPrefix}] Error unblocking user '${res}': ${err}`); });
            });

            respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("unblockcmdsuccess", { "profileid": res }, resInfo.userID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            logger("info", `Unblocked '${res}' with all bot accounts.`);
        });
    }
};
