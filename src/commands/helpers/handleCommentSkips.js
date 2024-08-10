/*
 * File: handleCommentSkips.js
 * Project: steam-comment-service-bot
 * Created Date: 2022-02-28 12:22:48
 * Author: 3urobeat
 *
 * Last Modified: 2024-08-10 22:42:13
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot            = require("../../bot/bot.js");
const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


/**
 * Helper function to sort failed object by comment number so that it is easier to read
 * @param {object} failedObj Current state of failed object
 */
function sortFailedCommentsObject(failedObj) {
    const sortedvals = Object.keys(failedObj).sort((a, b) => {
        return Number(a.split(" ")[0].replace("i", "")) - Number(b.split(" ")[0].replace("i", ""));
    });

    // Map sortedvals back to object if array is not empty - Credit: https://www.geeksforgeeks.org/how-to-create-an-object-from-two-arrays-in-javascript/
    if (sortedvals.length > 0) failedObj = Object.assign(...sortedvals.map(k => ({ [k]: failedObj[k] })));

    return failedObj;
}


/**
 * Checks if the following comment process iteration should be skipped
 * Aborts comment process on critical error.
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {{ next: function(): void, break: function(): void, index: function(): number }} loop Object returned by misc.js syncLoop() helper
 * @param {Bot} bot Bot object of the account posting this comment
 * @param {string} receiverSteamID64 steamID64 of the receiving user/group
 * @returns {boolean} true if iteration should continue, false if iteration should be skipped using return
 */
module.exports.handleIterationSkip = (commandHandler, loop, bot, receiverSteamID64) => {
    const activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64]; // Make using the obj shorter

    // Check if no bot account was found
    if (!bot) {
        activeReqEntry.failed[`i${activeReqEntry.thisIteration + 1} b? p?`] = "Skipped because bot account does not exist";

        logger("error", `[Bot ?] Error posting comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} to ${receiverSteamID64}: Bot account '${activeReqEntry.accounts[loop.index() % activeReqEntry.accounts.length]}' does not exist?! Skipping...`);
        loop.next();
        return false;
    }

    // Check if bot account is offline
    if (bot.status != Bot.EStatus.ONLINE) {
        activeReqEntry.failed[`i${activeReqEntry.thisIteration + 1} b${bot.index} p${bot.loginData.proxyIndex}`] = "Skipped because bot account is offline";

        logger("error", `[${bot.logPrefix}] Error posting comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} to ${receiverSteamID64}: Skipped because bot account is offline`);
        loop.next();
        return false;
    }

    // Check if comment process was aborted or activeReqEntry was deleted and stop loop
    if (!activeReqEntry || !activeReqEntry.failed || activeReqEntry.status == "aborted") {
        logger("debug", "CommandHandler handleIterationSkip(): Request was aborted or deleted, breaking comment loop...");

        // Add failed entry for all skipped iterations only if request was aborted
        if (activeReqEntry.status == "aborted") {
            for (let i = activeReqEntry.thisIteration; i < activeReqEntry.amount; i++) { // Iterate over all remaining comments by starting with thisIteration till numberOfComments
                const thisbot = commandHandler.controller.getBots("*", true)[activeReqEntry.accounts[i % activeReqEntry.accounts.length]];

                activeReqEntry.failed[`i${i + 1} b${thisbot.index} p${thisbot.loginData.proxyIndex}`] = "Skipped because comment process was aborted";
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
    if (activeReqEntry.failed[`i${activeReqEntry.thisIteration + 1} b${bot.index} p${bot.loginData.proxyIndex}`]) {
        logger("debug", "CommandHandler handleIterationSkip(): Iteration would use a failed proxy, skipping...");
        loop.next();
        return false;
    }

    // If nothing above terminated the function then return true to let the comment loop continue
    return true;
};


/**
 * Adds a description to comment errors and applies additional cooldowns for certain errors
 * @param {string} error The error string returned by steamcommunity
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {Bot} bot Bot object of the account posting this comment
 * @param {string} receiverSteamID64 steamID64 of the receiving user/group
 */
module.exports.logCommentError = (error, commandHandler, bot, receiverSteamID64) => {
    const activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64]; // Make using the obj shorter
    let description    = "";


    // Add description to errors to make it easier to understand for users. Add extra cooldown for certain errors
    switch (String(error).toLowerCase()) {
        case "error: http error 429":
            description = "This IP has commented too often recently. Please wait a few minutes and try again";

            // Add 5 minutes of extra cooldown to all bot accounts that are also using this proxy by adding them to the accounts list of this request
            activeReqEntry.accounts = activeReqEntry.accounts.concat(Object.keys(commandHandler.controller.getBots(null, true)).filter(e => commandHandler.controller.getBots(null, true)[e].loginData.proxyIndex == bot.loginData.proxyIndex && !activeReqEntry.accounts.includes(e))); // Append all accounts with the same proxy which aren't included yet

            if (activeReqEntry.ipCooldownPenaltyAdded === false) {  // Explicitly check for false to avoid triggering on undefined
                activeReqEntry.until += 300000;                     // Add 5 minutes of cooldown
                activeReqEntry.ipCooldownPenaltyAdded = true;
                logger("debug", `${logger.colors.fgred}IP cooldown error detected${logger.colors.reset} - Increased until value of this request by 5 minutes`);
            }

            // Add failed obj entry for all iterations that would use this proxy
            logger("warn", "Skipping all other comments on this proxy as well because they will fail too!");

            for (let i = activeReqEntry.thisIteration + 1; i < activeReqEntry.amount; i++) { // Iterate over all remaining comments by starting with next iteration till numberOfComments
                const thisbot = commandHandler.controller.getBots(null, true)[activeReqEntry.accounts[i % activeReqEntry.accounts.length]];

                // Add to failed obj if proxies match
                if (thisbot.loginData.proxyIndex == bot.loginData.proxyIndex) {
                    activeReqEntry.failed[`i${i + 1} b${thisbot.index} p${thisbot.loginData.proxyIndex}`] = "Skipped because of previous HTTP error 429 on this IP";
                }
            }
            break;
        case "error: http error 502":
            description = "The Steam servers seem to have a problem. Check the status here: https://steamstat.us";
            break;
        case "error: http error 504":
            description = "The Steam servers seem to have a problem. Check the status here: https://steamstat.us";
            break;
        case "error: you've been posting too frequently, and can't make another post right now":
            description = "This account has commented too often recently. Please wait a few minutes and try again";

            if (activeReqEntry.ipCooldownPenaltyAdded === false) {  // Explicitly check for false to avoid triggering on undefined
                activeReqEntry.until += 300000;                     // Add 5 minutes of cooldown
                activeReqEntry.ipCooldownPenaltyAdded = true;
                logger("debug", `${logger.colors.fgred}IP cooldown error detected${logger.colors.reset} - Increased until value of this request by 5 minutes`);
            }
            break;
        case "error: there was a problem posting your comment. please try again":
            description = "Unknown reason. Please wait a few minutes and try again";
            break;
        case "error: the settings on this account do not allow you to add comments":
            description = "Cooldown, private profile or bot account does not meet Steam's regulations. Try again later and add bot account as friend, if not done already";
            break;
        case "error: to post this comment, your account must have steam guard enabled":
            description = "The bot account does not have Steam Guard enabled";
            break;
        case "error: socket hang up":
            description = "The Steam servers seem to have a problem. Check the status here: https://steamstat.us";
            break;
        default:
            description = "Please wait a few minutes and try again!";
    }


    // Add proxy information if one was used for this account
    let proxiesDescription = "";
    if (commandHandler.data.proxies.length > 1) proxiesDescription = ` using proxy ${bot.loginData.proxyIndex}`;


    // Log error, add it to failed obj and continue with next iteration
    logger("error", `[${bot.logPrefix}] Error posting comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} to ${receiverSteamID64}${proxiesDescription}: ${error}`);

    activeReqEntry.failed[`i${activeReqEntry.thisIteration + 1} b${bot.index} p${bot.loginData.proxyIndex}`] = `${error} [${description}]`;


    // Sort failed object to make it easier to read
    activeReqEntry.failed = sortFailedCommentsObject(activeReqEntry.failed);
};


/**
 * Groups same error messages together, counts amount, lists affected bots and converts it to a String.
 * @param {object} obj failedcomments object that should be converted
 * @returns {string} String that looks like this: `amount`x - `indices`\n`error message`
 */
module.exports.failedCommentsObjToString = (obj) => {
    // Count amount of each string
    const grouped = {};

    Object.keys(obj).forEach((e) => {
        const err = obj[e];

        // Check if entry for this err msg already exists and increment amount
        if (Object.keys(grouped).includes(err)) {
            grouped[err].amount++; // Increment amount
            grouped[err].bots += ", " + e; // Add request key (comment index, bot index & proxy index)

        } else { // ...or add new entry

            grouped[err] = {
                amount: 1,
                bots: e
            };
        }

    });

    // Sort object descending
    const sortedArr = Object.values(grouped).sort((a, b) => {
        return b.amount - a.amount;
    });

    // Construct return string
    let str = "";

    sortedArr.forEach((e) => {
        str += `${e.amount}x - ${e.bots}\n${Object.keys(grouped)[Object.values(grouped).indexOf(e)]}\n\n`;
    });

    // Return string and remove trailing newline
    return str.trim();
};
