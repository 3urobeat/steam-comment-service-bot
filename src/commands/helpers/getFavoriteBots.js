/*
 * File: getFavoriteBots.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-06-02 14:07:27
 * Author: 3urobeat
 *
 * Last Modified: 2025-02-13 22:23:30
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler   = require("../commandHandler.js"); // eslint-disable-line
const { timeToString } = require("../../controller/helpers/misc.js");


/**
 * Finds all needed and currently available bot accounts for a favorite request.
 * @private
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {number|"all"} amount Amount of favs requested or "all" to get the max available amount
 * @param {string} id The sharedfile id to favorize
 * @param {string} favType Either "favorite" or "unfavorite", depending on which request this is
 * @returns {Promise.<{ amount: number, availableAccounts: Array.<string>, whenAvailable: number, whenAvailableStr: string }>} Resolves with obj: `availableAccounts` contains all account names from bot object, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
module.exports.getAvailableBotsForFavorizing = async (commandHandler, amount, id, favType) => {

    /* --------- Get all bots which haven't favorized this id yet and aren't currently in another favorite request --------- */
    let whenAvailable; // We will save the until value of the account that the user has to wait for here
    let whenAvailableStr;
    const allAccsOnline = commandHandler.controller.getBots(null, true);
    let allAccounts = [ ... Object.keys(allAccsOnline) ]; // Clone keys array (bot usernames) of bots object


    // Remove bot accounts from allAccounts which have already favorized this id, or only allow them for type unfavorite
    const previousLengthFavorized = allAccounts.length;
    const alreadyUsedRes          = await commandHandler.data.ratingHistoryDB.findAsync({ id: id, type: "favorite" }, {});
    const alreadyUsed             = alreadyUsedRes.map((e) => e.accountName).filter((e) => allAccounts.includes(e)); // Reduce db response to accountNames only but filter any !ONLINE accounts

    if (favType == "favorite") {
        allAccounts = allAccounts.filter((e) => !alreadyUsed.includes(e));
    } else {
        allAccounts = alreadyUsed;
    }

    if (previousLengthFavorized - allAccounts.length > 0) logger("info", `${previousLengthFavorized - allAccounts.length} of ${previousLengthFavorized} bot accounts were removed from available accounts because we know that they have already un-/favorized this item!`);


    // Loop over activeRequests and remove all active entries from allAccounts if both are not empty
    if (allAccounts.length > 0 && Object.keys(commandHandler.controller.activeRequests).length > 0) {
        Object.keys(commandHandler.controller.activeRequests).forEach((e) => {
            if (!commandHandler.controller.activeRequests[e].type.includes("favorite")) return; // Ignore entry if not of this type

            if (Date.now() < commandHandler.controller.activeRequests[e].until + (commandHandler.data.config.botaccountcooldown * 60000)) { // Check if entry is not finished yet
                commandHandler.controller.activeRequests[e].accounts.forEach((f) => { // Loop over every account used in this request
                    allAccounts.splice(allAccounts.indexOf(f), 1); // Remove that accountindex from the allAccounts array
                });

                // If this removal causes the user to need to wait, update whenAvailable. Don't bother if user provided "all"
                if (amount != "all" && allAccounts.length - commandHandler.controller.activeRequests[e].accounts.length < amount) {
                    whenAvailable = commandHandler.controller.activeRequests[e].until + (commandHandler.data.config.botaccountcooldown * 60000);
                    whenAvailableStr = timeToString(whenAvailable);
                }
            } else {
                delete commandHandler.controller.activeRequests[e]; // Remove entry from object if it is finished to keep the object clean
            }
        });
    }


    // Update amount if "all"
    if (amount == "all") {
        amount = allAccounts.length;
        logger("debug", `CommandHandler getFavoriteBots(): User provided max amount keyword "all", updating it to ${allAccounts.length}`);
    }


    // Cut result to only include needed accounts
    if (allAccounts.length > amount) allAccounts = allAccounts.slice(0, amount);


    // Log result to debug
    if (allAccounts.length < amount) logger("debug", `CommandHandler getFavoriteBots(): Found ${allAccounts.length} available bot accounts to un-/favorize ${id} but ${amount} are needed. If accs will become available, the user needs to wait: ${whenAvailableStr || "/"}`);
        else logger("debug", `CommandHandler getFavoriteBots(): Found ${allAccounts.length} available bot accounts to un-/favorize ${id}: ${allAccounts}`);

    // Resolve promise with values
    return {
        "amount": amount,
        "availableAccounts": allAccounts,
        "whenAvailable": whenAvailable,
        "whenAvailableStr": whenAvailableStr
    };
};
