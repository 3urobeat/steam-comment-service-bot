/*
 * File: checkCooldown.js
 * Project: steam-comment-service-bot
 * Created Date: 28.02.2022 11:06:57
 * Author: 3urobeat
 *
 * Last Modified: 11.04.2023 13:13:45
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID    = require("steamid"); //eslint-disable-line

const controller = require("../../controller/controller.js");
const mainfile   = require("../main.js");
const { round }  = require("../../controller/helpers/misc.js");


/**
 * Checks for user cooldown, bot cooldown, calculates amount of accounts needed for a request and responds to the user if request is invalid
 * @param {SteamID} receiverSteamID The steamID object of the receiving user
 * @param {Number} numberOfComments The amount of comments requested
 * @param {Boolean} removeLimitedAccs Set to true to remove all limited bot accounts from available accounts list (for example for group comment cmd, as only unlimited accs can comment in groups)
 * @param {Object} lang The language object
 * @param {*} res The res parameter if request is coming from the webserver, otherwise null
 * @param {Object} lastcommentdoc The lastcomment db document of the requesting user
 * @param {Function} respond The function to send messages to the requesting user
 * @returns {Object} allAccounts, accountsNeeded
 */
module.exports.checkAvailability = (receiverSteamID, numberOfComments, removeLimitedAccs, lang, res, lastcommentdoc, respond) => {

    /* ------------------ Check for cooldowns ------------------ */
    if (config.commentcooldown !== 0 && !res) { // Check for user specific cooldown (ignore if it is a webrequest)

        if ((Date.now() - lastcommentdoc.time) < (config.commentcooldown * 60000)) { // Check if user has cooldown applied
            var remainingcooldown = Math.abs(((Date.now() - lastcommentdoc.time) / 1000) - (config.commentcooldown * 60));
            var remainingcooldownunit = "seconds";
            if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "minutes"; }
            if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "hours"; }

            // Send error message and stop execution
            logger("debug", "checkAvailability(): User has cooldown. Stopping...");

            respond(403, lang.commentuseroncooldown.replace("commentcooldown", config.commentcooldown).replace("remainingcooldown", round(remainingcooldown, 2)).replace("timeunit", remainingcooldownunit));
            return false;
        } else {
            // Is the profile already receiving comments?
            if (controller.activeRequests[receiverSteamID] && controller.activeRequests[receiverSteamID].status == "active") {
                logger("debug", "checkAvailability(): Profile is already receiving comments. Stopping...");

                respond(403, lang.commentuseralreadyreceiving);
                return false;
            }
        }
    }








    if (allAccounts.length < accountsNeeded) {
        // Calculate how far away whenavailable is from Date.now()
        let remaining     = Math.abs((whenavailable - Date.now()) / 1000);
        let remainingUnit = "seconds";
        if (remaining > 120) { remaining = remaining / 60; remainingUnit = "minutes"; }
        if (remaining > 120) { remaining = remaining / 60; remainingUnit = "hours"; }

        // Respond with note about how many comments can be requested right now if more than 0 accounts are available
        if (allAccounts.length > 0) respond(500, lang.commentnotenoughavailableaccs.replace("waittime", round(remaining, 2)).replace("timeunit", remainingUnit).replace("availablenow", allAccounts.length)); // Using allAccounts.length works for the "spread requests on as many accounts as possible" method
            else respond(500, lang.commentzeroavailableaccs.replace("waittime", round(remaining, 2)).replace("timeunit", remainingUnit));

        logger("info", `Found only ${allAccounts.length} available account(s) but ${accountsNeeded} account(s) are needed to send ${numberOfComments} comments.`);
        return false;
    } else {
        logger("info", `Found ${allAccounts.length} available account(s)!`);
    }



};