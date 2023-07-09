/*
 * File: statusUpdate.js
 * Project: steam-comment-service-bot
 * Created Date: 30.03.2023 21:05:13
 * Author: 3urobeat
 *
 * Last Modified: 04.07.2023 19:36:26
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
 * Runs internal statusUpdate event code and emits statusUpdate event for plugins
 * @param {Bot} bot Bot instance
 * @param {Bot.EStatus} newStatus The new status of this bot
 */
Controller.prototype._statusUpdateEvent = function(bot, newStatus) {
    let oldStatus = bot.status;

    // Update status of bot
    bot.status = newStatus;

    // Log debug message
    logger("debug", `Controller statusUpdateEvent: bot${bot.index} changed status from ${Bot.EStatus[oldStatus]} to ${Bot.EStatus[newStatus]}`);

    // Emit event
    this.events.emit("statusUpdate", bot, oldStatus, newStatus);
};