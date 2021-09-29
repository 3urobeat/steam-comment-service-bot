/*
 * File: relationship.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 17:50:16
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Accepts a friend request, adds the user to the lastcomment.db database and invites him to your group
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {SteamUser} bot The bot instance of the calling account
 * @param steamID The steamID object provided by the steam-user event
 * @param relationship The realtionship enum provided by the steam-user event
 */
module.exports.friendRelationship = (loginindex, thisbot, bot, steamID, relationship) => {
    var SteamID = require("steamid")

    var mainfile   = require("../main.js")
    var controller = require("../../controller/controller.js")


    if (relationship == 2) {

        //Accept friend request
        bot.addFriend(steamID);


        //Log message and send welcome message
        logger("info", `[${thisbot}] Added User: ` + new SteamID(String(steamID)).getSteamID64())

        if (loginindex == 0) {
            controller.botobject[0].chat.sendFriendMessage(steamID, mainfile.lang.useradded) 
        }


        //Add user to lastcomment database
        let lastcommentobj = {
            id: new SteamID(String(steamID)).getSteamID64(),
            time: Date.now() - (config.commentcooldown * 60000) //subtract commentcooldown so that the user is able to use the command instantly
        }

        controller.lastcomment.remove({ id: new SteamID(String(steamID)).getSteamID64() }, {}, (err) => { if (err) logger("error", "Error removing duplicate steamid from lastcomment.db on friendRelationship! Error: " + err) }) //remove any old entries
        controller.lastcomment.insert(lastcommentobj, (err) => { if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err) })


        //Invite user to yourgroup (and to my to make some stonks)
        if (loginindex == 0 && mainfile.configgroup64id && Object.keys(bot.myGroups).includes(mainfile.configgroup64id)) { 
            bot.inviteToGroup(steamID, new SteamID(mainfile.configgroup64id)); //invite the user to your group
            
            if (mainfile.configgroup64id != "103582791464712227") { //https://steamcommunity.com/groups/3urobeatGroup
                bot.inviteToGroup(steamID, new SteamID("103582791464712227")); 
            } 
        }


        //check remaining friendlist space
        require("../../controller/helpers/friendlist.js").friendlistcapacitycheck(loginindex, (remaining) => {
            if (remaining < 25) {
                logger("warn", `The friendlist space of bot${loginindex} is running low! (${remaining} remaining)`)
            }
        })
    }
}



/**
 * Accepts a group invite if acceptgroupinvites in the config is true
 * @param {String} thisbot The thisbot string of the calling account
 * @param {SteamUser} bot The bot instance of the calling account
 * @param steamID The steamID object provided by the steam-user event
 * @param relationship The realtionship enum provided by the steam-user event
 */
module.exports.groupRelationship = (thisbot, bot, steamID, relationship) => {
    var SteamID = require("steamid")
    

    if (relationship == 2 && config.acceptgroupinvites) { //accept invite if acceptgroupinvites is true
        bot.respondToGroupInvite(steamID, true)

        logger("info", `[${thisbot}] Accepted group invite: ` + new SteamID(String(steamID)).getSteamID64())
    }
}

