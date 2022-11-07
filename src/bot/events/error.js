/*
 * File: error.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 06.11.2022 16:16:42
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const { EResult } = require("steam-user"); // Enums: https://github.com/DoctorMcKay/node-steam-user/blob/master/enums/EResult.js

const controller = require("../../controller/controller.js");
const login      = require("../../controller/login.js");
const botfile    = require("../bot.js");


/**
 * Handles the error event
 * @param err The error provided by steam-user
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {String} thisproxy The proxy of the calling account
 * @param {Object} logOnOptions The steam-user logOnOptions object
 * @param {SteamUser} bot The bot instance of the calling account
 */
module.exports.run = (err, loginindex, thisbot, thisproxy, logOnOptions, bot) => {

    // Custom behavior for LogonSessionReplaced error:
    if (err.eresult == EResult.LogonSessionReplaced) {
        logger("", "", true);
        logger("warn", `${logger.colors.fgred}[${thisbot}] Lost connection to Steam! Reason: LogonSessionReplaced. I won't try to relog this account because someone else is using it now.`, false, false, null, true); // Force print this message now

        // Abort or skip account
        if (loginindex == 0) {
            logger("error", `${logger.colors.fgred} Failed account is bot0! Aborting...`, true);
            return process.send("stop()");
        } else {
            controller.skippedaccounts.push(loginindex);
            login.skippednow.push(loginindex);

            // Remove account from relogQueue if included so that the next account can try to relog itself
            if (controller.relogQueue.includes(loginindex)) controller.relogQueue.splice(controller.relogQueue.indexOf(loginindex), 1);

            // Remove account from botobject & communityobject so that it won't be used for anything anymore
            if (controller.botobject[String(loginindex)])       delete controller.botobject[String(loginindex)];
            if (controller.communityobject[String(loginindex)]) delete controller.communityobject[String(loginindex)];
        }
        return;
    }

    // Check if this is a connection loss and not a login error (because disconnects will be thrown here when autoRelogin is false)
    if (Object.keys(controller.botobject).includes(String(loginindex)) && !controller.relogQueue.includes(loginindex)) { // It must be a disconnect when the bot was once logged in and is not yet in the queue
        logger("info", `${logger.colors.fgred}[${thisbot}] Lost connection to Steam. Reason: ${err}`);

        // Check if this is an intended logoff
        if (controller.relogAfterDisconnect && !login.skippednow.includes(loginindex)) {
            logger("info", `${logger.colors.fggreen}[${thisbot}] Initiating a relog in 30 seconds.`); // Announce relog

            // Relog after waiting 30 sec
            setTimeout(() => {
                require("../helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, bot, thisproxy);
            }, 30000);
        } else {
            logger("info", `[${thisbot}] I won't queue myself for a relog because this account was skipped or this is an intended logOff.`);
        }

    } else { // Actual error during login or relog

        let blockedEnumsForRetries = [EResult.Banned, EResult.AccountNotFound]; // No need to block InvalidPassword anymore as the sessionHandler handles credentials

        // Check if all logOnTries are used or if this is a fatal error
        if (login.additionalaccinfo[loginindex].logOnTries > advancedconfig.maxLogOnRetries || blockedEnumsForRetries.includes(err.eresult)) {
            logger("", "", true);
            logger("error", `Couldn't log in bot${loginindex} after ${login.additionalaccinfo[loginindex].logOnTries} attempt(s). ${err} (${err.eresult})`, true);

            // Add additional messages for specific errors to hopefully help the user diagnose the cause
            if (thisproxy != null) logger("", `        Is your proxy ${login.proxyShift - 1} offline or maybe blocked by Steam?`, true);

            // Abort execution if account is bot0
            if (loginindex == 0) {
                logger("", "", true);
                logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true);
                return process.send("stop()");

            } else { // Skip account if not bot0

                logger("info", "Failed account is not bot0. Skipping account...", true);
                login.accisloggedin = true; // Set to true to log next account in

                controller.skippedaccounts.push(loginindex);
                login.skippednow.push(loginindex);

                // Remove account from relogQueue if included so that the next account can try to relog itself
                if (controller.relogQueue.includes(loginindex)) controller.relogQueue.splice(controller.relogQueue.indexOf(loginindex), 1);

                // Remove account from botobject & communityobject so that it won't be used for anything anymore
                if (controller.botobject[String(loginindex)])       delete controller.botobject[String(loginindex)];
                if (controller.communityobject[String(loginindex)]) delete controller.communityobject[String(loginindex)];
            }

        } else { // Got retries left or it is a relog...

            logger("warn", `${err} while trying to log in bot${loginindex}. Retrying in 5 seconds...`); // Log error as warning

            // Invalidate token to get a new session if this error was caused by an invalid refreshToken
            if (err.eresult == EResult.InvalidPassword || err == "Error: InvalidSignature") { // These are the most likely enums that will occur when an invalid token was used I guess (Checking via String here as it seems like there are EResults missing)
                logger("debug", "Token login error: Calling tokenStorageHandler's _invalidateTokenInStorage() function to get a new session when retrying this login attempt");

                let nedb = require("@seald-io/nedb");
                let tokensdb = new nedb({ filename: srcdir + "/data/tokens.db", autoload: true });

                require("../../sessions/helpers/tokenStorageHandler.js").invalidateTokenInStorage(tokensdb, thisbot, logOnOptions.accountName);
            }

            // Call either relogAccount or logOnAccount function to continue where we started at after 5 sec
            setTimeout(() => {
                if (controller.relogQueue.includes(loginindex)) require("../helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, bot, thisproxy, true); // Force relog with last param
                    else botfile.logOnAccount();
            }, 5000);
        }
    }
};