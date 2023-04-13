/*
 * File: getAvailableAccounts.js
 * Project: steam-comment-service-bot
 * Created Date: 09.04.2023 12:49:53
 * Author: 3urobeat
 *
 * Last Modified: 13.04.2023 15:17:34
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller = require("../controller");


/**
 * Finds all needed and currently available bot accounts for a comment request.
 * @param {Number} numberOfComments Number of requested comments
 * @param {Boolean} canBeLimited If the accounts are allowed to be limited
 * @param {String} receiverSteamID Optional: steamID64 of the receiving user. If set, accounts that are friend with the user will be prioritized and accsToAdd will be calculated.
 * @returns {Object} Object containing accsNeeded (Number), availableAccounts (Array of account names from bot object), accsToAdd (Array of account names from bot object which are limited and not friend) and whenAvailable (Timestamp representing how long to wait until accsNeeded amount of accounts will be available)
 */
Controller.prototype.getAvailableAccountsForCommenting = function(numberOfComments, canBeLimited, receiverSteamID = null) {

    // Calculate the amount of accounts needed for this request
    let accountsNeeded;

    // Method 1: Use as many accounts as possible to maximize the spread (Default)
    if (numberOfComments <= Object.keys(this.bots).length) accountsNeeded = numberOfComments;
        else accountsNeeded = Object.keys(this.bots).length; // Cap accountsNeeded at amount of accounts because if numberOfComments is greater we will start at account 1 again

    // Method 2: Use as few accounts as possible to maximize the amount of parallel requests (Not implemented yet, probably coming in 2.12)
    // TODO

    logger("debug", `Controller getAvailableAccountsForCommenting(): Calculated ${accountsNeeded} accounts needed to request ${numberOfComments} comments...`);


    // Sort activeRequests by highest until value, decreasing, so that we can tell the user how long he/she has to wait if not enough accounts were found
    let sortedvals = Object.keys(this.activeRequests).sort((a, b) => {
        return this.activeRequests[b].until - this.activeRequests[a].until;
    });

    if (sortedvals.length > 0) this.activeRequests = Object.assign(...sortedvals.map(k => ( { [k]: this.activeRequests[k] } ) )); // Map sortedvals back to object if array is not empty - credit: https://www.geeksforgeeks.org/how-to-create-an-object-from-two-arrays-in-javascript/


    let whenAvailable; // We will save the until value of the account that the user has to wait for here
    let allAccounts = [ ... Object.keys(this.bots) ]; // Clone keys array (bot usernames) of bots object

    // Loop over activeRequests and remove all active entries from allAccounts
    if (Object.keys(this.activeRequests).length > 0) {
        Object.keys(this.activeRequests).forEach((e) => {

            if (Date.now() < this.activeRequests[e].until + (this.data.config.botaccountcooldown * 60000)) { // Check if entry is not finished yet
                this.activeRequests[e].accounts.forEach((f) => {   // Loop over every account used in this request
                    allAccounts.splice(allAccounts.indexOf(f), 1); // Remove that accountindex from the allAccounts array
                });

                // If this removal causes the user to need to wait, update whenAvailable
                if (allAccounts.length - this.activeRequests[e].accounts.length < numberOfComments) {
                    whenAvailable = this.activeRequests[e].until + (this.data.config.botaccountcooldown * 60000);
                }
            } else {
                delete this.activeRequests[e]; // Remove entry from object if it is finished to keep the object clean
            }

        });
    }


    // Remove limited accounts from allAccounts array if desired
    if (!canBeLimited) {
        let previousLength = allAccounts.length;
        allAccounts = allAccounts.filter(e => this.bots[e].limitations && !this.bots[e].limitations.limited);

        if (previousLength - allAccounts.length > 0) logger("info", `${previousLength - allAccounts.length} of ${previousLength} were removed from available accounts as they are limited and can't be used for this request!`);
    }


    // Randomize order if enabled in config
    if (this.data.config.randomizeAccounts) allAccounts.sort(() => Math.random() - 0.5);


    // Prioritize accounts the user is friend with
    if (receiverSteamID) {
        allAccounts = [
            ...allAccounts.filter(e =>  this.bots[e].user.myFriends.includes(receiverSteamID)), // Cool trick to get every acc with user as friend to the top
            ...allAccounts.filter(e => !this.bots[e].user.myFriends.includes(receiverSteamID))  // ...and every non-friend acc below
        ];
    }


    // Cut result to only include needed accounts
    if (allAccounts.length > accountsNeeded) allAccounts = allAccounts.slice(0, accountsNeeded);


    // Filter all accounts needed for this request which must be added first
    let accsToAdd = allAccounts.filter(e => !this.bots[e].user.myFriends.includes(receiverSteamID) && this.bots[e].user.limitations.limited);


    // Log debug values
    logger("debug", `Controller getAvailableAccountsForCommenting(): Success! allAccounts: ${allAccounts}`);

    // Return values
    return {
        "accsNeeded": accountsNeeded,
        "availableAccounts": allAccounts,
        "accsToAdd": accsToAdd,
        "whenAvailable": whenAvailable
    };

};