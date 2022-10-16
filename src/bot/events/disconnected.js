/*
 * File: disconnected.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 16.10.2022 13:21:47
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const controller = require("../../controller/controller.js");
const login      = require("../../controller/login.js");


/**
 * Handles the disconnect event and tries to relog the account
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {String} msg The msg parameter of the steam-user disconnected event
 */
module.exports.run = (loginindex, thisbot, logOnOptions, bot, thisproxy, msg) => {

    if (!controller.relogQueue) return; // Don't even try to check anything when cache of controller was already cleared (for example by restart function)
    if (controller.relogQueue.includes(loginindex)) return; // Disconnect is already handled

    logger("info", `${logger.colors.fgred}[${thisbot}] Lost connection to Steam. Message: ${msg} | Check: https://steamstat.us`);

    if (!login.skippednow.includes(loginindex) && controller.relogAfterDisconnect) { // Bot.logOff() also calls this event with NoConnection.
        if (controller.relogQueue.includes(loginindex)) return; // Ignore this call if the account is already being relogged (this happens for example when handleExpiringTokens.js calls the relog function directly)

        logger("info", `${logger.colors.fggreen}[${thisbot}] Initiating a relog in ${advancedconfig.relogTimeout / 1000} seconds.`); // Announce relog

        setTimeout(() => {
            require("../helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, bot, thisproxy);
        }, advancedconfig.relogTimeout);
    } else {
        logger("info", `[${thisbot}] I won't queue myself for a relog because this account is either already being relogged, was skipped or this is an intended logOff.`);
    }
};
