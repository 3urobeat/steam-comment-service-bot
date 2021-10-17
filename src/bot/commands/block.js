/*
 * File: block.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 17:53:35
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Runs the block command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.block = (chatmsg, steamID, lang, args) => {
    var SteamID    = require("steamid")
    var controller = require("../../controller/controller.js")

    if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
    if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

    Object.keys(controller.botobject).forEach((i) => {
        controller.botobject[i].blockUser(new SteamID(args[0]), err => { if (err) logger("error", `[Bot ${i}] error blocking user ${args[0]}: ${err}`) }) 
    })

    chatmsg(steamID, lang.blockcmdsuccess.replace("profileid", args[0]))
    logger("info", `Blocked ${args[0]} with all bot accounts.`)
}


/**
 * Runs the unblock command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.unblock = (chatmsg, steamID, lang, args) => {
    var SteamID    = require("steamid")
    var controller = require("../../controller/controller.js")

    if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
    if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

    Object.keys(controller.botobject).forEach((i) => {
        if (controller.botobject[i].myFriends[new SteamID(args[0])] === 1) {
            controller.botobject[i].unblockUser(new SteamID(args[0]), err => { if (err) logger("error", `[Bot ${i}] error blocking user ${args[0]}: ${err}`) }) 
        }
    })

    chatmsg(steamID, lang.unblockcmdsuccess.replace("profileid", args[0]))
    logger("info", `Unblocked ${args[0]} with all bot accounts.`)
}