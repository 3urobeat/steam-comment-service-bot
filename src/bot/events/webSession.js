/*
 * File: webSession.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 17:49:33
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Handles setting cookies and accepting offline friend & group invites
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {SteamCommunity} community The bot instance of the calling account
 * @param cookies The cookies parameter provided by the webSession event
 */
module.exports.run = (loginindex, thisbot, bot, community, cookies) => {
    var SteamID    = require("steamid")

    var controller = require("../../controller/controller.js")
    var mainfile   = require("../main.js")
    var login      = require("../../controller/login.js")


    //Set cookies (otherwise the bot is unable to comment)
    community.setCookies(cookies) 

    login.accisloggedin = true; //set to true to log next account in


    //Accept offline group & friend invites
    logger("info", `[${thisbot}] Got websession and set cookies.`, false, true, logger.animation("loading"))

    //If this is a relog then remove this account from the queue and let the next account be able to relog
    if (controller.relogQueue.includes(loginindex)) {
        logger("info", `[${thisbot}] Relog successful.`)

        controller.relogQueue.splice(controller.relogQueue.indexOf(loginindex), 1) //remove this loginindex from the queue
    }


    /* ------------ Accept offline friend and group invites/requests: ------------ */
    logger("info", `[${thisbot}] Accepting offline friend & group invites...`, false, true, logger.animation("loading"))

    //Friends:
    for (let i = 0; i < Object.keys(bot.myFriends).length; i++) { //Credit: https://dev.doctormckay.com/topic/1694-accept-friend-request-sent-in-offline/  
        if (bot.myFriends[Object.keys(bot.myFriends)[i]] == 2) {

            //Accept friend request
            bot.addFriend(Object.keys(bot.myFriends)[i]);


            //Log message and send welcome message
            logger("info", `[${thisbot}] Added user while I was offline! User: ` + Object.keys(bot.myFriends)[i])
            controller.botobject[0].chat.sendFriendMessage(String(Object.keys(bot.myFriends)[i]), mainfile.lang.useradded)


            //Add user to lastcomment database
            let lastcommentobj = {
                id: Object.keys(bot.myFriends)[i],
                time: Date.now() - (config.commentcooldown * 60000) //subtract commentcooldown so that the user is able to use the command instantly
            }

            controller.lastcomment.remove({ id: Object.keys(bot.myFriends)[i] }, {}, (err) => { if (err) logger("error", "Error removing duplicate steamid from lastcomment.db on offline friend accept! Error: " + err) }) //remove any old entries
            controller.lastcomment.insert(lastcommentobj, (err) => { if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err) })


            //Invite user to yourgroup (and to my to make some stonks)
            if (mainfile.configgroup64id && Object.keys(bot.myGroups).includes(mainfile.configgroup64id)) { 
                bot.inviteToGroup(Object.keys(bot.myFriends)[i], new SteamID(mainfile.configgroup64id));

                if (mainfile.configgroup64id !== "103582791464712227") { //https://steamcommunity.com/groups/3urobeatGroup
                    bot.inviteToGroup(Object.keys(bot.myFriends)[i], new SteamID("103582791464712227"));
                }
            }
        } 
    }

    //Groups:
    for (let i = 0; i < Object.keys(bot.myGroups).length; i++) {
        if (bot.myGroups[Object.keys(bot.myGroups)[i]] == 2) {

            if (config.acceptgroupinvites !== true) { //check if group accept is false
                if (config.botsgroup.length < 1) return; 

                if (Object.keys(bot.myGroups)[i] !== config.botsgroup) return; //check if group id is bot group
            }

            //Accept invite and log message
            bot.respondToGroupInvite(Object.keys(bot.myGroups)[i], true)
            logger("info", `[${thisbot}] Accepted group invite while I was offline: ` + Object.keys(bot.myGroups)[i])
        }
    }
}