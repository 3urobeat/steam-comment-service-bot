/*
 * File: comment.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 06.05.2023 13:46:11
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line
const { getCommentArgs }                       = require("../helpers/getCommentArgs.js");
const { getAvailableBotsForCommenting }        = require("../helpers/getCommentBots.js");
const { syncLoop, timeToString }               = require("../../controller/helpers/misc.js");
const { logCommentError, handleIterationSkip } = require("../helpers/handleCommentSkips.js");


module.exports.comment = {
    names: ["comment", "gcomment", "groupcomment"],
    description: "",
    ownersOnly: false,

    /**
     * The comment command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        let requesterSteamID64 = steamID64;
        let receiverSteamID64  = requesterSteamID64;
        let ownercheck         = commandHandler.data.cachefile.ownerid.includes(requesterSteamID64);


        /* --------- Check for disabled comment cmd or if update is queued --------- */
        if (commandHandler.controller.info.readyAfter == 0)             return respond(commandHandler.data.lang.botnotready);         // Bot isn't fully started yet
        if (commandHandler.data.advancedconfig.disableCommentCmd)       return respond(commandHandler.data.lang.botmaintenance);      // Bot is set to maintenance mode
        if (commandHandler.controller.info.activeLogin)                 return respond(commandHandler.data.lang.commentactiverelog);  // Bot is waiting for relog
        if (commandHandler.data.config.maxComments == 0 && !ownercheck) return respond(commandHandler.data.lang.commentcmdowneronly); // Comment command is restricted to owners only


        /* --------- Calculate maxRequestAmount and get arguments from comment request --------- */
        let { maxRequestAmount, numberOfComments, profileID, idType, quotesArr } = await getCommentArgs(commandHandler, args, requesterSteamID64, respond);

        if (!maxRequestAmount && !numberOfComments && !quotesArr) return; // Looks like the helper aborted the request


        // Update receiverSteamID64 if profileID was returned
        if (profileID && profileID != requesterSteamID64) {
            logger("debug", "Custom profileID provided that is != requesterSteamID64, modifying steamID object...");

            receiverSteamID64 = profileID; // Update receiverSteamID64
        }


        // Check if user is already receiving comments right now
        let activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64];

        if (activeReqEntry && activeReqEntry.status == "active" && activeReqEntry.type == "profileComment") return respond(commandHandler.data.lang.commentuseralreadyreceiving);


        // Check if user has cooldown
        let { until, untilStr } = await commandHandler.data.getUserCooldown(requesterSteamID64);

        if (until > Date.now()) return respond(commandHandler.data.lang.commentuseroncooldown.replace("remainingcooldown", untilStr));


        // Get all currently available bot accounts. Only allow limited accounts for profile comments by only passing true when idType is equal to INDIVIDUAL
        let allowLimitedAccounts = (idType == SteamID.Type.INDIVIDUAL);
        let { accsNeeded, availableAccounts, accsToAdd, whenAvailableStr } = getAvailableBotsForCommenting(commandHandler, numberOfComments, allowLimitedAccounts, receiverSteamID64);

        if (availableAccounts.length - accsToAdd < accsNeeded && accsToAdd.length == 0 && !whenAvailableStr) { // Check if this bot has no suitable accounts for this request and there won't be any available at any point
            if (!allowLimitedAccounts) respond(commandHandler.data.lang.commentnounlimitedaccs); // Send less generic message for requests which require unlimited accounts
                else respond(commandHandler.data.lang.commentnoaccounts);

            return;
        }

        if (availableAccounts.length - accsToAdd.length < accsNeeded && !whenAvailableStr) { // Check if user needs to add accounts first. Make sure the lack of accounts is caused by accsToAdd, not cooldown
            let addStr = commandHandler.data.lang.commentaddbotaccounts;
            accsToAdd.forEach(e => addStr += `\n' steamcommunity.com/profiles/${commandHandler.data.cachefile.botaccid[commandHandler.controller.getBots(null, true)[e].index]} '`);

            logger("info", `Found enough available accounts but user needs to add ${accsToAdd.length} limited accounts first before I'm able to comment.`);

            respond(addStr);
            return;
        }

        if (availableAccounts.length < accsNeeded) { // Check if not enough available accounts were found because of cooldown
            if (availableAccounts.length > 0) respond(commandHandler.data.lang.commentnotenoughavailableaccs.replace("waittime", whenAvailableStr).replace("availablenow", availableAccounts.length)); // Using allAccounts.length works for the "spread requests on as many accounts as possible" method
                else respond(commandHandler.data.lang.commentzeroavailableaccs.replace("waittime", whenAvailableStr));

            logger("info", `Found only ${availableAccounts.length} available account(s) but ${accsNeeded} account(s) are needed to send ${numberOfComments} comments.`);
            return;
        }


        /* --------- Check if profile is private if idType is INDIVIDUAL ---------  */
        let activeRequestsObj = {
            status: "active",
            type: idType == SteamID.Type.INDIVIDUAL ? "profileComment" : "groupComment",
            amount: numberOfComments,
            quotesArr: quotesArr,
            requestedby: requesterSteamID64,
            accounts: availableAccounts,
            thisIteration: -1, // Set to -1 so that first iteration will increase it to 0
            retryAttempt: 0,
            amountBeforeRetry: 0, // Saves the amount of requested comments before the most recent retry attempt was made to send a correct finished message
            until: Date.now() + ((numberOfComments - 1) * commandHandler.data.config.commentdelay), // Calculate estimated wait time (first comment is instant -> remove 1 from numberOfComments)
            failed: {}
        };

        if (idType == SteamID.Type.INDIVIDUAL) {
            commandHandler.controller.main.community.getSteamUser(new SteamID(receiverSteamID64), (err, user) => {
                if (err) {
                    logger("warn", `[Main] Failed to check if ${steamID64} is private: ${err}\n       Trying to comment anyway and hoping no error occurs...`); // This can happen sometimes and most of the times commenting will still work
                } else {
                    logger("debug", "Successfully checked privacyState of receiving user: " + user.privacyState);

                    if (user.privacyState != "public") return respond(commandHandler.data.lang.commentuserprofileprivate); // Only check if getting the Steam user's data didn't result in an error
                }

                // Register this comment process in activeRequests
                commandHandler.controller.activeRequests[receiverSteamID64] = activeRequestsObj;

                // Start commenting
                logger("debug", "Made activeRequest entry for user, starting comment loop...");
                comment(commandHandler, respond, receiverSteamID64);
            });
        } else {
            // Register this comment process in activeRequests
            commandHandler.controller.activeRequests[receiverSteamID64] = activeRequestsObj;

            // Start commenting
            logger("debug", "Made activeRequest entry for user, starting comment loop...");
            comment(commandHandler, respond, receiverSteamID64);
        }
    }
};


/**
 * Internal: Do the actual commenting, activeRequests entry with all relevant information was processed by the comment command function above.
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {function(string)} respond Shortened respondModule call
 * @param {String} receiverSteamID64 steamID64 of the profile to receive the comments
 */
function comment(commandHandler, respond, receiverSteamID64) {
    let activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64]; // Make using the obj shorter

    // Comment numberOfComments times using our syncLoop helper
    syncLoop(activeReqEntry.amount - (activeReqEntry.thisIteration + 1), (loop, i) => { // eslint-disable-line no-unused-vars

        setTimeout(async () => {

            /* --------- Get the correct account for this iteration and update iteration in activeRequests obj --------- */
            let bot = commandHandler.controller.getBots(null, true)[activeReqEntry.accounts[i % activeReqEntry.accounts.length]]; // Iteration modulo amount of accounts gives us index of account to use inside the accounts array. This returns the bot account name which we can lookup in the bots object.
            activeReqEntry.thisIteration++;


            /* --------- Check for critical errors and decide if this iteration should still run --------- */
            if (!handleIterationSkip(commandHandler, loop, bot, receiverSteamID64)) return; // Skip iteration if false was returned


            /* --------- Try to comment --------- */
            let postComment = activeReqEntry.type == "profileComment" ? bot.community.postUserComment : bot.community.postGroupComment; // Get the correct comment function for this type
            let quote       = await commandHandler.data.getQuote(activeReqEntry.quotesArr);                                             // Get a random quote to comment with

            postComment.call(bot.community, receiverSteamID64, quote, (error) => { // Very important! Using call() and passing the bot's community instance will keep context (this.) as it was lost by our postComment variable assignment! SteamUser will break without this.

                /* --------- Handle errors thrown by this comment attempt --------- */
                if (error) logCommentError(error, commandHandler, bot, receiverSteamID64);


                /* --------- No error, run this on every successful iteration --------- */
                let whereStr = activeReqEntry.type == "profileComment" ? `on profile ${receiverSteamID64}` : `in group ${receiverSteamID64}`; // Shortcut to convey more precise information in the 4 log messages below

                if (activeReqEntry.thisIteration == 0) { // Stuff below should only run in first iteration
                    if (commandHandler.data.proxies.length > 1) logger("info", `${logger.colors.fggreen}[${bot.logPrefix}] ${activeReqEntry.amount} Comment(s) requested. Comment ${whereStr} with proxy ${bot.loginData.proxyIndex}: ${String(quote).split("\n")[0]}`);
                        else logger("info", `${logger.colors.fggreen}[${bot.logPrefix}] ${activeReqEntry.amount} Comment(s) requested. Comment ${whereStr}: ${String(quote).split("\n")[0]}`); // Splitting \n to only get first line of multi line comments


                    // Only send estimated wait time message for multiple comments
                    if (activeReqEntry.amount > 1) {
                        let waitTime = timeToString(Date.now() + ((activeReqEntry.amount - 1) * commandHandler.data.config.commentdelay)); // Amoung - 1 because the first comment is instant. Multiply by delay and add to current time to get timestamp when last comment was sent
                        respond(commandHandler.data.lang.commentprocessstarted.replace("numberOfComments", activeReqEntry.amount).replace("waittime", waitTime));
                    }


                    // Give requesting user cooldown
                    commandHandler.data.setUserCooldown(activeReqEntry.requestedby, activeReqEntry.until);

                } else { // Stuff below should run for every iteration that is not the first one

                    if (!error) {
                        if (commandHandler.data.proxies.length > 1) logger("info", `[${bot.logPrefix}] Comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} ${whereStr} with proxy ${bot.loginData.proxyIndex}: ${String(quote).split("\n")[0]}`);
                            else logger("info", `[${bot.logPrefix}] Comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} ${whereStr}: ${String(quote).split("\n")[0]}`); // Splitting \n to only get first line of multi line comments
                    }
                }


                // Continue with the next iteration
                loop.next();

            });

        }, commandHandler.data.config.commentdelay * (i > 0)); // Delay every comment that is not the first one

    }, () => { // Function that will run on exit, aka the last iteration: Respond to the user

        // Handle singular comments with a different message
        if (activeReqEntry.amount == 1) {
            // Check if an error occurred
            if (Object.keys(activeReqEntry.failed).length > 0) respond(`${commandHandler.data.lang.commenterroroccurred}\n${Object.values(activeReqEntry.failed)[0]}`); // TODO: Do I want to handle retryComments for singular comments?
                else respond(commandHandler.data.lang.commentsuccess1);

            // Instantly set status of this request to cooldown
            activeReqEntry.status = "cooldown";
            commandHandler.controller.info.commentCounter += 1;

            return;
        }


        /* --------- Retry comments if enabled. Skip aborted requests and when max retries are exceeded ---------  */
        if (commandHandler.data.advancedconfig.retryFailedComments && Object.keys(activeReqEntry.failed).length > 0 && activeReqEntry.status != "aborted" && activeReqEntry.retryAttempt < commandHandler.data.advancedconfig.retryFailedCommentsAttempts) {
            activeReqEntry.status        = "active";                  // Keep status alive so that !abort still works
            activeReqEntry.thisIteration = activeReqEntry.amount - 1; // Set thisIteration to last iteration so that the comment function won't get confused
            activeReqEntry.retryAttempt++;

            // Log and notify user about retry attempt starting in retryFailedCommentsDelay ms
            let untilStr = timeToString(Date.now() + commandHandler.data.advancedconfig.retryFailedCommentsDelay);

            respond(commandHandler.data.lang.commentretrying.replace("failedamount", Object.keys(activeReqEntry.failed).length).replace("numberOfComments", activeReqEntry.amount - activeReqEntry.amountBeforeRetry).replace("untilStr", untilStr).replace("thisattempt", activeReqEntry.retryAttempt).replace("maxattempt", commandHandler.data.advancedconfig.retryFailedCommentsAttempts));
            logger("info", `${Object.keys(activeReqEntry.failed).length}/${activeReqEntry.amount - activeReqEntry.amountBeforeRetry} comments failed for ${receiverSteamID64}. Retrying in ${untilStr} (Attempt ${activeReqEntry.retryAttempt}/${commandHandler.data.advancedconfig.retryFailedCommentsAttempts})`, false, false, logger.animation("waiting"));

            // Wait retryFailedCommentsDelay ms before retrying failed comments
            setTimeout(() => {
                // Check if comment process was aborted, send finished message and avoid increasing cooldown etc.
                if (!activeReqEntry || activeReqEntry.status == "aborted") {
                    respond(commandHandler.data.lang.commentaborted.replace("successAmount", "0").replace("numberOfComments", Object.keys(activeReqEntry.failed).length));
                    logger("info", `Comment process for ${receiverSteamID64} was aborted while waiting for retry attempt ${activeReqEntry.retryAttempt}. Stopping...`);
                    return;
                }

                // Store amountBeforeRetry and increase numberOfComments by amount of failed comments
                activeReqEntry.amountBeforeRetry = activeReqEntry.amount;
                activeReqEntry.amount += Object.keys(activeReqEntry.failed).length;

                // Increase until value (amount of retried comments * commentdelay) + delay before starting retry attempts
                activeReqEntry.until = activeReqEntry.until + (Object.keys(activeReqEntry.failed).length * commandHandler.data.config.commentdelay) + commandHandler.data.advancedconfig.retryFailedCommentsDelay;

                // Update cooldown to new extended until value
                commandHandler.data.setUserCooldown(activeReqEntry.requestedby, activeReqEntry.until);

                // Reset failed comments
                activeReqEntry.failed = {};

                // Call comment function again
                comment(commandHandler, respond, receiverSteamID64);
            }, commandHandler.data.advancedconfig.retryFailedCommentsDelay);

            return;
        }


        if (commandHandler.data.advancedconfig.retryFailedComments) logger("debug", "retryComments: Looks like all retryAttempts have been made or no comments failed. Sending finished message...");
            else logger("debug", "retryComments: retryFailedComments is disabled. Sending finished message...");


        /* ------------- Send finished message for each status -------------  */
        if (activeReqEntry.status == "aborted") {

            respond(commandHandler.data.lang.commentaborted.replace("successAmount", activeReqEntry.amount - activeReqEntry.amountBeforeRetry - Object.keys(activeReqEntry.failed).length).replace("numberOfComments", activeReqEntry.amount - activeReqEntry.amountBeforeRetry));

        } else if (activeReqEntry.status == "error") {

            respond(`${commandHandler.data.lang.comment429stop.replace("failedamount", Object.keys(activeReqEntry.failed).length).replace("numberOfComments", activeReqEntry.amount - activeReqEntry.amountBeforeRetry)}\n\n${commandHandler.data.lang.commentfailedcmdreference}`); // Add !failed cmd reference to message
            logger("warn", "Stopped comment process because all proxies had a HTTP 429 (IP cooldown) error!");

        } else {

            // Add reference to !failed command to finished message if at least one comment failed
            let failedcmdreference = "";

            if (Object.keys(commandHandler.controller.activeRequests[receiverSteamID64].failed).length > 0) {
                failedcmdreference = "\nTo get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems";
            }

            // Send finished message
            respond(`${commandHandler.data.lang.commentsuccess2.replace("failedamount", Object.keys(activeReqEntry.failed).length).replace("numberOfComments", activeReqEntry.amount - activeReqEntry.amountBeforeRetry)}\n${failedcmdreference}`); // Only send if not a webrequest

            // Set status of this request to cooldown and add amount of successful comments to our global commentCounter
            activeReqEntry.status = "cooldown";

        }

        commandHandler.controller.info.commentCounter += activeReqEntry.amount - activeReqEntry.amountBeforeRetry - Object.keys(activeReqEntry.failed).length; // Add numberOfComments of this attempt minus failedamount to commentCounter

    });
}