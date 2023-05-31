/*
 * File: getVoteBots.js
 * Project: steam-comment-service-bot
 * Created Date: 28.05.2023 12:21:02
 * Author: 3urobeat
 *
 * Last Modified: 31.05.2023 16:10:01
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler   = require("../commandHandler.js"); // eslint-disable-line
const { timeToString } = require("../../controller/helpers/misc.js");


/**
 * Finds all needed and currently available bot accounts for a vote request.
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {number|"all"} amount Amount of votes requested or "all" to get the max available amount
 * @param {string} id The sharedfile id to vote on
 * @returns {Promise.<{ amount: number, availableAccounts: array<string>, whenAvailable: number, whenAvailableStr: string }>} Promise with obj: `availableAccounts` contains all account names from bot object, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
module.exports.getAvailableBotsForVoting = (commandHandler, amount, id) => {
    return new Promise((resolve) => {
        (async () => { // Lets us use await inside a Promise without creating an antipattern

            /* --------- Get all bots which haven't voted on this id yet and aren't currently in another vote request --------- */
            let whenAvailable; // We will save the until value of the account that the user has to wait for here
            let whenAvailableStr;
            let allAccsOnline = commandHandler.controller.getBots(null, true);
            let allAccounts = [ ... Object.keys(allAccsOnline) ]; // Clone keys array (bot usernames) of bots object

            // Remove limited accounts from allAccounts array as they are unable to vote
            let previousLengthLimited = allAccounts.length;
            allAccounts               = allAccounts.filter(e => allAccsOnline[e].user.limitations && !allAccsOnline[e].user.limitations.limited);

            if (previousLengthLimited - allAccounts.length > 0) logger("info", `${previousLengthLimited - allAccounts.length} of ${previousLengthLimited} bot accounts were removed from available accounts as they are limited and can't be used for this request!`);


            // Remove bot accounts from allAccounts which have already voted on this id
            let previousLengthVoted = allAccounts.length;
            let alreadyVoted        = await commandHandler.data.ratingHistoryDB.findAsync({ id: id }, {});

            alreadyVoted.forEach((e) => allAccounts.splice(allAccounts.indexOf(e), 1));

            if (previousLengthVoted - allAccounts.length > 0) logger("info", `${previousLengthVoted - allAccounts.length} of ${previousLengthVoted} bot accounts were removed from available accounts because we know that they have already voted on this item!`);


            // Loop over activeRequests and remove all active entries from allAccounts if both are not empty
            if (allAccounts.length > 0 && Object.keys(commandHandler.controller.activeRequests).length > 0) {
                Object.keys(commandHandler.controller.activeRequests).forEach((e) => {
                    if (!commandHandler.controller.activeRequests[e].type.includes("vote")) return; // Ignore entry if not of this type

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
                logger("debug", `CommandHandler getVoteBots(): User provided max amount keyword "all", updating it to ${allAccounts.length}`);
            }


            // Cut result to only include needed accounts
            if (allAccounts.length > amount) allAccounts = allAccounts.slice(0, amount);


            // Log result to debug
            if (allAccounts.length < amount) logger("debug", `CommandHandler getVoteBots(): Found ${allAccounts.length} available bot accounts to vote on ${id} but ${amount} are needed. If accs will become available, the user needs to wait: ${whenAvailableStr || "/"}`);
                else logger("debug", `CommandHandler getVoteBots(): Found ${allAccounts.length} available bot accounts to vote on ${id}: ${allAccounts}`);

            // Resolve promise with values
            resolve({
                "amount": amount,
                "availableAccounts": allAccounts,
                "whenAvailable": whenAvailable,
                "whenAvailableStr": whenAvailableStr
            });
        })();
    });
};