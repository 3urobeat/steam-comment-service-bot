/*
 * File: friend.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 09.03.2022 15:46:00
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const controller             = require("../../controller/controller.js");
const handleSteamIdResolving = require("../helpers/handleSteamIdResolving.js");


/**
 * Runs the addfriend command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.addFriend = (chatmsg, steamID, lang, args) => {
    if (!args[0]) return chatmsg(steamID, lang.invalidprofileid);

    handleSteamIdResolving.run(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
        if (err) return chatmsg(steamID, lang.invalidprofileid + "\n\nError: " + err);

        // Check if first bot account is limited to be able to display error message instantly
        if (controller.botobject[0].limitations && controller.botobject[0].limitations.limited == true) {
            chatmsg(steamID, lang.addfriendcmdacclimited.replace("profileid", res));
            return;
        }

        chatmsg(steamID, lang.addfriendcmdsuccess.replace("profileid", res).replace("estimatedtime", 5 * Object.keys(controller.botobject).length));
        logger("info", `Adding friend ${res} with all bot accounts... This will take ~${5 * Object.keys(controller.botobject).length} seconds.`);

        Object.keys(controller.botobject).forEach((i) => {
            // Check if this bot account is limited
            if (controller.botobject[i].limitations && controller.botobject[i].limitations.limited == true) {
                logger("error", `Can't add friend ${res} with bot${i} because the bot account is limited.`);
                return;
            }

            if (controller.botobject[i].myFriends[new SteamID(res)] != 3 && controller.botobject[i].myFriends[new SteamID(res)] != 1) { // Check if provided user is not friend and not blocked
                setTimeout(() => {
                    controller.communityobject[i].addFriend(new SteamID(res).getSteam3RenderedID(), (err) => {
                        if (err) logger("error", `error adding ${res} with bot${i}: ${err}`);
                            else logger("info", `Added ${res} with bot${i} as friend.`);
                    });

                    require("../../controller/helpers/friendlist.js").friendlistcapacitycheck(i, (remaining) => { // Check remaining friendlist space
                        if (remaining < 25) {
                            logger("warn", `The friendlist space of bot${i} is running low! (${remaining} remaining)`);
                        }
                    });
                }, 5000 * i);
            } else {
                logger("warn", `bot${i} is already friend with ${res} or the account was blocked/blocked you.`); // Somehow logs steamIDs in seperate row?!
            }
        });
    });
};


/**
 * Runs the unfriend command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.unfriend = (chatmsg, steamID, lang, args) => {

    // Unfriend message sender with all bot accounts if no id was provided
    if (!args[0]) {
        chatmsg(steamID, lang.unfriendcmdsuccess);
        logger("info", `Removing friend ${new SteamID(String(steamID)).getSteamID64()} from all bot accounts...`);

        Object.keys(controller.botobject).forEach((e, i) => {
            setTimeout(() => {
                controller.botobject[i].removeFriend(steamID);
            }, 1000 * i);
        });

    } else {

        handleSteamIdResolving.run(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
            if (err) return chatmsg(steamID, lang.invalidprofileid + "\n\nError: " + err);
            if (cachefile.ownerid.includes(res)) return chatmsg(steamID, lang.idisownererror);

            Object.keys(controller.botobject).forEach((i) => {
                setTimeout(() => {
                    controller.botobject[i].removeFriend(new SteamID(res));
                }, 1000 * i); // Delay every iteration so that we don't make a ton of requests at once
            });

            chatmsg(steamID, lang.unfriendidcmdsuccess.replace("profileid", res));
            logger("info", `Removed friend ${res} from all bot accounts.`);
        });
    }
};


/**
 * Runs the unfriendall command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.unfriendAll = (chatmsg, steamID, lang, args) => {
    var abortunfriendall; // Make eslint happy

    if (args[0] == "abort") {
        chatmsg(steamID, lang.unfriendallcmdabort);
        return abortunfriendall = true;
    }

    abortunfriendall = false;
    chatmsg(steamID, lang.unfriendallcmdpending);

    setTimeout(() => {
        if (abortunfriendall) return logger("info", "unfriendall process was aborted.");
        chatmsg(steamID, lang.unfriendallcmdstart);
        logger("info", "Starting to unfriend everyone...");

        for (let i in controller.botobject) {
            for (let friend in controller.botobject[i].myFriends) {
                try {
                    setTimeout(() => {
                        let friendSteamID = new SteamID(String(friend));

                        if (!cachefile.ownerid.includes(friend)) {
                            logger("info", `Removing friend ${friendSteamID.getSteamID64()} from all bot accounts...`, false, false, logger.animation("loading"));
                            controller.botobject[i].removeFriend(friendSteamID);
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
};

