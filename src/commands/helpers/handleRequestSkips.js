/*
 * File: handleRequestSkips.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-10-07 18:05:37
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 18:27:30
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../../bot/bot.js");


/**
 * Helper function to sort failed object by number so that it is easier to read
 * @private
 * @param {object} failedObj Current state of failed object
 */
function _sortFailedObject(failedObj) {
    const sortedvals = Object.keys(failedObj).sort((a, b) => {
        return Number(a.split(" ")[0].replace("i", "")) - Number(b.split(" ")[0].replace("i", ""));
    });

    // Map sortedvals back to object if array is not empty - Credit: https://www.geeksforgeeks.org/how-to-create-an-object-from-two-arrays-in-javascript/
    if (sortedvals.length > 0) failedObj = Object.assign(...sortedvals.map(k => ({ [k]: failedObj[k] })));

    return failedObj;
}


/**
 * Checks if the following request process iteration should be skipped
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {{ next: function(): void, break: function(): void, index: function(): number }} loop Object returned by syncLoop() to control request loop
 * @param {Bot} bot Bot object of the account fulfilling this interaction
 * @param {string} receiverSteamID64 steamID64 of the receiving user/group
 * @returns {boolean} true if iteration should continue, false if iteration should be skipped using return
 */
module.exports.handleIterationSkip = (commandHandler, loop, bot, receiverSteamID64) => {
    const activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64]; // Make using the obj shorter

    // Check if no bot account was found
    if (!bot) {
        activeReqEntry.failed[`i${activeReqEntry.thisIteration + 1} b? p?`] = "Skipped because bot account does not exist";

        logger("error", `[Bot ?] Error on interaction ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} for '${receiverSteamID64}': Bot account '${activeReqEntry.accounts[loop.index() % activeReqEntry.accounts.length]}' does not exist?! Skipping...`);
        loop.next();
        return false;
    }

    // Check if bot account is offline
    if (bot.status != Bot.EStatus.ONLINE) {
        activeReqEntry.failed[`i${activeReqEntry.thisIteration + 1} b${bot.index} p${bot.loginData.proxyIndex}`] = "Skipped because bot account is offline";

        logger("error", `[${bot.logPrefix}] Error on interaction ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} for '${receiverSteamID64}': Skipped because bot account is offline`);
        loop.next();
        return false;
    }

    // Check if request was aborted or activeReqEntry was deleted and stop loop
    if (!activeReqEntry || !activeReqEntry.failed || activeReqEntry.status == "aborted") {
        logger("debug", "CommandHandler handleIterationSkip(): Request was aborted or deleted, breaking loop...");

        // Add failed entry for all skipped iterations only if request was aborted
        if (activeReqEntry.status == "aborted") {
            for (let i = activeReqEntry.thisIteration; i < activeReqEntry.amount; i++) { // Iterate over all remaining interactions by starting with thisIteration till amount
                const thisbot = commandHandler.controller.getBots("*", true)[activeReqEntry.accounts[i % activeReqEntry.accounts.length]];

                activeReqEntry.failed[`i${i + 1} b${thisbot.index} p${thisbot.loginData.proxyIndex}`] = "Skipped because request was aborted";
            }
        }

        // Sort failed object to make it easier to read
        activeReqEntry.failed = _sortFailedObject(activeReqEntry.failed);

        // Break the loop and return false. No need to update status as it was already set to aborted
        loop.break();
        return false;
    }

    // Check if all proxies have failed (log[...]Error() has pre-filled the failed array on IP cooldown) and break loop unless this is the last iteration
    const ipCooldownsAmount = Object.values(activeReqEntry.failed).filter((e) => e.toLowerCase().includes("http error 429")).length;

    if (ipCooldownsAmount >= activeReqEntry.amount && activeReqEntry.thisIteration + 1 != activeReqEntry.amount) {
        logger("warn", "Detected error for all remaining interactions, aborting request!");

        // Sort failed object to make it easier to read
        activeReqEntry.failed = _sortFailedObject(activeReqEntry.failed);

        // Update status to error
        activeReqEntry.status = "error";

        // Break the loop and return false
        loop.break();
        return false;
    }

    // Check if this iteration would use a blocked proxy by checking for existing failed obj entry for this iteration
    if (activeReqEntry.failed[`i${activeReqEntry.thisIteration + 1} b${bot.index} p${bot.loginData.proxyIndex}`]) {
        logger("debug", "CommandHandler handleIterationSkip(): Iteration would use a failed proxy, skipping...");
        loop.next();
        return false;
    }

    // If nothing above terminated the function then return true to let the request loop continue
    return true;
};
