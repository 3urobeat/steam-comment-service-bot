/*
 * File: debug.js
 * Project: steam-comment-service-bot
 * Created Date: 18.05.2023 11:27:11
 * Author: 3urobeat
 *
 * Last Modified: 29.06.2023 22:35:03
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot.js");


/**
 * Handles the SteamUser debug events if enabled in advancedconfig
 */
Bot.prototype._attachSteamDebugEvent = function() {

    if (this.data.advancedconfig.steamUserDebug) {
        this.user.on("debug", (msg) => {
            logger("debug", `[${this.logPrefix}] steam-user debug: ${msg}`);
        });
    }

    if (this.data.advancedconfig.steamUserDebugVerbose) {
        this.user.on("debug-verbose", (msg) => {
            logger("debug", `[${this.logPrefix}] steam-user debug-verbose: ${msg}`);
        });
    }

};