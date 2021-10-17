/*
 * File: disconnected.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 17:51:33
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Handles the disconnect event and tries to relog the accout
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {String} msg The msg parameter of the steam-user disconnected event
 */
module.exports.run = (loginindex, thisbot, logOnOptions, bot, thisproxy, msg) => {
    var controller = require("../../controller/controller.js")
    var login      = require("../../controller/login.js")


    if (!controller.relogQueue) return; //Don't even try to check anything when cache of controller was already cleared (for example by restart function)
    if (controller.relogQueue.includes(loginindex)) return; //disconnect is already handled

    logger("info", `\x1b[31m[${thisbot}] Lost connection to Steam. Message: ${msg} | Check: https://steamstat.us\x1b[0m`)

    if (!login.skippednow.includes(loginindex) && controller.relogAfterDisconnect) { //bot.logOff() also calls this event with NoConnection. To ensure the relog function doesn't call itself again here we better check if the account is already being relogged
        logger("info", `\x1b[32m[${thisbot}] Initiating a relog in 30 seconds.\x1b[0m`) //Announce relog

        setTimeout(() => {
            require("../helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, bot, thisproxy)
        }, 30000);
    } else {
        logger("info", `[${thisbot}] I won't queue myself for a relog because this account is either already being relogged, was skipped or this is an intended logOff.`)
    }
}
