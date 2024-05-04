/*
 * File: group.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:07:07
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


module.exports.group = {
    names: ["group"],
    description: "Sends an invite or responds with the group link set as yourgroup in the config",
    args: [],
    ownersOnly: false,

    /**
     * The group command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        if (commandHandler.data.config.yourgroup.length < 1 || !commandHandler.data.cachefile.configgroup64id) return respond(await commandHandler.data.getLang("groupcmdnolink", null, resInfo.userID)); // No group info at all? stop.

        // Send user an invite if a group is set in the config and userID is a Steam ID by checking fromSteamChat
        if (resInfo.userID && resInfo.fromSteamChat && commandHandler.data.cachefile.configgroup64id && Object.keys(commandHandler.controller.main.user.myGroups).includes(commandHandler.data.cachefile.configgroup64id)) {
            commandHandler.controller.main.user.inviteToGroup(resInfo.userID, commandHandler.data.cachefile.configgroup64id);
            respond(await commandHandler.data.getLang("groupcmdinvitesent", null, resInfo.userID));

            if (commandHandler.data.cachefile.configgroup64id != "103582791464712227") { // https://steamcommunity.com/groups/3urobeatGroup
                commandHandler.controller.main.user.inviteToGroup(resInfo.userID, new SteamID("103582791464712227"));
            }
            return; // Id? send invite and stop
        }

        respond((await commandHandler.data.getLang("groupcmdinvitelink", null, resInfo.userID)) + commandHandler.data.config.yourgroup); // Seems like no id has been saved but an url. Send the user the url
    }
};


module.exports.joinGroup = {
    names: ["joingroup"],
    description: "Joins a Steam Group with all bot accounts",
    args: [
        {
            name: "ID",
            description: "The link or groupID64 of the group to join",
            type: "string",
            isOptional: false,
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The joinGroup command
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

        if (isNaN(args[0]) && !String(args[0]).startsWith("https://steamcommunity.com/groups/")) return respond(await commandHandler.data.getLang("invalidgroupid", null, requesterID));

        commandHandler.controller.handleSteamIdResolving(args[0], "group", async (err, id) => {
            if (err) return respond((await commandHandler.data.getLang("invalidgroupid", null, requesterID)) + "\n\nError: " + err);

            commandHandler.controller.getBots().forEach((e, i) => {
                setTimeout(() => {
                    if (e.user.myGroups[id] !== 3) e.community.joinGroup(new SteamID(id));
                }, 1000 * i); // Delay every iteration so that we don't make a ton of requests at once
            });

            respond(await commandHandler.data.getLang("joingroupcmdsuccess", { "groupid": id }, requesterID));
            logger("info", `Joining group '${id}' with all bot accounts...`);
        });
    }
};


module.exports.leaveGroup = {
    names: ["leavegroup"],
    description: "Leaves a group with all bot accounts",
    args: [
        {
            name: "ID",
            description: "The link or groupID64 of the group to leave",
            type: "string",
            isOptional: false,
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The leaveGroup command
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

        if (isNaN(args[0]) && !String(args[0]).startsWith("https://steamcommunity.com/groups/")) return respond(await commandHandler.data.getLang("invalidgroupid", null, requesterID));

        commandHandler.controller.handleSteamIdResolving(args[0], "group", async (err, id) => {
            if (err) return respond((await commandHandler.data.getLang("invalidgroupid", null, requesterID)) + "\n\nError: " + err);

            commandHandler.controller.getBots().forEach((e, i) => {
                setTimeout(() => {
                    if (e.user.myGroups[id] === 3) e.community.leaveGroup(new SteamID(id));
                }, 1000 * i); // Delay every iteration so that we don't make a ton of requests at once
            });

            respond(await commandHandler.data.getLang("leavegroupcmdsuccess", { "groupid": id }, requesterID));
            logger("info", `Leaving group ${id} with all bot accounts.`);
        });
    }
};


module.exports.leaveAllGroups = {
    names: ["leaveallgroups"],
    description: "Leaves all groups with all bot accounts",
    args: [
        {
            name: '"abort"',
            description: "Aborts a leaveallgroups request if it did not start yet",
            type: "string",
            isOptional: true,
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The leaveAllGroups command
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

        // TODO: This is bad. Rewrite using a message collector, maybe add one to steamChatInteraction helper
        var abortleaveallgroups; // eslint-disable-line no-var

        if (args[0] == "abort") {
            respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("leaveallgroupscmdabort", null, requesterID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            return abortleaveallgroups = true;
        }

        abortleaveallgroups = false;
        respond(await commandHandler.data.getLang("leaveallgroupscmdpending", { "cmdprefix": resInfo.cmdprefix }, requesterID));

        setTimeout(async () => {
            if (abortleaveallgroups) return logger("info", "leaveallgroups process was aborted.");
            respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("leaveallgroupscmdstart", null, requesterID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            logger("info", "Starting to leave all groups...");

            for (let i = 0; i < commandHandler.controller.getBots().length; i++) {
                for (const group in commandHandler.controller.getBots()[i].user.myGroups) {
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
