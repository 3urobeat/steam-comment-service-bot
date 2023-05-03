/*
 * File: handleLoginTimeout.js
 * Project: steam-comment-service-bot
 * Created Date: 03.11.2022 12:27:46
 * Author: 3urobeat
 *
 * Last Modified: 03.05.2023 20:21:55
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot.js");


/**
 * Handles aborting a login attempt should an account get stuck to prevent the bot from softlocking (see issue #139)
 */
Bot.prototype.handleLoginTimeout = function() {

    // Ignore if login timeout handler is disabled in advancedconfig
    if (this.data.advancedconfig.loginTimeout == 0) return logger("debug", `Bot handleLoginTimeout(): Ignoring timeout attach request for bot${this.index} because loginTimeout is disabled in advancedconfig!`);
        else logger("debug", `Bot handleLoginTimeout(): Attached ${this.data.advancedconfig.loginTimeout / 1000} seconds timeout for bot${this.index}...`);

    let currentLogOnTry = this.loginData.logOnTries;

    // Check if account is still offline with the same logOnTries value 60 seconds later and force progress
    setTimeout(() => {

        // Ignore timeout if account progressed since then
        let newLogOnTry = this.loginData.logOnTries;

        if (currentLogOnTry != newLogOnTry || this.status != "offline") return logger("debug", `Bot handleLoginTimeout(): Timeout for bot${this.index} done, acc not stuck. old/new logOnTries: ${currentLogOnTry}/${newLogOnTry} - acc status: ${this.status}`);

        // Check if all logOnRetries are used up and skip account
        if (this.loginData.logOnTries > this.data.advancedconfig.maxLogOnRetries) {
            logger("", "", true);
            logger("error", `Couldn't log in bot${this.index} after ${this.loginData.logOnTries} attempt(s). Error: Login attempt timed out and all available logOnRetries were used.`, true);

            // Add additional messages for specific errors to hopefully help the user diagnose the cause
            if (this.loginData.proxy != null) logger("", `        Is your proxy ${this.loginData.proxyIndex} offline or maybe blocked by Steam?`, true);

            // Abort execution if account is bot0
            if (this.index == 0) {
                logger("", "", true);
                logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease wait a moment and start the bot again.", true);
                return this.controller.stop();

            } else { // Skip account if not bot0

                logger("info", "Failed account is not bot0. Skipping account...", true);
                this.controller._statusUpdateEvent(this, "skipped");
                this.controller.info.skippedaccounts.push(this.loginData.logOnOptions.accountName);
            }

        } else {

            // Force progress if account is stuck
            logger("warn", `Detected timed out login attempt for bot${this.index}! Force progressing login attempt to avoid soft-locking the bot...`, true);

            this.user.logOff(); // Call logOff() just to be sure
            if (this.sessionHandler.session) this.sessionHandler.session.cancelLoginAttempt(); // TODO: This might cause an error as idk if we are polling. Maybe use the timeout event of steam-session

            this._loginToSteam(); // Attempt another login as we still have attempts left
        }

    }, this.data.advancedconfig.loginTimeout);

};