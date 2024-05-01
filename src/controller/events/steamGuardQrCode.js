/*
 * File: steamGuardQrCode.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-05-01 14:44:36
 * Author: 3urobeat
 *
 * Last Modified: 2024-05-01 14:48:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot        = require("../../bot/bot.js"); // eslint-disable-line
const Controller = require("../controller");


/**
 * Emits steamGuardQrCode event for bot & plugins
 * @param {Bot} bot Bot instance of the affected account
 * @param {string} challengeUrl The QrCode Challenge URL supplied by Steam. Display this value using a QR-Code parser and let a user scan it using their Steam Mobile App.
 */
Controller.prototype._steamGuardQrCodeEvent = function(bot, challengeUrl) {

    // Log debug message
    logger("debug", `Controller steamGuardQrCodeEvent: Emitting event for bot${bot.index} so plugins can display the QR-Code...`);

    // Emit event
    this.events.emit("steamGuardQrCode", bot, challengeUrl);

};
