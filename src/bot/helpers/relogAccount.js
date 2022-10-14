/*
 * File: relogAccount.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 13.10.2022 14:33:30
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
    var SteamTotp  = require('steam-totp');
    
    var controller = require("../../controller/controller.js")
    var login      = require("../../controller/login.js")

    //Push account to queue if acc is not already waiting
    if (!controller.relogQueue.includes(loginindex)) {
        controller.relogQueue.push(loginindex)

        login.additionalaccinfo[loginindex].logOnTries = 0; //reset logOnTries

        logger("info", `[${thisbot}] Queueing for a relog. ${controller.relogQueue.length - 1} other accounts are waiting...`, false, true)
    }

    logger("debug", "relogAccount.run(): Attaching relogInterval for bot" + loginindex)

    //Check every second if this account is now allowed to relog
    var relogInterval = setInterval(() => {
        if (controller.relogQueue.indexOf(loginindex) != 0) return; //not our turn? stop and retry in the next iteration

        clearInterval(relogInterval) //prevent any retries
        bot.logOff()

        logger("info", `[${thisbot}] It is now my turn. Waiting ${advancedconfig.loginDelay / 1000} seconds before attempting to relog...`, false, true, logger.animation("waiting"))

        //Generate steam guard code again if user provided a shared_secret
        if (logOnOptions["steamGuardCodeForRelog"]) {
            logger("debug", `[${thisbot}] Found shared_secret in logOnOptions! Regenerating AuthCode and adding it to logOnOptions...`)

            logOnOptions["steamGuardCode"] = SteamTotp.generateAuthCode(logOnOptions["steamGuardCodeForRelog"]);
        }

        //Attach relogdelay timeout
        setTimeout(async () => {
            if (thisproxy == null) logger("info", `[${thisbot}] Trying to relog without proxy...`, false, true, logger.animation("loading"))
                else logger("info", `[${thisbot}] Trying to relog with proxy ${login.additionalaccinfo[loginindex].thisproxyindex}...`, false, true, logger.animation("loading"))
            
            // Call our steam-session helper to get a valid refresh token for us
            let sessionHandler = require(srcdir + "/sessions/sessionHandler.js");
            let session = new sessionHandler(bot, thisbot, loginindex, logOnOptions);

            let refreshToken = await session.getToken();
            if (!refreshToken) return; // Stop execution if getRefreshToken aborted login attempt, it either skipped this account or stopped the bot itself
            
            // Login with this account using the refreshToken we just obtained using steam-session
            bot.logOn({ "refreshToken": refreshToken });
        }, advancedconfig.loginDelay);
    }, 1000);
}