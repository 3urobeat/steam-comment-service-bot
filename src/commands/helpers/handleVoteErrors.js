/*
 * File: handleVoteErrors.js
 * Project: steam-comment-service-bot
 * Created Date: 31.05.2023 16:57:21
 * Author: 3urobeat
 *
 * Last Modified: 31.05.2023 19:25:41
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/**
 * Logs vote errors
 * @param {String} error The error string returned by steam-community
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {Bot} bot Bot object of the account posting this comment
 * @param {String} id ID of the sharedfile that receives the votes
 */
module.exports.logVoteError = (error, commandHandler, bot, id) => {
    let activeReqEntry = commandHandler.controller.activeRequests[id]; // Make using the obj shorter

    // Add proxy information if one was used for this account
    let proxiesDescription = "";
    if (commandHandler.data.proxies.length > 1) proxiesDescription = ` using proxy ${bot.loginData.proxyIndex}`;


    // Log error, add it to failed obj and continue with next iteration
    logger("error", `[${bot.logPrefix}] Error while voting ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} on ${id}${proxiesDescription}: ${error}`);

    activeReqEntry.failed[`c${activeReqEntry.thisIteration + 1} b${bot.index} p${bot.loginData.proxyIndex}`] = `${error}`;


    // Sort failed object to make it easier to read
    activeReqEntry.failed = sortFailedCommentsObject(activeReqEntry.failed);
};


/**
 * Helper function to sort failed object by comment number so that it is easier to read
 * @param {Object} failedObj Current state of failed object
 */
function sortFailedCommentsObject(failedObj) {
    let sortedvals = Object.keys(failedObj).sort((a, b) => {
        return Number(a.split(" ")[0].replace("c", "")) - Number(b.split(" ")[0].replace("c", ""));
    });

    // Map sortedvals back to object if array is not empty - Credit: https://www.geeksforgeeks.org/how-to-create-an-object-from-two-arrays-in-javascript/
    if (sortedvals.length > 0) failedObj = Object.assign(...sortedvals.map(k => ({ [k]: failedObj[k] })));

    return failedObj;
}