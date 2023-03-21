/*
 * File: relogAccount.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 21.03.2023 01:11:55
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamTotp  = require("steam-totp");

const controller = require("../../controller/controller.js");
const login      = require("../../controller/login.js");


/**
 * Function to regulate automatic relogging and delay it to avoid issues
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {Object} logOnOptions The steam-user logOnOptions object
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {Boolean} force Forces an relog even if the account is already in relogQueue (important for steam-user error event while relog)
 */
module.exports.run = (loginindex, thisbot, logOnOptions, bot, force) => {

    // Relog account if it is not already waiting in relogQueue or if force is true
    if (!controller.relogQueue.includes(loginindex) || force) {
        if (!controller.relogQueue.includes(loginindex)) { // Really only do these few calls if acc is not in relogQeue, even if force is true
            controller.relogQueue.push(loginindex);

            login.additionalaccinfo[loginindex].logOnTries = 0; // Reset logOnTries

            logger("info", `[${thisbot}] Queueing for a relog. ${controller.relogQueue.length - 1} other accounts are waiting...`, false, true);
        }

        logger("debug", `relogAccount.run(): Attaching relogInterval for bot${loginindex}. Param force is ${force}.`);

        // Check every second if this account is now allowed to relog
        var relogInterval = setInterval(() => {
            if (controller.relogQueue.indexOf(loginindex) != 0) return; // Not our turn? stop and retry in the next iteration

            clearInterval(relogInterval); // Prevent any retries
            bot.logOff();

            logger("info", `[${thisbot}] It is now my turn. Waiting ${advancedconfig.loginDelay / 1000} seconds before attempting to relog...`, false, true, logger.animation("waiting"));

            // Generate steam guard code again if user provided a shared_secret
            if (logOnOptions["steamGuardCodeForRelog"]) {
                logger("debug", `[${thisbot}] Found shared_secret in logOnOptions! Regenerating AuthCode and adding it to logOnOptions...`);

                logOnOptions["steamGuardCode"] = SteamTotp.generateAuthCode(logOnOptions["steamGuardCodeForRelog"]);
            }

            // Attach relogdelay timeout
            setTimeout(async () => {
                login.additionalaccinfo[loginindex].logOnTries++; // Count login attempt

                if (logOnOptions.proxy == null) logger("info", `[${thisbot}] Trying to relog without proxy... (Attempt ${login.additionalaccinfo[loginindex].logOnTries}/${advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));
                    else logger("info", `[${thisbot}] Trying to relog with proxy ${login.additionalaccinfo[loginindex].proxyIndex}... (Attempt ${login.additionalaccinfo[loginindex].logOnTries}/${advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));

                // Call unresponsive login helper to detect and force progress if this login attempt should get stuck
                require("./handleLoginTimeout.js").handleLoginTimeout(loginindex, thisbot, logOnOptions, bot);

                // Call our steam-session helper to get a valid refresh token for us
                let sessionHandler = require(srcdir + "/sessions/sessionHandler.js");
                let session = new sessionHandler(bot, thisbot, loginindex, logOnOptions);

                let refreshToken = await session.getToken();
                if (!refreshToken) return; // Stop execution if getRefreshToken aborted login attempt, it either skipped this account or stopped the bot itself

                // Login with this account using the refreshToken we just obtained using steam-session
                bot.logOn({ "refreshToken": refreshToken });
            }, advancedconfig.loginDelay);
        }, 1000);
    } else {
        logger("debug", `relogAccount.run(): bot${loginindex} is already in relogQueue, ignoring request...`);
    }
};