/*
 * File: handleLoginTimeout.js
 * Project: steam-comment-service-bot
 * Created Date: 03.11.2022 12:27:46
 * Author: 3urobeat
 *
 * Last Modified: 21.03.2023 01:12:21
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const controller = require("../../controller/controller.js");
const login      = require("../../controller/login.js");


/**
 * Handles force progressing the relog queue should an account get stuck while trying to log in to prevent the bot from softlocking (see issue #139)
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {Object} logOnOptions The steam-user logOnOptions object
 * @param {SteamUser} bot The bot instance of the calling account
 */
module.exports.handleLoginTimeout = (loginindex, thisbot, logOnOptions, bot) => {
    // Ignore if login timeout handler is disabled in advancedconfig
    if (advancedconfig.loginTimeout == 0) {
        logger("debug", `handleLoginTimeout(): Ignoring timeout attach request for bot${loginindex} because loginTimeout is disabled in advancedconfig!`);
        return;
    }

    let currentLogOnTry = login.additionalaccinfo[loginindex].logOnTries;

    logger("debug", `handleLoginTimeout(): Attached ${advancedconfig.loginTimeout / 1000} seconds timeout for bot${loginindex}...`);

    // Check if account is still in relogQueue with the same logOnTries value 60 seconds later and force progress
    setTimeout(() => {

        // Ignore timeout if account progressed since then
        let newLogOnTry = login.additionalaccinfo[loginindex].logOnTries;
        let accInQueue  = controller.relogQueue.includes(loginindex);

        if (currentLogOnTry != newLogOnTry || !accInQueue) {
            logger("debug", `[${thisbot}] handleLoginTimeout(): Timeout for bot${loginindex} done, acc not stuck. old/new logOnTries: ${currentLogOnTry}/${newLogOnTry} - acc in relogQueue: ${accInQueue}`);
            return;
        }

        // Check if all logOnRetries are used up and skip account
        if (login.additionalaccinfo[loginindex].logOnTries > advancedconfig.maxLogOnRetries) {
            logger("", "", true);
            logger("error", `Couldn't log in bot${loginindex} after ${login.additionalaccinfo[loginindex].logOnTries} attempt(s). Error: Login attempt timed out and all available logOnRetries were used.`, true);

            // Add additional messages for specific errors to hopefully help the user diagnose the cause
            if (logOnOptions.proxy != null) logger("", `        Is your proxy ${login.proxyShift - 1} offline or maybe blocked by Steam?`, true);

            // Abort execution if account is bot0
            if (loginindex == 0) {
                logger("", "", true);
                logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease wait a moment and start the bot again.", true);
                return process.send("stop()");

            } else { // Skip account if not bot0

                logger("info", "Failed account is not bot0. Skipping account...", true);

                controller.skippedaccounts.push(loginindex);
                login.skippednow.push(loginindex);

                // Remove account from relogQueue if included so that the next account can try to relog itself
                if (controller.relogQueue.includes(loginindex)) controller.relogQueue.splice(controller.relogQueue.indexOf(loginindex), 1);

                // Remove account from botobject & communityobject so that it won't be used for anything anymore
                if (controller.botobject[String(loginindex)])       delete controller.botobject[String(loginindex)];
                if (controller.communityobject[String(loginindex)]) delete controller.communityobject[String(loginindex)];
            }

        } else {

            // Force progress if account is stuck
            logger("warn", `Detected timed out login attempt for bot${loginindex}! Force progressing relog queue to avoid soft-locking the bot...`);

            bot.logOff(); // Call logOff() just to be sure

            require("../helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, bot, true); // Force relog with last param
        }

    }, advancedconfig.loginTimeout);

};