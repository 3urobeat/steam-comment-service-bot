/*
 * File: getCommentBots.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-04-09 12:49:53
 * Author: 3urobeat
 *
 * Last Modified: 2024-03-02 14:35:28
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const { EFriendRelationship } = require("steam-user");

const CommandHandler   = require("../commandHandler.js"); // eslint-disable-line
const { timeToString } = require("../../controller/helpers/misc.js");


/**
 * Finds all needed and currently available bot accounts for a comment request.
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {number} numberOfComments Number of requested comments
 * @param {boolean} canBeLimited If the accounts are allowed to be limited
 * @param {string} idType Type of the request. This can either be "profile(PrivacyState)", "group", "sharedfile", "discussion" or "review". This is used to determine if limited accs need to be added first.
 * @param {string} receiverSteamID Optional: steamID64 of the receiving user. If set, accounts that are friend with the user will be prioritized and accsToAdd will be calculated.
 * @returns {{ accsNeeded: number, availableAccounts: Array.<string>, accsToAdd: Array.<string>, whenAvailable: number, whenAvailableStr: string }} `availableAccounts` contains all account names from bot object, `accsToAdd` account names which are limited and not friend, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
module.exports.getAvailableBotsForCommenting = async function(commandHandler, numberOfComments, canBeLimited, idType, receiverSteamID = null) {

    // Calculate the amount of accounts needed for this request
    let accountsNeeded;

    // Method 1: Use as many accounts as possible to maximize the spread (Default)
    if (numberOfComments <= commandHandler.controller.getBots().length) accountsNeeded = numberOfComments;
        else accountsNeeded = commandHandler.controller.getBots().length; // Cap accountsNeeded at amount of accounts because if numberOfComments is greater we will start at account 1 again

    // Method 2: Use as few accounts as possible to maximize the amount of parallel requests (Not implemented yet)
    // TODO


    // Sort activeRequests by highest until value, decreasing, so that we can tell the user how long he/she has to wait if not enough accounts were found
    let sortedvals = Object.keys(commandHandler.controller.activeRequests).sort((a, b) => {
        return commandHandler.controller.activeRequests[b].until - commandHandler.controller.activeRequests[a].until;
    });

    if (sortedvals.length > 0) commandHandler.controller.activeRequests = Object.assign(...sortedvals.map(k => ( { [k]: commandHandler.controller.activeRequests[k] } ) )); // Map sortedvals back to object if array is not empty - credit: https://www.geeksforgeeks.org/how-to-create-an-object-from-two-arrays-in-javascript/


    let whenAvailable; // We will save the until value of the account that the user has to wait for here
    let whenAvailableStr;
    let allAccsOnline = commandHandler.controller.getBots(null, true);
    let allAccounts = [ ... Object.keys(allAccsOnline) ]; // Clone keys array (bot usernames) of bots object


    // Remove limited accounts from allAccounts array if desired
    if (!canBeLimited) {
        let previousLength = allAccounts.length;
        allAccounts = allAccounts.filter(e => allAccsOnline[e].user.limitations && !allAccsOnline[e].user.limitations.limited);

        if (previousLength - allAccounts.length > 0) logger("info", `${previousLength - allAccounts.length} of ${previousLength} bot accounts were removed from available accounts as they are limited and can't be used for this request!`);
    }


    // Loop over activeRequests and remove all active entries from allAccounts
    if (allAccounts.length > 0 && Object.keys(commandHandler.controller.activeRequests).length > 0) {
        Object.keys(commandHandler.controller.activeRequests).forEach((e) => {
            if (!commandHandler.controller.activeRequests[e].type.includes("Comment")) return; // Ignore entry if not of this type

            if (Date.now() < commandHandler.controller.activeRequests[e].until + (commandHandler.data.config.botaccountcooldown * 60000)) { // Check if entry is not finished yet
                commandHandler.controller.activeRequests[e].accounts.forEach((f) => { // Loop over every account used in this request
                    allAccounts.splice(allAccounts.indexOf(f), 1); // Remove that accountindex from the allAccounts array
                });

                // If this removal causes the user to need to wait, update whenAvailable
                if (allAccounts.length - commandHandler.controller.activeRequests[e].accounts.length < numberOfComments) {
                    whenAvailable = commandHandler.controller.activeRequests[e].until + (commandHandler.data.config.botaccountcooldown * 60000);
                    whenAvailableStr = timeToString(whenAvailable);
                }
            } else {
                delete commandHandler.controller.activeRequests[e]; // Remove entry from object if it is finished to keep the object clean
            }
        });
    }


    // Randomize order if enabled in config
    if (commandHandler.data.config.randomizeAccounts) allAccounts.sort(() => Math.random() - 0.5);


    // Prioritize accounts the user is friend with if type is profile
    if (receiverSteamID && idType.startsWith("profile")) {
        allAccounts = [
            ...allAccounts.filter(e => allAccsOnline[e].user.myFriends[receiverSteamID] == EFriendRelationship.Friend), // Cool trick to get every acc with user as friend to the top
            ...allAccounts.filter(e => allAccsOnline[e].user.myFriends[receiverSteamID] != EFriendRelationship.Friend)  // ...and every non-friend acc below
        ];
    }


    // Remove !accountCanComment accounts if type discussion. We need to run getSteamDiscussion for every account, which kind of sucks as it's a ton of requests - but what else are we supposed to do?
    if (idType == "discussion") {
        let promises = [];

        allAccounts.forEach((e) => {
            promises.push((() => {
                return new Promise((resolve) => {
                    commandHandler.controller.bots[e].community.getSteamDiscussion(receiverSteamID, (err, obj) => { // ReceiverSteamID64 is a URL in this case
                        if (err) {
                            logger("error", "Couldn't check if account can comment on discussion! Resolving with true anyway and hoping for the best...\n" + err.stack);
                            return resolve({ accountName: e, accountCanComment: true });
                        }

                        resolve({ accountName: e, accountCanComment: obj.accountCanComment });
                    });
                });
            })());
        });

        await Promise.all(promises).then((res) => {
            let previousLength = allAccounts.length;

            res.forEach((e) => {
                if (!e.accountCanComment) allAccounts.splice(allAccounts.indexOf(e.accountName), 1); // Remove that accountindex from the allAccounts array
            });

            logger("info", `${previousLength - allAccounts.length} of ${previousLength} bot accounts were removed from available accounts as they are not allowed to comment on this discussion!`);
        });
    }


    // Cut result to only include needed accounts
    if (allAccounts.length > accountsNeeded) allAccounts = allAccounts.slice(0, accountsNeeded);


    // Filter all accounts needed for this request which must be added first
    let accsToAdd = [];

    if (idType == "profilePublic") {             // On a public profile only limited accounts need to be added
        accsToAdd = allAccounts.filter(e => allAccsOnline[e].user.myFriends[receiverSteamID] != EFriendRelationship.Friend && allAccsOnline[e].user.limitations.limited);
    } else if (idType == "profileFriendsonly") { // On a friendsonly profile all accounts need to be added
        accsToAdd = allAccounts.filter(e => allAccsOnline[e].user.myFriends[receiverSteamID] != EFriendRelationship.Friend);
    }                                            // Comments on private profiles are already blocked, no need to check for that here


    // Log debug values
    if (allAccounts.length < accountsNeeded) logger("debug", `CommandHandler getAvailableBotsForCommenting(): Calculated ${accountsNeeded} accs needed for ${numberOfComments} comments but only ${allAccounts.length} are available. If accs will become available, the user needs to wait: ${whenAvailableStr || "/"}`);
        else logger("debug", `CommandHandler getAvailableBotsForCommenting(): Calculated ${accountsNeeded} accs needed for ${numberOfComments} comments and ${allAccounts.length} are available: ${allAccounts}`);

    // Return values
    return {
        "accsNeeded": accountsNeeded,
        "availableAccounts": allAccounts,
        "accsToAdd": accsToAdd,
        "whenAvailable": whenAvailable,
        "whenAvailableStr": whenAvailableStr
    };

};
