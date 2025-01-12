/*
 * File: sessionEvents.js
 * Project: steam-comment-service-bot
 * Created Date: 2022-10-09 12:52:30
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 17:20:34
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SessionHandler = require("../sessionHandler.js");


/**
 * Internal: Attaches listeners to all steam-session events we care about
 * @private
 */
SessionHandler.prototype._attachEvents = function() {

    // Attach debug event if enabled in advancedconfig
    if (this.controller.data.advancedconfig.steamSessionDebug) {
        this.session.on("debug", (msg) => {
            logger("debug", `[${this.bot.logPrefix}] steam-session debug: ${msg}`);
        });
    }


    this.session.on("authenticated", () => { // Success
        logger.stopReadInput("Login request accepted"); // Should the user have approved this login attempt via the mobile Steam Guard app, stop readInput() from handle2FA

        logger("debug", `[${this.bot.logPrefix}] getRefreshToken(): Login request successful, '${this.session.accountName}' authenticated. Resolving Promise...`);

        this._resolvePromise(this.session.refreshToken);
    });


    this.session.on("timeout", () => { // Login attempt took too long, failure

        // TODO: Retry?

        logger("warn", `[${this.bot.logPrefix}] Login attempt timed out!`);

        this._resolvePromise(null);
    });


    this.session.on("error", (err) => { // Failure
        logger("error", `[${this.bot.logPrefix}] Failed to get a session for account '${this.logOnOptions.accountName}'! Error: ${err.stack ? err.stack : err}`); // Session.accountName is only defined on success

        // TODO: When does this event fire? Do I need to do something else?
        // TODO: Retry until advancedconfig.maxLogOnRetries?

        this._resolvePromise(null);
    });

};
