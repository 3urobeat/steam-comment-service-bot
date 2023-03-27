/*
 * File: error.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 27.03.2023 13:31:14
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const { EResult } = require("steam-user"); // Enums: https://github.com/DoctorMcKay/node-steam-user/blob/master/enums/EResult.js

const Bot = require("../bot.js");


/**
 * Handles the SteamUser error event
 */
Bot.prototype._attachSteamErrorEvent = function() {

    // Handle errors that were caused during logOn
    this.user.on("error", (err) => {

        // Custom behavior for LogonSessionReplaced error:
        if (err.eresult == EResult.LogonSessionReplaced) {
            logger("", "", true);
            logger("warn", `${logger.colors.fgred}[${this.logPrefix}] Lost connection to Steam! Reason: LogonSessionReplaced. I won't try to relog this account because someone else is using it now.`, false, false, null, true); // Force print this message now

            // Abort or skip account
            if (this.index == 0) {
                logger("error", `${logger.colors.fgred} Failed account is bot0! Aborting...`, true);
                return process.send("stop()");
            } else {
                this.controller.skippedaccounts.push(this.index);
                this.controller.skippednow.push(this.index);

                // Remove account from relogQueue if included so that the next account can try to relog itself
                if (this.controller.relogQueue.includes(this.index)) this.controller.relogQueue.splice(this.controller.relogQueue.indexOf(this.index), 1);

                // Remove account from botobject & communityobject so that it won't be used for anything anymore
                if (this.controller.bots[String(this.index)]) delete this.controller.bots[String(this.index)];
            }
            return;
        }

        // Check if this is a connection loss and not a login error (because disconnects will be thrown here when autoRelogin is false)
        if (Object.keys(this.controller.bots).includes(String(this.index)) && !this.controller.relogQueue.includes(this.index)) { // It must be a disconnect when the bot was once logged in and is not yet in the queue
            logger("info", `${logger.colors.fgred}[${this.logPrefix}] Lost connection to Steam. Reason: ${err}`);

            // Check if this is an intended logoff
            if (this.controller.relogAfterDisconnect && !this.controller.skippednow.includes(this.index)) {
                logger("info", `${logger.colors.fggreen}[${this.logPrefix}] Initiating a relog in 30 seconds.`); // Announce relog

                // Relog after waiting 30 sec
                setTimeout(() => {
                    this.relogAccount(false);
                }, 30000);
            } else {
                logger("info", `[${this.logPrefix}] I won't queue myself for a relog because this account was skipped or this is an intended logOff.`);
            }

        } else { // Actual error during login or relog

            let blockedEnumsForRetries = [EResult.Banned, EResult.AccountNotFound]; // No need to block InvalidPassword anymore as the SessionHandler handles credentials

            // Check if all logOnTries are used or if this is a fatal error
            if (this.loginData.logOnTries > this.controller.data.advancedconfig.maxLogOnRetries || blockedEnumsForRetries.includes(err.eresult)) {
                logger("", "", true);
                logger("error", `Couldn't log in bot${this.index} after ${this.loginData.logOnTries} attempt(s). ${err} (${err.eresult})`, true);

                // Add additional messages for specific errors to hopefully help the user diagnose the cause
                if (this.loginData.proxy) logger("", `        Is your proxy ${this.proxyIndex} offline or maybe blocked by Steam?`, true);

                // Abort execution if account is bot0
                if (this.index == 0) {
                    logger("", "", true);
                    logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true);
                    return process.send("stop()");

                } else { // Skip account if not bot0

                    logger("info", "Failed account is not bot0. Skipping account...", true);
                    this.controller.accisloggedin = true; // Set to true to log next account in

                    this.controller.skippedaccounts.push(this.index);
                    this.controller.skippednow.push(this.index);

                    // Remove account from relogQueue if included so that the next account can try to relog itself
                    if (this.controller.relogQueue.includes(this.index)) this.controller.relogQueue.splice(this.controller.relogQueue.indexOf(this.index), 1);

                    // Remove account from botobject & communityobject so that it won't be used for anything anymore
                    if (this.controller.bots[String(this.index)]) delete this.controller.bots[String(this.index)];
                }

            } else { // Got retries left or it is a relog...

                logger("warn", `${err} while trying to log in bot${this.index}. Retrying in 5 seconds...`); // Log error as warning

                // Invalidate token to get a new session if this error was caused by an invalid refreshToken
                if (err.eresult == EResult.InvalidPassword || err == "Error: InvalidSignature") { // These are the most likely enums that will occur when an invalid token was used I guess (Checking via String here as it seems like there are EResults missing)
                    logger("debug", "Token login error: Calling SessionHandler's _invalidateTokenInStorage() function to get a new session when retrying this login attempt");

                    this.sessionHandler.invalidateTokenInStorage();
                }

                // Call either relogAccount or logOnAccount function to continue where we started at after 5 sec
                setTimeout(() => {
                    if (this.controller.relogQueue.includes(this.index)) this.relogAccount(true); // Force relog
                        else this._loginToSteam();
                }, 5000);
            }
        }

    });

};