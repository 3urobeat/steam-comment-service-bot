/*
 * File: friend.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 16.04.2023 19:11:24
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const CommandHandler         = require("../commandHandler.js"); // eslint-disable-line
const handleSteamIdResolving = require("../../bot/helpers/handleSteamIdResolving.js");


module.exports.addFriend = {
    names: ["addfriend"],
    description: "",
    ownersOnly: true,

    /**
     * The addFriend command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command). Note: Many core commands expect a steamID: "steamID64" parameter in this object, pointing to the requesting user.
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        if (!args[0]) return respond(commandHandler.data.lang.invalidprofileid);

        handleSteamIdResolving.run(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
            if (err) return respond(commandHandler.data.lang.invalidprofileid + "\n\nError: " + err);

            // Check if first bot account is limited to be able to display error message instantly
            if (commandHandler.controller.main.user.limitations && commandHandler.controller.main.user.limitations.limited == true) {
                respond(commandHandler.data.lang.addfriendcmdacclimited.replace("profileid", res));
                return;
            }

            respond(commandHandler.data.lang.addfriendcmdsuccess.replace("profileid", res).replace("estimatedtime", 5 * Object.keys(commandHandler.controller.bots).length));
            logger("info", `Adding friend ${res} with all bot accounts... This will take ~${5 * Object.keys(commandHandler.controller.bots).length} seconds.`);

            Object.values(commandHandler.controller.bots).forEach((e, i) => {
                // Check if this bot account is limited
                if (e.user.limitations && e.user.limitations.limited == true) {
                    logger("error", `Can't add friend ${res} with bot${i} because the bot account is limited.`);
                    return;
                }

                if (e.user.myFriends[res] != 3 && e.user.myFriends[res] != 1) { // Check if provided user is not friend and not blocked
                    setTimeout(() => {
                        e.user.addFriend(new SteamID(res), (err) => {
                            if (err) logger("error", `Error adding ${res} with bot${i}: ${err}`);
                                else logger("info", `Added ${res} with bot${i} as friend.`);
                        });

                        commandHandler.controller.friendListCapacityCheck(i, (remaining) => { // Check remaining friendlist space
                            if (remaining < 25) logger("warn", `The friendlist space of bot${i} is running low! (${remaining} remaining)`);
                        });
                    }, 5000 * i);
                } else {
                    logger("warn", `bot${i} is already friend with ${res} or the account was blocked/blocked you.`); // Somehow logs steamIDs in separate row?!
                }
            });
        });
    }
};


module.exports.unfriend = {
    names: ["unfriend"],
    description: "",
    ownersOnly: false,

    /**
     * The unfriend command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command). Note: Many core commands expect a steamID: "steamID64" parameter in this object, pointing to the requesting user.
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Unfriend message sender with all bot accounts if no id was provided
        if (!args[0]) {
            respond(commandHandler.data.lang.unfriendcmdsuccess);
            logger("info", `Removing friend ${resInfo.steamID64} from all bot accounts...`);

            Object.values(commandHandler.controller.bots).forEach((e, i) => {
                setTimeout(() => {
                    e.user.removeFriend(new SteamID(resInfo.steamID64));
                }, 1000 * i);
            });

        } else {

            // Unfriending a specific user is owner only
            if (!commandHandler.data.cachefile.ownerid.includes(resInfo.steamID64)) return respond(commandHandler.data.lang.commandowneronly);

            handleSteamIdResolving.run(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
                if (err) return respond(commandHandler.data.lang.invalidprofileid + "\n\nError: " + err);
                if (commandHandler.data.cachefile.ownerid.includes(res)) return respond(commandHandler.data.lang.idisownererror);

                Object.values(commandHandler.controller.bots).forEach((e, i) => {
                    setTimeout(() => {
                        e.user.removeFriend(new SteamID(res));
                    }, 1000 * i); // Delay every iteration so that we don't make a ton of requests at once
                });

                respond(commandHandler.data.lang.unfriendidcmdsuccess.replace("profileid", res));
                logger("info", `Removed friend ${res} from all bot accounts.`);
            });
        }
    }
};


module.exports.unfriendall = {
    names: ["unfriendall"],
    description: "",
    ownersOnly: true,

    /**
     * The unfriendall command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command). Note: Many core commands expect a steamID: "steamID64" parameter in this object, pointing to the requesting user.
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // TODO: This is bad. Rewrite using a message collector, maybe add one to steamChatInteraction helper
        var abortunfriendall;

        if (args[0] == "abort") {
            respond(commandHandler.data.lang.unfriendallcmdabort);
            return abortunfriendall = true;
        }

        abortunfriendall = false;
        respond(commandHandler.data.lang.unfriendallcmdpending);

        setTimeout(() => {
            if (abortunfriendall) return logger("info", "unfriendall process was aborted.");
            respond(commandHandler.data.lang.unfriendallcmdstart);
            logger("info", "Starting to unfriend everyone...");

            for (let i = 0; i < Object.keys(commandHandler.controller.bots).length; i++) {
                for (let friend in Object.values(commandHandler.controller.bots)[i].user.myFriends) {
                    try {
                        setTimeout(() => {
                            let friendSteamID = new SteamID(String(friend));

                            if (!commandHandler.data.cachefile.ownerid.includes(friend)) {
                                logger("info", `Removing friend ${friendSteamID.getSteamID64()} from all bot accounts...`, false, false, logger.animation("loading"));
                                Object.values(commandHandler.controller.bots)[i].user.removeFriend(friendSteamID);
                            } else {
                                logger("debug", `unfriendAll(): Friend ${friendSteamID.getSteamID64()} seems to be an owner, skipping...`, false, false, logger.animation("loading"));
                            }
                        }, 1000 * i); // Delay every iteration so that we don't make a ton of requests at once
                    } catch (err) {
                        logger("error", `[Bot ${i}] unfriendall error unfriending ${friend}: ${err}`);
                    }
                }
            }
        }, 30000);
    }
};