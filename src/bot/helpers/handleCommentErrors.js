/*
 * File: handleCommentErrors.js
 * Project: steam-comment-service-bot
 * Created Date: 28.02.2022 12:22:48
 * Author: 3urobeat
 *
 * Last Modified: 16.10.2022 12:35:06
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
const loginfile  = require("../../controller/login.js");
const mainfile   = require("../main.js");


/**
 * Handles critical comment process errors and aborts process if necessary   (both checks are designed to run through every failed iteration)
 * @param {Number} botindex The used bot account
 * @param {String} methodName postUserComment or postGroupComment
 * @param {SteamID} receiverSteamID The steamID object of the receiving user
 * @param {Array} alreadySkippedProxies Array of already skipped proxies
 * @param {Number} numberOfComments The number of requested comments
 * @param {*} res The res parameter if request is coming from the webserver, otherwise null
 * @param {Object} lang The language object
 * @param {Function} respond The function to send messages to the requesting user
 * @returns {Object} skipIteration, alreadySkippedProxies
 */
module.exports.handleCriticalCommentErrors = (botindex, methodName, receiverSteamID, alreadySkippedProxies, numberOfComments, res, lang, respond) => {

    var acpEntry = mainfile.activecommentprocess[receiverSteamID]; // Make using the obj shorter

    // TODO: Rewrite to push all remaining comments at once and break loop
    // Check if profile is not anymore in mainfile.activecommentprocess obj or status is not active anymore (for example by using !abort)
    if (!acpEntry || acpEntry.status == "aborted") {
        mainfile.failedcomments[receiverSteamID][`c${acpEntry.thisIteration + 1} bot${botindex} p${loginfile.additionalaccinfo[botindex].thisproxyindex}`] = "Skipped because user aborted comment process."; // Push reason to mainfile.failedcomments obj

        logger("debug", "handleCriticalCommentErrors(): Skipping iteration because user aborted comment process");

        return { skipIteration: true, alreadySkippedProxies };
    }


    // Regex pattern doesn't easily allow variables in pattern so I'm doing this ugly thing for now
    if (methodName == "postUserComment") {
        var regexPattern1 = /postUserComment error: Error: HTTP error 429.*\n.*/gm; // Thanks: https://stackoverflow.com/a/49277142
    } else {
        var regexPattern1 = /postGroupComment error: Error: HTTP error 429.*\n.*/gm;
    }


    // Skip comments on failed proxies
    var thisproxy     = loginfile.additionalaccinfo[botindex].thisproxyindex;
    var failedProxies = [];

    Object.keys(mainfile.failedcomments[receiverSteamID]).forEach((e) => {
        let affectedproxy = Number(e.split(" ")[2].replace("p", "")); // Get the index of the affected proxy from the String

        // Check if this entry matches a HTTP 429 error
        if (regexPattern1.test(mainfile.failedcomments[receiverSteamID][e])) {
            if (!failedProxies.includes(affectedproxy)) failedProxies.push(affectedproxy); // Push proxy index to array if it isn't included yet
        }
    });


    // Push all comments that would be made by an account with an affected proxy to failedcomments
    if (failedProxies.includes(thisproxy)) {
        if (!alreadySkippedProxies.includes(thisproxy)) { // Only push if this proxy doesn't have a "skipped because of previous http 429 error" entry already
            logger("warn", `HTTP 429 error on proxy ${thisproxy} detected. Skipping all other comments on this proxy because they will fail too!`);

            if (!alreadySkippedProxies.includes(thisproxy)) alreadySkippedProxies.push(thisproxy);


            // Push all other comments by accounts with an affected proxy to failedcomments
            var m = 0;

            for (var l = 1; l <= numberOfComments; l++) { // Start with l = 1 because of reasons
                if (m + 1 > Object.keys(controller.communityobject).length) { // Reset variable tracking communityobject index if it is greater than the amount of accounts
                    m = 0;
                }

                if (l > acpEntry.thisIteration && loginfile.additionalaccinfo[m].thisproxyindex == thisproxy) { // Only push if we arrived at an iteration that uses a failed proxy and has not been sent already
                    mainfile.failedcomments[receiverSteamID][`c${l} bot${m} p${thisproxy}`] = `${methodName} error: Skipped because of previous HTTP 429 error.`; // Push reason to mainfile.failedcomments obj
                }

                m++;
            }


            // Sort failedcomments by comment number so that it is easier to read
            let sortedvals = Object.keys(mainfile.failedcomments[receiverSteamID]).sort((a, b) => {
                return Number(a.split(" ")[0].replace("c", "")) - Number(b.split(" ")[0].replace("c", ""));
            });

            if (sortedvals.length > 0) mainfile.failedcomments[receiverSteamID] = Object.assign(...sortedvals.map(botindex => ( {[botindex]: mainfile.failedcomments[receiverSteamID][botindex] } ) )); // Map sortedvals back to object if array is not empty - credit: https://www.geeksforgeeks.org/how-to-create-an-object-from-two-arrays-in-javascript/


            // Send message to user if all proxies failed
            if (failedProxies.length == loginfile.proxies.length) {
                respond(500, `${lang.comment429stop.replace("failedamount", numberOfComments - acpEntry.thisIteration + 1).replace("numberOfComments", numberOfComments)}\n\n${lang.commentfailedcmdreference}`); // Add !failed cmd reference to message
                logger("warn", "Stopped comment process because all proxies had a HTTP 429 (IP cooldown) error!");

                acpEntry.status = "error"; // Update status in activecommentprocess obj
                mainfile.commentcounter += numberOfComments - (numberOfComments - acpEntry.thisIteration + 1); // Add numberOfComments minus failedamount to commentcounter
            }
        }


        // Send finished message from here if this is the last iteration and it is on a failed proxy
        if (acpEntry.thisIteration == numberOfComments - 1)  {

            // Only send message if that hasn't been done above already by the all proxies failed check
            if (!res && failedProxies.length != loginfile.proxies.length) {
                respond(200, `${lang.commentsuccess2.replace("failedamount", Object.keys(mainfile.failedcomments[receiverSteamID]).length).replace("numberOfComments", numberOfComments)}\n\nTo get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems`); // Only send if not a webrequest
            }

            acpEntry.status = "cooldown";
            mainfile.commentcounter += numberOfComments - Object.keys(mainfile.failedcomments[receiverSteamID]).length; // Add numberOfComments minus failedamount to commentcounter
        }

        // Log debug msg
        logger("debug", "handleCriticalCommentErrors(): Skipping this iteration...");

        return { skipIteration: true, alreadySkippedProxies }; // Skip this iteration
    }


    // Return values
    return { skipIteration: false, alreadySkippedProxies };
};


/**
 * Adds a description to comment errors and applies additional cooldowns for certain errors
 * @param {String} error The error message
 * @param {Number} botindex The used bot account
 * @param {String} methodName postUserComment or postGroupComment
 * @param {SteamID} receiverSteamID The steamID object of the receiving user
 * @param {Number} numberOfComments The number of requested comments
 */
module.exports.handleCommentErrors = (error, botindex, methodName, receiverSteamID, numberOfComments) => {
    if (botindex == 0) var thisbot = "Main"; // Call bot 0 the main bot in logging messages
        else var thisbot = `Bot ${botindex}`;


    var acpEntry  = mainfile.activecommentprocess[receiverSteamID]; // Make using the obj shorter
    var thisproxy = loginfile.additionalaccinfo[botindex].thisproxyindex;
    var errordesc = "";


    // Add description to errors to make it easier to understand for users. Add extra cooldown for certain errors
    switch (error) {
        case "Error: HTTP error 429":
            errordesc = "This account has commented too often recently and has been blocked by Steam for a few minutes.\nPlease wait a moment and then try again.";

            // Add 5 minutes of extra cooldown to all bot accounts that are also using this proxy
            acpEntry.accounts = acpEntry.accounts.concat(Object.keys(loginfile.additionalaccinfo).filter(e => loginfile.additionalaccinfo[e].thisproxyindex == thisproxy && !acpEntry.accounts.includes(e)));
            acpEntry.until = Date.now() + 300000; // Now + 5 min

            break;
        case "Error: HTTP Error 502":
            errordesc = "The steam servers seem to have a problem/are down. Check Steam's status here: https://steamstat.us";
            break;
        case "Error: HTTP Error 504":
            errordesc = "The steam servers are slow atm/are down. Check Steam's status here: https://steamstat.us";
            break;
        case "Error: You've been posting too frequently, and can't make another post right now":
            errordesc = "This account has commented too often recently and has been blocked by Steam for a few minutes.\nPlease wait a moment and then try again.";

            acpEntry.until = Date.now() + 300000; // Add 5 minutes to cooldown of accounts used in this request
            break;
        case "Error: There was a problem posting your comment. Please try again":
            errordesc = "Unknown reason - please wait a minute and try again.";
            break;
        case "Error: The settings on this account do not allow you to add comments":
            errordesc = "The profile's comment section is private, the account doesn't meet steams regulations or has a cooldown. Try again later and maybe add bot account as friend.";
            break;
        case "Error: To post this comment, your account must have Steam Guard enabled":
            errordesc = "The account trying to comment doesn't seem to have steam guard enabled.";
            break;
        case "Error: socket hang up":
            errordesc = "The steam servers seem to have a problem/are down. Check Steam's status here: https://steamstat.us";
            break;
        default:
            errordesc = "Please wait a moment and try again!";
    }


    // Log error and continue with next iteration (if this is a critical error then handleCriticalCommentErrors() above will take action)
    if (loginfile.proxies.length > 1) {
        logger("error", `[${thisbot}] ${methodName} ${acpEntry.thisIteration + 1}/${numberOfComments} error (using proxy ${loginfile.additionalaccinfo[botindex].thisproxyindex}): ${error}\nRequest info - noc: ${numberOfComments} - accs: ${Object.keys(controller.botobject).length} - delay: ${config.commentdelay} - receiver: ${receiverSteamID}`);

        mainfile.failedcomments[receiverSteamID][`c${acpEntry.thisIteration + 1} bot${botindex} p${loginfile.additionalaccinfo[botindex].thisproxyindex}`] = `${methodName} error: ${error} [${errordesc}]`;
    } else {
        logger("error", `[${thisbot}] ${methodName} ${acpEntry.thisIteration + 1}/${numberOfComments} error: ${error}\nRequest info - noc: ${numberOfComments} - accs: ${Object.keys(controller.botobject).length} - delay: ${config.commentdelay} - receiver: ${receiverSteamID}`);

        mainfile.failedcomments[receiverSteamID][`c${acpEntry.thisIteration + 1} bot${botindex} p${loginfile.additionalaccinfo[botindex].thisproxyindex}`] = `${methodName} error: ${error} [${errordesc}]`;
    }

};