/*
 * File: handleCommentSkips.js
 * Project: steam-comment-service-bot
 * Created Date: 28.02.2022 12:22:48
 * Author: 3urobeat
 *
 * Last Modified: 26.04.2023 12:16:54
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot            = require("../../bot/bot.js"); // eslint-disable-line
const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


/**
 * Checks if the following comment process iteration should be skipped
 * Aborts comment process on critical error.
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {{ next: function, break: function }} loop Object returned by misc.js syncLoop() helper
 * @param {Bot} bot Bot object of the account posting this comment
 * @param {String} receiverSteamID64 steamID64 of the receiving user/group
 * @returns {Boolean} true if iteration should continue, false if iteration should be skipped using return
 */
module.exports.handleIterationSkip = (commandHandler, loop, bot, receiverSteamID64) => {
    let activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64]; // Make using the obj shorter

    // Check if comment process was aborted or activeReqEntry was deleted and stop loop
    if (!activeReqEntry || activeReqEntry.status == "aborted") {
        logger("debug", "CommandHandler handleIterationSkip(): Request was aborted or deleted, breaking comment loop...");

        // Add failed entry for all skipped iterations only if request was aborted
        if (activeReqEntry.status == "aborted") {
            for (let i = activeReqEntry.thisIteration; i < activeReqEntry.amount; i++) { // Iterate over all remaining comments by starting with thisIteration till numberOfComments
                let thisbot = commandHandler.controller.bots[activeReqEntry.accounts[i % activeReqEntry.accounts.length]];

                activeReqEntry.failed[`c${i + 1} b${thisbot.index} p${thisbot.loginData.proxyIndex}`] = "Skipped because comment process was aborted";
            }
        }

        // Sort failed object to make it easier to read
        activeReqEntry.failed = sortFailedCommentsObject(activeReqEntry.failed);

        // Break the loop and return false. No need to update status as it was already set to aborted
        loop.break();
        return false;
    }

    // Check if all proxies have failed and break loop by checking if all remaining comments have been declared as failed if we are not on the last iteration
    if (Object.values(activeReqEntry.failed).filter(e => e.toLowerCase().includes("http error 429")).length + activeReqEntry.thisIteration + 1 >= activeReqEntry.amount && activeReqEntry.thisIteration + 1 != activeReqEntry.amount) {
        logger("debug", "CommandHandler handleIterationSkip(): All proxies failed, breaking comment loop...");

        // Sort failed object to make it easier to read
        activeReqEntry.failed = sortFailedCommentsObject(activeReqEntry.failed);

        // Update status to error
        activeReqEntry.status = "error";

        // Break the loop and return false
        loop.break();
        return false;
    }

    // Check if this iteration would use a blocked proxy by checking for existing failed obj entry for this iteration
    if (activeReqEntry.failed[`c${activeReqEntry.thisIteration + 1} b${bot.index} p${bot.loginData.proxyIndex}`]) {
        logger("debug", "CommandHandler handleIterationSkip(): Iteration would use a failed proxy, skipping...");
        loop.next();
        return false;
    }

    // If nothing above terminated the function then return true to let the comment loop continue
    return true;
};


/**
 * Adds a description to comment errors and applies additional cooldowns for certain errors
 * @param {String} error The error string returned by steam-user
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {Bot} bot Bot object of the account posting this comment
 * @param {String} receiverSteamID64 steamID64 of the receiving user/group
 */
module.exports.logCommentError = (error, commandHandler, bot, receiverSteamID64) => {
    let activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64]; // Make using the obj shorter
    let description    = "";


    // Add description to errors to make it easier to understand for users. Add extra cooldown for certain errors
    switch (error.toLowerCase()) {
        case "error: http error 429":
            description = "This IP has commented too often recently and has been blocked by Steam for a few minutes. Please wait a moment and then try again.";

            // Add 5 minutes of extra cooldown to all bot accounts that are also using this proxy by adding them to the accounts list of this request
            activeReqEntry.accounts = activeReqEntry.accounts.concat(Object.keys(commandHandler.controller.bots).filter(e => commandHandler.controller.bots[e].loginData.proxyIndex == bot.loginData.proxyIndex && !activeReqEntry.accounts.includes(e))); // Append all accounts with the same proxy which aren't included yet
            activeReqEntry.until += 300000; // Add 5 minutes of cooldown

            // Add failed obj entry for all iterations that would use this proxy
            logger("warn", "Skipping all other comments on this proxy as well because they will fail too!");

            for (let i = activeReqEntry.thisIteration + 1; i < activeReqEntry.amount; i++) { // Iterate over all remaining comments by starting with next iteration till numberOfComments
                let thisbot = commandHandler.controller.bots[activeReqEntry.accounts[i % activeReqEntry.accounts.length]];

                // Add to failed obj if proxies match
                if (thisbot.loginData.proxyIndex == bot.loginData.proxyIndex) {
                    activeReqEntry.failed[`c${i + 1} b${thisbot.index} p${thisbot.loginData.proxyIndex}`] = "Skipped because of previous HTTP error 429 on this IP";
                }
            }
            break;
        case "error: http error 502":
            description = "The steam servers seem to have a problem/are down. Check Steam's status here: https://steamstat.us";
            break;
        case "error: http error 504":
            description = "The steam servers are slow atm/are down. Check Steam's status here: https://steamstat.us";
            break;
        case "error: you've been posting too frequently, and can't make another post right now":
            description = "This account has commented too often recently and has been blocked by Steam for a few minutes. Please wait a moment and then try again.";

            activeReqEntry.until += 300000; // Add 5 minutes of cooldown
            break;
        case "error: there was a problem posting your comment. please try again":
            description = "Unknown reason - please wait a minute and try again.";
            break;
        case "error: the settings on this account do not allow you to add comments":
            description = "The profile's comment section is private, the account doesn't meet steams regulations or has a cooldown. Try again later and maybe add bot account as friend.";
            break;
        case "error: to post this comment, your account must have steam guard enabled":
            description = "The account trying to comment doesn't seem to have steam guard enabled.";
            break;
        case "error: socket hang up":
            description = "The steam servers seem to have a problem/are down. Check Steam's status here: https://steamstat.us";
            break;
        default:
            description = "Please wait a moment and try again!";
    }


    // Add proxy information if one was used for this account
    let proxiesDescription = "";
    if (commandHandler.data.proxies.length > 1) proxiesDescription = ` using proxy ${this.loginData.proxyIndex}`;


    // Log error, add it to failed obj and continue with next iteration
    logger("error", `[${bot.logPrefix}] Error posting comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} to ${receiverSteamID64}${proxiesDescription}: ${error}`);

    activeReqEntry.failed[`c${activeReqEntry.thisIteration + 1} b${bot.index} p${bot.loginData.proxyIndex}`] = `${error} [${description}]`;


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