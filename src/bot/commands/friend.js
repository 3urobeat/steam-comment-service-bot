/*
 * File: friend.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 17:53:28
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Runs the addfriend command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.addFriend = (chatmsg, steamID, lang, args) => {
    var SteamID    = require('steamid');
    var controller = require("../../controller/controller.js")

    if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
    if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

    //Check if first bot account is limited to be able to display error message instantly
    if (controller.botobject[0].limitations && controller.botobject[0].limitations.limited == true) {
        chatmsg(steamID, lang.addfriendcmdacclimited.replace("profileid", args[0])) 
        return; 
    }

    chatmsg(steamID, lang.addfriendcmdsuccess.replace("profileid", args[0]).replace("estimatedtime", 5 * Object.keys(controller.botobject).length))
    logger("info", `Adding friend ${args[0]} with all bot accounts... This will take ~${5 * Object.keys(controller.botobject).length} seconds.`)

    Object.keys(controller.botobject).forEach((i) => {
        //Check if this bot account is limited
        if (controller.botobject[i].limitations && controller.botobject[i].limitations.limited == true) {
            logger("error", `Can't add friend ${args[0]} with bot${i} because the bot account is limited.`) 
            return;
        }

        if (controller.botobject[i].myFriends[new SteamID(args[0])] != 3 && controller.botobject[i].myFriends[new SteamID(args[0])] != 1) { //check if provided user is not friend and not blocked
            setTimeout(() => {
                controller.communityobject[i].addFriend(new SteamID(args[0]).getSteam3RenderedID(), (err) => {
                    if (err) logger("error", `error adding ${args[0]} with bot${i}: ${err}`) 
                        else logger("info", `Added ${args[0]} with bot${i} as friend.`)
                })

                require("../../controller/helpers/friendlist.js").friendlistcapacitycheck(i, (remaining) => { //check remaining friendlist space
                    if (remaining < 25) {
                        logger("warn", `The friendlist space of bot${i} is running low! (${remaining} remaining)`)
                    }
                });
            }, 5000 * i);
        } else {
            logger("warn", `bot${i} is already friend with ${args[0]} or the account was blocked/blocked you.`) //somehow logs steamIDs in seperate row?!
        } 
    })
}


/**
 * Runs the unfriend command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.unfriend = (chatmsg, steamID, lang, args) => {
    var SteamID    = require('steamid');
    var controller = require("../../controller/controller.js")
    
    if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
    if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

    Object.keys(controller.botobject).forEach((i) => {
        setTimeout(() => {
            controller.botobject[i].removeFriend(new SteamID(args[0])) 
        }, 1000 * i); //delay every iteration so that we don't make a ton of requests at once
    })

    chatmsg(steamID, lang.unfriendcmdsuccess.replace("profileid", args[0]))
    logger("info", `Removed friend ${args[0]} from all bot accounts.`)
}


/**
 * Runs the unfriendall command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.unfriendAll = (chatmsg, steamID, lang, args) => {
    var SteamID    = require('steamid');
    var controller = require("../../controller/controller.js")
    
    var abortunfriendall; //make eslint happy

    if (args[0] == "abort") { 
        chatmsg(steamID, lang.unfriendallcmdabort); 
        return abortunfriendall = true; 
    }
    
    abortunfriendall = false
    chatmsg(steamID, lang.unfriendallcmdpending)
    
    setTimeout(() => {
        if (abortunfriendall) return logger("info", "unfriendall process was aborted.");
        chatmsg(steamID, lang.unfriendallcmdstart)
        logger("info", "Starting to unfriend everyone...")
    
        for (let i in controller.botobject) {
            for (let friend in controller.botobject[i].myFriends) {
                try {
                    setTimeout(() => {
                        if (!config.ownerid.includes(friend)) controller.botobject[i].removeFriend(new SteamID(friend))
                    }, 1000 * i); //delay every iteration so that we don't make a ton of requests at once
                } catch (err) {
                    logger("error", `[Bot ${i}] unfriendall error unfriending ${friend}: ${err}`)
                }
            }
        }
    }, 30000);
}

