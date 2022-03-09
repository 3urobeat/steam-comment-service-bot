/*
 * File: block.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 09.03.2022 15:30:42
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamID = require("steamid");

const controller             = require("../../controller/controller.js")
const handleSteamIdResolving = require("../helpers/handleSteamIdResolving.js");


/**
 * Runs the block command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.block = (chatmsg, steamID, lang, args) => {
    if (!args[0]) return chatmsg(steamID, lang.invalidprofileid);

    handleSteamIdResolving.run(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
        if (err) return chatmsg(steamID, lang.invalidprofileid + "\n\nError: " + err);
        if (cachefile.ownerid.includes(res)) return chatmsg(steamID, lang.idisownererror)

        Object.keys(controller.botobject).forEach((i) => {
            controller.botobject[i].blockUser(new SteamID(res), err => { if (err) logger("error", `[Bot ${i}] error blocking user ${args[0]}: ${err}`) }) 
        })

        chatmsg(steamID, lang.blockcmdsuccess.replace("profileid", res))
        logger("info", `Blocked ${res} with all bot accounts.`)
    })
}


/**
 * Runs the unblock command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.unblock = (chatmsg, steamID, lang, args) => {
    if (!args[0]) return chatmsg(steamID, lang.invalidprofileid);

    handleSteamIdResolving.run(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
        if (err) return chatmsg(steamID, lang.invalidprofileid + "\n\nError: " + err);

        Object.keys(controller.botobject).forEach((i) => {
            controller.botobject[i].unblockUser(new SteamID(res), err => { if (err) logger("error", `[Bot ${i}] error unblocking user ${res}: ${err}`) }) 
        })

        chatmsg(steamID, lang.unblockcmdsuccess.replace("profileid", res))
        logger("info", `Unblocked ${res} with all bot accounts.`)
    })
}