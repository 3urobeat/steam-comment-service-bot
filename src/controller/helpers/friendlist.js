/*
 * File: friendlist.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 27.02.2022 11:51:44
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Check if all friends are in lastcomment database
 * @param {SteamUser} botacc The bot instance of the calling account
 */
module.exports.checklastcommentdb = (bot) => {
    var controller = require("../../controller/controller.js")

    logger("info", "Checking if all friends are in lastcomment.db...", false, true, logger.animation("loading"))
    
    controller.lastcomment.find({}, (err, docs) => {
        Object.keys(bot.myFriends).forEach(e => {

            if (bot.myFriends[e] == 3 && !docs.find(el => el.id == e)) {
                logger("info", `Inserting ${e} into lastcomment.db...`, false, true)

                var lastcommentobj = {
                    id: e,
                    time: Date.now() - (config.commentcooldown * 60000) //subtract commentcooldown so that the user is able to use the command instantly
                }

                controller.lastcomment.insert(lastcommentobj, (err) => { 
                    if (err) logger("error", "Error inserting existing user into lastcomment.db database! Error: " + err) 
                })
            }
        })
    })
}


/**
 * Checks the remaining space on the friendlist of a bot account and sends a warning message if it is less than 10.
 * @param {Number} loginindex The index of the bot account to be checked
 * @param {function} [callback] Called with `remaining` (Number) on completion
 */
module.exports.friendlistcapacitycheck = (loginindex, callback) => {
    var controller = require("../controller.js")

    try {
        logger("debug", "friendlistcapacitycheck(): Calculating friendlist capacity of bot" + loginindex)

        controller.botobject[0].getSteamLevels([controller.botobject[loginindex].steamID], (err, users) => { //check steam level of botindex account with bot0
            if (!users) return; //users was undefined one time (I hope this will (hopefully) supress an error?)

            let friendlistlimit = Object.values(users)[0] * 5 + 250 //Profile Level * 5 + 250
            let friends = Object.values(controller.botobject[loginindex].myFriends)
            let friendsamount = friends.length - friends.filter(val => val == 0).length - friends.filter(val => val == 5).length //Subtract friend enums 0 & 5

            let remaining = friendlistlimit - friendsamount

            logger("debug", `friendlistcapacitycheck(): bot${loginindex} has ${friendsamount}/${friendlistlimit} friends`)
            
            if (remaining < 0) callback(null); //stop if number is negative somehow - maybe when bot profile is private?
                else callback(remaining)
        })
    } catch (err) {
        logger("error", `Failed to check friendlist space for bot${loginindex}. Error: ${err}`) 
        callback(null);
    }
}


/**
 * Check for friends who haven't requested comments in config.unfriendtime days and unfriend them
 */
module.exports.lastcommentUnfriendCheck = () => {
    var SteamID    = require("steamid")
    var controller = require("../../controller/controller.js")

    controller.lastcomment.find({ time: { $lte: Date.now() - (config.unfriendtime * 86400000) } }, (err, docs) => { //until is a date in ms, so we check if it is less than right now
        if (docs.length < 1) return; //nothing found

        docs.forEach((e, i) => { //take action for all results
            setTimeout(() => {

                Object.keys(controller.botobject).forEach((f, j) => {
                    if (controller.botobject[f].myFriends[e.id] == 3 && !config.ownerid.includes(e.id)) { //check if the targeted user is still friend
                        if (j == 0) controller.botobject[0].chat.sendFriendMessage(new SteamID(e.id), `You have been unfriended for being inactive for ${config.unfriendtime} days.\nIf you need me again, feel free to add me again!`)

                        setTimeout(() => {
                            controller.botobject[f].removeFriend(new SteamID(e.id)) //unfriend user with each bot
                            logger("info", `[Bot ${j}] Unfriended ${e.id} after ${config.unfriendtime} days of inactivity.`)
                        }, 1000 * j); //delay every iteration so that we don't make a ton of requests at once (IP)
                    }
                    
                    if (!config.ownerid.includes(e.id)) controller.lastcomment.remove({ id: e.id }) //entry gets removed no matter what but we are nice and let the owner stay. Thank me later! <3
                })
                
            }, 1000 * i); //delay every iteration so that we don't make a ton of requests at once (account)
            
        })                
    })
}
