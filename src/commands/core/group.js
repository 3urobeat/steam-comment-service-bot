/*
 * File: group.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 12.06.2023 15:50:38
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID         = require("steamid");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


module.exports.group = {
    names: ["group"],
    description: "",
    ownersOnly: false,

    /**
     * The group command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        if (commandHandler.data.config.yourgroup.length < 1 || !commandHandler.data.cachefile.configgroup64id) return respond(commandHandler.data.lang.groupcmdnolink); // No group info at all? stop.

        if (commandHandler.data.cachefile.configgroup64id && Object.keys(commandHandler.controller.main.user.myGroups).includes(commandHandler.data.cachefile.configgroup64id)) {
            commandHandler.controller.main.user.inviteToGroup(steamID64, commandHandler.data.cachefile.configgroup64id);
            respond(commandHandler.data.lang.groupcmdinvitesent);

            if (commandHandler.data.cachefile.configgroup64id != "103582791464712227") { // https://steamcommunity.com/groups/3urobeatGroup
                commandHandler.controller.main.user.inviteToGroup(steamID64, new SteamID("103582791464712227"));
            }
            return; // Id? send invite and stop
        }

        respond(commandHandler.data.lang.groupcmdinvitelink + commandHandler.data.config.yourgroup); // Seems like no id has been saved but an url. Send the user the url
    }
};


module.exports.joinGroup = {
    names: ["joingroup"],
    description: "Joins a Steam Group with all bot accounts",
    ownersOnly: true,

    /**
     * The joinGroup command
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

        if (isNaN(args[0]) && !String(args[0]).startsWith("https://steamcommunity.com/groups/")) return respond(commandHandler.data.lang.invalidgroupid);

        commandHandler.controller.handleSteamIdResolving(args[0], "group", (err, id) => {
            if (err) return respond(commandHandler.data.lang.invalidgroupid + "\n\nError: " + err);

            commandHandler.controller.getBots().forEach((e, i) => {
                setTimeout(() => {
                    if (e.user.myGroups[id] !== 3) e.community.joinGroup(new SteamID(id));
                }, 1000 * i); // Delay every iteration so that we don't make a ton of requests at once
            });

            respond(commandHandler.data.lang.joingroupcmdsuccess.replace("groupid", id));
            logger("info", `Joining group '${id}' with all bot accounts...`);
        });
    }
};


module.exports.leaveGroup = {
    names: ["leavegroup"],
    description: "",
    ownersOnly: true,

    /**
     * The leaveGroup command
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

        if (isNaN(args[0]) && !String(args[0]).startsWith("https://steamcommunity.com/groups/")) return respond(commandHandler.data.lang.invalidgroupid);

        commandHandler.controller.handleSteamIdResolving(args[0], "group", (err, id) => {
            if (err) return respond(commandHandler.data.lang.invalidgroupid + "\n\nError: " + err);

            commandHandler.controller.getBots().forEach((e, i) => {
                setTimeout(() => {
                    if (e.user.myGroups[id] === 3) e.community.leaveGroup(new SteamID(id));
                }, 1000 * i); // Delay every iteration so that we don't make a ton of requests at once
            });

            respond(commandHandler.data.lang.leavegroupcmdsuccess.replace("groupid", id));
            logger("info", `Leaving group ${id} with all bot accounts.`);
        });
    }
};


module.exports.leaveAllGroups = {
    names: ["leaveallgroups"],
    description: "",
    ownersOnly: true,

    /**
     * The leaveAllGroups command
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

        // TODO: This is bad. Rewrite using a message collector, maybe add one to steamChatInteraction helper
        var abortleaveallgroups; // eslint-disable-line no-var

        if (args[0] == "abort") {
            respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.leaveallgroupscmdabort); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            return abortleaveallgroups = true;
        }

        abortleaveallgroups = false;
        respond(commandHandler.data.lang.leaveallgroupscmdpending.replace(/cmdprefix/g, resInfo.cmdprefix));

        setTimeout(() => {
            if (abortleaveallgroups) return logger("info", "leaveallgroups process was aborted.");
            respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.leaveallgroupscmdstart); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            logger("info", "Starting to leave all groups...");

            for (let i = 0; i < commandHandler.controller.getBots().length; i++) {
                for (let group in commandHandler.controller.getBots()[i].user.myGroups) {
                    try {
                        setTimeout(() => {
                            if (commandHandler.controller.getBots()[i].user.myGroups[group] == 3) {
                                if (group != commandHandler.data.cachefile.botsgroupid && group != commandHandler.data.cachefile.configgroup64id) commandHandler.controller.getBots()[i].community.leaveGroup(String(group));
                            }
                        }, 1000 * i); // Delay every iteration so that we don't make a ton of requests at once
                    } catch (err) {
                        logger("error", `[Bot ${i}] leaveallgroups error leaving ${group}: ${err}`);
                    }
                }
            }
        }, 15000);
    }
};