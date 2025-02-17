/*
 * File: getFollowBots.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-09-24 18:01:44
 * Author: 3urobeat
 *
 * Last Modified: 2025-02-13 22:23:41
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
 * Finds all needed and currently available bot accounts for a follow request.
 * @private
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {number|"all"} amount Amount of favs requested or "all" to get the max available amount
 * @param {boolean} canBeLimited If the accounts are allowed to be limited
 * @param {string} id The user id to follow
 * @param {string} idType Either "user" or "curator"
 * @param {string} favType Either "follow" or "unfollow", depending on which request this is
 * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @returns {Promise.<{ amount: number, availableAccounts: Array.<string>, whenAvailable: number, whenAvailableStr: string }>} Resolves with obj: `availableAccounts` contains all account names from bot object, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
module.exports.getAvailableBotsForFollowing = async (commandHandler, amount, canBeLimited, id, idType, favType, resInfo) => {

    /* --------- Get all bots which haven't followed this id yet and aren't currently in another follow request --------- */
    let whenAvailable; // We will save the until value of the account that the user has to wait for here
    let whenAvailableStr;
    const allAccsOnline = commandHandler.controller.getBots(null, true);
    let allAccounts = [ ... Object.keys(allAccsOnline) ]; // Clone keys array (bot usernames) of bots object


    // Remove limited accounts from allAccounts array if desired
    if (!canBeLimited) {
        const previousLength = allAccounts.length;
        allAccounts = allAccounts.filter(e => allAccsOnline[e].user.limitations && !allAccsOnline[e].user.limitations.limited);

        if (previousLength - allAccounts.length > 0) logger("info", `${previousLength - allAccounts.length} of ${previousLength} bot accounts were removed from available accounts as they are limited and can't be used for this request!`);
    }


    // Remove bot accounts from allAccounts which have already followed this id, or only allow them for type unfollow
    const previousLength = allAccounts.length;
    const alreadyUsedRes = await commandHandler.data.ratingHistoryDB.findAsync({ id: id, type: idType + "Follow" }, {});
    const alreadyUsed    = alreadyUsedRes.map((e) => e.accountName).filter((e) => allAccounts.includes(e)); // Reduce db response to accountNames only but filter any !ONLINE accounts

    if (favType == "follow") {
        allAccounts = allAccounts.filter((e) => !alreadyUsed.includes(e));
    } else {
        allAccounts = alreadyUsed;
    }

    if (previousLength - allAccounts.length > 0) logger("info", `${previousLength - allAccounts.length} of ${previousLength} bot accounts were removed from available accounts because we know that they have already un-/followed this user!`);


    // Loop over activeRequests and remove all active entries from allAccounts if both are not empty
    if (allAccounts.length > 0 && Object.keys(commandHandler.controller.activeRequests).length > 0) {
        Object.keys(commandHandler.controller.activeRequests).forEach((e) => {
            if (!commandHandler.controller.activeRequests[e].type.toLowerCase().includes("follow")) return; // Ignore entry if not of this type. ToLowerCase() is important here because type is in camelCase

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
        logger("debug", `CommandHandler getFollowBots(): User provided max amount keyword "all", updating it to ${allAccounts.length}`);
    }


    // Cut result to only include needed accounts
    if (allAccounts.length > amount) allAccounts = allAccounts.slice(0, amount);


    // Cut result if greater than max allowed amount - At this point this can only be caused when user requested amount "all", a specific but too high amount was already sorted out
    let owners = commandHandler.data.cachefile.ownerid;                             // Get owners
    if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs; // Overwrite default owners if called from e.g. plugin

    let maxRequestAmount = commandHandler.data.config.maxRequests;                  // Set to default max value for normal users
    if (owners.includes(resInfo.userID)) maxRequestAmount = commandHandler.data.config.maxOwnerRequests; // Overwrite if owner

    if (allAccounts.length > maxRequestAmount) {
        logger("debug", `CommandHandler getVoteBots(): User requested 'all' but is only allowed ${maxRequestAmount} comments. Slicing...`);

        allAccounts = allAccounts.slice(0, maxRequestAmount);  // Slice if more than allowed
        amount      = maxRequestAmount;
    }


    // Log result to debug
    if (allAccounts.length < amount) logger("debug", `CommandHandler getFollowBots(): Found ${allAccounts.length} available bot accounts to un-/folloe ${id} but ${amount} are needed. If accs will become available, the user needs to wait: ${whenAvailableStr || "/"}`);
        else logger("debug", `CommandHandler getFollowBots(): Found ${allAccounts.length} available bot accounts to un-/follow ${id}: ${allAccounts}`);

    // Resolve promise with values
    return {
        "amount": amount,
        "availableAccounts": allAccounts,
        "whenAvailable": whenAvailable,
        "whenAvailableStr": whenAvailableStr
    };
};
