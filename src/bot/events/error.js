/*
 * File: error.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2024-03-08 17:44:50
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2024 3urobeat <https://github.com/3urobeat>
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

        // Custom behavior for LogonSessionReplaced error
        if (err.eresult == EResult.LogonSessionReplaced) {
            logger("", "", true);
            logger("warn", `${logger.colors.fgred}[${this.logPrefix}] Lost connection to Steam! Reason: 'Error: LogonSessionReplaced'. I won't try to relog this account because someone else is using it now.`, false, false, null, true); // Force print this message now

            // Abort or skip account. No need to attach handleRelog() here
            if (this.index == 0) {
                logger("error", `${logger.colors.fgred}Failed account is bot0! Aborting...`, true);
                return this.controller.stop();
            } else {
                this.controller.info.skippedaccounts.push(this.loginData.logOnOptions.accountName);

                // Set status to error so it won't be used for anything anymore
                this.controller._statusUpdateEvent(this, Bot.EStatus.ERROR);
            }

            return;
        }

        // Check if this is a connection loss and not a login error (because disconnects are thrown here when SteamUser's autoRelogin is false)
        if (this.status == Bot.EStatus.ONLINE) { // It must be a fresh connection loss if status has not changed yet
            this.controller._statusUpdateEvent(this, Bot.EStatus.OFFLINE); // Set status of this account to offline

            // Store disconnect timestamp & reason
            this.lastDisconnect.timestamp = Date.now();
            this.lastDisconnect.reason    = err;

            // Check if this is an intended logoff
            if (this.controller.info.relogAfterDisconnect && !this.controller.info.skippedaccounts.includes(this.loginData.logOnOptions.accountName)) {
                logger("info", `${logger.colors.fgred}[${this.logPrefix}] Lost connection to Steam: '${err}'. Initiating a login retry in ${this.controller.data.advancedconfig.loginRetryTimeout / 1000} seconds.`); // Announce relog

                setTimeout(() => this.controller.login(), this.controller.data.advancedconfig.loginRetryTimeout); // Relog after waiting loginRetryTimeout ms
            } else {
                logger("info", `${logger.colors.fgred}[${this.logPrefix}] Lost connection to Steam: '${err}'. I won't queue for a relog because this account was skipped or this is an intended logOff.`);
            }

        } else { // Actual error during login

            // Unlock login, but only if not already done by loginTimeout handler to prevent duplicate login requests
            if (!this.loginData.pendingLogin) return logger("debug", `[${this.logPrefix}] Won't handle this login error because 'pendingLogin' is already 'false'; handleLoginTimeout must already have taken action`);

            this.loginData.pendingLogin = false;


            // Check if all logOnTries are used or if this is a fatal error
            let blockedEnumsForRetries = [EResult.Banned, EResult.AccountNotFound]; // No need to block InvalidPassword anymore as the SessionHandler handles credentials

            if (this.loginData.logOnTries > this.controller.data.advancedconfig.maxLogOnRetries || blockedEnumsForRetries.includes(err.eresult)) {
                logger("error", `Couldn't log in bot${this.index} after ${this.loginData.logOnTries} attempt(s). ${err} (${err.eresult})`);

                // Abort if bot0 failed on initial login or skip account for now
                if (this.index == 0 && this.controller.info.readyAfter == 0) {
                    logger("", "", true);
                    logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true);
                    return this.controller.stop();

                } else {

                    this.controller._statusUpdateEvent(this, Bot.EStatus.ERROR);
                    this.handleRelog();
                }

            } else { // Got retries left or it is a relog...

                // Invalidate token to get a new session if this error was caused by an invalid refreshToken
                if (err.eresult == EResult.InvalidPassword || err.eresult == EResult.AccessDenied || err == "Error: InvalidSignature") { // These are the most likely enums that will occur when an invalid token was used I guess (Checking via String here as it seems like there are EResults missing)
                    logger("debug", "Token login error: Calling SessionHandler's _invalidateTokenInStorage() function to get a new session when retrying this login attempt");

                    logger("warn", `[${this.logPrefix}] ${err} - This is usually caused by an invalid session. Deleting login token, please re-submit your Steam Guard code after the current login queue has been processed.`, false, false, null, true); // Force print this message now

                    this.sessionHandler.invalidateTokenInStorage();

                    // Set status to POSTPONED to transfer acc to the slowQueue which will be picked up in the next login() request (login() calls itself after being done with the current queue)
                    this.controller._statusUpdateEvent(this, Bot.EStatus.POSTPONED);

                } else {

                    logger("warn", `[${this.logPrefix}] '${err}' while trying to log in. Retrying in 5 seconds...`, false, false, null, true); // Log error as warning

                    // Try again in 5 sec, Controller's login function waits for any status that is not offline
                    setTimeout(() => this._loginToSteam(), 5000);
                }
            }
        }

    });

};
