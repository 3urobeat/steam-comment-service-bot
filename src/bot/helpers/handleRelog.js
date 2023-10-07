/*
 * File: handleRelog.js
 * Project: steam-comment-service-bot
 * Created Date: 05.10.2023 16:14:46
 * Author: 3urobeat
 *
 * Last Modified: 07.10.2023 15:58:24
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot");


/**
 * Attempts to get this account, after failing all logOnRetries, back online after some time. Does not apply to initial logins.
 */
Bot.prototype.handleRelog = function() {

    // Ignore if login timeout handler is disabled in advancedconfig
    if (this.data.advancedconfig.relogTimeout == 0) return logger("debug", `Bot handleRelog(): Ignoring timeout attach request for bot${this.index} because relogTimeout is disabled in advancedconfig!`);
        else logger("info", `[${this.logPrefix}] Attempting to recover lost connection in ${this.data.advancedconfig.relogTimeout / 60000} minutes...`);

    this.loginData.relogTries++;

    // Attempt to relog account after relogTimeout ms
    setTimeout(() => {

        // Abort if account is online again for some reason
        if (this.status == Bot.EStatus.ONLINE) return logger("debug", `Bot handleRelog(): Timeout elapsed but bot${this.index} is not offline anymore. Ignoring...`);

        // Update status to offline and call login again
        this.status = Bot.EStatus.OFFLINE;

        this.controller.login();

    }, this.controller.data.advancedconfig.relogTimeout);

};