/*
 * File: handleCredentialsLoginError.js
 * Project: steam-comment-service-bot
 * Created Date: 09.10.2022 13:22:39
 * Author: 3urobeat
 *
 * Last Modified: 13.10.2022 14:17:56
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const { EResult } = require("steam-session");
const sessionHandler = require("../sessionHandler.js");


// Helper function to make handling login errors easier
sessionHandler.prototype._handleCredentialsLoginError = function(err) {

    // Define a few enums on which we won't bother to relog
    let blockedEnumsForRetries = [EResult.InvalidPassword, EResult.LoggedInElsewhere, EResult.InvalidName, EResult.InvalidEmail, EResult.Banned, EResult.AccountNotFound];

    // Check if this is a blocked enum or if all retries are used
    if (this.additionalaccinfo.logOnTries > advancedconfig.maxLogOnRetries || blockedEnumsForRetries.includes(err.eresult)) { // Skip account

        // Log error message
        logger("", "", true);
        logger("error", `[${this.thisbot}] Couldn't log in '${this.logOnOptions.accountName}' after ${this.additionalaccinfo.logOnTries} attempt(s). ${err} (${err.eresult})`, true);

        // Add additional messages for specific errors to hopefully help the user diagnose the cause
        if (err.eresult == EResult.InvalidPassword) logger("", `Note: The error "InvalidPassword" (${err.eresult}) can also be caused by a wrong Username or shared_secret!\n      Try leaving the shared_secret field empty and check the username & password of bot${this.loginindex}.`, true);

        // Skips account or stops bot, depending on which loginindex this is
        this._resolvePromise(null);

    } else { // Attempt another login

        // Log warning message
        logger("warn", `[${this.thisbot}] ${err} while trying to get a new session for '${this.logOnOptions.accountName}' using login credentials. Retrying login in 5 seconds...`);

        // Count next login attempt
        this.additionalaccinfo.logOnTries++;

        this.session.cancelLoginAttempt(); // Cancel this login attempt just to be sure

        // Call _attemptCredentialsLogin() again after 5 seconds
        setTimeout(() => {
            // Log login log message again with incremented logOnTries as otherwise this retry would go unnoticed in the output
            if (!this.additionalaccinfo.thisproxy) logger("info", `[${this.thisbot}] Trying to log in without proxy... (Attempt ${this.additionalaccinfo.logOnTries}/${advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));
                else logger("info", `[${this.thisbot}] Trying to log in with proxy ${this.additionalaccinfo.thisproxyindex}... (Attempt ${this.additionalaccinfo.logOnTries}/${advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));

            this._attemptCredentialsLogin();
        }, 5000);

    }
};
