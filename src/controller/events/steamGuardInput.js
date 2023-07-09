/*
 * File: steamGuardInput.js
 * Project: steam-comment-service-bot
 * Created Date: 04.06.2023 12:00:48
 * Author: 3urobeat
 *
 * Last Modified: 04.07.2023 19:36:34
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot        = require("../../bot/bot.js"); // eslint-disable-line
const Controller = require("../controller");


/**
 * Emits steamGuardInput event for bot & plugins
 * @param {Bot} bot Bot instance of the affected account
 * @param {function(string): void} submitCode Function to submit a code. Pass an empty string to skip the account.
 */
Controller.prototype._steamGuardInputEvent = function(bot, submitCode) {

    // Log debug message
    logger("debug", `Controller steamGuardInputEvent: Emitting event for bot${bot.index} so plugins and the Steam Chat can submit user input...`);

    // Emit event
    this.events.emit("steamGuardInput", bot, submitCode);

};