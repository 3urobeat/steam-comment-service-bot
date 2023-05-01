/*
 * File: disconnected.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 01.05.2023 22:15:59
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot.js");


/**
 * Handles the SteamUser disconnect event and tries to relog the account
 */
Bot.prototype._attachSteamDisconnectedEvent = function() {

    // Display message when connection was lost to Steam
    this.user.on("disconnected", (eresult, msg) => {

        if (this.status == "offline" && this.controller.info.activeLogin) return; // Ignore if account is already marked as offline and a login process is active

        logger("info", `${logger.colors.fgred}[${this.logPrefix}] Lost connection to Steam. Message: ${msg} | Check: https://steamstat.us`);

        this.controller._statusUpdateEvent(this, "offline"); // Set status of this account to offline

        // Don't relog if account is in skippedaccounts array or if relogAfterDisconnect is false
        if (!this.controller.info.skippedaccounts.includes(this.loginData.logOnOptions.accountName) && this.controller.relogAfterDisconnect) {
            logger("info", `${logger.colors.fggreen}[${this.logPrefix}] Initiating a relog in ${this.controller.data.advancedconfig.relogTimeout / 1000} seconds.`); // Announce relog

            setTimeout(() => this.controller.login(), this.controller.data.advancedconfig.relogTimeout); // Relog in relogTimeout ms
        } else {
            logger("info", `[${this.logPrefix}] I won't queue myself for a relog because this account is either already being relogged, was skipped or this is an intended logOff.`);
        }

    });

};
