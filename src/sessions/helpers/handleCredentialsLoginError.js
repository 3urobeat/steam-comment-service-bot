/*
 * File: handleCredentialsLoginError.js
 * Project: steam-comment-service-bot
 * Created Date: 2022-10-09 13:22:39
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 17:21:15
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const { EResult } = require("steam-session");
const SessionHandler = require("../sessionHandler.js");


/**
 * Helper function to make handling login errors easier
 * @private
 * @param {*} err Error thrown by startWithCredentials()
 */
SessionHandler.prototype._handleCredentialsLoginError = function(err) {

    // Define a few enums on which we won't bother to relog
    const blockedEnumsForRetries = [EResult.InvalidPassword, EResult.LoggedInElsewhere, EResult.InvalidName, EResult.InvalidEmail, EResult.Banned, EResult.AccountNotFound, EResult.AccountLoginDeniedThrottle, EResult.RateLimitExceeded];

    // Check if this is a blocked enum or if all retries are used
    if (this.bot.loginData.logOnTries > this.controller.data.advancedconfig.maxLogOnRetries || blockedEnumsForRetries.includes(err.eresult)) { // Skip account

        // Log error message
        logger("", "", true);
        logger("error", `[${this.bot.logPrefix}] Couldn't log in '${this.logOnOptions.accountName}' after ${this.bot.loginData.logOnTries} attempt(s). '${err}' (${err.eresult})`, true);
        logger("debug", err.stack, true);

        // Add additional messages for specific errors to hopefully help the user diagnose the cause
        if (err.eresult == EResult.InvalidPassword) logger("", `Note: The error "InvalidPassword" (${err.eresult}) can also be caused by a wrong Username or shared_secret!\n      Try omitting the shared_secret (if you provided one) and check the username & password of '${this.logOnOptions.accountName}' in account.txt!`, true);

        // Skips account or stops bot, depending on which loginindex this is
        this._resolvePromise(null);

    } else { // Attempt another login

        // Log warning message
        logger("warn", `[${this.bot.logPrefix}] '${err}' while trying to get a new session for '${this.logOnOptions.accountName}' using login credentials. Retrying login in 5 seconds...`);
        logger("debug", err.stack, true);

        // Count next login attempt
        this.bot.loginData.logOnTries++;

        this.session.cancelLoginAttempt(); // Cancel this login attempt just to be sure

        // Call _attemptCredentialsLogin() again after 5 seconds
        setTimeout(() => {
            // Log login log message again with incremented logOnTries as otherwise this retry would go unnoticed in the output
            if (!this.bot.loginData.proxy) logger("info", `[${this.bot.logPrefix}] Trying to log in without proxy... (Attempt ${this.bot.loginData.logOnTries}/${this.controller.data.advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));
                else logger("info", `[${this.bot.logPrefix}] Trying to log in with proxy ${this.bot.loginData.proxyIndex}... (Attempt ${this.bot.loginData.logOnTries}/${this.controller.data.advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));

            this._attemptCredentialsLogin();
        }, 5000);

    }
};


/**
 * Helper function to make handling login errors easier
 * @private
 * @param {*} err Error thrown by startWithQR()
 */
SessionHandler.prototype._handleQrCodeLoginError = function(err) {

    logger("error", `[${this.thisbot}] Failed to start a QR-Code session! Are you having connectivity issues to Steam? ${err}`);
    logger("debug", err.stack, true);

    this._resolvePromise(null); // Skips account. I don't think we need to care about retries here

};
