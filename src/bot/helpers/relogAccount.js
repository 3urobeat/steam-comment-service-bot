/*
 * File: relogAccount.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 27.02.2022 11:57:07
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Function to regulate automatic relogging and delay it to avoid issues
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {Object} logOnOptions The steam-user logOnOptions object
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {String} thisproxy The proxy of the calling account
 */
module.exports.run = (loginindex, thisbot, logOnOptions, bot, thisproxy) => {
    var controller = require("../../controller/controller.js")
    var login      = require("../../controller/login.js")

    var relogdelay = 5000 //time to wait between relog attempts (for example after loosing connection to Steam)


    if (!controller.relogQueue.includes(loginindex)) {
        controller.relogQueue.push(loginindex)

        login.additionalaccinfo[loginindex].logOnTries = 0; //reset logOnTries

        logger("info", `[${thisbot}] Queueing for a relog. ${controller.relogQueue.length - 1} other accounts are waiting...`, false, true)
    }

    logger("debug", "relogAccount.run(): Attaching relogInterval for bot" + loginindex)

    var relogInterval = setInterval(() => {
        if (controller.relogQueue.indexOf(loginindex) != 0) return; //not our turn? stop and retry in the next iteration

        clearInterval(relogInterval) //prevent any retries
        bot.logOff()

        logger("info", `[${thisbot}] It is now my turn. Waiting ${relogdelay / 1000} seconds before attempting to relog...`, false, true, logger.animation("waiting"))

        setTimeout(() => {
            if (thisproxy == null) logger("info", `[${thisbot}] Trying to relog without proxy...`, false, true, logger.animation("loading"))
                else logger("info", `[${thisbot}] Trying to relog with proxy ${login.proxyShift - 1}...`, false, true, logger.animation("loading"))
            
            bot.logOn(logOnOptions)
        }, relogdelay);
    }, 1000);
}