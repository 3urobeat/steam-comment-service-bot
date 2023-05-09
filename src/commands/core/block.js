/*
 * File: block.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 09.05.2023 15:30:00
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


module.exports.block = {
    names: ["block"],
    description: "",
    ownersOnly: true,

    /**
     * The block command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        if (commandHandler.controller.info.readyAfter == 0) return respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.botmaintenance); // Check if bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained

        if (!args[0]) return respond(commandHandler.data.lang.invalidprofileid);

        handleSteamIdResolving(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
            if (err) return respond(commandHandler.data.lang.invalidprofileid + "\n\nError: " + err);
            if (commandHandler.data.cachefile.ownerid.includes(res)) return respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.idisownererror); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

            commandHandler.controller.getBots().forEach((e, i) => {
                e.user.blockUser(new SteamID(res), (err) => { if (err) logger("error", `[Bot ${i}] Error blocking user ${res}: ${err}`); });
            });

            respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.blockcmdsuccess.replace("profileid", res)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            logger("info", `Blocked ${res} with all bot accounts.`);
        });
    }
};


module.exports.unblock = {
    names: ["unblock"],
    description: "",
    ownersOnly: true,

    /**
     * The unblock command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        if (commandHandler.controller.info.readyAfter == 0) return respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.botmaintenance); // Check if bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained

        if (!args[0]) return respond(commandHandler.data.lang.invalidprofileid);

        handleSteamIdResolving(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
            if (err) return respond(commandHandler.data.lang.invalidprofileid + "\n\nError: " + err);

            commandHandler.controller.getBots().forEach((e, i) => {
                e.user.unblockUser(new SteamID(res), (err) => { if (err) logger("error", `[Bot ${i}] Error unblocking user ${res}: ${err}`); });
            });

            respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.unblockcmdsuccess.replace("profileid", res)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            logger("info", `Unblocked ${res} with all bot accounts.`);
        });
    }
};