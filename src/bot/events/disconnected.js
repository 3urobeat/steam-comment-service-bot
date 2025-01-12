/*
 * File: disconnected.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 16:40:51
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot.js");


/**
 * Handles the SteamUser disconnect event and tries to relog the account
 * @private
 */
Bot.prototype._attachSteamDisconnectedEvent = function() {

    // Display message when connection was lost to Steam
    this.user.on("disconnected", (eresult, msg) => {

        if (this.status == Bot.EStatus.OFFLINE && this.controller.info.activeLogin) return; // Ignore if account is already marked as offline and a login process is active

        // Store disconnect timestamp & reason
        this.lastDisconnect.timestamp = Date.now();
        this.lastDisconnect.reason = msg;

        this.controller._statusUpdateEvent(this, Bot.EStatus.OFFLINE); // Set status of this account to offline

        // Don't relog if account is in skippedaccounts array or if relogAfterDisconnect is false
        if (!this.controller.info.skippedaccounts.includes(this.accountName) && this.controller.info.relogAfterDisconnect) {
            logger("info", `${logger.colors.fgred}[${this.logPrefix}] Lost connection to Steam: '${msg}'. Initiating a login retry in ${this.controller.data.advancedconfig.loginRetryTimeout / 1000} seconds.`); // Announce relog

            setTimeout(() => this.controller.login(), this.controller.data.advancedconfig.loginRetryTimeout); // Relog in loginRetryTimeout ms
        } else {
            logger("info", `${logger.colors.fgred}[${this.logPrefix}] Lost connection to Steam: '${msg}'. I won't queue for a relog because this account is either already being relogged, was skipped or this is an intended logOff.`);
        }

    });

};
